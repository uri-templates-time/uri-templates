// import sprintf.js
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
class TimeUtil {
    /**
     * Number of time components: year, month, day, hour, minute, second, nanosecond
     */
    static TIME_DIGITS = 7;

    /**
     * Number of components in time representation: year, month, day
     */
    static DATE_DIGITS = 3;

    /**
     * Number of components in a time range, which is two times.
     */
    static TIME_RANGE_DIGITS = 14;

    /**
     * When array of components represents a time, the zeroth component is the year.
     */
    static COMPONENT_YEAR = 0;

    /**
     * When array of components represents a time, the first component is the month.
     */
    static COMPONENT_MONTH = 1;

    /**
     * When array of components represents a time, the second component is the day of month.
     */
    static COMPONENT_DAY = 2;

    /**
     * When array of components represents a time, the third component is the hour of day.
     */
    static COMPONENT_HOUR = 3;

    /**
     * When array of components represents a time, the fourth component is the minute of hour.
     */
    static COMPONENT_MINUTE = 4;

    /**
     * When array of components represents a time, the fifth component is the second of minute (0 to 61).
     */
    static COMPONENT_SECOND = 5;

    /**
     * When array of components represents a time, the sixth component is the nanosecond of the second (0 to 99999999).
     */
    static COMPONENT_NANOSECOND = 6;

    /**
     * the number of days in each month.  DAYS_IN_MONTH[0][12] is number of days in December of a non-leap year
     */
    static DAYS_IN_MONTH = [[0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0], [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0]];

    /**
     * the number of days to the first of each month.  DAY_OFFSET[0][12] is offset to December 1st of a non-leap year
     */
    static DAY_OFFSET = [[0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365], [0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]];

    /**
     * short English abbreviations for month names.  Note monthNames[0] is "Jan", not monthNames[1].
     */
    static MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    /**
     * fast parser requires that each character of string is a digit.  Note this 
     * does not check the the numbers are digits!
     *
     * @param s string containing an integer
     * @return the integer
     */
    static parseInteger(s) {
        return parseInt(s,10);
    }

    /**
     * fast parser requires that each character of string is a digit.
     *
     * @param s the number, containing 1 or more digits.
     * @param deft the number to return when s is missing.
     * @return the int value
     */
    static parseIntegerDeft(s, deft) {
        if (s === undefined || s === null) {
            return deft;
        }
        return parseInt(s, 10);
    }

