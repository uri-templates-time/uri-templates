
package org.hapiserver;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

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
public class URITemplate {
       
    private static final Logger logger= Logger.getLogger("hapiserver.uritemplates");
    
    public static String VERSION= "20240731.1";
    
    public static String getVersion() {
        return VERSION;
    }
    
    /**
     * the earliest valid year, limited because of Julian day calculations.
     */
    public static final int MIN_VALID_YEAR= 1582;
    
    /**
     * the last valid year.
     */
    public static final int MAX_VALID_YEAR= 9000;

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
    public static final int NUM_TIME_DIGITS = 7;

    public static final int YEAR=0;
    public static final int MONTH=1;
    public static final int DAY=2;
    public static final int HOUR=3;
    public static final int MINUTE=4;
    public static final int SECOND=5;
    public static final int NANOSECOND=6;
    
    /**
     * initial state of the afterstop field, present when no stop time is found.
     */
    private static final int AFTERSTOP_INIT = 999;

    /**
     * the specification, like $Y$m$d_$(Y;end)$m$d.dat
     */
    String spec;
    
    /**
     * number of digits, or components would be a better name.  For example, $Y/$Y$m$d.dat has four digits.
     */
    int ndigits;
    
    String[] digits;
    
    /**
     * non-template stuff between fields (_ in $Y_$m) are the "delims"
     */
    String[] delims; 
    
    String[] qualifiers;
    Map<String,String>[] qualifiersMaps;
    
    Map<String,FieldHandler> fieldHandlers;
    Map<String,FieldHandler> fieldHandlersById;

    /**
     * one element for each field, it is the handler (or type) of each field.
     */
    int[] handlers;

    /**
     * one element for each field, containing the offset to each field, or -1 if the offset is not determined.
     */
    int[] offsets;
    
    /**
     * one element for each field, containing number of digits in each field, or -1 if the length is not known.
     */
    int[] lengths;
    
    /**
     * shift found in each digit--going away
     */
    int[] shift; 
    
    /**
     * int[7] shift for each component for the start time.
     */
    int[] startShift=null;
    
    /**
     * int[7] shift for each component for the stop time.
     */
    int[] stopShift=null;
    
    String[] fc;
    
    /**
     * first digit which is part of the stop time
     */
    int stopTimeDigit; 
    
    private int lsd;
    private int[] timeWidth;
    
    /**
     * when adding (for example 100 days) don't allow stop time to be late in the year, truncate at the year boundary.
     */
    private boolean disallowCarryForStopTime= false;
    
    /**
     * the template explicitly defines the width, with delta or other specifiers.
     */
    private boolean timeWidthIsExplicit= false;
    
    private final String regex;
    private final int[] context;
    
    /**
     * typically zero, the number of digits which come from an external context.
     */
    private int externalContext;
    
    private String[] valid_formatCodes = new String[]{
        "Y", "y", "j", "m", "d", 
        "H", "M", "S", "N", "milli", 
        "micro", "z", "ignore", "b", "p" };
    private String[] formatName = new String[]{
        "Year", "2-digit-year", "day-of-year", "month", "day", 
        "Hour", "Minute", "Second", "nanosecond", "millisecond", 
        "microsecond", "RFC-822 numeric time zone", "ignore", "3-char-month-name", "am/pm" };
    private int[] formatCode_lengths = new int[]{
        4, 2, 3, 2, 2, 
        2, 2, 2, 9, 3, 
        3, 5, -1, 3, 2 };
    private int[] precision = new int[]{
        0, 0, 2, 1, 2, 
        3, 4, 5, 6, 6, 
        7,-1, -1, 1,-1 };
    private char startTimeOnly;
    
    /**
     * null or the phasestart.
     */
    private int[] phasestart;
    private int startLsd;
    
    private int twoDigitYearStart=1950;
    
    /**
     * parse the formatted arguments into a map from name to value.
     * @param args formatted arguments, like A=1;B=2;fmt=lc
     * @return map of arguments { 'A':'1'; 'B':'2'; 'fmt':'lc' }
     */
    private static Map<String,String> parseArgs( String args ) {
        Map<String,String> argv= new HashMap();
        if ( args!=null ) {
            String[] ss2= args.split(";",-2);
            for (String ss21 : ss2) {
                int i3 = ss21.indexOf("=");
                if (i3==-1) {
                    argv.put(ss21.trim(), "");
                } else {
                    argv.put(ss21.substring(0, i3).trim(), ss21.substring(i3+1).trim());
                }
            }
        }
        return argv;
    }
    
    /**
     * return the value within the map, or the deft if the argument is not in the map.
     * @param args a map (or dictionary) of the arguments
     * @param arg the argument to retrieve
     * @param deft the default value to return when the argument is not found.
     * @return the value.
     */
    private static String getArg( Map<String,String> args, String arg, String deft ) {
        if ( args==null ) return deft;
        if ( args.containsKey(arg) ) {
            return args.get(arg);
        } else {
            return deft;
        }
    }
    
    /**
     * Interface to add custom handlers for strings with unique formats.  For 
     * example, the RPWS group had files with two-hex digits indicating the 
     * ten-minute interval covered by the file name. 
     */
    public interface FieldHandler {

        /**
         * arguments for the parser are passed in.
         * @param args map of arguments.  $(t,a1=v1,a2=v2,a3=v3)
         * @return null if the string is parseable, an error message otherwise.
         */
        public String configure( Map<String,String> args );

        /**
         * return a regular expression that matches valid field entries.  ".*" can be used to match anything, but this limits use.
         * TODO: where is this used?  I added it because it's easy and I saw a TODO to add it.
         * @return null to match anything, or a regular expression matching valid entries.
         */
        public String getRegex();

        /**
         * parse the field to interpret as a time range.
         * @param fieldContent the field to parse, for example "2014" for $Y
         * @param startTime the current startTime
         * @param timeWidth the current timeWidth
         * @param extra extra data, such as version numbers, are passed out here.
         * @throws ParseException when the field is not consistent with the spec.
         */
        public void parse( String fieldContent, 
                int[] startTime, 
                int[] timeWidth, 
                Map<String,String> extra ) throws ParseException;
        
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
         * @param startTime the startTime in [ Y, m, d, H, M, S, N ]
         * @param timeWidth the width in [ Y, m, d, H, M, S, N ]
         * @param length, -1 or the length of the field.
         * @param extra extra data, such as version numbers, are passed in here.
         * @return the string representing the time range specified.
         * @throws IllegalArgumentException when the arguments passed in are not sufficient.
         */
        public String format( int[] startTime, 
                int[] timeWidth, 
                int length, 
                Map<String,String> extra ) throws IllegalArgumentException;

    }
    
    /**
     * $(subsec;places=6)  "36" &rarr; "36 microseconds"
     */
    public static class SubsecFieldHandler implements FieldHandler {

        int places;
        int nanosecondsFactor;
        String formatStr;
        
        @Override
        public String configure(Map<String, String> args) {
            places= Integer.parseInt( getArg( args, "places", null ) );
            if ( places>9 ) throw new IllegalArgumentException("only nine places allowed.");
            nanosecondsFactor= (int)( Math.pow( 10, (9-places) ) ); 
            formatStr= "%0"+places+"d";
            return null;
        }

        @Override
        public String getRegex() {
            StringBuilder b= new StringBuilder();
            for ( int i=0; i<places; i++ ) b.append("[0-9]");
            return b.toString();
        }

        @Override
        public void parse(String fieldContent, int[] startTime, int[] timeWidth, Map<String, String> extra) throws ParseException {
            double value= Double.parseDouble(fieldContent);
            startTime[6]= (int)( value*nanosecondsFactor );
            timeWidth[5]= 0;
            timeWidth[6]= nanosecondsFactor;
        }

        @Override
        public String format( int[] startTime, int[] timeWidth, int length, Map<String, String> extra) throws IllegalArgumentException {
            double nn= startTime[6] / nanosecondsFactor;
            return String.format(formatStr, (int)Math.round(nn) ); 
        }
        
    }
    
    /**
     * $(hrinterval;names=a,b,c,d)  "b" &rarr; "06:00/12:00"
     */
    public static class HrintervalFieldHandler implements FieldHandler {

        Map<String,Integer> values;
        Map<Integer,String> revvalues;
        
        /**
         * multiply by this to get the start hour
         */
        int mult; 
        
        @Override
        public String configure(Map<String, String> args) {
            String vs= getArg( args, "values", null );
            if ( vs==null ) vs= getArg( args, "names", null ); // some legacy thing
            if ( vs==null ) return "values must be specified for hrinterval";
            String[] values1= vs.split(",",-2);
            mult= 24 / values1.length;
            if ( 24 - mult*values1.length != 0 ) {
                throw new IllegalArgumentException("only 1,2,3,4,6,8 or 12 intervals");
            }
            values= new HashMap();
            revvalues= new HashMap();
            for ( int i=0; i<values1.length; i++ ) {
                values.put( values1[i], i );
                revvalues.put( i, values1[i] );
            }
            return null;
        }

        @Override
        public String getRegex() {
            Iterator<String> vv= values.keySet().iterator();            
            StringBuilder r= new StringBuilder(vv.next());
            while ( vv.hasNext() ) {
                r.append("|").append(vv.next());
            }
            return r.toString();
        }

