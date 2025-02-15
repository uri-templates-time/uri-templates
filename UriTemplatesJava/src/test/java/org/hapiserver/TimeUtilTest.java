
package org.hapiserver;

import java.text.ParseException;
import java.util.Arrays;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Tests of the useful TimeUtil.java code.
 * @author jbf
 */
public class TimeUtilTest {
    
    public TimeUtilTest() {
    }

    /**
     * Test of reformatIsoTime method, of class TimeUtil.
     */
    @Test
    public void testReformatIsoTime() {
        System.out.println("reformatIsoTime");
        String exampleForm =  "2020-01-01T00:00Z";
        String time = "2020-112Z";
        String expResult = "2020-04-21T00:00Z";
        String result = TimeUtil.reformatIsoTime(exampleForm, time);
        assertEquals(expResult, result);
        
        assertEquals( TimeUtil.reformatIsoTime( "2020-01-01T00:00Z", "2020-112Z" ), "2020-04-21T00:00Z" );
        assertEquals( TimeUtil.reformatIsoTime( "2020-010", "2020-020Z" ), "2020-020" );
        assertEquals( TimeUtil.reformatIsoTime( "2020-01-01T00:00Z", "2021-01-01Z" ), "2021-01-01T00:00Z" );
         
    }

    /**
     * Test of monthNameAbbrev method, of class TimeUtil.
     */
    @Test
    public void testMonthNameAbbrev() {
        System.out.println("monthNameAbbrev");
        String expResult = "Mar";
        String result = TimeUtil.monthNameAbbrev(3);
        assertEquals(expResult, result);
    }

    /**
     * Test of monthNameAbbrev method, of class TimeUtil.
     */
    @Test
    public void testMonthNameFull() {
        System.out.println("monthNameFull");
        String expResult = "March";
        String result = TimeUtil.monthNameFull(3);
        assertEquals(expResult, result);
    }    
    
    /**
     * Test of monthNumber method, of class TimeUtil.
     */
    @Test
    public void testMonthNumber() throws Exception {
        System.out.println("monthNumber");
        String s = "December";
        int expResult = 12;
        int result = TimeUtil.monthNumber(s);
        assertEquals(expResult, result);
    }

    /**
     * Test of countOffDays method, of class TimeUtil.
     */
    @Test
    public void testCountOffDays() {
        System.out.println("countOffDays");
        String startTime, stopTime;
        String[] expResult, result;

        startTime = "1999-12-31";
        stopTime = "2000-01-03";
        expResult = new String[] { "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" };
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);

        startTime = "1999-12-31Z";
        stopTime = "2000-01-03Z";
        expResult = new String[] { "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" };
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        
        startTime = "1999-12-31T12:00Z";
        stopTime = "2000-01-03T12:00Z";
        expResult = new String[] { "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" };
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        
        startTime = "1999";
        stopTime = "2000";
        result = TimeUtil.countOffDays(startTime, stopTime);
        assertEquals( result.length, 365 );
        assertEquals( result[0], "1999-01-01Z" );
        assertEquals( result[364], "1999-12-31Z" );
        
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    @Test
    public void testNextDay() {
        System.out.println("nextDay");
        String day = "2019-12-31Z";
        String expResult = "2020-01-01Z";
        String result = TimeUtil.nextDay(day);
        assertEquals(expResult, result);
    }

