/* Generated from Java with JSweet 3.0.0 - http://www.jsweet.org */
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
 * @class
 */
var TimeUtil = /** @class */ (function () {
    function TimeUtil() {
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
     * @param {string} exampleForm isoTime string.
     * @param {string} time the time in any allowed isoTime format
     * @return {string} same time but in the same form as exampleForm.
     */
    TimeUtil.reformatIsoTime = function (exampleForm, time) {
        var c = exampleForm.charAt(8);
        var nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time));
        switch ((c).charCodeAt(0)) {
            case 84 /* 'T' */:
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = javaemul.internal.StringHelper.format("%d-%03dT%02d:%02d:%02d.%09dZ", nn[0], nn[2], nn[3], nn[4], nn[5], nn[6]);
                break;
            case 90 /* 'Z' */:
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2]);
                nn[1] = 1;
                time = javaemul.internal.StringHelper.format("%d-%03dZ", nn[0], nn[2]);
                break;
            default:
                if (exampleForm.length === 10) {
                    c = 'Z';
                }
                else {
                    c = exampleForm.charAt(10);
                }
                if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(c) == 'T'.charCodeAt(0)) {
                    time = javaemul.internal.StringHelper.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
                }
                else if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(c) == 'Z'.charCodeAt(0)) {
                    time = javaemul.internal.StringHelper.format("%d-%02d-%02dZ", nn[0], nn[1], nn[2]);
                }
                break;
        }
        if ( /* endsWith */(function (str, searchString) { var pos = str.length - searchString.length; var lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(exampleForm, "Z")) {
            return time.substring(0, exampleForm.length - 1) + "Z";
        }
        else {
            return time.substring(0, exampleForm.length);
        }
    };
    TimeUtil.monthNames_$LI$ = function () { if (TimeUtil.monthNames == null) {
        TimeUtil.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    } return TimeUtil.monthNames; };
    /**
     * return the English month name, abbreviated to three letters, for the
     * month number.
     *
     * @param {number} i month number, from 1 to 12.
     * @return {string} the month name, like "Jan" or "Dec"
     */
    TimeUtil.monthNameAbbrev = function (i) {
        return TimeUtil.monthNames_$LI$()[i - 1];
    };
    /**
     * return the month number for the English month name, such as "Jan" (1) or
     * "December" (12). The first three letters are used to look up the number,
     * and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
     * "Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
     * @param {string} s the name (case-insensitive, only the first three letters are used.)
     * @return {number} the number, for example 1 for "January"
     * @throws ParseException when month name is not recognized.
     */
    TimeUtil.monthNumber = function (s) {
        if (s.length < 3) {
            throw Object.defineProperty(new Error("need at least three letters"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.text.ParseException', 'java.lang.Exception'] });
        }
        s = s.substring(0, 3);
        for (var i = 0; i < 12; i++) {
            {
                if ( /* equalsIgnoreCase */(function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s, TimeUtil.monthNames_$LI$()[i])) {
                    return i + 1;
                }
            }
            ;
        }
        throw Object.defineProperty(new Error("Unable to parse month"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.text.ParseException', 'java.lang.Exception'] });
    };
    TimeUtil.DAYS_IN_MONTH_$LI$ = function () { if (TimeUtil.DAYS_IN_MONTH == null) {
        TimeUtil.DAYS_IN_MONTH = [[0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0], [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0]];
    } return TimeUtil.DAYS_IN_MONTH; };
    TimeUtil.DAY_OFFSET_$LI$ = function () { if (TimeUtil.DAY_OFFSET == null) {
        TimeUtil.DAY_OFFSET = [[0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365], [0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]];
    } return TimeUtil.DAY_OFFSET; };
    /**
     * count off the days between startTime and stopTime, but not including
     * stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
     * will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
     *
     * @param {string} startTime an iso time string
     * @param {string} stopTime an iso time string
     * @return {java.lang.String[]} array of times, complete days, in the form $Y-$m-$d
     */
    TimeUtil.countOffDays = function (startTime, stopTime) {
        if (stopTime.length < 10 || /* isDigit */ /\d/.test(stopTime.charAt(10)[0])) {
            throw Object.defineProperty(new Error("arguments must be $Y-$m-$dZ"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var t1;
        var t2;
        try {
            t1 = TimeUtil.parseISO8601Time(startTime);
            t2 = TimeUtil.parseISO8601Time(stopTime);
        }
        catch (ex) {
            throw Object.defineProperty(new Error(ex.message), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var j1 = TimeUtil.julianDay(t1[0], t1[1], t1[2]);
        var j2 = TimeUtil.julianDay(t2[0], t2[1], t2[2]);
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(null); return a; })(j2 - j1);
        var time = TimeUtil.normalizeTimeString(startTime).substring(0, 10) + 'Z';
        stopTime = TimeUtil.floor(stopTime).substring(0, 10) + 'Z';
        var i = 0;
        var nn = TimeUtil.isoTimeToArray(time);
        while (( /* compareTo */time.localeCompare(stopTime) < 0)) {
            {
                result[i] = time;
                nn[2] = nn[2] + 1;
                if (nn[2] > 28)
                    TimeUtil.normalizeTime(nn);
                time = javaemul.internal.StringHelper.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
                i += 1;
            }
        }
        ;
        return result;
    };
    /**
     * true if the year between 1582 and 2400 is a leap year.
     * @param {number} year the year
     * @return {boolean} true if the year between 1582 and 2400 is a leap year.
     * @private
     */
    /*private*/ TimeUtil.isLeapYear = function (year) {
        if (year < 1582 || year > 2400) {
            throw Object.defineProperty(new Error("year must be between 1582 and 2400"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        return (year % 4) === 0 && (year % 400 === 0 || year % 100 !== 0);
    };
    /**
     * return the next day boundary. Note hours, minutes, seconds and
     * nanoseconds are ignored.
     *
     * @param {string} day any isoTime format string.
     * @return {string} the next day in $Y-$m-$dZ
     * @see #ceil(java.lang.String)
     * @see #previousDay(java.lang.String)
     */
    TimeUtil.nextDay = function (day) {
        var nn = TimeUtil.isoTimeToArray(day);
        nn[2] = nn[2] + 1;
        TimeUtil.normalizeTime(nn);
        return javaemul.internal.StringHelper.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
    };
    /**
     * return the previous day boundary. Note hours, minutes, seconds and
     * nanoseconds are ignored.
     *
     * @param {string} day any isoTime format string.
     * @return {string} the next day in $Y-$m-$dZ
     * @see #floor(java.lang.String)
     * @see #nextDay(java.lang.String)
     */
    TimeUtil.previousDay = function (day) {
        var nn = TimeUtil.isoTimeToArray(day);
        nn[2] = nn[2] - 1;
        TimeUtil.normalizeTime(nn);
        return javaemul.internal.StringHelper.format("%04d-%02d-%02dZ", nn[0], nn[1], nn[2]);
    };
    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
     * @param {string} time any isoTime format string.
     * @return {string} the next midnight or the value if already at midnight.
     */
    TimeUtil.ceil = function (time) {
        time = TimeUtil.normalizeTimeString(time);
        if (time.substring(11) === ("00:00:00.000000000Z")) {
            return time;
        }
        else {
            return TimeUtil.nextDay(time.substring(0, 11)).substring(0, 10) + "T00:00:00.000000000Z";
        }
    };
    /**
     * return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
     * value (normalized) if we are already at a boundary.
     *
     * @param {string} time any isoTime format string.
     * @return {string} the previous midnight or the value if already at midnight.
     */
    TimeUtil.floor = function (time) {
        time = TimeUtil.normalizeTimeString(time);
        if (time.substring(11) === ("00:00:00.000000000Z")) {
            return time;
        }
        else {
            return time.substring(0, 10) + "T00:00:00.000000000Z";
        }
    };
    /**
     * return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
     *
     * @param {string} time any isoTime format string.
     * @return {string} the time in standard form.
     */
    TimeUtil.normalizeTimeString = function (time) {
        var nn = TimeUtil.isoTimeToArray(time);
        TimeUtil.normalizeTime(nn);
        return javaemul.internal.StringHelper.format("%d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    };
    /**
     * fast parser requires that each character of string is a digit.  Note this
     * does not check the the numbers are digits!
     *
     * @param {string} s string containing an integer
     * @return {number} the integer
     * @private
     */
    /*private*/ TimeUtil.parseInt = function (s) {
        var result;
        var len = s.length;
        for (var i = 0; i < len; i++) {
            {
                var c = s.charAt(i);
                if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(c) < 48 || (function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(c) >= 58) {
                    throw Object.defineProperty(new Error("only digits are allowed in string"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                }
            }
            ;
        }
        switch ((len)) {
            case 2:
                result = 10 * ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(0)) - 48) + ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(1)) - 48);
                return result;
            case 3:
                result = 100 * ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(0)) - 48) + 10 * ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(1)) - 48) + ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(2)) - 48);
                return result;
            default:
                result = 0;
                for (var i = 0; i < s.length; i++) {
                    {
                        result = 10 * result + ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(s.charAt(i)) - 48);
                    }
                    ;
                }
                return result;
        }
    };
    /**
     * fast parser requires that each character of string is a digit.
     *
     * @param {string} s the number, containing 1 or more digits.
     * @return {number} the int value
     * @param {number} deft
     * @private
     */
    /*private*/ TimeUtil.parseIntDeft = function (s, deft) {
        if (s == null) {
            return deft;
        }
        return TimeUtil.parseInt(s);
    };
    /*private*/ TimeUtil.parseDouble = function (val, deft) {
        if (val == null) {
            if (deft !== -99) {
                return deft;
            }
            else {
                throw Object.defineProperty(new Error("bad digit"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
            }
        }
        var n = val.length - 1;
        if ( /* isLetter *//[a-zA-Z]/.test(val.charAt(n)[0])) {
            return /* parseDouble */ parseFloat(val.substring(0, n));
        }
        else {
            return /* parseDouble */ parseFloat(val);
        }
    };
    /**
     * return the array formatted as ISO8601 time, formatted to nanoseconds.
     * For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
     * formatted to "1999-12-31T23:00:00.000000000Z";
     * @param {int[]} nn the decomposed time
     * @return {string} the formatted time.
     * @see #isoTimeToArray(java.lang.String)
     */
    TimeUtil.isoTimeFromArray = function (nn) {
        if (nn[1] === 1 && nn[2] > 31) {
            var month = TimeUtil.monthForDayOfYear(nn[0], nn[2]);
            var dom1 = TimeUtil.dayOfYear(nn[0], month, 1);
            nn[2] = nn[2] - dom1 + 1;
            nn[1] = month;
        }
        return javaemul.internal.StringHelper.format("%04d-%02d-%02dT%02d:%02d:%02d.%09dZ", nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6]);
    };
    /**
     * format the time range components into iso8601 time range.
     * @param {int[]} nn 14-element time range
     * @return {string} efficient representation of the time range
     */
    TimeUtil.formatIso8601TimeRange = function (nn) {
        var ss1 = TimeUtil.formatIso8601TimeInTimeRange(nn, 0);
        var ss2 = TimeUtil.formatIso8601TimeInTimeRange(nn, TimeUtil.TIME_DIGITS);
        var firstNonZeroDigit = 7;
        while ((firstNonZeroDigit > 3 && nn[firstNonZeroDigit - 1] === 0 && nn[firstNonZeroDigit + TimeUtil.TIME_DIGITS - 1] === 0)) {
            {
                firstNonZeroDigit -= 1;
            }
        }
        ;
        switch ((firstNonZeroDigit)) {
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
    };
    TimeUtil.formatIso8601Time$int_A$int = function (time, offset) {
        return TimeUtil.formatIso8601TimeInTimeRange(time, offset);
    };
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param {int[]} time seven element time range
     * @param {number} offset the offset into the time array (7 for stop time in 14-element range array).
     * @return {string} formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[])
     * @deprecated see formatIso8601TimeInTimeRangeBrief
     */
    TimeUtil.formatIso8601Time = function (time, offset) {
        if (((time != null && time instanceof Array && (time.length == 0 || time[0] == null || (typeof time[0] === 'number'))) || time === null) && ((typeof offset === 'number') || offset === null)) {
            return TimeUtil.formatIso8601Time$int_A$int(time, offset);
        }
        else if (((time != null && time instanceof Array && (time.length == 0 || time[0] == null || (typeof time[0] === 'number'))) || time === null) && offset === undefined) {
            return TimeUtil.formatIso8601Time$int_A(time);
        }
        else
            throw new Error('invalid overload');
    };
    /**
     * return the string as a formatted string, which can be at an offset of seven positions
     * to format the end date.
     * @param {int[]} nn fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
     * @param {number} offset 0 or 7
     * @return {string} formatted time "1999-12-31T23:00:00.000000000Z"
     * @see #isoTimeFromArray(int[])
     */
    TimeUtil.formatIso8601TimeInTimeRange = function (nn, offset) {
        switch ((offset)) {
            case 0:
                return TimeUtil.isoTimeFromArray(nn);
            case 7:
                var copy = TimeUtil.getStopTime(nn);
                return TimeUtil.isoTimeFromArray(copy);
            default:
                throw Object.defineProperty(new Error("offset must be 0 or 7"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
    };
    TimeUtil.formatIso8601Time$int_A = function (nn) {
        return TimeUtil.isoTimeFromArray(nn);
    };
    /**
     * format the duration into human-readable time, for example
     * [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
     * @param {int[]} nn seven-element array of [ Y m d H M S nanos ]
     * @return {string} ISO8601 duration
     */
    TimeUtil.formatIso8601Duration = function (nn) {
        var units = ['Y', 'M', 'D', 'H', 'M', 'S'];
        if (nn.length > 7)
            throw Object.defineProperty(new Error("decomposed time can have at most 7 digits"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        var sb = { str: "P", toString: function () { return this.str; } };
        var n = (nn.length < 5) ? nn.length : 5;
        var needT = false;
        var _loop_1 = function (i) {
            {
                if (i === 3)
                    needT = true;
                if (nn[i] > 0) {
                    if (needT) {
                        /* append */ (function (sb) { sb.str += "T"; return sb; })(sb);
                        needT = false;
                    }
                    /* append */ (function (sb) { sb.str += units[i]; return sb; })(/* append */ (function (sb) { sb.str += nn[i]; return sb; })(sb));
                }
            }
            ;
        };
        for (var i = 0; i < n; i++) {
            _loop_1(i);
        }
        if (nn.length > 5 && nn[5] > 0 || nn.length > 6 && nn[6] > 0 || /* length */ sb.str.length === 2) {
            if (needT) {
                /* append */ (function (sb) { sb.str += "T"; return sb; })(sb);
            }
            var seconds_1 = nn[5];
            var nanoseconds_1 = nn.length === 7 ? nn[6] : 0;
            if (nanoseconds_1 === 0) {
                /* append */ (function (sb) { sb.str += seconds_1; return sb; })(sb);
            }
            else if (nanoseconds_1 % 1000000 === 0) {
                /* append */ (function (sb) { sb.str += javaemul.internal.StringHelper.format("%.3f", seconds_1 + nanoseconds_1 / 1.0E9); return sb; })(sb);
            }
            else if (nanoseconds_1 % 1000 === 0) {
                /* append */ (function (sb) { sb.str += javaemul.internal.StringHelper.format("%.6f", seconds_1 + nanoseconds_1 / 1.0E9); return sb; })(sb);
            }
            else {
                /* append */ (function (sb) { sb.str += javaemul.internal.StringHelper.format("%.9f", seconds_1 + nanoseconds_1 / 1.0E9); return sb; })(sb);
            }
            /* append */ (function (sb) { sb.str += "S"; return sb; })(sb);
        }
        if ( /* length */sb.str.length === 1) {
            if (nn.length > 3) {
                /* append */ (function (sb) { sb.str += "T0S"; return sb; })(sb);
            }
            else {
                /* append */ (function (sb) { sb.str += "0D"; return sb; })(sb);
            }
        }
        return /* toString */ sb.str;
    };
    /**
     * return the UTC current time, to the millisecond, in seven components.
     * @return {int[]} the current time, to the millisecond
     */
    TimeUtil.now = function () {
        return [0, 0, 0, 0, 0, 0, 0];
    };
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
     * @param {string} time isoTime to decompose
     * @return {int[]} the decomposed time
     * @throws IllegalArgumentException when the time cannot be parsed.
     * @see #isoTimeFromArray(int[])
     * @see #parseISO8601Time(java.lang.String)
     */
    TimeUtil.isoTimeToArray = function (time) {
        var result;
        if (time.length === 4) {
            result = [/* parseInt */ parseInt(time), 1, 1, 0, 0, 0, 0];
        }
        else if ( /* startsWith */(function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(time, "now") || /* startsWith */ (function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(time, "last")) {
            var n = void 0;
            var remainder = void 0;
            if ( /* startsWith */(function (str, searchString, position) {
                if (position === void 0) { position = 0; }
                return str.substr(position, searchString.length) === searchString;
            })(time, "now")) {
                n = TimeUtil.now();
                remainder = time.substring(3);
            }
            else {
                var p = java.util.regex.Pattern.compile("last([a-z]+)([\\+|\\-]P.*)?");
                var m = p.matcher(time);
                if (m.matches()) {
                    n = TimeUtil.now();
                    var unit = m.group(1);
                    remainder = m.group(2);
                    var idigit = void 0;
                    switch ((unit)) {
                        case "year":
                            idigit = 1;
                            break;
                        case "month":
                            idigit = 2;
                            break;
                        case "day":
                            idigit = 3;
                            break;
                        case "hour":
                            idigit = 4;
                            break;
                        case "minute":
                            idigit = 5;
                            break;
                        case "second":
                            idigit = 6;
                            break;
                        default:
                            throw Object.defineProperty(new Error("unsupported unit: " + unit), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                    }
                    for (var id = Math.max(1, idigit); id < TimeUtil.DATE_DIGITS; id++) {
                        {
                            n[id] = 1;
                        }
                        ;
                    }
                    for (var id = Math.max(TimeUtil.DATE_DIGITS, idigit); id < TimeUtil.TIME_DIGITS; id++) {
                        {
                            n[id] = 0;
                        }
                        ;
                    }
                }
                else {
                    throw Object.defineProperty(new Error("expected lastday+P1D, etc"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                }
            }
            if (remainder == null || remainder.length === 0) {
                return n;
            }
            else if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(remainder.charAt(0)) == '-'.charCodeAt(0)) {
                try {
                    return TimeUtil.subtract(n, TimeUtil.parseISO8601Duration(remainder.substring(1)));
                }
                catch (ex) {
                    throw Object.defineProperty(new Error(ex.message), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                }
            }
            else if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(remainder.charAt(0)) == '+'.charCodeAt(0)) {
                try {
                    return TimeUtil.add(n, TimeUtil.parseISO8601Duration(remainder.substring(1)));
                }
                catch (ex) {
                    throw Object.defineProperty(new Error(ex.message), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                }
            }
            return TimeUtil.now();
        }
        else {
            if (time.length < 7) {
                throw Object.defineProperty(new Error("time must have 4 or greater than 7 elements"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
            }
            if (time.length === 7) {
                if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(time.charAt(4)) == 'W'.charCodeAt(0)) {
                    var year = TimeUtil.parseInt(time.substring(0, 4));
                    var week = TimeUtil.parseInt(time.substring(5));
                    result = [year, 0, 0, 0, 0, 0, 0];
                    TimeUtil.fromWeekOfYear(year, week, result);
                    time = "";
                }
                else {
                    result = [TimeUtil.parseInt(time.substring(0, 4)), TimeUtil.parseInt(time.substring(5, 7)), 1, 0, 0, 0, 0];
                    time = "";
                }
            }
            else if (time.length === 8) {
                if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(time.charAt(5)) == 'W'.charCodeAt(0)) {
                    var year = TimeUtil.parseInt(time.substring(0, 4));
                    var week = TimeUtil.parseInt(time.substring(6));
                    result = [year, 0, 0, 0, 0, 0, 0];
                    TimeUtil.fromWeekOfYear(year, week, result);
                    time = "";
                }
                else {
                    result = [TimeUtil.parseInt(time.substring(0, 4)), 1, TimeUtil.parseInt(time.substring(5, 8)), 0, 0, 0, 0];
                    time = "";
                }
            }
            else if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(time.charAt(8)) == 'T'.charCodeAt(0)) {
                result = [TimeUtil.parseInt(time.substring(0, 4)), 1, TimeUtil.parseInt(time.substring(5, 8)), 0, 0, 0, 0];
                time = time.substring(9);
            }
            else if ((function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(time.charAt(8)) == 'Z'.charCodeAt(0)) {
                result = [TimeUtil.parseInt(time.substring(0, 4)), 1, TimeUtil.parseInt(time.substring(5, 8)), 0, 0, 0, 0];
                time = time.substring(9);
            }
            else {
                result = [TimeUtil.parseInt(time.substring(0, 4)), TimeUtil.parseInt(time.substring(5, 7)), TimeUtil.parseInt(time.substring(8, 10)), 0, 0, 0, 0];
                if (time.length === 10) {
                    time = "";
                }
                else {
                    time = time.substring(11);
                }
            }
            if ( /* endsWith */(function (str, searchString) { var pos = str.length - searchString.length; var lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(time, "Z")) {
                time = time.substring(0, time.length - 1);
            }
            if (time.length >= 2) {
                result[3] = TimeUtil.parseInt(time.substring(0, 2));
            }
            if (time.length >= 5) {
                result[4] = TimeUtil.parseInt(time.substring(3, 5));
            }
            if (time.length >= 8) {
                result[5] = TimeUtil.parseInt(time.substring(6, 8));
            }
            if (time.length > 9) {
                result[6] = ((Math.pow(10, 18 - time.length)) | 0) * TimeUtil.parseInt(time.substring(9));
            }
            TimeUtil.normalizeTime(result);
        }
        return result;
    };
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
     * @param {number} year the year
     * @param {number} month the month, from 1 to 12.
     * @param {number} day the day in the month.
     * @return {number} the day of year.
     */
    TimeUtil.dayOfYear = function (year, month, day) {
        if (month === 1) {
            return day;
        }
        if (month < 1) {
            throw Object.defineProperty(new Error("month must be greater than 0."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        if (month > 12) {
            throw Object.defineProperty(new Error("month must be less than 12."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        if (day > 366) {
            throw Object.defineProperty(new Error("day (" + day + ") must be less than 366."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        return TimeUtil.DAY_OFFSET_$LI$()[leap][month] + day;
    };
    /**
     * return "2" (February) for 45 for example.
     * @param {number} year the year
     * @param {number} doy the day of year.
     * @return {number} the month 1-12 of the day.
     */
    TimeUtil.monthForDayOfYear = function (year, doy) {
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        var dayOffset = TimeUtil.DAY_OFFSET_$LI$()[leap];
        if (doy < 1)
            throw Object.defineProperty(new Error("doy must be 1 or more"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        if (doy > dayOffset[13]) {
            throw Object.defineProperty(new Error("doy must be less than or equal to " + dayOffset[13]), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        for (var i = 12; i > 1; i--) {
            {
                if (dayOffset[i] < doy) {
                    return i;
                }
            }
            ;
        }
        return 1;
    };
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
     * @param {string} time the isoTime, which is parsed using
     * DateTimeFormatter.ISO_INSTANT.parse.
     * @return {number} number of non-leap-second milliseconds since 1970-01-01T00:00Z.
     * @see DateTimeFormatter#parse
     */
    TimeUtil.toMillisecondsSince1970 = function (time) {
        return 0;
    };
    /**
     * this returns true or throws an IllegalArgumentException indicating the problem.
     * @param {int[]} time the seven-component time.
     * @return {boolean} true or throws an IllegalArgumentException
     */
    TimeUtil.isValidTime = function (time) {
        var year = time[0];
        if (year < TimeUtil.VALID_FIRST_YEAR)
            throw Object.defineProperty(new Error("invalid year at position 0"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        if (year > TimeUtil.VALID_LAST_YEAR)
            throw Object.defineProperty(new Error("invalid year at position 0"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        var month = time[1];
        if (month < 1)
            throw Object.defineProperty(new Error("invalid month at position 1"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        if (month > 12)
            throw Object.defineProperty(new Error("invalid month at position 1"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        var dayOfMonth = time[2];
        if (month > 1) {
            if (dayOfMonth > TimeUtil.DAYS_IN_MONTH_$LI$()[leap][month]) {
                throw Object.defineProperty(new Error("day of month is too large at position 2"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
            }
        }
        else {
            if (dayOfMonth > TimeUtil.DAY_OFFSET_$LI$()[leap][13]) {
                throw Object.defineProperty(new Error("day of year is too large at position 2"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
            }
        }
        if (dayOfMonth < 1)
            throw Object.defineProperty(new Error("day is less than 1 at position 2"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        return true;
    };
    /**
     * return the number of days in the month.
     * @param {number} year the year
     * @param {number} month the month
     * @return {number} the number of days in the month.
     * @see #isLeapYear(int)
     */
    TimeUtil.daysInMonth = function (year, month) {
        var leap = TimeUtil.isLeapYear(year) ? 1 : 0;
        return TimeUtil.DAYS_IN_MONTH_$LI$()[leap][month];
    };
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
     * @param {int[]} time the seven-component time Y,m,d,H,M,S,nanoseconds
     */
    TimeUtil.normalizeTime = function (time) {
        while ((time[6] >= 1000000000)) {
            {
                time[5] += 1;
                time[6] -= 1000000000;
            }
        }
        ;
        while ((time[5] > 59)) {
            {
                time[4] += 1;
                time[5] -= 60;
            }
        }
        ;
        while ((time[4] > 59)) {
            {
                time[3] += 1;
                time[4] -= 60;
            }
        }
        ;
        while ((time[3] >= 24)) {
            {
                time[2] += 1;
                time[3] -= 24;
            }
        }
        ;
        if (time[6] < 0) {
            time[5] -= 1;
            time[6] += 1000000000;
        }
        if (time[5] < 0) {
            time[4] -= 1;
            time[5] += 60;
        }
        if (time[4] < 0) {
            time[3] -= 1;
            time[4] += 60;
        }
        if (time[3] < 0) {
            time[2] -= 1;
            time[3] += 24;
        }
        if (time[2] < 1) {
            time[1] -= 1;
            var daysInMonth = void 0;
            if (time[1] === 0) {
                daysInMonth = 31;
            }
            else {
                if (TimeUtil.isLeapYear(time[0])) {
                    daysInMonth = TimeUtil.DAYS_IN_MONTH_$LI$()[1][time[1]];
                }
                else {
                    daysInMonth = TimeUtil.DAYS_IN_MONTH_$LI$()[0][time[1]];
                }
            }
            time[2] += daysInMonth;
        }
        if (time[1] < 1) {
            time[0] -= 1;
            time[1] += 12;
        }
        if (time[3] > 24) {
            throw Object.defineProperty(new Error("time[3] is greater than 24 (hours)"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
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
            time[1] -= 1;
            if (time[1] === 0) {
                time[0] -= 1;
                time[1] = 12;
            }
            time[2] = TimeUtil.DAYS_IN_MONTH_$LI$()[leap][time[1]];
        }
        var d = TimeUtil.DAYS_IN_MONTH_$LI$()[leap][time[1]];
        while ((time[2] > d)) {
            {
                time[1] += 1;
                time[2] -= d;
                d = TimeUtil.DAYS_IN_MONTH_$LI$()[leap][time[1]];
                if (time[1] > 12) {
                    throw Object.defineProperty(new Error("time[2] is too big"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                }
            }
        }
        ;
    };
    /**
     * calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
     * 2022-03-12 is a Saturday, so 5 is returned.
     * @param {number} year the year
     * @param {number} month the month
     * @param {number} day the day of the month
     * @return {number} the day of the week.
     */
    TimeUtil.dayOfWeek = function (year, month, day) {
        var jd = TimeUtil.julianDay(year, month, day);
        var daysSince2022 = jd - TimeUtil.julianDay(2022, 1, 1);
        var mod7 = (daysSince2022 - 2) % 7;
        if (mod7 < 0)
            mod7 = mod7 + 7;
        return mod7;
    };
    /**
     * calculate the week of year, inserting the month into time[1] and day into time[2]
     * for the Monday which is the first day of that week.  Note week 0 is excluded from
     * ISO8601, but since the Linux date command returns this in some cases, it is allowed to
     * mean the same as week 52 of the previous year.  See
     * <a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
     *
     * @param {number} year the year of the week.
     * @param {number} weekOfYear the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
     * @param {int[]} time the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
     */
    TimeUtil.fromWeekOfYear = function (year, weekOfYear, time) {
        time[0] = year;
        var day = TimeUtil.dayOfWeek(year, 1, 1);
        var doy;
        if (day < 4) {
            doy = (weekOfYear * 7 - 7 - day) + 1;
            if (doy < 1) {
                time[0] = time[0] - 1;
                if (TimeUtil.isLeapYear(time[0])) {
                    doy = doy + 366;
                }
                else {
                    doy = doy + 365;
                }
            }
        }
        else {
            doy = weekOfYear * 7 - day + 1;
        }
        time[1] = 1;
        time[2] = doy;
        TimeUtil.normalizeTime(time);
    };
    TimeUtil.iso8601DurationPattern_$LI$ = function () { if (TimeUtil.iso8601DurationPattern == null) {
        TimeUtil.iso8601DurationPattern = java.util.regex.Pattern.compile("P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?");
    } return TimeUtil.iso8601DurationPattern; };
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
     * @param {string} stringIn theISO8601 duration.
     * @return {int[]} 7-element array with [year,mon,day,hour,min,sec,nanos]
     * @throws ParseException if the string does not appear to be valid.
     * @see #iso8601duration
     * @see #TIME_DIGITS
     */
    TimeUtil.parseISO8601Duration = function (stringIn) {
        var m = TimeUtil.iso8601DurationPattern_$LI$().matcher(stringIn);
        if (m.matches()) {
            var dsec = TimeUtil.parseDouble(m.group(13), 0);
            var sec = (dsec | 0);
            var nanosec = (((dsec - sec) * 1.0E9) | 0);
            return [TimeUtil.parseIntDeft(m.group(2), 0), TimeUtil.parseIntDeft(m.group(4), 0), TimeUtil.parseIntDeft(m.group(6), 0), TimeUtil.parseIntDeft(m.group(9), 0), TimeUtil.parseIntDeft(m.group(11), 0), sec, nanosec];
        }
        else {
            if ( /* contains */(stringIn.indexOf("P") != -1) && /* contains */ (stringIn.indexOf("S") != -1) && !(stringIn.indexOf("T") != -1)) {
                throw Object.defineProperty(new Error("ISO8601 duration expected but not found.  Was the T missing before S?"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.text.ParseException', 'java.lang.Exception'] });
            }
            else {
                throw Object.defineProperty(new Error("ISO8601 duration expected but not found."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.text.ParseException', 'java.lang.Exception'] });
            }
        }
    };
    /**
     * use consistent naming so that the parser is easier to find.
     * @param {string} string iso8601 time like "2022-03-12T11:17" (Z is assumed).
     * @return {int[]} seven-element decomposed time [ Y, m, d, H, M, S, N ]
     * @throws ParseException when the string cannot be parsed.
     * @see #isoTimeToArray(java.lang.String)
     */
    TimeUtil.parseISO8601Time = function (string) {
        return TimeUtil.isoTimeToArray(string);
    };
    /**
     * parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
     * start and stop times, returned in a 14 element array of ints.
     * @param {string} stringIn string to parse, like "1998-01-02/1998-01-17"
     * @return {int[]} the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
     * @throws ParseException when the string cannot be used
     */
    TimeUtil.parseISO8601TimeRange = function (stringIn) {
        var ss = stringIn.split("/");
        if (ss.length !== 2) {
            throw Object.defineProperty(new Error("expected one slash (/) splitting start and stop times."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        if (ss[0].length === 0 || !( /* isDigit *//\d/.test(ss[0].charAt(0)[0]) || (function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(ss[0].charAt(0)) == 'P'.charCodeAt(0) || /* startsWith */ (function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(ss[0], "now"))) {
            throw Object.defineProperty(new Error("first time/duration is misformatted.  Should be ISO8601 time or duration like P1D."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        if (ss[1].length === 0 || !( /* isDigit *//\d/.test(ss[1].charAt(0)[0]) || (function (c) { return c.charCodeAt == null ? c : c.charCodeAt(0); })(ss[1].charAt(0)) == 'P'.charCodeAt(0) || /* startsWith */ (function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(ss[1], "now"))) {
            throw Object.defineProperty(new Error("second time/duration is misformatted.  Should be ISO8601 time or duration like P1D."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(14);
        if ( /* startsWith */(function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(ss[0], "P")) {
            var duration = TimeUtil.parseISO8601Duration(ss[0]);
            var time = TimeUtil.isoTimeToArray(ss[1]);
            for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
                {
                    result[i] = time[i] - duration[i];
                }
                ;
            }
            TimeUtil.normalizeTime(result);
            TimeUtil.setStopTime(time, result);
            return result;
        }
        else if ( /* startsWith */(function (str, searchString, position) {
            if (position === void 0) { position = 0; }
            return str.substr(position, searchString.length) === searchString;
        })(ss[1], "P")) {
            var time = TimeUtil.isoTimeToArray(ss[0]);
            var duration = TimeUtil.parseISO8601Duration(ss[1]);
            TimeUtil.setStartTime(time, result);
            var stoptime = (function (s) { var a = []; while (s-- > 0)
                a.push(0); return a; })(TimeUtil.TIME_DIGITS);
            for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
                {
                    stoptime[i] = time[i] + duration[i];
                }
                ;
            }
            TimeUtil.normalizeTime(stoptime);
            TimeUtil.setStopTime(stoptime, result);
            return result;
        }
        else {
            var starttime = TimeUtil.isoTimeToArray(ss[0]);
            var stoptime = TimeUtil.isoTimeToArray(ss[1]);
            TimeUtil.setStartTime(starttime, result);
            TimeUtil.setStopTime(stoptime, result);
            return result;
        }
    };
    /**
     * return the julianDay for the year month and day. This was verified
     * against another calculation (julianDayWP, commented out above) from
     * http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
     * operations.
     *
     * @param {number} year calendar year greater than 1582.
     * @param {number} month the month number 1 through 12.
     * @param {number} day day of month. For day of year, use month=1 and doy for day.
     * @return {number} the Julian day
     * @see #fromJulianDay(int)
     */
    TimeUtil.julianDay = function (year, month, day) {
        if (year <= 1582) {
            throw Object.defineProperty(new Error("year must be more than 1582"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var jd = 367 * year - (7 * (year + ((month + 9) / 12 | 0)) / 4 | 0) - (3 * (((year + ((month - 9) / 7 | 0)) / 100 | 0) + 1) / 4 | 0) + (275 * month / 9 | 0) + day + 1721029;
        return jd;
    };
    /**
     * Break the Julian day apart into month, day year. This is based on
     * http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
     * introduced when toTimeStruct failed when the year was 1886.
     *
     * @see #julianDay( int year, int mon, int day )
     * @param {number} julian the (integer) number of days that have elapsed since the
     * initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
     * @return {int[]} a TimeStruct with the month, day and year fields set.
     */
    TimeUtil.fromJulianDay = function (julian) {
        var j = julian + 32044;
        var g = (j / 146097 | 0);
        var dg = j % 146097;
        var c = (((dg / 36524 | 0) + 1) * 3 / 4 | 0);
        var dc = dg - c * 36524;
        var b = (dc / 1461 | 0);
        var db = dc % 1461;
        var a = (((db / 365 | 0) + 1) * 3 / 4 | 0);
        var da = db - a * 365;
        var y = g * 400 + c * 100 + b * 4 + a;
        var m = ((da * 5 + 308) / 153 | 0) - 2;
        var d = da - ((m + 4) * 153 / 5 | 0) + 122;
        var Y = y - 4800 + ((m + 2) / 12 | 0);
        var M = (m + 2) % 12 + 1;
        var D = d + 1;
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        result[0] = Y;
        result[1] = M;
        result[2] = D;
        return result;
    };
    /**
     * subtract the offset from the base time.
     *
     * @param {int[]} base a time
     * @param {int[]} offset offset in each component.
     * @return {int[]} a time
     */
    TimeUtil.subtract = function (base, offset) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                result[i] = base[i] - offset[i];
            }
            ;
        }
        if (result[0] > 400) {
            TimeUtil.normalizeTime(result);
        }
        return result;
    };
    /**
     * add the offset to the base time. This should not be used to combine two
     * offsets, because the code has not been verified for this use.
     *
     * @param {int[]} base a time
     * @param {int[]} offset offset in each component.
     * @return {int[]} a time
     */
    TimeUtil.add = function (base, offset) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                result[i] = base[i] + offset[i];
            }
            ;
        }
        TimeUtil.normalizeTime(result);
        return result;
    };
    /**
     * true if t1 is after t2.
     * @param {int[]} t1 seven-component time
     * @param {int[]} t2 seven-component time
     * @return {boolean} true if t1 is after t2.
     */
    TimeUtil.gt = function (t1, t2) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                if (t1[i] > t2[i]) {
                    return true;
                }
                else if (t1[i] < t2[i]) {
                    return false;
                }
            }
            ;
        }
        return false;
    };
    /**
     * true if t1 is equal to t2.
     * @param {int[]} t1 seven-component time
     * @param {int[]} t2 seven-component time
     * @return {boolean} true if t1 is equal to t2.
     */
    TimeUtil.eq = function (t1, t2) {
        TimeUtil.normalizeTime(t1);
        TimeUtil.normalizeTime(t2);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                if (t1[i] !== t2[i]) {
                    return false;
                }
            }
            ;
        }
        return true;
    };
    /**
     * given the two times, return a 14 element time range.
     * @param {int[]} t1 a seven digit time
     * @param {int[]} t2 a seven digit time after the first time.
     * @return {int[]} a fourteen digit time range.
     * @throws IllegalArgumentException when the first time is greater than or equal to the second time.
     */
    TimeUtil.createTimeRange = function (t1, t2) {
        if (!TimeUtil.gt(t2, t1)) {
            throw Object.defineProperty(new Error("t1 is not smaller than t2"), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        }
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS * 2);
        TimeUtil.setStartTime(result, t1);
        TimeUtil.setStopTime(result, t2);
        return result;
    };
    /**
     * return the seven element start time from the time range.  Note
     * it is fine to use a time range as the start time, because codes
     * will only read the first seven components, and this is only added
     * to make code more readable.
     * @param {int[]} range a fourteen-element time range.
     * @return {int[]} the start time.
     */
    TimeUtil.getStartTime = function (range) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
            while (--size >= 0)
                dstPts[dstOff++] = srcPts[srcOff++];
        }
        else {
            var tmp = srcPts.slice(srcOff, srcOff + size);
            for (var i = 0; i < size; i++)
                dstPts[dstOff++] = tmp[i];
        } })(range, 0, result, 0, TimeUtil.TIME_DIGITS);
        return result;
    };
    /**
     * return the seven element stop time from the time range.  Note
     * it is fine to use a time range as the start time, because codes
     * will only read the first seven components.
     * @param {int[]} range a fourteen-element time range.
     * @return {int[]} the stop time.
     */
    TimeUtil.getStopTime = function (range) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
            while (--size >= 0)
                dstPts[dstOff++] = srcPts[srcOff++];
        }
        else {
            var tmp = srcPts.slice(srcOff, srcOff + size);
            for (var i = 0; i < size; i++)
                dstPts[dstOff++] = tmp[i];
        } })(range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS);
        return result;
    };
    /**
     * copy the components of time into the start position (indeces 7-14) of the time range.
     * This one-line method was introduced to clarify code and make conversion to
     * other languages (in particular Python) easier.
     * @param {int[]} time the seven-element start time
     * @param {int[]} range the fourteen-element time range.
     */
    TimeUtil.setStartTime = function (time, range) {
        /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
            while (--size >= 0)
                dstPts[dstOff++] = srcPts[srcOff++];
        }
        else {
            var tmp = srcPts.slice(srcOff, srcOff + size);
            for (var i = 0; i < size; i++)
                dstPts[dstOff++] = tmp[i];
        } })(time, 0, range, 0, TimeUtil.TIME_DIGITS);
    };
    /**
     * copy the components of time into the stop position (indeces 7-14) of the time range.
     * @param {int[]} time the seven-element stop time
     * @param {int[]} range the fourteen-element time range.
     */
    TimeUtil.setStopTime = function (time, range) {
        /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
            while (--size >= 0)
                dstPts[dstOff++] = srcPts[srcOff++];
        }
        else {
            var tmp = srcPts.slice(srcOff, srcOff + size);
            for (var i = 0; i < size; i++)
                dstPts[dstOff++] = tmp[i];
        } })(time, 0, range, TimeUtil.TIME_DIGITS, TimeUtil.TIME_DIGITS);
    };
    /**
     * format the time as milliseconds since 1970-01-01T00:00Z into a string.  The
     * number of milliseconds should not include leap seconds.
     *
     * @param {number} time the number of milliseconds since 1970-01-01T00:00Z
     * @return {string} the formatted time.
     * @see DateTimeFormatter#parse
     */
    TimeUtil.fromMillisecondsSince1970 = function (time) {
        return "1970-01-01T00:00Z";
    };
    TimeUtil.formatIso8601TimeBrief$int_A = function (time) {
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0);
    };
    TimeUtil.formatIso8601TimeBrief$int_A$int = function (time, offset) {
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time, offset);
    };
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param {int[]} time seven element time range
     * @param {number} offset the offset into the time array (7 for stop time in 14-element range array).
     * @return {string} formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[])
     * @deprecated see formatIso8601TimeInTimeRangeBrief
     */
    TimeUtil.formatIso8601TimeBrief = function (time, offset) {
        if (((time != null && time instanceof Array && (time.length == 0 || time[0] == null || (typeof time[0] === 'number'))) || time === null) && ((typeof offset === 'number') || offset === null)) {
            return TimeUtil.formatIso8601TimeBrief$int_A$int(time, offset);
        }
        else if (((time != null && time instanceof Array && (time.length == 0 || time[0] == null || (typeof time[0] === 'number'))) || time === null) && offset === undefined) {
            return TimeUtil.formatIso8601TimeBrief$int_A(time);
        }
        else
            throw new Error('invalid overload');
    };
    /**
     * format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
     * @param {int[]} time seven element time range
     * @param {number} offset the offset into the time array (7 for stop time in 14-element range array).
     * @return {string} formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
     * @see #formatIso8601TimeBrief(int[])
     */
    TimeUtil.formatIso8601TimeInTimeRangeBrief = function (time, offset) {
        var stime = TimeUtil.formatIso8601TimeInTimeRange(time, offset);
        var nanos = time[TimeUtil.COMPONENT_NANOSECOND + offset];
        var micros = nanos % 1000;
        var millis = nanos % 10000000;
        if (nanos === 0) {
            if (time[5 + offset] === 0) {
                return stime.substring(0, 16) + "Z";
            }
            else {
                return stime.substring(0, 19) + "Z";
            }
        }
        else {
            if (millis === 0) {
                return stime.substring(0, 23) + "Z";
            }
            else if (micros === 0) {
                return stime.substring(0, 26) + "Z";
            }
            else {
                return stime;
            }
        }
    };
    /**
     * return the next interval, given the 14-component time interval.  This
     * has the restrictions:<ul>
     * <li> can only handle intervals of at least one second
     * <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
     * <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
     * </ul>
     * @param {int[]} range 14-component time interval.
     * @return {int[]} 14-component time interval.
     */
    TimeUtil.nextRange = function (range) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_RANGE_DIGITS);
        var width = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                width[i] = range[i + TimeUtil.TIME_DIGITS] - range[i];
            }
            ;
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
            var daysInMonth = TimeUtil.daysInMonth(range[TimeUtil.COMPONENT_YEAR], range[TimeUtil.COMPONENT_MONTH]);
            width[2] = width[2] + daysInMonth;
            width[1] = width[1] - 1;
        }
        if (width[1] < 0) {
            width[1] = width[1] + 12;
            width[0] = width[0] - 1;
        }
        TimeUtil.setStartTime(TimeUtil.getStopTime(range), result);
        TimeUtil.setStopTime(TimeUtil.add(TimeUtil.getStopTime(range), width), result);
        return result;
    };
    /**
     * return the previous interval, given the 14-component time interval.  This
     * has the restrictions:<ul>
     * <li> can only handle intervals of at least one second
     * <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
     * <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
     * </ul>
     * @param {int[]} range 14-component time interval.
     * @return {int[]} 14-component time interval.
     */
    TimeUtil.previousRange = function (range) {
        var result = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_RANGE_DIGITS);
        var width = (function (s) { var a = []; while (s-- > 0)
            a.push(0); return a; })(TimeUtil.TIME_DIGITS);
        for (var i = 0; i < TimeUtil.TIME_DIGITS; i++) {
            {
                width[i] = range[i + TimeUtil.TIME_DIGITS] - range[i];
            }
            ;
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
            var daysInMonth = TimeUtil.daysInMonth(range[TimeUtil.COMPONENT_YEAR], range[TimeUtil.COMPONENT_MONTH]);
            width[2] = width[2] + daysInMonth;
            width[1] = width[1] - 1;
        }
        if (width[1] < 0) {
            width[1] = width[1] + 12;
            width[0] = width[0] - 1;
        }
        TimeUtil.setStopTime(TimeUtil.getStartTime(range), result);
        TimeUtil.setStartTime(TimeUtil.subtract(TimeUtil.getStartTime(range), width), result);
        return result;
    };
    /**
     * return true if this is a valid time range having a non-zero width.
     * @param {int[]} granule
     * @return {boolean}
     */
    TimeUtil.isValidTimeRange = function (granule) {
        var start = TimeUtil.getStartTime(granule);
        var stop = TimeUtil.getStopTime(granule);
        return TimeUtil.isValidTime(start) && TimeUtil.isValidTime(stop) && TimeUtil.gt(stop, start);
    };
    /**
     * Number of time components: year, month, day, hour, minute, second, nanosecond
     */
    TimeUtil.TIME_DIGITS = 7;
    /**
     * Number of components in time representation: year, month, day
     */
    TimeUtil.DATE_DIGITS = 3;
    /**
     * Number of components in a time range, which is two times.
     */
    TimeUtil.TIME_RANGE_DIGITS = 14;
    TimeUtil.COMPONENT_YEAR = 0;
    TimeUtil.COMPONENT_MONTH = 1;
    TimeUtil.COMPONENT_DAY = 2;
    TimeUtil.COMPONENT_HOUR = 3;
    TimeUtil.COMPONENT_MINUTE = 4;
    TimeUtil.COMPONENT_SECOND = 5;
    TimeUtil.COMPONENT_NANOSECOND = 6;
    TimeUtil.VALID_FIRST_YEAR = 1900;
    TimeUtil.VALID_LAST_YEAR = 2100;
    TimeUtil.iso8601duration = "P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?";
    return TimeUtil;
}());
TimeUtil["__class"] = "TimeUtil";
