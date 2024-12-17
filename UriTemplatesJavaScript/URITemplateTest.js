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
}
function arrayequals( a, b ) { // private
    if ( a.length!==b.length ) {
        return false;
    } else {
        for (var i = 0; i<a.length; i++ ) {
            if ( a[i]!==b[i] ) {
                return false;
            }
        }
        return true;
    }
}
// import sprintf.js

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

    doTestTimeParser1(spec, test, norm, expectException) {
        var ut;
        try {
            ut = new URITemplate(spec);
        } catch (ex) {
            console.info("### unable to parse spec: " + spec);
            fail(ex);
            return;
        }
        var nn = norm.split("/");
        if (URITemplateTest.iso8601DurationPattern.exec(nn[1])!=null) {
            nn[1] = TimeUtil.isoTimeFromArray(TimeUtil.add(TimeUtil.isoTimeToArray(nn[0]), TimeUtil.parseISO8601Duration(nn[1])));
        }
        var start = TimeUtil.isoTimeToArray(nn[0]);
        var stop = TimeUtil.isoTimeToArray(nn[1]);
        var inorm = Array.apply(null, Array(14)).map(function (x, i) { return 0; });
        arraycopy( start, 0, inorm, 0, 7 );
        arraycopy( stop, 0, inorm, 7, 7 );
        var res;
        try {
            res = ut.parse(test, new Map());
        } catch (ex) {
            if (expectException) {
                throw ex;
            } else {
                fail(ex);
                return;
            }
        }
        var arrow = String.fromCharCode( 8594 );
        if (arrayequals( res, inorm )) {
            console.info(sprintf("%s:  \t\"%s\"%s\t\"%s\"",spec, test, arrow, URITemplateTest.toStr(res)));
        } else {
            throw "ranges do not match: " + spec + " " + test + "--> " + URITemplateTest.toStr(res) + ", should be " + norm;
        }
        assertArrayEquals(inorm, res);
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

    testDelimiterExceptionLeading() {
        // Note this test expects an exception and I need to figure out how to make Python unit tests do this.
        try {
            this.doTestTimeParser1("ac_$Y$j00-$(Y;end)$(j;end)00.gif", "AC_199811900-199812000.gif", "1998-04-29T00:00Z/1998-04-30T00:00Z", true);
            throw new Exception("this should fail");
        } catch {
            console.info("okay testDelimiterExceptionLeading");
        }
    }

    testDelimiterExceptionTrailing() {
        // Note this test expects an exception and I need to figure out how to make Python unit tests do this.
        try {
            this.doTestTimeParser1("ac_$Y$j00-$(Y;end)$(j;end)00.gif", "ac_199811900-199812000-this-shouldnt-match.gif", "1998-04-29T00:00Z/1998-04-30T00:00Z", true);
            throw new Exception("this should fail");
        } catch {
            console.info("okay testDelimiterExceptionTrailing");
        }
    }

    /**
     * Test of parse method, of class URITemplate.
     * @throws java.lang.Exception
     */
    testParse() {
        console.info("# testParse");
        this.doTestTimeParser1("data_$Y_$j_$(Y;end)_$(j;shift=1;phasestart=2009-001).dat", "data_2009_001_2009_002.dat", "2009-01-01/2009-01-03T00:00Z", false);
        this.doTestTimeParser1("$Y$(j;div=100)XX", "20243XX", "2024-10-26T00:00Z/2025-01-01T00:00Z", false);
        this.doTestTimeParser1("$Y$(j;div=100)XX/$j", "20243XX/365", "2024-12-30T00:00Z/2024-12-31T00:00Z", false);
        this.doTestTimeParser1("$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00", false);
        this.dotestParse1();
        this.doTestParse2();
        this.doTestParse3();
        this.doTestTimeParser1("$(j;Y=2012).$H$M$S.$N", "017.020000.245000000", "2012-01-17T02:00:00.245000000/2012-01-17T02:00:00.245000001", false);
        this.doTestTimeParser1("$(j;Y=2012).$H$M$S.$(N;div=1000000)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246", false);
        this.doTestTimeParser1("$(j;Y=2012).$H$M$S.$(N;div=1E6)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246", false);
        this.doTestTimeParser1("ac27_crn$x_$Y$j00-$(Y;end)$(j;end)00.gif", "ac27_crn1926_199722300-199725000.gif", "1997-223T00:00/1997-250T00:00", false);
        this.doTestTimeParser1("$Y $m $d $H $M", "2012 03 30 16 20", "2012-03-30T16:20/2012-03-30T16:21", false);
        this.doTestTimeParser1("$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03", false);
        this.doTestTimeParser1("$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03", false);
        this.doTestTimeParser1("$Y$m$d-$(Y;end)$m$(d;shift=1)", "20200101-20200107", "2020-01-01/2020-01-08", false);
        this.doTestTimeParser1("$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13", false);
        this.doTestTimeParser1("$(periodic;offset=0;start=2000-001;period=P1D)", "0", "2000-001/P1D", false);
        this.doTestTimeParser1("$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D", false);
        this.doTestTimeParser1("$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D", false);
        this.doTestTimeParser1("$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D", false);
        this.doTestTimeParser1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT6H", false);
        this.doTestTimeParser1("$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246", false);
        //This should not parse: doTestTimeParser1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        this.doTestTimeParser1("$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00", false);
        //testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z"); 
        this.doTestTimeParser1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T12:00", false);
        this.doTestTimeParser1("$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21", false);
        this.doTestTimeParser1("$Y", "2012", "2012-01-01T00:00/2013-01-01T00:00", false);
        this.doTestTimeParser1("$Y-$j", "2012-017", "2012-01-17T00:00/2012-01-18T00:00", false);
        this.doTestTimeParser1("$(j,Y=2012)", "017", "2012-01-17T00:00/2012-01-18T00:00", false);
        this.doTestTimeParser1("ace_mag_$Y_$j_to_$(Y;end)_$j.cdf", "ace_mag_2005_001_to_2005_003.cdf", "2005-001T00:00/2005-003T00:00", false);
        this.doTestTimeParser1("$y $(m;pad=none) $(d;pad=none) $(H;pad=none)", "99 1 3 0", "1999-01-03T00:00/1999-01-03T01:00", false);
        this.doTestTimeParser1("$y $j ($(m;pad=none) $(d;pad=none)) $H", "99 003 (1 3) 00", "1999-01-03T00:00/1999-01-03T01:00", false);
        this.doTestTimeParser1("/gif/ac_$Y$j$H-$(Y;end)$j$H.gif", "/gif/ac_199733000-199733100.gif", "1997-11-26T00:00Z/1997-11-27T00:00Z", false);
        this.doTestTimeParser1("$Y_$(b;case=uc;fmt=full)_$d_$v", "2000_NOVEMBER_23_00", "2000-11-23T00:00Z/2000-11-24T00:00Z", false);
        this.doTestTimeParser1("$(y;start=2000)", "72", "2072-01-01T00:00Z/2073-01-01T00:00Z", false);
        this.doTestTimeParser1("$(y;start=1958)", "72", "1972-01-01T00:00Z/1973-01-01T00:00Z", false);
        this.doTestTimeParser1("$(y;start=1958)", "57", "2057-01-01T00:00Z/2058-01-01T00:00Z", false);
    }

    testFloorDiv() {
        assertEquals(URITemplate.floorDiv(0, 7), 0);
        assertEquals(URITemplate.floorDiv(1, 7), 0);
        assertEquals(URITemplate.floorDiv(7, 7), 1);
        assertEquals(URITemplate.floorDiv(-1, 7), -1);
        assertEquals(URITemplate.floorDiv(-7, 7), -1);
        assertEquals(URITemplate.floorDiv(-8, 7), -2);
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
            fail("unable to parse spec: " + spec);
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
            throw ex;
        }
        var arrow = String.fromCharCode( 8594 );
        if (res==test) {
            console.info(sprintf("%s:  \t\"%s\"%s\t\"%s\"",spec, norm, arrow, res));
        } else {
            console.info("### ranges do not match: " + spec + " " + norm + arrow + res + ", should be " + test);
        }
        assertEquals(res, test);
    }

    testFormatMonth() {
        //System.err.println( ut.format("2024-02-01T00:00Z","2024-03-01T00:00Z") );
        this.doTestTimeFormat1("$(b)", "feb", "2024-02-01/2024-03-01");
        this.doTestTimeFormat1("$(b;case=lc)", "feb", "2024-02-01/2024-03-01");
        this.doTestTimeFormat1("$(b;fmt=full)", "february", "2024-02-01/2024-03-01");
        this.doTestTimeFormat1("$(b;fmt=full;case=uc)", "FEBRUARY", "2024-02-01/2024-03-01");
        this.doTestTimeFormat1("$(b;fmt=full;case=cap) $(d;pad=none), $Y", "February 2, 2022", "2022-02-02/2022-02-03");
    }

    testFormatX() {
        var t;
        t = new URITemplate("/tmp/ap/$(x;name=sc;len=6;pad=_).dat");
        var e = new Map();
        e.set("sc", "Apple");
        assertEquals("/tmp/ap/_Apple.dat", t.format("2000-01-01", "2000-01-02", e));
    }

    testParseX() {
        var t;
        t = new URITemplate("/tmp/ap/$Y_$(x;name=sc;len=6;pad=_).dat");
        var e = new Map();
        var r = t.parse("/tmp/ap/2024__Apple.dat", e);
        assertArrayEquals([2024, 1, 1, 0, 0, 0, 0, 2025, 1, 1, 0, 0, 0, 0], r);
    }

    testParseX2() {
        var t;
        t = new URITemplate("http://example.com/data/$Y/$Y_$m_$d/$(x;name=d5)/fa_k0_dcf_$x_$(x;name=mm).gif");
        //example.com/data/$Y/$Y_$m_$d/$(x;name=d5)/fa_k0_dcf_$x_$(x;name=mm).gif");
        var e = new Map();
        var r = t.parse("http://example.com/data/2008/2008_03_04/46565/fa_k0_dcf_46565_in.gif", e);
        //example.com/data/2008/2008_03_04/46565/fa_k0_dcf_46565_in.gif", e );
        assertArrayEquals([2008, 3, 4, 0, 0, 0, 0, 2008, 3, 5, 0, 0, 0, 0], r);
        assertEquals("46565", e.get("d5"));
        assertEquals("in", e.get("mm"));
    }

    /**
     * Test of format method, of class URITemplate.
     * @throws java.lang.Exception
     */
    testFormat() {
        console.info("# testFormat");
        //testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        this.doTestTimeFormat1("/gif/ac_$Y$j$H-$(Y;end)$j$H.gif", "/gif/ac_199733000-199733100.gif", "1997-11-26T00:00Z/1997-11-27T00:00Z");
        this.doTestTimeFormat1("$Y/$Y$(j;div=100)XX/$Y$j.dat", "2024/20241XX/2024187.dat", "2024-07-05/P1D");
        this.doTestTimeFormat1("$(j;Y=2024).$H$M$S.$(N;div=1000000)", "017.020000.245", "2024-01-17T02:00:00.245/2024-01-17T02:00:00.246");
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
        //testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        this.doTestTimeFormat1("$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T18:00");
        this.doTestTimeFormat1("$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21");
        this.doTestTimeFormat1("$Y", "2012", "2012-01-01T00:00/2013-01-01T00:00");
        this.doTestTimeFormat1("$Y-$j", "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeFormat1("$(j,Y=2012)", "017", "2012-01-17T00:00/2012-01-18T00:00");
        this.doTestTimeFormat1("ace_mag_$Y_$j_to_$(Y;end)_$j.cdf", "ace_mag_2005_001_to_2005_003.cdf", "2005-001T00:00/2005-003T00:00");
        var ut = new URITemplate("$Y$m$d-$(Y;end)$m$d");
        ut.formatTimeRange([2013, 2, 2, 0, 0, 0, 0, 2014, 3, 3, 0, 0, 0, 0], new Map() );
        ut.formatStartStopRange([2013, 2, 2, 0, 0, 0, 0], [2014, 3, 3, 0, 0, 0, 0], new Map() );
    }

    static readJSONTests() {
        // https://raw.githubusercontent.com/hapi-server/uri-templates/master/formatting.json
        let test= "[\n" +
"{\n" +
"\"id\": \"fieldstest1\",\n" +
"\"whatTests\": [\n" +
"\"fields\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$Y.dat\",\n" +
"\"http://example.com/data_$(Y).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"2001-03-22/2004-08-18\",\n" +
"\"2001-03/2004-08\",\n" +
"\"2001/2005\"\n" +
"],\n" +
"\"comment\": \"Example in section 1.1 of specification document. Note that stop date is exclusive, so 2001/2005 is needed to generate 2004 URI when only year start/stop is given.\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_2001.dat\",\n" +
"\"http://example.com/data_2002.dat\",\n" +
"\"http://example.com/data_2003.dat\",\n" +
"\"http://example.com/data_2004.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"fieldstest2\",\n" +
"\"whatTests\": [\n" +
"\"fields\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$Y-$m.dat\",\n" +
"\"http://example.com/data_$(Y)-$m.dat\",\n" +
"\"http://example.com/data_$Y-$(m).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1998/1999\",\n" +
"\"1998-01/1999-01\",\n" +
"\"1998-01/1998-12-02\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_1998-01.dat\",\n" +
"\"http://example.com/data_1998-02.dat\",\n" +
"\"http://example.com/data_1998-03.dat\",\n" +
"\"http://example.com/data_1998-04.dat\",\n" +
"\"http://example.com/data_1998-05.dat\",\n" +
"\"http://example.com/data_1998-06.dat\",\n" +
"\"http://example.com/data_1998-07.dat\",\n" +
"\"http://example.com/data_1998-08.dat\",\n" +
"\"http://example.com/data_1998-09.dat\",\n" +
"\"http://example.com/data_1998-10.dat\",\n" +
"\"http://example.com/data_1998-11.dat\",\n" +
"\"http://example.com/data_1998-12.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"escape1\",\n" +
"\"whatTests\": [\n" +
"\"escape\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/$$$Y$$.dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"2001/2003\"\n" +
"],\n" +
"\"comment\": \"$$ is interpreted as a literal $.\",\n" +
"\"output\": [\n" +
"\"http://example.com/$2001$.dat\",\n" +
"\"http://example.com/$2002$.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad1\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(j;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01/1999-03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\",\n" +
"\"http://example.com/data_3.dat\",\n" +
"\"http://example.com/data_4.dat\",\n" +
"\"http://example.com/data_5.dat\",\n" +
"\"http://example.com/data_6.dat\",\n" +
"\"http://example.com/data_7.dat\",\n" +
"\"http://example.com/data_8.dat\",\n" +
"\"http://example.com/data_9.dat\",\n" +
"\"http://example.com/data_10.dat\",\n" +
"\"http://example.com/data_11.dat\",\n" +
"\"http://example.com/data_12.dat\",\n" +
"\"http://example.com/data_13.dat\",\n" +
"\"http://example.com/data_14.dat\",\n" +
"\"http://example.com/data_15.dat\",\n" +
"\"http://example.com/data_16.dat\",\n" +
"\"http://example.com/data_17.dat\",\n" +
"\"http://example.com/data_18.dat\",\n" +
"\"http://example.com/data_19.dat\",\n" +
"\"http://example.com/data_20.dat\",\n" +
"\"http://example.com/data_21.dat\",\n" +
"\"http://example.com/data_22.dat\",\n" +
"\"http://example.com/data_23.dat\",\n" +
"\"http://example.com/data_24.dat\",\n" +
"\"http://example.com/data_25.dat\",\n" +
"\"http://example.com/data_26.dat\",\n" +
"\"http://example.com/data_27.dat\",\n" +
"\"http://example.com/data_28.dat\",\n" +
"\"http://example.com/data_29.dat\",\n" +
"\"http://example.com/data_30.dat\",\n" +
"\"http://example.com/data_31.dat\",\n" +
"\"http://example.com/data_32.dat\",\n" +
"\"http://example.com/data_33.dat\",\n" +
"\"http://example.com/data_34.dat\",\n" +
"\"http://example.com/data_35.dat\",\n" +
"\"http://example.com/data_36.dat\",\n" +
"\"http://example.com/data_37.dat\",\n" +
"\"http://example.com/data_38.dat\",\n" +
"\"http://example.com/data_39.dat\",\n" +
"\"http://example.com/data_40.dat\",\n" +
"\"http://example.com/data_41.dat\",\n" +
"\"http://example.com/data_42.dat\",\n" +
"\"http://example.com/data_43.dat\",\n" +
"\"http://example.com/data_44.dat\",\n" +
"\"http://example.com/data_45.dat\",\n" +
"\"http://example.com/data_46.dat\",\n" +
"\"http://example.com/data_47.dat\",\n" +
"\"http://example.com/data_48.dat\",\n" +
"\"http://example.com/data_49.dat\",\n" +
"\"http://example.com/data_50.dat\",\n" +
"\"http://example.com/data_51.dat\",\n" +
"\"http://example.com/data_52.dat\",\n" +
"\"http://example.com/data_53.dat\",\n" +
"\"http://example.com/data_54.dat\",\n" +
"\"http://example.com/data_55.dat\",\n" +
"\"http://example.com/data_56.dat\",\n" +
"\"http://example.com/data_57.dat\",\n" +
"\"http://example.com/data_58.dat\",\n" +
"\"http://example.com/data_59.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad2\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(m;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01/1999-03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad3\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(d;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01-01/1999-01-03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad4\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(H;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01-01T00/1999-01-01T03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_0.dat\",\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad5\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(M;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01-01T00:00/1999-01-01T00:03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_0.dat\",\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"pad6\",\n" +
"\"whatTests\": [\n" +
"\"pad\"\n" +
"],\n" +
"\"template\": [\n" +
"\"http://example.com/data_$(S;pad=none).dat\"\n" +
"],\n" +
"\"timeRange\": [\n" +
"\"1999-01-01T00:00:00/1999-01-01T00:00:03\"\n" +
"],\n" +
"\"comment\": \"\",\n" +
"\"output\": [\n" +
"\"http://example.com/data_0.dat\",\n" +
"\"http://example.com/data_1.dat\",\n" +
"\"http://example.com/data_2.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"deltaUnits1\",\n" +
"\"whatTests\": [\n" +
"\"delta\",\n" +
"\"units\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y-$(m;delta=2)\",\n" +
"\"$Y-$(m;delta=2;phasestart=2013-01)\"\n" +
"],\n" +
"\"timeRange\": \"2013-02/2013-06\",\n" +
"\"comment\": \"Note no phase start needed when delta in month.\",\n" +
"\"output\": [\n" +
"\"2013-01\",\n" +
"\"2013-03\",\n" +
"\"2013-05\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"deltaUnits2\",\n" +
"\"whatTests\": [\n" +
"\"delta\",\n" +
"\"units\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y-$m-$(d;delta=7;phasestart=2019-05-05)\"\n" +
"],\n" +
"\"timeRange\": \"2019-05-01/2019-06-01\",\n" +
"\"comment\": \"Note that phasestart is required.\",\n" +
"\"output\": [\n" +
"\"2019-04-28\",\n" +
"\"2019-05-05\",\n" +
"\"2019-05-12\",\n" +
"\"2019-05-19\",\n" +
"\"2019-05-26\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"deltaUnits3\",\n" +
"\"whatTests\": [\n" +
"\"delta\",\n" +
"\"units\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y-$m-$(d;delta=2;phasestart=2013-09-01)\"\n" +
"],\n" +
"\"timeRange\": \"2013-09-01/2013-09-05\",\n" +
"\"comment\": \"Note phasestart required.\",\n" +
"\"output\": [\n" +
"\"2013-09-01\",\n" +
"\"2013-09-03\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"shiftUnits1\",\n" +
"\"whatTests\": [\n" +
"\"shift\",\n" +
"\"units\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y-$m-$(d;shift=1).dat\",\n" +
"\"$Y-$m-$(d;shift=1d).dat\"\n" +
"],\n" +
"\"timeRange\": \"2013-09-01/2013-09-05\",\n" +
"\"comment\": \"Basic example of shift. Example use case is where file name corresponds to when the file was written and file contains measurements made on the day before.\",\n" +
"\"output\": [\n" +
"\"2013-08-31.dat\",\n" +
"\"2013-09-01.dat\",\n" +
"\"2013-09-02.dat\",\n" +
"\"2013-09-03.dat\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"end1\",\n" +
"\"whatTests\": [\n" +
"\"end\"\n" +
"],\n" +
"\"template\": [\n" +
"\"data_$Y$m$d_$(Y;end)$m$d.txt\"\n" +
"],\n" +
"\"timeRange\": \"2005-132/2005-146\",\n" +
"\"comment\": \"when the start time and end time are available, format range should format the whole interval\",\n" +
"\"output\": [\n" +
"\"data_20050512_20050526.txt\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"shift1\",\n" +
"\"whatTests\": [\n" +
"\"shift\"\n" +
"],\n" +
"\"template\": [\n" +
"\"data_$Y$j_$(Y;end)$(j;shift=1).txt\"\n" +
"],\n" +
"\"timeRange\": \"2005-132/2005-146\",\n" +
"\"comment\": \"Shift is used for inclusive stop day, see https://github.com/hapi-server/uri-templates/wiki/Specification#full-list-of-field-codes the at end of the section.\",\n" +
"\"output\": [\n" +
"\"data_2005132_2005145.txt\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"deltaPhaseStartEnd1\",\n" +
"\"whatTests\": [\n" +
"\"delta\",\n" +
"\"phasestart\",\n" +
"\"end\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y$m$(d;delta=10;phasestart=1979-01-01)_$(Y,end)$m$d\"\n" +
"],\n" +
"\"timeRange\": \"1979-01-01/1979-01-18\",\n" +
"\"comment\": \"should step by ten day increments.\",\n" +
"\"output\": [\n" +
"\"19790101_19790111\",\n" +
"\"19790111_19790121\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"subsec1\",\n" +
"\"whatTests\": [\n" +
"\"subsec\"\n" +
"],\n" +
"\"template\": [\n" +
"\"$Y$m$d_$H$M$S.$(subsec;places=2)\"\n" +
"],\n" +
"\"timeRange\": \"2008-01-01T01:00:00.030/2008-01-01T01:00:00.060\",\n" +
"\"comment\": \"should step by .01 second increments.\",\n" +
"\"output\": [\n" +
"\"20080101_010000.03\",\n" +
"\"20080101_010000.04\",\n" +
"\"20080101_010000.05\"\n" +
"]\n" +
"},\n" +
"{\n" +
"\"id\": \"delta1\",\n" +
"\"whatTests\": [\n" +
"\"delta\"\n" +
"],\n" +
"\"template\": [\n" +
"\"vg1pws_lr_$Y$m$(d;delta=10;phasestart=1979-01-01)_$(Y;end)$m$(d)_v5.10.png\"\n" +
"],\n" +
"\"timeRange\": \"1979-01-02/1979-01-03\",\n" +
"\"comment\": \"should be 10 days long\",\n" +
"\"output\": [\n" +
"\"vg1pws_lr_19790101_19790111_v5.10.png\"\n" +
"]\n" +
"}\n" +
"]";
        return JSON.parse(test);
    }

    doTestFormatHapiServerSiteOne(outputs, t, startTime, stopTime) {
        var testOutputs = URITemplate.formatRange(t, startTime, stopTime);
        if (testOutputs.length !== outputs.length) {
            fail("bad number of results in formatRange: " + t);
        }
        for ( var l = 0; l < outputs.length; l++) {
            if (testOutputs[l]!=outputs[l]) {
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
            var jo = URITemplateTest.readJSONTests();
            //String ss= readJSONToString( new URL( "file:/home/jbf/ct/git/uri-templates/formatting.json" ) );
            for ( var i = 0; i < jo.length; i++) {
                var jo1 = jo[i];
                var id = jo1.id;
                console.info(sprintf("# %2d: %s %s",i, id, jo1.whatTests));
                if (i < 3) {
                    console.info("###  Skipping test " + i);
                    continue
                }
                var templates = jo1.template;
                var outputs = jo1.output;
                var outputss = [];
                for ( var ii = 0; ii < outputs.length; ii++) {
                    outputss[ii] = outputs[ii];
                }
                var timeRanges;
                timeRanges = jo1.timeRange;
                if ( !Array.isArray(timeRanges) ) {    
                    timeRanges = [ timeRanges ];
                }
                for ( var j = 0; j < templates.length; j++) {
                    var t = templates[j];
                    for ( var k = 0; k < timeRanges.length; k++) {
                        var timeRange = timeRanges[k];
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
            fail(ex);
        }
    }

    testFormatRange() {
        try {
            console.info("# testFormatRange");
            var t;
            var ss;
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
            fail(ex);
        }
    }

    testMakeQualifiersCanonical() {
        var x;
        x = "(x,name=sc,enum=a|b)";
        if ("(x;name=sc;enum=a|b)"!=URITemplate.makeQualifiersCanonical(x)) {
            fail(x);
        }
        x = "$(subsec,places=4)";
        if ("$(subsec;places=4)"!=URITemplate.makeQualifiersCanonical(x)) {
            fail(x);
        }
        //}
        x = "$(hrinterval;names=01,02,03,04)";
        if ("$(hrinterval;names=01,02,03,04)"!=URITemplate.makeQualifiersCanonical(x)) {
            fail(x);
        }
        x = "$(d,delta=10,phasestart=1979-01-01)";
        if ("$(d;delta=10;phasestart=1979-01-01)"!=URITemplate.makeQualifiersCanonical(x)) {
            fail(x);
        }
    }

}
test = new URITemplateTest();
test.testMakeCanonical();
test.testDelimiterExceptionLeading();
test.testDelimiterExceptionTrailing();
test.testParse();
test.testFloorDiv();
test.testFormatMonth();
test.testFormatX();
test.testParseX();
test.testParseX2();
test.testFormat();
test.testFormatHapiServerSite();
test.testFormatRange();
test.testMakeQualifiersCanonical();

