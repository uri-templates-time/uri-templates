package org.hapiserver;

import java.text.ParseException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Date;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utilities for times in IsoTime strings (limited set of ISO8601 times)
 * Examples of isoTime strings include:<ul>
 * <li>2020-04-21Z
 * <li>2020-04-21T12:20Z
 * <li>2020-04-21T23:45:67.000000001Z (nanosecond limit)
 * <li>2020-112Z (day-of-year instead of $Y-$m-$d)
 * <li>2020-112T23:45:67.000000001 (note Z is assumed)
 * </ul>
 *
 * @author jbf
 */
public class TimeUtil {

    private static final Logger logger = Logger.getLogger("hapiserver.timeutil");

    /**
     * Rewrite the time using the format of the example time. For example,
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
     * }
     * </pre> This allows direct comparisons of times for sorting. TODO: there's
     * an optimization here, where if input and output are both $Y-$j or both
     * $Y-$m-$d, then we need not break apart and recombine the time
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
                if (exampleForm.length() == 10) {
                    c = 'Z';
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

    private static String[] monthNames = {
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    };

    /**
     * return the English month name, abbreviated to three letters, for the
     * month number.
     *
     * @param i month number, from 1 to 12.
     * @return the month name, like "Jan" or "Dec"
     */
    public static String monthNameAbbrev(int i) {
        return monthNames[i - 1];
    }

    /**
     * return the month number for the English month name, such as "Jan" (1) or
     * "December" (12). The first three letters are used to look up the number.
     *
     * @param s the name (case-insensitive, only the first three letters are
     * used.
     * @return the number, for example 1 for "January"
     * @throws ParseException
     */
    public static int monthNumber(String s) throws ParseException {
        if (s.length() < 3) {
            throw new ParseException("need at least three letters", 0);
        }
        s = s.substring(0, 3);
        for (int i = 0; i < 12; i++) {
            if (s.equalsIgnoreCase(monthNames[i])) {
                return i + 1;
            }
        }
        throw new ParseException("Unable to parse month", 0);
    }

    private TimeUtil() {
        // this class is not instanciated.
    }

    /**
     * the number of days in each month.
     */
    private final static int[][] DAYS_IN_MONTH = {
        {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0},
        {0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0}
    };

    /**
     * the number of days to the first of each month.
     */
    private final static int[][] DAY_OFFSET = {
        {0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365},
        {0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366}
    };

    /**
     * count off the days between startTime and stopTime, but not including
     * stopTime.
     *
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
     * return the next day boundary. Note hours, minutes, seconds and
     * nanoseconds are ignored.
     *
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
     * return the previous day boundary. Note hours, minutes, seconds and
     * nanoseconds are ignored.
     *
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
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
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
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
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
     *
     * @param time any isoTime format string.
     * @return the time in standard form.
     */
    public static String normalizeTimeString(String time) {
        int[] nn = isoTimeToArray(time);
        return String.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    }

