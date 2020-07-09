/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.hapiserver;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
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
        String startTime = "1999-12-31Z";
        String stopTime = "2000-01-03Z";
        String[] expResult = new String[] { "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" };
        String[] result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
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
        TimeUtil.isoTimeToArray("2020-033T06:07:08.000010001");
        TimeUtil.isoTimeToArray("2020-03-03Z");
        TimeUtil.isoTimeToArray("2020-033Z");
        TimeUtil.isoTimeToArray("2020-033");
        TimeUtil.isoTimeToArray("2020-033T00:00Z");
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
    }

    /**
     * Test of parseISO8601Duration method, of class TimeUtil.
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
    }
    
}
