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
 * Tests of the useful TimeUtil.java code.
 * @author jbf
 */
class TimeUtilTest {
    /**
     * Test of reformatIsoTime method, of class TimeUtil.
     */
    testReformatIsoTime() {
        console.info("reformatIsoTime");
        var exampleForm = "2020-01-01T00:00Z";
        var time = "2020-112Z";
        var expResult = "2020-04-21T00:00Z";
        var result = TimeUtil.reformatIsoTime(exampleForm, time);
        assertEquals(expResult, result);
    }

    /**
     * Test of monthNameAbbrev method, of class TimeUtil.
     */
    testMonthNameAbbrev() {
        console.info("monthNameAbbrev");
        var expResult = "Mar";
        var result = TimeUtil.monthNameAbbrev(3);
        assertEquals(expResult, result);
    }

    /**
     * Test of monthNameAbbrev method, of class TimeUtil.
     */
    testMonthNameFull() {
        console.info("monthNameFull");
        var expResult = "March";
        var result = TimeUtil.monthNameFull(3);
        assertEquals(expResult, result);
    }

    /**
     * Test of monthNumber method, of class TimeUtil.
     */
    testMonthNumber() {
        console.info("monthNumber");
        var s = "December";
        var expResult = 12;
        var result = TimeUtil.monthNumber(s);
        assertEquals(expResult, result);
    }

