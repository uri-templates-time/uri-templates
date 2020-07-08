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
        int i = 0;
        String expResult = "";
        String result = TimeUtil.monthNameAbbrev(i);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of monthNumber method, of class TimeUtil.
     */
    @Test
    public void testMonthNumber() throws Exception {
        System.out.println("monthNumber");
        String s = "";
        int expResult = 0;
        int result = TimeUtil.monthNumber(s);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of countOffDays method, of class TimeUtil.
     */
    @Test
    public void testCountOffDays() {
        System.out.println("countOffDays");
        String startTime = "";
        String stopTime = "";
        String[] expResult = null;
        String[] result = TimeUtil.countOffDays(startTime, stopTime);
        assertArrayEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of nextDay method, of class TimeUtil.
     */
    @Test
    public void testNextDay() {
        System.out.println("nextDay");
        String day = "";
        String expResult = "";
        String result = TimeUtil.nextDay(day);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of previousDay method, of class TimeUtil.
     */
    @Test
    public void testPreviousDay() {
        System.out.println("previousDay");
        String day = "";
        String expResult = "";
        String result = TimeUtil.previousDay(day);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of ceil method, of class TimeUtil.
     */
    @Test
    public void testCeil() {
        System.out.println("ceil");
        String time = "";
        String expResult = "";
        String result = TimeUtil.ceil(time);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of floor method, of class TimeUtil.
     */
    @Test
    public void testFloor() {
        System.out.println("floor");
        String time = "";
        String expResult = "";
        String result = TimeUtil.floor(time);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of normalizeTimeString method, of class TimeUtil.
     */
    @Test
    public void testNormalizeTimeString() {
        System.out.println("normalizeTimeString");
        String time = "";
        String expResult = "";
        String result = TimeUtil.normalizeTimeString(time);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
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
        int[] nn = null;
        String expResult = "";
        String result = TimeUtil.isoTimeFromArray(nn);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
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
        int year = 0;
        int month = 0;
        int day = 0;
        int expResult = 0;
        int result = TimeUtil.dayOfYear(year, month, day);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of toMillisecondsSince1970 method, of class TimeUtil.
     */
    @Test
    public void testToMillisecondsSince1970() {
        System.out.println("toMillisecondsSince1970");
        String time = "";
        long expResult = 0L;
        long result = TimeUtil.toMillisecondsSince1970(time);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of parseISO8601Duration method, of class TimeUtil.
     */
    @Test
    public void testParseISO8601Duration() throws Exception {
        System.out.println("parseISO8601Duration");
        String stringIn = "";
        int[] expResult = null;
        int[] result = TimeUtil.parseISO8601Duration(stringIn);
        assertArrayEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of julianDay method, of class TimeUtil.
     */
    @Test
    public void testJulianDay() {
        System.out.println("julianDay");
        int year = 0;
        int month = 0;
        int day = 0;
        int expResult = 0;
        int result = TimeUtil.julianDay(year, month, day);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of fromJulianDay method, of class TimeUtil.
     */
    @Test
    public void testFromJulianDay() {
        System.out.println("fromJulianDay");
        int julian = 0;
        int[] expResult = null;
        int[] result = TimeUtil.fromJulianDay(julian);
        assertArrayEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of subtract method, of class TimeUtil.
     */
    @Test
    public void testSubtract() {
        System.out.println("subtract");
        int[] base = null;
        int[] offset = null;
        int[] expResult = null;
        int[] result = TimeUtil.subtract(base, offset);
        assertArrayEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of add method, of class TimeUtil.
     */
    @Test
    public void testAdd() {
        System.out.println("add");
        int[] base = null;
        int[] offset = null;
        int[] expResult = null;
        int[] result = TimeUtil.add(base, offset);
        assertArrayEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }
    
}
