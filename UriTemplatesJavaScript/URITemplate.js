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
 * $(subsec;places=6)  "36" &rarr; "36 microseconds"
 */
class SubsecFieldHandler extends FieldHandler {
    places;

    nanosecondsFactor;

    formatStr;

    configure(args) {
        this.places = parseInt(URITemplate.getArg(args, "places", null));
        if (this.places > 9) throw "only nine places allowed.";
        this.nanosecondsFactor = Math.trunc( (Math.pow(10, (9 - this.places))) );
        this.formatStr = "%0" + this.places + "d";
        return null;
    }

    getRegex() {
        var b = "";
        for ( var i = 0; i < this.places; i++)                b+= "[0-9]";
        return b;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var value = parseFloat(fieldContent);
        startTime[6] = Math.trunc( (value * this.nanosecondsFactor) );
        timeWidth[5] = 0;
        timeWidth[6] = this.nanosecondsFactor;
    }

    format(startTime, timeWidth, length, extra) {
        var nn = Math.trunc(startTime[6] / this.nanosecondsFactor);
        return sprintf(this.formatStr,Math.trunc( Math.round(nn) ));
    }

}
/**
 * $(hrinterval;names=a,b,c,d)  "b" &rarr; "06:00/12:00"
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
        this.mult = 24 / values1.length;
        if (24 - this.mult * values1.length !== 0) {
            throw "only 1,2,3,4,6,8 or 12 intervals";
        }
        this.values = new Map();
        this.revvalues = new Map();
        for ( var i = 0; i < values1.length; i++) {
            this.values.set(values1[i], i);
            this.revvalues.set(i, values1[i]);
        }
        return null;
    }

    getRegex() {
        var vv = this.values.keySet().iterator();
        var r = String(vv.next());
        while (vv.hasNext()) {
            r+= "|" + String(vv.next());
        }
        return r;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var ii;
        if (this.values.has(fieldContent)) {
            ii = this.values.get(fieldContent);
        } else {
            throw "expected one of " + this.getRegex();
        }
        var hour = this.mult * ii;
        startTime[3] = hour;
        timeWidth[3] = this.mult;
        timeWidth[0] = 0;
        timeWidth[1] = 0;
        timeWidth[2] = 0;
    }

    format(startTime, timeWidth, length, extra) {
        var key = Math.trunc(startTime[3] / this.mult);
        if (this.revvalues.has(key)) {
            var v = this.revvalues.get(key);
            return v;
        } else {
            throw "unable to identify enum for hour " + startTime[3];
        }
    }

}
/**
 * regular intervals are numbered:
 * $(periodic;offset=0;start=2000-001;period=P1D) "0" &rarr; "2000-001"
 */
class PeriodicFieldHandler extends FieldHandler {
    offset;

    start;

    julday;

    period;

    args;

    configure(args) {
        this.args = new Map();
        var s = URITemplate.getArg(args, "start", null);
        if (s === null) {
            return "periodic field needs start";
        }
        this.start = TimeUtil.isoTimeToArray(s);
        this.julday = TimeUtil.julianDay(this.start[0], this.start[1], this.start[2]);
        this.start[0] = 0;
        this.start[1] = 0;
        this.start[2] = 0;
        s = URITemplate.getArg(args, "offset", null);
        if (s === null) {
            return "periodic field needs offset";
        }
        this.offset = parseInt(s);
        s = URITemplate.getArg(args, "period", null);
        if (s === null) {
            return "periodic field needs period";
        }
        if (!(s.startsWith("P"))) {
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
            this.period = TimeUtil.parseISO8601Duration(s);
        } catch (ex) {
            return "unable to parse period: " + s + "\n" + (ex.getMessage());
        }
        return null;
    }

    getRegex() {
        return "[0-9]+";
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        var i = parseInt(fieldContent);
        var addOffset = i - this.offset;
        var t = [0,0,0,0,0,0,0];
        var limits = [-1, -1, 0, 24, 60, 60, 1000000000];
        timeWidth[0] = 0;
        timeWidth[1] = 0;
        timeWidth[2] = this.period[2];
        for ( i = 6; i > 2; i--) {
            t[i] = this.start[i] + addOffset * this.period[i];
            while (t[i] > limits[i]) {
                t[i - 1] += 1;
                t[i] -= limits[i];
            }
        }
        timeWidth[3] = this.period[3];
        timeWidth[4] = this.period[4];
        timeWidth[5] = this.period[5];
        timeWidth[6] = this.period[6];
        var ts = TimeUtil.fromJulianDay(this.julday + timeWidth[2] * addOffset + t[2]);
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
        if (this.period[1] !== 0 || this.period[3] !== 0 || this.period[4] !== 0 || this.period[5] !== 0 || this.period[6] !== 0) {
            throw "under implemented, only integer number of days supported for formatting.";
        }
        var deltad = Math.trunc( (Math.floor((jd - this.julday) / this.period[2])) ) + this.offset;
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
        this.values = new Set();
        var svalues = URITemplate.getArg(args, "values", null);
        if (svalues === null) return "need values";
        var ss = svalues.split(",");
        if (ss.length === 1) {
            var ss2 = svalues.split("|");
            if (ss2.length > 1) {
                // J2J (logger) logger.fine("supporting legacy value containing pipes for values");
                ss = ss2;
            }
        }
        ss.forEach( function ( s ) {
            this.values.add(s);
        },this);
        this.id = URITemplate.getArg(args, "id", "unindentifiedEnum");
        return null;
    }