    /**
     * Test of previousDay method, of class TimeUtil.
     */
    @Test
    public void testPreviousDay() {
        System.out.println("previousDay");
        String day = "2020-01-01";
        String expResult = "2019-12-31Z";
        String result = TimeUtil.previousDay(day);
        assertEquals(expResult, result);
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    @Test
    public void testNextRange() {
        try {
            System.out.println("nextRange");
            int[] tr = TimeUtil.parseISO8601TimeRange("2022-12-05Z/2022-12-15Z");
            String result = TimeUtil.formatIso8601TimeRange(TimeUtil.nextRange(tr));
            String expResult= "2022-12-15/2022-12-25";
            assertEquals(expResult, result);
        } catch (ParseException ex) {
            throw new RuntimeException(ex);
        }
    }
    
    /**
     * Test of nextDay method, of class TimeUtil.
     */
    @Test
    public void testPreviousRange() {
        try {
            System.out.println("previousRange");
            int[] tr = TimeUtil.parseISO8601TimeRange("2022-12-05Z/2022-12-15Z");
            String result = TimeUtil.formatIso8601TimeRange(TimeUtil.previousRange(tr));
            String expResult= "2022-11-25/2022-12-05";
            assertEquals(expResult, result);
        } catch (ParseException ex) {
            throw new RuntimeException(ex);
        }
    }
    
    
    /**
     * Test of ceil method, of class TimeUtil.
     */
    @Test
    public void testCeil() {
        System.out.println("ceil");
        String time = "2000-01-01T00:00";
        String expResult = "2000-01-01T00:00:00.000000000Z";
        String result = TimeUtil.ceil(time);
        assertEquals(expResult, result);
        time = "2000-01-01T23:59";
        expResult = "2000-01-02T00:00:00.000000000Z";
        result = TimeUtil.ceil(time);
        assertEquals(expResult, result);
    }

    /**
     * Test of floor method, of class TimeUtil.
     */
    @Test
    public void testFloor() {
        System.out.println("floor");
        String time = "2000-01-01T00:00";
        String expResult = "2000-01-01T00:00:00.000000000Z";
        String result = TimeUtil.floor(time);
        assertEquals(expResult, result);
        time = "2000-01-01T23:59";
        expResult = "2000-01-01T00:00:00.000000000Z";
        result = TimeUtil.floor(time);
        assertEquals(expResult, result);
    }

    /**
     * Test of normalizeTimeString method, of class TimeUtil.
     */
    @Test
    public void testNormalizeTimeString() {
        System.out.println("normalizeTimeString");
        String time = "2020-03-04T24:00:00Z";
        String expResult = "2020-03-05T00:00:00.000000000Z";
        String result = TimeUtil.normalizeTimeString(time);
        assertEquals(expResult, result);
    }
    
  
    @Test
    public void testNormalizeTime() {
        System.out.println("normalizeTime");
        int[] time;
        int[] expResult;

        time = new int[] { 2000, 1, 1, 24, 0, 0, 0 };
        expResult = new int[] { 2000, 1, 2, 0, 0, 0, 0 };
        TimeUtil.normalizeTime(time);
        assertArrayEquals( expResult, time );
        
        time = new int[] { 2000, 1, 1, -1, 0, 0, 0 };
        expResult = new int[] { 1999, 12, 31, 23, 0, 0, 0 };
        TimeUtil.normalizeTime(time);
        assertArrayEquals( expResult, time );
        
        time = new int[] { 1979, 13, 6, 0, 0, 0, 0 };
        expResult = new int[] { 1980, 1, 6, 0, 0, 0, 0 };
        TimeUtil.normalizeTime(time);
        assertArrayEquals( expResult, time );        
        
        time = new int[] { 1979, 12, 37, 0, 0, 0, 0 };
        expResult = new int[] { 1980, 1, 6, 0, 0, 0, 0 };
        TimeUtil.normalizeTime(time);
        assertArrayEquals( expResult, time );            
    }
    
    /**
     * Test of isoTimeFromArray method, of class TimeUtil.
     */
    @Test
    public void testIsoTimeFromArray() {
        System.out.println("isoTimeFromArray");
        int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  };
        String expResult = "1999-12-31T23:00:00.000000000Z";
        String result = TimeUtil.isoTimeFromArray(nn);
        assertEquals(expResult, result);
        nn = new int[] { 2000, 1, 45, 23, 0, 0, 0  };
        expResult = "2000-02-14T23:00:00.000000000Z";
        result = TimeUtil.isoTimeFromArray(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of isoTimeToArray method, of class TimeUtil.
     */
    @Test
    public void testIsoTimeToArray() {
        System.out.println("isoTimeToArray");
        String time = "";
        int[] expResult = new int[] { 2020, 2, 3, 6, 7, 8, 10001 };
        int[] result = TimeUtil.isoTimeToArray("2020-034T06:07:08.000010001");
        assertArrayEquals(expResult, result);
        expResult = new int[] { 2012, 1, 17, 2, 0, 0, 245000000 };
        result = TimeUtil.isoTimeToArray("2012-01-17T02:00:00.245");
        assertArrayEquals(expResult, result);
        result=TimeUtil.isoTimeToArray("2020-033T06:07:08.000010001");
        result=TimeUtil.isoTimeToArray("2020-03-03Z");
        result=TimeUtil.isoTimeToArray("2020-033Z");
        result=TimeUtil.isoTimeToArray("2020-033");
        result=TimeUtil.isoTimeToArray("2020-033T00:00Z");
        result=TimeUtil.isoTimeToArray("now");
        result=TimeUtil.isoTimeToArray("lastday");
        result=TimeUtil.isoTimeToArray("lastday+PT1H");
        result=TimeUtil.isoTimeToArray("lastminute+PT1M");
    }

    /**
     * Test of dayOfYear method, of class TimeUtil.
     */
    @Test
    public void testDayOfYear() {
        System.out.println("dayOfYear");
        int year = 2000;
        int month = 3;
        int day = 1;
        int expResult = 61;
        int result = TimeUtil.dayOfYear(year, month, day);
        assertEquals(expResult, result);
    }

    /**
     * Test of toMillisecondsSince1970 method, of class TimeUtil.
     */
    @Test
    public void testToMillisecondsSince1970() {
        System.out.println("toMillisecondsSince1970");
        long result = TimeUtil.toMillisecondsSince1970("2000-01-02T00:00:00.0Z");
        assertEquals( 10958,  result / 86400000 ); //  # 10958.0 days
        assertEquals( 0, result % 86400000 );
        result = TimeUtil.toMillisecondsSince1970("2020-07-09T16:35:27Z");
        assertEquals( 1594312527000L, result );
    }

    /**
     * Test of parseISO8601Duration method, of class TimeUtil.
     * @throws java.lang.Exception
     */
    @Test
    public void testParseISO8601Duration() throws Exception {
        System.out.println("parseISO8601Duration");
        String stringIn = "PT5H4M";
        int[] expResult = new int[] { 0, 0, 0, 5, 4, 0, 0 };
        int[] result = TimeUtil.parseISO8601Duration(stringIn);
        assertArrayEquals(expResult, result);
        expResult = new int[] { 0, 0, 0, 0, 0, 0, 123000 };
        result = TimeUtil.parseISO8601Duration("PT0.000123S");
        assertArrayEquals(expResult, result);
        result = TimeUtil.parseISO8601Duration("PT52.000000S"); // Das2 parsing has a problem with this.
        expResult = new int[] { 0, 0, 0, 0, 0, 52, 0 }; 
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of julianDay method, of class TimeUtil.
     */
    @Test
    public void testJulianDay() {
        System.out.println("julianDay");
        int year = 2020;
        int month = 7;
        int day = 9;
        int expResult = 2459040;
        int result = TimeUtil.julianDay(year, month, day);
        assertEquals(expResult, result);
    }
    
    @Test
    public void testMonthForDayOfYear() {
        System.out.println("monthForDayOfYear");
        assertEquals(TimeUtil.monthForDayOfYear(2000,45),2);
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    @Test
    public void testFromJulianDay() {
        System.out.println("fromJulianDay");
        int julian = 2459040;
        int[] expResult = new int[] { 2020, 7, 9, 0, 0, 0, 0 };
        int[] result = TimeUtil.fromJulianDay(julian);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    @Test
    public void testFromMillisecondsSince1970() {
        System.out.println("fromMillisecondsSince1970");
        String s= TimeUtil.fromMillisecondsSince1970(0);
        assertEquals( s, "1970-01-01T00:00:00.000Z");
        s= TimeUtil.fromMillisecondsSince1970(2208988800000L);
        assertEquals( s, "2040-01-01T00:00:00.000Z");
        s= TimeUtil.fromMillisecondsSince1970(1);
        assertEquals( s, "1970-01-01T00:00:00.001Z");
    }
    
    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    @Test
    public void testFromTT2000() {
        System.out.println("fromTT2000");
        String s= TimeUtil.fromTT2000(0);
        assertEquals( s, "2000-01-01T11:58:55.816000000Z");
        s= TimeUtil.fromTT2000(631108869184000000L);
        assertEquals( s, "2020-01-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(-583934347816000000L);
        assertEquals( s, "1981-07-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(-31579135816000000L);
        assertEquals( s, "1999-01-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(-63115136816000000L);
        assertEquals( s, "1998-01-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(-94651137816000000L);
        assertEquals( s, "1997-01-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(-631195148816000000L);
        assertEquals( s, "1980-01-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(394372867184000000L);
        assertEquals( s, "2012-07-01T00:00:00.000000000Z");
        s= TimeUtil.fromTT2000(394372866184000000L);
        assertEquals( s, "2012-06-30T23:59:60.000000000Z");  
        s= TimeUtil.fromTT2000(394372865684000000L);
        assertEquals( s, "2012-06-30T23:59:59.500000000Z");  
    }    
    /**
     * Test of subtract method, of class TimeUtil.
     */
    @Test
    public void testSubtract() {
        System.out.println("subtract");
        int[] base = new int[] { 2020, 7, 9, 1, 0, 0, 0 };
        int[] offset = new int[] { 0, 0, 0, 2, 0, 0, 0 };
        int[] expResult = new int[] { 2020, 7, 8, 23, 0, 0, 0 };
        int[] result = TimeUtil.subtract(base, offset);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of add method, of class TimeUtil.
     */
    @Test
    public void testAdd() {
        System.out.println("add");
        int[] base = new int[] { 2020, 7, 8, 23, 0, 0, 0 };
        int[] offset = new int[] { 0, 0, 0, 2, 0, 0, 0 };
        int[] expResult = new int[] { 2020, 7, 9, 1, 0, 0, 0 };
        int[] result = TimeUtil.add(base, offset);
        assertArrayEquals(expResult, result);
        
        base= new int[] { 1979, 12, 27, 0, 0, 0, 0 };
        offset= new int[] { 0, 0, 10, 0, 0, 0, 0 };
        expResult = new int[] { 1980, 1, 6, 0, 0, 0, 0 };
        result = TimeUtil.add(base, offset);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Duration method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601Duration() {
        System.out.println("formatIso8601Duration");
        int[] nn = new int[] { 0, 0, 7, 0, 0, 6 };
        String expResult = "P7DT6S";
        String result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        
        nn = new int[] { 0, 0, 0, 0, 0, 0, 200000 };
        expResult = "PT0.000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);

        nn = new int[] { 0, 0, 0, 0, 0, 0, 200000000 };
        expResult = "PT0.200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);

        nn = new int[] { 0, 0, 0, 0, 0, 0, 200 };
        expResult = "PT0.000000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);        

        nn = new int[] { 0, 0, 0, 0, 0, 2, 200000 };
        expResult = "PT2.000200S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);

        nn = new int[] { 0, 0, 0, 0, 0, 0, 0 };
        expResult = "PT0S";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);

        nn = new int[] { 0, 0, 1, 0, 0, 0, 0 };
        expResult = "P1D";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);
        
        nn = new int[] { 0, 0 };
        expResult = "P0D";
        result = TimeUtil.formatIso8601Duration(nn);
        assertEquals(expResult, result);

    }

    /**
     * Test of now method, of class TimeUtil.
     */
    @Test
    public void testNow() {
        System.out.println("now");
        int[] result= TimeUtil.now();
    }

    /**
     * Test of parseISO8601TimeRange method, of class TimeUtil.
     */
    @Test
    public void testParseISO8601TimeRange() {
        System.out.println("parseISO8601TimeRange");
        int[] result;

        String stringIn;
        int[] expResult;
        
        stringIn = "1998-01-02/1998-01-17";
        expResult = new int[] { 1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        
        stringIn = "2022-W13/P7D";
        expResult = new int[] { 2022, 3, 28, 0, 0, 0, 0, 2022, 4, 4, 0, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        

        stringIn = "P7D/2022-01-02";
        expResult = new int[] { 2021, 12, 26, 0, 0, 0, 0, 2022, 1, 2, 0, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        
        stringIn = "2023-01-18T17:00/18:00";
        expResult = new int[] { 2023, 1, 18, 17, 0, 0, 0, 2023, 1, 18, 18, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        
        stringIn = "2013-01-01/07-01";
        expResult = new int[] { 2013, 1, 1, 0, 0, 0, 0, 2013, 7, 1, 0, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        
        stringIn = "2017-09-13T13:06Z/2023-09-30T23:57:41Z";
        expResult = new int[] { 2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 57, 41, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
        
        stringIn = "2017-09-13T13:06:00Z/2023-09-30T23:00Z";
        expResult = new int[] { 2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 0, 0, 0 };
        try {
            result = TimeUtil.parseISO8601TimeRange(stringIn);
            assertArrayEquals(expResult, result);
        } catch (ParseException ex) {
            throw new AssertionError(ex);
        }
    }

    /**
     * Test of formatIso8601TimeRange method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeRange() {
        System.out.println("formatIso8601TimeRange");
        int[] nn =  new int[] { 1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0 };
        String expResult = "1998-01-02/1998-01-17";
        String result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);

        nn =  new int[] { 1998, 1, 2, 0, 3, 0, 0, 1998, 1, 17, 0, 3, 0, 0 };
        expResult = "1998-01-02T00:03Z/1998-01-17T00:03Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);

        nn =  new int[] { 1998, 1, 2, 0, 0, 2, 0, 1998, 1, 17, 0, 0, 6, 0 };
        expResult = "1998-01-02T00:00:02Z/1998-01-17T00:00:06Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
        
        nn =  new int[] { 1998, 1, 2, 0, 0, 0, 300, 1998, 1, 2, 0, 0, 0, 500 };
        expResult = "1998-01-02T00:00:00.000000300Z/1998-01-02T00:00:00.000000500Z";
        result = TimeUtil.formatIso8601TimeRange(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeInTimeRange() {
        System.out.println("formatIso8601Time");
        int[] nn = new int[] { 1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0 };
        int offset = 7;
        String expResult = "1998-01-17T00:00:00.000000000Z";
        String result = TimeUtil.formatIso8601TimeInTimeRange(nn, offset);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeInTime() {
        System.out.println("formatIso8601Time");
        int[] nn = new int[] { 1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0 };
        String expResult = "1998-01-02T00:00:00.000000000Z";
        String result = TimeUtil.formatIso8601Time(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of dayOfWeek method, of class TimeUtil.
     */
    @Test
    public void testDayOfWeek() {
        System.out.println("dayOfWeek");
        int year = 2022;
        int month = 3;
        int day = 12;
        int expResult = 5;
        int result = TimeUtil.dayOfWeek(year, month, day);
        assertEquals(expResult, result);

    }

    /**
     * Test of fromWeekOfYear method, of class TimeUtil.
     */
    @Test
    public void testFromWeekOfYear() {
        System.out.println("fromWeekOfYear");
        int year = 2022;
        int weekOfYear = 13;
        int[] result = new int[7];
        TimeUtil.fromWeekOfYear(year, weekOfYear, result);
        int[] expResult = new int[] { 2022, 3, 28, 0, 0, 0, 0 };
        assertArrayEquals(expResult, result);        

        year = 2022;
        weekOfYear = 0;
        result = new int[7];
        TimeUtil.fromWeekOfYear(year, weekOfYear, result);
        expResult = new int[] { 2021, 12, 27, 0, 0, 0, 0 };
        assertArrayEquals(expResult, result);        

    }

    /**
     * Test of parseISO8601Time method, of class TimeUtil.
     */
    @Test
    public void testParseISO8601Time() {
        System.out.println("parseISO8601Time");
        String string = "2020-033T00:00";
        int[] expResult = new int[] { 2020, 2, 2, 0, 0, 0, 0 };
        try {
            int[] result = TimeUtil.parseISO8601Time(string);
            assertArrayEquals(expResult, result);
        } catch ( ParseException ex ) {
            throw new AssertionError(ex);
        }
    }

    /**
     * Test of getStartTime method, of class TimeUtil.
     */
    @Test
    public void testGetStartTime() {
        System.out.println("getStartTime");
        int[] timerange = new int[] { 2025, 2, 4, 5, 6, 7, 8,  2025, 2, 4, 7, 8, 9, 10 } ;
        int[] expResult = new int[] { 2025, 2, 4, 5, 6, 7, 8 };
        int[] result = TimeUtil.getStartTime(timerange);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of getStopTime method, of class TimeUtil.
     */
    @Test
    public void testGetStopTime() {
        System.out.println("getStopTime");
        int[] timerange = new int[] { 2025, 2, 4, 5, 6, 7, 8,  2025, 2, 4, 7, 8, 9, 10 } ;
        int[] expResult = new int[] { 2025, 2, 4, 7, 8, 9, 10 };
        int[] result = TimeUtil.getStopTime(timerange);
        assertArrayEquals(expResult, result);    
    }

    /**
     * Test of leapSecondsAt method, of class TimeUtil.
     */
    @Test
    public void testLeapSecondsAt() {
        System.out.println("leapSecondsAt");
        long tt2000 = 0L;
        int expResult = 32;
        int result = TimeUtil.leapSecondsAt(tt2000);
        assertEquals(expResult, result);
        result= TimeUtil.leapSecondsAt(536500869184000000L);
        assertEquals(37,result);
    }

    /**
     * Test of lastLeapSecond method, of class TimeUtil.
     */
    @Test
    public void testLastLeapSecond() {
        System.out.println("lastLeapSecond");
        long tt2000 = 0L;
        long expResult = -31579135816000000L;
        long result = TimeUtil.lastLeapSecond(tt2000);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatHMSN method, of class TimeUtil.
     */
    @Test
    public void testFormatHMSN() {
        System.out.println("formatHMSN");
        long nanosecondsSinceMidnight = 56L;
        String expResult = "00:00:00.000000056";
        String result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
        
        nanosecondsSinceMidnight = 3600*24L * 1000000000;
        expResult = "23:59:60.000000000";
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
        
        nanosecondsSinceMidnight = 3600*24L * 1000000000 + 1 * 1000000000L + 500 * 1000000L;
        expResult = "23:59:61.500000000";
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight);
        assertEquals(expResult, result);
    }

    @Test
    public void testDaysInMonth() {
        System.out.println("daysInMonth");
        int year = 2000;
        int month = 2;
        int expResult = 29;
        int result = TimeUtil.daysInMonth(year, month);
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

    /**
     * Test of setStartTime method, of class TimeUtil.
     */
    @Test
    public void testSetStartTime() {
        System.out.println("setStartTime");
        int[] time = new int[] { 2000, 1, 1, 2, 3, 4, 900000 };
        int[] timerange = new int[14];
        TimeUtil.setStartTime(time, timerange);
        assertArrayEquals( time, Arrays.copyOfRange( timerange, 0, 7 ) );
    }

    /**
     * Test of setStopTime method, of class TimeUtil.
     */
    @Test
    public void testSetStopTime() {
        System.out.println("setStopTime");
        System.out.println("setStopTime");
        int[] time = new int[] { 2000, 1, 1, 2, 3, 4, 900000 };
        int[] timerange = new int[14];
        TimeUtil.setStopTime(time, timerange);
        assertArrayEquals( time, Arrays.copyOfRange( timerange, 7, 14 ) );
    }

    /**
     * Test of fromSecondsSince1970 method, of class TimeUtil.
     */
    @Test
    public void testFromSecondsSince1970() {
        System.out.println("fromSecondsSince1970");
        double time = 0.0;
        String expResult = "1970-01-01T00:00:00.000Z";
        String result = TimeUtil.fromSecondsSince1970(time);
        assertEquals(expResult, result);
        time = 1707868800.5;
        expResult = "2024-02-14T00:00:00.500Z";
        result = TimeUtil.fromSecondsSince1970(time);
        assertEquals(expResult, result);
    }

    /**
     * Test of createTimeRange method, of class TimeUtil.
     */
    @Test
    public void testCreateTimeRange() {
        System.out.println("createTimeRange");
        int[] t1 = new int[] { 2024, 2, 14, 3, 4, 5, 0 };
        int[] t2 = new int[] { 2024, 2, 14, 6, 4, 5, 0 };
        int[] expResult = new int[] { 2024, 2, 14, 3, 4, 5, 0, 2024, 2, 14, 6, 4, 5, 0 };
        int[] result = TimeUtil.createTimeRange(t1, t2);
        assertArrayEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601Time_intArr_int() {
        System.out.println("formatIso8601Time");
        int[] time = new int[] { 2024, 2, 14, 3, 4, 5, 0, 2024, 2, 14, 6, 4, 5, 0 };
        int offset = TimeUtil.TIME_DIGITS;
        String expResult = "2024-02-14T06:04:05.000000000Z";
        String result = TimeUtil.formatIso8601Time(time, offset);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601Time method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601Time_intArr() {
        System.out.println("formatIso8601Time");
        int[] nn = new int[] { 2024, 2, 14, 6, 4, 5, 0 };
        String expResult = "2024-02-14T06:04:05.000000000Z";
        String result = TimeUtil.formatIso8601Time(nn);
        assertEquals(expResult, result);
    }

    /**
     * Test of isValidTime method, of class TimeUtil.
     */
    @Test
    public void testIsValidTime() {
        System.out.println("isValidTime");
        
        int[] time = new int[] { 2024, 2, 15, 3, 4, 5, 600000000 };
        boolean expResult = true;
        boolean result = TimeUtil.isValidTime(time);
        assertEquals(expResult, result);
        
        time = new int[] { 9999, 2, 15, 3, 4, 5, 600000000 };
        expResult = false;
        try {
            result = TimeUtil.isValidTime(time);
            fail("should not be valid");
        } catch ( IllegalArgumentException ex ) {
            
        }
        
        time = new int[] { 2024, 1, 245, 3, 4, 5, 600000000 };
        expResult = true;
        result = TimeUtil.isValidTime(time);
        assertEquals(expResult, result);        
    }

    /**
     * Test of isValidFormattedTime method, of class TimeUtil.
     */
    @Test
    public void testIsValidFormattedTime() {
        System.out.println("isValidFormattedTime");
        String time = "2024-02-14T00:00Z";
        boolean expResult = true;
        boolean result = TimeUtil.isValidFormattedTime(time);
        assertEquals(expResult, result);

        time= "now-P1D";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "2000";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "2000-01";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "now";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "lastyear";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "lastmonth";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "lastday";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "lasthour";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "now-P1D";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
        time= "lastday-P1D";
        result = TimeUtil.isValidFormattedTime(time);
        assertEquals( true, result);
    }

    /**
     * Test of gt method, of class TimeUtil.
     */
    @Test
    public void testGt() {
        System.out.println("gt");
        int[] t1 = new int[] { 2024, 1, 1, 0, 0, 0, 0 };
        int[] t2 = new int[] { 2024, 1, 1, 0, 0, 0, 1 };
        boolean expResult = false;
        boolean result = TimeUtil.gt(t1, t2);
        assertEquals(expResult, result);
        
        expResult = true;
        result = TimeUtil.gt(t2, t1);
        assertEquals(expResult, result);
        
        expResult = false;
        result = TimeUtil.gt(t1, t1);
        assertEquals(expResult, result);
    }

    /**
     * Test of eq method, of class TimeUtil.
     */
    @Test
    public void testEq() {
        System.out.println("eq");
        int[] t1 = new int[] { 2024, 1, 1, 0, 0, 0, 0 };
        int[] t2 = new int[] { 2024, 1, 1, 0, 0, 0, 1 };
        boolean expResult = false;
        boolean result = TimeUtil.eq(t1, t2);
        assertEquals(expResult, result);
        
        expResult = false;
        result = TimeUtil.eq(t2, t1);
        assertEquals(expResult, result);
        
        expResult = true;
        result = TimeUtil.eq(t1, t1);
        assertEquals(expResult, result);
    }

    /**
     * Test of formatIso8601TimeBrief method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeBrief_intArr() {
        System.out.println("formatIso8601TimeBrief");
        int[] time = new int[] { 2000, 1, 1, 0, 0, 0, 0 };
        String expResult = "2000-01-01T00:00Z";
        String result = TimeUtil.formatIso8601TimeBrief(time);
        assertEquals(expResult, result);
        
        time = new int[] { 2000, 1, 1, 0, 0, 1, 0 };
        expResult = "2000-01-01T00:00:01Z";
        result = TimeUtil.formatIso8601TimeBrief(time);
        assertEquals(expResult, result);
        
        time = new int[] { 2000, 1, 1, 0, 0, 1, 500000000 };
        expResult = "2000-01-01T00:00:01.500Z";
        result = TimeUtil.formatIso8601TimeBrief(time);
        assertEquals(expResult, result);        
        
        time = new int[] { 2000, 1, 1, 0, 0, 1, 500500000 };
        expResult = "2000-01-01T00:00:01.500500Z";
        result = TimeUtil.formatIso8601TimeBrief(time);
        assertEquals(expResult, result);        
    }

    /**
     * Test of formatIso8601TimeBrief method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeBrief_intArr_int() {
        System.out.println("formatIso8601TimeBrief");
        int[] time = new int[] { 1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0 };
        String expResult = "1999-01-01T00:00Z";
        String result = TimeUtil.formatIso8601TimeBrief(time,0);
        assertEquals(expResult, result);
        
        time = new int[] { 1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 1, 0 };
        expResult = "2000-01-01T00:00:01Z";
        result = TimeUtil.formatIso8601TimeBrief(time,TimeUtil.TIME_DIGITS);
        assertEquals(expResult, result);
        
    }

    /**
     * Test of formatIso8601TimeInTimeRangeBrief method, of class TimeUtil.
     */
    @Test
    public void testFormatIso8601TimeInTimeRangeBrief() {
        System.out.println("formatIso8601TimeInTimeRangeBrief");
        int[] time = new int[] { 1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0 };
        String expResult = "1999-01-01T00:00Z";
        String result = TimeUtil.formatIso8601TimeInTimeRangeBrief(time,0);
        assertEquals(expResult, result);
        
        time = new int[] { 1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 1, 0 };
        expResult = "2000-01-01T00:00:01Z";
        result = TimeUtil.formatIso8601TimeInTimeRangeBrief(time,TimeUtil.TIME_DIGITS);
        assertEquals(expResult, result);
    }

    /**
     * Test of isValidTimeRange method, of class TimeUtil.
     */
    @Test
    public void testIsValidTimeRange() {
        System.out.println("isValidTimeRange");
        int[] timerange = new int[] { 1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0 };
        boolean expResult = true;
        boolean result = TimeUtil.isValidTimeRange(timerange);
        assertEquals(expResult, result);

        timerange = new int[] { 2000, 1, 1, 0, 0, 0, 0, 1999, 1, 1, 0, 0, 0, 0 };
        expResult = false;
        result = TimeUtil.isValidTimeRange(timerange);
        assertEquals(expResult, result);

        timerange = new int[] { 2000, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0 };
        expResult = false;
        result = TimeUtil.isValidTimeRange(timerange);
        assertEquals(expResult, result);
        
    }

}
