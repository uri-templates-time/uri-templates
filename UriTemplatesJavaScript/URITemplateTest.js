function arraycopy( srcPts, srcOff, dstPts, dstOff, size) {  // private
    if (srcPts !== dstPts || dstOff >= srcOff + size) {
        while (--size >= 0)
            dstPts[dstOff++] = srcPts[srcOff++];
    }
    else {
        var tmp = srcPts.slice(srcOff, srcOff + size);
        for (var i = 0; i < size; i++)
            dstPts[dstOff++] = tmp[i];
    } 
}// import sprintf.js

// cheesy unittest temporary
function assertEquals(a,b) {
     if ( a!==b ) throw 'a!==b : ' + a + ' !== ' + b;
}
function assertArrayEquals(a,b) {
    if ( a.length===b.length ) {
        for ( i=0; i < a.length; i++ ) {
            if ( a[i]!==b[i] ) throw 'a['+i+']!==b['+i+'] : ' +a[i] + ' !== ' + b[i];
        }
    } else {
        throw 'array lengths differ';
    }
}
function fail(msg) {
    console.log(msg);
    throw 'fail: '+msg;
}                

/**
 *
 * @author jbf
 */
class URITemplateTest {
    /**
     * Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
     */
    static iso8601DurationPattern = new RegExp("P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?");

    /**
     * Test of makeCanonical method, of class URITemplate.
     */
    testMakeCanonical() {
        console.info("# testMakeCanonical");
        var formatString = "%{Y,m=02}*.dat";
        var expResult = "$(Y;m=02)$x.dat";
        var result = URITemplate.makeCanonical(formatString);
        assertEquals(expResult, result);
    }