    getRegex() {
        var it = this.values.iterator();
        var b = "[".append(it.next());
        while (it.hasNext()) {
            b+= "|" + re.escape(it.next());
        }
        b+= "]";
        return b;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        if (!(this.values.has(fieldContent))) {
            throw "value is not in enum: " + fieldContent;
        }
        extra.set(this.id, fieldContent);
    }

    format(startTime, timeWidth, length, extra) {
        var v = URITemplate.getArg(extra, this.id, null);
        if (v === null) {
            throw "\"" + this.id + "\" is undefined in extras.";
        }
        if (this.values.has(v)) {
            return v;
        } else {
            throw this.id + " value is not within enum: " + this.values;
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
        this.regex = URITemplate.getArg(args, "regex", null);
        if (this.regex !== null) {
            this.pattern = new RegExp(this.regex);
        }
        this.name = URITemplate.getArg(args, "name", "unnamed");
        return null;
    }

    getRegex() {
        return this.regex;
    }

    parse(fieldContent, startTime, timeWidth, extra) {
        if (this.regex !== null) {
            if (!(this.pattern.exec(fieldContent)!=null)) {
                throw "ignore content doesn't match regex: " + fieldContent;
            }
        }
        if (this.name!="unnamed") {
            extra.set(this.name, fieldContent);
        }
    }

    format(startTime, timeWidth, length, extra) {
        return URITemplate.getArg(extra, this.name, "");
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
            var d1 = parseInt(ss1[i]);
            var d2 = parseInt(ss2[i]);
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
                this.versionGe = ge;
            }
            var lt = URITemplate.getArg(args, "lt", null);
            if (lt !== null) {
                this.versionLt = lt;
            }
            if (alpha !== null) {
                if (sep !== null) {
                    return "alpha with split not supported";
                } else {
                    this.versioningType = VersioningType.alphanumeric;
                }
            } else {
                if (sep !== null) {
                    this.versioningType = VersioningType.numericSplit;
                } else {
                    this.versioningType = VersioningType.numeric;
                }
            }
            return null;
        }