        @Override
        public void parse(String fieldContent,  int[] startTime, int[] timeWidth, Map<String, String> extra) throws ParseException {
            Integer ii;
            if ( values.containsKey(fieldContent) ) {
                ii= values.get(fieldContent);
            } else {
                throw new ParseException( "expected one of "+getRegex(),0 );
            }
            int hour= mult * ii;
            startTime[3]= hour;
            timeWidth[3]= mult;
            timeWidth[0]= 0;
            timeWidth[1]= 0;
            timeWidth[2]= 0;
        }

        @Override
        public String format(  int[] startTime, int[] timeWidth, int length, Map<String, String> extra) throws IllegalArgumentException {
            Integer key= startTime[3]/mult;
            if ( revvalues.containsKey(key) ) {
                String v= revvalues.get(key);
                return v;
            } else {
                throw new IllegalArgumentException("unable to identify enum for hour "+startTime[3]);
            }
        }
        
    }
    
    /**
     * regular intervals are numbered:
     * $(periodic;offset=0;start=2000-001;period=P1D) "0" &rarr; "2000-001"
     */
    public static class PeriodicFieldHandler implements FieldHandler {

        int offset;
        int[] start;
        int julday;
        int[] period;
        Map<String, String> args;
        
        @Override
        public String configure( Map<String, String> args ) {
            this.args= new HashMap<>(args);
            String s = getArg( args, "start", null );
            if ( s==null ) {
                return "periodic field needs start";
            }
            start= TimeUtil.isoTimeToArray(s);
            julday= TimeUtil.julianDay( start[0], start[1], start[2] );
            start[0]= 0;
            start[1]= 0;
            start[2]= 0;
            s= getArg( args, "offset", null );
            if ( s==null ) {
                return "periodic field needs offset";
            }
            offset= Integer.parseInt( s );
            s= getArg( args, "period", null );
            if ( s==null ) {
                return "periodic field needs period";
            }
            if ( !s.startsWith("P") ) {
                if ( s.endsWith("D") ) {
                    throw new IllegalArgumentException("periodic unit for day is d, not D");
                } if ( s.endsWith("d")  ) {
                    s= "P"+s.toUpperCase(); // TODO: this only supports d,H,M,S
                } else {
                    s= "PT" + s.toUpperCase(); 
                }
            }
            try {
                period= TimeUtil.parseISO8601Duration( s );
            } catch ( ParseException ex ) {
                return "unable to parse period: "+s+"\n"+ex.getMessage();
            }
            
            return null;
        }

        @Override
        public String getRegex() {
            return "[0-9]+";
        }

        @Override
        public void parse(String fieldContent, int[] startTime, int[] timeWidth, Map<String, String> extra) throws ParseException {
            int i= Integer.parseInt(fieldContent);
            int addOffset= i-offset;
            int[] t= new int[NUM_TIME_DIGITS];
            int[] limits= new int[] { -1,-1,0,24,60,60,1000000000 };
            timeWidth[0]= 0;
            timeWidth[1]= 0;
            timeWidth[2]= period[2];
            for ( i=6; i>2; i-- ) {
                t[i]= start[i]+addOffset*period[i];
                while ( t[i]>limits[i] ) {
                    t[i-1] +=1;
                    t[i]-= limits[i];
                }
            }
            timeWidth[3]= period[3];
            timeWidth[4]= period[4];
            timeWidth[5]= period[5];
            timeWidth[6]= period[6];
            
            int[] ts= TimeUtil.fromJulianDay( julday + timeWidth[2] * addOffset + t[2] );
            startTime[0]= ts[0];
            startTime[1]= ts[1];
            startTime[2]= ts[2];
            startTime[3]= t[3];
            startTime[4]= t[4];
            startTime[5]= t[5];
            startTime[6]= t[6];
        }

        @Override
        public String format( int[] startTime, int[] timeWidth, int length, Map<String, String> extra) throws IllegalArgumentException {
            int jd= TimeUtil.julianDay( startTime[0], startTime[1], startTime[2] );
            if ( period[1]!=0 || period[3]!=0 || period[4]!=0 || period[5]!=0 || period[6]!=0) {
                throw new IllegalArgumentException("under implemented, only integer number of days supported for formatting.");
            }
            int deltad= (int)( Math.floor( ( jd - this.julday ) / (float)period[2] ) ) + offset;
            String result= String.format("%d",deltad);
            if ( length>16 ) {
                throw new IllegalArgumentException("length>16 not supported");
            } else if ( length>-1 ) {
                result= "_________________".substring(0,length-result.length()) + result;
            }
            return result;
        }
        
        
    }
    
    /**
     * $(enum,values=a,b,c)
     */
    public static class EnumFieldHandler implements FieldHandler {

        Set<String> values;
        String id;
        
        @Override
        public String configure( Map<String, String> args ) {
            values= new HashSet();
            String svalues= getArg( args, "values", null );
            if ( svalues==null ) return "need values";
            String[] ss= svalues.split(",",-2);
            if ( ss.length==1 ) {
                String[] ss2= svalues.split("|",-2); // support legacy URIs.
                if ( ss2.length>1 ) {
                    logger.fine("supporting legacy value containing pipes for values");
                    ss= ss2;
                }
            }
            values.addAll(Arrays.asList(ss));
            
            id= getArg( args, "id", "unindentifiedEnum" );
                        
            return null;
        }

        @Override
        public String getRegex() {
            Iterator<String> it= values.iterator();
            StringBuilder b= new StringBuilder("[").append(it.next());
            while ( it.hasNext() ) {
                b.append("|").append(Pattern.quote(it.next()));
            }
            b.append("]");
            return b.toString();
        }

        @Override
        public void parse(String fieldContent, int[] startTime, int[] timeWidth, Map<String, String> extra) throws ParseException {
            if ( !values.contains(fieldContent) ) {
                throw new ParseException("value is not in enum: "+fieldContent,0);
            }
            extra.put( id, fieldContent );
        }

        @Override
        public String format( int[] startTime, int[] timeWidth, int length, Map<String, String> extra) throws IllegalArgumentException {
            String v= getArg( extra, id, null );
            if ( v==null ) {
                throw new IllegalArgumentException( "\"" + id + "\" is undefined in extras." );
            }
            if ( values.contains(v) ) {
                return v;
            } else {
                throw new IllegalArgumentException(  id + " value is not within enum: "+values );
            }
        }
        
        /**
         * return the possible values.
         * @return the possible values.
         */
        public String[] getValues() {
            return this.values.toArray( new String[this.values.size()] );
        }
        
        public String getId() {
            return this.id;
        }
    }
    
    /**
     * $(x,name=sc,regex=[a|b])
     */
    public static class IgnoreFieldHandler implements FieldHandler {

        String regex;
        Pattern pattern;
        String name;
        String pad;
        
        @Override
        public String configure(Map<String, String> args) {
            regex= getArg( args, "regex", null );
            if ( regex!=null ) {
                pattern= Pattern.compile(regex);
            }
            name= getArg( args, "name", "unnamed" );
            pad= getArg( args, "pad", "none" );
            return null;
        }

        @Override
        public String getRegex() {
            return regex; // note this can be null (None).
        }

        @Override
        public void parse(String fieldContent, int[] startTime, int[] timeWidth, Map<String, String> extra) throws ParseException {
            if ( regex!=null ) {
                if ( !pattern.matcher(fieldContent).matches() ) {
                    throw new ParseException("ignore content doesn't match regex: "+fieldContent,0);
                }
            }
            if ( !pad.equals("none") ) {
                if ( pad.equals("_") || pad.equals("underscore") ) {
                    int i0= 0;
                    while ( i0<fieldContent.length() && fieldContent.charAt(i0)=='_') i0++;
                    int i1= fieldContent.length()-1;
                    while ( i1>i0 && fieldContent.charAt(i1)=='_' ) i1--;
                    fieldContent= fieldContent.substring(i0,i1+1);
                }
            }
            if ( !name.equals("unnamed") ) {
                String o= extra.get(name);
                if ( !fieldContent.equals(o) ) { // allow for immutable object to be used.
                    extra.put( name, fieldContent );
                }
            }
        }

        @Override
        public String format( int[] startTime, int[] timeWidth, int length, Map<String, String> extra) throws IllegalArgumentException {
            return getArg( extra, name, "" );
        }
        
    }
    
    /**
     * Versioning types 
     */
    static enum VersioningType {
        
        none( null ),
        
        /**
         * simple floating point numeric comparisons.
         */
        numeric( new Comparator<String>() {       // 4.10 > 4.01
            @Override
            public int compare(String s1, String s2) {
                Double d1= Double.parseDouble(s1);
                Double d2= Double.parseDouble(s2);
                return d1.compareTo(d2);
            }
        } ),
        /**
         * comparison by lexical sort v2013a>v2012b.
         */
        alphanumeric(new Comparator<String>() {   // a001
            @Override
            public int compare(String s1, String s2) {
                return (s1.compareTo(s2));
            }
        } ),
        /**
         * comparison of numbers split by decimal points and dashes, so 1.20 > 1.3.
         */
        numericSplit( new Comparator<String>() {  // 4.3.23   // 1.1.3-01 for RBSP (rbspice lev-2 isrhelt)
           @Override
           public int compare(String s1, String s2) {
                String[] ss1= s1.split("[\\.-]",-2);
                String[] ss2= s2.split("[\\.-]",-2);
                int n= Math.min( ss1.length, ss2.length );
                for ( int i=0; i<n; i++ ) {
                    int d1= Integer.parseInt(ss1[i]);
                    int d2= Integer.parseInt(ss2[i]);
                    if ( d1<d2 ) {
                        return -1;
                    } else if ( d1>d2 ) {
                        return 1;
                    }
                }
                return ss1.length - ss2.length;  // the longer version wins (3.2.1 > 3.2)
            } 
        });

