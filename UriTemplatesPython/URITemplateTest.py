import re
import sys
import json
from urllib.request import urlopen
import unittest

from URITemplate import URITemplate
from TimeUtil import TimeUtil

#
# @author jbf
class URITemplateTest(unittest.TestCase):
    # Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
    iso8601DurationPattern = re.compile('P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?')

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
    def fail(msg):
        print(msg)
        sys.exit(-1)
        
    def doTestTimeParser1(self, spec, test, norm, expectException):
        try:
            ut = URITemplate(spec)
        except Exception as ex:  # J2J: exceptions
            sys.stderr.write('### unable to parse spec: ' + spec+'\n')
            return
        nn = norm.split('/')
        if URITemplateTest.iso8601DurationPattern.match(nn[1]) != None:
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]), TimeUtil.parseISO8601Duration(nn[1])))
        start = TimeUtil.isoTimeToArray(nn[0])
        stop = TimeUtil.isoTimeToArray(nn[1])
        inorm = [0] * 14
        inorm[0:7]=start[0:7]
        inorm[7:7+7]=stop[0:7]
        try:
            res = ut.parse(test, {})
        except Exception as ex: # J2J: exceptions
            if expectException:
                raise ex
            else:
                fail(ex.getMessage())
                return
        arrow = chr(8594)
        if res == inorm:
            print('%s:  \t\"%s\"%s\t\"%s\"' % (spec, test, arrow, URITemplateTest.toStr(res)))
        else:
            raise Exception('ranges do not match: ' + spec + ' ' + test + '--> ' + URITemplateTest.toStr(res) + ', should be ' + norm)
        self.assertEqual(inorm,res)

    def dotestParse1(self):
        ut = URITemplate('$Y_sc$(enum;values=a,b,c,d;id=sc)')
        extra = {}
        digits = ut.parse('2003_scd', extra)
        actual = '%d %s' % (digits[0], extra['sc'])
        self.assertEqual('2003 d',actual)
        print(actual)

    def doTestParse2(self):
        ut = URITemplate('$Y_$m_v$v.dat')
        extra = {}
        digits = ut.parse('2003_10_v20.3.dat', extra)
        self.assertEqual(2003,digits[0])
        self.assertEqual(10,digits[1])
        self.assertEqual(11,digits[8])
        self.assertEqual('20.3',extra['v'])

    def doTestParse3(self):
        ut = URITemplate('$Y$m$(d;delta=10;phasestart=1979-01-01)')
        extra = {}
        digits = ut.parse('19791227', extra)
        self.assertEqual(1980,digits[7])
        self.assertEqual(1,digits[8])
        self.assertEqual(6,digits[9])

    def testDelimiterExceptionLeading(self):
        try:
            self.doTestTimeParser1('ac_$Y$j00-$(Y;end)$(j;end)00.gif', 'AC_199811900-199812000.gif', '1998-04-29T00:00Z/1998-04-30T00:00Z', True)
            raise Exception("should have thrown exception");
        except:
            print( 'threw exception as expected')

    def testDelimiterExceptionTrailing(self):
        try:
            self.doTestTimeParser1('ac_$Y$j00-$(Y;end)$(j;end)00.gif', 'ac_199811900-199812000-this-shouldnt-match.gif', '1998-04-29T00:00Z/1998-04-30T00:00Z', True)
            raise Exception("should have thrown exception");
        except:
            print('threw exception as expected')

    # Test of parse method, of class URITemplate.
    # @throws java.lang.Exception
    def testParse(self):
        print('# testParse')
        self.doTestTimeParser1('data_$Y_$j_$(Y;end)_$(j;shift=1;phasestart=2009-001).dat', 'data_2009_001_2009_002.dat', '2009-01-01/2009-01-03T00:00Z', False)
        self.doTestTimeParser1('$Y$(j;div=100)XX', '20243XX', '2024-10-26T00:00Z/2025-01-01T00:00Z', False)
        self.doTestTimeParser1('$Y$(j;div=100)XX/$j', '20243XX/365', '2024-12-30T00:00Z/2024-12-31T00:00Z', False)
        self.doTestTimeParser1('$(j;Y=2012).*.*.*.$H', '017.x.y.z.02', '2012-01-17T02:00:00/2012-01-17T03:00:00', False)
        self.dotestParse1()
        self.doTestParse2()
        self.doTestParse3()
        self.doTestTimeParser1('$(j;Y=2012).$H$M$S.$N', '017.020000.245000000', '2012-01-17T02:00:00.245000000/2012-01-17T02:00:00.245000001', False)
        self.doTestTimeParser1('$(j;Y=2012).$H$M$S.$(N;div=1000000)', '017.020000.245', '2012-01-17T02:00:00.245/2012-01-17T02:00:00.246', False)
        self.doTestTimeParser1('$(j;Y=2012).$H$M$S.$(N;div=1E6)', '017.020000.245', '2012-01-17T02:00:00.245/2012-01-17T02:00:00.246', False)
        self.doTestTimeParser1('ac27_crn$x_$Y$j00-$(Y;end)$(j;end)00.gif', 'ac27_crn1926_199722300-199725000.gif', '1997-223T00:00/1997-250T00:00', False)
        self.doTestTimeParser1('$Y $m $d $H $M', '2012 03 30 16 20', '2012-03-30T16:20/2012-03-30T16:21', False)
        self.doTestTimeParser1('$Y$m$d-$(enum;values=a,b,c,d)', '20130202-a', '2013-02-02/2013-02-03', False)
        self.doTestTimeParser1('$Y$m$d-$(Y;end)$m$d', '20130202-20140303', '2013-02-02/2014-03-03', False)
        self.doTestTimeParser1('$Y$m$d-$(Y;end)$m$(d;shift=1)', '20200101-20200107', '2020-01-01/2020-01-08', False)
        self.doTestTimeParser1('$Y$m$d-$(d;end)', '20130202-13', '2013-02-02/2013-02-13', False)
        self.doTestTimeParser1('$(periodic;offset=0;start=2000-001;period=P1D)', '0', '2000-001/P1D', False)
        self.doTestTimeParser1('$(periodic;offset=0;start=2000-001;period=P1D)', '20', '2000-021/P1D', False)
        self.doTestTimeParser1('$(periodic;offset=2285;start=2000-346;period=P27D)', '1', '1832-02-08/P27D', False)
        self.doTestTimeParser1('$(periodic;offset=2285;start=2000-346;period=P27D)', '2286', '2001-007/P27D', False)
        self.doTestTimeParser1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)', '01702', '2012-01-17T06:00/PT6H', False)
        self.doTestTimeParser1('$(j;Y=2012).$H$M$S.$(subsec;places=3)', '017.020000.245', '2012-01-17T02:00:00.245/2012-01-17T02:00:00.246', False)
        #This should not parse: doTestTimeParser1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        self.doTestTimeParser1('$(j;Y=2012).*.*.*.$H', '017.x.y.z.02', '2012-01-17T02:00:00/2012-01-17T03:00:00', False)
        #testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z"); 
        self.doTestTimeParser1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)', '01702', '2012-01-17T06:00/2012-01-17T12:00', False)
        self.doTestTimeParser1('$-1Y $-1m $-1d $H$M', '2012 3 30 1620', '2012-03-30T16:20/2012-03-30T16:21', False)
        self.doTestTimeParser1('$Y', '2012', '2012-01-01T00:00/2013-01-01T00:00', False)
        self.doTestTimeParser1('$Y-$j', '2012-017', '2012-01-17T00:00/2012-01-18T00:00', False)
        self.doTestTimeParser1('$(j,Y=2012)', '017', '2012-01-17T00:00/2012-01-18T00:00', False)
        self.doTestTimeParser1('ace_mag_$Y_$j_to_$(Y;end)_$j.cdf', 'ace_mag_2005_001_to_2005_003.cdf', '2005-001T00:00/2005-003T00:00', False)
        self.doTestTimeParser1('$y $(m;pad=none) $(d;pad=none) $(H;pad=none)', '99 1 3 0', '1999-01-03T00:00/1999-01-03T01:00', False)
        self.doTestTimeParser1('$y $j ($(m;pad=none) $(d;pad=none)) $H', '99 003 (1 3) 00', '1999-01-03T00:00/1999-01-03T01:00', False)
        self.doTestTimeParser1('/gif/ac_$Y$j$H-$(Y;end)$j$H.gif', '/gif/ac_199733000-199733100.gif', '1997-11-26T00:00Z/1997-11-27T00:00Z', False)
        self.doTestTimeParser1('$Y_$(b;case=uc;fmt=full)_$d_$v', '2000_NOVEMBER_23_00', '2000-11-23T00:00Z/2000-11-24T00:00Z', False)
        self.doTestTimeParser1('$(y;start=2000)', '72', '2072-01-01T00:00Z/2073-01-01T00:00Z', False)
        self.doTestTimeParser1('$(y;start=1958)', '72', '1972-01-01T00:00Z/1973-01-01T00:00Z', False)
        self.doTestTimeParser1('$(y;start=1958)', '57', '2057-01-01T00:00Z/2058-01-01T00:00Z', False)

    def testFloorDiv(self):
        self.assertEqual(URITemplate.floorDiv(0, 7),0)
        self.assertEqual(URITemplate.floorDiv(1, 7),0)
        self.assertEqual(URITemplate.floorDiv(7, 7),1)
        self.assertEqual(URITemplate.floorDiv(-1, 7),-1)
        self.assertEqual(URITemplate.floorDiv(-7, 7),-1)
        self.assertEqual(URITemplate.floorDiv(-8, 7),-2)

    # Use the spec, format the test time and verify that we get norm.
    # @param spec
    # @param test
    # @param norm
    # @throws Exception 
    def doTestTimeFormat1(self, spec, test, norm):
        try:
            ut = URITemplate(spec)
        except Exception as ex:  # J2J: exceptions
            print('### unable to parse spec: ' + spec)
            fail('unable to parse spec: ' + spec)
            return
        nn = norm.split('/')
        if URITemplateTest.iso8601DurationPattern.match(nn[1]) != None:
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]), TimeUtil.parseISO8601Duration(nn[1])))
        try:
            res = ut.format(nn[0], nn[1], {})
        except Exception as ex:  # J2J: exceptions
            print('### ' + str(ex.getMessage()))
            raise ex
        arrow = chr(8594)
        if res == test:
            print('%s:  \t\"%s\"%s\t\"%s\"' % (spec, norm, arrow, res))
        else:
            print('### ranges do not match: ' + spec + ' ' + norm + arrow + res + ', should be ' + test)
        self.assertEqual(res,test)

    def testFormatMonth(self):
        #System.err.println( ut.format("2024-02-01T00:00Z","2024-03-01T00:00Z") );
        self.doTestTimeFormat1('$(b)', 'feb', '2024-02-01/2024-03-01')
        self.doTestTimeFormat1('$(b;case=lc)', 'feb', '2024-02-01/2024-03-01')
        self.doTestTimeFormat1('$(b;fmt=full)', 'february', '2024-02-01/2024-03-01')
        self.doTestTimeFormat1('$(b;fmt=full;case=uc)', 'FEBRUARY', '2024-02-01/2024-03-01')
        self.doTestTimeFormat1('$(b;fmt=full;case=cap) $(d;pad=none), $Y', 'February 2, 2022', '2022-02-02/2022-02-03')

    def testFormatX(self):
        t = URITemplate('/tmp/ap/$(x;name=sc;len=6;pad=_).dat')
        e = { 'sc':'Apple' }
        self.assertEqual('/tmp/ap/_Apple.dat',t.format('2000-01-01', '2000-01-02', e))

    def testParseX(self):
        t = URITemplate('/tmp/ap/$Y_$(x;name=sc;len=6;pad=_).dat')
        e = {}
        r = t.parse('/tmp/ap/2024__Apple.dat', e)
        self.assertEqual([2024, 1, 1, 0, 0, 0, 0, 2025, 1, 1, 0, 0, 0, 0],r)

    def testParseX2(self):
        t = URITemplate('http://example.com/data/$Y/$Y_$m_$d/$(x;name=d5)/fa_k0_dcf_$x_$(x;name=mm).gif')
        #example.com/data/$Y/$Y_$m_$d/$(x;name=d5)/fa_k0_dcf_$x_$(x;name=mm).gif");
        e = {}
        r = t.parse('http://example.com/data/2008/2008_03_04/46565/fa_k0_dcf_46565_in.gif', e)
        #example.com/data/2008/2008_03_04/46565/fa_k0_dcf_46565_in.gif", e );
        self.assertEqual([2008, 3, 4, 0, 0, 0, 0, 2008, 3, 5, 0, 0, 0, 0],r)
        self.assertEqual('46565',e['d5'])
        self.assertEqual('in',e['mm'])

    # Test of format method, of class URITemplate.
    # @throws java.lang.Exception
    def testFormat(self):
        print('# testFormat')
        #testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        self.doTestTimeFormat1('/gif/ac_$Y$j$H-$(Y;end)$j$H.gif', '/gif/ac_199733000-199733100.gif', '1997-11-26T00:00Z/1997-11-27T00:00Z')
        self.doTestTimeFormat1('$Y/$Y$(j;div=100)XX/$Y$j.dat', '2024/20241XX/2024187.dat', '2024-07-05/P1D')
        self.doTestTimeFormat1('$(j;Y=2024).$H$M$S.$(N;div=1000000)', '017.020000.245', '2024-01-17T02:00:00.245/2024-01-17T02:00:00.246')
        self.doTestTimeFormat1('$Y$m$d-$(Y;end)$m$d', '20130202-20140303', '2013-02-02/2014-03-03')
        self.doTestTimeFormat1('_$Y$m$(d)_$(Y;end)$m$(d)', '_20130202_20130203', '2013-02-02/2013-02-03')
        self.doTestTimeFormat1('_$Y$m$(d;shift=1)_$(Y;end)$m$(d;shift=1)', '_20130201_20130202', '2013-02-02/2013-02-03')
        self.doTestTimeFormat1('$Y$m$d-$(Y;end)$m$(d;shift=1)', '20200101-20200107', '2020-01-01T00:00Z/2020-01-08T00:00Z')
        self.doTestTimeFormat1('$Y$m$d-$(d;end)', '20130202-13', '2013-02-02/2013-02-13')
        self.doTestTimeFormat1('$(periodic;offset=0;start=2000-001;period=P1D)', '0', '2000-001/P1D')
        self.doTestTimeFormat1('$(periodic;offset=0;start=2000-001;period=P1D)', '20', '2000-021/P1D')
        self.doTestTimeFormat1('$(periodic;offset=2285;start=2000-346;period=P27D)', '1', '1832-02-08/P27D')
        self.doTestTimeFormat1('$(periodic;offset=2285;start=2000-346;period=P27D)', '2286', '2001-007/P27D')
        self.doTestTimeFormat1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)', '01702', '2012-01-17T06:00/PT12H')
        self.doTestTimeFormat1('$(j;Y=2012).$H$M$S.$(subsec;places=3)', '017.020000.245', '2012-01-17T02:00:00.245/2012-01-17T02:00:00.246')
        #testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        self.doTestTimeFormat1('$(j;Y=2012)$(hrinterval;names=01,02,03,04)', '01702', '2012-01-17T06:00/2012-01-17T18:00')
        self.doTestTimeFormat1('$-1Y $-1m $-1d $H$M', '2012 3 30 1620', '2012-03-30T16:20/2012-03-30T16:21')
        self.doTestTimeFormat1('$Y', '2012', '2012-01-01T00:00/2013-01-01T00:00')
        self.doTestTimeFormat1('$Y-$j', '2012-017', '2012-01-17T00:00/2012-01-18T00:00')
        self.doTestTimeFormat1('$(j,Y=2012)', '017', '2012-01-17T00:00/2012-01-18T00:00')
        self.doTestTimeFormat1('ace_mag_$Y_$j_to_$(Y;end)_$j.cdf', 'ace_mag_2005_001_to_2005_003.cdf', '2005-001T00:00/2005-003T00:00')
        ut = URITemplate('$Y$m$d-$(Y;end)$m$d')
        ut.formatTimeRange([2013, 2, 2, 0, 0, 0, 0, 2014, 3, 3, 0, 0, 0, 0], {})
        ut.formatStartStopRange([2013, 2, 2, 0, 0, 0, 0], [2014, 3, 3, 0, 0, 0, 0], {})

    @staticmethod
    def readJSONToString(url):
        response = urlopen(url)
        return response.read()

    def doTestFormatHapiServerSiteOne(self, outputs, t, startTime, stopTime):
        testOutputs = URITemplate.formatRange(t, startTime, stopTime)
        if len(testOutputs) != len(outputs):
            fail('bad number of results in formatRange: ' + t)
        for l in range(0, len(outputs)):
            if not testOutputs[l] == outputs[l]:
                fail('result doesn\'t match, got ' + testOutputs[l] + ', should be ' + outputs[l])

    # for each timeRange and template in 
    # https://github.com/hapi-server/uri-templates/blob/master/formatting.json
    # enumerate the files (formatRange) to see that we get the correct result.
    def testFormatHapiServerSite(self):
        try:
            print('# testFormatHapiServerSite')
            ss = URITemplateTest.readJSONToString('https://raw.githubusercontent.com/hapi-server/uri-templates/master/formatting.json')
            jo = json.loads(ss)
            for i in range(0, len(jo)):
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
                            self.doTestFormatHapiServerSiteOne(outputs, t, timeStartStop[0], timeStartStop[1])
                        except Exception as ex:  # J2J: exceptions
                            fail(ex.getMessage())
                    print('' + t)
        except Exception as ex:  # J2J: exceptions
            # J2J (logger) Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE, None, ex)
            fail(ex.getMessage())

    def testFormatRange(self):
        try:
            print('# testFormatRange')
            t = 'data_$Y.dat'
            ss = URITemplate.formatRange(t, '2001-03-22', '2004-08-18')
            if len(ss) != 4:
                fail(t)
            t = 'http://emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf'
            #emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf";
            extra = {}
            extra['SC'] = 'A'
            extra['sc'] = 'a'
            extra['v'] = '1.5.15'
            ss = URITemplate.formatRange(t, '2017-07-01', '2017-07-04', extra)
            for s in ss:
                print(s)
            ff = URITemplate.formatRange('$Y$m$(d,delta=10,phasestart=1979-01-01)', '1979-01-01', '1980-01-01')
            for f in ff:
                print(f)
        except Exception as ex:  # J2J: exceptions
            fail(ex.getMessage())

    def testMakeQualifiersCanonical(self):
        x = '(x,name=sc,enum=a|b)'
        if not '(x;name=sc;enum=a|b)' == URITemplate.makeQualifiersCanonical(x):
            fail(x)
        x = '$(subsec,places=4)'
        if not '$(subsec;places=4)' == URITemplate.makeQualifiersCanonical(x):
            fail(x)
        #}
        x = '$(hrinterval;names=01,02,03,04)'
        if not '$(hrinterval;names=01,02,03,04)' == URITemplate.makeQualifiersCanonical(x):
            fail(x)
        x = '$(d,delta=10,phasestart=1979-01-01)'
        if not '$(d;delta=10;phasestart=1979-01-01)' == URITemplate.makeQualifiersCanonical(x):
            fail(x)


if __name__ == '__main__':
    unittest.main()