    /**
     * Test of countOffDays method, of class TimeUtil.
     */
    testCountOffDays() {
        console.info("countOffDays");
        var startTime
        var stopTime;
        var expResult
        var result;
        startTime = "1999-12-31";
        stopTime = "2000-01-03";
        expResult = ["1999-12-31Z", "2000-01-01Z", "2000-01-02Z"];
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        startTime = "1999-12-31Z";
        stopTime = "2000-01-03Z";
        expResult = ["1999-12-31Z", "2000-01-01Z", "2000-01-02Z"];
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        startTime = "1999-12-31T12:00Z";
        stopTime = "2000-01-03T12:00Z";
        expResult = ["1999-12-31Z", "2000-01-01Z", "2000-01-02Z"];
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        startTime = "1999";
        stopTime = "2000";
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertEquals(result.length, 365);
        assertEquals(result[0], "1999-01-01Z");
        assertEquals(result[364], "1999-12-31Z");
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    testNextDay() {
        console.info("nextDay");
        var day = "2019-12-31Z";
        var expResult = "2020-01-01Z";
        var result = TimeUtil.nextDay(day);
        assertEquals(expResult, result);
    }

    /**
     * Test of previousDay method, of class TimeUtil.
     */
    testPreviousDay() {
        console.info("previousDay");
        var day = "2020-01-01";
        var expResult = "2019-12-31Z";
        var result = TimeUtil.previousDay(day);
        assertEquals(expResult, result);
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    testNextRange() {
        try {
            console.info("nextRange");
            var tr = TimeUtil.parseISO8601TimeRange("2022-12-05Z/2022-12-15Z");
            var result = TimeUtil.formatIso8601TimeRange(TimeUtil.nextRange(tr));
            var expResult = "2022-12-15/2022-12-25";
            assertEquals(expResult, result);
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    testPreviousRange() {
        try {
            console.info("previousRange");
            var tr = TimeUtil.parseISO8601TimeRange("2022-12-05Z/2022-12-15Z");
            var result = TimeUtil.formatIso8601TimeRange(TimeUtil.previousRange(tr));
            var expResult = "2022-11-25/2022-12-05";
            assertEquals(expResult, result);
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Test of ceil method, of class TimeUtil.
     */
    testCeil() {
        console.info("ceil");
        var time = "2000-01-01T00:00";
        var expResult = "2000-01-01T00:00:00.000000000Z";
        var result = TimeUtil.ceil(time);
        assertEquals(expResult, result);
        time = "2000-01-01T23:59";
        expResult = "2000-01-02T00:00:00.000000000Z";
        result = TimeUtil.ceil(time);
        assertEquals(expResult, result);
    }

    /**
     * Test of floor method, of class TimeUtil.
     */
    testFloor() {
        console.info("floor");
        var time = "2000-01-01T00:00";
        var expResult = "2000-01-01T00:00:00.000000000Z";
        var result = TimeUtil.floor(time);
        assertEquals(expResult, result);
        time = "2000-01-01T23:59";
        expResult = "2000-01-01T00:00:00.000000000Z";
        result = TimeUtil.floor(time);
        assertEquals(expResult, result);
    }

    /**
     * Test of normalizeTimeString method, of class TimeUtil.
     */
    testNormalizeTimeString() {
        console.info("normalizeTimeString");
        var time = "2020-03-04T24:00:00Z";
        var expResult = "2020-03-05T00:00:00.000000000Z";
        var result = TimeUtil.normalizeTimeString(time);
        assertEquals(expResult, result);
    }

    testNormalizeTime() {
        console.info("normalizeTime");
        var time;
        var expResult;
        time = [2000, 1, 1, 24, 0, 0, 0];
        expResult = [2000, 1, 2, 0, 0, 0, 0];
        TimeUtil.normalizeTime(time);
        assertArrayEquals(expResult, time);
        time = [2000, 1, 1, -1, 0, 0, 0];
        expResult = [1999, 12, 31, 23, 0, 0, 0];
        TimeUtil.normalizeTime(time);
        assertArrayEquals(expResult, time);
        time = [1979, 13, 6, 0, 0, 0, 0];
        expResult = [1980, 1, 6, 0, 0, 0, 0];
        TimeUtil.normalizeTime(time);
        assertArrayEquals(expResult, time);
        time = [1979, 12, 37, 0, 0, 0, 0];
        expResult = [1980, 1, 6, 0, 0, 0, 0];
        TimeUtil.normalizeTime(time);
        assertArrayEquals(expResult, time);
    }

    /**
     * Test of isoTimeFromArray method, of class TimeUtil.
     */
    testIsoTimeFromArray() {
        console.info("isoTimeFromArray");
        var nn = [1999, 12, 31, 23, 0, 0, 0];
        var expResult = "1999-12-31T23:00:00.000000000Z";
        var result = TimeUtil.isoTimeFromArray(nn);
        assertEquals(expResult, result);
        nn = [2000, 1, 45, 23, 0, 0, 0];
        expResult = "2000-02-14T23:00:00.000000000Z";
        result = TimeUtil.isoTimeFromArray(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of isoTimeToArray method, of class TimeUtil.
     */
    testIsoTimeToArray() {
        console.info("isoTimeToArray");
        var time = "";
        var expResult = [2020, 2, 3, 6, 7, 8, 10001];
        var result = TimeUtil.isoTimeToArray("2020-034T06:07:08.000010001");
        assertArrayEquals(expResult, result);
        expResult = [2012, 1, 17, 2, 0, 0, 245000000];
        result = TimeUtil.isoTimeToArray("2012-01-17T02:00:00.245");
        assertArrayEquals(expResult, result);
        result = TimeUtil.isoTimeToArray("2020-033T06:07:08.000010001");
        result = TimeUtil.isoTimeToArray("2020-03-03Z");
        result = TimeUtil.isoTimeToArray("2020-033Z");
        result = TimeUtil.isoTimeToArray("2020-033");
        result = TimeUtil.isoTimeToArray("2020-033T00:00Z");
        result = TimeUtil.isoTimeToArray("now");
        result = TimeUtil.isoTimeToArray("lastday");
        result = TimeUtil.isoTimeToArray("lastday+PT1H");
        result = TimeUtil.isoTimeToArray("lastminute+PT1M");
    }

    /**
     * Test of dayOfYear method, of class TimeUtil.
     */
    testDayOfYear() {
        console.info("dayOfYear");
        var year = 2000;
        var month = 3;
        var day = 1;
        var expResult = 61;
        var result = TimeUtil.dayOfYear(year, month, day);
        assertEquals(expResult, result);
    }

    /**
     * Test of toMillisecondsSince1970 method, of class TimeUtil.
     */
    testToMillisecondsSince1970() {
        console.info("toMillisecondsSince1970");
        var result = TimeUtil.toMillisecondsSince1970("2000-01-02T00:00:00.0Z");
        assertEquals(10958, Math.trunc(result / 86400000));
        //  # 10958.0 days
        assertEquals(0, result % 86400000);
        result = TimeUtil.toMillisecondsSince1970("2020-07-09T16:35:27Z");
        assertEquals(1594312527000, result);
    }

    /**
     * Test of parseISO8601Duration method, of class TimeUtil.
     * @throws java.lang.Exception
     */
    testParseISO8601Duration() {
        console.info("parseISO8601Duration");
        var stringIn = "PT5H4M";
        var expResult = [0, 0, 0, 5, 4, 0, 0];
        var result = TimeUtil.parseISO8601Duration(stringIn);
        assertArrayEquals(expResult, result);
        expResult = [0, 0, 0, 0, 0, 0, 123000];
        result = TimeUtil.parseISO8601Duration("PT0.000123S");
        assertArrayEquals(expResult, result);
        result = TimeUtil.parseISO8601Duration("PT52.000000S");
        // Das2 parsing has a problem with this.
        expResult = [0, 0, 0, 0, 0, 52, 0];
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of julianDay method, of class TimeUtil.
     */
    testJulianDay() {
        console.info("julianDay");
        var year = 2020;
        var month = 7;
        var day = 9;
        var expResult = 2459040;
        var result = TimeUtil.julianDay(year, month, day);
        assertEquals(expResult, result);
    }

    testMonthForDayOfYear() {
        console.info("monthForDayOfYear");
        assertEquals(TimeUtil.monthForDayOfYear(2000, 45), 2);
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    testFromJulianDay() {
        console.info("fromJulianDay");
        var julian = 2459040;
        var expResult = [2020, 7, 9, 0, 0, 0, 0];
        var result = TimeUtil.fromJulianDay(julian);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    testFromMillisecondsSince1970() {
        console.info("fromMillisecondsSince1970");
        var s = TimeUtil.fromMillisecondsSince1970(0);
        assertEquals(s, "1970-01-01T00:00:00.000Z");
        s = TimeUtil.fromMillisecondsSince1970(2208988800000);
        assertEquals(s, "2040-01-01T00:00:00.000Z");
        s = TimeUtil.fromMillisecondsSince1970(1);
        assertEquals(s, "1970-01-01T00:00:00.001Z");
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    testFromTT2000() {
        console.info("fromTT2000");
        var s = TimeUtil.fromTT2000(0);
        assertEquals(s, "2000-01-01T11:58:55.816000000Z");
        s = TimeUtil.fromTT2000(631108869184000000);
        assertEquals(s, "2020-01-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(-583934347816000000);
        assertEquals(s, "1981-07-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(-31579135816000000);
        assertEquals(s, "1999-01-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(-63115136816000000);
        assertEquals(s, "1998-01-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(-94651137816000000);
        assertEquals(s, "1997-01-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(-631195148816000000);
        assertEquals(s, "1980-01-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(394372867184000000);
        assertEquals(s, "2012-07-01T00:00:00.000000000Z");
        s = TimeUtil.fromTT2000(394372866184000000);
        assertEquals(s, "2012-06-30T23:59:60.000000000Z");
        s = TimeUtil.fromTT2000(394372865684000000);
        assertEquals(s, "2012-06-30T23:59:59.500000000Z");
    }

    /**
     * Test of subtract method, of class TimeUtil.
     */
    testSubtract() {
        console.info("subtract");
        var base = [2020, 7, 9, 1, 0, 0, 0];
        var offset = [0, 0, 0, 2, 0, 0, 0];
        var expResult = [2020, 7, 8, 23, 0, 0, 0];
        var result = TimeUtil.subtract(base, offset);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of add method, of class TimeUtil.
     */
    testAdd() {
        console.info("add");
        var base = [2020, 7, 8, 23, 0, 0, 0];
        var offset = [0, 0, 0, 2, 0, 0, 0];
        var expResult = [2020, 7, 9, 1, 0, 0, 0];
        var result = TimeUtil.add(base, offset);
        assertArrayEquals(expResult, result);
        base = [1979, 12, 27, 0, 0, 0, 0];
        offset = [0, 0, 10, 0, 0, 0, 0];
        expResult = [1980, 1, 6, 0, 0, 0, 0];
        result = TimeUtil.add(base, offset);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Duration method, of class TimeUtil.
     */
    testFormatIso8601Duration() {
        console.info("formatIso8601Duration");
        var nn = [0, 0, 7, 0, 0, 6];
        var expResult = "P7DT6S";
        var result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 0, 0, 0, 0, 200000];
        expResult = "PT0.000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 0, 0, 0, 0, 200000000];
        expResult = "PT0.200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 0, 0, 0, 0, 200];
        expResult = "PT0.000000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 0, 0, 0, 2, 200000];
        expResult = "PT2.000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 0, 0, 0, 0, 0];
        expResult = "PT0S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0, 1, 0, 0, 0, 0];
        expResult = "P1D";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        nn = [0, 0];
        expResult = "P0D";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of now method, of class TimeUtil.
     */
    testNow() {
        console.info("now");
        var result = TimeUtil.now();
    }

    /**
     * Test of parseISO8601TimeRange method, of class TimeUtil.
     */
    testParseISO8601TimeRange() {
        console.info("parseISO8601TimeRange");
        var result;
        var stringIn;
        var expResult;
        stringIn = "1998-01-02/1998-01-17";
        expResult = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "2022-W13/P7D";
        expResult = [2022, 3, 28, 0, 0, 0, 0, 2022, 4, 4, 0, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "P7D/2022-01-02";
        expResult = [2021, 12, 26, 0, 0, 0, 0, 2022, 1, 2, 0, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "2023-01-18T17:00/18:00";
        expResult = [2023, 1, 18, 17, 0, 0, 0, 2023, 1, 18, 18, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "2013-01-01/07-01";
        expResult = [2013, 1, 1, 0, 0, 0, 0, 2013, 7, 1, 0, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "2017-09-13T13:06Z/2023-09-30T23:57:41Z";
        expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 57, 41, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
        stringIn = "2017-09-13T13:06:00Z/2023-09-30T23:00Z";
        expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 0, 0, 0];
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
    }

    /**
     * Test of formatIso8601TimeRange method, of class TimeUtil.
     */
    testFormatIso8601TimeRange() {
        console.info("formatIso8601TimeRange");
        var nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0];
        var expResult = "1998-01-02/1998-01-17";
        var result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
        nn = [1998, 1, 2, 0, 3, 0, 0, 1998, 1, 17, 0, 3, 0, 0];
        expResult = "1998-01-02T00:03Z/1998-01-17T00:03Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
        nn = [1998, 1, 2, 0, 0, 2, 0, 1998, 1, 17, 0, 0, 6, 0];
        expResult = "1998-01-02T00:00:02Z/1998-01-17T00:00:06Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
        nn = [1998, 1, 2, 0, 0, 0, 300, 1998, 1, 2, 0, 0, 0, 500];
        expResult = "1998-01-02T00:00:00.000000300Z/1998-01-02T00:00:00.000000500Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    testFormatIso8601TimeInTimeRange() {
        console.info("formatIso8601Time");
        var nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0];
        var offset = 7;
        var expResult = "1998-01-17T00:00:00.000000000Z";
        var result = TimeUtil.formatIso8601TimeInTimeRange(nn, offset);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    testFormatIso8601TimeInTime() {
        console.info("formatIso8601Time");
        var nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0];
        var expResult = "1998-01-02T00:00:00.000000000Z";
        var result = TimeUtil.formatIso8601Time(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of dayOfWeek method, of class TimeUtil.
     */
    testDayOfWeek() {
        console.info("dayOfWeek");
        var year = 2022;
        var month = 3;
        var day = 12;
        var expResult = 5;
        var result = TimeUtil.dayOfWeek(year, month, day);
        assertEquals(expResult, result);
    }

    /**
     * Test of fromWeekOfYear method, of class TimeUtil.
     */
    testFromWeekOfYear() {
        console.info("fromWeekOfYear");
        var year = 2022;
        var weekOfYear = 13;
        var result = [0,0,0,0,0,0,0];
        TimeUtil.fromWeekOfYear(year, weekOfYear, result);
        var expResult = [2022, 3, 28, 0, 0, 0, 0];
        assertArrayEquals(expResult, result);
        year = 2022;
        weekOfYear = 0;
        result = [0,0,0,0,0,0,0];
        TimeUtil.fromWeekOfYear(year, weekOfYear, result);
        expResult = [2021, 12, 27, 0, 0, 0, 0];
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of parseISO8601Time method, of class TimeUtil.
     */
    testParseISO8601Time() {
        console.info("parseISO8601Time");
        var string = "2020-033T00:00";
        var expResult = [2020, 2, 2, 0, 0, 0, 0];
        try {
            var result = TimeUtil.parseISO8601Time(string);
            assertArrayEquals(expResult, result);
        } catch (ex) {
            throw new AssertionError(ex);
        }
    }

    /**
     * Test of getStartTime method, of class TimeUtil.
     */
    testGetStartTime() {
        console.info("getStartTime");
        var timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10];
        var expResult = [2025, 2, 4, 5, 6, 7, 8];
        var result = TimeUtil.getStartTime(timerange);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of getStopTime method, of class TimeUtil.
     */
    testGetStopTime() {
        console.info("getStopTime");
        var timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10];
        var expResult = [2025, 2, 4, 7, 8, 9, 10];
        var result = TimeUtil.getStopTime(timerange);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of leapSecondsAt method, of class TimeUtil.
     */
    testLeapSecondsAt() {
        console.info("leapSecondsAt");
        var tt2000 = 0;
        var expResult = 32;
        var result = TimeUtil.leapSecondsAt(tt2000);
        assertEquals(expResult, result);
        result = TimeUtil.leapSecondsAt(536500869184000000);
        assertEquals(37, result);
    }

    /**
     * Test of lastLeapSecond method, of class TimeUtil.
     */
    testLastLeapSecond() {
        console.info("lastLeapSecond");
        var tt2000 = 0;
        var expResult = -31579135816000000;
        var result = TimeUtil.lastLeapSecond(tt2000);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatHMSN method, of class TimeUtil.
     */
    testFormatHMSN() {
        console.info("formatHMSN");
        var nanosecondsSinceMidnight = 56;
        var expResult = "00:00:00.000000056";
        var result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
        nanosecondsSinceMidnight = 3600 * 24 * 1000000000;
        expResult = "23:59:60.000000000";
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
        nanosecondsSinceMidnight = 3600 * 24 * 1000000000 + 1 * 1000000000 + 500 * 1000000;
        expResult = "23:59:61.500000000";
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
    }

    testDaysInMonth() {
        console.info("daysInMonth");
        var year = 2000;
        var month = 2;
        var expResult = 29;
        var result = TimeUtil.daysInMonth(year, month);
        assertEquals(expResult, result);
        year = 2004;
        month = 1;
        expResult = 31;
        result = TimeUtil.daysInMonth(year, month);
        assertEquals(expResult, result);
        year = 2008;
        month = 12;
        expResult = 31;
        result = TimeUtil.daysInMonth(year, month);
        assertEquals(expResult, result);
    }

}
test = new TimeUtilTest();
test.testReformatIsoTime();
test.testMonthNameAbbrev();
test.testMonthNameFull();
test.testMonthNumber();
test.testCountOffDays();
test.testNextDay();
test.testPreviousDay();
test.testNextRange();
test.testPreviousRange();
test.testCeil();
test.testFloor();
test.testNormalizeTimeString();
test.testNormalizeTime();
test.testIsoTimeFromArray();
test.testIsoTimeToArray();
test.testDayOfYear();
test.testToMillisecondsSince1970();
test.testParseISO8601Duration();
test.testJulianDay();
test.testMonthForDayOfYear();
test.testFromJulianDay();
test.testFromMillisecondsSince1970();
test.testFromTT2000();
test.testSubtract();
test.testAdd();
test.testFormatIso8601Duration();
test.testNow();
test.testParseISO8601TimeRange();
test.testFormatIso8601TimeRange();
test.testFormatIso8601TimeInTimeRange();
test.testFormatIso8601TimeInTime();
test.testDayOfWeek();
test.testFromWeekOfYear();
test.testParseISO8601Time();
test.testGetStartTime();
test.testGetStopTime();
test.testLeapSecondsAt();
test.testLastLeapSecond();
test.testFormatHMSN();
test.testDaysInMonth();

