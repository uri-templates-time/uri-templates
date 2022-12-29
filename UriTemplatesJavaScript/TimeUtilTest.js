// cheesy unittest temporary
function assertEquals(a,b) {
    if ( a!==b ) throw 'a!==b : ' + a + ' !== ' + b;
}
function assertArrayEquals(a,b) {
    if ( a.length===b.length ) {
        for ( i=0; i<a.length; i++ ) {
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
        TimeUtil.isoTimeToArray("2020-033T06:07:08.000010001");
        TimeUtil.isoTimeToArray("2020-03-03Z");
        TimeUtil.isoTimeToArray("2020-033Z");
        TimeUtil.isoTimeToArray("2020-033");
        TimeUtil.isoTimeToArray("2020-033T00:00Z");
        TimeUtil.isoTimeToArray("now");
        TimeUtil.isoTimeToArray("lastday");
        TimeUtil.isoTimeToArray("lastday+PT1H");
        TimeUtil.isoTimeToArray("lastminute+PT1M");
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
        assertEquals(10958, Math.floor(result / 86400000));
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
        TimeUtil.now();
    }

    /**
     * Test of parseISO8601TimeRange method, of class TimeUtil.
     */
    testParseISO8601TimeRange() {
        console.info("parseISO8601TimeRange");
        var result;
        var stringIn = "1998-01-02/1998-01-17";
        var expResult = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0];
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

}
test = new TimeUtilTest();
test.testReformatIsoTime();
test.testMonthNameAbbrev();
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