        Comparator<String> comp;
        VersioningType( Comparator<String> comp ) {
            this.comp= comp;
        }
    };


    /**
     * Version field handler.  Versions are codes with special sort orders.
     */
    public static class VersionFieldHandler implements FieldHandler {
        VersioningType versioningType;
        
        String versionGe= null; // the version must be greater than or equal to this if non-null. 
        String versionLt= null; // the version must be less than this if non-null. 
                
        @Override
        public String configure( Map<String,String> args ) {
            String sep= getArg( args, "sep", null );
            if ( sep==null ) {
                sep= getArg( args, "separator", null );
            }
            if ( sep==null && args.containsKey("dotnotation")) {
                sep= "T";
            }
            String alpha= getArg( args, "alpha", null );
            if ( alpha==null && args.containsKey("alphanumeric") ) {
                alpha="T";
            }
            String type= getArg( args, "type", null );
            if ( type!=null ) {
                if ( type.equals("sep") || type.equals("dotnotation") ) {
                    sep= "T";
                } else if (type.equals("alpha") || type.equals("alphanumeric") ) {
                    alpha="T"; 
                }
            }
            if ( args.containsKey("gt") ) {
                throw new IllegalArgumentException("gt specified but not supported: must be ge or lt");
            }
            if ( args.containsKey("le") ) {
                throw new IllegalArgumentException("le specified but not supported: must be ge or lt");
            }
            String ge= getArg( args, "ge", null );
            if ( ge!=null ) {
                versionGe= ge;
            }
            String lt= getArg( args, "lt", null );
            if ( lt!=null ) {
                versionLt= lt;
            }
            if ( alpha!=null ) {  
                if ( sep!=null ) {
                    return "alpha with split not supported";
                } else {
                    versioningType= VersioningType.alphanumeric;
                }
            } else {
                if ( sep!=null ) {
                    versioningType= VersioningType.numericSplit;
                } else {
                    versioningType= VersioningType.numeric;
                }
            }
            return null;
        }

        @Override
        public void parse( String fieldContent, int[] startTime, int[] timeWidth, Map<String,String> extra ) {
            String v= getArg( extra, "v", null );
            if ( v!=null ) {
                versioningType= VersioningType.numericSplit; 
                fieldContent= v+"."+fieldContent; // Support $v.$v.$v
            } 
            extra.put( "v", fieldContent );                    
        }

        @Override
        public String getRegex() {
            return ".*";
        }

        @Override
        public String format( int[] startTime, int[] timeWidth, int length, Map<String, String> extra ) {
            return getArg( extra, "v", null ); //TODO: length
        }
    };
    