        parse(fieldContent, startTime, timeWidth, extra) {
            var v = URITemplate.getArg(extra, "v", null);
            if (v !== null) {
                this.versioningType = VersioningType.numericSplit;
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
function arrayequals( a, b ) { // private
    if ( a.length!==b.length ) {
        return false;
    } else {
        for (var i = 0; i<a.length; i++ ) {
            if ( a[i]!==b[i] ) {
                return false;
            }
        }
        return true;
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
        if ( args===undefined ) { //TODO: look into when args is undefined.
            return deft;
        }
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
        if (formatString.startsWith("$") && !(wildcard) && !(oldSpec) && !(oldSpec2)) return formatString;
        if (formatString.indexOf("%")!==-1 && !(formatString.indexOf("$")!==-1)) {
            formatString = formatString.replaceAll(/\%/g, "$");
        }
        oldSpec = formatString.indexOf("${")!==-1;
        if (oldSpec && !(formatString.indexOf("$(")!==-1)) {
            formatString = formatString.replaceAll(/\$\{/g, "$(");
            formatString = formatString.replaceAll(/\}/g, ")");
        }
        if (oldSpec2 && !(formatString.indexOf("$(")!==-1)) {
            formatString = formatString.replaceAll(/\$([0-9]+)\{/g, "$$1(");
            formatString = formatString.replaceAll(/\}/g, ")");
        }
        if (wildcard) {
            formatString = formatString.replaceAll(/\*/g, "$x");
        }
        var i = 1;
        if (i < formatString.length && formatString.charAt(i) == '(') {
            i += 1;
        }
        while (i < formatString.length && /[a-z]/i.test(formatString.charAt(i))) {
            i += 1;
        }
        if (i < formatString.length && formatString.charAt(i) == ',') {
            formatString = formatString.replace(/,/g, ";");
        }
        return formatString;
    }

    /**
     * $(subsec,places=4) --> $(subsec;places=4)
     * $(enum,values=01,02,03,id=foo) --> $(enum;values=01,02,03;id=foo)
     * $a --> $a
     * (subsec,places=4) --> (subsec;places=4)
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
        // '$'
        result[1] = qualifiers.charAt(1);
        for ( istart = 2; istart < qualifiers.length; istart++) {
            var ch = qualifiers.charAt(istart);
            if (ch == ';') return qualifiers;
            if (ch == ',') {
                result[istart] = ';';
                break
            }
            if (/[a-z]/i.test(ch) || ch == ')') {
                result[istart] = ch;
            }
        }
        var expectSemi = false;
        for ( var i = qualifiers.length - 1; i > istart; i--) {
            result[i] = qualifiers.charAt(i);
            var ch = qualifiers.charAt(i);
            if (ch == '=') {
                expectSemi = true;            
            } else {
                if (ch == ',' && expectSemi) {
                    result[i] = ';';
                } else {
                    if (ch == ';') {
                        expectSemi = false;
                    }
                }
            }
        }
        var rr = result.join( "" );
        if (result!=qualifiers) {
            // J2J (logger) logger.log(Level.FINE, "qualifiers are made canonical: {0}->{1}", new Object[] { qualifiers, rr });
        }
        return rr;
    }

    /**
     * create the array if it hasn't been created already.
     * @param digits
     * @return 
     */
    static maybeInitialize(digits) {
        if (digits === null) {
            return [0,0,0,0,0,0,0];
        } else {
            return digits;
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
     * use own floorDiv since JavaScript doesn't have floorDiv function.
     * @param ndays
     * @param timeWidth
     * @return 
     */
    static floorDiv(ndays, timeWidth) {
        var ncycles;
        if (ndays < 0) {
            ncycles = Math.trunc((ndays + 1) / timeWidth) - 1;
        } else {
            ncycles = Math.trunc(ndays / timeWidth);
        }
        return ncycles;
    }

    /**
     * set the explicit width
     * @param spec specification like "4" or "4H" for four hours.
     */
    handleWidth(fc, spec) {
        var span;
        var n = spec.length - 1;
        if (/[0-9]/.test(spec.charAt(n))) {
            span = parseInt(spec);
            var digit = URITemplate.digitForCode(fc.charAt(0));
            this.timeWidth[digit] = span;
        } else {
            span = parseInt(spec.substring(0, n));
            var digit = URITemplate.digitForCode(spec.charAt(n));
            this.timeWidth[digit] = span;
        }
        this.timeWidthIsExplicit = true;
    }

    /**
     * create a new URITemplate for parsing and formatting.
     * @param formatString URI template spec as in /tmp/data.$Y$m$d.txt
     */
    constructor(formatString) {
        this.fieldHandlers = new Map();
        this.fieldHandlers.set("subsec", new SubsecFieldHandler());
        this.fieldHandlers.set("hrinterval", new HrintervalFieldHandler());
        this.fieldHandlers.set("periodic", new PeriodicFieldHandler());
        this.fieldHandlers.set("enum", new EnumFieldHandler());
        this.fieldHandlers.set("x", new IgnoreFieldHandler());
        this.fieldHandlers.set("v", new VersionFieldHandler());
        // J2J (logger) logger.log(Level.FINE, "new TimeParser({0},...)", formatString);
        var startTime = [0,0,0,0,0,0,0];
        startTime[0] = URITemplate.MIN_VALID_YEAR;
        startTime[1] = 1;
        startTime[2] = 1;
        this.stopTimeDigit = URITemplate.AFTERSTOP_INIT;
        var stopTime = [0,0,0,0,0,0,0];
        stopTime[0] = URITemplate.MAX_VALID_YEAR;
        stopTime[1] = 1;
        stopTime[2] = 1;
        //result.fieldHandlers = fieldHandlers;
        this.fieldHandlersById = new Map();
        formatString = URITemplate.makeCanonical(formatString);
        //this.formatString = formatString;
        var ss = formatString.split("$");
        this.fc = [];
        this.qualifiers = [];
        var delim = [];
        this.ndigits = ss.length;
        var regex1 = "";
        regex1+= ss[0].replaceAll(/\+/g, "+");
        //TODO: I thought we did this already.
        this.lengths = [];
        for ( var i = 0; i < this.lengths.length; i++) {
            this.lengths[i] = -1;
        }
        this.startShift = null;
        this.stopShift = null;
        this.qualifiersMaps = [];
        this.phasestart = null;
        delim[0] = ss[0];
        for ( var i = 1; i < this.ndigits; i++) {
            var pp = 0;
            var ssi = ss[i];
            while (ssi.length > pp && (/[0-9]/.test(ssi.charAt(pp)) || ssi.charAt(pp) == '-')) {
                pp += 1;
            }
            if (pp > 0) {
                // Note length ($5Y) is not supported in http://tsds.org/uri_templates.
                this.lengths[i] = parseInt(ssi.substring(0, pp));
            } else {
                this.lengths[i] = 0;
            }
            ssi = URITemplate.makeQualifiersCanonical(ssi);
            // J2J (logger) logger.log(Level.FINE, "ssi={0}", ss[i]);
            if (ssi.charAt(pp) !== '(') {
                this.fc[i] = ssi.substring(pp, pp + 1);
                delim[i] = ssi.substring(pp + 1);
            } else {
                if (ssi.charAt(pp) == '(') {
                    var endIndex = ssi.indexOf(')', pp);
                    if (endIndex === -1) {
                        throw "opening paren but no closing paren in \"" + ssi + "\"";
                    }
                    var semi = ssi.indexOf(";", pp);
                    if (semi !== -1) {
                        this.fc[i] = ssi.substring(pp + 1, semi);
                        this.qualifiers[i] = ssi.substring(semi + 1, endIndex);
                    } else {
                        this.fc[i] = ssi.substring(pp + 1, endIndex);
                    }
                    delim[i] = ssi.substring(endIndex + 1);
                }
            }
        }
        this.handlers = [];
        this.offsets = [];
        var pos = 0;
        this.offsets[0] = pos;
        this.lsd = -1;
        var lsdMult = 1;
        //TODO: We want to add $Y_1XX/$j/WAV_$Y$jT$(H,span=5)$M$S_REC_V01.PKT
        this.context = [0,0,0,0,0,0,0];
        arraycopy( startTime, 0, this.context, 0, URITemplate.NUM_TIME_DIGITS );
        this.externalContext = URITemplate.NUM_TIME_DIGITS;
        // this will lower and will typically be 0.
        this.timeWidth = [0,0,0,0,0,0,0];
        var haveHour = false;
        for ( var i = 1; i < this.ndigits; i++) {
            if (pos !== -1) {
                pos += delim[i - 1].length;
            }
            var handler = 9999;
            for ( var j = 0; j < this.valid_formatCodes.length; j++) {
                if (this.valid_formatCodes[j]==this.fc[i]) {
                    handler = j;
                    break
                }
            }
            if (this.fc[i]=="H") {
                haveHour = true;
            } else {
                if (this.fc[i]=="p") {
                    if (!(haveHour)) {
                        throw "$H must preceed $p";
                    }
                }
            }
            if (handler === 9999) {
                if (!(this.fieldHandlers.has(this.fc[i]))) {
                    throw "bad format code: \"" + this.fc[i] + "\" in \"" + formatString + "\"";
                } else {
                    handler = 100;
                    this.handlers[i] = 100;
                    this.offsets[i] = pos;
                    if (this.lengths[i] < 1 || pos === -1) {
                        // 0->indetermined as well, allows user to force indeterminate
                        pos = -1;
                        this.lengths[i] = -1;
                    } else {
                        pos += this.lengths[i];
                    }
                    var fh = this.fieldHandlers.get(this.fc[i]);
                    var args = this.qualifiers[i];
                    var argv = new Map();
                    if (args !== undefined && args !== null) {
                        var ss2 = args.split(";");
                        ss2.forEach( function ( ss21 ) {
                             var i3 = ss21.indexOf("=");
                            if (i3 === -1) {
                                argv.set(ss21.trim(), "");
                            } else {
                                argv.set(ss21.substring(0, i3).trim(), ss21.substring(i3 + 1).trim());
                            }
                        }, this )
                    }
                    var errm = fh.configure(argv);
                    if (errm !== null) {
                        throw errm;
                    }
                    var id = URITemplate.getArg(argv, "id", null);
                    if (id !== null) {
                        this.fieldHandlersById.set(id, fh);
                    }
                }
            } else {
                this.handlers[i] = handler;
                if (this.lengths[i] === 0) {
                    this.lengths[i] = this.formatCode_lengths[handler];
                }
                this.offsets[i] = pos;
                if (this.lengths[i] < 1 || pos === -1) {
                    pos = -1;
                } else {
                    pos += this.lengths[i];
                }
            }
            var span = 1;
            if (this.qualifiers[i]!== undefined && this.qualifiers[i] !== null) {
                var ss2 = this.qualifiers[i].split(";");
                this.qualifiersMaps[i] = new Map();
                ss2.forEach( function ( ss21 ) {
                     //TODO: handle end before shift.
                    var okay = false;
                    var qual = ss21.trim();
                    if (qual=="startTimeOnly") {
                        this.startTimeOnly = this.fc[i].charAt(0);
                        okay = true;
                    }
                    var idx = qual.indexOf("=");
                    if (!(okay) && idx > -1) {
                        var name = qual.substring(0, idx).trim();
                        var val = qual.substring(idx + 1).trim();
                        this.qualifiersMaps[i].set(name, val);
                        switch (name) {
                            case "Y":
                                this.context[URITemplate.YEAR] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 0);
                                break
                            case "m":
                                this.context[URITemplate.MONTH] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 1);
                                break
                            case "d":
                                this.context[URITemplate.DAY] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 2);
                                break
                            case "j":
                                this.context[URITemplate.MONTH] = 1;
                                this.context[URITemplate.DAY] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 1);
                                break
                            case "H":
                                this.context[URITemplate.HOUR] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 3);
                                break
                            case "M":
                                this.context[URITemplate.MINUTE] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 4);
                                break
                            case "S":
                                this.context[URITemplate.SECOND] = parseInt(val);
                                this.externalContext = Math.min(this.externalContext, 5);
                                break
                            case "cadence":
                                span = parseInt(val);
                                this.handleWidth(this.fc[i], val);
                                this.timeWidthIsExplicit = true;
                                break
                            case "span":
                                span = parseInt(val);
                                // not part of uri_templates
                                this.handleWidth(this.fc[i], val);
                                this.timeWidthIsExplicit = true;
                                break
                            case "delta":
                                span = parseInt(val);
                                // see http://tsds.org/uri_templates
                                this.handleWidth(this.fc[i], val);
                                this.timeWidthIsExplicit = true;
                                break
                            case "resolution":
                                span = parseInt(val);
                                this.handleWidth(this.fc[i], val);
                                this.timeWidthIsExplicit = true;
                                break
                            case "period":
                                if (val.startsWith("P")) {
                                    try {
                                        var r = TimeUtil.parseISO8601Duration(val);
                                        for ( var j = 0; j < URITemplate.NUM_TIME_DIGITS; j++) {
                                            if (r[j] > 0) {
                                                this.lsd = j;
                                                lsdMult = r[j];
                                                // J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult });
                                                break
                                            }
                                        }
                                    } catch (ex) {
                                        // J2J (logger) logger.log(Level.SEVERE, null, ex);
                                    }
                                } else {
                                    var code = val.charAt(val.length - 1);
                                    switch (code) {
                                        case 'Y':
                                            this.lsd = 0;
                                            break
                                        case 'm':
                                            this.lsd = 1;
                                            break
                                        case 'd':
                                            this.lsd = 2;
                                            break
                                        case 'j':
                                            this.lsd = 2;
                                            break
                                        case 'H':
                                            this.lsd = 3;
                                            break
                                        case 'M':
                                            this.lsd = 4;
                                            break
                                        case 'S':
                                            this.lsd = 5;
                                            break
                                        default:
                                            break
                                    }
                                    lsdMult = parseInt(val.substring(0, val.length - 1));
                                    // J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult });
                                }

                                break
                            case "id":
                                break
                            case "places":
                                break
                            case "phasestart":
                                try {
                                    this.phasestart = TimeUtil.isoTimeToArray(val);
                                } catch (ex) {
                                    // J2J (logger) logger.log(Level.SEVERE, null, ex);
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
                                    digit = URITemplate.digitForCode(this.fc[i].charAt(0));
                                }

                                if (i < this.stopTimeDigit) {
                                    this.startShift = URITemplate.maybeInitialize(this.startShift);
                                    this.startShift[digit] = parseInt(val);
                                } else {
                                    this.stopShift = URITemplate.maybeInitialize(this.stopShift);
                                    this.stopShift[digit] = parseInt(val);
                                }

                                break
                            case "pad":
                            case "fmt":
                            case "case":
                                if (name=="pad" && val=="none") this.lengths[i] = -1;

                                if (this.qualifiersMaps[i] === null) this.qualifiersMaps[i] = new Map();

                                this.qualifiersMaps[i].set(name, val);
                                break
                            case "end":
                                if (this.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
                                    this.startLsd = this.lsd;
                                    this.stopTimeDigit = i;
                                }

                                break
                            default:
                                if (!(this.fieldHandlers.has(this.fc[i]))) {
                                    throw "unrecognized/unsupported field: " + name + " in " + qual;
                                }

                                break
                        }
                        okay = true;
                    } else {
                        if (!(okay)) {
                            var name = qual.trim();
                            if (name=="end") {
                                if (this.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
                                    this.startLsd = this.lsd;
                                    this.stopTimeDigit = i;
                                }
                                okay = true;
                            }
                        }
                    }
                    if (!(okay) && (qual=="Y" || qual=="m" || qual=="d" || qual=="j" || qual=="H" || qual=="M" || qual=="S")) {
                        throw sprintf("%s must be assigned an integer value (e.g. %s=1) in %s",qual, qual, ss[i]);
                    }
                    if (!(okay)) {
                        if (!(this.fieldHandlers.has(this.fc[i]))) {
                            // J2J (logger) logger.log(Level.WARNING, "unrecognized/unsupported field:{0} in {1}", new Object[] { qual, ss[i] });
                        }
                    }
                }, this )
            } else {
                if (this.fc[i].length === 1) {
                    var code = this.fc[i].charAt(0);
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
                    if (thisLsd === this.lsd) {
                        // allow subsequent repeat fields to reset (T$y$(m,delta=4)/$x_T$y$m$d.DAT)
                        lsdMult = 1;
                    }
                }
            }
            if (this.fc[i].length === 1) {
                switch (this.fc[i].charAt(0)) {
                    case 'Y':
                        this.externalContext = Math.min(this.externalContext, 0);
                        break
                    case 'm':
                        this.externalContext = Math.min(this.externalContext, 1);
                        break
                    case 'd':
                        this.externalContext = Math.min(this.externalContext, 2);
                        break
                    case 'j':
                        this.externalContext = Math.min(this.externalContext, 1);
                        break
                    case 'H':
                        this.externalContext = Math.min(this.externalContext, 3);
                        break
                    case 'M':
                        this.externalContext = Math.min(this.externalContext, 4);
                        break
                    case 'S':
                        this.externalContext = Math.min(this.externalContext, 5);
                        break
                    default:
                        break
                }
            }
            if (handler < 100) {
                if (this.precision[handler] > this.lsd && lsdMult === 1) {
                    // omni2_h0_mrg1hr_$Y$(m,span=6)$d_v01.cdf.  Essentially we ignore the $d.
                    this.lsd = this.precision[handler];
                    lsdMult = span;
                    // J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult });
                }
            }
            var dots = ".........";
            if (this.lengths[i] === -1) {
                regex1+= "(.*)";
            } else {
                regex1+= "(" + dots.substring(0, this.lengths[i]) + ")";
            }
            regex1+= delim[i].replaceAll(/\+/g, "+");
        }
        switch (this.lsd) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                if (!(this.timeWidthIsExplicit)) {
                    this.timeWidth[this.lsd] = lsdMult;
                }

