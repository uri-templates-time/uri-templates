
package org.hapiserver;

import java.util.Arrays;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author jbf
 */
public class URITemplateTest {
    
    public URITemplateTest() {
    }
    
    @BeforeClass
    public static void setUpClass() {
    }
    
    @Before
    public void setUp() {
    }

    /**
     * Test of makeCanonical method, of class URITemplate.
     */
    @Test
    public void testMakeCanonical() {
        System.out.println("makeCanonical");
        String formatString = "%{Y,m=02}*.dat";
        String expResult = "$(Y;m=02)$x.dat";
        String result = URITemplate.makeCanonical(formatString);
        assertEquals(expResult, result);
    }
    
    private static String toStr( int[] res ) {
        String t1= TimeUtil.isoTimeFromArray( Arrays.copyOf(res, 7) ).substring(0,16);
        String t2= TimeUtil.isoTimeFromArray( Arrays.copyOfRange(res, 7, 14) ).substring(0,16);
        return t1+"/"+t2;
    }
        
    private static void testTimeParser1( String spec, String test, String norm ) throws Exception {
        URITemplate ut;
        try {
            ut = new URITemplate(spec);
        } catch ( IllegalArgumentException ex ) {
            System.err.println("### unable to parse spec: "+spec);
            return;
        }
        
        String[] nn= norm.split("/",-2);
        if ( TimeUtil.iso8601DurationPattern.matcher(nn[1]).matches() ) {
            nn[1]= TimeUtil.isoTimeFromArray(
                    TimeUtil.add( TimeUtil.isoTimeToArray(nn[0]), 
                            TimeUtil.parseISO8601Duration(nn[1]) ) );
        }
        
        int[] start= TimeUtil.isoTimeToArray(nn[0]);
        int[] stop= TimeUtil.isoTimeToArray(nn[1]);
        int[] inorm= new int[14];
        System.arraycopy( start, 0, inorm, 0, 7 );
        System.arraycopy( stop, 0, inorm, 7, 7 );
        
        int[] res;
        
        res= ut.parse( test );
        
        char arrow= (char)8594;
        if ( Arrays.equals( res, inorm  ) ) {
            System.out.println( String.format( "%s:  \t\"%s\"%s\t\"%s\"", spec, test, arrow, toStr(res) ) );
        } else {    
            System.out.println( "### ranges do not match: "+spec + " " +test + arrow + toStr(res) + ", should be "+norm );
            //throw new IllegalStateException("ranges do not match: "+spec + " " +norm + "--> " + res + ", should be "+test );
        }
        assertArrayEquals( res, inorm );
        
    }    

    /**
     * Test of parse method, of class URITemplate.
     * @throws java.lang.Exception
     */
    @Test
    public void testParse() throws Exception {
        System.out.println("parse");
        testTimeParser1( "$Y $m $d $H $M", "2012 03 30 16 20", "2012-03-30T16:20/2012-03-30T16:21" );
        testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        testTimeParser1( "$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03" );
        testTimeParser1( "$Y$m$d-$(Y;end)$m$(d;shift=1)", "20130202-20140303", "2013-02-02/2014-03-04" );
        testTimeParser1( "$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13" );
        testTimeParser1( "$(periodic;offset=0;start=2000-001;period=P1D)", "0",  "2000-001/P1D");
        testTimeParser1( "$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");        
        testTimeParser1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        testTimeParser1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");        
        testTimeParser1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT6H");
        testTimeParser1( "$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        testTimeParser1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        testTimeParser1( "$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        // The following shows a bug where it doesn't consider the length of $H and just stops on the next period.
        // A field cannot contain the following delimiter.
        //testTimeParser1( "$(j,Y=2012).*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        testTimeParser1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T12:00");
        testTimeParser1( "$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21" );
        testTimeParser1( "$Y",            "2012",     "2012-01-01T00:00/2013-01-01T00:00");
        testTimeParser1( "$Y-$j",         "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        testTimeParser1( "$(j,Y=2012)",   "017",      "2012-01-17T00:00/2012-01-18T00:00");
        testTimeParser1( "ace_mag_$Y_$j_to_$(Y;end)_$j.cdf",   "ace_mag_2005_001_to_2005_003.cdf",      "2005-001T00:00/2005-003T00:00");    
    }

    private static void testTimeFormat1( String spec, String test, String norm ) throws Exception {
        URITemplate ut;
        try {
            ut = new URITemplate(spec);
        } catch ( IllegalArgumentException ex ) {
            System.out.println("### unable to parse spec: "+spec);
            return;
        }
        
        String[] nn= norm.split("/",-2);
        if ( TimeUtil.iso8601DurationPattern.matcher(nn[1]).matches() ) {
            nn[1]= TimeUtil.isoTimeFromArray(
                    TimeUtil.add( TimeUtil.isoTimeToArray(nn[0]), 
                            TimeUtil.parseISO8601Duration(nn[1]) ) );
        }
        String res;
        try {
            res= ut.format( nn[0], nn[1] );
        } catch ( RuntimeException ex ) {
            System.out.println( "### " + ex.getMessage() );
            return;
        }
        
        char arrow= (char)8594;
        if ( res.equals(test) ) {
            System.out.println( String.format( "%s:  \t\"%s\"%s\t\"%s\"", spec, norm, arrow, res ) );
        } else {
            System.out.println( "### ranges do not match: "+spec + " " +norm + arrow + res + ", should be "+test );
            //throw new IllegalStateException("ranges do not match: "+spec + " " +norm + "--> " + res + ", should be "+test );
        }
        assertEquals( res, test );
    }

    /**
     * Test of format method, of class URITemplate.
     * @throws java.lang.Exception
     */
    @Test
    public void testFormat() throws Exception {
        System.out.println("format");
        //testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        testTimeFormat1( "$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03" );
        testTimeFormat1( "$Y$m$d-$(Y;end)$m$(d;shift=1)", "20130202-20140303", "2013-02-02/2014-03-04" );
        testTimeFormat1( "$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13" );
        testTimeFormat1( "$(periodic;offset=0;start=2000-001;period=P1D)", "0",  "2000-001/P1D");
        testTimeFormat1( "$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");        
        testTimeFormat1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        testTimeFormat1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");        
        testTimeFormat1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT12H");
        testTimeFormat1( "$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        //testTimeFormat1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeFormat1( "$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        // The following shows a bug where it doesn't consider the length of $H and just stops on the next period.
        // A field cannot contain the following delimiter.
        //testTimeFormat1( "$(j,Y=2012).*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        testTimeFormat1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T18:00");
        testTimeFormat1( "$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21" );
        testTimeFormat1( "$Y",            "2012",     "2012-01-01T00:00/2013-01-01T00:00");
        testTimeFormat1( "$Y-$j",         "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        testTimeFormat1( "$(j,Y=2012)",   "017",      "2012-01-17T00:00/2012-01-18T00:00");
        testTimeFormat1( "ace_mag_$Y_$j_to_$(Y;end)_$j.cdf",   "ace_mag_2005_001_to_2005_003.cdf",      "2005-001T00:00/2005-003T00:00");        
        
    }
    
}
