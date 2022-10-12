
import re

# Utilities for times in IsoTime strings (limited set of ISO8601 times)
# Examples of isoTime strings include:<ul>
# <li>2020-04-21Z
# <li>2020-04-21T12:20Z
# <li>2020-04-21T23:45:67.000000001Z (nanosecond limit)
# <li>2020-112Z (day-of-year instead of $Y-$m-$d)
# <li>2020-112T23:45:67.000000001 (note Z is assumed)
# </ul>
#
# @author jbf
class TimeUtil:
    # Number of time components: year, month, day, hour, minute, second, nanosecond
    TIME_DIGITS=7

    # Number of components in time representation: year, month, day
    DATE_DIGITS=3

    # Number of components in a time range, which is two times.
    TIME_RANGE_DIGITS=14

    COMPONENT_YEAR=0

    COMPONENT_MONTH=1

    COMPONENT_DAY=2

    COMPONENT_HOUR=3

    COMPONENT_MINUTE=4

    COMPONENT_SECOND=5

    COMPONENT_NANOSECOND=6

    # Rewrite the time using the format of the example time, which must start with
    # $Y-$jT, $Y-$jZ, or $Y-$m-$d. For example,
    # <pre>
    # {@code
    # from org.hapiserver.TimeUtil import *
    # print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
    # }
    # </pre> This allows direct comparisons of times for sorting. 
    # This works by looking at the character in the 8th position (starting with zero) of the 
    # exampleForm to see if a T or Z is present (YYYY-jjjTxxx).
    #
    # TODO: there's
    # an optimization here, where if input and output are both $Y-$j or both
    # $Y-$m-$d, then we need not break apart and recombine the time
    # (isoTimeToArray call can be avoided).
    #
    # @param exampleForm isoTime string.
    # @param time the time in any allowed isoTime format
    # @return same time but in the same form as exampleForm.
    def reformatIsoTime(exampleForm, time):
        c = exampleForm[8]
        nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time))
        if c=='T':
            nn[2] = TimeUtil.dayOfYear(nn[0],nn[1],nn[2])
            nn[1] = 1
            time = "%d-%03dT%02d:%02d:%02d.%09dZ" % (nn[0],nn[2],nn[3],nn[4],nn[5],nn[6] )
        elif c=='Z':
            nn[2] = TimeUtil.dayOfYear(nn[0],nn[1],nn[2])
            nn[1] = 1
            time = "%d-%03dZ" % (nn[0],nn[2] )
        else:
            if len(exampleForm)==10:
                c = 'Z'
            else:
                c = exampleForm[10]

            if c=='T':
                time = "%d-%02d-%02dT%02d:%02d:%02d.%09dZ" % (nn[0],nn[1],nn[2],nn[3],nn[4],nn[5],nn[6] )
            elif c=='Z':
                time = "%d-%02d-%02dZ" % (nn[0],nn[1],nn[2] )


        if exampleForm.endswith('Z'):
            return time[0:len(exampleForm)-1]+'Z'
        else:
            return time[0:len(exampleForm)]

    reformatIsoTime = staticmethod(reformatIsoTime)    

    monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    # return the English month name, abbreviated to three letters, for the
    # month number.
    #
    # @param i month number, from 1 to 12.
    # @return the month name, like "Jan" or "Dec"
    def monthNameAbbrev(i):
        return TimeUtil.monthNames[i-1]
    monthNameAbbrev = staticmethod(monthNameAbbrev)    

    # return the month number for the English month name, such as "Jan" (1) or
    # "December" (12). The first three letters are used to look up the number,
    # and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    # "Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
    # @param s the name (case-insensitive, only the first three letters are used.)
    # @return the number, for example 1 for "January"
    # @throws ParseException when month name is not recognized.
    def monthNumber(s):
        if len(s)<3:
            raise Exception('need at least three letters')

        s = s[0:3]
        i = 0
        while i<12:
            if s.lower()==TimeUtil.monthNames[i].lower():
                return i+1

            i=i+1

        raise Exception('Unable to parse month')
    monthNumber = staticmethod(monthNumber)    

    def __init__(self):
        pass

    # the number of days in each month.  DAYS_IN_MONTH[0][12] is number of days in December of a non-leap year
    DAYS_IN_MONTH=[[0,31,28,31,30,31,30,31,31,30,31,30,31,0],[0,31,29,31,30,31,30,31,31,30,31,30,31,0]]

    # the number of days to the first of each month.  DAY_OFFSET[0][12] is offset to December 1st of a non-leap year
    DAY_OFFSET=[[0,0,31,59,90,120,151,181,212,243,273,304,334,365],[0,0,31,60,91,121,152,182,213,244,274,305,335,366]]

    # count off the days between startTime and stopTime, but not including
    # stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
    # will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
    #
    # @param startTime an iso time string
    # @param stopTime an iso time string
    # @return array of times, complete days, in the form $Y-$m-$d
    def countOffDays(startTime, stopTime):
        if len(stopTime)<10 or stopTime[10].isdigit():
            raise Exception('arguments must be $Y-$m-$dZ')

        try:
            t1 = TimeUtil.parseISO8601Time(startTime)
            t2 = TimeUtil.parseISO8601Time(stopTime)
        except ParseException:
            raise Exception(ex)

        j1 = TimeUtil.julianDay(t1[0],t1[1],t1[2])
        j2 = TimeUtil.julianDay(t2[0],t2[1],t2[2])
        result = [0] * j2-j1
        time = TimeUtil.normalizeTimeString(startTime)[0:10]+'Z'
        stopTime = TimeUtil.floor(stopTime)[0:10]+'Z'
        i = 0
        nn = TimeUtil.isoTimeToArray(time)
        while time<stopTime:
            result[i] = time
            nn[2] = nn[2]+1
            if nn[2]>28: TimeUtil.normalizeTime(nn)

            time = "%04d-%02d-%02dZ" % (nn[0],nn[1],nn[2] )
            i=i+1

        return result
    countOffDays = staticmethod(countOffDays)    

    # true if the year between 1582 and 2400 is a leap year.
    # @param year the year
    # @return true if the year between 1582 and 2400 is a leap year.
    def isLeapYear(year):
        if year<1582 or year>2400:
            raise Exception('year must be between 1582 and 2400')

        return (year%4)==0 and (year%400==0 or year%100!=0)
    isLeapYear = staticmethod(isLeapYear)    

    # return the next day boundary. Note hours, minutes, seconds and
    # nanoseconds are ignored.
    #
    # @param day any isoTime format string.
    # @return the next day in $Y-$m-$dZ
    # @see #ceil(java.lang.String)
    # @see #previousDay(java.lang.String)
    def nextDay(day):
        nn = TimeUtil.isoTimeToArray(day)
        nn[2] = nn[2]+1
        TimeUtil.normalizeTime(nn)
        return "%04d-%02d-%02dZ" % (nn[0],nn[1],nn[2] )
    nextDay = staticmethod(nextDay)    

    # return the previous day boundary. Note hours, minutes, seconds and
    # nanoseconds are ignored.
    #
    # @param day any isoTime format string.
    # @return the next day in $Y-$m-$dZ
    # @see #floor(java.lang.String)
    # @see #nextDay(java.lang.String)
    def previousDay(day):
        nn = TimeUtil.isoTimeToArray(day)
        nn[2] = nn[2]-1
        TimeUtil.normalizeTime(nn)
        return "%04d-%02d-%02dZ" % (nn[0],nn[1],nn[2] )
    previousDay = staticmethod(previousDay)    

    # return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
    # value (normalized) if we are already at a boundary.
    #
    # @param time any isoTime format string.
    # @return the next midnight or the value if already at midnight.
    def ceil(time):
        time = TimeUtil.normalizeTimeString(time)
        if time[11:]=='00:00:00.000000000Z':
            return time
        else:
            return TimeUtil.nextDay(time[0:11])[0:10]+'T00:00:00.000000000Z'

    ceil = staticmethod(ceil)    

    # return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
    # value (normalized) if we are already at a boundary.
    #
    # @param time any isoTime format string.
    # @return the previous midnight or the value if already at midnight.
    def floor(time):
        time = TimeUtil.normalizeTimeString(time)
        if time[11:]=='00:00:00.000000000Z':
            return time
        else:
            return time[0:10]+'T00:00:00.000000000Z'

    floor = staticmethod(floor)    

    # return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
    #
    # @param time any isoTime format string.
    # @return the time in standard form.
    def normalizeTimeString(time):
        nn = TimeUtil.isoTimeToArray(time)
        TimeUtil.normalizeTime(nn)
        return "%d-%02d-%02dT%02d:%02d:%02d.%09dZ" % (nn[0],nn[1],nn[2],nn[3],nn[4],nn[5],nn[6] )
    normalizeTimeString = staticmethod(normalizeTimeString)    

    # fast parser requires that each character of string is a digit.  Note this 
    # does not check the the numbers are digits!
    #
    # @param s string containing an integer
    # @return the integer
    def parseInt(s):
        llen446 = len(s)
        i = 0
        while i<llen446:
            c = s[i]
            if ord(c)<48 or ord(c)>=58:
                raise Exception('only digits are allowed in string')

            i=i+1

        if llen446==2:
            result = 10*(ord(s[0])-48)+(ord(s[1])-48)
            return result
        elif llen446==3:
            result = 100*(ord(s[0])-48)+10*(ord(s[1])-48)+(ord(s[2])-48)
            return result
        else:
            result = 0
            i = 0
            while i<len(s):
                result = 10*result+(ord(s[i])-48)
                i=i+1

            return result

    parseInt = staticmethod(parseInt)    

    # fast parser requires that each character of string is a digit.
    #
    # @param s the number, containing 1 or more digits.
    # @return the int value
    def parseIntDeft(s, deft):
        if s==None:
            return deft

        return TimeUtil.parseInt(s)
    parseIntDeft = staticmethod(parseIntDeft)    

    def parseDouble(val, deft):
        if val==None:
            if deft!=-99:
                return deft
            else:
                raise Exception('bad digit')


        n = len(val)-1
        if val[n].isalpha():
            return float(val.substring(0, n))
        else:
            return float(val)

    parseDouble = staticmethod(parseDouble)    

    # return the array formatted as ISO8601 time, formatted to nanoseconds.
    # For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
    # formatted to "1999-12-31T23:00:00.000000000Z";
    # @param nn the decomposed time
    # @return the formatted time.
    # @see #isoTimeToArray(java.lang.String)
    def isoTimeFromArray(nn):
        if nn[1]==1 and nn[2]>31:
            month = TimeUtil.monthForDayOfYear(nn[0],nn[2])
            dom1 = TimeUtil.dayOfYear(nn[0],month,1)
            nn[2] = nn[2]-dom1+1
            nn[1] = month

        return "%04d-%02d-%02dT%02d:%02d:%02d.%09dZ" % (nn[0],nn[1],nn[2],nn[3],nn[4],nn[5],nn[6] )
    isoTimeFromArray = staticmethod(isoTimeFromArray)    

    # format the time range components into iso8601 time range.  
    # @param nn 14-element time range
    # @return efficient representation of the time range
    def formatIso8601TimeRange(nn):
        ss1 = TimeUtil.formatIso8601TimeInTimeRange(nn,0)
        ss2 = TimeUtil.formatIso8601TimeInTimeRange(nn,TimeUtil.TIME_DIGITS)
        firstNonZeroDigit = 7
        while firstNonZeroDigit>3 and nn[firstNonZeroDigit-1]==0 and nn[firstNonZeroDigit+TimeUtil.TIME_DIGITS-1]==0:
            firstNonZeroDigit=firstNonZeroDigit-1

        if firstNonZeroDigit==2:
            return ss1[0:10]+'/'+ss2[0:10]
        elif firstNonZeroDigit==3:
            return ss1[0:10]+'/'+ss2[0:10]
        elif firstNonZeroDigit==4:
            return ss1[0:16]+'Z/'+ss2[0:16]+'Z'
        elif firstNonZeroDigit==5:
            return ss1[0:16]+'Z/'+ss2[0:16]+'Z'
        elif firstNonZeroDigit==6:
            return ss1[0:19]+'Z/'+ss2[0:19]+'Z'
        else:
            return ss1+'/'+ss2

    formatIso8601TimeRange = staticmethod(formatIso8601TimeRange)    

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @param offset the offset into the time array (7 for stop time in 14-element range array).
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeBrief(int[]) 
    # @deprecated see formatIso8601TimeInTimeRangeBrief
    def formatIso8601Time(time, offset):
        return TimeUtil.formatIso8601TimeInTimeRange(time,offset)
    formatIso8601Time = staticmethod(formatIso8601Time)    

    # return the string as a formatted string, which can be at an offset of seven positions 
    # to format the end date.
    # @param nn fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
    # @param offset 0 or 7 
    # @return formatted time "1999-12-31T23:00:00.000000000Z"
    # @see #isoTimeFromArray(int[]) 
    def formatIso8601TimeInTimeRange(nn, offset):
        if offset==0:
            return TimeUtil.isoTimeFromArray(nn)
        elif offset==7:
            copy = TimeUtil.getStopTime(nn)
            return TimeUtil.isoTimeFromArray(copy)
        else:
            raise Exception('offset must be 0 or 7')

    formatIso8601TimeInTimeRange = staticmethod(formatIso8601TimeInTimeRange)    

    # return the string as a formatted string.
    # @param nn seven-element array of [ Y m d H M S nanos ]
    # @return formatted time "1999-12-31T23:00:00.000000000Z"
    # @see #isoTimeFromArray(int[]) 
    def formatIso8601Time(nn):
        return TimeUtil.isoTimeFromArray(nn)
    formatIso8601Time = staticmethod(formatIso8601Time)    

    # format the duration into human-readable time, for example
    # [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
    # @param nn seven-element array of [ Y m d H M S nanos ]
    # @return ISO8601 duration
    def formatIso8601Duration(nn):
        units = [ 'Y','M','D','H','M','S' ]
        if len(nn)>7: raise Exception('decomposed time can have at most 7 digits')

        sb = 'P'
        if (len(nn)<5):
            n = len(nn)
        else:
            n = 5

        needT = False
        i = 0
        while i<n:
            if i==3: needT = True

            if nn[i]>0:
                if needT:
                    sb+= 'T'
                    needT = False

                sb+= str(nn[i]) + str(units[i])

            i=i+1

        if len(nn)>5 and nn[5]>0 or len(nn)>6 and nn[6]>0 or len(sb)==2:
            if needT:
                sb+= 'T'

            seconds = nn[5]
            if len(nn)==7:
                nanoseconds = nn[6]
            else:
                nanoseconds = 0

            if nanoseconds==0:
                sb+= str(seconds)
            elif nanoseconds%1000000==0:
                sb+= str("%.3f" % (seconds+nanoseconds/1e9 ))
            elif nanoseconds%1000==0:
                sb+= str("%.6f" % (seconds+nanoseconds/1e9 ))
            else:
                sb+= str("%.9f" % (seconds+nanoseconds/1e9 ))

            sb+= 'S'

        if len(sb)==1:
            if len(nn)>3:
                sb+= 'T0S'
            else:
                sb+= '0D'


        return sb
    formatIso8601Duration = staticmethod(formatIso8601Duration)    

    # return the UTC current time, to the millisecond, in seven components.
    # @return the current time, to the millisecond
    def now():
        import datetime
        dt=datetime.datetime.utcnow()
        return [ dt.year, dt.month,dt.day, dt.hour, dt.minute, dt.second, dt.microsecond*1000 ]
    now = staticmethod(now)    

    # return seven-element array [ year, months, days, hours, minutes, seconds, nanoseconds ]
    # preserving the day of year notation if this was used. See the class
    # documentation for allowed time formats, which are a subset of ISO8601
    # times.  This also supports "now", "now-P1D", and other simple extensions.  Note
    # ISO8601-1:2019 disallows 24:00 to be used for the time, but this is still allowed here.
    # The following are valid inputs:<ul>
    # <li>2021
    # <li>2020-01-01
    # <li>2020-01-01Z
    # <li>2020-01-01T00Z
    # <li>2020-01-01T00:00Z
    # <li>2022-W08
    # <li>now
    # <li>now-P1D
    # <li>lastday-P1D
    # <li>lasthour-PT1H
    # </ul>
    #
    # @param time isoTime to decompose
    # @return the decomposed time
    # @throws IllegalArgumentException when the time cannot be parsed.
    # @see #isoTimeFromArray(int[])
    # @see #parseISO8601Time(java.lang.String) 
    def isoTimeToArray(time):
        if len(time)==4:
            result = [ int(time),1,1,0,0,0,0 ]
        elif time.startswith('now') or time.startswith('last'):
            if time.startswith('now'):
                n = TimeUtil.now()
                remainder = time[3:]
            else:
                p = re.compile('last([a-z]+)([\\+|\\-]P.*)?')
                m = p.match(time)
                if m!=None:
                    n = TimeUtil.now()
                    unit = m.group(1)
                    remainder = m.group(2)
                    if unit=="year":
                        idigit = 1
                    elif unit=="month":
                        idigit = 2
                    elif unit=="day":
                        idigit = 3
                    elif unit=="hour":
                        idigit = 4
                    elif unit=="minute":
                        idigit = 5
                    elif unit=="second":
                        idigit = 6
                    else:
                        raise Exception('unsupported unit: '+unit)

                    id = max(1,idigit)
                    while id<TimeUtil.DATE_DIGITS:
                        n[id] = 1
                        id=id+1

                    id = max(TimeUtil.DATE_DIGITS,idigit)
                    while id<TimeUtil.TIME_DIGITS:
                        n[id] = 0
                        id=id+1

                else:
                    raise Exception('expected lastday+P1D, etc')


            if remainder==None or len(remainder)==0:
                return n
            elif remainder[0]=='-':
                return TimeUtil.subtract(n,TimeUtil.parseISO8601Duration(remainder[1:]))

            elif remainder[0]=='+':
                return TimeUtil.add(n,TimeUtil.parseISO8601Duration(remainder[1:]))

            return TimeUtil.now()
        else:
            if len(time)<7:
                raise Exception('time must have 4 or greater than 7 elements')

            if len(time)==7:
                if time[4]=='W':
                    year = TimeUtil.parseInt(time[0:4])
                    week = TimeUtil.parseInt(time[5:])
                    result = [ year,0,0,0,0,0,0 ]
                    TimeUtil.fromWeekOfYear(year,week,result)
                    time = ''
                else:
                    result = [ TimeUtil.parseInt(time[0:4]),TimeUtil.parseInt(time[5:7]),1,0,0,0,0 ]
                    time = ''

            elif len(time)==8:
                if time[5]=='W':
                    year = TimeUtil.parseInt(time[0:4])
                    week = TimeUtil.parseInt(time[6:])
                    result = [ year,0,0,0,0,0,0 ]
                    TimeUtil.fromWeekOfYear(year,week,result)
                    time = ''
                else:
                    result = [ TimeUtil.parseInt(time[0:4]),1,TimeUtil.parseInt(time[5:8]),0,0,0,0 ]
                    time = ''

            elif time[8]=='T':
                result = [ TimeUtil.parseInt(time[0:4]),1,TimeUtil.parseInt(time[5:8]),0,0,0,0 ]
                time = time[9:]
            elif time[8]=='Z':
                result = [ TimeUtil.parseInt(time[0:4]),1,TimeUtil.parseInt(time[5:8]),0,0,0,0 ]
                time = time[9:]
            else:
                result = [ TimeUtil.parseInt(time[0:4]),TimeUtil.parseInt(time[5:7]),TimeUtil.parseInt(time[8:10]),0,0,0,0 ]
                if len(time)==10:
                    time = ''
                else:
                    time = time[11:]


            if time.endswith('Z'):
                time = time[0:len(time)-1]

            if len(time)>=2:
                result[3] = TimeUtil.parseInt(time[0:2])

            if len(time)>=5:
                result[4] = TimeUtil.parseInt(time[3:5])

            if len(time)>=8:
                result[5] = TimeUtil.parseInt(time[6:8])

            if len(time)>9:
                result[6] = int((10**(18-len(time))))*TimeUtil.parseInt(time[9:])

            TimeUtil.normalizeTime(result)

        return result
    isoTimeToArray = staticmethod(isoTimeToArray)    

    # return the day of year for the given year, month, and day. For example, in
    # Jython:
    # <pre>
    # {@code
    # from org.hapiserver.TimeUtil import *
    # print dayOfYear( 2020, 4, 21 ) # 112
    # }
    # </pre>
    #
    # @param year the year
    # @param month the month, from 1 to 12.
    # @param day the day in the month.
    # @return the day of year.
    def dayOfYear(year, month, day):
        if month==1:
            return day

        if month<1:
            raise Exception('month must be greater than 0.')

        if month>12:
            raise Exception('month must be less than 12.')

        if day>366:
            raise Exception('day ('+day+') must be less than 366.')

        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0

        return TimeUtil.DAY_OFFSET[leap][month]+day
    dayOfYear = staticmethod(dayOfYear)    

    # return "2" (February) for 45 for example.
    # @param year the year
    # @param doy the day of year.
    # @return the month 1-12 of the day.
    def monthForDayOfYear(year, doy):
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0

        dayOffset = TimeUtil.DAY_OFFSET[leap]
        if doy<1: raise Exception('doy must be 1 or more')

        if doy>dayOffset[13]:
            raise Exception('doy must be less than or equal to '+dayOffset[13])

        i = 12
        while i>1:
            if dayOffset[i]<doy:
                return i

            i=i-1

        return 1
    monthForDayOfYear = staticmethod(monthForDayOfYear)    

    # return the time as milliseconds since 1970-01-01T00:00Z. This does not
    # include leap seconds. For example, in Jython:
    # <pre>
    # {@code
    # from org.hapiserver.TimeUtil import *
    # x= toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
    # print x / 86400000   # 10958.0 days
    # print x % 86400000   # and no milliseconds
    # }
    # </pre>
    #
    # @param time the isoTime, which is parsed using
    # DateTimeFormatter.ISO_INSTANT.parse.
    # @return number of non-leap-second milliseconds since 1970-01-01T00:00Z.
    # @see DateTimeFormatter#parse
    def toMillisecondsSince1970(time):
        time = TimeUtil.isoTimeToArray(time);
        import datetime
        datetim= datetime.datetime(time[0],time[1],time[2],0,0,0,0)
        dayspast= datetim.toordinal() - datetime.datetime(1970,1,1).toordinal()
        return dayspast * 86400000 + time[3]*3600000 + time[4]*60000 + time[5]*1000 + time[6]/1000
    toMillisecondsSince1970 = staticmethod(toMillisecondsSince1970)    

    VALID_FIRST_YEAR=1900

    VALID_LAST_YEAR=2100

    # this returns true or throws an IllegalArgumentException indicating the problem.
    # @param time the seven-component time.
    # @return true or throws an IllegalArgumentException
    def isValidTime(time):
        year = time[0]
        if year<TimeUtil.VALID_FIRST_YEAR: raise Exception('invalid year at position 0')

        if year>TimeUtil.VALID_LAST_YEAR: raise Exception('invalid year at position 0')

        month = time[1]
        if month<1: raise Exception('invalid month at position 1')

        if month>12: raise Exception('invalid month at position 1')

        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0

        dayOfMonth = time[2]
        if month>1:
            if dayOfMonth>TimeUtil.DAYS_IN_MONTH[leap][month]:
                raise Exception('day of month is too large at position 2')

        else:
            if dayOfMonth>TimeUtil.DAY_OFFSET[leap][13]:
                raise Exception('day of year is too large at position 2')


        if dayOfMonth<1: raise Exception('day is less than 1 at position 2')

        return True
    isValidTime = staticmethod(isValidTime)    

    # return the number of days in the month.
    # @param year the year 
    # @param month the month
    # @return the number of days in the month.
    # @see #isLeapYear(int) 
    def daysInMonth(year, month):
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0

        return TimeUtil.DAYS_IN_MONTH[leap][month]
    daysInMonth = staticmethod(daysInMonth)    

    # normalize the decomposed (seven digit) time by expressing day of year and month and day
    # of month, and moving hour="24" into the next day. This also handles day
    # increment or decrements, by:<ul>
    # <li>handle day=0 by decrementing month and adding the days in the new
    # month.
    # <li>handle day=32 by incrementing month.
    # <li>handle negative components by borrowing from the next significant.
    # </ul>
    # Note that [Y,1,dayOfYear,...] is accepted, but the result will be Y,m,d.
    # @param time the seven-component time Y,m,d,H,M,S,nanoseconds
    def normalizeTime(time):
        while time[6]>100000000:
            time[5] = time[5]+1
            time[6] -= 100000000

        while time[5]>59:
            time[4] = time[4]+1
            time[5] -= 60

        while time[4]>59:
            time[3] = time[3]+1
            time[4] -= 60

        while time[3]>=24:
            time[2] += 1
            time[3] -= 24

        if time[6]<0:
            time[5] -= 1
            time[6] += 1000000000

        if time[5]<0:
            time[4] -= 1
            time[5] += 60

        if time[4]<0:
            time[3] -= 1
            time[4] += 60

        if time[3]<0:
            time[2] -= 1
            time[3] += 24

        if time[2]<1:
            time[1] -= 1
            if time[1]==0:
                daysInMonth = 31
            else:
                if TimeUtil.isLeapYear(time[0]):
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[1][time[1]]
                else:
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[0][time[1]]


            time[2] += daysInMonth

        if time[1]<1:
            time[0] -= 1
            time[1] += time[1]+12

        if time[3]>24:
            raise Exception('time[3] is greater than 24 (hours)')

        if time[1]>12:
            time[0] = time[0]+1
            time[1] = time[1]-12

        if time[1]==12 and time[2]>31 and time[2]<62:
            time[0] = time[0]+1
            time[1] = 1
            time[2] = time[2]-31
            return

        if TimeUtil.isLeapYear(time[0]):
            leap = 1
        else:
            leap = 0

        if time[2]==0:
            time[1] = time[1]-1
            if time[1]==0:
                time[0] = time[0]-1
                time[1] = 12

            time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]]

        d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
        while time[2]>d:
            time[1]=time[1]+1
            time[2] -= d
            d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
            if time[1]>12:
                raise Exception('time[2] is too big')


    normalizeTime = staticmethod(normalizeTime)    

    # calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
    # 2022-03-12 is a Saturday, so 5 is returned.
    # @param year the year
    # @param month the month
    # @param day the day of the month
    # @return the day of the week.
    def dayOfWeek(year, month, day):
        jd = TimeUtil.julianDay(year,month,day)
        daysSince2022 = jd-TimeUtil.julianDay(2022,1,1)
        mod7 = (daysSince2022-2)%7
        if mod7<0: mod7 = mod7+7

        return mod7
    dayOfWeek = staticmethod(dayOfWeek)    

    # calculate the week of year, inserting the month into time[1] and day into time[2]
    # for the Monday which is the first day of that week.  Note week 0 is excluded from
    # ISO8601, but since the Linux date command returns this in some cases, it is allowed to
    # mean the same as week 52 of the previous year.  See 
    # <a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
    # 
    # @param year the year of the week.
    # @param weekOfYear the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
    # @param time the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
    def fromWeekOfYear(year, weekOfYear, time):
        time[0] = year
        day = TimeUtil.dayOfWeek(year,1,1)
        if day<4:
            doy = (weekOfYear*7-7-day)+1
            if doy<1:
                time[0] = time[0]-1
                if TimeUtil.isLeapYear(time[0]):
                    doy = doy+366
                else:
                    doy = doy+365


        else:
            doy = weekOfYear*7-day+1

        time[1] = 1
        time[2] = doy
        TimeUtil.normalizeTime(time)
    fromWeekOfYear = staticmethod(fromWeekOfYear)    

    iso8601duration='P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?'

    # Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
    iso8601DurationPattern=re.compile('P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d?\\.?\\d+)S)?)?')

    # returns a 7 element array with [year,mon,day,hour,min,sec,nanos]. Note
    # this does not allow fractional day, hours or minutes! Examples
    # include:<ul>
    # <li>P1D - one day
    # <li>PT1M - one minute
    # <li>PT0.5S - 0.5 seconds
    # </ul>
    # TODO: there exists more complete code elsewhere.
    #
    # @param stringIn theISO8601 duration.
    # @return 7-element array with [year,mon,day,hour,min,sec,nanos]
    # @throws ParseException if the string does not appear to be valid.
    # @see #iso8601duration
    # @see #TIME_DIGITS
    #
    def parseISO8601Duration(stringIn):
        m = TimeUtil.iso8601DurationPattern.match(stringIn)
        if m!=None:
            dsec = TimeUtil.parseDouble(m.group(13),0)
            sec = int(dsec)
            nanosec = int(((dsec-sec)*1e9))
            return [ TimeUtil.parseIntDeft(m.group(2),0),TimeUtil.parseIntDeft(m.group(4),0),TimeUtil.parseIntDeft(m.group(6),0),TimeUtil.parseIntDeft(m.group(9),0),TimeUtil.parseIntDeft(m.group(11),0),sec,nanosec ]
        else:
            if 'P' in stringIn and 'S' in stringIn and not 'T' in stringIn:
                raise Exception('ISO8601 duration expected but not found.  Was the T missing before S?')
            else:
                raise Exception('ISO8601 duration expected but not found.')


    parseISO8601Duration = staticmethod(parseISO8601Duration)    

    # use consistent naming so that the parser is easier to find.
    # @param string iso8601 time like "2022-03-12T11:17" (Z is assumed).
    # @return seven-element decomposed time [ Y, m, d, H, M, S, N ]
    # @throws ParseException when the string cannot be parsed.
    # @see #isoTimeToArray(java.lang.String) 
    def parseISO8601Time(string):
        return TimeUtil.isoTimeToArray(string)
    parseISO8601Time = staticmethod(parseISO8601Time)    

    # parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
    # start and stop times, returned in a 14 element array of ints.
    # @param stringIn string to parse, like "1998-01-02/1998-01-17"
    # @return the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
    # @throws ParseException when the string cannot be used
    def parseISO8601TimeRange(stringIn):
        ss = stringIn.split('/')
        if len(ss)!=2:
            raise Exception('expected one slash (/) splitting start and stop times.')

        if len(ss[0])==0 or not (ss[0][0].isdigit() or ss[0][0]=='P' or ss[0].startswith('now')):
            raise Exception('first time/duration is misformatted.  Should be ISO8601 time or duration like P1D.')

        if len(ss[1])==0 or not (ss[1][0].isdigit() or ss[1][0]=='P' or ss[1].startswith('now')):
            raise Exception('second time/duration is misformatted.  Should be ISO8601 time or duration like P1D.')

        result = [0] * 14
        if ss[0].startswith('P'):
            duration = TimeUtil.parseISO8601Duration(ss[0])
            time = TimeUtil.isoTimeToArray(ss[1])
            i = 0
            while i<TimeUtil.TIME_DIGITS:
                result[i] = time[i]-duration[i]
                i=i+1

            TimeUtil.normalizeTime(result)
            TimeUtil.setStopTime(time,result)
            return result
        elif ss[1].startswith('P'):
            time = TimeUtil.isoTimeToArray(ss[0])
            duration = TimeUtil.parseISO8601Duration(ss[1])
            TimeUtil.setStartTime(time,result)
            stoptime = [0] * TimeUtil.TIME_DIGITS
            i = 0
            while i<TimeUtil.TIME_DIGITS:
                stoptime[i] = time[i]+duration[i]
                i=i+1

            TimeUtil.normalizeTime(stoptime)
            TimeUtil.setStopTime(stoptime,result)
            return result
        else:
            starttime = TimeUtil.isoTimeToArray(ss[0])
            stoptime = TimeUtil.isoTimeToArray(ss[1])
            TimeUtil.setStartTime(starttime,result)
            TimeUtil.setStopTime(stoptime,result)
            return result

    parseISO8601TimeRange = staticmethod(parseISO8601TimeRange)    

    # return the julianDay for the year month and day. This was verified
    # against another calculation (julianDayWP, commented out above) from
    # http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
    # operations.
    #
    # @param year calendar year greater than 1582.
    # @param month the month number 1 through 12.
    # @param day day of month. For day of year, use month=1 and doy for day.
    # @return the Julian day
    # @see #fromJulianDay(int) 
    def julianDay(year, month, day):
        if year<=1582:
            raise Exception('year must be more than 1582')

        jd = 367*year-7*(year+(month+9)/12)/4-3*((year+(month-9)/7)/100+1)/4+275*month/9+day+1721029
        return jd
    julianDay = staticmethod(julianDay)    

    # Break the Julian day apart into month, day year. This is based on
    # http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
    # introduced when toTimeStruct failed when the year was 1886.
    #
    # @see #julianDay( int year, int mon, int day )
    # @param julian the (integer) number of days that have elapsed since the
    # initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
    # @return a TimeStruct with the month, day and year fields set.
    def fromJulianDay(julian):
        j = julian+32044
        g = j/146097
        dg = j%146097
        c = (dg/36524+1)*3/4
        dc = dg-c*36524
        b = dc/1461
        db = dc%1461
        a = (db/365+1)*3/4
        da = db-a*365
        y = g*400+c*100+b*4+a
        m = (da*5+308)/153-2
        d = da-(m+4)*153/5+122
        Y = y-4800+(m+2)/12
        M = (m+2)%12+1
        D = d+1
        result = [0] * TimeUtil.TIME_DIGITS
        result[0] = Y
        result[1] = M
        result[2] = D
        return result
    fromJulianDay = staticmethod(fromJulianDay)    

    # subtract the offset from the base time.
    #
    # @param base a time
    # @param offset offset in each component.
    # @return a time
    def subtract(base, offset):
        result = [0] * TimeUtil.TIME_DIGITS
        i = 0
        while i<TimeUtil.TIME_DIGITS:
            result[i] = base[i]-offset[i]
            i=i+1

        if result[0]>400:
            TimeUtil.normalizeTime(result)

        return result
    subtract = staticmethod(subtract)    

    # add the offset to the base time. This should not be used to combine two
    # offsets, because the code has not been verified for this use.
    #
    # @param base a time
    # @param offset offset in each component.
    # @return a time
    def add(base, offset):
        result = [0] * TimeUtil.TIME_DIGITS
        i = 0
        while i<TimeUtil.TIME_DIGITS:
            result[i] = base[i]+offset[i]
            i=i+1

        TimeUtil.normalizeTime(result)
        return result
    add = staticmethod(add)    

    # true if t1 is after t2.
    # @param t1 seven-component time
    # @param t2 seven-component time
    # @return true if t1 is after t2.
    def gt(t1, t2):
        TimeUtil.normalizeTime(t1)
        TimeUtil.normalizeTime(t2)
        i = 0
        while i<TimeUtil.TIME_DIGITS:
            if t1[i]>t2[i]:
                return True
            elif t1[i]<t2[i]:
                return False

            i=i+1

        return False
    gt = staticmethod(gt)    

    # true if t1 is equal to t2.
    # @param t1 seven-component time
    # @param t2 seven-component time
    # @return true if t1 is equal to t2.
    def eq(t1, t2):
        TimeUtil.normalizeTime(t1)
        TimeUtil.normalizeTime(t2)
        i = 0
        while i<TimeUtil.TIME_DIGITS:
            if t1[i]!=t2[i]:
                return False

            i=i+1

        return True
    eq = staticmethod(eq)    

    # given the two times, return a 14 element time range.
    # @param t1 a seven digit time
    # @param t2 a seven digit time after the first time.
    # @return a fourteen digit time range.
    # @throws IllegalArgumentException when the first time is greater than or equal to the second time.
    def createTimeRange(t1, t2):
        if not TimeUtil.gt(t2,t1):
            raise Exception('t1 is not smaller than t2')

        result = [0] * TimeUtil.TIME_DIGITS*2
        TimeUtil.setStartTime(result,t1)
        TimeUtil.setStopTime(result,t2)
        return result
    createTimeRange = staticmethod(createTimeRange)    

    # return the seven element start time from the time range.  Note
    # it is fine to use a time range as the start time, because codes
    # will only read the first seven components, and this is only added
    # to make code more readable.
    # @param range a fourteen-element time range.
    # @return the start time.
    def getStartTime(range):
        result = [0] * TimeUtil.TIME_DIGITS
        result[0:TimeUtil.TIME_DIGITS]=range[0:TimeUtil.TIME_DIGITS]
        return result
    getStartTime = staticmethod(getStartTime)    

    # return the seven element stop time from the time range.  Note
    # it is fine to use a time range as the start time, because codes
    # will only read the first seven components.
    # @param range a fourteen-element time range.
    # @return the stop time.
    def getStopTime(range):
        result = [0] * TimeUtil.TIME_DIGITS
        result[0:TimeUtil.TIME_DIGITS]=range[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS]
        return result
    getStopTime = staticmethod(getStopTime)    

    # copy the components of time into the start position (indeces 7-14) of the time range.
    # This one-line method was introduced to clarify code and make conversion to 
    # other languages (in particular Python) easier.
    # @param time the seven-element start time
    # @param range the fourteen-element time range.
    def setStartTime(time, range):
        range[0:TimeUtil.TIME_DIGITS]=time[0:TimeUtil.TIME_DIGITS]
    setStartTime = staticmethod(setStartTime)    

    # copy the components of time into the stop position (indeces 7-14) of the time range.
    # @param time the seven-element stop time
    # @param range the fourteen-element time range.
    def setStopTime(time, range):
        range[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS]=time[0:TimeUtil.TIME_DIGITS]
    setStopTime = staticmethod(setStopTime)    

    # format the time as milliseconds since 1970-01-01T00:00Z into a string.  The
    # number of milliseconds should not include leap seconds.
    # 
    # @param time the number of milliseconds since 1970-01-01T00:00Z
    # @return the formatted time.
    # @see DateTimeFormatter#parse
    def fromMillisecondsSince1970(time):
        return DateTimeFormatter.ISO_INSTANT.format(Instant.ofEpochMilli(time))
    fromMillisecondsSince1970 = staticmethod(fromMillisecondsSince1970)    

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) 
    def formatIso8601TimeBrief(time):
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time,0)
    formatIso8601TimeBrief = staticmethod(formatIso8601TimeBrief)    

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @param offset the offset into the time array (7 for stop time in 14-element range array).
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeBrief(int[]) 
    # @deprecated see formatIso8601TimeInTimeRangeBrief
    def formatIso8601TimeBrief(time, offset):
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time,offset)
    formatIso8601TimeBrief = staticmethod(formatIso8601TimeBrief)    

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @param offset the offset into the time array (7 for stop time in 14-element range array).
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeBrief(int[]) 
    def formatIso8601TimeInTimeRangeBrief(time, offset):
        stime = TimeUtil.formatIso8601TimeInTimeRange(time,offset)
        nanos = time[TimeUtil.COMPONENT_NANOSECOND+offset]
        micros = nanos%1000
        millis = nanos%10000000
        if nanos==0:
            if time[5+offset]==0:
                return stime[0:16]+'Z'
            else:
                return stime[0:19]+'Z'

        else:
            if millis==0:
                return stime[0:23]+'Z'
            elif micros==0:
                return stime[0:26]+'Z'
            else:
                return stime


    formatIso8601TimeInTimeRangeBrief = staticmethod(formatIso8601TimeInTimeRangeBrief)    

    # return the next interval, given the 14-component time interval.  This
    # has the restrictions:<ul>
    # <li> can only handle intervals of at least one second
    # <li> must be only one component which increments
    # <li> increment must be a devisor of the increment, so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
    # </ul>
    # @param range 14-component time interval.
    # @return 14-component time interval.
    def nextRange(range):
        result = [0] * TimeUtil.TIME_RANGE_DIGITS
        width = [0] * TimeUtil.TIME_DIGITS
        i = 0
        while i<TimeUtil.TIME_DIGITS:
            width[i] = range[i+TimeUtil.TIME_DIGITS]-range[i]
            i=i+1

        if width[5]<0:
            width[5] = width[5]+60
            width[4] = width[4]-1

        if width[4]<0:
            width[4] = width[4]+60
            width[3] = width[3]-1

        if width[3]<0:
            width[3] = width[3]+24
            width[2] = width[2]-1

        if width[2]<0:
            daysInMonth = TimeUtil.daysInMonth(range[TimeUtil.COMPONENT_YEAR],range[TimeUtil.COMPONENT_MONTH])
            width[2] = width[2]+daysInMonth
            width[1] = width[1]-1

        if width[1]<0:
            width[1] = width[1]+12
            width[0] = width[0]-1

        TimeUtil.setStartTime(TimeUtil.getStopTime(range),result)
        TimeUtil.setStopTime(TimeUtil.add(TimeUtil.getStopTime(range),width),result)
        return result
    nextRange = staticmethod(nextRange)    

    # return true if this is a valid time range having a non-zero width.
    # @param granule
    # @return 
    def isValidTimeRange(granule):
        start = TimeUtil.getStartTime(granule)
        stop = TimeUtil.getStopTime(granule)
        return TimeUtil.isValidTime(start) and TimeUtil.isValidTime(stop) and TimeUtil.gt(stop,start)
    isValidTimeRange = staticmethod(isValidTimeRange)    


