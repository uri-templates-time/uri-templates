/**
 * Interface to add custom handlers for strings with unique formats.  For 
 * example, the RPWS group had files with two-hex digits indicating the 
 * ten-minute interval covered by the file name. 
 */
class FieldHandler {
    /**
     * arguments for the parser are passed in.
     * @param args map of arguments.  $(t,a1=v1,a2=v2,a3=v3)
     * @return null if the string is parseable, an error message otherwise.
     */
    configure(args) {
    }

    /**
     * return a regular expression that matches valid field entries.  ".*" can be used to match anything, but this limits use.
     * TODO: where is this used?  I added it because it's easy and I saw a TODO to add it.
     * @return null to match anything, or a regular expression matching valid entries.
     */
    getRegex() {
    }

    /**
     * parse the field to interpret as a time range.
     * @param fieldContent the field to parse, for example "2014" for $Y
     * @param startTime the current startTime
     * @param timeWidth the current timeWidth
     * @param extra extra data, such as version numbers, are passed out here.
     * @throws ParseException when the field is not consistent with the spec.
     */
    parse(fieldContent, startTime, timeWidth, extra) {
    }

    /**
     * create a string given the times, when this is possible.  An 
     * IllegalArgumentException should be thrown when this is not possible, 
     * but be loose so this can be composed with other field handlers.  
     * For example, imagine the $Y field handler.  This should not throw an 
     * exception when 2012-03-29 is passed in because it's not 2012-01-01, 
     * because the $m and $d might be used later.  However if a time is 
     * specified for a year before the first orbit of a spacecraft, then an 
     * exception should be thrown because there is an error that the 
     * developer is going to have to deal with.
     * 
     * @param startTime the startTime in [ Y, m, d, H, M, S, nanoseconds ]
     * @param timeWidth the width in [ Y, m, d, H, M, S, nanoseconds ]
     * @param length, -1 or the length of the field.
     * @param extra extra data, such as version numbers, are passed in here.
     * @return the string representing the time range specified.
     * @throws IllegalArgumentException when the arguments passed in are not sufficient.
     */
    format(startTime, timeWidth, length, extra) {
    }

}
/**
 * $(subsec;places=6)  "36" â "36 microseconds"
 */
class SubsecFieldHandler extends FieldHandler {
    places;

    nanosecondsFactor;

    formatStr;

    configure(args) {
        URITemplate.places = Integer.parseInt(URITemplate.getArg(args, "places", null));
        if (URITemplate.places > 9) throw "only nine places allowed.";
        URITemplate.nanosecondsFactor = Math.trunc( (Math.pow(10, (9 - URITemplate.places))) );
        URITemplate.formatStr = "%0" + URITemplate.places + "d";
        return null;
    }

    getRegex() {
        var b = "";
        for ( var i = 0; i < URITemplate.places; i++)                b+= "[0-9]";
        return b;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var value = parseFloat(fieldContent);
        startTime[6] = Math.trunc( (value * URITemplate.nanosecondsFactor) );
        URITemplate.timeWidth[5] = 0;
        URITemplate.timeWidth[6] = URITemplate.nanosecondsFactor;
    }

    format(startTime, timeWidth, length, extra) {
        var nn = Math.floor(startTime[6] / URITemplate.nanosecondsFactor);
        return sprintf(URITemplate.formatStr,Math.trunc( Math.round(nn) ));
    }

}
/**
 * $(hrinterval;names=a,b,c,d)  "b" â "06:00/12:00"
 */
class HrintervalFieldHandler extends FieldHandler {
    values;

    revvalues;

    /**
     * multiply by this to get the start hour
     */
    mult;

    configure(args) {
        var vs = URITemplate.getArg(args, "values", null);
        if (vs === null) vs = URITemplate.getArg(args, "names", null);
        if (vs === null) return "values must be specified for hrinterval";
        var values1 = vs.split(",");
        URITemplate.mult = 24 / values1.length;
        if (24 - URITemplate.mult * values1.length !== 0) {
            throw "only 1,2,3,4,6,8 or 12 intervals";
        }
        URITemplate.values = new Map();
        URITemplate.revvalues = new Map();
        for ( var i = 0; i < values1.length; i++) {
            URITemplate.values.set(values1[i], i);
            URITemplate.revvalues.set(i, values1[i]);
        }
        return null;
    }

    getRegex() {
        var vv = URITemplate.values.keySet().iterator();
        var r = str(vv.next());
        while (vv.hasNext()) {
            r+= "|" + str(vv.next());
        }
        return r;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var ii;
        if (URITemplate.values.has(fieldContent)) {
            ii = URITemplate.values.get(fieldContent);
        } else {
            throw "expected one of " + this.getRegex();
        }
        var hour = URITemplate.mult * ii;
        startTime[3] = hour;
        URITemplate.timeWidth[3] = URITemplate.mult;
        URITemplate.timeWidth[0] = 0;
        URITemplate.timeWidth[1] = 0;
        URITemplate.timeWidth[2] = 0;
    }

    format(startTime, timeWidth, length, extra) {
        var key = Math.floor(startTime[3] / URITemplate.mult);
        if (URITemplate.revvalues.has(key)) {
            var v = URITemplate.revvalues.get(key);
            return v;
        } else {
            throw "unable to identify enum for hour " + startTime[3];
        }
    }

}
/**
 * regular intervals are numbered:
 * $(periodic;offset=0;start=2000-001;period=P1D) "0" ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ "2000-001"
 */
class PeriodicFieldHandler extends FieldHandler {
    offset;

    start;

    julday;

    period;

    args;

    configure(args) {
        this.args = new Map();
        var s = URITemplate.getArg(URITemplate.args, "start", null);
        if (s === null) {
            return "periodic field needs start";
        }
        URITemplate.start = TimeUtil.isoTimeToArray(s);
        URITemplate.julday = TimeUtil.julianDay(URITemplate.start[0], URITemplate.start[1], URITemplate.start[2]);
        URITemplate.start[0] = 0;
        URITemplate.start[1] = 0;
        URITemplate.start[2] = 0;
        s = URITemplate.getArg(URITemplate.args, "offset", null);
        if (s === null) {
            return "periodic field needs offset";
        }
        URITemplate.offset = Integer.parseInt(s);
        s = URITemplate.getArg(URITemplate.args, "period", null);
        if (s === null) {
            return "periodic field needs period";
        }
        if (!s.startsWith("P")) {
            if (s.endsWith("D")) {
                throw "periodic unit for day is d, not D";
            }
            if (s.endsWith("d")) {
                s = "P" + s.toUpperCase();
            } else {
                s = "PT" + s.toUpperCase();
            }
        }
        try {
            URITemplate.period = TimeUtil.parseISO8601Duration(s);
        } catch (ex) {
            return "unable to parse period: " + s + "\n" + (ex.getMessage());
        }
        return null;
    }

    getRegex() {
        return "[0-9]+";
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var i = Integer.parseInt(fieldContent);
        var addOffset = i - URITemplate.offset;
        var t = [];
        var limits = [-1, -1, 0, 24, 60, 60, 1000000000];
        URITemplate.timeWidth[0] = 0;
        URITemplate.timeWidth[1] = 0;
        URITemplate.timeWidth[2] = URITemplate.period[2];
        for ( i = 6; i > 2; i--) {
            t[i] = URITemplate.start[i] + addOffset * URITemplate.period[i];
            while (t[i] > limits[i]) {
                t[i - 1] += 1;
                t[i] -= limits[i];
            }
        }
        URITemplate.timeWidth[3] = URITemplate.period[3];
        URITemplate.timeWidth[4] = URITemplate.period[4];
        URITemplate.timeWidth[5] = URITemplate.period[5];
        URITemplate.timeWidth[6] = URITemplate.period[6];
        var ts = TimeUtil.fromJulianDay(URITemplate.julday + URITemplate.timeWidth[2] * addOffset + t[2]);
        startTime[0] = ts[0];
        startTime[1] = ts[1];
        startTime[2] = ts[2];
        startTime[3] = t[3];
        startTime[4] = t[4];
        startTime[5] = t[5];
        startTime[6] = t[6];
    }