                break
            case -1:
                this.timeWidth[0] = 8000;
                break
            case 100:
                break
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
        // J2J (logger) logger.log(Level.FINER, "parse {0}", timeString);
        var offs = 0;
        var length = 0;
        var time;
        var startTime
        var stopTime;
        startTime = [0,0,0,0,0,0,0];
        stopTime = [0,0,0,0,0,0,0];
        time = startTime;
        arraycopy( this.context, 0, time, 0, URITemplate.NUM_TIME_DIGITS );
        for ( var idigit = 1; idigit < this.ndigits; idigit++) {
            if (idigit === this.stopTimeDigit) {
                // J2J (logger) logger.finer("switching to parsing end time");
                arraycopy( time, 0, stopTime, 0, URITemplate.NUM_TIME_DIGITS );
                time = stopTime;
            }
            if (this.offsets[idigit] !== -1) {
                // note offsets[0] is always known
                offs = this.offsets[idigit];
            } else {
                offs += length + this.delims[idigit - 1].length;
            }
            if (this.lengths[idigit] !== -1) {
                length = this.lengths[idigit];
            } else {
                if (this.delims[idigit]=="") {
                    if (idigit === this.ndigits - 1) {
                        length = timeString.length - offs;
                    } else {
                        throw "No delimer specified after unknown length field, \"" + this.formatName[this.handlers[idigit]] + "\", field number=" + (1 + idigit) + "";
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
            // J2J (logger) logger.log(Level.FINEST, "handling {0} with {1}", new Object[] { field, handlers[idigit] });
            try {
                if (this.handlers[idigit] < 10) {
                    var digit;
                    digit = parseInt(field);
                    switch (this.handlers[idigit]) {
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
                    if (this.handlers[idigit] === 100) {
                        var handler = (this.fieldHandlers.get(this.fc[idigit]));
                        handler.parse(timeString.substring(offs, offs + length), time, this.timeWidth, extra);
                    } else {
                        if (this.handlers[idigit] === 10) {
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
                            if (this.handlers[idigit] === 11) {
                                // TimeZone is not supported, see code elsewhere.
                                var offset;
                                offset = parseInt(timeString.substring(offs, offs + length));
                                time[URITemplate.HOUR] -= Math.trunc(offset / 100);
                                // careful!
                                time[URITemplate.MINUTE] -= offset % 100;
                            } else {
                                if (this.handlers[idigit] === 12) {
                                    if (length >= 0) {
                                        extra.set("ignore", timeString.substring(offs, offs + length));
                                    }
                                } else {
                                    if (this.handlers[idigit] === 13) {
                                        // month name
                                        time[URITemplate.MINUTE] = TimeUtil.monthNumber(timeString.substring(offs, offs + length));
                                    } else {
                                        if (this.handlers[idigit] === 14) {
                                            if (length >= 0) {
                                                extra.set("X", timeString.substring(offs, offs + length));
                                            }
                                        } else {
                                            if (this.handlers[idigit] === 15) {
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
            if (this.timeWidth === null) {
                // J2J (logger) logger.warning("phasestart cannot be used for month or year resolution");
            } else {
                if (this.timeWidth[1] > 0) {
                    startTime[1] = (Math.trunc((startTime[1] - this.phasestart[1]) / this.timeWidth[1])) * this.timeWidth[1] + this.phasestart[1];
                } else {
                    if (this.timeWidth[0] > 0) {
                        startTime[0] = (Math.trunc((startTime[0] - this.phasestart[0]) / this.timeWidth[0])) * this.timeWidth[0] + this.phasestart[0];
                    } else {
                        if (this.timeWidth[2] > 1) {
                            var phaseStartJulian = TimeUtil.julianDay(this.phasestart[0], this.phasestart[1], this.phasestart[2]);
                            var ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian;
                            var ncycles = URITemplate.floorDiv(ndays, this.timeWidth[2]);
                            startTime = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * this.timeWidth[2]);
                        } else {
                            // J2J (logger) logger.log(Level.WARNING, "phasestart can only be used when step size is integer number of days greater than 1: {0}", TimeUtil.formatIso8601Duration(timeWidth));
                        }
                    }
                }
                stopTime = TimeUtil.add(startTime, this.timeWidth);
            }
        } else {
            if (this.stopTimeDigit == URITemplate.AFTERSTOP_INIT) {
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
            var result1 = [0,0,0,0,0,0,0];
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
        return this.externalContext;
    }

    /**
     * set the context time.  The number of digits copied from 
     * externalContextTime is determined by the state of externalContext.
     * @param externalContextTime the context in [ Y, m, d, H, M, S, nanos ]
     */
    setContext(externalContextTime) {
        arraycopy( externalContextTime, 0, this.context, 0, this.externalContext );
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
        if (externalContext > 0) {
            var context = [0,0,0,0,0,0,0];
            arraycopy( stopDigits, 0, context, 0, externalContext );
            ut.setContext(context);
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
            if (arrayequals( tta.slice(0,7), tta.slice(7,14) )) {
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
        if (this.timeWidthIsExplicit) {
            timeWidthl = this.timeWidth;
            stopTime = TimeUtil.add(startTime, this.timeWidth);
        } else {
            stopTime = TimeUtil.isoTimeToArray(stopTimeStr);
            timeWidthl = TimeUtil.subtract(stopTime, startTime);
        }
        if (this.startShift !== null) {
            startTime = TimeUtil.subtract(startTime, this.startShift);
        }
        if (this.stopShift !== null) {
            stopTime = TimeUtil.subtract(stopTime, this.stopShift);
        }
        if (this.timeWidthIsExplicit) {
            if (this.phasestart !== null && this.timeWidth[2] > 0) {
                var phaseStartJulian = TimeUtil.julianDay(this.phasestart[0], this.phasestart[1], this.phasestart[2]);
                var ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian;
                var ncycles = URITemplate.floorDiv(ndays, this.timeWidth[2]);
                var tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * this.timeWidth[2]);
                startTime[0] = tnew[0];
                startTime[1] = tnew[1];
                startTime[2] = tnew[2];
                stopTime = TimeUtil.add(startTime, this.timeWidth);
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
        for ( var idigit = 1; idigit < this.ndigits; idigit++) {
            if (idigit === this.stopTimeDigit) {
                timel = stopTime;
            }
            result = result.substring(0,offs)+this.delims[idigit - 1]+result.substring(offs);  // J2J expr -> assignment;
            if (this.offsets[idigit] !== -1) {
                // note offsets[0] is always known
                offs = this.offsets[idigit];
            } else {
                offs += this.delims[idigit - 1].length;
            }
            if (this.lengths[idigit] !== -1) {
                length = this.lengths[idigit];
            } else {
                length = -9999;
            }
            if (this.handlers[idigit] < 10) {
                var qualm = this.qualifiersMaps[idigit];
                var digit;
                var delta = 1;
                if (qualm !== null) {
                    var ddelta = URITemplate.getArg(qualm, "delta", null);
                    if (ddelta !== null) {
                        delta = parseInt(ddelta);
                    } else {
                        ddelta = URITemplate.getArg(qualm, "span", null);
                        if (ddelta !== null) {
                            delta = parseInt(ddelta);
                        }
                    }
                }
                switch (this.handlers[idigit]) {
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
                        digit = Math.trunc(timel[6] / 1000000);
                        break
                    case 9:
                        digit = Math.trunc(timel[6] / 1000);
                        break
                    default:
                        throw "shouldn't get here";
                }
                if (delta > 1) {
                    var h = this.handlers[idigit];
                    if (h === 2 || h === 3) {
                        // $j, $m all start with 1.
                        digit = ((Math.trunc((digit - 1) / delta)) * delta) + 1;
                    } else {
                        if (h === 4) {
                            if (this.phasestart !== null) {
                                var phaseStartJulian = TimeUtil.julianDay(this.phasestart[0], this.phasestart[1], this.phasestart[2]);
                                var ndays = TimeUtil.julianDay(timel[0], timel[1], timel[2]) - phaseStartJulian;
                                var ncycles = URITemplate.floorDiv(ndays, this.timeWidth[2]);
                                var tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * delta);
                                timel[0] = tnew[0];
                                timel[1] = tnew[1];
                                timel[2] = tnew[2];
                            } else {
                                throw "phasestart not set for delta days";
                            }
                        } else {
                            digit = (Math.trunc(digit / delta)) * delta;
                        }
                    }
                }
                if (length < 0) {
                    var ss = new String(digit);
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
                                        result = result.substring(0,offs)+new String(digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += 2;
                                        break
                                    case "underscore":
                                        result = result.substring(0,offs)+"_"+result.substring(offs);  // J2J expr -> assignment;
                                        result = result.substring(0,offs)+new String(digit)+result.substring(offs);  // J2J expr -> assignment;
                                        offs += 2;
                                        break
                                    case "none":
                                        result = result.substring(0,offs)+new String(digit)+result.substring(offs);  // J2J expr -> assignment;
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
                if (this.handlers[idigit] === 13) {
                    // month names
                    result = result.substring(0,offs)+TimeUtil.monthNameAbbrev(timel[1])+result.substring(offs);  // J2J expr -> assignment;
                    offs += length;
                } else {
                    if (this.handlers[idigit] === 12 || this.handlers[idigit] === 14) {
                        throw "cannot format spec containing ignore";
                    } else {
                        if (this.handlers[idigit] === 100) {
                            if (this.fc[idigit]=="v") {
                                // kludge for version.  TODO: This can probably use the code below now.
                                var ins = URITemplate.getArg(extra, "v", "00");
                                if (length > -1) {
                                    if (length > 20) throw "version lengths>20 not supported";
                                    ins = "00000000000000000000".substring(0, length);
                                }
                                result = result.substring(0,offs)+ins+result.substring(offs);  // J2J expr -> assignment;
                                offs += ins.length;
                            } else {
                                var fh1 = this.fieldHandlers.get(this.fc[idigit]);
                                var timeEnd = stopTime;
                                var ins = fh1.format(timel, TimeUtil.subtract(timeEnd, timel), length, extra);
                                var startTimeTest = [0,0,0,0,0,0,0];
                                arraycopy( timel, 0, startTimeTest, 0, URITemplate.NUM_TIME_DIGITS );
                                var timeWidthTest = [0,0,0,0,0,0,0];
                                arraycopy( timeWidthl, 0, timeWidthTest, 0, URITemplate.NUM_TIME_DIGITS );
                                try {
                                    fh1.parse(ins, startTimeTest, timeWidthTest, extra);
                                    arraycopy( startTimeTest, 0, timel, 0, URITemplate.NUM_TIME_DIGITS );
                                    arraycopy( timeWidthTest, 0, timeWidthl, 0, URITemplate.NUM_TIME_DIGITS );
                                    arraycopy( TimeUtil.add(timel, timeWidthl), 0, stopTime, 0, URITemplate.NUM_TIME_DIGITS );
                                } catch (ex) {
                                    // J2J (logger) logger.log(Level.SEVERE, null, ex);
                                }
                                if (length > -1 && ins.length !== length) {
                                    throw "length of fh is incorrect, should be " + length + ", got \"" + ins + "\"";
                                }
                                result = result.substring(0,offs)+ins+result.substring(offs);  // J2J expr -> assignment;
                                offs += ins.length;
                            }
                        } else {
                            if (this.handlers[idigit] === 10) {
                                throw "AM/PM not supported";
                            } else {
                                if (this.handlers[idigit] === 11) {
                                    throw "Time Zones not supported";
                                }
                            }
                        }
                    }
                }
            }
        }
        result = result.substring(0,offs)+this.delims[this.ndigits - 1]+result.substring(offs);  // J2J expr -> assignment;
        return result.trim();
    }

}

