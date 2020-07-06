
package org.hapiserver;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Date;

/**
 * Utilities for times in IsoTime strings (limited set of ISO8601 times)
 * Examples of isoTime strings include:<ul>
 * <li>2020-04-21Z
 * <li>2020-04-21T12:20Z
 * <li>2020-04-21T23:45:67.000000001Z  (nanosecond limit)
 * <li>2020-112Z (day-of-year instead of $Y-$m-$d)
 * <li>2020-112T23:45:67.000000001 (note Z is assumed)
 * </ul>
 * @author jbf
 */
public class TimeUtil {

    /**
     * Rewrite the time using the format of the example time.  For example,
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
     * }
     * </pre>
     * This allows direct comparisons of times for sorting.
     * TODO: there's an optimization here, where if input and output are both $Y-$j or
     * both $Y-$m-$d, then we need not break apart and recombine the time 
     * (isoTimeToArray call can be avoided).
     * 
     * @param exampleForm isoTime string.
     * @param time the time in any allowed isoTime format
     * @return same time but in the same form as exampleForm.
     */
    public static String reformatIsoTime(String exampleForm, String time) {
        char c = exampleForm.charAt(8);
        int[] nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time));
        switch (c) {
            case 'T':
                // $Y-$jT
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = String.format("%d-%03dT%02d:%02d:%02d.%09dZ", nn[0], nn[2], nn[3], nn[4], nn[5], nn[6]);
                break;
            case 'Z':
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = String.format("%d-%03dZ", nn[0], nn[2]);
                break;
            default:
                if ( exampleForm.length()==10 ) {
                    c= 'Z';
                } else {
                    c = exampleForm.charAt(10);
                }
                if (c == 'T') {
                    // $Y-$jT
                    time = String.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
                } else if (c == 'Z') {
                    time = String.format("%d-%02d-%02dZ", nn[0], nn[1], nn[2]);
                }
                break;
        }
        if (exampleForm.endsWith("Z")) {
            return time.substring(0, exampleForm.length() - 1) + "Z";
        } else {
            return time.substring(0, exampleForm.length());
        }
    }

    private TimeUtil() {
        // this class is not instanciated.
    }
    
    private final static int[][] DAYS_IN_MONTH = {
        {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0},
        {0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0}
    };
    
    private final static int[][] DAY_OFFSET = {
        {0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365},
        {0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366}
    };
    
    /**
     * count off the days between startTime and stopTime, but not including
     * stopTime.
     * @param startTime an iso time string
     * @param stopTime an iso time string
     * @return array of times, complete days, in the form $Y-$m-$d
     */
    public static String[] countOffDays(String startTime, String stopTime) {
        if (stopTime.length() < 10 || Character.isDigit(stopTime.charAt(10))) {
            throw new IllegalArgumentException("arguments must be $Y-$m-$dZ");
        }
        ArrayList<String> result = new ArrayList();
        String time = normalizeTimeString(startTime).substring(0, 10) + 'Z';
        stopTime = ceil(stopTime).substring(0, 10) + 'Z';
        while (time.compareTo(stopTime) < 0) {
            result.add(time.substring(0));
            time = nextDay(time);
        }
        return result.toArray(new String[result.size()]);
    }

    private static boolean isLeapYear(int year) {
        if (year < 1800 || year > 2400) {
            throw new IllegalArgumentException("year must be between 1800 and 2400");
        }
        return (year % 4) == 0 && (year % 400 == 0 || year % 100 != 0);
    }

    /**
     * return the next day boundary.  Note hours, minutes, seconds and nanoseconds are ignored.
     * @param day any isoTime format string.
     * @return the next day in $Y-$m-$dZ
     * @see #ceil(java.lang.String) 
     * @see #previousDay(java.lang.String) 
     */
    public static String nextDay(String day) {
        int[] nn = isoTimeToArray(day);
        nn[2] = nn[2] + 1;
        normalizeTime(nn);
        return String.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
    }

    /**
     * return the previous day boundary.  Note hours, minutes, seconds and nanoseconds are ignored.
     * @param day any isoTime format string.
     * @return the next day in $Y-$m-$dZ
     * @see #floor(java.lang.String) 
     * @see #nextDay(java.lang.String) 
     */
    public static String previousDay(String day) {
        int[] nn = isoTimeToArray(day);
        nn[2] = nn[2] - 1;
        normalizeTime(nn);
        return String.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
    }
    
    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or
     * the same value (normalized) if we are already at a boundary.
     * @param time any isoTime format string.
     * @return the next midnight or the value if already at midnight.
     */
    public static String ceil(String time) {
        time = normalizeTimeString(time);
        if (time.substring(11).equals("00:00:00.000000000Z")) {
            return time;
        } else {
            return nextDay(time.substring(0, 11)).substring(0, 10) + "T00:00:00.000000000Z";
        }
    }

    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or
     * the same value (normalized) if we are already at a boundary.
     * @param time any isoTime format string.
     * @return the previous midnight or the value if already at midnight.
     */
    public static String floor(String time) {
        time = normalizeTimeString(time);
        if (time.substring(11).equals("00:00:00.000000000Z")) {
            return time;
        } else {
            return time.substring(0, 10) + "T00:00:00.000000000Z";
        }
    }
    
    /**
     * return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
     * @param time any isoTime format string.
     * @return the time in standard form.
     */
    public static String normalizeTimeString(String time) {
        int[] nn = isoTimeToArray(time);
        return String.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    }

    /**
     * fast parser requires that each character of string is a digit.
     * @param s
     * @return
     */
    private static int parseInt(String s) {
        int result;
        switch (s.length()) {
            case 2:
                result = 10 * (s.charAt(0) - 48) + (s.charAt(1) - 48);
                return result;
            case 3:
                result = 100 * (s.charAt(0) - 48) + 10 * (s.charAt(1) - 48) + (s.charAt(2) - 48);
                return result;
            default:
                result = 0;
                for (int i = 0; i < s.length(); i++) {
                    result = 10 * result + (s.charAt(i) - 48);
                }
                return result;
        }
    }

    /**
     * return array [ year, months, days, hours, minutes, seconds, nanoseconds ]
     * preserving the day of year notation if this was used.
     * @param time isoTime to decompose
     * @return the decomposed time
     */
    public static int[] isoTimeToArray(String time) {
        int[] result;
        if (time.length() == 4) {
            result = new int[]{Integer.parseInt(time), 1, 1, 0, 0, 0, 0};
        } else {
            if (time.length() < 8) {
                throw new IllegalArgumentException("time must have 4 or greater than 7 elements");
            }
            if (time.charAt(8) == 'T') {
                result = new int[]{parseInt(time.substring(0, 4)), 1, parseInt(time.substring(5, 8)), // days
                0, 0, 0, 0};
                time = time.substring(9);
            } else {
                result = new int[]{parseInt(time.substring(0, 4)), parseInt(time.substring(5, 7)), parseInt(time.substring(8, 10)), 0, 0, 0, 0};
                time = time.substring(11);
            }
            if (time.endsWith("Z")) {
                time = time.substring(0, time.length() - 1);
            }
            if (time.length() >= 2) {
                result[3] = parseInt(time.substring(0, 2));
            }
            if (time.length() >= 5) {
                result[4] = parseInt(time.substring(3, 5));
            }
            if (time.length() >= 8) {
                result[5] = parseInt(time.substring(6, 8));
            }
            if (time.length() > 9) {
                result[6] = (int) (Math.pow(10, 18 - time.length())) * parseInt(time.substring(9));
            }
            normalizeTime(result);
        }
        return result;
    }

    /**
     * return the doy of year of the month and day for the year.  For example, in Jython:
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * print dayOfYear( 2020, 4, 21 ) # 112
     * }
     * </pre>
     * @param year the year
     * @param month the month, from 1 to 12.
     * @param day the day in the month.
     * @return the day of year.
     */
    public static int dayOfYear(int year, int month, int day) {
        if (month == 1) {
            return day;
        }
        if (month < 1) {
            throw new IllegalArgumentException("month must be greater than 0.");
        }
        if (month > 12) {
            throw new IllegalArgumentException("month must be less than 12.");
        }
        if ( day>366 ) {
            throw new IllegalArgumentException("day ("+day+") must be less than 366.");
        }
        int leap = isLeapYear(year) ? 1 : 0;
        return DAY_OFFSET[leap][month] + day;
    }

    /**
     * return the time as milliseconds since 1970-01-01T00:00Z.  This
     * does not include leap seconds.  For example, in Jython:
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * x= toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
     * print x / 86400000   # 10958.0 days
     * print x % 86400000   # and no milliseconds
     * }
     * </pre>
     * @param time the isoTime, which is parsed using DateTimeFormatter.ISO_INSTANT.parse.
     * @return number of non-leap-second milliseconds since 1970-01-01T00:00Z.
     * @see DateTimeFormatter#parse 
     */
    public static long toMillisecondsSince1970(String time) {
        time= normalizeTimeString(time);
        TemporalAccessor ta = DateTimeFormatter.ISO_INSTANT.parse(time);
        Instant i = Instant.from(ta);
        Date d = Date.from(i);
        return d.getTime();
    }

    /**
     * normalize the decomposed time by expressing day of year and month
     * and day of month, and moving hour="24" into the next day. This
     * also handles day increment or decrements, by:<ul>
     * <li>handle day=0 by decrementing month and adding the days in the new month.
     * <li>handle day=32 by incrementing month.
     * </ul>
     * @param time
     */
    private static void normalizeTime(int[] time) {
        if (time[3] == 24) {
            time[2] += 1;
            time[3] = 0;
        }
        if (time[3] > 24) {
            throw new IllegalArgumentException("time[3] is greater than 24 (hours)");
        }
        if (time[1] > 12) {
            throw new IllegalArgumentException("time[1] is greater than 12 (months)");
        }
        if (time[1] == 12 && time[2] == 32) {
            time[0] = time[0] + 1;
            time[1] = 1;
            time[2] = 1;
            return;
        }
        int leap = isLeapYear(time[0]) ? 1 : 0;
        if ( time[2]==0 ) {
            time[1]= time[1]-1;
            if ( time[1]==0 ) {
                time[0]= time[0]-1;
                time[1]= 12;
            }
            time[2]= TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        }
        int d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        while (time[2] > d) {
            time[1]++;
            time[2] -= d;
            d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
            if (time[1] > 12) {
                throw new IllegalArgumentException("time[2] is too big");
            }
        }
    }
    
}