    format(startTime, timeWidth, length, extra) {
        var jd = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]);
        if (URITemplate.period[1] !== 0 || URITemplate.period[3] !== 0 || URITemplate.period[4] !== 0 || URITemplate.period[5] !== 0 || URITemplate.period[6] !== 0) {
            throw "under implemented, only integer number of days supported for formatting.";
        }
        var deltad = Math.trunc( (Math.floor((jd - this.julday) / URITemplate.period[2] )) ) + URITemplate.offset;
        var result = sprintf("%d",deltad);
        if (length > 16) {
            throw "length>16 not supported";
        } else {
            if (length > -1) {
                result = "_________________".substring(0, length - result.length) + result;
            }
        }
        return result;
    }

}
/**
 * $(enum,values=a,b,c)
 */
class EnumFieldHandler extends FieldHandler {
    values;

    id;

    configure(args) {
        URITemplate.values = new Set();
        var svalues = URITemplate.getArg(args, "values", null);
        if (svalues === null) return "need values";
        var ss = svalues.split(",");
        if (ss.length === 1) {
            var ss2 = svalues.split("|");
            if (ss2.length > 1) {
                logger.fine("supporting legacy value containing pipes for values");
                ss = ss2;
            }
        }
        URITemplate.values.addAll(ss);
        URITemplate.id = URITemplate.getArg(args, "id", "unindentifiedEnum");
        return null;
    }

    getRegex() {
        var it = URITemplate.values.iterator();
        var b = "[".append(it.next());
        while (it.hasNext()) {
            b+= "|" + str(re.escape(it.next()));
        }
        b+= "]";
        return b;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        if (!URITemplate.values.has(fieldContent)) {
            throw "value is not in enum: " + fieldContent;
        }
        extra.set(URITemplate.id, fieldContent);
    }

    format(startTime, timeWidth, length, extra) {
        var v = URITemplate.getArg(extra, URITemplate.id, null);
        if (v === null) {
            throw "\"" + URITemplate.id + "\" is undefined in extras.";
        }
        if (URITemplate.values.has(v)) {
            return v;
        } else {
            throw URITemplate.id + " value is not within enum: " + URITemplate.values;
        }
    }

    /**
     * return the possible values.
     * @return the possible values.
     */
    getValues() {
        return this.values.toArray([]);
    }

    getId() {
        return this.id;
    }

}
/**
 * $(x,name=sc,regex=[a|b])
 */
class IgnoreFieldHandler extends FieldHandler {
    regex;

    pattern;

    name;

    configure(args) {
        URITemplate.regex = URITemplate.getArg(args, "regex", null);
        if (URITemplate.regex !== null) {
            URITemplate.pattern = new RegExp(URITemplate.regex);
        }
        URITemplate.name = URITemplate.getArg(args, "name", "unnamed");
        return null;
    }

    getRegex() {
        return URITemplate.regex;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        if (URITemplate.regex !== null) {
            if (!URITemplate.pattern.exec(fieldContent)!=null) {
                throw "ignore content doesn't match regex: " + fieldContent;
            }
        }
        if (!URITemplate.name=="unnamed") {
            extra.set(URITemplate.name, fieldContent);
        }
    }

    format(startTime, timeWidth, length, extra) {
        return URITemplate.getArg(extra, URITemplate.name, "");
    }

}

    class VersioningType {
    constructor( c ) {
        this.compare= c;
    }
        
    static none = new VersioningType( null );
    
    static numeric = new VersioningType( function (s1,s2) { // 4.10 > 4.01
        var d1 = parseFloat(s1);
        var d2 = parseFloat(s2);
        return d1.compareTo(d2);
    });
    
    static alphanumeric = new VersioningType( function (s1,s2) { // a001
        return (s1.compareTo(s2));
    });
            
    static numericSplit = new VersioningType( function (s1,s2) { // 4.3.23   // 1.1.3-01 for RBSP (rbspice lev-2 isrhelt)
        var ss1 = s1.split("[\\.-]", -2);
        var ss2 = s2.split("[\\.-]", -2);
        var n = Math.min(ss1.length, ss2.length);
        for ( var i = 0; i < n; i++) {
            var d1 = Integer.parseInt(ss1[i]);
            var d2 = Integer.parseInt(ss2[i]);
            if (d1 < d2) {
                return -1;
            } else {
                if (d1 > d2) {
                    return 1;
                }
            }
        }
        return ss1.length - ss2.length;
    });
    }

    /**
     * Version field handler.  Versions are codes with special sort orders.
     */
    class VersionFieldHandler extends FieldHandler {
        versioningType;

        versionGe = null;

        /**
 the version must be greater than or equal to this if non-null. 
         */
        versionLt = null;

        /**
 the version must be less than this if non-null. 
         */
        configure(args) {
            var sep = URITemplate.getArg(args, "sep", null);
            if (sep === null && args.has("dotnotation")) {
                sep = "T";
            }
            var alpha = URITemplate.getArg(args, "alpha", null);
            if (alpha === null && args.has("alphanumeric")) {
                alpha = "T";
            }
            var type = URITemplate.getArg(args, "type", null);
            if (type !== null) {
                if (type=="sep" || type=="dotnotation") {
                    sep = "T";
                } else {
                    if (type=="alpha" || type=="alphanumeric") {
                        alpha = "T";
                    }
                }
            }
            if (args.has("gt")) {
                throw "gt specified but not supported: must be ge or lt";
            }
            if (args.has("le")) {
                throw "le specified but not supported: must be ge or lt";
            }
            var ge = URITemplate.getArg(args, "ge", null);
            if (ge !== null) {
                URITemplate.versionGe = ge;
            }
            var lt = URITemplate.getArg(args, "lt", null);
            if (lt !== null) {
                URITemplate.versionLt = lt;
            }
            if (alpha !== null) {
                if (sep !== null) {
                    return "alpha with split not supported";
                } else {
                    URITemplate.versioningType = VersioningType.alphanumeric;
                }
            } else {
                if (sep !== null) {
                    URITemplate.versioningType = VersioningType.numericSplit;
                } else {
                    URITemplate.versioningType = VersioningType.numeric;
                }
            }
            return null;
        }

        parse(fieldContent, startTime, timeWidth, extra) {
            var v = URITemplate.getArg(extra, "v", null);
            if (v !== null) {
                URITemplate.versioningType = VersioningType.numericSplit;
                fieldContent = v + "." + fieldContent;
            }
            extra.set("v", fieldContent);
        }

        getRegex() {
            return ".*";
        }

        format(startTime, timeWidth, length, extra) {
            return URITemplate.getArg(extra, "v", null);
        }

    }
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
 * URITemplate implements a URI_Template, as described in 
 * https://github.com/hapi-server/uri-templates/wiki/Specification
 * The main method shows how the library can be used to format
 * and parse codes, but briefly parsing is done using the parse
 * method:<pre>
 *   URITemplate ut= new URITemplate("/tmp/$Y$m$d_$(v,name=sc).dat");
 *   String filen1= "/tmp/20220314_3.dat";
 *   int[] itimeRange= ut.parse( filen1, new HashMap<>() );
 * </pre>
 * Formatting is done with the format method:<pre>
 *   URITemplate ut= new URITemplate("/tmp/$Y$m$d_$(v,name=sc).dat");
 *   ut.format( new int[] { 2022, 3, 14, 0, 0, 0, 0 }, new int[] { 2022, 3, 15, 0, 0, 0, 0 }, Collections.singletonMap( "sc", "3" ) );
 * </pre>
 
 * @author jbf
 */
class URITemplate {
    // J2J: Name is used twice in class: URITemplate parse
    // J2J: Name is used twice in class: URITemplate formatRange
    // J2J: Name is used twice in class: URITemplate format
    // J2J: private static final Logger logger = Logger.getLogger("hapiserver.uritemplates");
    static VERSION = "20201007a";