    /**
     * convert %() and ${} to standard $(), and support legacy modes in one
     * compact place.  Asterisk (*) is replaced with $x.
     * Note, commas may still appear in qualifier lists, and 
     * makeQualifiersCanonical will be called to remove them.
     * Copied from Das2's TimeParser.
     * @param formatString like %{Y,m=02}*.dat or $(Y;m=02)$x.dat
     * @return formatString containing canonical spec, $() and $x instead of *, like $(Y,m=02)$x.dat
     */
    public static String makeCanonical( String formatString ) {
        boolean wildcard= formatString.contains("*");
        boolean oldSpec= formatString.contains("${");
        Pattern p= Pattern.compile("\\$[0-9]+\\{");
        boolean oldSpec2= p.matcher(formatString).find();
        if ( formatString.startsWith("$") && !wildcard && !oldSpec && !oldSpec2 ) return formatString;
        if ( formatString.contains("%") && !formatString.contains("$") ) {
            formatString= formatString.replaceAll("\\%", "\\$");
        }
        oldSpec= formatString.contains("${"); // it might contain this now.
        if ( oldSpec && !formatString.contains("$(") ) {
            formatString= formatString.replaceAll("\\$\\{", "\\$(");
            formatString= formatString.replaceAll("\\}", "\\)");
        }
        if ( oldSpec2 && !formatString.contains("$(") ) {
            formatString= formatString.replaceAll("\\$([0-9]+)\\{", "\\$$1(");
            formatString= formatString.replaceAll("\\}", "\\)");
        }
        if ( wildcard ) {
            formatString= formatString.replaceAll("\\*", "\\$x");
        }
        int i=1;
        if ( i<formatString.length() && formatString.charAt(i)=='(' ) {
            i+=1;
        }
        while ( i<formatString.length() 
                && Character.isAlphabetic(formatString.charAt(i) ) ) {
            i+=1;
        }
        if ( i<formatString.length() && formatString.charAt(i)==',' ) {
            formatString= formatString.replaceFirst(",",";");
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
    public static String makeQualifiersCanonical( String qualifiers ) {
        boolean noDelimiters= true;
        for ( int i=0; noDelimiters && i<qualifiers.length(); i++ ) {
            if ( qualifiers.charAt(i)==',' || qualifiers.charAt(i)==';' ) {
                noDelimiters= false;
            }
        }
        if ( noDelimiters ) return qualifiers;
        
        char[] result= new char[qualifiers.length()];
        
        int istart;
        // We know that the first delimiter must be a semicolon.  
        // If it is, then assume the qualifiers are properly formatted.
        result[0]= qualifiers.charAt(0); // '$'
        result[1]= qualifiers.charAt(1); // '('
        for ( istart=2; istart<qualifiers.length(); istart++ ) {
            char ch= qualifiers.charAt(istart);
            if ( ch==';' ) return qualifiers; // assume the qualifiers are properly formatted
            if ( ch==',' ) {
                result[istart]=';';
                break;
            }
            if ( Character.isLetter(ch) || ch==')' ) {
                result[istart]=ch;
            }
        }

        boolean expectSemi=false;
        for ( int i= qualifiers.length()-1; i>istart; i-- ) {
            result[i]= qualifiers.charAt(i);
            char ch= qualifiers.charAt(i);
            if ( ch=='=' ) expectSemi=true;
            else if ( ch==',' && expectSemi ) {
                result[i]= ';' ;
            } else if ( ch==';' ) {
                expectSemi= false;
            }
        }
        String rr= new String(result);
        if ( !result.equals(qualifiers) ) {
            logger.log(Level.FINE, "qualifiers are made canonical: {0}->{1}", new Object[]{qualifiers, rr});
        }
        return rr;
    }
    
    /**
     * create the array if it hasn't been created already.
     * @param digits
     * @return 
     */
    private static int[] maybeInitialize( int[] digits ) {
        if ( digits==null ) {
            return new int[TimeUtil.TIME_DIGITS];
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
    private static int digitForCode( char code ) {
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
     * Note that in Python, floorDiv is just "//".  Java also truncates when doing
     * integer division.
     * +---------------+--------+
     * | expression    | result |
     * +---------------+--------+
     * | floorDiv(0,7) |  0     |
     * | floorDiv(1,7) |  0     |
     * | floorDiv(7,7) |  1     |
     * | floorDiv(-1,7)| -1     |
     * | floorDiv(-7,7)| -1     |
     * | floorDiv(-8,7)| -2     |
     * +---------------+--------+
     * 
     * @param ndays
     * @param timeWidth
     * @return the integer number of widths which result in a number below ndays.
     */
    protected static int floorDiv( int ndays, int timeWidth ) {
        int ncycles;
        if ( ndays<0 ) {
            ncycles= ( ndays + 1 ) / timeWidth - 1;
        } else {
            ncycles= ndays / timeWidth;
        }
        return ncycles;
    }
    
    /**
     * set the explicit width
     * @param spec specification like "4" or "4H" for four hours.
     */
    private void handleWidth( String fc, String spec ) {
        int span;
        int n= spec.length()-1;
        if ( Character.isDigit( spec.charAt(n) ) ) {
            span= Integer.parseInt(spec);
            int digit= digitForCode(fc.charAt(0));
            this.timeWidth[digit]= span;
        } else {
            span= Integer.parseInt( spec.substring(0,n) );
            int digit= digitForCode(spec.charAt(n));
            this.timeWidth[digit]= span;
        }
        timeWidthIsExplicit= true;
    }
    
    /**
     * create a new URITemplate for parsing and formatting.
     * @param formatString URI template spec as in /tmp/data.$Y$m$d.txt
     */
    public URITemplate( String formatString ) {
                
        this.fieldHandlers= new HashMap<>();
        
        this.fieldHandlers.put("subsec",new SubsecFieldHandler());
        this.fieldHandlers.put("hrinterval",new HrintervalFieldHandler());
        this.fieldHandlers.put("periodic",new PeriodicFieldHandler());
        this.fieldHandlers.put("enum",new EnumFieldHandler());
        this.fieldHandlers.put("x",new IgnoreFieldHandler());
        this.fieldHandlers.put("v",new VersionFieldHandler());

        logger.log(Level.FINE, "new TimeParser({0},...)", formatString);
        
        int[] startTime = new int[NUM_TIME_DIGITS];
        startTime[0]= MIN_VALID_YEAR;
        startTime[1]= 1;
        startTime[2]= 1;
        
        stopTimeDigit = AFTERSTOP_INIT;
        
        int[] stopTime = new int[NUM_TIME_DIGITS];
        stopTime[0]= MAX_VALID_YEAR;
        stopTime[1]= 1;
        stopTime[2]= 1;

        //result.fieldHandlers = fieldHandlers;
        
        this.fieldHandlersById= new HashMap();

        formatString= makeCanonical(formatString);
        this.spec= formatString;
        //this.formatString = formatString;
        
        String[] ss = formatString.split("\\$");
        fc = new String[ss.length];
        qualifiers= new String[ss.length];
        
        String[] delim = new String[ss.length + 1];

        ndigits = ss.length;

        StringBuilder regex1 = new StringBuilder(100);
        regex1.append(ss[0].replaceAll("\\+","\\\\+"));//TODO: I thought we did this already.

        lengths = new int[ndigits];
        for (int i = 0; i < lengths.length; i++) lengths[i] = -1; // -1 indicates not known, but we'll figure out as many as we can.
        
        startShift= null;
        stopShift= null;
        
        this.qualifiersMaps= new HashMap[ndigits];
        
        this.phasestart= null;
        
        delim[0] = ss[0];
        for (int i = 1; i < ndigits; i++) {
            int pp = 0;
            String ssi= ss[i];
            while ( ssi.length()>pp && ( Character.isDigit(ssi.charAt(pp)) || ssi.charAt(pp) == '-') ) {
                pp+=1;
            }
            if (pp > 0) { // Note length ($5Y) is not supported in https://github.com/hapi-server/uri-templates/wiki/Specification, but is in this library.
                lengths[i] = Integer.parseInt(ssi.substring(0, pp));
            } else {
                lengths[i] = 0; // determine later by field type
            }

            ssi= makeQualifiersCanonical(ssi);
            
            logger.log( Level.FINE, "ssi={0}", ss[i] );
            if ( ssi.charAt(pp)!='(' ) {
                fc[i] = ssi.substring(pp, pp + 1);
                delim[i] = ssi.substring(pp + 1);
            } else if ( ssi.charAt(pp) == '(') {
                int endIndex = ssi.indexOf(')', pp);
                if ( endIndex==-1 ) {
                    throw new IllegalArgumentException("opening paren but no closing paren in \"" + ssi+ "\"");
                }
                int semi= ssi.indexOf(";", pp );
                if ( semi != -1) {
                    fc[i] = ssi.substring(pp + 1, semi );
                    qualifiers[i]= ssi.substring( semi+1,endIndex );
                } else {
                    fc[i] = ssi.substring(pp + 1, endIndex);
                }
                delim[i] = ssi.substring(endIndex + 1);
            }
        }

        handlers = new int[ndigits];
        offsets = new int[ndigits];

        int pos = 0;
        offsets[0] = pos;

        lsd = -1;
        int lsdMult= 1;
//TODO: We want to add $Y_1XX/$j/WAV_$Y$jT$(H,span=5)$M$S_REC_V01.PKT
        context= new int[NUM_TIME_DIGITS];
        System.arraycopy( startTime, 0, context, 0, NUM_TIME_DIGITS );
        externalContext= NUM_TIME_DIGITS;  // this will lower and will typically be 0.

        timeWidth = new int[NUM_TIME_DIGITS];

        boolean haveHour= false;
        
        for (int i = 1; i < ndigits; i++) {
            if (pos != -1) {
                pos += delim[i - 1].length();
            }
            int handler = 9999;

            for (int j = 0; j < valid_formatCodes.length; j++) {
                if (valid_formatCodes[j].equals(fc[i])) {
                    handler = j;
                    break;
                }
            }
            
            if ( fc[i].equals("H") ) {
                haveHour= true;
            } else if ( fc[i].equals("p") ) {
                if ( !haveHour ) {
                    throw new IllegalArgumentException("$H must preceed $p");
                }
            }
            
            if (handler == 9999) {
                if ( !fieldHandlers.containsKey(fc[i]) ) {
                    throw new IllegalArgumentException("bad format code: \"" + fc[i] + "\" in \""+ formatString + "\"");
                } else {
                    handler = 100;
                    handlers[i] = 100;
                    offsets[i] = pos;
                    if (lengths[i] < 1 || pos == -1) { // 0->indetermined as well, allows user to force indeterminate
                        pos = -1;
                        lengths[i] = -1;
                    } else {
                        pos += lengths[i];
                    }
                    FieldHandler fh= fieldHandlers.get(fc[i]);
                    String args= qualifiers[i];
                    Map<String,String> argv= new HashMap();
                    if ( args!=null ) {
                        String[] ss2= args.split(";",-2);
                        for (String ss21 : ss2) {
                            int i3 = ss21.indexOf("=");
                            if (i3==-1) {
                                argv.put(ss21.trim(), "");
                            } else {
                                argv.put(ss21.substring(0, i3).trim(), ss21.substring(i3+1).trim());
                            }
                        }
                    }
                    String errm= fh.configure(argv);
                    if ( errm!=null ) {
                        throw new IllegalArgumentException(errm);
                    }
                    
                    String id= getArg( argv, "id", null );
                    if ( id!=null ) {
                        fieldHandlersById.put( id,fh );
                    }

                }
            } else {
                handlers[i] = handler;
                if (lengths[i] == 0) {
                    lengths[i] = formatCode_lengths[handler];
                }
                offsets[i] = pos;
            }

            int span=1;
            int div=1;

            if ( qualifiers[i]!=null ) {
                String[] ss2= qualifiers[i].split(";");
                qualifiersMaps[i]= new HashMap<>();
                for ( String ss21 : ss2 ) { //TODO: handle end before shift.
                    boolean okay=false;
                    String qual = ss21.trim();
                    if ( qual.equals("startTimeOnly") ) {
                        startTimeOnly= fc[i].charAt(0);
                        okay= true;
                    }
                    int idx= qual.indexOf("=");
                    if ( !okay && idx>-1 ) {
                        String name= qual.substring(0,idx).trim();
                        String val= qual.substring(idx+1).trim();
                        qualifiersMaps[i].put(name, val);
                        //FieldHandler fh= (FieldHandler) fieldHandlers.get(name);
                        //fh.parse( val, context, timeWidth );
                        switch (name) {
                            case "Y":
                                context[YEAR]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 0 );
                                break;
                            case "m":
                                context[MONTH]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 1 );
                                break;
                            case "d":
                                context[DAY]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 2 );
                                break;
                            case "j":
                                context[MONTH]= 1;
                                context[DAY]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 1 );
                                break;
                            case "H":
                                context[HOUR]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 3 );
                                break;
                            case "M":
                                context[MINUTE]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 4 );
                                break;
                            case "S":
                                context[SECOND]= Integer.parseInt(val);
                                externalContext= Math.min( externalContext, 5 );
                                break;
                            case "cadence":
                                span= Integer.parseInt(val);
                                handleWidth(fc[i],val);
                                timeWidthIsExplicit= true;
                                break;
                            case "span":
                                span= Integer.parseInt(val); // not part of uri_templates
                                handleWidth(fc[i],val);
                                timeWidthIsExplicit= true;
                                break;
                            case "delta":
                                span= Integer.parseInt(val); // see http://tsds.org/uri_templates
                                handleWidth(fc[i],val);
                                timeWidthIsExplicit= true;
                                break;
                            case "resolution":
                                span= Integer.parseInt(val);
                                handleWidth(fc[i],val);
                                timeWidthIsExplicit= true;
                                break;
                            case "period":
                                if ( val.startsWith("P") ) {
                                    try {
                                        int[] r= TimeUtil.parseISO8601Duration(val);
                                        for ( int j=0; j<NUM_TIME_DIGITS; j++ ) {
                                            if (r[j]>0 ) {
                                                lsd= j;
                                                lsdMult= r[j];
                                                logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[]{lsd, lsdMult});
                                                break;
                                            }
                                        }
                                    } catch (ParseException ex) {
                                        logger.log(Level.SEVERE, null, ex);
                                    }
                                } else {
                                    char code= val.charAt(val.length()-1);
                                    switch (code) {
                                        case 'Y':
                                            lsd=0;
                                            break;
                                        case 'm':
                                            lsd=1;
                                            break;
                                        case 'd':
                                            lsd=2;
                                            break;
                                        case 'j':
                                            lsd=2;
                                            break;
                                        case 'H':
                                            lsd=3;
                                            break;
                                        case 'M':
                                            lsd=4;
                                            break;
                                        case 'S':
                                            lsd=5;
                                            break;
                                        case 'N':
                                            lsd=6;
                                            break;
                                        default:
                                            break;
                                    }
                                    lsdMult= Integer.parseInt(val.substring(0,val.length()-1) );
                                    logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[]{lsd, lsdMult});
                                }   break;
                            case "id":
                                break; //TODO: orbit plug in handler...
                            case "places":
                                break; //TODO: this all needs to be redone...
                            case "phasestart":
                                try {
                                    phasestart= TimeUtil.isoTimeToArray(val);
                                } catch (IllegalArgumentException ex) {
                                    logger.log(Level.SEVERE, null, ex);
                                }
                                break;
                            case "start":
                                if ( handler==1 ) {
                                    twoDigitYearStart= Integer.parseInt(val);
                                }
                                break;
                            case "shift":
                                //TODO: handle end before shift.
                                if ( val.length()==0 ) throw new IllegalArgumentException("shift is empty");
                                char possibleUnit= val.charAt(val.length()-1);
                                int digit;
                                if ( Character.isAlphabetic(possibleUnit) ) {
                                    digit= digitForCode(possibleUnit);
                                    val= val.substring(0,val.length()-1);
                                } else {
                                    digit= digitForCode(fc[i].charAt(0));
                                }
                                if ( i<stopTimeDigit ) {
                                    startShift=maybeInitialize(startShift);
                                    startShift[digit]= Integer.parseInt(val);
                                } else {
                                    stopShift=maybeInitialize(stopShift);
                                    stopShift[digit]= Integer.parseInt(val);
                                }
                                break;
                            case "pad":
                            case "fmt":
                            case "case":
                            case "div":
                                if ( name.equals("pad") && val.equals("none") ) {
                                    lengths[i]= -1;
                                    pos= -1;
                                }
                                if ( name.equals("div") && lengths[i]!=-1 ) {
                                    div= (int)Float.parseFloat(val);
                                    int dig= (int)Math.log10(div);
                                    lengths[i]= Math.max(1,lengths[i]-dig);
                                    disallowCarryForStopTime=true;
                                }
                                if ( qualifiersMaps[i]==null ) qualifiersMaps[i]= new HashMap();
                                qualifiersMaps[i].put(name,val);
                                break;
                            case "end":
                                if ( stopTimeDigit==AFTERSTOP_INIT ) {
                                    startLsd= lsd;
                                    stopTimeDigit= i;
                                }   
                                break;
                            case "len":
                                lengths[i]= Integer.parseInt(val);
                                break;
                            default:
                                if ( !fieldHandlers.containsKey(fc[i]) ) {
                                    throw new IllegalArgumentException("unrecognized/unsupported field: "+name + " in "+qual );
                                }   
                                break;
                        }
                        okay= true;
                    } else if ( !okay ) {
                        String name= qual.trim();
                        if ( name.equals("end") ) {
                            if ( stopTimeDigit==AFTERSTOP_INIT ) {
                                startLsd= lsd;
                                stopTimeDigit= i;
                            }
                            okay= true;
                        }
                    }
                    if ( !okay && ( qual.equals("Y") || qual.equals("m") || qual.equals("d") || qual.equals("j") ||
                            qual.equals("H") || qual.equals("M") ||  qual.equals("S")) ) {
                        throw new IllegalArgumentException( String.format( "%s must be assigned an integer value (e.g. %s=1) in %s", qual, qual, ss[i] ) );
                    }
                    if ( !okay ) {
                        if ( !fieldHandlers.containsKey(fc[i]) ) {
                            logger.log(Level.WARNING, "unrecognized/unsupported field:{0} in {1}", new Object[]{qual, ss[i]});
                            //TODO: check plug-in handlers like orbit...
                            //throw new IllegalArgumentException("unrecognized/unsupported field:"+qual+ " in " +ss[i] );
                        }
                    }
                }