    static toStr(res) {
        var t1 = TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(res)).substring(0, 16);
        var t2 = TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(res)).substring(0, 16);
        return t1 + "/" + t2;
    }

    doTestTimeParser1(spec, test, norm) {
        var ut;
        try {
            ut = new URITemplate(spec);
        } catch (ex) {
            console.error("### unable to parse spec: " + spec);
            return;
        }
        var nn = norm.split("/");
        if (URITemplateTest.iso8601DurationPattern.exec(nn[1])!=null) {
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]), TimeUtil.parseISO8601Duration(nn[1])));
        }
        var start = TimeUtil.isoTimeToArray(nn[0]);
        var stop = TimeUtil.isoTimeToArray(nn[1]);
        var inorm = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        arraycopy( start, 0, inorm, 0, 7 );
        arraycopy( stop, 0, inorm, 7, 7 );
        var res;
        try {
            res = ut.parse(test, new Map());
        } catch (ex) {
            fail(ex.getMessage());
            return;
        }
        var arrow = String.fromCharCode( 8594 );
        if (res==inorm) {
            console.info(sprintf("%s:  \t\"%s\"%s\t\"%s\"",spec, test, arrow, URITemplateTest.toStr(res)));
        } else {
            console.info("### ranges do not match: " + spec + " " + test + arrow + URITemplateTest.toStr(res) + ", should be " + norm);
        }
        assertArrayEquals(res, inorm);
    }

    dotestParse1() {
        var ut = new URITemplate("$Y_sc$(enum;values=a,b,c,d;id=sc)");
        var extra = new Map();
        var digits = ut.parse("2003_scd", extra);
        var actual = sprintf("%d %s",digits[0], extra.get("sc"));
        assertEquals("2003 d", actual);
        console.info(actual);
    }

    doTestParse2() {
        var ut = new URITemplate("$Y_$m_v$v.dat");
        var extra = new Map();
        var digits = ut.parse("2003_10_v20.3.dat", extra);
        assertEquals(2003, digits[0]);
        assertEquals(10, digits[1]);
        assertEquals(11, digits[8]);
        assertEquals("20.3", extra.get("v"));
    }

    doTestParse3() {
        var ut = new URITemplate("$Y$m$(d;delta=10;phasestart=1979-01-01)");
        var extra = new Map();
        var digits = ut.parse("19791227", extra);
        assertEquals(1980, digits[7]);
        assertEquals(1, digits[8]);
        assertEquals(6, digits[9]);
    }

    /**
     * Test of parse method, of class URITemplate.
     * @throws java.lang.Exception
     */
    testParse() {
        console.info("# testParse");
        this.doTestTimeParser1("$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        this.dotestParse1();
        this.doTestParse2();
        this.doTestParse3();
        this.doTestTimeParser1("$Y $m $d $H $M", "2012 03 30 16 20", "2012-03-30T16:20/2012-03-30T16:21");
        this.doTestTimeParser1("$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03");
        this.doTestTimeParser1("$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03");
        this.doTestTimeParser1("$Y$m$d-$(Y;end)$m$(d;shift=1)", "20200101-20200107", "2020-01-01/2020-01-08");
        this.doTestTimeParser1("$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13");
        this.doTestTimeParser1("$(periodic;offset=0;start=2000-001;period=P1D)", "0", "2000-001/P1D");
        this.doTestTimeParser1("$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");
        this.doTestTimeParser1("$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        this.doTestTimeParser1("$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");
        this.doTestTimeParser1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT6H");
        this.doTestTimeParser1("$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        this.doTestTimeParser1("$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        this.doTestTimeParser1("$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z"); 
        this.doTestTimeParser1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T12:00");
        this.doTestTimeParser1("$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21");
        this.doTestTimeParser1("$Y", "2012", "2012-01-01T00:00/2013-01-01T00:00");
        this.doTestTimeParser1("$Y-$j", "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeParser1("$(j,Y=2012)", "017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeParser1("ace_mag_$Y_$j_to_$(Y;end)_$j.cdf", "ace_mag_2005_001_to_2005_003.cdf", "2005-001T00:00/2005-003T00:00");
    }

    /**
     * Use the spec, format the test time and verify that we get norm.
     * @param spec
     * @param test
     * @param norm
     * @throws Exception 
     */
    doTestTimeFormat1(spec, test, norm) {
        var ut;
        try {
            ut = new URITemplate(spec);
        } catch (ex) {
            console.info("### unable to parse spec: " + spec);
            return;
        }
        var nn = norm.split("/");
        if (URITemplateTest.iso8601DurationPattern.exec(nn[1])!=null) {
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]), TimeUtil.parseISO8601Duration(nn[1])));
        }
        var res;
        try {
            res = ut.format(nn[0], nn[1], new Map());
        } catch (ex) {
            console.info("### " + (ex.getMessage()));
            return;
        }
        var arrow = String.fromCharCode( 8594 );
        if (res==test) {
            console.info(sprintf("%s:  \t\"%s\"%s\t\"%s\"",spec, norm, arrow, res));
        } else {
            console.info("### ranges do not match: " + spec + " " + norm + arrow + res + ", should be " + test);
        }
        assertEquals(res, test);
    }

    /**
     * Test of format method, of class URITemplate.
     * @throws java.lang.Exception
     */
    testFormat() {
        console.info("# testFormat");
        //testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        this.doTestTimeFormat1("$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03");
        this.doTestTimeFormat1("_$Y$m$(d)_$(Y;end)$m$(d)", "_20130202_20130203", "2013-02-02/2013-02-03");
        this.doTestTimeFormat1("_$Y$m$(d;shift=1)_$(Y;end)$m$(d;shift=1)", "_20130201_20130202", "2013-02-02/2013-02-03");
        this.doTestTimeFormat1("$Y$m$d-$(Y;end)$m$(d;shift=1)", "20200101-20200107", "2020-01-01T00:00Z/2020-01-08T00:00Z");
        this.doTestTimeFormat1("$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13");
        this.doTestTimeFormat1("$(periodic;offset=0;start=2000-001;period=P1D)", "0", "2000-001/P1D");
        this.doTestTimeFormat1("$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");
        this.doTestTimeFormat1("$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        this.doTestTimeFormat1("$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");
        this.doTestTimeFormat1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT12H");
        this.doTestTimeFormat1("$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        this.doTestTimeFormat1("$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        this.doTestTimeFormat1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T18:00");
        this.doTestTimeFormat1("$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21");
        this.doTestTimeFormat1("$Y", "2012", "2012-01-01T00:00/2013-01-01T00:00");
        this.doTestTimeFormat1("$Y-$j", "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeFormat1("$(j,Y=2012)", "017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeFormat1("ace_mag_$Y_$j_to_$(Y;end)_$j.cdf", "ace_mag_2005_001_to_2005_003.cdf", "2005-001T00:00/2005-003T00:00");
    }

    static readJSONToString(url) {
        var ins = null;
        try {
            ins = url.openStream();
            var sb = "";
            var buffer = [];
            var bytesRead = ins.read(buffer);
            while (bytesRead !== -1) {
                sb+= String(new String(buffer, 0, bytesRead));
                bytesRead = ins.read(buffer);
            }
            return sb;
        } catch (ex) {
            throw ex;
        }
        if (ins !== null) ins.close();
    }

    doTestFormatHapiServerSiteOne(outputs, t, startTime, stopTime) {
        var testOutputs = URITemplate.formatRange(t, startTime, stopTime);
        if (testOutputs.length !== outputs.length) {
            fail("bad number of results in formatRange: " + t);
        }
        for ( var l = 0; l < outputs.length; l++) {
            if (!testOutputs[l]==outputs[l]) {
                fail("result doesn't match, got " + testOutputs[l] + ", should be " + outputs[l]);
            }
        }
    }

    /**
     * for each timeRange and template in 
     * https://github.com/hapi-server/uri-templates/blob/master/formatting.json
     * enumerate the files (formatRange) to see that we get the correct result.
     */
    testFormatHapiServerSite() {
        try {
            console.info("# testFormatHapiServerSite");
            var ss = URITemplateTest.readJSONToString(new URL("https://raw.githubusercontent.com/hapi-server/uri-templates/master/formatting.json"));
            //String ss= readJSONToString( new URL( "file:/home/jbf/ct/git/uri-templates/formatting.json" ) );
            var jo = new JSONArray(ss);
            for ( var i = 0; i < jo.length(); i++) {
                var jo1 = jo.getJSONObject(i);
                var id = jo1.getString("id");
                console.info(sprintf("# %2d: %s %s",i, id, jo1.get("whatTests")));
                if (i < 3) {
                    console.info("###  Skipping test " + i);
                    continue
                }
                var templates = jo1.getJSONArray("template");
                var outputs = jo1.getJSONArray("output");
                var outputss = [];
                for ( var ii = 0; ii < outputs.length(); ii++) {
                    outputss[ii] = outputs.getString(ii);
                }
                var timeRanges;
                try {
                    timeRanges = jo1.getJSONArray("timeRange");
                } catch (ex) {
                    var timeRange = jo1.getString("timeRange");
                    timeRanges = new JSONArray(Collections.singletonList(timeRange));
                }
                for ( var j = 0; j < templates.length(); j++) {
                    var t = templates.getString(j);
                    for ( var k = 0; k < timeRanges.length(); k++) {
                        var timeRange = timeRanges.getString(k);
                        console.info("timeRange:" + timeRange);
                        var timeStartStop = timeRange.split("/");
                        try {
                            this.doTestFormatHapiServerSiteOne(outputss, t, timeStartStop[0], timeStartStop[1]);
                        } catch (ex) {
                            fail(ex.getMessage());
                        }
                    }
                    console.info("" + t);
                }
            }
        } catch (ex) {
            // J2J (logger) Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE, null, ex);
            fail(ex.getLocalizedMessage());
        }
    }

    testFormatRange() {
        try {
            console.info("# testFormatRange");
            var t;
            var ss;
            console.error(URITemplate.VERSION);
            t = "data_$Y.dat";
            ss = URITemplate.formatRange(t, "2001-03-22", "2004-08-18");
            if (ss.length !== 4) {
                fail(t);
            }
            t = "http://emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf";
            //emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf";
            var extra = new Map();
            extra.set("SC", "A");
            extra.set("sc", "a");
            extra.set("v", "1.5.15");
            ss = URITemplate.formatRange(t, "2017-07-01", "2017-07-04", extra);
            ss.forEach( function ( s ) {
                 console.info(s);
            }, this )
            var ff = URITemplate.formatRange("$Y$m$(d,delta=10,phasestart=1979-01-01)", "1979-01-01", "1980-01-01");
            ff.forEach( function ( f ) {
                 console.info(f);
            }, this )
        } catch (ex) {
            fail(ex.getMessage());
        }
    }

}
test = new URITemplateTest();
test.testMakeCanonical();
test.testParse();
test.testFormat();
test.testFormatHapiServerSite();
test.testFormatRange();