    static getVersion() {
        return URITemplate.VERSION;
    }

    /**
     * the earliest valid year, limited because of Julian day calculations.
     */
    static MIN_VALID_YEAR = 1582;

    /**
     * the last valid year.
     */
    static MAX_VALID_YEAR = 9000;

    /**
     * the number of elements in an int array used to store times.  The
     * seven elements are: <ul>
     * <li>0: year, the four digit common era year
     * <li>1: month, the month number between 1 and 12.
     * <li>2: day, the day of the month, starting at 1.
     * <li>3: hour, the hour of the day, starting at 0 and as much as 23.
     * <li>4: minute, the minute of the hour, starting at 0 and as much as 59.
     * <li>5: seconds, the second of the minute, starting at 0 and as much as 59, and much as 60 for leap seconds.
     * <li>6: nanoseconds, the nanoseconds into the second, starting at 0 and as much as 999999999.
     * </ul>
     */
    static NUM_TIME_DIGITS = 7;

    static YEAR = 0;

    static MONTH = 1;

    static DAY = 2;

    static HOUR = 3;

    static MINUTE = 4;

    static SECOND = 5;

    static NANOSECOND = 6;

    /**
     * initial state of the afterstop field, present when no stop time is found.
     */
    static AFTERSTOP_INIT = 999;

    /**
     * the specification, like $Y$m$d_$(Y;end)$m$d.dat
     */
    spec;

    /**
     * number of digits, or components would be a better name.  For example, $Y/$Y$m$d.dat has four digits.
     */
    ndigits;

    digits;

    /**
     * non-template stuff between fields (_ in $Y_$m) are the "delims"
     */
    delims;

    qualifiers;

    qualifiersMaps;

    fieldHandlers;

    fieldHandlersById;

    /**
     * one element for each field, it is the handler (or type) of each field.
     */
    handlers;

    /**
     * one element for each field, it is the offset to each field.
     */
    offsets;

    /**
     * one element for each field, it is number of digits in each field.
     */
    lengths;

    /**
     * shift found in each digit--going away
     */
    shift;

    /**
     * int[7] shift for each component for the start time.
     */
    startShift = null;

    /**
     * int[7] shift for each component for the stop time.
     */
    stopShift = null;

    fc;

    /**
     * first digit which is part of the stop time
     */
    stopTimeDigit;

    lsd;

    timeWidth;

    /**
     * the template explicitly defines the width, with delta or other specifiers.
     */
    timeWidthIsExplicit = false;

    regex;

    context;

    /**
     * typically zero, the number of digits which come from an external context.
     */
    externalContext;

    valid_formatCodes = ["Y", "y", "j", "m", "d", "H", "M", "S", "milli", "micro", "p", "z", "ignore", "b"];

    formatName = ["Year", "2-digit-year", "day-of-year", "month", "day", "Hour", "Minute", "Second", "millisecond", "microsecond", "am/pm", "RFC-822 numeric time zone", "ignore", "3-char-month-name"];

    formatCode_lengths = [4, 2, 3, 2, 2, 2, 2, 2, 3, 3, 2, 5, -1, 3];

    precision = [0, 0, 2, 1, 2, 3, 4, 5, 6, 7, -1, -1, -1, 1];

    startTimeOnly;

    /**
     * null or the phasestart.
     */
    phasestart;

    startLsd;

    /**
     * return the value within the map, or the deft if the argument is not in the map.
     * @param args a map (or dictionary) of the arguments
     * @param arg the argument to retrieve
     * @param deft the default value to return when the argument is not found.
     * @return the value.
     */
    static getArg(args, arg, deft) {
        if (args.has(arg)) {
            return args.get(arg);
        } else {
            return deft;
        }
    }









    /**
     * convert %() and ${} to standard $(), and support legacy modes in one
     * compact place.  Asterisk (*) is replaced with $x.
     * Note, commas may still appear in qualifier lists, and 
     * makeQualifiersCanonical will be called to remove them.
     * Copied from Das2's TimeParser.
     * @param formatString like %{Y,m=02}*.dat or $(Y;m=02)$x.dat
     * @return formatString containing canonical spec, $() and $x instead of *, like $(Y,m=02)$x.dat
     */
    static makeCanonical(formatString) {
        var wildcard = formatString.indexOf("*")!==-1;
        var oldSpec = formatString.indexOf("${")!==-1;
        var p = new RegExp("\\$[0-9]+\\{");
        var oldSpec2 = p.exec(formatString)!=null;
        if (formatString.startsWith("$") && !wildcard && !oldSpec && !oldSpec2) return formatString;
        if (formatString.indexOf("%")!==-1 && !formatString.indexOf("$")!==-1) {
            formatString = formatString.replaceAll("%", "$");
        }
        oldSpec = formatString.indexOf("${")!==-1;
        if (oldSpec && !formatString.indexOf("$(")!==-1) {
            formatString = formatString.replaceAll("${", "$(");
            formatString = formatString.replaceAll("}", ")");
        }
        if (oldSpec2 && !formatString.indexOf("$(")!==-1) {
            formatString = formatString.replaceAll("$([0-9]+){", "$$1(");
            formatString = formatString.replaceAll("}", ")");
        }
        if (wildcard) {
            formatString = formatString.replaceAll("*", "$x");
        }
        var i = 1;
        if (i < formatString.length && formatString.charAt(i) == '(') {
            i += 1;
        }
        while (i < formatString.length && /[a-z]/i.test(formatString.charAt(i))) {
            i += 1;
        }
        if (i < formatString.length && formatString.charAt(i) == ',') {
            formatString = formatString.replaceFirst(",", ";");
        }
        return formatString;
    }

    /**
     * $(subsec,places=4) --> $(subsec;places=4)
     * $(enum,values=01,02,03,id=foo) --> $(enum;values=01,02,03;id=foo)
     * @param qualifiers
     * @return 
     */
    static makeQualifiersCanonical(qualifiers) {
        var noDelimiters = true;
        for ( var i = 0; noDelimiters && i < qualifiers.length; i++) {
            if (qualifiers.charAt(i) == ',' || qualifiers.charAt(i) == ';') {
                noDelimiters = false;
            }
        }
        if (noDelimiters) return qualifiers;
        var result = [];
        var istart;
        // If it is, then assume the qualifiers are properly formatted.
        result[0] = qualifiers.charAt(0);
        for ( istart = 1; istart < qualifiers.length; istart++) {
            var ch = qualifiers.charAt(istart);
            if (ch == ';') return qualifiers;
            if (ch == ',') {
                result[istart] = ';';
                break
            }
            if (/[a-z]/i.test(ch)) {
                result[istart] = ch;
            }
        }
        var expectSemi = false;
        for ( var i = qualifiers.length - 1; i > istart; i--) {
            result[i] = qualifiers.charAt(i);
            var ch = qualifiers.charAt(i);
            if (ch == '=') expectSemi = true;
        }
        var rr = ''.join( result);
        if (!result==qualifiers) {
            logger.log(Level.FINE, "qualifiers are made canonical: {0}->{1}", [qualifiers, rr]);
        }
        return rr;
    }

    /**
     * create the array if it hasn't been created already.
     * @param digits
     * @return 
     */
    static maybeInitialize(digits) {
        if (URITemplate.digits === null) {
            return [0,0,0,0,0,0,0];
        } else {
            return URITemplate.digits;
        }
    }

    /**
     * return the digit used to store the number associated with
     * the code.  For example, Y is the year, so it is stored in the 0th
     * position, H is hour and is stored in the 3rd position.
     * @param code one of YmjdHMS.
     * @return the digit 0-6, or -1 for none.
     */
    static digitForCode(code) {
        switch (code) {
            case 'Y':
                return 0;
            case 'm':
                return 1;
            case 'j':
                return 2;
            case 'd':
                return 2;
            case 'H':
                return 3;
            case 'M':
                return 4;
            case 'S':
                return 5;
            default:
                return -1;
        }
    }

