
package org.hapiserver;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author jbf
 */
public class URITemplateTest {
    
    public URITemplateTest() {
    }

    /**
     * Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
     */
    public static final Pattern iso8601DurationPattern = // repeated for Java to Jython conversion.
            Pattern.compile("P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?");
    
    /**
     * Test of makeCanonical method, of class URITemplate.
     */
    @Test
    public void testMakeCanonical() {
        System.out.println("# testMakeCanonical");
        String formatString = "%{Y,m=02}*.dat";
        String expResult = "$(Y;m=02)$x.dat";
        String result = URITemplate.makeCanonical(formatString);
        assertEquals(expResult, result);
    }
    
    private static String toStr( int[] res ) {
        String t1= TimeUtil.isoTimeFromArray( TimeUtil.getStartTime(res) ).substring(0,16);
        String t2= TimeUtil.isoTimeFromArray( TimeUtil.getStopTime(res) ).substring(0,16);
        return t1+"/"+t2;
    }
        
    private void doTestTimeParser1( String spec, String test, String norm ) throws Exception {
        URITemplate ut;
        try {
            ut = new URITemplate(spec);
        } catch ( IllegalArgumentException ex ) {
            System.err.println("### unable to parse spec: "+spec);
            return;
        }
        
        String[] nn= norm.split("/",-2);
        if ( iso8601DurationPattern.matcher(nn[1]).matches() ) {
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
        
        try {       
            res= ut.parse( test, new HashMap<>() );
        } catch ( ParseException ex ) {
            fail(ex.getMessage());
            return;
        }
        
        char arrow= (char)8594;
        if ( Arrays.equals( res, inorm  ) ) {
            System.out.println( String.format( "%s:  \t\"%s\"%s\t\"%s\"", spec, test, arrow, toStr(res) ) );
        } else {    
            System.out.println( "### ranges do not match: "+spec + " " +test + arrow + toStr(res) + ", should be "+norm );
            //throw new IllegalStateException("ranges do not match: "+spec + " " +norm + "--> " + res + ", should be "+test );
        }
        assertArrayEquals( res, inorm );
        
    }    

    private void dotestParse1() throws ParseException {
        URITemplate ut= new URITemplate("$Y_sc$(enum;values=a,b,c,d;id=sc)");
        Map<String,String> extra= new HashMap<>();
        int[] digits= ut.parse("2003_scd",extra);
        String actual= String.format("%d %s",digits[0],extra.get("sc"));
        assertEquals("2003 d",actual);
        System.out.println(actual);
    }
    
    private void doTestParse2() throws ParseException {
        URITemplate ut= new URITemplate("$Y_$m_v$v.dat");
        Map<String,String> extra= new HashMap<>();
        int[] digits= ut.parse("2003_10_v20.3.dat",extra);
        assertEquals(2003,digits[0]);
        assertEquals(10,digits[1]);
        assertEquals(11,digits[8]);
        assertEquals("20.3",extra.get("v"));
        
    }
    
    private void doTestParse3() throws ParseException {
        URITemplate ut= new URITemplate("$Y$m$(d;delta=10;phasestart=1979-01-01)");
        Map<String,String> extra= new HashMap<>();
        int[] digits= ut.parse("19791227",extra);
        assertEquals(1980,digits[7]);
        assertEquals(1,digits[8]);
        assertEquals(6,digits[9]);
    }
    
    /**
     * Test of parse method, of class URITemplate.
     * @throws java.lang.Exception
     */
    @Test
    public void testParse() throws Exception {
        System.out.println("# testParse");
        doTestTimeParser1( "$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        dotestParse1();
        doTestParse2();
        doTestParse3();
        doTestTimeParser1( "$(j;Y=2012).$H$M$S.$N", "017.020000.245000000", "2012-01-17T02:00:00.245000000/2012-01-17T02:00:00.245000001");
        doTestTimeParser1( "ac27_crn$x_$Y$j00-$(Y;end)$(j;end)00.gif", "ac27_crn1926_199722300-199725000.gif", "1997-223T00:00/1997-250T00:00");
        doTestTimeParser1( "$Y $m $d $H $M", "2012 03 30 16 20", "2012-03-30T16:20/2012-03-30T16:21" );
        doTestTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        doTestTimeParser1( "$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03" );
        doTestTimeParser1( "$Y$m$d-$(Y;end)$m$(d;shift=1)", "20200101-20200107", "2020-01-01/2020-01-08" );
        doTestTimeParser1( "$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13" );
        doTestTimeParser1( "$(periodic;offset=0;start=2000-001;period=P1D)", "0",  "2000-001/P1D");
        doTestTimeParser1( "$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");        
        doTestTimeParser1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        doTestTimeParser1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");        
        doTestTimeParser1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT6H");
        doTestTimeParser1( "$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        //This should not parse: doTestTimeParser1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        doTestTimeParser1( "$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        // The following shows a bug where it doesn't consider the length of $H and just stops on the next period.
        // A field cannot contain the following delimiter.
        //testTimeParser1( "$(j,Y=2012).*.$H",     "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //Orbits are not supported.
        //testTimeParser1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z"); 
        doTestTimeParser1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T12:00");
        doTestTimeParser1( "$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21" );
        doTestTimeParser1( "$Y",            "2012",     "2012-01-01T00:00/2013-01-01T00:00");
        doTestTimeParser1( "$Y-$j",         "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        doTestTimeParser1( "$(j,Y=2012)",   "017",      "2012-01-17T00:00/2012-01-18T00:00");
        doTestTimeParser1( "ace_mag_$Y_$j_to_$(Y;end)_$j.cdf",   "ace_mag_2005_001_to_2005_003.cdf",      "2005-001T00:00/2005-003T00:00");    
        doTestTimeParser1( "$y $(m;pad=none) $(d;pad=none) $(H;pad=none)", "99 1 3 0", "1999-01-03T00:00/1999-01-03T01:00" );
        doTestTimeParser1( "$y $j ($(m;pad=none) $(d;pad=none)) $H", "99 003 (1 3) 00", "1999-01-03T00:00/1999-01-03T01:00" );        
        doTestTimeParser1( "/gif/ac_$Y$j$H-$(Y;end)$j$H.gif", "/gif/ac_199733000-199733100.gif",  "1997-11-26T00:00Z/1997-11-27T00:00Z" );
    }
    
    /**
     * Use the spec, format the test time and verify that we get norm.
     * @param spec
     * @param test
     * @param norm
     * @throws Exception 
     */
    private void doTestTimeFormat1( String spec, String test, String norm ) throws Exception {
        URITemplate ut;
        try {
            ut = new URITemplate(spec);
        } catch ( IllegalArgumentException ex ) {
            System.out.println("### unable to parse spec: "+spec);
            return;
        }
        
        String[] nn= norm.split("/",-2);
        if ( iso8601DurationPattern.matcher(nn[1]).matches() ) {
            nn[1]= TimeUtil.isoTimeFromArray(
                    TimeUtil.add( TimeUtil.isoTimeToArray(nn[0]), 
                            TimeUtil.parseISO8601Duration(nn[1]) ) );
        }
        String res;
        try {
            res= ut.format( nn[0], nn[1], Collections.EMPTY_MAP );
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
        System.out.println("# testFormat");
        //testTimeParser1( "$Y$m$d-$(enum;values=a,b,c,d)", "20130202-a", "2013-02-02/2013-02-03" );
        doTestTimeFormat1( "$Y$m$d-$(Y;end)$m$d", "20130202-20140303", "2013-02-02/2014-03-03" );
        doTestTimeFormat1( "_$Y$m$(d)_$(Y;end)$m$(d)",                 "_20130202_20130203", "2013-02-02/2013-02-03" );
        doTestTimeFormat1( "_$Y$m$(d;shift=1)_$(Y;end)$m$(d;shift=1)", "_20130201_20130202", "2013-02-02/2013-02-03" );
        doTestTimeFormat1( "$Y$m$d-$(Y;end)$m$(d;shift=1)",            "20200101-20200107",  "2020-01-01T00:00Z/2020-01-08T00:00Z" );
        doTestTimeFormat1( "$Y$m$d-$(d;end)", "20130202-13", "2013-02-02/2013-02-13" );
        doTestTimeFormat1( "$(periodic;offset=0;start=2000-001;period=P1D)", "0",  "2000-001/P1D");
        doTestTimeFormat1( "$(periodic;offset=0;start=2000-001;period=P1D)", "20", "2000-021/P1D");        
        doTestTimeFormat1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "1", "1832-02-08/P27D");
        doTestTimeFormat1( "$(periodic;offset=2285;start=2000-346;period=P27D)", "2286", "2001-007/P27D");        
        doTestTimeFormat1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/PT12H");
        doTestTimeFormat1( "$(j;Y=2012).$H$M$S.$(subsec;places=3)", "017.020000.245", "2012-01-17T02:00:00.245/2012-01-17T02:00:00.246");
        doTestTimeFormat1( "$(j;Y=2012).$x.$X.$(ignore).$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeFormat1( "$(j;Y=2012).*.*.*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        // The following shows a bug where it doesn't consider the length of $H and just stops on the next period.
        // A field cannot contain the following delimiter.
        //testTimeFormat1( "$(j,Y=2012).*.$H", "017.x.y.z.02", "2012-01-17T02:00:00/2012-01-17T03:00:00");
        //testTimeFormat1( "$(o;id=rbspa-pp)", "31",  "2012-09-10T14:48:30.914Z/2012-09-10T23:47:34.973Z");
        doTestTimeFormat1( "$(j;Y=2012)$(hrinterval;names=01,02,03,04)", "01702", "2012-01-17T06:00/2012-01-17T18:00");
        doTestTimeFormat1( "$-1Y $-1m $-1d $H$M", "2012 3 30 1620", "2012-03-30T16:20/2012-03-30T16:21" );
        doTestTimeFormat1( "$Y",            "2012",     "2012-01-01T00:00/2013-01-01T00:00");
        doTestTimeFormat1( "$Y-$j",         "2012-017", "2012-01-17T00:00/2012-01-18T00:00");
        doTestTimeFormat1( "$(j,Y=2012)",   "017",      "2012-01-17T00:00/2012-01-18T00:00");
        doTestTimeFormat1( "ace_mag_$Y_$j_to_$(Y;end)_$j.cdf",   "ace_mag_2005_001_to_2005_003.cdf",      "2005-001T00:00/2005-003T00:00");        
        URITemplate ut = new URITemplate("$Y$m$d-$(Y;end)$m$d");
        ut.formatTimeRange( new int[] { 2013, 2, 2, 0, 0, 0, 0, 2014, 3, 3, 0, 0, 0, 0 }, Collections.emptyMap() );
        ut.formatStartStopRange( new int[] { 2013, 2, 2, 0, 0, 0, 0 }, new int[] { 2014, 3, 3, 0, 0, 0, 0 }, Collections.emptyMap() );
    }
    
    private static String readJSONToString( URL url ) {
        InputStream ins=null;
        try {
            ins = url.openStream();
            StringBuilder sb= new StringBuilder();
            byte[] buffer= new byte[2048];
            int bytesRead= ins.read(buffer);
            while ( bytesRead!=-1 ) {
                sb.append( new String(buffer,0,bytesRead) );
                bytesRead= ins.read(buffer);
            }
            return sb.toString();
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        
        } finally {
            try {
                if ( ins!=null ) ins.close();
            } catch (IOException ex) {
                Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }
    
    private void doTestFormatHapiServerSiteOne( 
            String[] outputs, String t, String startTime, String stopTime )
            throws ParseException, JSONException {
        
        String[] testOutputs= URITemplate.formatRange( t, startTime, stopTime );
        
        if ( testOutputs.length!=outputs.length) {
            fail("bad number of results in formatRange: "+t);
        }
        for ( int l=0; l<outputs.length; l++ ) {
            if ( !testOutputs[l].equals(outputs[l] ) ) {
                fail("result doesn't match, got "+testOutputs[l]+", should be "+outputs[l] );
            }
        }   
    }
    
    /**
     * for each timeRange and template in 
     * https://github.com/hapi-server/uri-templates/blob/master/formatting.json
     * enumerate the files (formatRange) to see that we get the correct result.
     */
    @Test 
    public void testFormatHapiServerSite() {
        try {
            System.out.println("# testFormatHapiServerSite");
            String ss= readJSONToString( new URL( "https://raw.githubusercontent.com/hapi-server/uri-templates/master/formatting.json" ) );
            //String ss= readJSONToString( new URL( "file:/home/jbf/ct/git/uri-templates/formatting.json" ) );
            JSONArray jo= new JSONArray(ss);
            for ( int i=0; i<jo.length(); i++ ) {
                JSONObject jo1= jo.getJSONObject(i);
                String id= jo1.getString("id");
                System.out.println( String.format("# %2d: %s %s", i, id, jo1.get("whatTests") ) );
                if ( i<3 ) {
                    System.out.println( "###  Skipping test "+i );
                    continue;
                }
                JSONArray templates= jo1.getJSONArray("template");
                JSONArray outputs= jo1.getJSONArray("output");
                String[] outputss= new String[outputs.length()];
                for ( int ii=0; ii<outputs.length(); ii++ ) {
                    outputss[ii]= outputs.getString(ii);
                }
                JSONArray timeRanges;
                try {
                    timeRanges = jo1.getJSONArray("timeRange");
                } catch ( JSONException ex ) {
                    String timeRange= jo1.getString("timeRange");
                    timeRanges= new JSONArray( Collections.singletonList(timeRange) );
                }
                for ( int j=0; j<templates.length(); j++ ) {
                    String t= templates.getString(j);
                    for ( int k=0; k<timeRanges.length(); k++ ) {
                        String timeRange= timeRanges.getString(k);
                        System.out.println("timeRange:"+timeRange);
                        String[] timeStartStop= timeRange.split("/",-2);
                        try {
                            doTestFormatHapiServerSiteOne( outputss, t, timeStartStop[0], timeStartStop[1] );
                        } catch (ParseException | AssertionError ex) {
                            fail(ex.getMessage());
                        }
                    }
                    System.out.println("" +t);
                }
                
            }
        } catch (JSONException | MalformedURLException ex) {
            Logger.getLogger(URITemplateTest.class.getName()).log(Level.SEVERE, null, ex);
            fail(ex.getMessage());
        }
        
    }
    
    @Test
    public void testFormatRange() {
        try { 
            System.out.println("# testFormatRange");
            String t;            
            String[] ss;

            t = "data_$Y.dat";
            ss = URITemplate.formatRange( t, "2001-03-22", "2004-08-18" );
            if ( ss.length!=4 ) {
                fail(t);
            }

            t= "http://emfisis.physics.uiowa.edu/Flight/rbsp-$(x,name=sc,enum=a|b)/L4/$Y/$m/$d/rbsp-$(x,name=sc,enum=a|b)_density_emfisis-L4_$Y$m$d_v$(v,sep).cdf";
            Map<String,String> extra= new HashMap<>();
            extra.put("SC","A");
            extra.put("sc","a");
            extra.put("v","1.5.15");
            ss = URITemplate.formatRange( t, "2017-07-01", "2017-07-04", extra );
                                    
//            t = "data_$Y_$(Y,end).dat";
//            ss = URITemplate.formatRange( t, "2001-03-22", "2004-08-18" );
//            if ( ss.length!=1 ) {
//                fail(t);
//            }
            
            for ( String s: ss ) {
                System.out.println(s);
            }
            
            String[] ff= URITemplate.formatRange( "$Y$m$(d,delta=10,phasestart=1979-01-01)", 
                    "1979-01-01", "1980-01-01" );
            for ( String f : ff ) {
                System.out.println(f);
            }
            
        } catch (ParseException ex) {
            fail(ex.getMessage());
        }
    }
    
    @Test
    public void testMakeQualifiersCanonical() {
        
        String x;
        
        x= "(x,name=sc,enum=a|b)";
        if ( !"(x;name=sc;enum=a|b)".equals(URITemplate.makeQualifiersCanonical(x) ) ) {
            fail(x);
        }
        
        x= "$(subsec,places=4)";
        if ( !"$(subsec;places=4)".equals(URITemplate.makeQualifiersCanonical(x) ) ) {
            fail(x);
        }
        //x= "$(enum,values=01,02,03,id=foo)";
        //if ( !"$(enum;values=01,02,03;id=foo)".equals( URITemplate.makeQualifiersCanonical(x) ) ) {
        //    fail(x);
        //}
        
        x= "$(hrinterval;names=01,02,03,04)";
        if ( !"$(hrinterval;names=01,02,03,04)".equals( URITemplate.makeQualifiersCanonical(x) ) ) {
            fail(x);
        }
        
        
        x= "$(d,delta=10,phasestart=1979-01-01)";
        if ( !"$(d;delta=10;phasestart=1979-01-01)".equals( URITemplate.makeQualifiersCanonical(x) ) ) {
            fail(x);
        }
        
    }
}