    /**
     * fast parser requires that each character of string is a digit.
     *
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
     * fast parser requires that each character of string is a digit.
     *
     * @param s the number, containing 1 or more digits.
     * @return the int value
     */
    private static int parseInt(String s, int deft) {
        if (s == null) {
            return deft;
        }
        int result;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c < 48 || c >= 58) {
                throw new IllegalArgumentException("only digits are allowed in string");
            }
        }
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

    private static double parseDouble(String val, double deft) {
        if (val == null) {
            if (deft != -99) {
                return deft;
            } else {
                throw new IllegalArgumentException("bad digit");
            }
        }
        int n = val.length() - 1;
        if (Character.isLetter(val.charAt(n))) {
            return Double.parseDouble(val.substring(0, n));
        } else {
            return Double.parseDouble(val);
        }
    }

    /**
     * return the array formatted as
     *
     * @param nn the decomposed time
     * @return the formatted time.
     * @see #isoTimeToArray(java.lang.String)
     */
    public static String isoTimeFromArray(int[] nn) {
        return String.format("%04d-%02d-%02dT%02d:%02d:%02d.%09dZ",
                nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    }

    /**
     * return array [ year, months, days, hours, minutes, seconds, nanoseconds ]
     * preserving the day of year notation if this was used. See the class
     * documentation for allowed time formats, which are a subset of ISO8601
     * times.
     *
     * @param time isoTime to decompose
     * @return the decomposed time
     * @throws IllegalArgumentException when the time cannot be parsed.
     * @see #isoTimeFromArray(int[])
     */
    public static int[] isoTimeToArray(String time) {
        int[] result;
        if (time.length() == 4) {
            result = new int[]{Integer.parseInt(time), 1, 1, 0, 0, 0, 0};
        } else {
            if (time.length() < 8) {
                throw new IllegalArgumentException("time must have 4 or greater than 7 elements");
            }
            // first, parse YMD part, and leave remaining components in time.
            if (time.length() == 8) {
                result = new int[]{parseInt(time.substring(0, 4)), 1, parseInt(time.substring(5, 8)), // days
                    0, 0, 0, 0};
                time = "";
            } else if (time.charAt(8) == 'T') {
                result = new int[]{parseInt(time.substring(0, 4)), 1, parseInt(time.substring(5, 8)), // days
                    0, 0, 0, 0};
                time = time.substring(9);
            } else if (time.charAt(8) == 'Z') {
                result = new int[]{parseInt(time.substring(0, 4)), 1, parseInt(time.substring(5, 8)), // days
                    0, 0, 0, 0};
                time = time.substring(9);
            } else {
                result = new int[]{parseInt(time.substring(0, 4)), parseInt(time.substring(5, 7)), parseInt(time.substring(8, 10)), 0, 0, 0, 0};
                if (time.length() == 10) {
                    time = "";
                } else {
                    time = time.substring(11);
                }
            }
            // second, parse HMS part.
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
     * return the doy of year of the month and day for the year. For example, in
     * Jython:
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * print dayOfYear( 2020, 4, 21 ) # 112
     * }
     * </pre>
     *
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
        if (day > 366) {
            throw new IllegalArgumentException("day (" + day + ") must be less than 366.");
        }
        int leap = isLeapYear(year) ? 1 : 0;
        return DAY_OFFSET[leap][month] + day;
    }

    /**
     * return the time as milliseconds since 1970-01-01T00:00Z. This does not
     * include leap seconds. For example, in Jython:
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * x= toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
     * print x / 86400000   # 10958.0 days
     * print x % 86400000   # and no milliseconds
     * }
     * </pre>
     *
     * @param time the isoTime, which is parsed using
     * DateTimeFormatter.ISO_INSTANT.parse.
     * @return number of non-leap-second milliseconds since 1970-01-01T00:00Z.
     * @see DateTimeFormatter#parse
     */
    public static long toMillisecondsSince1970(String time) {
        time = normalizeTimeString(time);
        TemporalAccessor ta = DateTimeFormatter.ISO_INSTANT.parse(time);
        Instant i = Instant.from(ta);
        Date d = Date.from(i);
        return d.getTime();
    }

    /**
     * normalize the decomposed time by expressing day of year and month and day
     * of month, and moving hour="24" into the next day. This also handles day
     * increment or decrements, by:<ul>
     * <li>handle day=0 by decrementing month and adding the days in the new
     * month.
     * <li>handle day=32 by incrementing month.
     * <li>handle negative components by borrowing from the next significant.
     * </ul>
     *
     * @param time
     */
    public static void normalizeTime(int[] time) {
        while (time[3] > 24) {
            time[2] += 1;
            time[3] = 0;
        }
        if (time[6] < 0) {
            time[5] -= 1;
            time[6] += 1000000000;
        }
        if (time[5] < 0) {
            time[4] -= 1; // take a minute
            time[5] += 60; // add 60 seconds.
        }
        if (time[4] < 0) {
            time[3] -= 1; // take an hour
            time[4] += 60; // add 60 minutes
        }
        if (time[3] < 0) {
            time[2] -= 1; // take a day
            time[3] += 24; // add 24 hours
        }
        if (time[2] < 1) {
            time[1] -= 1; // take a month
            int daysInMonth = time[1] == 0 ? 31 : TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]];
            time[2] += daysInMonth; // add 24 hours
        }
        if (time[1] < 1) {
            time[0] -= 1; // take a year
            time[1] += time[1] + 12; // add 12 months
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
        if (time[2] == 0) {
            time[1] = time[1] - 1;
            if (time[1] == 0) {
                time[0] = time[0] - 1;
                time[1] = 12;
            }
            time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
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

    private static final String simpleFloat = "\\d?\\.?\\d+";
    public static final String iso8601duration = "P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((" + simpleFloat + ")S)?)?";
    public static final Pattern iso8601DurationPattern = Pattern.compile(iso8601duration);

    /**
     * returns a 7 element array with [year,mon,day,hour,min,sec,nanos]. Note
     * this does not allow fractional day, hours or minutes! Examples
     * include:<ul>
     * <li>P1D - one day
     * <li>PT1M - one minute
     * <li>PT0.5S - 0.5 seconds
     * </ul>
     * TODO: there exists more complete code elsewhere.
     *
     * @param stringIn
     * @return 7-element array with [year,mon,day,hour,min,sec,nanos]
     * @throws ParseException if the string does not appear to be valid.
     *
     */
    public static int[] parseISO8601Duration(String stringIn) throws ParseException {
        Matcher m = iso8601DurationPattern.matcher(stringIn);
        if (m.matches()) {
            double dsec = parseDouble(m.group(13), 0);
            int sec = (int) dsec;
            int nanosec = (int) ((dsec - sec) * 1e9);
            return new int[]{
                parseInt(m.group(2), 0), parseInt(m.group(4), 0), parseInt(m.group(6), 0),
                parseInt(m.group(9), 0), parseInt(m.group(11), 0), sec, nanosec};
        } else {
            if (stringIn.contains("P") && stringIn.contains("S") && !stringIn.contains("T")) {
                throw new ParseException("ISO8601 duration expected but not found.  Was the T missing before S?", 0);
            } else {
                throw new ParseException("ISO8601 duration expected but not found.", 0);
            }
        }
    }

    /**
     * return the julianDay for the year month and day. This was verified
     * against another calculation (julianDayWP, commented out above) from
     * http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
     * operations.
     *
     * @see julianToGregorian
     * @param year calendar year greater than 1582.
     * @param month
     * @param day day of month. For day of year, use month=1 and doy for day.
     * @return the Julian day
     */
    public static int julianDay(int year, int month, int day) {
        if (year <= 1582) {
            throw new IllegalArgumentException("year must be more than 1582");
        }
        int jd = 367 * year - 7 * (year + (month + 9) / 12) / 4
                - 3 * ((year + (month - 9) / 7) / 100 + 1) / 4
                + 275 * month / 9 + day + 1721029;
        return jd;
    }

    /**
     * Break the Julian day apart into month, day year. This is based on
     * http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
     * introduced when toTimeStruct failed when the year was 1886.
     *
     * @see julianDay( int year, int mon, int day )
     * @param julian the (integer) number of days that have elapsed since the
     * initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
     * @return a TimeStruct with the month, day and year fields set.
     */
    public static int[] fromJulianDay(int julian) {
        int j = julian + 32044;
        int g = j / 146097;
        int dg = j % 146097;
        int c = (dg / 36524 + 1) * 3 / 4;
        int dc = dg - c * 36524;
        int b = dc / 1461;
        int db = dc % 1461;
        int a = (db / 365 + 1) * 3 / 4;
        int da = db - a * 365;
        int y = g * 400 + c * 100 + b * 4 + a;
        int m = (da * 5 + 308) / 153 - 2;
        int d = da - (m + 4) * 153 / 5 + 122;
        int Y = y - 4800 + (m + 2) / 12;
        int M = (m + 2) % 12 + 1;
        int D = d + 1;
        int[] result = new int[7];
        result[0] = Y;
        result[1] = M;
        result[2] = D;
        return result;
    }

    /**
     * subtract the offset from the base time.
     *
     * @param base a time
     * @param offset offset in each component.
     * @return a time
     */
    public static int[] subtract(int[] base, int[] offset) {
        int[] result = new int[7];
        for (int i = 0; i < 7; i++) {
            result[i] = base[i] - offset[i];
        }
        if (result[0] > 400) {
            normalizeTime(result);
        }
        return result;
    }

    /**
     * add the offset to the base time. This should not be used to combine two
     * offsets, because the code has not been verified for this use.
     *
     * @param base a time
     * @param offset offset in each component.
     * @return a time
     */
    public static int[] add(int[] base, int[] offset) {
        int[] result = new int[7];
        for (int i = 0; i < 7; i++) {
            result[i] = base[i] + offset[i];
        }
        normalizeTime(result);
        return result;
    }
}