    /**
     * set the explicit width
     * @param spec specification like "4" or "4H" for four hours.
     */
    handleWidth(fc, spec) {
        var span;
        var n = URITemplate.spec.length - 1;
        if (/[0-9]/.test(URITemplate.spec.charAt(n))) {
            span = Integer.parseInt(URITemplate.spec);
            var digit = URITemplate.digitForCode(URITemplate.fc.charAt(0));
            this.timeWidth[digit] = span;
        } else {
            span = Integer.parseInt(URITemplate.spec.substring(0, n));
            var digit = URITemplate.digitForCode(URITemplate.spec.charAt(n));
            this.timeWidth[digit] = span;
        }
        URITemplate.timeWidthIsExplicit = true;
    }

    /**
     * create a new URITemplate for parsing and formatting.
     * @param formatString URI template spec as in /tmp/data.$Y$m$d.txt
     */
    constructor(formatString) {
        this.fieldHandlers = new Map();
        this.fieldHandlers.set("subsec", URITemplate.SubsecFieldHandler());
        this.fieldHandlers.set("hrinterval", URITemplate.HrintervalFieldHandler());
        this.fieldHandlers.set("periodic", URITemplate.PeriodicFieldHandler());
        this.fieldHandlers.set("enum", URITemplate.EnumFieldHandler());
        this.fieldHandlers.set("x", URITemplate.IgnoreFieldHandler());
        this.fieldHandlers.set("v", URITemplate.VersionFieldHandler());
        var startTime = [];
        startTime[0] = URITemplate.MIN_VALID_YEAR;
        startTime[1] = 1;
        startTime[2] = 1;
        URITemplate.stopTimeDigit = URITemplate.AFTERSTOP_INIT;
        var stopTime = [];
        stopTime[0] = URITemplate.MAX_VALID_YEAR;
        stopTime[1] = 1;
        stopTime[2] = 1;
        //result.fieldHandlers = fieldHandlers;
        this.fieldHandlersById = new Map();
        formatString = URITemplate.makeCanonical(formatString);
        //this.formatString = formatString;
        var ss = formatString.split("$");
        URITemplate.fc = [];
        URITemplate.qualifiers = [];
        var delim = [];
        URITemplate.ndigits = ss.length;
        var regex1 = "";
        regex1+= str(ss[0].replaceAll("+", "+"));
        //TODO: I thought we did this already.
        URITemplate.lengths = [];
        for ( var i = 0; i < URITemplate.lengths.length; i++) {
            URITemplate.lengths[i] = -1;
        }
        URITemplate.startShift = null;
        URITemplate.stopShift = null;
        this.qualifiersMaps = [];
        this.phasestart = null;
        delim[0] = ss[0];
        for ( var i = 1; i < URITemplate.ndigits; i++) {
            var pp = 0;
            var ssi = ss[i];
            while (ssi.length > pp && (/[0-9]/.test(ssi.charAt(pp)) || ssi.charAt(pp) == '-')) {
                pp += 1;
            }
            if (pp > 0) {
                // Note length ($5Y) is not supported in http://tsds.org/uri_templates.
                URITemplate.lengths[i] = Integer.parseInt(ssi.substring(0, pp));
            } else {
                URITemplate.lengths[i] = 0;
            }
            ssi = URITemplate.makeQualifiersCanonical(ssi);
            logger.log(Level.FINE, "ssi={0}", ss[i]);
            if (ssi.charAt(pp) != '(') {
                URITemplate.fc[i] = ssi.substring(pp, pp + 1);
                delim[i] = ssi.substring(pp + 1);
            } else {
                if (ssi.charAt(pp) == '(') {
                    var endIndex = ssi.indexOf(')', pp);
                    if (endIndex === -1) {
                        throw "opening paren but no closing paren in \"" + ssi + "\"";
                    }
                    var semi = ssi.indexOf(";", pp);
                    if (semi !== -1) {
                        URITemplate.fc[i] = ssi.substring(pp + 1, semi);
                        URITemplate.qualifiers[i] = ssi.substring(semi + 1, endIndex);
                    } else {
                        URITemplate.fc[i] = ssi.substring(pp + 1, endIndex);
                    }
                    delim[i] = ssi.substring(endIndex + 1);
                }
            }
        }
        URITemplate.handlers = [];
        URITemplate.offsets = [];
        var pos = 0;
        URITemplate.offsets[0] = pos;
        URITemplate.lsd = -1;
        var lsdMult = 1;
        //TODO: We want to add $Y_1XX/$j/WAV_$Y$jT$(H,span=5)$M$S_REC_V01.PKT
        URITemplate.context = [];
        arraycopy( startTime, 0, URITemplate.context, 0, URITemplate.NUM_TIME_DIGITS );
        URITemplate.externalContext = URITemplate.NUM_TIME_DIGITS;
        // this will lower and will typically be 0.
        URITemplate.timeWidth = [];
        var haveHour = false;
        for ( var i = 1; i < URITemplate.ndigits; i++) {
            if (pos !== -1) {
                pos += delim[i - 1].length;
            }
            var handler = 9999;
            for ( var j = 0; j < URITemplate.valid_formatCodes.length; j++) {
                if (URITemplate.valid_formatCodes[j]==URITemplate.fc[i]) {
                    handler = j;
                    break
                }
            }
            if (URITemplate.fc[i]=="H") {
                haveHour = true;
            } else {
                if (URITemplate.fc[i]=="p") {
                    if (!haveHour) {
                        throw "$H must preceed $p";
                    }
                }
            }
            if (handler === 9999) {
                if (!URITemplate.fieldHandlers.has(URITemplate.fc[i])) {
                    throw "bad format code: \"" + URITemplate.fc[i] + "\" in \"" + formatString + "\"";
                } else {
                    handler = 100;
                    URITemplate.handlers[i] = 100;
                    URITemplate.offsets[i] = pos;
                    if (URITemplate.lengths[i] < 1 || pos === -1) {
                        // 0->indetermined as well, allows user to force indeterminate
                        pos = -1;
                        URITemplate.lengths[i] = -1;
                    } else {
                        pos += URITemplate.lengths[i];
                    }
                    var fh = URITemplate.fieldHandlers.get(URITemplate.fc[i]);
                    var args = URITemplate.qualifiers[i];
                    var argv = new Map();
                    if (args !== null) {
                        var ss2 = args.split(";");
                        ss2.forEach( function ( ss21 ) {
                             var i3 = ss21.indexOf("=");
                            if (i3 === -1) {
                                argv.set(ss21.trim(), "");
                            } else {
                                argv.set(ss21.substring(0, i3).trim(), ss21.substring(i3 + 1).trim());
                            }
                        } )
                    }
                    var errm = fh.configure(argv);
                    if (errm !== null) {
                        throw errm;
                    }
                    var id = URITemplate.getArg(argv, "id", null);
                    if (id !== null) {
                        URITemplate.fieldHandlersById.set(id, fh);
                    }
                }
            } else {
                URITemplate.handlers[i] = handler;
                if (URITemplate.lengths[i] === 0) {
                    URITemplate.lengths[i] = URITemplate.formatCode_lengths[handler];
                }
                URITemplate.offsets[i] = pos;
                if (URITemplate.lengths[i] < 1 || pos === -1) {
                    pos = -1;
                } else {
                    pos += URITemplate.lengths[i];
                }
            }
            var span = 1;
            if (URITemplate.qualifiers[i] !== null) {
                var ss2 = URITemplate.qualifiers[i].split(";");
                URITemplate.qualifiersMaps[i] = new Map();
                ss2.forEach( function ( ss21 ) {
                     //TODO: handle end before shift.
                    var okay = false;
                    var qual = ss21.trim();
                    if (qual=="startTimeOnly") {
                        URITemplate.startTimeOnly = URITemplate.fc[i].charAt(0);
                        okay = true;
                    }
                    var idx = qual.indexOf("=");
                    if (!okay && idx > -1) {
                        var name = qual.substring(0, idx).trim();
                        var val = qual.substring(idx + 1).trim();
                        URITemplate.qualifiersMaps[i].set(name, val);
                        switch (name) {
                            case "Y":
                                URITemplate.context[URITemplate.YEAR] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 0);
                                break
                            case "m":
                                URITemplate.context[URITemplate.MONTH] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 1);
                                break
                            case "d":
                                URITemplate.context[URITemplate.DAY] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 2);
                                break
                            case "j":
                                URITemplate.context[URITemplate.MONTH] = 1;
                                URITemplate.context[URITemplate.DAY] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 1);
                                break
                            case "H":
                                URITemplate.context[URITemplate.HOUR] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 3);
                                break
                            case "M":
                                URITemplate.context[URITemplate.MINUTE] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 4);
                                break
                            case "S":
                                URITemplate.context[URITemplate.SECOND] = Integer.parseInt(val);
                                URITemplate.externalContext = Math.min(URITemplate.externalContext, 5);
                                break
                            case "cadence":
                                span = Integer.parseInt(val);
                                this.handleWidth(URITemplate.fc[i], val);
                                URITemplate.timeWidthIsExplicit = true;
                                break
                            case "span":
                                span = Integer.parseInt(val);
                                // not part of uri_templates
                                this.handleWidth(URITemplate.fc[i], val);
                                URITemplate.timeWidthIsExplicit = true;
                                break
                            case "delta":
                                span = Integer.parseInt(val);
                                // see http://tsds.org/uri_templates
                                this.handleWidth(URITemplate.fc[i], val);
                                URITemplate.timeWidthIsExplicit = true;
                                break
                            case "resolution":
                                span = Integer.parseInt(val);
                                this.handleWidth(URITemplate.fc[i], val);
                                URITemplate.timeWidthIsExplicit = true;
                                break
                            case "period":
                                if (val.startsWith("P")) {
                                    try {
                                        var r = TimeUtil.parseISO8601Duration(val);
                                        for ( var j = 0; j < URITemplate.NUM_TIME_DIGITS; j++) {
                                            if (r[j] > 0) {
                                                URITemplate.lsd = j;
                                                lsdMult = r[j];
                                                logger.log(Level.FINER, "lsd is now {0}, width={1}", [URITemplate.lsd, lsdMult]);
                                                break
                                            }
                                        }
                                    } catch (ex) {
                                        logger.log(Level.SEVERE, null, ex);
                                    }
                                } else {
                                    var code = val.charAt(val.length - 1);
                                    switch (code) {
                                        case 'Y':
                                            URITemplate.lsd = 0;
                                            break
                                        case 'm':
                                            URITemplate.lsd = 1;
                                            break
                                        case 'd':
                                            URITemplate.lsd = 2;
                                            break
                                        case 'j':
                                            URITemplate.lsd = 2;
                                            break
                                        case 'H':
                                            URITemplate.lsd = 3;
                                            break
                                        case 'M':
                                            URITemplate.lsd = 4;
                                            break
                                        case 'S':
                                            URITemplate.lsd = 5;
                                            break
                                        default:
                                            break
                                    }
                                    lsdMult = Integer.parseInt(val.substring(0, val.length - 1));
                                    logger.log(Level.FINER, "lsd is now {0}, width={1}", [URITemplate.lsd, lsdMult]);
                                }

                                break
                            case "id":
                                break
                            case "places":
                                break
                            case "phasestart":
                                try {
                                    URITemplate.phasestart = TimeUtil.isoTimeToArray(val);
                                } catch (ex) {
                                    logger.log(Level.SEVERE, null, ex);
                                }

                                break
                            case "shift":
                                if (val.length === 0) throw "shift is empty";
                                var possibleUnit = val.charAt(val.length - 1);
                                var digit;
                                if (/[a-z]/i.test(possibleUnit)) {
                                    digit = URITemplate.digitForCode(possibleUnit);
                                    val = val.substring(0, val.length - 1);
                                } else {
                                    digit = URITemplate.digitForCode(URITemplate.fc[i].charAt(0));
                                }

                                if (i < URITemplate.stopTimeDigit) {
                                    URITemplate.startShift = URITemplate.maybeInitialize(URITemplate.startShift);
                                    URITemplate.startShift[digit] = Integer.parseInt(val);
                                } else {
                                    URITemplate.stopShift = URITemplate.maybeInitialize(URITemplate.stopShift);
                                    URITemplate.stopShift[digit] = Integer.parseInt(val);
                                }

                                break
                            case "pad":
                            case "fmt":
                            case "case":
                                if (name=="pad" && val=="none") URITemplate.lengths[i] = -1;
                                if (URITemplate.qualifiersMaps[i] === null) URITemplate.qualifiersMaps[i] = new Map();
                                URITemplate.qualifiersMaps[i].set(name, val);
                                break
                            case "end":
                                if (URITemplate.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
                                    URITemplate.startLsd = URITemplate.lsd;
                                    URITemplate.stopTimeDigit = i;
                                }

                                break
                            default:
                                if (!URITemplate.fieldHandlers.has(URITemplate.fc[i])) {
                                    throw "unrecognized/unsupported field: " + name + " in " + qual;
                                }

                                break
                        }
                        okay = true;
                    } else {
                        if (!okay) {
                            var name = qual.trim();
                            if (name=="end") {
                                if (URITemplate.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
                                    URITemplate.startLsd = URITemplate.lsd;
                                    URITemplate.stopTimeDigit = i;
                                }
                                okay = true;
                            }
                        }
                    }
                    if (!okay && (qual=="Y" || qual=="m" || qual=="d" || qual=="j" || qual=="H" || qual=="M" || qual=="S")) {
                        throw sprintf("%s must be assigned an integer value (e.g. %s=1) in %s",qual, qual, ss[i]);
                    }
                    if (!okay) {
                        if (!URITemplate.fieldHandlers.has(URITemplate.fc[i])) {
                            logger.log(Level.WARNING, "unrecognized/unsupported field:{0} in {1}", [qual, ss[i]]);
                        }
                    }
                } )
            } else {
                if (URITemplate.fc[i].length === 1) {
                    var code = URITemplate.fc[i].charAt(0);
                    var thisLsd = -1;
                    switch (code) {
                        case 'Y':
                            thisLsd = 0;
                            break
                        case 'm':
                            thisLsd = 1;
                            break
                        case 'd':
                            thisLsd = 2;
                            break
                        case 'j':
                            thisLsd = 2;
                            break
                        case 'H':
                            thisLsd = 3;
                            break
                        case 'M':
                            thisLsd = 4;
                            break
                        case 'S':
                            thisLsd = 5;
                            break
                        default:
                            break
                    }
                    if (thisLsd === URITemplate.lsd) {
                        // allow subsequent repeat fields to reset (T$y$(m,delta=4)/$x_T$y$m$d.DAT)
                        lsdMult = 1;
                    }
                }
            }
            if (URITemplate.fc[i].length === 1) {
                switch (URITemplate.fc[i].charAt(0)) {
                    case 'Y':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 0);
                        break
                    case 'm':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 1);
                        break
                    case 'd':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 2);
                        break
                    case 'j':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 1);
                        break
                    case 'H':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 3);
                        break
                    case 'M':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 4);
                        break
                    case 'S':
                        URITemplate.externalContext = Math.min(URITemplate.externalContext, 5);
                        break
                    default:
                        break
                }
            }
            if (handler < 100) {
                if (URITemplate.precision[handler] > URITemplate.lsd && lsdMult === 1) {
                    // omni2_h0_mrg1hr_$Y$(m,span=6)$d_v01.cdf.  Essentially we ignore the $d.
                    URITemplate.lsd = URITemplate.precision[handler];
                    lsdMult = span;
                    logger.log(Level.FINER, "lsd is now {0}, width={1}", [URITemplate.lsd, lsdMult]);
                }
            }
            var dots = ".........";
            if (URITemplate.lengths[i] === -1) {
                regex1+= "(.*)";
            } else {
                regex1+= "(" + dots.substring(0, URITemplate.lengths[i]) + ")";
            }
            regex1+= str(delim[i].replaceAll("+", "+"));
        }
        switch (URITemplate.lsd) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                if (!URITemplate.timeWidthIsExplicit) {
                    URITemplate.timeWidth[URITemplate.lsd] = lsdMult;
                }

                break
            case -1:
                URITemplate.timeWidth[0] = 8000;
                break
            case 100:
                break
        }
        if (logger.isLoggable(Level.FINE)) {
            var canonical = str(delim[0]);
            for ( var i = 1; i < URITemplate.ndigits; i++) {
                canonical+= "$";
                if (URITemplate.qualifiers[i] === null) {
                    canonical+= str(URITemplate.fc[i]);
                } else {
                    canonical+= "(" + str(URITemplate.fc[i]) + ";" + str(URITemplate.qualifiers[i]) + ")";
                }
                canonical+= str(delim[i]);
            }
            logger.log(Level.FINE, "Canonical: {0}", canonical);
        }
        if (this.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
            if (this.startShift !== null) {
                this.stopShift = this.startShift;
            }
        }
        this.delims = delim;
        this.regex = regex1;
    }

    /**
     * return the timeString, parsed into start time and stop time.  
     * The result is a 14-element array, with the first 7 the start time
     * and the last 7 the stop time.
     * @param timeString the template string to be parsed.
     * @return 14 element array [ Y, m, d, H, M, S, nano, Y, m, d, H, M, S, nano ]
     * @throws ParseException when a number is expected, or patterned not matched.
     * @see #parse(java.lang.String, java.util.Map) 
     */
    parse(timeString) {
        return this.parse(timeString, new Map());
    }

    /**
     * return the timeString, parsed into start time and stop time.  
     * The result is a 14-element array, with the first 7 the start time
     * and the last 7 the stop time.  The output will be decomposed into
     * year, month, and day even if year, day-of-year are in the time string.
     * @param timeString string in the format described by the template.
     * @param extra extension results, like $(x,name=sc) appear here.
     * @return 14 element array [ Y, m, d, H, M, S, nano, Y, m, d, H, M, S, nano ]
     * @throws ParseException when a number is expected, or patterned not matched.
     * @see TimeUtil#dayOfYear(int, int, int) if day-of-year is needed.
     * @see #parse(java.lang.String) which can be used when extra arguments are not needed.
     */
    parse(timeString, extra) {
        logger.log(Level.FINER, "parse {0}", timeString);
        var offs = 0;
        var length = 0;
        var time;
        var startTime
        var stopTime;
        startTime = [];
        stopTime = [];
        time = startTime;
        arraycopy( URITemplate.context, 0, time, 0, URITemplate.NUM_TIME_DIGITS );
        for ( var idigit = 1; idigit < URITemplate.ndigits; idigit++) {
            if (idigit === URITemplate.stopTimeDigit) {
                logger.finer("switching to parsing end time");
                arraycopy( time, 0, stopTime, 0, URITemplate.NUM_TIME_DIGITS );
                time = stopTime;
            }
            if (URITemplate.offsets[idigit] !== -1) {
                // note offsets[0] is always known
                offs = URITemplate.offsets[idigit];
            } else {
                offs += length + this.delims[idigit - 1].length;
            }
            if (URITemplate.lengths[idigit] !== -1) {
                length = URITemplate.lengths[idigit];
            } else {
                if (this.delims[idigit]=="") {
                    if (idigit === URITemplate.ndigits - 1) {
                        length = timeString.length - offs;
                    } else {
                        throw "No delimer specified after unknown length field, \"" + URITemplate.formatName[URITemplate.handlers[idigit]] + "\", field number=" + (1 + idigit) + "";
                    }
                } else {
                    while (offs < timeString.length && /\s/.test(timeString.charAt(offs))) {
                        offs += 1;                    }
                    if (offs >= timeString.length) {
                        throw "expected delimiter \"" + this.delims[idigit] + "\" but reached end of string";
                    }
                    var i = timeString.indexOf(this.delims[idigit], offs);
                    if (i === -1) {
                        throw "expected delimiter \"" + this.delims[idigit] + "\"";
                    }
                    length = i - offs;
                    if (length < 0) {
                        throw "bad state, length should never be less than zero.";
                    }
                }
            }
            if (timeString.length < offs + length) {
                throw "string is too short: " + timeString;
            }
            var field = timeString.substring(offs, offs + length).trim();
            logger.log(Level.FINEST, "handling {0} with {1}", [field, URITemplate.handlers[idigit]]);
            try {
                if (URITemplate.handlers[idigit] < 10) {
                    var digit;
                    digit = Integer.parseInt(field);
                    switch (URITemplate.handlers[idigit]) {
                        case 0:
                            time[URITemplate.YEAR] = digit;
                            break
                        case 1:
                            if (digit < 58) {
                                time[URITemplate.YEAR] = 2000 + digit;
                            } else {
                                time[URITemplate.YEAR] = 1900 + digit;
                            }

                            break
                        case 2:
                            time[URITemplate.MONTH] = 1;
                            time[URITemplate.DAY] = digit;
                            break
                        case 3:
                            time[URITemplate.MONTH] = digit;
                            break
                        case 4:
                            time[URITemplate.DAY] = digit;
                            break
                        case 5:
                            time[URITemplate.HOUR] = digit;
                            break
                        case 6:
                            time[URITemplate.MINUTE] = digit;
                            break
                        case 7:
                            time[URITemplate.SECOND] = digit;
                            break
                        case 8:
                            time[URITemplate.NANOSECOND] = digit;
                            break
                        default:
                            throw "handlers[idigit] was not expected value (which shouldn't happen)";
                    }
                } else {
                    if (URITemplate.handlers[idigit] === 100) {
                        var handler = (URITemplate.fieldHandlers.get(URITemplate.fc[idigit])) //J2J: cast type//;
                        handler.parse(timeString.substring(offs, offs + length), time, URITemplate.timeWidth, extra);
                    } else {
                        if (URITemplate.handlers[idigit] === 10) {
                            // AM/PM -- code assumes hour has been read already
                            var ch = timeString.charAt(offs);
                            if (ch == 'P' || ch == 'p') {
                                if (time[URITemplate.HOUR] === 12) {
                                } else {
                                    time[URITemplate.HOUR] += 12;
                                }
                            } else {
                                if (ch == 'A' || ch == 'a') {
                                    if (time[URITemplate.HOUR] === 12) {
                                        time[URITemplate.HOUR] -= 12;
                                    } else {
                                    }
                                }
                            }
                        } else {
                            if (URITemplate.handlers[idigit] === 11) {
                                // TimeZone is not supported, see code elsewhere.
                                var offset;
                                offset = Integer.parseInt(timeString.substring(offs, offs + length));
                                time[URITemplate.HOUR] -= Math.floor(offset / 100);
                                // careful!
                                time[URITemplate.MINUTE] -= offset % 100;
                            } else {
                                if (URITemplate.handlers[idigit] === 12) {
                                    if (length >= 0) {
                                        extra.set("ignore", timeString.substring(offs, offs + length));
                                    }
                                } else {
                                    if (URITemplate.handlers[idigit] === 13) {
                                        // month name
                                        time[URITemplate.MINUTE] = TimeUtil.monthNumber(timeString.substring(offs, offs + length));
                                    } else {
                                        if (URITemplate.handlers[idigit] === 14) {
                                            if (length >= 0) {
                                                extra.set("X", timeString.substring(offs, offs + length));
                                            }
                                        } else {
                                            if (URITemplate.handlers[idigit] === 15) {
                                                // "x"
                                                var name;
                                                var qual = this.qualifiersMaps[idigit];
                                                if (qual !== null) {
                                                    name = URITemplate.getArg(qual, "name", "x");
                                                } else {
                                                    name = "x";
                                                }
                                                if (length >= 0) {
                                                    extra.set(name, timeString.substring(offs, offs + length));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (ex) {
                throw sprintf("fail to parse digit number %d: %s",idigit, field);
            }
        }
        if (this.phasestart !== null) {
            if (URITemplate.timeWidth === null) {
                logger.warning("phasestart cannot be used for month or year resolution");
            } else {
                if (URITemplate.timeWidth[1] > 0) {
                    startTime[1] = (Math.floor((startTime[1] - this.phasestart[1]) / URITemplate.timeWidth[1])) * URITemplate.timeWidth[1] + this.phasestart[1];
                } else {
                    if (URITemplate.timeWidth[0] > 0) {
                        startTime[0] = (Math.floor((startTime[0] - this.phasestart[0]) / URITemplate.timeWidth[0])) * URITemplate.timeWidth[0] + this.phasestart[0];
                    } else {
                        if (URITemplate.timeWidth[2] > 1) {
                            var phaseStartJulian = TimeUtil.julianDay(URITemplate.phasestart[0], URITemplate.phasestart[1], URITemplate.phasestart[2]);
                            var ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian;
                            var ncycles = Math.floorDiv(ndays, URITemplate.timeWidth[2]);
                            startTime = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * URITemplate.timeWidth[2]);
                        } else {
                            logger.log(Level.WARNING, "phasestart can only be used when step size is integer number of days greater than 1: {0}", TimeUtil.formatIso8601Duration(URITemplate.timeWidth));
                        }
                    }
                }
                stopTime = TimeUtil.add(startTime, this.timeWidth);
            }
        } else {
            if (URITemplate.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
                stopTime = TimeUtil.add(startTime, this.timeWidth);
            }
        }
        var result = [];
        var noShift;
        noShift = this.startShift === null;
        if (noShift) {
            for ( var i = 0; i < URITemplate.NUM_TIME_DIGITS; i++) {
                result[i] = startTime[i];
            }
            TimeUtil.normalizeTime(result);
        } else {
            for ( var i = 0; i < URITemplate.NUM_TIME_DIGITS; i++) {
                result[i] = startTime[i] + this.startShift[i];
            }
            TimeUtil.normalizeTime(result);
        }
        noShift = this.stopShift === null;
        if (noShift) {
            for ( var i = 0; i < URITemplate.NUM_TIME_DIGITS; i++) {
                result[i + URITemplate.NUM_TIME_DIGITS] = stopTime[i];
            }
            TimeUtil.normalizeTime(result);
        } else {
            var result1 = [];
            for ( var i = 0; i < URITemplate.NUM_TIME_DIGITS; i++) {
                result1[i] = stopTime[i] + this.stopShift[i];
            }
            TimeUtil.normalizeTime(result1);
            for ( var i = 0; i < URITemplate.NUM_TIME_DIGITS; i++) {
                result[i + URITemplate.NUM_TIME_DIGITS] = result1[i];
            }
        }
        return result;
    }

    /**
     * return the number of digits, starting with the year, which must be
     * provided by some external context.  For example, data_$j.dat has an
     * external context of 1 because there is no year field, and data_$d.dat
     * would be 2 because the year and month are provided externally.  Note
     * the modifier Y= can be used to provide the context within the 
     * URI template.
     * @return the external context implied by the template.
     */
    getExternalContext() {
        return URITemplate.externalContext;
    }

    /**
     * set the context time.  The number of digits copied from 
     * externalContextTime is determined by the state of externalContext.
     * @param externalContextTime the context in [ Y, m, d, H, M, S, nanos ]
     */
    setContext(externalContextTime) {
        arraycopy( externalContextTime, 0, URITemplate.context, 0, URITemplate.externalContext );
    }

    /**
     * For convenience, add API to match that suggested by 
     * https://github.com/hapi-server/uri-templates/blob/master/formatting.json .
     * Note if start and end appear in the template, then just one formatted
     * range is returned.
     * @param template the template
     * @param startTimeStr the beginning of the interval to cover
     * @param stopTimeStr the end of the interval to cover
     * @return the formatted times which cover the span.
     * @throws ParseException when a number is expected, or patterned not matched.
     */
    static formatRange(template, startTimeStr, stopTimeStr) {
        return URITemplate.formatRange(template, startTimeStr, stopTimeStr, new Map());
    }

    /**
     * For convenience, add API to match that suggested by 
     * https://github.com/hapi-server/uri-templates/blob/master/formatting.json,
     * and allowing for extra named fields to be passed in.
     * Note if start and end appear in the template, then just one formatted
     * range is returned.  This works by formatting and parsing the time ranges,
     * stepping through the sequence.
     * @param template the template
     * @param startTimeStr the beginning of the interval to cover
     * @param stopTimeStr the end of the interval to cover
     * @param extra extra named parameters
     * @return the formatted times which cover the span.
     * @throws ParseException when the initial parsing cannot be done.
     */
    static formatRange(template, startTimeStr, stopTimeStr, extra) {
        var ut = new URITemplate(template);
        var result = new Array();
        var s1;
        var sptr = TimeUtil.isoTimeFromArray(TimeUtil.isoTimeToArray(startTimeStr));
        var stopDigits = TimeUtil.isoTimeToArray(stopTimeStr);
        var stop = TimeUtil.isoTimeFromArray(stopDigits);
        if (sptr > stop) {
            throw "start time must be before or equal to stop time.";
        }
        var i = 0;
        var externalContext = ut.getExternalContext();
        if (URITemplate.externalContext > 0) {
            var context = [];
            arraycopy( stopDigits, 0, URITemplate.context, 0, URITemplate.externalContext );
            ut.setContext(URITemplate.context);
        }
        var firstLoop = true;
        while (sptr < stop) {
            var sptr0 = sptr;
            s1 = ut.format(sptr, sptr, extra);
            var tta = ut.parse(s1, new Map());
            if (firstLoop) {
                sptr = TimeUtil.isoTimeFromArray(tta.slice(0,7));
                s1 = ut.format(sptr, sptr, extra);
                firstLoop = false;
            }
            if (tta.slice(0,7)==tta.slice(7,14)) {
                result.push(ut.format(startTimeStr, stopTimeStr));
                break
            } else {
                result.push(s1);
            }
            sptr = TimeUtil.isoTimeFromArray(tta.slice(7,14));
            if (sptr0==sptr) {
                throw "template fails to advance";
            }
            i = i + 1;
        }
        return result;
    }

    /**
     * return a list of formatted names, using the spec and the given 
     * time range.
     * @param startTimeStr iso8601 formatted time.
     * @param stopTimeStr iso8601 formatted time.
     * @return formatted time, often a resolvable URI.
     */
    format(startTimeStr, stopTimeStr) {
        return this.format(startTimeStr, stopTimeStr, new Map());
    }

    /**
     * return a list of formatted names, using the spec and the given 
     * time range.
     * @param startTimeStr iso8601 formatted time.
     * @param stopTimeStr iso8601 formatted time.
     * @param extra extra parameters
     * @return formatted time, often a resolvable URI.
     */
    format(startTimeStr, stopTimeStr, extra) {
        var startTime = TimeUtil.isoTimeToArray(startTimeStr);
        var stopTime;
        var timeWidthl;
        if (URITemplate.timeWidthIsExplicit) {
            timeWidthl = URITemplate.timeWidth;
            stopTime = TimeUtil.add(startTime, URITemplate.timeWidth);
        } else {
            stopTime = TimeUtil.isoTimeToArray(stopTimeStr);
            timeWidthl = TimeUtil.subtract(stopTime, startTime);
        }
        if (URITemplate.startShift !== null) {
            startTime = TimeUtil.subtract(startTime, URITemplate.startShift);
        }
        if (URITemplate.stopShift !== null) {
            stopTime = TimeUtil.subtract(stopTime, URITemplate.stopShift);
        }
        if (URITemplate.timeWidthIsExplicit) {
            if (this.phasestart !== null && URITemplate.timeWidth[2] > 0) {
                var phaseStartJulian = TimeUtil.julianDay(URITemplate.phasestart[0], URITemplate.phasestart[1], URITemplate.phasestart[2]);
                var ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian;
                var ncycles = Math.floorDiv(ndays, URITemplate.timeWidth[2]);
                var tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * URITemplate.timeWidth[2]);
                startTime[0] = tnew[0];
                startTime[1] = tnew[1];
                startTime[2] = tnew[2];
                stopTime = TimeUtil.add(startTime, URITemplate.timeWidth);
            }
        }
        var timel = startTime;
        var result = "";
        var offs = 0;
        var length;
        var nf = [0,0,0,0,0];
        nf[2] = "%02d";
        nf[3] = "%03d";
        nf[4] = "%04d";
        for ( var idigit = 1; idigit < URITemplate.ndigits; idigit++) {
            if (idigit === URITemplate.stopTimeDigit) {
                timel = stopTime;
            }
            result = result.substring(0,offs)+this.delims[idigit - 1]+result.substring(offs);  // J2J expr -> assignment;
            if (URITemplate.offsets[idigit] !== -1) {
                // note offsets[0] is always known
                offs = URITemplate.offsets[idigit];
            } else {
                offs += this.delims[idigit - 1].length;
            }
            if (URITemplate.lengths[idigit] !== -1) {
                length = URITemplate.lengths[idigit];
            } else {
                length = -9999;
            }
            if (URITemplate.handlers[idigit] < 10) {
                var qualm = URITemplate.qualifiersMaps[idigit];
                var digit;
                var delta = 1;
                if (qualm !== null) {
                    var ddelta = URITemplate.getArg(qualm, "delta", null);
                    if (ddelta !== null) {
                        delta = Integer.parseInt(ddelta);
                    } else {
                        ddelta = URITemplate.getArg(qualm, "span", null);
                        if (ddelta !== null) {
                            delta = Integer.parseInt(ddelta);
                        }
                    }
                }
                switch (URITemplate.handlers[idigit]) {
                    case 0:
                        digit = timel[0];
                        break
                    case 1:
                        if (timel[0] < 2000) {
                            digit = timel[0] - 1900;
                        } else {
                            digit = timel[0] - 2000;
                        }

                        break
                    case 2:
                        digit = TimeUtil.dayOfYear(timel[0], timel[1], timel[2]);
                        break
                    case 3:
                        digit = timel[1];
                        break
                    case 4:
                        digit = timel[2];
                        break
                    case 5:
                        digit = timel[3];
                        break
                    case 6:
                        digit = timel[4];
                        break
                    case 7:
                        digit = timel[5];
                        break
                    case 8:
                        digit = Math.floor(timel[6] / 1000000);
                        break
                    case 9:
                        digit = Math.floor(timel[6] / 1000);
                        break
                    default:
                        throw "shouldn't get here";
                }
                if (delta > 1) {
                    var h = URITemplate.handlers[idigit];
                    if (h === 2 || h === 3) {
                        // $j, $m all start with 1.
                        digit = ((Math.floor((digit - 1) / delta)) * delta) + 1;
                    } else {
                        if (h === 4) {
                            if (URITemplate.phasestart !== null) {
                                var phaseStartJulian = TimeUtil.julianDay(URITemplate.phasestart[0], URITemplate.phasestart[1], URITemplate.phasestart[2]);
                                var ndays = TimeUtil.julianDay(timel[0], timel[1], timel[2]) - phaseStartJulian;
                                var ncycles = Math.floorDiv(ndays, URITemplate.timeWidth[2]);
                                var tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * delta);
                                timel[0] = tnew[0];
                                timel[1] = tnew[1];
                                timel[2] = tnew[2];
                            } else {
                                throw "phaseshart not set for delta days";
                            }
                        } else {
                            digit = (Math.floor(digit / delta)) * delta;
                        }
                    }
                }
                if (length < 0) {
                    var ss = String.valueOf(digit);
                    result = result.substring(0,offs)+ss+result.substring(offs);  // J2J expr -> assignment;
                    offs += ss.length;
                } else {
                    if (this.qualifiersMaps[idigit] !== null) {
                        // TODO: suboptimal
                        var pad = URITemplate.getArg(this.qualifiersMaps[idigit], "pad", null);
                        if (pad === null || pad=="zero") {
                            result = result.substring(0,offs)+sprintf(nf[length],digit)+result.substring(offs);  // J2J expr -> assignment;
                            offs += length;
                        } else {
                            if (digit < 10) {
                                switch (pad) {
                                    case "space":
                                        result = result.substring(0,offs)+" "+result.substring(offs);  // J2J expr -> assignment;
                                        result = result.substring(0,offs)+String.valueOf(digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += 2;
                                        break
                                    case "underscore":
                                        result = result.substring(0,offs)+"_"+result.substring(offs);  // J2J expr -> assignment;
                                        result = result.substring(0,offs)+String.valueOf(digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += 2;
                                        break
                                    case "none":
                                        result = result.substring(0,offs)+String.valueOf(digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += 1;
                                        break
                                    default:
                                        result = result.substring(0,offs)+sprintf(nf[length],digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += length;
                                        break
                                }
                            } else {
                                result = result.substring(0,offs)+sprintf(nf[length],digit)+result.substring(offs);  // J2J expr -> assignment;
                                offs += length;
                            }
                        }
                    } else {
                        result = result.substring(0,offs)+sprintf(nf[length],digit)+result.substring(offs);  // J2J expr -> assignment;
                        offs += length;
                    }
                }
            } else {
                if (URITemplate.handlers[idigit] === 13) {
                    // month names
                    result = result.substring(0,offs)+TimeUtil.monthNameAbbrev(timel[1])+result.substring(offs);  // J2J expr -> assignment;
                    offs += length;
                } else {
                    if (URITemplate.handlers[idigit] === 12 || URITemplate.handlers[idigit] === 14) {
                        throw "cannot format spec containing ignore";
                    } else {
                        if (URITemplate.handlers[idigit] === 100) {
                            if (URITemplate.fc[idigit]=="v") {
                                // kludge for version.  TODO: This can probably use the code below now.
                                var ins = URITemplate.getArg(extra, "v", "00");
                                if (length > -1) {
                                    if (length > 20) throw "version lengths>20 not supported";
                                    ins = "00000000000000000000".substring(0, length);
                                }
                                result = result.substring(0,offs)+ins+result.substring(offs);  // J2J expr -> assignment;
                                offs += ins.length;
                            } else {
                                var fh1 = URITemplate.fieldHandlers.get(URITemplate.fc[idigit]);
                                var timeEnd = stopTime;
                                var ins = fh1.format(timel, TimeUtil.subtract(timeEnd, timel), length, extra);
                                var startTimeTest = [];
                                arraycopy( timel, 0, startTimeTest, 0, URITemplate.NUM_TIME_DIGITS );
                                var timeWidthTest = [];
                                arraycopy( timeWidthl, 0, timeWidthTest, 0, URITemplate.NUM_TIME_DIGITS );
                                try {
                                    fh1.parse(ins, startTimeTest, timeWidthTest, extra);
                                    arraycopy( startTimeTest, 0, timel, 0, URITemplate.NUM_TIME_DIGITS );
                                    arraycopy( timeWidthTest, 0, timeWidthl, 0, URITemplate.NUM_TIME_DIGITS );
                                    arraycopy( TimeUtil.add(timel, timeWidthl), 0, stopTime, 0, URITemplate.NUM_TIME_DIGITS );
                                } catch (ex) {
                                    logger.log(Level.SEVERE, null, ex);
                                }
                                if (length > -1 && ins.length !== length) {
                                    throw "length of fh is incorrect, should be " + length + ", got \"" + ins + "\"";
                                }
                                result = result.substring(0,offs)+ins+result.substring(offs);  // J2J expr -> assignment;
                                offs += ins.length;
                            }
                        } else {
                            if (URITemplate.handlers[idigit] === 10) {
                                throw "AM/PM not supported";
                            } else {
                                if (URITemplate.handlers[idigit] === 11) {
                                    throw "Time Zones not supported";
                                }
                            }
                        }
                    }
                }
            }
        }
        result = result.substring(0,offs)+this.delims[URITemplate.ndigits - 1]+result.substring(offs);  // J2J expr -> assignment;
        return result.trim();
    }

}

