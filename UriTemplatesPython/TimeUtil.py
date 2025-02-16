import math
import re
from collections import OrderedDict

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
    VERSION = '20250205.1'

    # Number of time components: year, month, day, hour, minute, second, nanosecond
    TIME_DIGITS = 7

    # Number of components in time representation: year, month, day
    DATE_DIGITS = 3

    # Number of components in a time range, which is two times.
    TIME_RANGE_DIGITS = 14

    # When array of components represents a time, the zeroth component is the year.
    COMPONENT_YEAR = 0

    # When array of components represents a time, the first component is the month.
    COMPONENT_MONTH = 1

    # When array of components represents a time, the second component is the day of month.
    COMPONENT_DAY = 2

    # When array of components represents a time, the third component is the hour of day.
    COMPONENT_HOUR = 3

    # When array of components represents a time, the fourth component is the minute of hour.
    COMPONENT_MINUTE = 4

    # When array of components represents a time, the fifth component is the second of minute (0 to 61).
    COMPONENT_SECOND = 5

    # When array of components represents a time, the sixth component is the nanosecond of the second (0 to 99999999).
    COMPONENT_NANOSECOND = 6

    # the number of days in each month.  DAYS_IN_MONTH[0][12] is number of days in December of a non-leap year
    DAYS_IN_MONTH = [[0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0], [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0]]

    # the number of days to the first of each month.  DAY_OFFSET[0][12] is offset to December 1st of a non-leap year
    DAY_OFFSET = [[0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365], [0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]]

    # short English abbreviations for month names.  
    MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    # short English abbreviations for month names.  
    MONTH_NAMES_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    def __init__(self):
        pass

    # fast parser requires that each character of string is a digit.  Note this 
    # does not check the the numbers are digits!
    #
    # @param s string containing an integer
    # @return the integer
    @staticmethod
    def parseInteger(s):
        length = len(s)
        for i in range(0, length):
            c = s[i]
            if ord(c) < 48 or ord(c) >= 58:
                raise Exception('only digits are allowed in string')
        if length == 2:
            result = 10 * (ord(s[0]) - 48) + (ord(s[1]) - 48)
            return result
        elif length == 3:
            result = 100 * (ord(s[0]) - 48) + 10 * (ord(s[1]) - 48) + (ord(s[2]) - 48)
            return result
        else:
            result = 0
            for i in range(0, len(s)):
                result = 10 * result + (ord(s[i]) - 48)

            return result

    # fast parser requires that each character of string is a digit.
    #
    # @param s the number, containing 1 or more digits.
    # @param deft the number to return when s is missing.
    # @return the int value
    @staticmethod
    def parseIntegerDeft(s, deft):
        if s is None:
            return deft
        return int(s)

    @staticmethod
    def parseDouble(val, deft):
        if val is None:
            if deft != -99:
                return deft
            else:
                raise Exception('bad digit')
        n = len(val) - 1
        if val[n].isalpha():
            return float(val[0:n])
        else:
            return float(val)

    # return the seven element start time from the time range.  Note
    # it is fine to use a time range as the start time, because codes
    # will only read the first seven components, and this is only added
    # to make code more readable.
    # @param timerange a fourteen-element time range.
    # @return the start time.
    @staticmethod
    def getStartTime(timerange):
        result = [0] * TimeUtil.TIME_DIGITS
        result[0:TimeUtil.TIME_DIGITS]=timerange[0:TimeUtil.TIME_DIGITS]
        return result

    # return the seven element stop time from the time range.  Note
    # it is fine to use a time range as the start time, because codes
    # will only read the first seven components.
    # @param timerange a fourteen-element time range.
    # @return the stop time.
    @staticmethod
    def getStopTime(timerange):
        result = [0] * TimeUtil.TIME_DIGITS
        result[0:TimeUtil.TIME_DIGITS]=timerange[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS]
        return result

    # copy the components of time into the start position (indices 0-7) of the time range.
    # This one-line method was introduced to clarify code and make conversion to 
    # other languages (in particular Python) easier.
    # @param time the seven-element start time
    # @param timerange the fourteen-element time range.
    @staticmethod
    def setStartTime(time, timerange):
        if len(timerange) != 14:
            raise Exception('timerange should be 14-element array.')
        timerange[0:TimeUtil.TIME_DIGITS]=time[0:TimeUtil.TIME_DIGITS]

    # copy the components of time into the stop position (indices 7-14) of the time range.
    # @param time the seven-element stop time
    # @param timerange the fourteen-element time range.
    @staticmethod
    def setStopTime(time, timerange):
        if len(timerange) != 14:
            raise Exception('timerange should be 14-element array.')
        timerange[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS]=time[0:TimeUtil.TIME_DIGITS]

    # format the time as (non-leap) milliseconds since 1970-01-01T00:00.000Z into a string.  The
    # number of milliseconds should not include leap seconds.  The output will always include 
    # milliseconds.
    # 
    # @param time the number of milliseconds since 1970-01-01T00:00.000Z
    # @return the formatted time.
    # @see #toMillisecondsSince1970(java.lang.String) 
    @staticmethod
    def fromMillisecondsSince1970(time):
        from datetime import datetime,timezone
        dt = datetime.fromtimestamp(time/1000,timezone.utc)
        s = dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        millis = dt.microsecond / 1000
        return s[0:-1] + '.%03dZ' % millis 

    # format the time as (non-leap) real seconds since 1970-01-01T00:00.000Z into a string.  The
    # number of milliseconds should not include leap seconds.  The output will always include 
    # milliseconds.
    # 
    # @param time the number of milliseconds since 1970-01-01T00:00.000Z
    # @return the formatted time.
    # @see #toMillisecondsSince1970(java.lang.String) 
    @staticmethod
    def fromSecondsSince1970(time):
        from datetime import datetime,timezone
        dt = datetime.fromtimestamp(time,timezone.utc)
        s = dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        millis = dt.microsecond / 1000
        return s[0:-1] + '.%03dZ' % millis 

    # J2000 epoch in UTC (January 1, 2000, 12:00:00 TT)
    J2000_EPOCH_MILLIS = 946728000000

    # See <https://cdf.gsfc.nasa.gov/html/CDFLeapSeconds.txt>
    LEAP_SECONDS = OrderedDict()
    LEAP_SECONDS[-883655957816000000] = 10        # Jan 1, 1972
    LEAP_SECONDS[-867931156816000000] = 11        # Jul 1, 1972
    LEAP_SECONDS[-852033555816000000] = 12        #  1973   1    1   12.0            0.0  0.0
    LEAP_SECONDS[-820497554816000000] = 13        #  1974   1    1   13.0            0.0  0.0
    LEAP_SECONDS[-788961553816000000] = 14        #  1975   1    1   14.0            0.0  0.0
    LEAP_SECONDS[-757425552816000000] = 15        #  1976   1    1   15.0            0.0  0.0
    LEAP_SECONDS[-725803151816000000] = 16        #  1977   1    1   16.0            0.0  0.0
    LEAP_SECONDS[-694267150816000000] = 17        #  1978   1    1   17.0            0.0  0.0
    LEAP_SECONDS[-662731149816000000] = 18        #  1979   1    1   18.0            0.0  0.0
    LEAP_SECONDS[-631195148816000000] = 19        #  1980   1    1   19.0            0.0  0.0
    LEAP_SECONDS[-583934347816000000] = 20        #  1981   7    1   20.0            0.0  0.0
    LEAP_SECONDS[-552398346816000000] = 21        #  1982   7    1   21.0            0.0  0.0
    LEAP_SECONDS[-520862345816000000] = 22        #  1983   7    1   22.0            0.0  0.0
    LEAP_SECONDS[-457703944816000000] = 23        #  1985   7    1   23.0            0.0  0.0
    LEAP_SECONDS[-378734343816000000] = 24        #  1988   1    1   24.0            0.0  0.0
    LEAP_SECONDS[-315575942816000000] = 25        #  1990   1    1   25.0            0.0  0.0
    LEAP_SECONDS[-284039941816000000] = 26        #  1991   1    1   26.0            0.0  0.0
    LEAP_SECONDS[-236779140816000000] = 27        #  1992   7    1   27.0            0.0  0.0
    LEAP_SECONDS[-205243139816000000] = 28        #  1993   7    1   28.0            0.0  0.0
    LEAP_SECONDS[-173707138816000000] = 29        #  1994   7    1   29.0            0.0  0.0
    LEAP_SECONDS[-126273537816000000] = 30        #  1996   1    1   30.0            0.0  0.0
    LEAP_SECONDS[-79012736816000000] = 31        #  1997   7    1   31.0            0.0  0.0        
    LEAP_SECONDS[-31579135816000000] = 32        # Jan 1, 1999
    LEAP_SECONDS[189345665184000000] = 33        # Jan 1, 2006
    LEAP_SECONDS[284040066184000000] = 34        # Jan 1, 2009
    LEAP_SECONDS[394372867184000000] = 35        # Jul 1, 2012
    LEAP_SECONDS[488980868184000000] = 36        # Jul 1, 2015
    LEAP_SECONDS[536500869184000000] = 37

    # return the number of complete leap seconds added for the tt2000 time, starting
    # 10 at 1972-01-01T00:00:01Z.
    # @param tt2000
    # @return the number of leap seconds on the date.
    @staticmethod
    def leapSecondsAt(tt2000):
        last = TimeUtil.lastLeapSecond(tt2000)
        return TimeUtil.LEAP_SECONDS[last]

    # return the tt2000 for nanosecond following the last leap second.
    # @param tt2000
    # @return tt2000 of the nanosecond following the last leap second.
    @staticmethod
    def lastLeapSecond(tt2000):
        last = -883655957816000000
        for k in TimeUtil.LEAP_SECONDS:
            if k > tt2000:
                break
            last = k
        return last

    # return the time as $H:$M:$S.$N, where the seconds
    # component can be 60 or 61.
    # @param nanosecondsSinceMidnight
    # @return String in form $H:$M:$S.$N
    @staticmethod
    def formatHMSN(nanosecondsSinceMidnight):
        if nanosecondsSinceMidnight < 0:
            raise Exception('nanosecondsSinceMidnight must be positive')
        if nanosecondsSinceMidnight >= 86_402_000_000_000:
            raise Exception('nanosecondsSinceMidnight must less than 86402*1000000000')
        ns = nanosecondsSinceMidnight
        hours = int((nanosecondsSinceMidnight // 3_600_000_000_000))
        if hours == 24:
            hours = 23
        ns -= hours * 3_600_000_000_000
        minutes = int((ns // 60_000_000_000))
        if minutes > 59:
            minutes = 59
        ns -= minutes * 60_000_000_000
        seconds = int((ns // 1_000_000_000))
        ns -= seconds * 1_000_000_000
        return '%02d:%02d:%02d.%09d' % (hours, minutes, seconds, ns)

    # format the time as nanoseconds since J2000 (Julian date 2451545.0 TT or 2000 January 1, 12h TT
    # or 2000-01-01T12:00 -  32.184s UTC).  This is used often in space physics, and is known as TT2000 
    # in NASA/CDF files.  This does include leap seconds, and this code must be updated as new leap 
    # seconds are planned.
    # 
    # @param tt2000 time in nanoseconds since 2000-01-01T11:59:27.816Z (datum('2000-01-01T12:00')-'32.184s')
    # @return the time formatted to nanosecond resolution
    @staticmethod
    def fromTT2000(tt2000):
        leapSeconds = TimeUtil.leapSecondsAt(tt2000)
        leapSecondCheck = TimeUtil.leapSecondsAt(tt2000 + 1000000000)
        nanosecondsSinceMidnight = (tt2000 - leapSeconds * 1_000_000_000 - 32_184_000_000 + 43_200_000_000_000) % 86_400_000_000_000
        if leapSecondCheck > leapSeconds:
            # the instant is during a leap second
            nanosecondsSinceMidnight += 86_400_000_000_000
        tt2000Midnight = tt2000 - nanosecondsSinceMidnight
        if True:
            # leapSecondCheck-leapSeconds==1 ) {
            nanosecondsSince2000 = (tt2000Midnight - leapSeconds * 1_000_000_000)
            julianDay = 2451545 + int(math.floor((nanosecondsSince2000) / 86400000000000)) + 1
            ymd = TimeUtil.fromJulianDay(julianDay)
            s = '%04d-%02d-%02dT' % (ymd[0], ymd[1], ymd[2]) + TimeUtil.formatHMSN(nanosecondsSinceMidnight) + 'Z'
        return s

    # given the two times, return a 14 element time range.
    # @param t1 a seven digit time
    # @param t2 a seven digit time after the first time.
    # @return a fourteen digit time range.
    # @throws IllegalArgumentException when the first time is greater than or equal to the second time.
    @staticmethod
    def createTimeRange(t1, t2):
        if not TimeUtil.gt(t2, t1):
            raise Exception('t1 is not smaller than t2')
        result = [0] * (TimeUtil.TIME_DIGITS * 2)
        TimeUtil.setStartTime(t1, result)
        TimeUtil.setStopTime(t2, result)
        return result

    # true if the year between 1582 and 2400 is a leap year.
    # @param year the year
    # @return true if the year between 1582 and 2400 is a leap year.
    @staticmethod
    def isLeapYear(year):
        if year < 1582 or year > 2400:
            raise Exception('year must be between 1582 and 2400')
        return (year % 4) == 0 and (year % 400 == 0 or year % 100 != 0)

    # return the English month name, abbreviated to three letters, for the
    # month number.
    #
    # @param i month number, from 1 to 12.
    # @return the month name, like "Jan" or "Dec"
    @staticmethod
    def monthNameAbbrev(i):
        return TimeUtil.MONTH_NAMES[i]

    # return the English month name, abbreviated to three letters, for the
    # month number.
    #
    # @param i month number, from 1 to 12.
    # @return the month name, like "January" or "December"
    @staticmethod
    def monthNameFull(i):
        return TimeUtil.MONTH_NAMES_FULL[i]

    # return the month number for the English month name, such as "Jan" (1) or
    # "December" (12). The first three letters are used to look up the number,
    # and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    # "Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
    # @param s the name (case-insensitive, only the first three letters are used.)
    # @return the number, for example 1 for "January"
    # @throws ParseException when month name is not recognized.
    @staticmethod
    def monthNumber(s):
        if len(s) < 3:
            raise Exception('need at least three letters')
        s = s[0:3]
        for i in range(1, 13):
            if s.lower() == TimeUtil.MONTH_NAMES[i].lower():
                return i
        raise Exception('Unable to parse month')

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
    @staticmethod
    def dayOfYear(year, month, day):
        if month == 1:
            return day
        if month < 1:
            raise Exception('month must be greater than 0.')
        if month > 12:
            raise Exception('month must be less than 12.')
        if day > 366:
            raise Exception('day (' + str(day) + ') must be less than 366.')
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0
        return TimeUtil.DAY_OFFSET[leap][month] + day

    # return "2" (February) for 45 for example.
    # @param year the year
    # @param doy the day of year.
    # @return the month 1-12 of the day.
    @staticmethod
    def monthForDayOfYear(year, doy):
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0
        dayOffset = TimeUtil.DAY_OFFSET[leap]
        if doy < 1:
            raise Exception('doy must be 1 or more')
        if doy > dayOffset[13]:
            raise Exception('doy must be less than or equal to ' + str(dayOffset[13]))
        for i in range(12, 1, -1):
            if dayOffset[i] < doy:
                return i
        return 1

    # count off the days between startTime and stopTime, but not including
    # stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
    # will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
    #
    # @param startTime an iso time string
    # @param stopTime an iso time string
    # @return array of times, complete days, in the form $Y-$m-$dZ
    @staticmethod
    def countOffDays(startTime, stopTime):
        try:
            t1 = TimeUtil.parseISO8601Time(startTime)
            t2 = TimeUtil.parseISO8601Time(stopTime)
        except Exception as ex:  # J2J: exceptions
            raise Exception(ex)
        j1 = TimeUtil.julianDay(t1[0], t1[1], t1[2])
        j2 = TimeUtil.julianDay(t2[0], t2[1], t2[2])
        result = [None] * (j2 - j1)
        time = TimeUtil.normalizeTimeString(startTime)[0:10] + 'Z'
        stopTime = TimeUtil.floor(stopTime)[0:10] + 'Z'
        i = 0
        nn = TimeUtil.isoTimeToArray(time)
        while time < stopTime:
            result[i] = time
            nn[2] = nn[2] + 1
            if nn[2] > 28:
                TimeUtil.normalizeTime(nn)
            time = '%04d-%02d-%02dZ' % (nn[0], nn[1], nn[2])
            i += 1
        return result

    # return the next day boundary. Note hours, minutes, seconds and
    # nanoseconds are ignored.
    #
    # @param day any isoTime format string.
    # @return the next day in $Y-$m-$dZ
    # @see #ceil(java.lang.String)
    # @see #previousDay(java.lang.String)
    @staticmethod
    def nextDay(day):
        nn = TimeUtil.isoTimeToArray(day)
        nn[2] = nn[2] + 1
        TimeUtil.normalizeTime(nn)
        return '%04d-%02d-%02dZ' % (nn[0], nn[1], nn[2])

    # return the previous day boundary. Note hours, minutes, seconds and
    # nanoseconds are ignored.
    #
    # @param day any isoTime format string.
    # @return the next day in $Y-$m-$dZ
    # @see #floor(java.lang.String)
    # @see #nextDay(java.lang.String)
    @staticmethod
    def previousDay(day):
        nn = TimeUtil.isoTimeToArray(day)
        nn[2] = nn[2] - 1
        TimeUtil.normalizeTime(nn)
        return '%04d-%02d-%02dZ' % (nn[0], nn[1], nn[2])

    # return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
    # value (normalized) if we are already at a boundary.
    #
    # @param time any isoTime format string.
    # @return the next midnight or the value if already at midnight.
    @staticmethod
    def ceil(time):
        time = TimeUtil.normalizeTimeString(time)
        if time[11:] == '00:00:00.000000000Z':
            return time
        else:
            return TimeUtil.nextDay(time[0:11])[0:10] + 'T00:00:00.000000000Z'

    # return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
    # value (normalized) if we are already at a boundary.
    #
    # @param time any isoTime format string.
    # @return the previous midnight or the value if already at midnight.
    @staticmethod
    def floor(time):
        time = TimeUtil.normalizeTimeString(time)
        if time[11:] == '00:00:00.000000000Z':
            return time
        else:
            return time[0:10] + 'T00:00:00.000000000Z'

    # return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
    #
    # @param time any isoTime format string.
    # @return the time in standard form.
    @staticmethod
    def normalizeTimeString(time):
        nn = TimeUtil.isoTimeToArray(time)
        TimeUtil.normalizeTime(nn)
        return '%d-%02d-%02dT%02d:%02d:%02d.%09dZ' % (nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])

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
    # @see #fromMillisecondsSince1970(long) 
    @staticmethod
    def toMillisecondsSince1970(time):
        time = TimeUtil.isoTimeToArray(time)
        import datetime
        datetim= datetime.datetime(time[0],time[1],time[2],0,0,0,0)
        dayspast= datetim.toordinal() - datetime.datetime(1970,1,1).toordinal()
        return dayspast * 86400000 + time[3]*3600000 + time[4]*60000 + time[5]*1000 + time[6]/1000

    # return the array formatted as ISO8601 time, formatted to nanoseconds.
    # For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
    # formatted to "1999-12-31T23:00:00.000000000Z";
    # @param nn the decomposed time
    # @return the formatted time.
    # @see #isoTimeToArray(java.lang.String)
    @staticmethod
    def isoTimeFromArray(nn):
        if nn[1] == 1 and nn[2] > 31:
            month = TimeUtil.monthForDayOfYear(nn[0], nn[2])
            dom1 = TimeUtil.dayOfYear(nn[0], month, 1)
            nn[2] = nn[2] - dom1 + 1
            nn[1] = month
        return '%04d-%02d-%02dT%02d:%02d:%02d.%09dZ' % (nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])

    # format the time range components into iso8601 time range.  
    # @param timerange 14-element time range
    # @return efficient representation of the time range
    @staticmethod
    def formatIso8601TimeRange(timerange):
        ss1 = TimeUtil.formatIso8601TimeInTimeRange(timerange, 0)
        ss2 = TimeUtil.formatIso8601TimeInTimeRange(timerange, TimeUtil.TIME_DIGITS)
        firstNonZeroDigit = 7
        while firstNonZeroDigit > 3 and timerange[firstNonZeroDigit - 1] == 0 and timerange[firstNonZeroDigit + TimeUtil.TIME_DIGITS - 1] == 0:
            firstNonZeroDigit -= 1
        if firstNonZeroDigit == 2:
            return ss1[0:10] + '/' + ss2[0:10]
        elif firstNonZeroDigit == 3:
            return ss1[0:10] + '/' + ss2[0:10]
        elif firstNonZeroDigit == 4:
            return ss1[0:16] + 'Z/' + ss2[0:16] + 'Z'
        elif firstNonZeroDigit == 5:
            return ss1[0:16] + 'Z/' + ss2[0:16] + 'Z'
        elif firstNonZeroDigit == 6:
            return ss1[0:19] + 'Z/' + ss2[0:19] + 'Z'
        else:
            return ss1 + '/' + ss2

    # return the string as a formatted string, which can be at an offset of seven positions 
    # to format the end date.
    # @param nn fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
    # @param offset 0 or 7 
    # @return formatted time "1999-12-31T23:00:00.000000000Z"
    # @see #isoTimeFromArray(int[]) 
    @staticmethod
    def formatIso8601TimeInTimeRange(nn, offset):
        if offset == 0:
            return TimeUtil.isoTimeFromArray(nn)
        elif offset == 7:
            copy = TimeUtil.getStopTime(nn)
            return TimeUtil.isoTimeFromArray(copy)
        else:
            raise Exception('offset must be 0 or 7')

    # return the string as a formatted string.
    # @param nn seven-element array of [ Y m d H M S nanos ]
    # @return formatted time "1999-12-31T23:00:00.000000000Z"
    # @see #isoTimeFromArray(int[]) 
    @staticmethod
    def formatIso8601Time(nn):
        return TimeUtil.isoTimeFromArray(nn)

    # format the duration into human-readable time, for example
    # [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
    # @param nn_in seven-element array of [ Y m d H M S N ]
    # @return ISO8601 duration
    @staticmethod
    def formatIso8601Duration(nn_in):
        units = ['Y', 'M', 'D', 'H', 'M', 'S']
        addedDigits = len(nn_in) < 6
        if len(nn_in) > 7:
            raise Exception('decomposed time can have at most 7 digits')
        if len(nn_in) < 7:
            nn = [0] * 7
            nn[0:len(nn_in)]=nn_in[0:len(nn_in)]
        else:
            nn = nn_in
        sb = 'P'
        n = 7
        needT = True
        for i in range(0, 5):
            if nn[i] > 0:
                if i >= 3:
                    sb+= 'T'
                    needT = False
                sb+= str(nn[i]) + str(units[i])
        if nn[5] > 0 or nn[6] > 0 or len(sb) == 2:
            if needT:
                sb+= 'T'
            seconds = nn[5]
            nanoseconds = nn[6]
            if nanoseconds == 0:
                sb+= str(seconds)
            elif nanoseconds % 1000000 == 0:
                sb+= str('%.3f' % (seconds + nanoseconds / 1e9))
            elif nanoseconds % 1000 == 0:
                sb+= str('%.6f' % (seconds + nanoseconds / 1e9))
            else:
                sb+= str('%.9f' % (seconds + nanoseconds / 1e9))
            sb+= 'S'
        if len(sb) == 1:
            if addedDigits:
                sb+= '0D'
            else:
                sb+= 'T0S'
        return sb

    iso8601duration = 'P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?(\\d*?\\.?\\d*)S)?)?'

    # Pattern matching valid ISO8601 durations, like "P1D" and "PT3H15M"
    iso8601DurationPattern = re.compile('P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d*?\\.?\\d*)S)?)?')

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
    @staticmethod
    def parseISO8601Duration(stringIn):
        m = TimeUtil.iso8601DurationPattern.match(stringIn)
        if m != None:
            dsec = TimeUtil.parseDouble(m.group(13), 0)
            sec = int(dsec)
            nanosec = int(((dsec - sec) * 1e9))
            return [TimeUtil.parseIntegerDeft(m.group(2), 0), TimeUtil.parseIntegerDeft(m.group(4), 0), TimeUtil.parseIntegerDeft(m.group(6), 0), TimeUtil.parseIntegerDeft(m.group(9), 0), TimeUtil.parseIntegerDeft(m.group(11), 0), sec, nanosec]
        else:
            if 'P' in stringIn and 'S' in stringIn and not 'T' in stringIn:
                raise Exception('ISO8601 duration expected but not found.  Was the T missing before S?')
            else:
                raise Exception('ISO8601 duration expected but not found.')

    # return the UTC current time, to the millisecond, in seven components.
    # @return the current time, to the millisecond
    @staticmethod
    def now():
        import datetime
        dt = datetime.datetime.utcnow()
        return [dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.microsecond * 1000]

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
    @staticmethod
    def isoTimeToArray(time):
        if len(time) == 4:
            result = [int(time), 1, 1, 0, 0, 0, 0]
        elif time.startswith('now') or time.startswith('last'):
            if time.startswith('now'):
                n = TimeUtil.now()
                remainder = time[3:]
            else:
                p = re.compile('last([a-z]+)([\\+|\\-]P.*)?')
                m = p.match(time)
                if m != None:
                    n = TimeUtil.now()
                    unit = m.group(1)
                    remainder = m.group(2)
                    if unit == "year":
                        idigit = 1
                    elif unit == "month":
                        idigit = 2
                    elif unit == "day":
                        idigit = 3
                    elif unit == "hour":
                        idigit = 4
                    elif unit == "minute":
                        idigit = 5
                    elif unit == "second":
                        idigit = 6
                    else:
                        raise Exception('unsupported unit: ' + unit)
                    for id in range(max(1,idigit), TimeUtil.DATE_DIGITS):
                        n[id] = 1
                    for id in range(max(TimeUtil.DATE_DIGITS,idigit), TimeUtil.TIME_DIGITS):
                        n[id] = 0
                else:
                    raise Exception('expected lastday+P1D, etc')
            if remainder is None or len(remainder) == 0:
                return n
            elif remainder[0] == '-':
                try:
                    return TimeUtil.subtract(n, TimeUtil.parseISO8601Duration(remainder[1:]))
                except Exception as ex:  # J2J: exceptions
                    raise Exception(ex)
            elif remainder[0] == '+':
                try:
                    return TimeUtil.add(n, TimeUtil.parseISO8601Duration(remainder[1:]))
                except Exception as ex:  # J2J: exceptions
                    raise Exception(ex)
            return TimeUtil.now()
        else:
            if len(time) < 7:
                raise Exception('time must have 4 or greater than 7 characters')
            if time[4].isdigit() and time[5].isdigit():
                raise Exception('date and time must contain delimiters between fields')
            if len(time) == 7:
                if time[4] == 'W':
                    # 2022W08
                    year = TimeUtil.parseInteger(time[0:4])
                    week = TimeUtil.parseInteger(time[5:])
                    result = [year, 0, 0, 0, 0, 0, 0]
                    TimeUtil.fromWeekOfYear(year, week, result)
                    timehms = ''
                else:
                    result = [TimeUtil.parseInteger(time[0:4]), TimeUtil.parseInteger(time[5:7]), 1, 0, 0, 0, 0]
                    timehms = ''
            elif len(time) == 8:
                if time[5] == 'W':
                    # 2022-W08
                    year = TimeUtil.parseInteger(time[0:4])
                    week = TimeUtil.parseInteger(time[6:])
                    result = [year, 0, 0, 0, 0, 0, 0]
                    TimeUtil.fromWeekOfYear(year, week, result)
                    timehms = ''
                else:
                    result = [TimeUtil.parseInteger(time[0:4]), 1, TimeUtil.parseInteger(time[5:8]), 0, 0, 0, 0]
                    timehms = ''
            elif time[8] == 'T':
                if time[4].isdigit():
                    result = [TimeUtil.parseInteger(time[0:4]), TimeUtil.parseInteger(time[4:6]), TimeUtil.parseInteger(time[6:8]), 0, 0, 0, 0]
                    timehms = time[9:]
                else:
                    result = [TimeUtil.parseInteger(time[0:4]), 1, TimeUtil.parseInteger(time[5:8]), 0, 0, 0, 0]
                    timehms = time[9:]
            elif time[8] == 'Z':
                result = [TimeUtil.parseInteger(time[0:4]), 1, TimeUtil.parseInteger(time[5:8]), 0, 0, 0, 0]
                timehms = time[9:]
            else:
                result = [TimeUtil.parseInteger(time[0:4]), TimeUtil.parseInteger(time[5:7]), TimeUtil.parseInteger(time[8:10]), 0, 0, 0, 0]
                if len(time) == 10:
                    timehms = ''
                else:
                    timehms = time[11:]
            if timehms.endswith('Z'):
                timehms = timehms[0:len(timehms) - 1]
            if len(timehms) >= 2:
                result[3] = TimeUtil.parseInteger(timehms[0:2])
            if len(timehms) >= 5:
                result[4] = TimeUtil.parseInteger(timehms[3:5])
            if len(timehms) >= 8:
                result[5] = TimeUtil.parseInteger(timehms[6:8])
            if len(timehms) > 9:
                result[6] = int((10**(18 - len(timehms)))) * TimeUtil.parseInteger(timehms[9:])
            TimeUtil.normalizeTime(result)
        return result

    # Rewrite the time using the format of the example time, which must start with
    # $Y-$jT, $Y-$jZ, or $Y-$m-$d. For example,
    # <pre>
    # {@code
    # from org.hapiserver.TimeUtil import *
    # print reformatIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
    # print reformatIsoTime( '2020-010', '2020-020Z' ) # ->  '2020-020'
    # print reformatIsoTime( '2020-01-01T00:00Z', '2021-01-01Z' ) # ->  '2021-01-01T00:00Z'
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
    @staticmethod
    def reformatIsoTime(exampleForm, time):
        if len(exampleForm) == 8:
            if time[4] == '-':
                return time[0:8]
            else:
                nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time))
                nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
                return '%d-%03d' % (nn[0], nn[2])
        c = exampleForm[8]
        nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time))
        if c == 'T':
            # $Y-$jT
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = '%d-%03dT%02d:%02d:%02d.%09dZ' % (nn[0], nn[2], nn[3], nn[4], nn[5], nn[6])
        elif c == 'Z':
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = '%d-%03dZ' % (nn[0], nn[2])
        else:
            if len(exampleForm) == 10:
                c = 'Z'
            else:
                c = exampleForm[10]

            if c == 'T':
                # $Y-$jT
                time = '%d-%02d-%02dT%02d:%02d:%02d.%09dZ' % (nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
            elif c == 'Z':
                time = '%d-%02d-%02dZ' % (nn[0], nn[1], nn[2])

        if exampleForm.endswith('Z'):
            return time[0:len(exampleForm) - 1] + 'Z'
        else:
            return time[0:len(exampleForm)]

    VALID_FIRST_YEAR = 1900

    VALID_LAST_YEAR = 2100

    # this returns true or throws an IllegalArgumentException indicating the problem.
    # @param time the seven-component time.
    # @return true or throws an IllegalArgumentException
    @staticmethod
    def isValidTime(time):
        year = time[0]
        if year < TimeUtil.VALID_FIRST_YEAR:
            raise Exception('invalid year at position 0')
        if year > TimeUtil.VALID_LAST_YEAR:
            raise Exception('invalid year at position 0')
        month = time[1]
        if month < 1:
            raise Exception('invalid month at position 1')
        if month > 12:
            raise Exception('invalid month at position 1')
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0
        dayOfMonth = time[2]
        if month > 1:
            if dayOfMonth > TimeUtil.DAYS_IN_MONTH[leap][month]:
                raise Exception('day of month is too large at position 2')
        else:
            if dayOfMonth > TimeUtil.DAY_OFFSET[leap][13]:
                raise Exception('day of year is too large at position 2')
        if dayOfMonth < 1:
            raise Exception('day is less than 1 at position 2')
        return True

    # return the number of days in the month.
    # @param year the year 
    # @param month the month
    # @return the number of days in the month.
    # @see #isLeapYear(int) 
    @staticmethod
    def daysInMonth(year, month):
        if TimeUtil.isLeapYear(year):
            leap = 1
        else:
            leap = 0
        return TimeUtil.DAYS_IN_MONTH[leap][month]

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
    @staticmethod
    def normalizeTime(time):
        while time[6] >= 1000000000:
            time[5] += 1
            time[6] -= 1000000000
        while time[5] > 59:
            # TODO: leap seconds?
            time[4] += 1
            time[5] -= 60
        while time[4] > 59:
            time[3] += 1
            time[4] -= 60
        while time[3] >= 24:
            time[2] += 1
            time[3] -= 24
        if time[6] < 0:
            time[5] -= 1
            time[6] += 1000000000
        if time[5] < 0:
            time[4] -= 1
            # take a minute
            time[5] += 60
        if time[4] < 0:
            time[3] -= 1
            # take an hour
            time[4] += 60
        if time[3] < 0:
            time[2] -= 1
            # take a day
            time[3] += 24
        if time[2] < 1:
            time[1] -= 1
            # take a month
            if time[1] == 0:
                daysInMonth = 31
            else:
                if TimeUtil.isLeapYear(time[0]):
                    # This was  TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]] . TODO: review!
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[1][time[1]]
                else:
                    daysInMonth = TimeUtil.DAYS_IN_MONTH[0][time[1]]
            time[2] += daysInMonth
        if time[1] < 1:
            time[0] -= 1
            # take a year
            time[1] += 12
        if time[3] > 24:
            raise Exception('time[3] is greater than 24 (hours)')
        if time[1] > 12:
            time[0] += 1
            time[1] -= 12
        if time[1] == 12 and time[2] > 31 and time[2] < 62:
            time[0] += 1
            time[1] = 1
            time[2] -= 31
            return
        if TimeUtil.isLeapYear(time[0]):
            leap = 1
        else:
            leap = 0
        if time[2] == 0:
            #TODO: tests don't hit this branch, and I'm not sure it can occur.
            time[1] -= 1
            if time[1] == 0:
                time[0] -= 1
                time[1] = 12
            time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
        d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
        while time[2] > d:
            time[1] += 1
            time[2] -= d
            if time[1] > 12:
                time[0] += 1
                time[1] -= 12
            d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]

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
    @staticmethod
    def julianDay(year, month, day):
        if year <= 1582:
            raise Exception('year must be more than 1582')
        jd = 367 * year - 7 * (year + (month + 9) // 12) // 4 - 3 * ((year + (month - 9) // 7) // 100 + 1) // 4 + 275 * month // 9 + day + 1721029
        return jd

    # Break the Julian day apart into month, day year. This is based on
    # http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
    # introduced when toTimeStruct failed when the year was 1886.
    #
    # @see #julianDay( int year, int mon, int day )
    # @param julian the (integer) number of days that have elapsed since the
    # initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
    # @return a TimeStruct with the month, day and year fields set.
    @staticmethod
    def fromJulianDay(julian):
        j = julian + 32044
        g = j // 146097
        dg = j % 146097
        c = (dg // 36524 + 1) * 3 // 4
        dc = dg - c * 36524
        b = dc // 1461
        db = dc % 1461
        a = (db // 365 + 1) * 3 // 4
        da = db - a * 365
        y = g * 400 + c * 100 + b * 4 + a
        m = (da * 5 + 308) // 153 - 2
        d = da - (m + 4) * 153 // 5 + 122
        Y = y - 4800 + (m + 2) // 12
        M = (m + 2) % 12 + 1
        D = d + 1
        result = [0] * TimeUtil.TIME_DIGITS
        result[0] = Y
        result[1] = M
        result[2] = D
        result[3] = 0
        result[4] = 0
        result[5] = 0
        result[6] = 0
        return result

    # calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
    # 2022-03-12 is a Saturday, so 5 is returned.
    # @param year the year
    # @param month the month
    # @param day the day of the month
    # @return the day of the week.
    @staticmethod
    def dayOfWeek(year, month, day):
        jd = TimeUtil.julianDay(year, month, day)
        daysSince2022 = jd - TimeUtil.julianDay(2022, 1, 1)
        mod7 = (daysSince2022 - 2) % 7
        if mod7 < 0:
            mod7 = mod7 + 7
        return mod7

    # calculate the week of year, inserting the month into time[1] and day into time[2]
    # for the Monday which is the first day of that week.  Note week 0 is excluded from
    # ISO8601, but since the Linux date command returns this in some cases, it is allowed to
    # mean the same as week 52 of the previous year.  See 
    # <a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
    # 
    # @param year the year of the week.
    # @param weekOfYear the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
    # @param time the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
    @staticmethod
    def fromWeekOfYear(year, weekOfYear, time):
        time[0] = year
        day = TimeUtil.dayOfWeek(year, 1, 1)
        if day < 4:
            doy = (weekOfYear * 7 - 7 - day) + 1
            if doy < 1:
                time[0] = time[0] - 1
                if TimeUtil.isLeapYear(time[0]):
                    # was  doy= doy + ( isLeapYear(time[0]) ? 366 : 365 );  TODO: verify
                    doy = doy + 366
                else:
                    doy = doy + 365
        else:
            doy = weekOfYear * 7 - day + 1
        time[1] = 1
        time[2] = doy
        TimeUtil.normalizeTime(time)

    # use consistent naming so that the parser is easier to find.
    # @param string iso8601 time like "2022-03-12T11:17" (Z is assumed).
    # @return seven-element decomposed time [ Y, m, d, H, M, S, N ]
    # @throws ParseException when the string cannot be parsed.
    # @see #isoTimeToArray(java.lang.String) 
    @staticmethod
    def parseISO8601Time(string):
        return TimeUtil.isoTimeToArray(string)

    # return true if the time appears to be properly formatted.  Properly formatted strings include:<ul>
    # <li>Any supported ISO8601 time
    # <li>2000 and 2000-01 (just a year and month)
    # <li>now - the current time reported by the processing system
    # <li>lastyear - last year boundary
    # <li>lastmonth - last month boundary
    # <li>lastday - last midnight boundary
    # <li>lasthour - last midnight boundary
    # <li>now-P1D - yesterday at this time
    # <li>lastday-P1D - yesterday midnight boundary
    # </ul>
    # @param time
    # @return true if the time appears to be valid and will parse.
    @staticmethod
    def isValidFormattedTime(time):
        return len(time) > 0 and (time[0].isdigit() or time[0] == 'P' or time.startswith('now') or time.startswith('last'))

    # parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
    # start and stop times, returned in a 14 element array of ints.
    # @param stringIn string to parse, like "1998-01-02/1998-01-17"
    # @return the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
    # @throws ParseException when the string cannot be used
    @staticmethod
    def parseISO8601TimeRange(stringIn):
        ss = stringIn.split('/')
        if len(ss) != 2:
            raise Exception('expected one slash (/) splitting start and stop times.')
        if not TimeUtil.isValidFormattedTime(ss[0]):
            raise Exception('first time/duration is misformatted.  Should be ISO8601 time or duration like P1D.')
        if not TimeUtil.isValidFormattedTime(ss[1]):
            raise Exception('second time/duration is misformatted.  Should be ISO8601 time or duration like P1D.')
        result = [0] * 14
        if ss[0].startswith('P'):
            duration = TimeUtil.parseISO8601Duration(ss[0])
            time = TimeUtil.isoTimeToArray(ss[1])
            for i in range(0, TimeUtil.TIME_DIGITS):
                result[i] = time[i] - duration[i]
            TimeUtil.normalizeTime(result)
            TimeUtil.setStopTime(time, result)
            return result
        elif ss[1].startswith('P'):
            time = TimeUtil.isoTimeToArray(ss[0])
            duration = TimeUtil.parseISO8601Duration(ss[1])
            TimeUtil.setStartTime(time, result)
            stoptime = [0] * TimeUtil.TIME_DIGITS
            for i in range(0, TimeUtil.TIME_DIGITS):
                stoptime[i] = time[i] + duration[i]
            TimeUtil.normalizeTime(stoptime)
            TimeUtil.setStopTime(stoptime, result)
            return result
        else:
            starttime = TimeUtil.isoTimeToArray(ss[0])
            if len(ss[1]) == len(ss[0]):
                stoptime = TimeUtil.isoTimeToArray(ss[1])
            else:
                if 'T' in ss[1]:
                    stoptime = TimeUtil.isoTimeToArray(ss[1])
                else:
                    partToShare = len(ss[0]) - len(ss[1])
                    stoptime = TimeUtil.isoTimeToArray(ss[0][0:partToShare] + ss[1])
            TimeUtil.setStartTime(starttime, result)
            TimeUtil.setStopTime(stoptime, result)
            return result

    # subtract the offset from the base time.
    #
    # @param base a time
    # @param offset offset in each component.
    # @return a time
    @staticmethod
    def subtract(base, offset):
        result = [0] * TimeUtil.TIME_DIGITS
        for i in range(0, TimeUtil.TIME_DIGITS):
            result[i] = base[i] - offset[i]
        if result[0] > 400:
            TimeUtil.normalizeTime(result)
        return result

    # add the offset to the base time. This should not be used to combine two
    # offsets, because the code has not been verified for this use.
    #
    # @param base a time
    # @param offset offset in each component.
    # @return a time
    @staticmethod
    def add(base, offset):
        result = [0] * TimeUtil.TIME_DIGITS
        for i in range(0, TimeUtil.TIME_DIGITS):
            result[i] = base[i] + offset[i]
        TimeUtil.normalizeTime(result)
        return result

    # true if t1 is after t2.
    # @param t1 seven-component time
    # @param t2 seven-component time
    # @return true if t1 is after t2.
    @staticmethod
    def gt(t1, t2):
        TimeUtil.normalizeTime(t1)
        TimeUtil.normalizeTime(t2)
        for i in range(0, TimeUtil.TIME_DIGITS):
            if t1[i] > t2[i]:
                return True
            elif t1[i] < t2[i]:
                return False
        return False

    # true if t1 is equal to t2.
    # @param t1 seven-component time
    # @param t2 seven-component time
    # @return true if t1 is equal to t2.
    @staticmethod
    def eq(t1, t2):
        TimeUtil.normalizeTime(t1)
        TimeUtil.normalizeTime(t2)
        for i in range(0, TimeUtil.TIME_DIGITS):
            if t1[i] != t2[i]:
                return False
        return True

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) 
    @staticmethod
    def formatIso8601TimeBrief(time):
        return TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0)

    # format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
    # @param time seven element time range
    # @param offset the offset into the time array (7 for stop time in 14-element range array).
    # @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
    # @see #formatIso8601TimeBrief(int[]) 
    @staticmethod
    def formatIso8601TimeInTimeRangeBrief(time, offset):
        stime = TimeUtil.formatIso8601TimeInTimeRange(time, offset)
        nanos = time[TimeUtil.COMPONENT_NANOSECOND + offset]
        micros = nanos % 1000
        millis = nanos % 10000000
        if nanos == 0:
            if time[5 + offset] == 0:
                return stime[0:16] + 'Z'
            else:
                return stime[0:19] + 'Z'
        else:
            if millis == 0:
                return stime[0:23] + 'Z'
            elif micros == 0:
                return stime[0:26] + 'Z'
            else:
                return stime

    # return the next interval, given the 14-component time interval.  This
    # has the restrictions:<ul>
    # <li> can only handle intervals of at least one second
    # <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
    # <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
    # </ul>
    # @param timerange 14-component time interval.
    # @return 14-component time interval.
    @staticmethod
    def nextRange(timerange):
        result = [0] * TimeUtil.TIME_RANGE_DIGITS
        width = [0] * TimeUtil.TIME_DIGITS
        for i in range(0, TimeUtil.TIME_DIGITS):
            width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i]
        if width[5] < 0:
            width[5] = width[5] + 60
            width[4] = width[4] - 1
        if width[4] < 0:
            width[4] = width[4] + 60
            width[3] = width[3] - 1
        if width[3] < 0:
            width[3] = width[3] + 24
            width[2] = width[2] - 1
        if width[2] < 0:
            daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil.COMPONENT_YEAR], timerange[TimeUtil.COMPONENT_MONTH])
            width[2] = width[2] + daysInMonth
            width[1] = width[1] - 1
        if width[1] < 0:
            width[1] = width[1] + 12
            width[0] = width[0] - 1
        # System.arraycopy( range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
        TimeUtil.setStartTime(TimeUtil.getStopTime(timerange), result)
        # This creates an extra array, but let's not worry about that.
        TimeUtil.setStopTime(TimeUtil.add(TimeUtil.getStopTime(timerange), width), result)
        return result

    # return the previous interval, given the 14-component time interval.  This
    # has the restrictions:<ul>
    # <li> can only handle intervals of at least one second
    # <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
    # <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
    # </ul>
    # @param timerange 14-component time interval.
    # @return 14-component time interval.
    @staticmethod
    def previousRange(timerange):
        result = [0] * TimeUtil.TIME_RANGE_DIGITS
        width = [0] * TimeUtil.TIME_DIGITS
        for i in range(0, TimeUtil.TIME_DIGITS):
            width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i]
        if width[5] < 0:
            width[5] = width[5] + 60
            width[4] = width[4] - 1
        if width[4] < 0:
            width[4] = width[4] + 60
            width[3] = width[3] - 1
        if width[3] < 0:
            width[3] = width[3] + 24
            width[2] = width[2] - 1
        if width[2] < 0:
            daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil.COMPONENT_YEAR], timerange[TimeUtil.COMPONENT_MONTH])
            width[2] = width[2] + daysInMonth
            width[1] = width[1] - 1
        if width[1] < 0:
            width[1] = width[1] + 12
            width[0] = width[0] - 1
        TimeUtil.setStopTime(TimeUtil.getStartTime(timerange), result)
        TimeUtil.setStartTime(TimeUtil.subtract(TimeUtil.getStartTime(timerange), width), result)
        return result

    # return true if this is a valid time range having a non-zero width.
    # @param timerange
    # @return 
    @staticmethod
    def isValidTimeRange(timerange):
        start = TimeUtil.getStartTime(timerange)
        stop = TimeUtil.getStopTime(timerange)
        return TimeUtil.isValidTime(start) and TimeUtil.isValidTime(stop) and TimeUtil.gt(stop, start)


