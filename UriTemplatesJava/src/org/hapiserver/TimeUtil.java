package org.hapiserver;

import java.text.ParseException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.TemporalAccessor;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;
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

    public static final String VERSION = "20240730.1";
    
    /**
     * Number of time components: year, month, day, hour, minute, second, nanosecond
     */
    public static final int TIME_DIGITS = 7;
    
    /**
     * Number of components in time representation: year, month, day
     */
    public static final int DATE_DIGITS = 3;
    
    /**
     * Number of components in a time range, which is two times.
     */
    public static final int TIME_RANGE_DIGITS=14;
    
    /**
     * When array of components represents a time, the zeroth component is the year.
     */
    public static final int COMPONENT_YEAR=0;

    /**
     * When array of components represents a time, the first component is the month.
     */
    public static final int COMPONENT_MONTH=1;

    /**
     * When array of components represents a time, the second component is the day of month.
     */
    public static final int COMPONENT_DAY=2;
    
    /**
     * When array of components represents a time, the third component is the hour of day.
     */
    public static final int COMPONENT_HOUR=3;

    /**
     * When array of components represents a time, the fourth component is the minute of hour.
     */
    public static final int COMPONENT_MINUTE=4;
    
    /**
     * When array of components represents a time, the fifth component is the second of minute (0 to 61).
     */    
    public static final int COMPONENT_SECOND=5;

    /**
     * When array of components represents a time, the sixth component is the nanosecond of the second (0 to 99999999).
     */    
    public static final int COMPONENT_NANOSECOND=6;
    
    /**
     * the number of days in each month.  DAYS_IN_MONTH[0][12] is number of days in December of a non-leap year
     */
    private static final int[][] DAYS_IN_MONTH = {
        {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0},
        {0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0}
    };

    /**
     * the number of days to the first of each month.  DAY_OFFSET[0][12] is offset to December 1st of a non-leap year
     */
    private static final int[][] DAY_OFFSET = {
        {0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365},
        {0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366}
    };
    
    /**
     * short English abbreviations for month names.  
     */
    private static final String[] MONTH_NAMES = { "",
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    };

    /**
     * short English abbreviations for month names.  
     */
    private static final String[] MONTH_NAMES_FULL = { "",
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    };
    
    /**
     * This class is not to be instantiated.
     */
    private TimeUtil() {
        
    }
        
    /**
     * fast parser requires that each character of string is a digit.  Note this 
     * does not check the the numbers are digits!
     *
     * @param s string containing an integer
     * @return the integer
     */
    private static int parseInteger(String s) {
        int result;
        int length= s.length();
        for (int i = 0; i < length; i++) {
            char c = s.charAt(i);
            if (c < 48 || c >= 58) {
                throw new IllegalArgumentException("only digits are allowed in string");
            }
        }
        switch (length) {
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
     * @param deft the number to return when s is missing.
     * @return the int value
     */
    private static int parseIntegerDeft(String s, int deft) {
        if (s == null) {
            return deft;
        }
        return Integer.parseInt( s,10 );
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
     * return the seven element start time from the time range.  Note
     * it is fine to use a time range as the start time, because codes
     * will only read the first seven components, and this is only added
     * to make code more readable.
     * @param timerange a fourteen-element time range.
     * @return the start time.
     */
    public static int[] getStartTime( int [] timerange ) {
        int[] result= new int[ TimeUtil.TIME_DIGITS ];
        System.arraycopy( timerange, 0, result, 0, TimeUtil.TIME_DIGITS  );
        return result;
    }
    
    /**
     * return the seven element stop time from the time range.  Note
     * it is fine to use a time range as the start time, because codes
     * will only read the first seven components.
     * @param timerange a fourteen-element time range.
     * @return the stop time.
     */
    public static int[] getStopTime( int [] timerange ) {
        int[] result= new int[ TimeUtil.TIME_DIGITS ];
        System.arraycopy( timerange, TimeUtil.TIME_DIGITS , result, 0, TimeUtil.TIME_DIGITS  );
        return result;
    }
    
    /**
     * copy the components of time into the start position (indeces 7-14) of the time range.
     * This one-line method was introduced to clarify code and make conversion to 
     * other languages (in particular Python) easier.
     * @param time the seven-element start time
     * @param timerange the fourteen-element time range.
     */
    public static void setStartTime( int[] time, int[] timerange ) {
        if ( timerange.length!=14 ) throw new IllegalArgumentException("timerange should be 14-element array.");
        System.arraycopy( time, 0, timerange, 0, TimeUtil.TIME_DIGITS  );
    }
    
    
    /**
     * copy the components of time into the stop position (indeces 7-14) of the time range.
     * @param time the seven-element stop time
     * @param timerange the fourteen-element time range.
     */
    public static void setStopTime( int[] time, int[] timerange ) {
        if ( timerange.length!=14 ) throw new IllegalArgumentException("timerange should be 14-element array.");
        System.arraycopy( time, 0, timerange, TimeUtil.TIME_DIGITS, TimeUtil.TIME_DIGITS  );
    }
    
    private static final DateTimeFormatter FORMATTER_MS_1970 = new DateTimeFormatterBuilder().appendInstant(3).toFormatter();
    
    /**
     * format the time as (non-leap) milliseconds since 1970-01-01T00:00.000Z into a string.  The
     * number of milliseconds should not include leap seconds.  The milliseconds are always present.
     * 
     * @param time the number of milliseconds since 1970-01-01T00:00.000Z
     * @return the formatted time.
     * @see #toMillisecondsSince1970(java.lang.String) 
     */
    public static String fromMillisecondsSince1970(long time) {
        return FORMATTER_MS_1970.format( Instant.ofEpochMilli(time) );
    }

    /**
     * given the two times, return a 14 element time range.
     * @param t1 a seven digit time
     * @param t2 a seven digit time after the first time.
     * @return a fourteen digit time range.
     * @throws IllegalArgumentException when the first time is greater than or equal to the second time.
     */
    public static int[] createTimeRange( int[] t1, int[] t2 ) {
        if ( !gt(t2,t1) ) {
            throw new IllegalArgumentException("t1 is not smaller than t2");
        }
        int[] result= new int[TimeUtil.TIME_DIGITS*2];
        setStartTime( t1, result );
        setStopTime( t2, result );
        return result;
    }
    
    /**
     * true if the year between 1582 and 2400 is a leap year.
     * @param year the year
     * @return true if the year between 1582 and 2400 is a leap year.
     */
    private static boolean isLeapYear(int year) {
        if (year < 1582 || year > 2400) {
            throw new IllegalArgumentException("year must be between 1582 and 2400");
        }
        return (year % 4) == 0 && (year % 400 == 0 || year % 100 != 0);
    }

    /**
     * return the English month name, abbreviated to three letters, for the
     * month number.
     *
     * @param i month number, from 1 to 12.
     * @return the month name, like "Jan" or "Dec"
     */
    public static String monthNameAbbrev(int i) {
        return MONTH_NAMES[i];
    }

    /**
     * return the English month name, abbreviated to three letters, for the
     * month number.
     *
     * @param i month number, from 1 to 12.
     * @return the month name, like "January" or "December"
     */
    public static String monthNameFull(int i) {
        return MONTH_NAMES_FULL[i];
    }
    
    /**
     * return the month number for the English month name, such as "Jan" (1) or
     * "December" (12). The first three letters are used to look up the number,
     * and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
     * "Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
     * @param s the name (case-insensitive, only the first three letters are used.)
     * @return the number, for example 1 for "January"
     * @throws ParseException when month name is not recognized.
     */
    public static int monthNumber(String s) throws ParseException {
        if (s.length() < 3) {
            throw new ParseException("need at least three letters", 0);
        }
        s = s.substring(0, 3);
        for (int i = 1; i < 13; i++) {
            if (s.equalsIgnoreCase(MONTH_NAMES[i])) {
                return i;
            }
        }
        throw new ParseException("Unable to parse month", 0);
    }

    /**
     * return the day of year for the given year, month, and day. For example, in
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
     * return "2" (February) for 45 for example.
     * @param year the year
     * @param doy the day of year.
     * @return the month 1-12 of the day.
     */
    public static int monthForDayOfYear( int year, int doy ) {
        int leap = isLeapYear(year) ? 1 : 0;
        int[] dayOffset= DAY_OFFSET[leap];
        if ( doy<1 ) throw new IllegalArgumentException("doy must be 1 or more");
        if ( doy>dayOffset[13] ) {
            throw new IllegalArgumentException("doy must be less than or equal to "+dayOffset[13]);
        }        
        for ( int i=12; i>1; i-- ) {
            if ( dayOffset[i]<doy ) {
                return i;
            }
        }
        return 1;
    }

    /**
     * count off the days between startTime and stopTime, but not including
     * stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
     * will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
     *
     * @param startTime an iso time string
     * @param stopTime an iso time string
     * @return array of times, complete days, in the form $Y-$m-$dZ
     */
    public static String[] countOffDays(String startTime, String stopTime) {
        int[] t1,t2;
        try {
            t1 = parseISO8601Time(startTime);
            t2 = parseISO8601Time(stopTime);
        } catch ( ParseException ex ) {
            throw new IllegalArgumentException(ex);
        }
        int j1= julianDay( t1[0], t1[1], t1[2] );
        int j2= julianDay( t2[0], t2[1], t2[2] );
        String[] result= new String[j2-j1];
        String time = normalizeTimeString(startTime).substring(0, 10) + 'Z';
        stopTime = floor(stopTime).substring(0, 10) + 'Z';
        int i=0;
        int[] nn = isoTimeToArray(time);
        while (time.compareTo(stopTime) < 0) {
            result[i] = time;
            nn[2] = nn[2] + 1;
            if ( nn[2]>28 ) normalizeTime(nn);
            time =  String.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
            i += 1;
        }
        return result;
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
        normalizeTime(nn);
        return String.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
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
     * @see #fromMillisecondsSince1970(long) 
     */
    public static long toMillisecondsSince1970(String time) {
        time = normalizeTimeString(time);
        TemporalAccessor ta = DateTimeFormatter.ISO_INSTANT.parse(time);
        Instant i = Instant.from(ta);
        Date d = Date.from(i);
        return d.getTime();
    }

    /**
     * return the array formatted as ISO8601 time, formatted to nanoseconds.
     * For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
     * formatted to "1999-12-31T23:00:00.000000000Z";
     * @param nn the decomposed time
     * @return the formatted time.
     * @see #isoTimeToArray(java.lang.String)
     */
    public static String isoTimeFromArray(int[] nn) {
        if ( nn[1]==1 && nn[2]>31 ) {
            int month= monthForDayOfYear( nn[0], nn[2] );
            int dom1= dayOfYear( nn[0], month, 1 );
            nn[2]= nn[2]-dom1+1;
            nn[1]= month;
        }
        return String.format("%04d-%02d-%02dT%02d:%02d:%02d.%09dZ",
                nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    }

    /**
     * format the time range components into iso8601 time range.  
     * @param timerange 14-element time range
     * @return efficient representation of the time range
     */
    public static String formatIso8601TimeRange( int[] timerange ) {
        String ss1= formatIso8601TimeInTimeRange(timerange, 0);
        String ss2= formatIso8601TimeInTimeRange(timerange, TIME_DIGITS);
        int firstNonZeroDigit=7;
        while ( firstNonZeroDigit>3 && timerange[firstNonZeroDigit-1]==0 && timerange[firstNonZeroDigit+TIME_DIGITS-1]==0 ) {
            firstNonZeroDigit -= 1;
        }
        switch (firstNonZeroDigit) {
            case 2:
                return ss1.substring(0,10) + "/" + ss2.substring(0,10);
            case 3:
                return ss1.substring(0,10) + "/" + ss2.substring(0,10);
            case 4:
                return ss1.substring(0,16) + "Z/" + ss2.substring(0,16) + "Z";
            case 5:
                return ss1.substring(0,16) + "Z/" + ss2.substring(0,16) + "Z";
            case 6:
                return ss1.substring(0,19) + "Z/" + ss2.substring(0,19) + "Z";
            default:
                return ss1 + "/" + ss2;
        }
    }
    
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @param offset the offset into the time array (7 for stop time in 14-element range array).
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[]) 
     * @deprecated see formatIso8601TimeInTimeRangeBrief
     */
    @Deprecated
    public static String formatIso8601Time(int[] time, int offset ) {
        return formatIso8601TimeInTimeRange(time,offset);
    }
    
    /**
     * return the string as a formatted string, which can be at an offset of seven positions 
     * to format the end date.
     * @param nn fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
     * @param offset 0 or 7 
     * @return formatted time "1999-12-31T23:00:00.000000000Z"
     * @see #isoTimeFromArray(int[]) 
     */
    public static String formatIso8601TimeInTimeRange( int[] nn, int offset ) {
        switch (offset) {
            case 0:
                return isoTimeFromArray( nn );
            case 7:
                int[] copy = getStopTime(nn);
                return isoTimeFromArray( copy );
            default:
                throw new IllegalArgumentException( "offset must be 0 or 7");
        }
    }
    
    /**
     * return the string as a formatted string.
     * @param nn seven-element array of [ Y m d H M S nanos ]
     * @return formatted time "1999-12-31T23:00:00.000000000Z"
     * @see #isoTimeFromArray(int[]) 
     */
    public static String formatIso8601Time( int[] nn ) {
        return isoTimeFromArray( nn );
    }
        
    /**
     * format the duration into human-readable time, for example
     * [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
     * @param nn seven-element array of [ Y m d H M S nanos ]
     * @return ISO8601 duration
     */
    public static String formatIso8601Duration(int[] nn) {
        char[] units= new char[] { 'Y','M','D','H','M','S' };
        
        if ( nn.length>7 ) throw new IllegalArgumentException("decomposed time can have at most 7 digits");
        
        StringBuilder sb= new StringBuilder("P");
        int n= ( nn.length < 5 ) ? nn.length : 5;

        boolean needT= false;
        for ( int i=0; i<n; i++ ) {
            if ( i==3 ) needT= true;
            if ( nn[i]>0 ) {
                if ( needT ) {
                    sb.append("T");
                    needT= false;
                }
                sb.append(nn[i]).append(units[i]);
            }
        }
        
        if ( nn.length>5 && nn[5]>0 || nn.length>6 && nn[6]>0 || sb.length()==2 ) {
            if ( needT ) {
                sb.append("T");
            }
            int seconds= nn[5];
            int nanoseconds= nn.length==7 ? nn[6] : 0;
            if ( nanoseconds==0 ) {
                sb.append(seconds);
            } else if ( nanoseconds%1000000==0 ) {
                sb.append(String.format("%.3f",seconds + nanoseconds/1e9) );
            } else if ( nanoseconds%1000==0 ) {
                sb.append(String.format("%.6f",seconds + nanoseconds/1e9) );
            } else {
                sb.append(String.format("%.9f",seconds + nanoseconds/1e9) ); 
            }
            sb.append("S");
        }
        
        if ( sb.length()==1 ) {
            if ( nn.length>3 ) {
                sb.append( "T0S" );
            } else {
                sb.append("0D");
            }
        }
        
        return sb.toString();
    }
        
    public static final String iso8601duration = "P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?(\\d*?\\.?\\d*)S)?)?";
    
    /**
     * Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
     */
    public static final Pattern iso8601DurationPattern = // repeated for Java to Jython conversion.
            Pattern.compile("P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d*?\\.?\\d*)S)?)?");

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
     * @param stringIn theISO8601 duration.
     * @return 7-element array with [year,mon,day,hour,min,sec,nanos]
     * @throws ParseException if the string does not appear to be valid.
     * @see #iso8601duration
     * @see #TIME_DIGITS
     *
     */
    public static int[] parseISO8601Duration(String stringIn) throws ParseException {
        Matcher m = iso8601DurationPattern.matcher(stringIn);
        if (m.matches()) {
            double dsec = parseDouble(m.group(13), 0);
            int sec = (int) dsec;
            int nanosec = (int) ((dsec - sec) * 1e9);
            return new int[]{
                parseIntegerDeft(m.group(2), 0), parseIntegerDeft(m.group(4), 0), parseIntegerDeft(m.group(6), 0),
                parseIntegerDeft(m.group(9), 0), parseIntegerDeft(m.group(11), 0), sec, nanosec};
        } else {
            if (stringIn.contains("P") && stringIn.contains("S") && !stringIn.contains("T")) {
                throw new ParseException("ISO8601 duration expected but not found.  Was the T missing before S?", 0);
            } else {
                throw new ParseException("ISO8601 duration expected but not found.", 0);
            }
        }
    }
    /**
     * return the UTC current time, to the millisecond, in seven components.
     * @return the current time, to the millisecond
     */
    public static int[] now() {
        long ctm= System.currentTimeMillis();
        Date d= new Date(ctm);
        TimeZone timeZone= TimeZone.getTimeZone("UTC");
        Calendar c= Calendar.getInstance(timeZone);
        c.setTime(d);
        return new int[] { c.get( Calendar.YEAR ), 1+c.get( Calendar.MONTH ), c.get( Calendar.DAY_OF_MONTH ),
            c.get( Calendar.HOUR_OF_DAY ), c.get( Calendar.MINUTE ), c.get( Calendar.SECOND ), 
            1000000 * c.get( Calendar.MILLISECOND ) };
    }
    
    /**
     * return seven-element array [ year, months, days, hours, minutes, seconds, nanoseconds ]
     * preserving the day of year notation if this was used. See the class
     * documentation for allowed time formats, which are a subset of ISO8601
     * times.  This also supports "now", "now-P1D", and other simple extensions.  Note
     * ISO8601-1:2019 disallows 24:00 to be used for the time, but this is still allowed here.
     * The following are valid inputs:<ul>
     * <li>2021
     * <li>2020-01-01
     * <li>2020-01-01Z
     * <li>2020-01-01T00Z
     * <li>2020-01-01T00:00Z
     * <li>2022-W08
     * <li>now
     * <li>now-P1D
     * <li>lastday-P1D
     * <li>lasthour-PT1H
     * </ul>
     *
     * @param time isoTime to decompose
     * @return the decomposed time
     * @throws IllegalArgumentException when the time cannot be parsed.
     * @see #isoTimeFromArray(int[])
     * @see #parseISO8601Time(java.lang.String) 
     */
    public static int[] isoTimeToArray(String time) {
        int[] result;
        if (time.length() == 4) {
            result = new int[]{Integer.parseInt(time), 1, 1, 0, 0, 0, 0};
        } else if ( time.startsWith("now") || time.startsWith("last") ) {
            int[] n;
            String remainder=null;
            if ( time.startsWith("now") ) {
                n= now();
                remainder= time.substring(3);
            } else {
                Pattern p= Pattern.compile("last([a-z]+)([\\+|\\-]P.*)?");
                Matcher m= p.matcher(time);
                if ( m.matches() ) {
                    n= now();
                    String unit= m.group(1);
                    remainder= m.group(2);
                    int idigit;
                    switch (unit) {
                        case "year":
                            idigit= 1;
                            break;
                        case "month":
                            idigit= 2;
                            break;
                        case "day":
                            idigit= 3;
                            break;
                        case "hour":
                            idigit= 4;
                            break;
                        case "minute":
                            idigit= 5;
                            break;
                        case "second":
                            idigit= 6;
                            break;
                        default:
                            throw new IllegalArgumentException("unsupported unit: "+unit);
                    }
                    for ( int id=Math.max(1,idigit); id<DATE_DIGITS; id++ ) {
                        n[id]= 1;
                    }
                    for ( int id=Math.max(DATE_DIGITS,idigit); id<TIME_DIGITS; id++ ) {
                        n[id]= 0;
                    }
                } else {
                    throw new IllegalArgumentException("expected lastday+P1D, etc");
                }
            }
            if ( remainder==null || remainder.length()==0 ) {
                return n;
            } else if ( remainder.charAt(0)=='-' ) {
                try {
                    return subtract( n, parseISO8601Duration(remainder.substring(1)) );
                } catch (ParseException ex) {
                    throw new IllegalArgumentException(ex);
                }
            } else if ( remainder.charAt(0)=='+' ) {
                try {
                    return add( n, parseISO8601Duration(remainder.substring(1)) );
                } catch (ParseException ex) {
                    throw new IllegalArgumentException(ex);
                }
            }
            return now();
            
        } else {
            if (time.length() < 7) {
                throw new IllegalArgumentException("time must have 4 or greater than 7 characters");
            }
            if ( Character.isDigit(time.charAt(4)) && Character.isDigit(time.charAt(5)) ) {
                throw new IllegalArgumentException("date and time must contain delimiters between fields");
            }
            // first, parse YMD part, and leave remaining components in time.
            if ( time.length()==7 ) {
                if ( time.charAt(4)=='W' ) { // 2022W08
                    int year= parseInteger(time.substring(0, 4));
                    int week= parseInteger(time.substring(5));
                    result= new int[] { year, 0, 0, 0, 0, 0, 0 };
                    fromWeekOfYear( year, week, result );
                    time= "";
                } else {
                    result = new int[]{ parseInteger(time.substring(0, 4)), parseInteger(time.substring(5, 7)), 1, // days
                        0, 0, 0, 0 };
                    time = "";
                }
            } else if (time.length() == 8) {
                if ( time.charAt(5)=='W' ) { // 2022-W08
                    int year= parseInteger(time.substring(0, 4));
                    int week= parseInteger(time.substring(6));
                    result= new int[] { year, 0, 0, 0, 0, 0, 0 };
                    fromWeekOfYear( year, week, result );
                    time= "";
                } else {
                    result = new int[]{parseInteger(time.substring(0, 4)), 1, parseInteger(time.substring(5, 8)), // days
                        0, 0, 0, 0};
                    time = "";
                }
            } else if (time.charAt(8) == 'T') {
                if ( Character.isDigit(time.charAt(4)) ) {
                    result = new int[]{
                        parseInteger(time.substring(0, 4)), parseInteger(time.substring(4,6)), parseInteger(time.substring(6,8)), 
                        0, 0, 0, 0};
                    time = time.substring(9);
                } else {
                    result = new int[]{parseInteger(time.substring(0, 4)), 1, parseInteger(time.substring(5, 8)), // days
                        0, 0, 0, 0};
                    time = time.substring(9);
                }
            } else if (time.charAt(8) == 'Z') {
                result = new int[]{parseInteger(time.substring(0, 4)), 1, parseInteger(time.substring(5, 8)), // days
                    0, 0, 0, 0};
                time = time.substring(9);
            } else {
                result = new int[]{
                    parseInteger(time.substring(0, 4)), parseInteger(time.substring(5, 7)), parseInteger(time.substring(8, 10)), 0, 0, 0, 0};
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
                result[3] = parseInteger(time.substring(0, 2));
            }
            if (time.length() >= 5) {
                result[4] = parseInteger(time.substring(3, 5));
            }
            if (time.length() >= 8) {
                result[5] = parseInteger(time.substring(6, 8));
            }
            if (time.length() > 9) {
                result[6] = (int) (Math.pow(10, 18 - time.length())) * parseInteger(time.substring(9));
            }
            normalizeTime(result);
        }
        return result;
    }

    /**
     * Rewrite the time using the format of the example time, which must start with
     * $Y-$jT, $Y-$jZ, or $Y-$m-$d. For example,
     * <pre>
     * {@code
     * from org.hapiserver.TimeUtil import *
     * print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
     * }
     * </pre> This allows direct comparisons of times for sorting. 
     * This works by looking at the character in the 8th position (starting with zero) of the 
     * exampleForm to see if a T or Z is present (YYYY-jjjTxxx).
     *
     * TODO: there's
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
    
    public static int VALID_FIRST_YEAR=1900;
    public static int VALID_LAST_YEAR=2100;
    
    /**
     * this returns true or throws an IllegalArgumentException indicating the problem.
     * @param time the seven-component time.
     * @return true or throws an IllegalArgumentException
     */
    public static boolean isValidTime( int[] time ) {
        int year= time[0];
        if ( year<VALID_FIRST_YEAR ) throw new IllegalArgumentException("invalid year at position 0" );
        if ( year>VALID_LAST_YEAR ) throw new IllegalArgumentException("invalid year at position 0" );
        int month= time[1];
        if ( month<1 ) throw new IllegalArgumentException("invalid month at position 1" );
        if ( month>12 ) throw new IllegalArgumentException("invalid month at position 1" );
        int leap= isLeapYear( year ) ? 1 : 0;
        int dayOfMonth= time[2];
        if ( month>1 ) {
            if ( dayOfMonth>DAYS_IN_MONTH[leap][month] ) {
                throw new IllegalArgumentException("day of month is too large at position 2" );
            } 
        } else {
            if ( dayOfMonth>DAY_OFFSET[leap][13] ) {
                throw new IllegalArgumentException("day of year is too large at position 2" );
            }
        }
        if ( dayOfMonth<1 ) throw new IllegalArgumentException("day is less than 1 at position 2" );
        return true;
    }
    
    /**
     * return the number of days in the month.
     * @param year the year 
     * @param month the month
     * @return the number of days in the month.
     * @see #isLeapYear(int) 
     */
    public static int daysInMonth( int year, int month ) {
        int leap= isLeapYear(year) ? 1 : 0;
        return DAYS_IN_MONTH[leap][month];
    }
    
    /**
     * normalize the decomposed (seven digit) time by expressing day of year and month and day
     * of month, and moving hour="24" into the next day. This also handles day
     * increment or decrements, by:<ul>
     * <li>handle day=0 by decrementing month and adding the days in the new
     * month.
     * <li>handle day=32 by incrementing month.
     * <li>handle negative components by borrowing from the next significant.
     * </ul>
     * Note that [Y,1,dayOfYear,...] is accepted, but the result will be Y,m,d.
     * @param time the seven-component time Y,m,d,H,M,S,nanoseconds
     */
    public static void normalizeTime(int[] time) {
        while ( time[6]>=1000000000 ) {
            time[5] += 1;
            time[6] -= 1000000000;
        }
        while ( time[5]>59 ) { // TODO: leap seconds?
            time[4]+= 1;
            time[5]-= 60;
        }
        while ( time[4]>59 ) {
            time[3]+= 1;
            time[4]-= 60;
        }        
        while (time[3] >= 24) {
            time[2] += 1;
            time[3] -= 24;
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
            final int daysInMonth;
            if ( time[1] == 0 ) { 
                daysInMonth = 31;
            } else {
                if ( isLeapYear(time[0]) ) { // This was  TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]] . TODO: review!
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[1][time[1]];
                } else {
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[0][time[1]];
                }
            }
            time[2] += daysInMonth; // add 24 hours
        }
        if (time[1] < 1) {
            time[0] -= 1; // take a year
            time[1] += 12; // add 12 months
        }
        if (time[3] > 24) {
            throw new IllegalArgumentException("time[3] is greater than 24 (hours)");
        }
        if (time[1] > 12) {
            time[0] += 1;
            time[1] -= 12;
        }
        if (time[1] == 12 && time[2]>31 && time[2]<62 ) {
            time[0] += 1;
            time[1] = 1;
            time[2] -= 31;
            return;
        }
        int leap = isLeapYear(time[0]) ? 1 : 0;
        if (time[2] == 0) { //TODO: tests don't hit this branch, and I'm not sure it can occur.
            time[1] -= 1;
            if (time[1] == 0) {
                time[0] -= 1;
                time[1] = 12;
            }
            time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        }
        int d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        while (time[2] > d) {
            time[1] += 1;
            time[2] -= d;
            if ( time[1]>12 ) {
                time[0]+=1;
                time[1]-=12;
            }
            d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        }
    }
    
    /**
     * return the julianDay for the year month and day. This was verified
     * against another calculation (julianDayWP, commented out above) from
     * http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
     * operations.
     *
     * @param year calendar year greater than 1582.
     * @param month the month number 1 through 12.
     * @param day day of month. For day of year, use month=1 and doy for day.
     * @return the Julian day
     * @see #fromJulianDay(int) 
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
     * @see #julianDay( int year, int mon, int day )
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
        int[] result = new int[TIME_DIGITS];
        result[0] = Y;
        result[1] = M;
        result[2] = D;
        result[3] = 0;
        result[4] = 0;
        result[5] = 0;
        result[6] = 0;
        return result;
    }    
    
    /**
     * calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
     * 2022-03-12 is a Saturday, so 5 is returned.
     * @param year the year
     * @param month the month
     * @param day the day of the month
     * @return the day of the week.
     */
    public static int dayOfWeek( int year, int month, int day ) {
        int jd= julianDay( year, month, day );
        int daysSince2022= jd - julianDay( 2022, 1, 1 );
        int mod7= ( daysSince2022 - 2 ) % 7; 
        if ( mod7<0 ) mod7= mod7 + 7;
        return mod7;
    }    
    
    /**
     * calculate the week of year, inserting the month into time[1] and day into time[2]
     * for the Monday which is the first day of that week.  Note week 0 is excluded from
     * ISO8601, but since the Linux date command returns this in some cases, it is allowed to
     * mean the same as week 52 of the previous year.  See 
     * <a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
     * 
     * @param year the year of the week.
     * @param weekOfYear the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
     * @param time the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
     */
    public static void fromWeekOfYear( int year, int weekOfYear, int[] time ) {
        time[0]= year;
        int day= dayOfWeek( year, 1, 1 );
        int doy;
        if ( day<4 ) {
            doy= ( weekOfYear * 7 - 7 - day ) + 1 ;
            if ( doy<1 ) {
                time[0]= time[0] - 1;
                if ( isLeapYear(time[0]) ) { // was  doy= doy + ( isLeapYear(time[0]) ? 366 : 365 );  TODO: verify
                    doy = doy + 366;
                } else {
                    doy = doy + 365;
                }
            }
        } else {
            doy= weekOfYear * 7 - day + 1;
        }
        time[1]= 1;
        time[2]= doy;
        normalizeTime(time);
    }

    /**
     * use consistent naming so that the parser is easier to find.
     * @param string iso8601 time like "2022-03-12T11:17" (Z is assumed).
     * @return seven-element decomposed time [ Y, m, d, H, M, S, N ]
     * @throws ParseException when the string cannot be parsed.
     * @see #isoTimeToArray(java.lang.String) 
     */
    public static int[] parseISO8601Time( String string ) throws ParseException {
        return isoTimeToArray( string );
    }
    
    /**
     * return true if the time appears to be properly formatted.  Properly formatted strings include:<ul>
     * <li>Any supported ISO8601 time
     * <li>2000 and 2000-01 (just a year and month)
     * <li>now - the current time reported by the processing system
     * <li>lastyear - last year boundary
     * <li>lastmonth - last month boundary
     * <li>lastday - last midnight boundary
     * <li>lasthour - last midnight boundary
     * <li>now-P1D - yesterday at this time
     * <li>lastday-P1D - yesterday midnight boundary
     * </ul>
     * @param time
     * @return true if the time appears to be valid and will parse.
     */
    public static boolean isValidFormattedTime( String time ) {
        return time.length()>0 && 
                ( Character.isDigit(time.charAt(0)) || time.charAt(0)=='P' || time.startsWith("now") || time.startsWith("last") );
    }
    
    /**
     * parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
     * start and stop times, returned in a 14 element array of ints.
     * @param stringIn string to parse, like "1998-01-02/1998-01-17"
     * @return the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
     * @throws ParseException when the string cannot be used
     */
    public static int[] parseISO8601TimeRange(String stringIn) throws ParseException {
        String[] ss = stringIn.split("/");
        if ( ss.length!=2 ) {
            throw new IllegalArgumentException("expected one slash (/) splitting start and stop times.");
        }
        if ( !isValidFormattedTime( ss[0] ) ) {
            throw new IllegalArgumentException("first time/duration is misformatted.  Should be ISO8601 time or duration like P1D.");
        }
        if ( !isValidFormattedTime( ss[1] ) ) {
            throw new IllegalArgumentException("second time/duration is misformatted.  Should be ISO8601 time or duration like P1D.");
        }
        int[] result= new int[14];
        if ( ss[0].startsWith("P") ) {
            int[] duration= parseISO8601Duration(ss[0]);
            int[] time= isoTimeToArray(ss[1]);
            for ( int i=0; i<TIME_DIGITS; i++ ) {
                result[i]= time[i]-duration[i];
            }
            normalizeTime( result );
            setStopTime( time,result );
            return result;
        } else if ( ss[1].startsWith("P") ) {
            int[] time= isoTimeToArray(ss[0]);
            int[] duration= parseISO8601Duration(ss[1]);
            setStartTime( time, result );
            int[] stoptime= new int[TIME_DIGITS];
            for ( int i=0; i<TIME_DIGITS; i++ ) {
                stoptime[i]= time[i]+duration[i];
            }
            normalizeTime( stoptime );
            setStopTime( stoptime, result );
            return result;
        } else {
            int[] starttime= isoTimeToArray(ss[0]);
            int[] stoptime; 
            if ( ss[1].length()==ss[0].length() ) {
                stoptime=  isoTimeToArray(ss[1]);
            } else {
                if ( ss[1].contains("T") ) {
                    stoptime= isoTimeToArray( ss[1] );
                } else {
                    int partToShare= ss[0].length() - ss[1].length();
                    stoptime= isoTimeToArray( ss[0].substring(0,partToShare) + ss[1] );
                }
            }
            setStartTime( starttime, result );
            setStopTime( stoptime, result );
            return result;
        }
    }

    /**
     * subtract the offset from the base time.
     *
     * @param base a time
     * @param offset offset in each component.
     * @return a time
     */
    public static int[] subtract(int[] base, int[] offset) {
        int[] result = new int[TIME_DIGITS];
        for (int i = 0; i < TIME_DIGITS; i++) {
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
        int[] result = new int[TIME_DIGITS];
        for (int i = 0; i < TIME_DIGITS; i++) {
            result[i] = base[i] + offset[i];
        }
        normalizeTime(result);
        return result;
    }
    
    /**
     * true if t1 is after t2.
     * @param t1 seven-component time
     * @param t2 seven-component time
     * @return true if t1 is after t2.
     */
    public static boolean gt( int[] t1, int[] t2 ) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for ( int i=0; i<TimeUtil.TIME_DIGITS ; i++ ) {
            if ( t1[i]>t2[i] ) {
                return true;
            } else if ( t1[i]<t2[i] ) {
                return false;
}
        }
        return false; // they are equal
    }
    
    /**
     * true if t1 is equal to t2.
     * @param t1 seven-component time
     * @param t2 seven-component time
     * @return true if t1 is equal to t2.
     */
    public static boolean eq( int[] t1, int[] t2 ) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for ( int i=0; i<TimeUtil.TIME_DIGITS ; i++ ) {
            if ( t1[i]!=t2[i] ) {
                return false;
            }
        }
        return true; // they are equal
    }

    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) 
     */
    public static String formatIso8601TimeBrief(int[] time ) {
        return formatIso8601TimeInTimeRangeBrief(time,0);
    }
     
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @param offset the offset into the time array (7 for stop time in 14-element range array).
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[]) 
     * @deprecated see formatIso8601TimeInTimeRangeBrief
     */
    @Deprecated
    public static String formatIso8601TimeBrief(int[] time, int offset ) {
        return formatIso8601TimeInTimeRangeBrief(time,offset);
    }
    
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @param offset the offset into the time array (7 for stop time in 14-element range array).
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[]) 
     */
    public static String formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) {
        
        String stime= TimeUtil.formatIso8601TimeInTimeRange(time,offset);
        
        int nanos= time[ COMPONENT_NANOSECOND+offset ];
        int micros= nanos % 1000;
        int millis= nanos % 10000000;
        
        if ( nanos==0 ) {
            if ( time[5+offset]==0 ) {
                return stime.substring(0,16) + "Z";
            } else {
                return stime.substring(0,19) + "Z";
            }
        } else {
            if ( millis==0 ) {
                return stime.substring(0,23) + "Z";
            } else if ( micros==0 ) {
                return stime.substring(0,26) + "Z";
            } else {
                return stime;
            }
        }
    }
    
    /**
     * return the next interval, given the 14-component time interval.  This
     * has the restrictions:<ul>
     * <li> can only handle intervals of at least one second
     * <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
     * <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
     * </ul>
     * @param timerange 14-component time interval.
     * @return 14-component time interval.
     */
    public static int[] nextRange( int[] timerange ) {
        int[] result= new int[TimeUtil.TIME_RANGE_DIGITS];
        int[] width= new int[TimeUtil.TIME_DIGITS];
        for ( int i=0; i<TimeUtil.TIME_DIGITS; i++ ) {
            width[ i ] = timerange[i+TimeUtil.TIME_DIGITS ] - timerange[i] ;
        }
        if ( width[5]<0 ) {
            width[5]= width[5]+60;
            width[4]= width[4]-1;
        }
        if ( width[4]<0 ) {
            width[4]= width[4]+60;
            width[3]= width[3]-1;
        }
        if ( width[3]<0 ) {
            width[3]= width[3]+24;
            width[2]= width[2]-1;
        }
        if ( width[2]<0 ) {
            int daysInMonth= TimeUtil.daysInMonth( timerange[COMPONENT_YEAR], timerange[COMPONENT_MONTH] );
            width[2]= width[2]+daysInMonth;
            width[1]= width[1]-1;
        }
        if ( width[1]<0 ) {
            width[1]= width[1]+12;
            width[0]= width[0]-1;
        }
        // System.arraycopy( range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
        setStartTime( getStopTime(timerange), result ); // This creates an extra array, but let's not worry about that.
        setStopTime( TimeUtil.add( getStopTime(timerange), width ), result );
        return result;
    }
       
    /**
     * return the previous interval, given the 14-component time interval.  This
     * has the restrictions:<ul>
     * <li> can only handle intervals of at least one second
     * <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
     * <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
     * </ul>
     * @param timerange 14-component time interval.
     * @return 14-component time interval.
     */
    public static int[] previousRange( int[] timerange ) {
        int[] result= new int[TimeUtil.TIME_RANGE_DIGITS];
        int[] width= new int[TimeUtil.TIME_DIGITS];
        for ( int i=0; i<TimeUtil.TIME_DIGITS; i++ ) {
            width[ i ] = timerange[i+TimeUtil.TIME_DIGITS ] - timerange[i] ;
        }
        if ( width[5]<0 ) {
            width[5]= width[5]+60;
            width[4]= width[4]-1;
        }
        if ( width[4]<0 ) {
            width[4]= width[4]+60;
            width[3]= width[3]-1;
        }
        if ( width[3]<0 ) {
            width[3]= width[3]+24;
            width[2]= width[2]-1;
        }
        if ( width[2]<0 ) {
            int daysInMonth= TimeUtil.daysInMonth( timerange[COMPONENT_YEAR], timerange[COMPONENT_MONTH] );
            width[2]= width[2]+daysInMonth;
            width[1]= width[1]-1;
        }
        if ( width[1]<0 ) {
            width[1]= width[1]+12;
            width[0]= width[0]-1;
        }
        setStopTime( getStartTime(timerange), result );
        setStartTime( TimeUtil.subtract(getStartTime(timerange), width ), result ); // This creates an extra array, but let's not worry about that.
        return result;
    }
            
    /**
     * return true if this is a valid time range having a non-zero width.
     * @param timerange
     * @return 
     */
    public static boolean isValidTimeRange(int[] timerange) {
        int[] start= getStartTime(timerange);
        int[] stop= getStopTime(timerange);
        
        return TimeUtil.isValidTime( start ) && TimeUtil.isValidTime( stop ) && gt( stop, start );
        
    }    
}
