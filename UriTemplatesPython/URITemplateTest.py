import sys
import json
import unittest

from URITemplate import URITemplate
from TimeUtil import TimeUtil

#
# @author jbf
class URITemplateTest(unittest.TestCase):
    @staticmethod
    def setUpClass():
        pass

    def setUp(self):
        pass

    # Test of makeCanonical method, of class URITemplate.
    def testMakeCanonical(self):
        print('# testMakeCanonical')
        formatString = '%{Y,m=02}*.dat'
        expResult = '$(Y;m=02)$x.dat'
        result = URITemplate.makeCanonical(formatString)
        self.assertEqual(expResult,result)

    @staticmethod
    def toStr(res):
        t1 = TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(res))[0:16]
        t2 = TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(res))[0:16]
        return t1 + '/' + t2

    @staticmethod
    def testTimeParser1(spec, test, norm):
        try:
            ut = URITemplate(spec)
        except Exception as ex: # J2J: exceptions
            sys.stderr.write('### unable to parse spec: ' + spec+'\n')
            return
        nn = norm.split('/')
        if TimeUtil.iso8601DurationPattern.matcher(nn[1]).matches():
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]),TimeUtil.parseISO8601Duration(nn[1])))
        start = TimeUtil.isoTimeToArray(nn[0])
        stop = TimeUtil.isoTimeToArray(nn[1])
        inorm = [0] * 14
        inorm[0:7]=start[0:7]
        inorm[7:7+7]=stop[0:7]
        try:
            res = ut.parse(test,{})
        except Exception as ex: # J2J: exceptions
            fail(ex.getMessage())
            return
        arrow = chr(8594)
        if res==inorm:
            print("%s:  \t\"%s\"%s\t\"%s\"" % (spec,test,arrow,URITemplateTest.toStr(res) ))
        else:
            print('### ranges do not match: ' + spec + ' ' + test + arrow + str(URITemplateTest.toStr(res)) + ', should be ' + norm)
        self.assertEqual(res,inorm)

    def testParse1(self):
        ut = URITemplate('$Y_sc$(enum;values=a,b,c,d;id=sc)')
        extra = {}
        digits = ut.parse('2003_scd',extra)
        actual = "%d %s" % (digits[0],extra['sc'] )
        self.assertEqual('2003 d',actual)
        print(actual)

    def testParse2(self):
        ut = URITemplate('$Y_$m_v$v.dat')
        extra = {}
        digits = ut.parse('2003_10_v20.3.dat',extra)
        self.assertEqual(2003,digits[0])
        self.assertEqual(10,digits[1])
        self.assertEqual(11,digits[8])
        self.assertEqual('20.3',extra['v'])

    def testParse3(self):
        ut = URITemplate('$Y$m$(d;delta=10;phasestart=1979-01-01)')
        extra = {}
        digits = ut.parse('19791227',extra)
        self.assertEqual(1980,digits[7])
        self.assertEqual(1,digits[8])
        self.assertEqual(6,digits[9])

    # Test of parse method, of class URITemplate.
    # @throws java.lang.Exception
    def testParse(self):
        print('# testParse')
        URITemplateTest.testTimeParser1('$(j;Y=2012).*.*.*.$H','017.x.y.z.02','2012-01-17T02:00:00/2012-01-17T03:00:00')
        self.testParse1()
        self.testParse2()
        self.testParse3()
        URITemplateTest.testTimeParser1('$Y $m $d $H $M','2012 03 30 16 20','2012-03-30T16:20/2012-03-30T16:21')
        URITemplateTest.testTimeParser1('$Y$m$d-$(enum;values=a,b,c,d)','20130202-a','2013-02-02/2013-02-03')
        URITemplateTest.testTimeParser1('$Y$m$d-$(Y;end)$m$d','20130202-20140303','2013-02-02/2014-03-03')
        URITemplateTest.testTimeParser1('$Y$m$d-$(Y;end)$m$(d;shift=1)','20200101-20200107','2020-01-01/2020-01-08')
        URITemplateTest.testTimeParser1('$Y$m$d-$(d;end)','20130202-13','2013-02-02/2013-02-13')
        URITemplateTest.testTimeParser1('$(periodic;offset=0;start=2000-001;period=P1D)','0','2000-001/P1D')
        URITemplateTest.testTimeParser1('$(periodic;offset=0;start=2000-001;period=P1D)','20','2000-021/P1D')
        URITemplateTest.testTimeParser1('$(periodic;offset=2285;start=2000-346;period=P27D)','1','1832-02-08/P27D')
        URITemplateTest.testTimeParser1('$(periodic;offset=2285;start=2000-346;period=P27D)','2286','2001-007/P27D')
        URITemplateTest.testTimeParser1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)','01702','2012-01-17T06:00/PT6H')
        URITemplateTest.testTimeParser1('$(j;Y=2012).$H$M$S.$(subsec;places=3)','017.020000.245','2012-01-17T02:00:00.245/2012-01-17T02:00:00.246')
        URITemplateTest.testTimeParser1('$(j;Y=2012).$x.$X.$(ignore).$H','017.x.y.z.02','2012-01-17T02:00:00/2012-01-17T03:00:00')
        URITemplateTest.testTimeParser1('$(j;Y=2012).*.*.*.$H','017.x.y.z.02','2012-01-17T02:00:00/2012-01-17T03:00:00')
        #testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        URITemplateTest.testTimeParser1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)','01702','2012-01-17T06:00/2012-01-17T12:00')
        URITemplateTest.testTimeParser1('$-1Y $-1m $-1d $H$M','2012 3 30 1620','2012-03-30T16:20/2012-03-30T16:21')
        URITemplateTest.testTimeParser1('$Y','2012','2012-01-01T00:00/2013-01-01T00:00')
        URITemplateTest.testTimeParser1('$Y-$j','2012-017','2012-01-17T00:00/2012-01-18T00:00')
        URITemplateTest.testTimeParser1('$(j,Y=2012)','017','2012-01-17T00:00/2012-01-18T00:00')
        URITemplateTest.testTimeParser1('ace_mag_$Y_$j_to_$(Y;end)_$j.cdf','ace_mag_2005_001_to_2005_003.cdf','2005-001T00:00/2005-003T00:00')

    # Use the spec, format the test time and verify that we get norm.
    # @param spec
    # @param test
    # @param norm
    # @throws Exception
    @staticmethod
    def testTimeFormat1(spec, test, norm):
        try:
            ut = URITemplate(spec)
        except Exception as ex: # J2J: exceptions
            print('### unable to parse spec: ' + spec)
            return
        nn = norm.split('/')
        if TimeUtil.iso8601DurationPattern.matcher(nn[1]).matches():
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]),TimeUtil.parseISO8601Duration(nn[1])))
        try:
            res = ut.format(nn[0],nn[1],{})
        except Exception as ex: # J2J: exceptions
            print('### ' + str(ex.getMessage()))
            return
        arrow = chr(8594)
        if res==test:
            print("%s:  \t\"%s\"%s\t\"%s\"" % (spec,norm,arrow,res ))
        else:
            print('### ranges do not match: ' + spec + ' ' + norm + arrow + res + ', should be ' + test)
        self.assertEqual(res,test)

    # Test of format method, of class URITemplate.
    # @throws java.lang.Exception
    def testFormat(self):
        print('# testFormat')
        #testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        URITemplateTest.testTimeFormat1('$Y$m$d-$(Y;end)$m$d','20130202-20140303','2013-02-02/2014-03-03')
        URITemplateTest.testTimeFormat1('_$Y$m$(d)_$(Y;end)$m$(d)','_20130202_20130203','2013-02-02/2013-02-03')
        URITemplateTest.testTimeFormat1('_$Y$m$(d;shift=1)_$(Y;end)$m$(d;shift=1)','_20130201_20130202','2013-02-02/2013-02-03')
        URITemplateTest.testTimeFormat1('$Y$m$d-$(Y;end)$m$(d;shift=1)','20200101-20200107','2020-01-01T00:00Z/2020-01-08T00:00Z')
        URITemplateTest.testTimeFormat1('$Y$m$d-$(d;end)','20130202-13','2013-02-02/2013-02-13')
        URITemplateTest.testTimeFormat1('$(periodic;offset=0;start=2000-001;period=P1D)','0','2000-001/P1D')
        URITemplateTest.testTimeFormat1('$(periodic;offset=0;start=2000-001;period=P1D)','20','2000-021/P1D')
        URITemplateTest.testTimeFormat1('$(periodic;offset=2285;start=2000-346;period=P27D)','1','1832-02-08/P27D')
        URITemplateTest.testTimeFormat1('$(periodic;offset=2285;start=2000-346;period=P27D)','2286','2001-007/P27D')
        URITemplateTest.testTimeFormat1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)','01702','2012-01-17T06:00/PT12H')
        URITemplateTest.testTimeFormat1('$(j;Y=2012).$H$M$S.$(subsec;places=3)','017.020000.245','2012-01-17T02:00:00.245/2012-01-17T02:00:00.246')
        URITemplateTest.testTimeFormat1('$(j;Y=2012).$x.$X.$(ignore).$H','017.x.y.z.02','2012-01-17T02:00:00/2012-01-17T03:00:00')
        #testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        URITemplateTest.testTimeFormat1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)','01702','2012-01-17T06:00/2012-01-17T18:00')
        URITemplateTest.testTimeFormat1('$-1Y $-1m $-1d $H$M','2012 3 30 1620','2012-03-30T16:20/2012-03-30T16:21')
        URITemplateTest.testTimeFormat1('$Y','2012','2012-01-01T00:00/2013-01-01T00:00')
        URITemplateTest.testTimeFormat1('$Y-$j','2012-017','2012-01-17T00:00/2012-01-18T00:00')
        URITemplateTest.testTimeFormat1('$(j,Y=2012)','017','2012-01-17T00:00/2012-01-18T00:00')
        URITemplateTest.testTimeFormat1('ace_mag_$Y_$j_to_$(Y;end)_$j.cdf','ace_mag_2005_001_to_2005_003.cdf','2005-001T00:00/2005-003T00:00')

    @staticmethod
    def readJSONToString(url):
        ins = None
        try:
            ins = url.openStream()
            sb = ""
            buffer = [0] * 2048
            bytesRead = ins.read(buffer)
            while bytesRead != -1:
                sb+= str(String(buffer,0,bytesRead))
                bytesRead = ins.read(buffer)
            return sb
        except Exception as ex: # J2J: exceptions
            raise Exception(ex)
        finally:
            try:
                if ins != None: ins.close()
            except Exception as ex: # J2J: exceptions
                #J2J (logger) Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE,None,ex)
                pass

    def testFormatHapiServerSiteOne(self, outputs, t, startTime, stopTime):
        testOutputs = URITemplate.formatRange(t,startTime,stopTime)
        if len(testOutputs) != len(outputs):
            fail('bad number of results in formatRange: ' + t)
        for l in range(0,len(outputs)):
            if not testOutputs[l]==outputs[l]:
                fail('result doesn\'t match, got ' + testOutputs[l] + ', should be ' + outputs[l])

    # for each timeRange and template in
    # https://github.com/hapi-server/uri-templates/blob/master/formatting.json
    # enumerate the files (formatRange) to see that we get the correct result.
    def testFormatHapiServerSite(self):
        try:
            print('# testFormatHapiServerSite')
            ss = URITemplateTest.readJSONToString('https://raw.githubusercontent.com/hapi-server/uri-templates/master/formatting.json')
            jo = json.loads(ss)
            for i in range(0,len(jo)):
                jo1 = jo[i]
                id = jo1['id']
                print("# %2d: %s %s" % (i, id, jo1['whatTests']))
                if i < 3:
                    print('###  Skipping test ' + str(i))
                    continue

                templates = jo1['template']
                outputs = jo1['output']
                timeRanges = jo1['timeRange']  # Note Python loose typing returns
                if type(timeRanges)==str:
                    timeRanges = [ timeRanges ]

                for j in range(len(templates)):
                    t = templates[j]
                    for k in range(len(timeRanges)):
                        timeRange = timeRanges[k]
                        print('timeRange:' + timeRange)
                        timeStartStop = timeRange.split('/')
                        try:
                            self.testFormatHapiServerSiteOne(outputs,t,timeStartStop[0],timeStartStop[1])
                        except Exception as ex: # J2J: exceptions
                            raise Exception(ex)
                    print('' + t)
        except Exception as ex: # J2J: exceptions
            #J2J (logger) Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE,None,ex)
            fail(ex.getLocalizedMessage())

    def testFormatRange(self):
        try:
            print('# testFormatRange')
            sys.stderr.write(URITemplate.VERSION+'\n')
            t = 'data_$Y.dat'
            ss = URITemplate.formatRange(t,'2001-03-22','2004-08-18')
            if len(ss) != 4:
                fail(t)
            t = 'http://emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf'
            #emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf";
            extra = {}
            extra['SC'] = 'A'
            extra['sc'] = 'a'
            extra['v'] = '1.5.15'
            ss = URITemplate.formatRange(t,'2017-07-01','2017-07-04',extra)
            for s in ss:
                print(s)
            ff = URITemplate.formatRange('$Y$m$(d,delta=10,phasestart=1979-01-01)','1979-01-01','1980-01-01')
            for f in ff:
                print(f)
        except Exception as ex: # J2J: exceptions
            fail(ex.getMessage())


if __name__ == '__main__':
    unittest.main()