                if ( handler==13 ) { // Month name might be full, so length is not known.
                    String fmt= getArg( qualifiersMaps[i], "fmt", null );
                    if ( "full".equals(fmt) ) {
                        lengths[i]=-1;
                    }
                }   

            } else {
                // http://sourceforge.net/p/autoplot/bugs/1506/
                if ( fc[i].length()==1 ) {
                    char code= fc[i].charAt(0);
                    int thisLsd= -1;
                    switch (code) {
                        case 'Y':
                            thisLsd=0;
                            break;
                        case 'm':
                            thisLsd=1;
                            break;
                        case 'd':
                            thisLsd=2;
                            break;
                        case 'j':
                            thisLsd=2;
                            break;
                        case 'H':
                            thisLsd=3;
                            break;
                        case 'M':
                            thisLsd=4;
                            break;
                        case 'S':
                            thisLsd=5;
                            break;
                        case 'N':
                            thisLsd=6;
                            break;                     
                        default:
                            break;
                    }
                    if ( thisLsd==lsd ) {  // allow subsequent repeat fields to reset (T$y$(m,delta=4)/$x_T$y$m$d.DAT)
                        lsdMult= 1;
                    }
                }
            }

            if (lengths[i] < 1 || pos == -1) {
                pos = -1;
                //lengths[i] = -1; // bugfix: I wonder where this was used.  removed to support "$-1Y $-1m $-1d $H$M"
            } else {
                pos += lengths[i];
            }

            if ( fc[i].length()==1 ) {
                switch ( fc[i].charAt(0) ) {
                    case 'Y':
                        externalContext= Math.min( externalContext, 0 );
                        break;
                    case 'm':
                        externalContext= Math.min( externalContext, 1 );
                        break;
                    case 'd':
                        externalContext= Math.min( externalContext, 2 );
                        break;
                    case 'j':
                        externalContext= Math.min( externalContext, 1 );
                        break;
                    case 'H':
                        externalContext= Math.min( externalContext, 3 );
                        break;
                    case 'M':
                        externalContext= Math.min( externalContext, 4 );
                        break;
                    case 'S':
                        externalContext= Math.min( externalContext, 5 );
                        break;                
                    default:
                        break;
                }
            }
            
            if (handler < 100) {
                if ( precision[handler] > lsd && lsdMult==1 ) {  // omni2_h0_mrg1hr_$Y$(m,span=6)$d_v01.cdf.  Essentially we ignore the $d.
                    lsd = precision[handler];
                    lsdMult= Math.max( span,div );
                    logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[]{lsd, lsdMult});
                }
            }

            String dots = ".........";
            if (lengths[i] == -1) {
                regex1.append("(.*)");
            } else {
                regex1.append("(").append(dots.substring(0, lengths[i])).append(")");
            }
            regex1.append(delim[i].replaceAll("\\+","\\\\+"));

        }

        switch (lsd) { // see https://sourceforge.net/p/autoplot/bugs/1506/
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                if ( !timeWidthIsExplicit ) {
                    timeWidth[lsd] = lsdMult;        
                }
                break;
            case -1:
                timeWidth[0]= 8000;
                break;
            case 100: /* do nothing */ break;  //TODO: handler needs to report it's lsd, if it affects.
        }

        if ( logger.isLoggable(Level.FINE) ) {
            StringBuilder canonical= new StringBuilder( delim[0] );
            for (int i = 1; i < ndigits; i++) { 
                canonical.append("$");
                if ( qualifiers[i]==null ) {
                    canonical.append(fc[i]); 
                } else {
                    canonical.append("(").append(fc[i]).append(";").append(qualifiers[i]).append(")");
                }
                canonical.append(delim[i]); 
            }
            logger.log( Level.FINE, "Canonical: {0}", canonical.toString());
        }
        
        // if the stop time is not in the spec, then both start and stop are shifted.
        if ( this.stopTimeDigit==AFTERSTOP_INIT ) {
            if ( this.startShift!=null ) {
                this.stopShift= this.startShift;
            }
        }
        
        this.delims = delim;
        this.regex = regex1.toString();

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
    public int[] parse( String timeString ) throws ParseException {
        return parse( timeString, new HashMap<>() );
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
    public int[] parse( String timeString, Map<String,String> extra ) throws ParseException {
        logger.log(Level.FINER, "parse {0}", timeString);
        
        int offs = 0;
        int length = 0;

        int[] time;
        
        int[] startTime, stopTime;
        
        startTime= new int[NUM_TIME_DIGITS];
        stopTime= new int[NUM_TIME_DIGITS];
        
        time= startTime;
        
        System.arraycopy( context, 0, time, 0, NUM_TIME_DIGITS );

        int lastOffset=0;
        int lastLength=0;
        
        for (int idigit = 1; idigit < ndigits; idigit++) {
            
            if ( idigit==stopTimeDigit ) {
                logger.finer("switching to parsing end time");
                System.arraycopy( time, 0, stopTime, 0, NUM_TIME_DIGITS );
                time= stopTime;
            }
            
            if (offsets[idigit] != -1) {  // note offsets[0] is always known
                offs = offsets[idigit];
            } else {
                offs += length + this.delims[idigit - 1].length();
            }
            if (lengths[idigit] != -1) {
                length = lengths[idigit];
            } else {
                if (this.delims[idigit].equals("")) {
                    if (idigit == ndigits - 1) {
                        length = timeString.length() - offs;
                    } else {
                        throw new IllegalArgumentException("No delimiter specified after unknown length field, \"" + formatName[handlers[idigit]] + "\", field number=" + (1 + idigit) + "");
                    }
                } else {
                    while ( offs<timeString.length() && Character.isWhitespace( timeString.charAt(offs) ) ) offs+=1;
                    if ( offs>=timeString.length() ) {
                        throw new ParseException( "expected delimiter \"" + this.delims[idigit] + "\" but reached end of string", offs);
                    }
                    int i = timeString.indexOf(this.delims[idigit], offs);
                    if (i == -1) {
                        throw new ParseException("expected delimiter \"" + this.delims[idigit] + "\"", offs);
                    }
                    length = i - offs;
                    if ( length<0 ) {
                        throw new IllegalArgumentException("bad state, length should never be less than zero.");
                    }
                }
            }
            
            String foundDelim= timeString.substring(lastOffset+lastLength,offs);
            if ( !foundDelim.equals(delims[idigit-1]) ) {
                throw new ParseException("Expected \""+delims[idigit-1]+"\" before $" +fc[idigit]+", got: "+foundDelim,lastOffset);
            }
            
            lastOffset= offs;
            lastLength= length;
            
            if ( timeString.length()<offs+length ) {
                throw new ParseException( "string is too short: "+timeString, timeString.length() );
            }

            String field= timeString.substring(offs, offs + length).trim();
                        
            logger.log(Level.FINE, "handling \"{0}\" with {1}", new Object[]{field, handlers[idigit]});
            
            try {
                Map<String,String> qual= this.qualifiersMaps[idigit];
                if (handlers[idigit] < 10) {
                    int digit;
                    digit= Integer.parseInt(field);
                    if ( qual!=null ) {
                        String s= getArg( qual, "div", null );
                        if ( s!=null ) { 
                            int div= (int)Float.parseFloat(s); // TODO: we really have to parse this each time?
                            digit= digit*div;
                        }
                    }
                    switch (handlers[idigit]) {
                        case 0:
                            time[YEAR] = digit;
                            break;
                        case 1:
                            int mod= twoDigitYearStart % 100;
                            int cent= twoDigitYearStart / 100;
                            if ( digit>=mod ) {
                                time[YEAR] = cent * 100 + digit;
                            } else {
                                time[YEAR] = (cent+1) * 100 + digit;
                            }
                            break;
                        case 2:
                            time[MONTH] = 1;
                            time[DAY] = digit;
                            break;
                        case 3:
                            time[MONTH] = digit;
                            break;
                        case 4:
                            time[DAY] = digit;
                            break;
                        case 5:
                            time[HOUR] = digit;
                            break;
                        case 6:
                            time[MINUTE] = digit;
                            break;
                        case 7:
                            time[SECOND] = digit;
                            break;
                        case 8:
                            time[NANOSECOND] = digit;
                            break;
                        default:
                            throw new IllegalArgumentException("handlers[idigit] was not expected value (which shouldn't happen)");
                    }
                } else if (handlers[idigit] == 100) {
                    FieldHandler handler = (FieldHandler) fieldHandlers.get(fc[idigit]);
                    handler.parse(timeString.substring(offs, offs + length), time, timeWidth, extra );
                    
                } else if (handlers[idigit] == 10) { // AM/PM -- code assumes hour has been read already
                    char ch = timeString.charAt(offs);
                    if (ch == 'P' || ch == 'p') {
                        if ( time[HOUR]==12 ) {
                            // do nothing
                        } else {
                            time[HOUR] += 12;
                        }
                    } else if (ch == 'A' || ch == 'a') {
                        if ( time[HOUR]==12 ) {
                            time[HOUR] -= 12;
                        } else {
                            // do nothing
                        }
                    }
                } else if (handlers[idigit] == 11) { // TimeZone is not supported, see code elsewhere.
                    int offset;
                    offset= Integer.parseInt(timeString.substring(offs, offs + length));
                    time[HOUR] -= offset / 100;   // careful!

                    time[MINUTE] -= offset % 100;
                } else if (handlers[idigit] == 12) { // $(ignore)
                    if ( length>=0 ) {
                        extra.put( "ignore", timeString.substring(offs, offs + length) );
                    }
                } else if (handlers[idigit] == 13) { // month name
                    time[MONTH] = TimeUtil.monthNumber(timeString.substring(offs, offs + length));

                } else if (handlers[idigit] == 14) { // "X"
                    if ( length>=0 ) {
                        extra.put( "X", timeString.substring(offs, offs + length) );
                    }
                } else if (handlers[idigit] == 15) { // "x"
                    String name;
                    if ( qual!=null ) {
                        name= getArg( qual, "name", "x" );
                    } else {
                        name= "x";
                    }
                    if ( length>=0 ) {
                        extra.put( name, timeString.substring(offs, offs + length) );
                    }
                }
            } catch ( NumberFormatException ex ) {
                throw new ParseException( String.format( "fail to parse digit number %d: %s", idigit, field ), offs );
            }

        }
              
        String foundDelim= timeString.substring(lastOffset+lastLength);
        if ( !foundDelim.equals(delims[ndigits-1]) ) {
            throw new ParseException("Expected \""+delims[ndigits-1]+"\" after $" +fc[ndigits-1]+", got: "+foundDelim,lastOffset+lastLength);
        }
            
        if ( this.phasestart!=null ) {
            if ( timeWidth==null ) {
                logger.warning("phasestart cannot be used for month or year resolution");
            } else {
                if ( timeWidth[1]>0 ) {
                    startTime[1]= ( ( startTime[1] - this.phasestart[1] ) / timeWidth[1] ) * timeWidth[1] + this.phasestart[1];
                } else if ( timeWidth[0]>0 ) {
                    startTime[0]= ( ( startTime[0] - this.phasestart[0] ) / timeWidth[0] ) * timeWidth[0] + this.phasestart[0];
                } else if ( timeWidth[2]>1 ) {
                    int phaseStartJulian= TimeUtil.julianDay( phasestart[0], phasestart[1], phasestart[2] );
                    int ndays= TimeUtil.julianDay( startTime[0], startTime[1], startTime[2] ) - phaseStartJulian;
                    int ncycles= floorDiv( ndays, timeWidth[2] );
                    startTime= TimeUtil.fromJulianDay( phaseStartJulian + ncycles * timeWidth[2] );
                } else {
                    logger.log(Level.WARNING, 
                            "phasestart can only be used when step size is integer number of days greater than 1: {0}", 
                            TimeUtil.formatIso8601Duration(timeWidth));
                }
                stopTime= TimeUtil.add( startTime, this.timeWidth );                                    
            }
        } else {
            if ( stopTimeDigit==AFTERSTOP_INIT ) {
                if ( disallowCarryForStopTime ) {
                    stopTime= TimeUtil.add( startTime, this.timeWidth  );
                    if ( this.timeWidth[0]==0 && this.timeWidth[1]==0 && this.timeWidth[2]>1 ) {
                        stopTime[1]= 1;
                        stopTime[2]= 1;
                    }
                } else {
                    stopTime= TimeUtil.add( startTime, this.timeWidth );
                }
            }
        }
        
        int [] result= new int[NUM_TIME_DIGITS*2];
        
        boolean noShift;
        noShift = this.startShift==null;
        if ( noShift ) { 
            System.arraycopy(startTime, 0, result, 0, NUM_TIME_DIGITS);
            TimeUtil.normalizeTime(result);
        } else {
            for ( int i=0; i<NUM_TIME_DIGITS; i++ ) {
                result[i]= startTime[i] + this.startShift[i];
            }
            TimeUtil.normalizeTime(result);
        }
        
        noShift = this.stopShift==null;
        if ( noShift ) {     
            TimeUtil.normalizeTime(stopTime);
            System.arraycopy(stopTime, 0, result, NUM_TIME_DIGITS, NUM_TIME_DIGITS);
        } else {
            int[] resultStop= new int[NUM_TIME_DIGITS];
            for ( int i= 0; i<NUM_TIME_DIGITS; i++ ) {
                resultStop[i]= stopTime[i] + this.stopShift[i];
            }
            TimeUtil.normalizeTime(resultStop);
            System.arraycopy(resultStop, 0, result, NUM_TIME_DIGITS, NUM_TIME_DIGITS);
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
    public int getExternalContext() {
        return externalContext;
    }
    
    /**
     * set the context time.  The number of digits copied from 
     * externalContextTime is determined by the state of externalContext.
     * @param externalContextTime the context in [ Y, m, d, H, M, S, nanos ]
     */
    public void setContext( int[] externalContextTime ) {
        System.arraycopy(externalContextTime, 0, context, 0, externalContext);
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
    public static String[] formatRange( String template, String startTimeStr, String stopTimeStr ) throws ParseException {
        return formatRange( template, startTimeStr, stopTimeStr, Collections.EMPTY_MAP );
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
    public static String[] formatRange( String template, 
            String startTimeStr, 
            String stopTimeStr, 
            Map<String,String> extra ) throws ParseException {        
        URITemplate ut= new URITemplate(template);
        ArrayList<String> result= new ArrayList<>();
        String s1;
        String sptr= TimeUtil.isoTimeFromArray( TimeUtil.isoTimeToArray(startTimeStr) );
        int[] stopDigits= TimeUtil.isoTimeToArray(stopTimeStr);
        String stop= TimeUtil.isoTimeFromArray( stopDigits );
        if ( sptr.compareTo(stop)>0 ) {
            throw new IllegalArgumentException("start time must be before or equal to stop time.");
        }
        int i=0;
        int externalContext= ut.getExternalContext();
        if ( externalContext>0 ) {
            int[] context= new int[TimeUtil.TIME_DIGITS];
            System.arraycopy(stopDigits, 0, context, 0, externalContext);
            ut.setContext(context);
        }
        
        boolean firstLoop= true;
        while ( sptr.compareTo(stop)<0 ) {
            String sptr0= sptr;
            s1= ut.format( sptr, sptr, extra );
            int [] tta= ut.parse( s1, new HashMap<>() );
            if ( firstLoop ) {
                sptr= TimeUtil.isoTimeFromArray( TimeUtil.getStartTime(tta) );
                s1= ut.format( sptr, sptr, extra );
                firstLoop= false;
            }
            //test for special case where start and stop are in the template, so there is no looping.
            if ( Arrays.equals( TimeUtil.getStartTime(tta), TimeUtil.getStopTime(tta) ) ) {
                result.add( ut.format( startTimeStr, stopTimeStr ) );
                break;
            } else {
                result.add( s1 );
            }
            sptr= TimeUtil.isoTimeFromArray( TimeUtil.getStopTime(tta) );
            if ( sptr0.equals(sptr) ) {
                throw new IllegalArgumentException("template fails to advance");
            }
            i=i+1;
        }
        return result.toArray( new String[result.size()] );
    }
    
    /**
     * return a the formatted name, using the spec and the given time range.
     * @param startTimeStr iso8601 formatted time.
     * @param stopTimeStr iso8601 formatted time.
     * @return formatted time, often a resolvable URI.
     */
    public String format( String startTimeStr, String stopTimeStr ) {
        return format( startTimeStr, stopTimeStr, new HashMap<>() );
    }
    
    /**
     * return a the formatted name, using the spec and the given time range.
     * @param startTimeStr iso8601 formatted time.
     * @param stopTimeStr iso8601 formatted time.
     * @param extra extra parameters
     * @return formatted time, often a resolvable URI.
     */
    public String format( String startTimeStr, String stopTimeStr, 
            Map<String,String> extra ) {
             
        int[] startTime= TimeUtil.isoTimeToArray( startTimeStr );
        int[] stopTime;        
        if ( timeWidthIsExplicit ) {
            stopTime = TimeUtil.add( startTime, timeWidth );
        } else {
            stopTime = TimeUtil.isoTimeToArray( stopTimeStr );
        }
        return formatStartStopRange( startTime, stopTime, extra );
    }        

    /**
     * return the formatted name, using the spec and the given time range.
     * @param timeRange fourteen-component time range
     * @return formatted time, often a resolvable URI.
     */    
    public String formatTimeRange( int[] timeRange ) {
        return formatTimeRange( timeRange, Collections.emptyMap() );
    }
    
    /**
     * return the formatted name, using the spec and the given time range.
     * @param timeRange fourteen-component time range
     * @param extra extra parameters
     * @return formatted time, often a resolvable URI.
     */    
    public String formatTimeRange( int[] timeRange, Map<String,String> extra ) {
        int[] start= TimeUtil.getStartTime(timeRange);
        int[] stop= TimeUtil.getStopTime(timeRange);
        return formatStartStopRange( start, stop, extra );
    }

    /**
     * return the formatted name, using the spec and the given time range.
     * @param startTime seven-component start time
     * @param stopTime seven-component stop time
     * @return formatted time, often a resolvable URI.
     */    
    public String formatStartStopRange( int[] startTime, int[] stopTime ) {
        return formatStartStopRange( startTime, stopTime, Collections.emptyMap() );
    }
        
    /**
     * return the formatted name, using the spec and the given time range.
     * @param startTime seven-component start time
     * @param stopTime seven-component stop time
     * @param extra extra parameters
     * @return formatted time, often a resolvable URI.
     */    
    public String formatStartStopRange( int[] startTime, int[] stopTime, Map<String,String> extra ) {

        int[] timeWidthl;
        if ( timeWidthIsExplicit ) {
            timeWidthl= timeWidth;
        } else {
            timeWidthl = TimeUtil.subtract( stopTime, startTime );
        }
        
        if ( startShift!=null ) {
            startTime= TimeUtil.subtract( startTime, startShift );
        }
        if ( stopShift!=null ) {
            stopTime= TimeUtil.subtract( stopTime, stopShift );
        }
        
        if ( timeWidthIsExplicit ) {
            if ( this.phasestart!=null && timeWidth[2]>0 ) {
                int phaseStartJulian= TimeUtil.julianDay( phasestart[0], phasestart[1], phasestart[2] );
                int ndays= TimeUtil.julianDay(  startTime[0], startTime[1], startTime[2] ) - phaseStartJulian;
                int ncycles= floorDiv( ndays, timeWidth[2] );
                int[] tnew= TimeUtil.fromJulianDay(phaseStartJulian+ncycles*timeWidth[2]);
                startTime[0]= tnew[0];
                startTime[1]= tnew[1];
                startTime[2]= tnew[2];
                stopTime = TimeUtil.add( startTime, timeWidth );
            }
        }
        
        int[] timel= startTime;
        
        StringBuilder result = new StringBuilder(100);

        int offs = 0;
        int length;
        
        String[] nf = new String[5];
        nf[1] = "%1d";
        nf[2] = "%02d";
        nf[3] = "%03d";
        nf[4] = "%04d";

        for (int idigit = 1; idigit < ndigits; idigit++) {
            if ( idigit==stopTimeDigit ) {
                timel= stopTime;
            }
            
            result.insert(offs, this.delims[idigit - 1]);
            if (offsets[idigit] != -1) {  // note offsets[0] is always known

                offs = offsets[idigit];
            } else {
                offs += this.delims[idigit - 1].length();
            }
            if (lengths[idigit] != -1) {
                length = lengths[idigit];
            } else {
                length = -9999;  // the field handler will tell us.

            }
            if (handlers[idigit] < 10) {
                Map<String,String> qualm= qualifiersMaps[idigit];
                int digit;
                int delta=1;
                if ( qualm!=null ) {
                    String ddelta= getArg( qualm, "delta", null );
                    if ( ddelta!=null ) {
                        delta= Integer.parseInt(ddelta);
                    } else {
                        ddelta= getArg( qualm, "span", null );
                        if ( ddelta!=null ) {
                            delta= Integer.parseInt(ddelta);
                        }
                    }
                }
                switch (handlers[idigit]) {
                    case 0:
                        digit = timel[0];
                        break;
                    case 1:
                        if ( timel[0]<2000 ) {
                            digit = timel[0] - 1900;
                        } else {
                            digit = timel[0] - 2000;
                        }
                        break;
                    case 2:
                        digit = TimeUtil.dayOfYear( timel[0], timel[1], timel[2] );
                        break;
                    case 3:
                        digit = timel[1];
                        break;
                    case 4:
                        digit = timel[2];
                        break;
                    case 5:
                        digit = timel[3];
                        break;
                    case 6:
                        digit = timel[4];
                        break;
                    case 7:
                        digit = timel[5];
                        break;
                    case 8:
                        digit = timel[6];
                        break;
                    case 9:
                        digit = timel[6]/1000; //TODO verify
                        break;
                    default:
                        throw new RuntimeException("shouldn't get here");
                }
                if ( delta>1 ) {
                    int h= handlers[idigit];
                    switch (h) {
                        case 2:
                        case 3:
                            // $j, $m all start with 1.
                            digit= ( ( ( digit-1) / delta ) * delta ) + 1;
                            break;
                        case 4:
                            if ( phasestart!=null ) {
                                int phaseStartJulian= TimeUtil.julianDay( phasestart[0], phasestart[1], phasestart[2] );
                                int ndays= TimeUtil.julianDay(  timel[0], timel[1], timel[2] ) - phaseStartJulian;
                                int ncycles= floorDiv( ndays, timeWidth[2] );
                                
                                int[] tnew= TimeUtil.fromJulianDay(phaseStartJulian+ncycles*delta);
                                timel[0]= tnew[0];
                                timel[1]= tnew[1];
                                timel[2]= tnew[2];
                                
                            } else {
                                throw new IllegalArgumentException("phasestart not set for delta days");
                            }   
                            break;
                        default:
                            digit= ( digit / delta ) * delta;
                            break;
                    }
                }
                if ( length<0 ) {
                    String ss= String.valueOf(digit);
                    result.insert(offs, ss);
                    offs+= ss.length();
                } else {
                    if ( this.qualifiersMaps[idigit]!=null ) {
                        // TODO: suboptimal
                        String div= getArg( this.qualifiersMaps[idigit], "div", null );
                        if ( div!=null ) {
                            digit= digit / (int)Float.parseFloat(div); //  use parseFloat to support 1E6
                        }
                        String pad= getArg( this.qualifiersMaps[idigit], "pad", null );
                        if ( pad==null || pad.equals("zero") ) { 
                            result.insert(offs, String.format(nf[length],digit) );
                            offs+= length;
                        } else {
                            if ( digit<10 ) {
                                switch (pad) {
                                    case "space":
                                        result.insert( offs, " " );
                                        result.insert(offs, String.valueOf(digit) );
                                        offs+= 2;
                                        break;
                                    case "underscore":
                                        result.insert( offs, "_" );
                                        result.insert(offs, String.valueOf(digit) );
                                        offs+= 2;
                                        break;
                                // do nothing.
                                    case "none":
                                        result.insert(offs, String.valueOf(digit) );
                                        offs+= 1;
                                        break;
                                    default:
                                        result.insert(offs, String.format( nf[length], digit) );
                                        offs+= length;
                                        break;
                                }
                                
                            } else {
                                result.insert(offs, String.format( nf[length], digit) );
                                offs+= length;
                            }
                        }
                    } else {
                        result.insert(offs, String.format( nf[length], digit) );
                        offs += length;
                    }
                }

            } else if (handlers[idigit] == 13) { // month names
                String cas= getArg( this.qualifiersMaps[idigit], "case", null );
                String fmt= getArg( this.qualifiersMaps[idigit], "fmt", null );
                String ins;
                
                if ( "full".equals(fmt) ) {
                    ins= TimeUtil.monthNameFull(timel[1]);
                } else {
                    ins= TimeUtil.monthNameAbbrev(timel[1]);
                }
                
                if ( cas==null || cas.equals("lc") ) {
                    ins= ins.toLowerCase();
                } else if ( cas.equals("cap") ) {
                    // nothing more
                } else if ( cas.equals("uc") ) {
                    ins= ins.toUpperCase();
                }
                
                result.insert(offs, ins);
                offs += ins.length();

            } else if (handlers[idigit] == 12 || handlers[idigit]==14 ) { // ignore
                throw new RuntimeException("cannot format spec containing ignore");

            } else if (handlers[idigit] == 100) {
                if ( fc[idigit].equals("v") ) { // kludge for version.  TODO: This can probably use the code below now.
                    String ins= getArg( extra, "v", "00" );
                    if ( length>-1 ) {
                        if ( length>20 ) throw new IllegalArgumentException("version lengths>20 not supported");
                        ins= "00000000000000000000".substring(0,length);
                    }
                    result.insert( offs, ins );
                    offs+= ins.length();
                } else {
                    FieldHandler fh1= fieldHandlers.get(fc[idigit]);
                    int[] timeEnd = stopTime;
                    String ins= fh1.format( timel, TimeUtil.subtract(timeEnd, timel), length, extra );
                    int[] startTimeTest= new int[NUM_TIME_DIGITS];
                    System.arraycopy(timel, 0, startTimeTest, 0, NUM_TIME_DIGITS);
                    int[] timeWidthTest= new int[NUM_TIME_DIGITS];
                    System.arraycopy(timeWidthl, 0, timeWidthTest, 0, NUM_TIME_DIGITS);
                    
                    try {
                        fh1.parse( ins, startTimeTest, timeWidthTest, extra );
                        System.arraycopy(startTimeTest, 0, timel, 0, NUM_TIME_DIGITS);
                        System.arraycopy(timeWidthTest, 0, timeWidthl, 0, NUM_TIME_DIGITS);
                        System.arraycopy(TimeUtil.add( timel, timeWidthl ), 0, stopTime, 0, NUM_TIME_DIGITS);
                        
                    } catch (ParseException ex) {
                        logger.log(Level.SEVERE, null, ex);
                    }
                    if ( length>-1 && ins.length()!=length ) {
                        String p= getArg( this.qualifiersMaps[idigit], "pad", null );
                        if ( p==null ) {
                            throw new IllegalArgumentException("length of fh is incorrect, should be "+length+", got \""+ins+"\", and pad is not defined.");
                        }
                        if ( length<ins.length()  ) {
                            throw new IllegalArgumentException("length of fh is incorrect, should be "+length+", got \""+ins+"\", which has too many characters.");
                        } else {
                            int l= length-ins.length();
                            String padx;
                            switch (p) {
                                case "underscore":
                                case "_":
                                case "none":
                                    padx= "____________________".substring(0,l); //TODO: spec should declare a maximum field length
                                    break;
                                case "space":
                                    padx= "                    ".substring(0,l);
                                    break;
                                default:
                                    throw new IllegalArgumentException("unsupported pad.  Must be underscore, _, or space");
                            }
                            ins = padx + ins;
                        }
                    }
                    result.insert( offs, ins );
                    offs+= ins.length();
                }

            } else if (handlers[idigit] == 10) {
                throw new RuntimeException("AM/PM not supported");

            } else if (handlers[idigit] == 11) {
                throw new RuntimeException("Time Zones not supported");
            }
            
        }
        result.insert(offs, this.delims[ndigits - 1]);
        return result.toString().trim();

    }
    
    @Override
    public String toString() {
        return "URITemplate "+this.spec;
    }
    
    private static void printUsage() {
        System.err.println("URITemplate "+VERSION);
        System.err.println("Usage: ");
        System.err.println("java -jar UriTemplatesJava.jar [--formatRange|--parse] [--range=<ISO8601 range>] --template=<URI template> [--name=<name>]");
        System.err.println("java -jar UriTemplatesJava.jar --formatRange --range=1999-01-01/1999-01-03 --template='http://example.com/data_$(d;pad=none).dat'");
        System.err.println("java -jar UriTemplatesJava.jar --parse --template='data_$(d;pad=none;Y=1999; m=5).dat' --name=data_1.dat");
        System.err.println("   --formatRange time ranges will be formatted into names");
        System.err.println("   --parse names will be parsed into time ranges");
        System.err.println("   --range is an iso8601 range, or - for ranges from stdin");
        System.err.println("   --name is has been formatted by the template, or - for names from stdin");
    }
    
    /**
     * Usage: java -jar dist/UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
     * @param args the command line arguments.
     */
    public static void main( String[] args ) {
        if ( args.length==0 || args[1].equals("--help") ) {
            printUsage();
            System.exit(-1);
        }
        Map<String,String> argsm= new HashMap<>();
        for (String a : args) {
            String[] aa= a.split("=",2);
            if ( aa.length==1 ) {
                argsm.put( aa[0], "" );
            } else {
                argsm.put( aa[0], aa[1] );
            }
        }
        if ( argsm.containsKey("--formatRange") ) {
            argsm.remove("--formatRange");
            String template= argsm.remove("--template");
            if ( template==null ) {
                printUsage();
                System.err.println("need --template parameter");
                System.exit(-2);
            }
            String timeRange= argsm.remove("--range");
            if ( timeRange==null ) {
                printUsage();
                System.err.println("need --range parameter");
                System.exit(-3);
            }
            if ( timeRange.equals("-") ) {
                String tr1=null;
                try ( BufferedReader r= new BufferedReader( new InputStreamReader(System.in) ) ) {
                    tr1= r.readLine();
                    while ( tr1!=null ) {
                        int[] itimeRange;
                        itimeRange= TimeUtil.parseISO8601TimeRange(tr1);
                        String[] result= URITemplate.formatRange( template, 
                            TimeUtil.isoTimeFromArray( TimeUtil.getStartTime( itimeRange ) ), 
                            TimeUtil.isoTimeFromArray( TimeUtil.getStopTime( itimeRange ) ) );
                        for ( String s: result ) {
                            System.out.println(s);
                        }
                        tr1= r.readLine();
                    } 
                } catch (ParseException ex) {
                    printUsage();
                    System.err.println("range is misformatted: "+tr1);
                    System.exit(-3);
                } catch ( IOException ex ) {
                    System.err.println("IOException");
                    System.exit(-4);
                }

            } else {
                int[] itimeRange;
                try {
                    itimeRange= TimeUtil.parseISO8601TimeRange(timeRange);
                    String[] result= URITemplate.formatRange( template, 
                        TimeUtil.isoTimeFromArray( TimeUtil.getStartTime( itimeRange ) ), 
                        TimeUtil.isoTimeFromArray( TimeUtil.getStopTime( itimeRange ) ) );
                    for ( String s: result ) {
                        System.out.println(s);
                    }
                } catch (ParseException ex) {
                    printUsage();
                    System.err.println("range is misformatted");
                    System.exit(-3);
                }
            }

        } else if ( argsm.containsKey("--parse" ) ) {
            argsm.remove("--parse");
            String template= argsm.remove("--template");
            if ( template==null ) {
                printUsage();
                System.err.println("need --template parameter");
                System.exit(-2);
            }
            String name= argsm.remove("--name");
            if ( name==null ) {
                printUsage();
                System.err.println("need --name parameter");
                System.exit(-3);
            }
            if ( name.equals("-") ) {
                String filen1=null;
                try ( BufferedReader r= new BufferedReader( new InputStreamReader(System.in) ) ) {
                    filen1= r.readLine();
                    while ( filen1!=null ) {
                        URITemplate ut= new URITemplate(template);
                        int[] itimeRange= ut.parse( filen1, argsm );
                        System.out.print( TimeUtil.isoTimeFromArray( TimeUtil.getStartTime( itimeRange ) ) );
                        System.out.print( "/" );
                        System.out.println( TimeUtil.isoTimeFromArray( TimeUtil.getStopTime( itimeRange ) ) );                            
                        filen1= r.readLine();
                    }

                } catch ( IOException ex ) {

                } catch ( ParseException ex ) {
                    printUsage();
                    System.err.println("parseException from "+filen1);
                    System.exit(-3);
                }

            } else {
                try {
                    URITemplate ut= new URITemplate(template);
                    int[] itimeRange= ut.parse( name, argsm );
                    System.out.print( TimeUtil.isoTimeFromArray( TimeUtil.getStartTime( itimeRange ) ) );
                    System.out.print( "/" );
                    System.out.println( TimeUtil.isoTimeFromArray( TimeUtil.getStopTime( itimeRange ) ) );                    
                } catch ( ParseException ex ) {
                    printUsage();
                    System.err.println("parseException from ?");
                    System.exit(-3);
                }
            }

        }
    }
}