    static parseDouble(val, deft) {
        if (val === undefined || val === null) {
            if (deft !== -99) {
                return deft;
            } else {
                throw "bad digit";
            }
        }
        var n = val.length - 1;
        if (/[a-z]/i.test(val.charAt(n))) {
            return parseFloat(val.substring(0, n));
        } else {
            return parseFloat(val);
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
    static getStartTime(timerange) {
        var result = [];
        arraycopy( timerange, 0, result, 0, TimeUtil.TIME_DIGITS );
        return result;
    }

    /**
     * return the seven element stop time from the time range.  Note
     * it is fine to use a time range as the start time, because codes
     * will only read the first seven components.
     * @param timerange a fourteen-element time range.
     * @return the stop time.
     */
    static getStopTime(timerange) {
        var result = [];
        arraycopy( timerange, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
        return result;
    }

    /**
     * copy the components of time into the start position (indeces 7-14) of the time range.
     * This one-line method was introduced to clarify code and make conversion to 
     * other languages (in particular Python) easier.
     * @param time the seven-element start time
     * @param timerange the fourteen-element time range.
     */
    static setStartTime(time, timerange) {
        arraycopy( time, 0, timerange, 0, TimeUtil.TIME_DIGITS );
    }

    /**
     * copy the components of time into the stop position (indeces 7-14) of the time range.
     * @param time the seven-element stop time
     * @param timerange the fourteen-element time range.
     */
    static setStopTime(time, timerange) {
        arraycopy( time, 0, timerange, TimeUtil.TIME_DIGITS, TimeUtil.TIME_DIGITS );
    }

    /**
     * format the time as (non-leap) milliseconds since 1970-01-01T00:00.000Z into a string.  The
     * number of milliseconds should not include leap seconds.  The milliseconds are always present.
     * 
     * @param time the number of milliseconds since 1970-01-01T00:00.000Z
     * @return the formatted time.
     * @see #toMillisecondsSince1970(java.lang.String) 
     */
    static fromMillisecondsSince1970(time) {
        return new Date(time).toISOString();
    }

    /**
     * given the two times, return a 14 element time range.
     * @param t1 a seven digit time
     * @param t2 a seven digit time after the first time.
     * @return a fourteen digit time range.
     * @throws IllegalArgumentException when the first time is greater than or equal to the second time.
     */
    static createTimeRange(t1, t2) {
        if (!TimeUtil.gt(t2, t1)) {
            throw "t1 is not smaller than t2";
        }
        var result = [];
        TimeUtil.setStartTime(result, t1);
        TimeUtil.setStopTime(result, t2);
        return result;
    }

    /**
     * true if the year between 1582 and 2400 is a leap year.
     * @param year the year
     * @return true if the year between 1582 and 2400 is a leap year.
     */
    static isLeapYear(year) {
        if (year < 1582 || year > 2400) {
            throw "year must be between 1582 and 2400";
        }
        return (year % 4) === 0 && (year % 400 === 0 || year % 100 !== 0);
    }

    /**
     * return the English month name, abbreviated to three letters, for the
     * month number.
     *
     * @param i month number, from 1 to 12.
     * @return the month name, like "Jan" or "Dec"
     */
    static monthNameAbbrev(i) {
        return TimeUtil.MONTH_NAMES[i];
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
    static monthNumber(s) {
        if (s.length < 3) {
            throw "need at least three letters";
        }
        s = s.substring(0, 3);
        for ( var i = 1; i < 13; i++) {
            if (s.toUpperCase()===TimeUtil.MONTH_NAMES[i].toUpperCase()) {
                return i;
            }
        }
        throw "Unable to parse month";
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
    static dayOfYear(year, month, day) {
        if (month === 1) {
            return day;
        }
        if (month < 1) {
            throw "month must be greater than 0.";
        }
        if (month > 12) {
            throw "month must be less than 12.";
        }
        if (day > 366) {
            throw "day (" + day + ") must be less than 366.";
        }
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        return TimeUtil.DAY_OFFSET[leap][month] + day;
    }

    /**
     * return "2" (February) for 45 for example.
     * @param year the year
     * @param doy the day of year.
     * @return the month 1-12 of the day.
     */
    static monthForDayOfYear(year, doy) {
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        var dayOffset = TimeUtil.DAY_OFFSET[leap];
        if (doy < 1) throw "doy must be 1 or more";
        if (doy > dayOffset[13]) {
            throw "doy must be less than or equal to " + dayOffset[13];
        }
        for ( var i = 12; i > 1; i--) {
            if (dayOffset[i] < doy) {
                return i;
            }
        }
        return 1;
    }

    /**
     * This class is not to be instantiated.
     */
    constructor() {
    }

    /**
     * count off the days between startTime and stopTime, but not including
     * stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
     * will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
     *
     * @param startTime an iso time string
     * @param stopTime an iso time string
     * @return array of times, complete days, in the form $Y-$m-$d
     */
    static countOffDays(startTime, stopTime) {
        if (stopTime.length < 10 || /[0-9]/.test(stopTime.charAt(10))) {
            throw "arguments must be $Y-$m-$dZ";
        }
        var t1
        var t2;
        try {
            t1 = TimeUtil.parseISO8601Time(startTime);
            t2 = TimeUtil.parseISO8601Time(stopTime);
        } catch (ex) {
            throw ex;
        }
        var j1 = TimeUtil.julianDay(t1[0], t1[1], t1[2]);
        var j2 = TimeUtil.julianDay(t2[0], t2[1], t2[2]);
        var result = [];
        var time = TimeUtil.normalizeTimeString(startTime).substring(0, 10) + 'Z';
        stopTime = TimeUtil.floor(stopTime).substring(0, 10) + 'Z';
        var i = 0;
        var nn = TimeUtil.isoTimeToArray(time);
        while (time < stopTime) {
            result[i] = time;
            nn[2] = nn[2] + 1;
            if (nn[2] > 28) TimeUtil.normalizeTime(nn);
            time = sprintf("%04d-%02d-%02dZ",nn[0], nn[1], nn[2]);
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
    static nextDay(day) {
        var nn = TimeUtil.isoTimeToArray(day);
        nn[2] = nn[2] + 1;
        TimeUtil.normalizeTime(nn);
        return sprintf("%04d-%02d-%02dZ",nn[0], nn[1], nn[2]);
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
    static previousDay(day) {
        var nn = TimeUtil.isoTimeToArray(day);
        nn[2] = nn[2] - 1;
        TimeUtil.normalizeTime(nn);
        return sprintf("%04d-%02d-%02dZ",nn[0], nn[1], nn[2]);
    }

    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
     * @param time any isoTime format string.
     * @return the next midnight or the value if already at midnight.
     */
    static ceil(time) {
        time = TimeUtil.normalizeTimeString(time);
        if (time.substring(11)=="00:00:00.000000000Z") {
            return time;
        } else {
            return TimeUtil.nextDay(time.substring(0, 11)).substring(0, 10) + "T00:00:00.000000000Z";
        }
    }

    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
     * @param time any isoTime format string.
     * @return the previous midnight or the value if already at midnight.
     */
    static floor(time) {
        time = TimeUtil.normalizeTimeString(time);
        if (time.substring(11)=="00:00:00.000000000Z") {
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
    static normalizeTimeString(time) {
        var nn = TimeUtil.isoTimeToArray(time);
        TimeUtil.normalizeTime(nn);
        return sprintf("%d-%02d-%02dT%02d:%02d:%02d.%09dZ",nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
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
    static toMillisecondsSince1970(time) {
        time = TimeUtil.normalizeTimeString(time);
        return new Date(time).getTime();
    }

    /**
     * return the array formatted as ISO8601 time, formatted to nanoseconds.
     * For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
     * formatted to "1999-12-31T23:00:00.000000000Z";
     * @param nn the decomposed time
     * @return the formatted time.
     * @see #isoTimeToArray(java.lang.String)
     */
    static isoTimeFromArray(nn) {
        if (nn[1] === 1 && nn[2] > 31) {
            var month = TimeUtil.monthForDayOfYear(nn[0], nn[2]);
            var dom1 = TimeUtil.dayOfYear(nn[0], month, 1);
            nn[2] = nn[2] - dom1 + 1;
            nn[1] = month;
        }
        return sprintf("%04d-%02d-%02dT%02d:%02d:%02d.%09dZ",nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    }

    /**
     * format the time range components into iso8601 time range.  
     * @param timerange 14-element time range
     * @return efficient representation of the time range
     */
    static formatIso8601TimeRange(timerange) {
        var ss1 = TimeUtil.formatIso8601TimeInTimeRange(timerange, 0);
        var ss2 = TimeUtil.formatIso8601TimeInTimeRange(timerange, TimeUtil.TIME_DIGITS);
        var firstNonZeroDigit = 7;
        while (firstNonZeroDigit > 3 && timerange[firstNonZeroDigit - 1] === 0 && timerange[firstNonZeroDigit + TimeUtil.TIME_DIGITS - 1] === 0) {
            firstNonZeroDigit -= 1;
        }
        switch (firstNonZeroDigit) {
            case 2:
                return ss1.substring(0, 10) + "/" + ss2.substring(0, 10);
            case 3:
                return ss1.substring(0, 10) + "/" + ss2.substring(0, 10);
            case 4:
                return ss1.substring(0, 16) + "Z/" + ss2.substring(0, 16) + "Z";
            case 5:
                return ss1.substring(0, 16) + "Z/" + ss2.substring(0, 16) + "Z";
            case 6:
                return ss1.substring(0, 19) + "Z/" + ss2.substring(0, 19) + "Z";
            default:
                return ss1 + "/" + ss2;
        }
    }

    /**
     * return the string as a formatted string, which can be at an offset of seven positions 
     * to format the end date.
     * @param nn fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
     * @param offset 0 or 7 
     * @return formatted time "1999-12-31T23:00:00.000000000Z"
     * @see #isoTimeFromArray(int[]) 
     */
    static formatIso8601TimeInTimeRange(nn, offset) {
        switch (offset) {
            case 0:
                return TimeUtil.isoTimeFromArray(nn);
            case 7:
                var copy = TimeUtil.getStopTime(nn);
                return TimeUtil.isoTimeFromArray(copy);
            default:
                throw "offset must be 0 or 7";
        }
    }

    /**
     * return the string as a formatted string.
     * @param nn seven-element array of [ Y m d H M S nanos ]
     * @return formatted time "1999-12-31T23:00:00.000000000Z"
     * @see #isoTimeFromArray(int[]) 
     */
    static formatIso8601Time(nn) {
        return TimeUtil.isoTimeFromArray(nn);
    }

    /**
     * format the duration into human-readable time, for example
     * [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
     * @param nn seven-element array of [ Y m d H M S nanos ]
     * @return ISO8601 duration
     */
    static formatIso8601Duration(nn) {
        var units = ['Y', 'M', 'D', 'H', 'M', 'S'];
        if (nn.length > 7) throw "decomposed time can have at most 7 digits";
        var sb = "P";
        var n = (nn.length < 5) ? nn.length : 5;
        var needT = false;
        for ( var i = 0; i < n; i++) {
            if (i === 3) needT = true;
            if (nn[i] > 0) {
                if (needT) {
                    sb+= "T";
                    needT = false;
                }
                sb+= nn[i] + units[i];
            }
        }
        if (nn.length > 5 && nn[5] > 0 || nn.length > 6 && nn[6] > 0 || sb.length === 2) {
            if (needT) {
                sb+= "T";
            }
            var seconds = nn[5];
            var nanoseconds = nn.length === 7 ? nn[6] : 0;
            if (nanoseconds === 0) {
                sb+= seconds;
            } else {
                if (nanoseconds % 1000000 === 0) {
                    sb+= sprintf("%.3f",seconds + nanoseconds / 1e9);
                } else {
                    if (nanoseconds % 1000 === 0) {
                        sb+= sprintf("%.6f",seconds + nanoseconds / 1e9);
                    } else {
                        sb+= sprintf("%.9f",seconds + nanoseconds / 1e9);
                    }
                }
            }
            sb+= "S";
        }
        if (sb.length === 1) {
            if (nn.length > 3) {
                sb+= "T0S";
            } else {
                sb+= "0D";
            }
        }
        return sb;
    }

    static iso8601duration = "P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?";

    /**
     * Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
     */
    static iso8601DurationPattern = new RegExp("P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?");

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
    static parseISO8601Duration(stringIn) {
        var m = TimeUtil.iso8601DurationPattern.exec(stringIn);
        if (m!=null) {
            var dsec = TimeUtil.parseDouble(m[13], 0);
            var sec = Math.trunc( dsec );
            var nanosec = Math.trunc( ((dsec - sec) * 1e9) );
            return [TimeUtil.parseIntegerDeft(m[2], 0), TimeUtil.parseIntegerDeft(m[4], 0), TimeUtil.parseIntegerDeft(m[6], 0), TimeUtil.parseIntegerDeft(m[9], 0), TimeUtil.parseIntegerDeft(m[11], 0), sec, nanosec];
        } else {
            if (stringIn.contains("P") && stringIn.contains("S") && !stringIn.contains("T")) {
                throw "ISO8601 duration expected but not found.  Was the T missing before S?";
            } else {
                throw "ISO8601 duration expected but not found.";
            }
        }
    }

    /**
     * return the UTC current time, to the millisecond, in seven components.
     * @return the current time, to the millisecond
     */
    static now() {
        var s = new Date().toISOString();
        return [
            parseInt(s.substring(0,4)),
            parseInt(s.substring(5,7)),
            parseInt(s.substring(8,10)),
            parseInt(s.substring(11,13)),
            parseInt(s.substring(14,16)),
            parseInt(s.substring(17,19)),
            parseInt(s.substring(20,23)) * 1000000 
        ]
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
    static isoTimeToArray(time) {
        var result;
        if (time.length === 4) {
            result = [Integer.parseInt(time), 1, 1, 0, 0, 0, 0];
        } else {
            if (time.startsWith("now") || time.startsWith("last")) {
                var n;
                var remainder = null;
                if (time.startsWith("now")) {
                    n = TimeUtil.now();
                    remainder = time.substring(3);
                } else {
                    var p = new RegExp("last([a-z]+)([\\+|\\-]P.*)?");
                    var m = p.exec(time);
                    if (m!=null) {
                        n = TimeUtil.now();
                        var unit = m[1];
                        remainder = m[2];
                        var idigit;
                        switch (unit) {
                            case "year":
                                idigit = 1;
                                break
                            case "month":
                                idigit = 2;
                                break
                            case "day":
                                idigit = 3;
                                break
                            case "hour":
                                idigit = 4;
                                break
                            case "minute":
                                idigit = 5;
                                break
                            case "second":
                                idigit = 6;
                                break
                            default:
                                throw "unsupported unit: " + unit;
                        }
                        for ( var id = Math.max(1, idigit); id < TimeUtil.DATE_DIGITS; id++) {
                            n[id] = 1;
                        }
                        for ( var id = Math.max(TimeUtil.DATE_DIGITS, idigit); id < TimeUtil.TIME_DIGITS; id++) {
                            n[id] = 0;
                        }
                    } else {
                        throw "expected lastday+P1D, etc";
                    }
                }
                if ( remainder === undefined || remainder === null || remainder.length === 0) {
                    return n;
                } else {
                    if (remainder.charAt(0) == '-') {
                        try {
                            return TimeUtil.subtract(n, TimeUtil.parseISO8601Duration(remainder.substring(1)));
                        } catch (ex) {
                            throw ex;
                        }
                    } else {
                        if (remainder.charAt(0) == '+') {
                            try {
                                return TimeUtil.add(n, TimeUtil.parseISO8601Duration(remainder.substring(1)));
                            } catch (ex) {
                                throw ex;
                            }
                        }
                    }
                }
                return TimeUtil.now();
            } else {
                if (time.length < 7) {
                    throw "time must have 4 or greater than 7 elements";
                }
                if (time.length === 7) {
                    if (time.charAt(4) == 'W') {
                        // 2022W08
                        var year = TimeUtil.parseInteger(time.substring(0, 4));
                        var week = TimeUtil.parseInteger(time.substring(5));
                        result = [year, 0, 0, 0, 0, 0, 0];
                        TimeUtil.fromWeekOfYear(year, week, result);
                        time = "";
                    } else {
                        result = [TimeUtil.parseInteger(time.substring(0, 4)), TimeUtil.parseInteger(time.substring(5, 7)), 1, 0, 0, 0, 0];
                        time = "";
                    }
                } else {
                    if (time.length === 8) {
                        if (time.charAt(5) == 'W') {
                            // 2022-W08
                            var year = TimeUtil.parseInteger(time.substring(0, 4));
                            var week = TimeUtil.parseInteger(time.substring(6));
                            result = [year, 0, 0, 0, 0, 0, 0];
                            TimeUtil.fromWeekOfYear(year, week, result);
                            time = "";
                        } else {
                            result = [TimeUtil.parseInteger(time.substring(0, 4)), 1, TimeUtil.parseInteger(time.substring(5, 8)), 0, 0, 0, 0];
                            time = "";
                        }
                    } else {
                        if (time.charAt(8) == 'T') {
                            result = [TimeUtil.parseInteger(time.substring(0, 4)), 1, TimeUtil.parseInteger(time.substring(5, 8)), 0, 0, 0, 0];
                            time = time.substring(9);
                        } else {
                            if (time.charAt(8) == 'Z') {
                                result = [TimeUtil.parseInteger(time.substring(0, 4)), 1, TimeUtil.parseInteger(time.substring(5, 8)), 0, 0, 0, 0];
                                time = time.substring(9);
                            } else {
                                result = [TimeUtil.parseInteger(time.substring(0, 4)), TimeUtil.parseInteger(time.substring(5, 7)), TimeUtil.parseInteger(time.substring(8, 10)), 0, 0, 0, 0];
                                if (time.length === 10) {
                                    time = "";
                                } else {
                                    time = time.substring(11);
                                }
                            }
                        }
                    }
                }
                if (time.endsWith("Z")) {
                    time = time.substring(0, time.length - 1);
                }
                if (time.length >= 2) {
                    result[3] = TimeUtil.parseInteger(time.substring(0, 2));
                }
                if (time.length >= 5) {
                    result[4] = TimeUtil.parseInteger(time.substring(3, 5));
                }
                if (time.length >= 8) {
                    result[5] = TimeUtil.parseInteger(time.substring(6, 8));
                }
                if (time.length > 9) {
                    result[6] = Math.trunc( (Math.pow(10, 18 - time.length)) ) * TimeUtil.parseInteger(time.substring(9));
                }
                TimeUtil.normalizeTime(result);
            }
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
    static reformatIsoTime(exampleForm, time) {
        var c = exampleForm.charAt(8);
        var nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time));
        switch (c) {
            case 'T':
                // $Y-$jT
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = sprintf("%d-%03dT%02d:%02d:%02d.%09dZ",nn[0], nn[2], nn[3], nn[4], nn[5], nn[6]);
                break
            case 'Z':
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = sprintf("%d-%03dZ",nn[0], nn[2]);
                break
            default:
                if (exampleForm.length === 10) {
                    c = 'Z';
                } else {
                    c = exampleForm.charAt(10);
                }

                if (c == 'T') {
                    // $Y-$jT
                    time = sprintf("%d-%02d-%02dT%02d:%02d:%02d.%09dZ",nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
                } else {
                    if (c == 'Z') {
                        time = sprintf("%d-%02d-%02dZ",nn[0], nn[1], nn[2]);
                    }
                }

                break
        }
        if (exampleForm.endsWith("Z")) {
            return time.substring(0, exampleForm.length - 1) + "Z";
        } else {
            return time.substring(0, exampleForm.length);
        }
    }

    static VALID_FIRST_YEAR = 1900;

    static VALID_LAST_YEAR = 2100;

    /**
     * this returns true or throws an IllegalArgumentException indicating the problem.
     * @param time the seven-component time.
     * @return true or throws an IllegalArgumentException
     */
    static isValidTime(time) {
        var year = time[0];
        if (year < TimeUtil.VALID_FIRST_YEAR) throw "invalid year at position 0";
        if (year > TimeUtil.VALID_LAST_YEAR) throw "invalid year at position 0";
        var month = time[1];
        if (month < 1) throw "invalid month at position 1";
        if (month > 12) throw "invalid month at position 1";
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        var dayOfMonth = time[2];
        if (month > 1) {
            if (dayOfMonth > TimeUtil.DAYS_IN_MONTH[leap][month]) {
                throw "day of month is too large at position 2";
            }
        } else {
            if (dayOfMonth > TimeUtil.DAY_OFFSET[leap][13]) {
                throw "day of year is too large at position 2";
            }
        }
        if (dayOfMonth < 1) throw "day is less than 1 at position 2";
        return true;
    }

    /**
     * return the number of days in the month.
     * @param year the year 
     * @param month the month
     * @return the number of days in the month.
     * @see #isLeapYear(int) 
     */
    static daysInMonth(year, month) {
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        return TimeUtil.DAYS_IN_MONTH[leap][month];
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
    static normalizeTime(time) {
        while (time[6] >= 1000000000) {
            time[5] += 1;
            time[6] -= 1000000000;
        }
        while (time[5] > 59) {
            // TODO: leap seconds?
            time[4] += 1;
            time[5] -= 60;
        }
        while (time[4] > 59) {
            time[3] += 1;
            time[4] -= 60;
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
            time[4] -= 1;
            // take a minute
            time[5] += 60;
        }
        if (time[4] < 0) {
            time[3] -= 1;
            // take an hour
            time[4] += 60;
        }
        if (time[3] < 0) {
            time[2] -= 1;
            // take a day
            time[3] += 24;
        }
        if (time[2] < 1) {
            time[1] -= 1;
            // take a month
            var daysInMonth;
            if (time[1] === 0) {
                daysInMonth = 31;
            } else {
                if (TimeUtil.isLeapYear(time[0])) {
                    // This was  TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]] . TODO: review!
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[1][time[1]];
                } else {
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[0][time[1]];
                }
            }
            time[2] += daysInMonth;
        }
        if (time[1] < 1) {
            time[0] -= 1;
            // take a year
            time[1] += 12;
        }
        if (time[3] > 24) {
            throw "time[3] is greater than 24 (hours)";
        }
        if (time[1] > 12) {
            time[0] += 1;
            time[1] -= 12;
        }
        if (time[1] === 12 && time[2] > 31 && time[2] < 62) {
            time[0] += 1;
            time[1] = 1;
            time[2] -= 31;
            return;
        }
        var leap = TimeUtil.isLeapYear(time[0]) ? 1 : 0;
        if (time[2] === 0) {
            //TODO: tests don't hit this branch, and I'm not sure it can occur.
            time[1] -= 1;
            if (time[1] === 0) {
                time[0] -= 1;
                time[1] = 12;
            }
            time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        }
        var d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
        while (time[2] > d) {
            time[1] += 1;
            time[2] -= d;
            d = TimeUtil.DAYS_IN_MONTH[leap][time[1]];
            if (time[1] > 12) {
                throw "time[2] is too big";
            }
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
    static julianDay(year, month, day) {
        if (year <= 1582) {
            throw "year must be more than 1582";
        }
        var jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) - Math.floor(3 * (Math.floor((year + Math.floor((month - 9) / 7)) / 100) + 1) / 4) + Math.floor(275 * month / 9) + day + 1721029;
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
    static fromJulianDay(julian) {
        var j = julian + 32044;
        var g = Math.floor(j / 146097);
        var dg = j % 146097;
        var c = Math.floor((Math.floor(dg / 36524) + 1) * 3 / 4);
        var dc = dg - c * 36524;
        var b = Math.floor(dc / 1461);
        var db = dc % 1461;
        var a = Math.floor((Math.floor(db / 365) + 1) * 3 / 4);
        var da = db - a * 365;
        var y = g * 400 + c * 100 + b * 4 + a;
        var m = Math.floor((da * 5 + 308) / 153) - 2;
        var d = da - Math.floor((m + 4) * 153 / 5) + 122;
        var Y = y - 4800 + Math.floor((m + 2) / 12);
        var M = (m + 2) % 12 + 1;
        var D = d + 1;
        var result = [];
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
    static dayOfWeek(year, month, day) {
        var jd = TimeUtil.julianDay(year, month, day);
        var daysSince2022 = jd - TimeUtil.julianDay(2022, 1, 1);
        var mod7 = (daysSince2022 - 2) % 7;
        if (mod7 < 0) mod7 = mod7 + 7;
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
    static fromWeekOfYear(year, weekOfYear, time) {
        time[0] = year;
        var day = TimeUtil.dayOfWeek(year, 1, 1);
        var doy;
        if (day < 4) {
            doy = (weekOfYear * 7 - 7 - day) + 1;
            if (doy < 1) {
                time[0] = time[0] - 1;
                if (TimeUtil.isLeapYear(time[0])) {
                    // was  doy= doy + ( isLeapYear(time[0]) ? 366 : 365 );  TODO: verify
                    doy = doy + 366;
                } else {
                    doy = doy + 365;
                }
            }
        } else {
            doy = weekOfYear * 7 - day + 1;
        }
        time[1] = 1;
        time[2] = doy;
        TimeUtil.normalizeTime(time);
    }

    /**
     * use consistent naming so that the parser is easier to find.
     * @param string iso8601 time like "2022-03-12T11:17" (Z is assumed).
     * @return seven-element decomposed time [ Y, m, d, H, M, S, N ]
     * @throws ParseException when the string cannot be parsed.
     * @see #isoTimeToArray(java.lang.String) 
     */
    static parseISO8601Time(string) {
        return TimeUtil.isoTimeToArray(string);
    }

    /**
     * parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
     * start and stop times, returned in a 14 element array of ints.
     * @param stringIn string to parse, like "1998-01-02/1998-01-17"
     * @return the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
     * @throws ParseException when the string cannot be used
     */
    static parseISO8601TimeRange(stringIn) {
        var ss = stringIn.split("/");
        if (ss.length !== 2) {
            throw "expected one slash (/) splitting start and stop times.";
        }
        if (ss[0].length === 0 || !(/[0-9]/.test(ss[0].charAt(0)) || ss[0].charAt(0) == 'P' || ss[0].startsWith("now"))) {
            throw "first time/duration is misformatted.  Should be ISO8601 time or duration like P1D.";
        }
        if (ss[1].length === 0 || !(/[0-9]/.test(ss[1].charAt(0)) || ss[1].charAt(0) == 'P' || ss[1].startsWith("now"))) {
            throw "second time/duration is misformatted.  Should be ISO8601 time or duration like P1D.";
        }
        var result = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        if (ss[0].startsWith("P")) {
            var duration = TimeUtil.parseISO8601Duration(ss[0]);
            var time = TimeUtil.isoTimeToArray(ss[1]);
            for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
                result[i] = time[i] - duration[i];
            }
            TimeUtil.normalizeTime(result);
            TimeUtil.setStopTime(time, result);
            return result;
        } else {
            if (ss[1].startsWith("P")) {
                var time = TimeUtil.isoTimeToArray(ss[0]);
                var duration = TimeUtil.parseISO8601Duration(ss[1]);
                TimeUtil.setStartTime(time, result);
                var stoptime = [];
                for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
                    stoptime[i] = time[i] + duration[i];
                }
                TimeUtil.normalizeTime(stoptime);
                TimeUtil.setStopTime(stoptime, result);
                return result;
            } else {
                var starttime = TimeUtil.isoTimeToArray(ss[0]);
                var stoptime = TimeUtil.isoTimeToArray(ss[1]);
                TimeUtil.setStartTime(starttime, result);
                TimeUtil.setStopTime(stoptime, result);
                return result;
            }
        }
    }

    /**
     * subtract the offset from the base time.
     *
     * @param base a time
     * @param offset offset in each component.
     * @return a time
     */
    static subtract(base, offset) {
        var result = [];
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            result[i] = base[i] - offset[i];
        }
        if (result[0] > 400) {
            TimeUtil.normalizeTime(result);
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
    static add(base, offset) {
        var result = [];
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            result[i] = base[i] + offset[i];
        }
        TimeUtil.normalizeTime(result);
        return result;
    }

    /**
     * true if t1 is after t2.
     * @param t1 seven-component time
     * @param t2 seven-component time
     * @return true if t1 is after t2.
     */
    static gt(t1, t2) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            if (t1[i] > t2[i]) {
                return true;
            } else {
                if (t1[i] < t2[i]) {
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * true if t1 is equal to t2.
     * @param t1 seven-component time
     * @param t2 seven-component time
     * @return true if t1 is equal to t2.
     */
    static eq(t1, t2) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            if (t1[i] !== t2[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) 
     */
    static formatIso8601TimeBrief(time) {
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0);
    }

    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param time seven element time range
     * @param offset the offset into the time array (7 for stop time in 14-element range array).
     * @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[]) 
     */
    static formatIso8601TimeInTimeRangeBrief(time, offset) {
        var stime = TimeUtil.formatIso8601TimeInTimeRange(time, offset);
        var nanos = time[TimeUtil.COMPONENT_NANOSECOND + offset];
        var micros = nanos % 1000;
        var millis = nanos % 10000000;
        if (nanos === 0) {
            if (time[5 + offset] === 0) {
                return stime.substring(0, 16) + "Z";
            } else {
                return stime.substring(0, 19) + "Z";
            }
        } else {
            if (millis === 0) {
                return stime.substring(0, 23) + "Z";
            } else {
                if (micros === 0) {
                    return stime.substring(0, 26) + "Z";
                } else {
                    return stime;
                }
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
    static nextRange(timerange) {
        var result = [];
        var width = [];
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i];
        }
        if (width[5] < 0) {
            width[5] = width[5] + 60;
            width[4] = width[4] - 1;
        }
        if (width[4] < 0) {
            width[4] = width[4] + 60;
            width[3] = width[3] - 1;
        }
        if (width[3] < 0) {
            width[3] = width[3] + 24;
            width[2] = width[2] - 1;
        }
        if (width[2] < 0) {
            var daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil.COMPONENT_YEAR], timerange[TimeUtil.COMPONENT_MONTH]);
            width[2] = width[2] + daysInMonth;
            width[1] = width[1] - 1;
        }
        if (width[1] < 0) {
            width[1] = width[1] + 12;
            width[0] = width[0] - 1;
        }
        // System.arraycopy( range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
        TimeUtil.setStartTime(TimeUtil.getStopTime(timerange), result);
        // This creates an extra array, but let's not worry about that.
        TimeUtil.setStopTime(TimeUtil.add(TimeUtil.getStopTime(timerange), width), result);
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
    static previousRange(timerange) {
        var result = [];
        var width = [];
        for ( var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i];
        }
        if (width[5] < 0) {
            width[5] = width[5] + 60;
            width[4] = width[4] - 1;
        }
        if (width[4] < 0) {
            width[4] = width[4] + 60;
            width[3] = width[3] - 1;
        }
        if (width[3] < 0) {
            width[3] = width[3] + 24;
            width[2] = width[2] - 1;
        }
        if (width[2] < 0) {
            var daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil.COMPONENT_YEAR], timerange[TimeUtil.COMPONENT_MONTH]);
            width[2] = width[2] + daysInMonth;
            width[1] = width[1] - 1;
        }
        if (width[1] < 0) {
            width[1] = width[1] + 12;
            width[0] = width[0] - 1;
        }
        TimeUtil.setStopTime(TimeUtil.getStartTime(timerange), result);
        TimeUtil.setStartTime(TimeUtil.subtract(TimeUtil.getStartTime(timerange), width), result);
        return result;
    }

    /**
     * return true if this is a valid time range having a non-zero width.
     * @param timerange
     * @return 
     */
    static isValidTimeRange(timerange) {
        var start = TimeUtil.getStartTime(timerange);
        var stop = TimeUtil.getStopTime(timerange);
        return TimeUtil.isValidTime(start) && TimeUtil.isValidTime(stop) && TimeUtil.gt(stop, start);
    }

}


