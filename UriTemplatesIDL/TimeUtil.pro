import re

from java.time import Instant
from java.time.format import DateTimeFormatterBuilder
from java.util import Calendar
from java.util import Date
from java.util import TimeZone
from java.util.regex import Matcher

;+
; Utilities for times in IsoTime strings (limited set of ISO8601 times)
; Examples of isoTime strings include:<ul>
; <li>2020-04-21Z
; <li>2020-04-21T12:20Z
; <li>2020-04-21T23:45:67.000000001Z (nanosecond limit)
; <li>2020-112Z (day-of-year instead of $Y-$m-$d)
; <li>2020-112T23:45:67.000000001 (note Z is assumed)
; </ul>
;
; @author jbf
;-

















;+
; fast parser requires that each character of string is a digit.  Note this 
; does not check the the numbers are digits!
;
; @return the integer
;
; Parameters:
;   s - string containing an integer
;-
function TimeUtil::parseInteger, s
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    length = strlen(s)
    for i=0,length-1 do begin
        c = strmid(s,i,1)
        if ord(c) lt 48 or ord(c) ge 58 then begin
            stop, 'only digits are allowed in string'
        endif 
    endfor
    switch length of
        2: begin
            result = 10 * (ord(strmid(s,0,1)) - 48) + (ord(strmid(s,1,1)) - 48)
            return, result
        end
        3: begin
            result = 100 * (ord(strmid(s,0,1)) - 48) + 10 * (ord(strmid(s,1,1)) - 48) + (ord(strmid(s,2,1)) - 48)
            return, result
        end
        else:
            result = 0
            for i=0,strlen(s)-1 do begin
                result = 10 * result + (ord(strmid(s,i,1)) - 48)
            endfor

            return, result
        end
    end
end

;+
; fast parser requires that each character of string is a digit.
;
; @return the int value
;
; Parameters:
;   s - the number, containing 1 or more digits.
;   deft - the number to return when s is missing.
;-
function TimeUtil::parseIntegerDeft, s, deft
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if s is None then begin
        return, deft
    endif 
    return, int(s)
end

function TimeUtil::parseDouble, val, deft
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if val is None then begin
        if deft ne -99 then begin
            return, deft
        endif else begin
            stop, 'bad digit'
        endelse
    endif 
    n = strlen(val) - 1
    if strmid(val,n,1).isalpha() then begin
        return, float(strmid(val,0,n-1))
    endif else begin
        return, float(val)
    endelse
end

;+
; return the seven element start time from the time range.  Note
; it is fine to use a time range as the start time, because codes
; will only read the first seven components, and this is only added
; to make code more readable.
; @return the start time.
;
; Parameters:
;   timerange - a fourteen-element time range.
;-
function TimeUtil::getStartTime, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil.TIME_DIGITS)
    result[0:(TimeUtil.TIME_DIGITS-1)]=timerange[0:(TimeUtil.TIME_DIGITS-1)]
    return, result
end

;+
; return the seven element stop time from the time range.  Note
; it is fine to use a time range as the start time, because codes
; will only read the first seven components.
; @return the stop time.
;
; Parameters:
;   timerange - a fourteen-element time range.
;-
function TimeUtil::getStopTime, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil.TIME_DIGITS)
    result[0:(TimeUtil.TIME_DIGITS-1)]=timerange[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS-1]
    return, result
end

;+
; copy the components of time into the start position (indeces 7-14) of the time range.
; This one-line method was introduced to clarify code and make conversion to 
; other languages (in particular Python) easier.
;
; Parameters:
;   time - the seven-element start time
;   timerange - the fourteen-element time range.
;-
pro TimeUtil::setStartTime, time, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(timerange) ne 14 then stop, 'timerange should be 14-element array.'
    timerange[0:(TimeUtil.TIME_DIGITS-1)]=time[0:(TimeUtil.TIME_DIGITS-1)]
end

;+
; copy the components of time into the stop position (indeces 7-14) of the time range.
;
; Parameters:
;   time - the seven-element stop time
;   timerange - the fourteen-element time range.
;-
pro TimeUtil::setStopTime, time, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(timerange) ne 14 then stop, 'timerange should be 14-element array.'
    timerange[TimeUtil.TIME_DIGITS:2*TimeUtil.TIME_DIGITS-1]=time[0:(TimeUtil.TIME_DIGITS-1)]
end


;+
; format the time as (non-leap) milliseconds since 1970-01-01T00:00.000Z into a string.  The
; number of milliseconds should not include leap seconds.  The milliseconds are always present.
; 
; @return the formatted time.
; @see #toMillisecondsSince1970(java.lang.String) 
;
; Parameters:
;   time - the number of milliseconds since 1970-01-01T00:00.000Z
;-
function TimeUtil::fromMillisecondsSince1970, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, FORMATTER_MS_1970.format(Instant.ofEpochMilli(time))
end

;+
; given the two times, return a 14 element time range.
; @return a fourteen digit time range.
; @throws IllegalArgumentException when the first time is greater than or equal to the second time.
;
; Parameters:
;   t1 - a seven digit time
;   t2 - a seven digit time after the first time.
;-
function TimeUtil::createTimeRange, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if not TimeUtil.gt(t2, t1) then begin
        stop, 't1 is not smaller than t2'
    endif 
    result = replicate(0,TimeUtil.TIME_DIGITS * 2)
    TimeUtil.setStartTime(t1, result)
    TimeUtil.setStopTime(t2, result)
    return, result
end

;+
; true if the year between 1582 and 2400 is a leap year.
; @return true if the year between 1582 and 2400 is a leap year.
;
; Parameters:
;   year - the year
;-
function TimeUtil::isLeapYear, year
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if year lt 1582 or year gt 2400 then begin
        stop, 'year must be between 1582 and 2400'
    endif 
    return, (year mod 4) eq 0 and (year mod 400 eq 0 or year mod 100 ne 0)
end

;+
; return the English month name, abbreviated to three letters, for the
; month number.
;
; @return the month name, like "Jan" or "Dec"
;
; Parameters:
;   i - month number, from 1 to 12.
;-
function TimeUtil::monthNameAbbrev, i
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, MONTH_NAMES[i]
end

;+
; return the English month name, abbreviated to three letters, for the
; month number.
;
; @return the month name, like "January" or "December"
;
; Parameters:
;   i - month number, from 1 to 12.
;-
function TimeUtil::monthNameFull, i
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, MONTH_NAMES_FULL[i]
end

;+
; return the month number for the English month name, such as "Jan" (1) or
; "December" (12). The first three letters are used to look up the number,
; and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
; "Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
; @return the number, for example 1 for "January"
; @throws ParseException when month name is not recognized.
;
; Parameters:
;   s - the name (case-insensitive, only the first three letters are used.)
;-
function TimeUtil::monthNumber, s
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if strlen(s) lt 3 then begin
        stop, Exception('need at least three letters')
    endif 
    s = strmid(s,0,3-1)
    for i=1,12 do begin
        if strcmp(s,MONTH_NAMES[i],/FOLD_CASE) then begin
            return, i
        endif 
    endfor
    stop, Exception('Unable to parse month')
end

;+
; return the day of year for the given year, month, and day. For example, in
; Jython:
; <pre>
; {@code
; from org.hapiserver.TimeUtil import *
; print dayOfYear( 2020, 4, 21 ) # 112
; }
; </pre>
;
; @return the day of year.
;
; Parameters:
;   year - the year
;   month - the month, from 1 to 12.
;   day - the day in the month.
;-
function TimeUtil::dayOfYear, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if month eq 1 then begin
        return, day
    endif 
    if month lt 1 then begin
        stop, 'month must be greater than 0.'
    endif 
    if month gt 12 then begin
        stop, 'month must be less than 12.'
    endif 
    if day gt 366 then begin
        stop, 'day (' + strtrim(day,2) + ') must be less than 366.'
    endif 
    if TimeUtil.isLeapYear(year):
        leap = 1
    else:
        leap = 0
    return, DAY_OFFSET[leap][month] + day
end

;+
; return "2" (February) for 45 for example.
; @return the month 1-12 of the day.
;
; Parameters:
;   year - the year
;   doy - the day of year.
;-
function TimeUtil::monthForDayOfYear, year, doy
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if TimeUtil.isLeapYear(year):
        leap = 1
    else:
        leap = 0
    dayOffset = DAY_OFFSET[leap]
    if doy lt 1 then stop, 'doy must be 1 or more'
    if doy gt dayOffset[13] then begin
        stop, 'doy must be less than or equal to ' + strtrim(dayOffset[13],2)
    endif 
    for i=12,2,-1 do begin
        if dayOffset[i] lt doy then begin
            return, i
        endif 
    endfor
    return, 1
end

;+
; count off the days between startTime and stopTime, but not including
; stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
; will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
;
; @return array of times, complete days, in the form $Y-$m-$dZ
;
; Parameters:
;   startTime - an iso time string
;   stopTime - an iso time string
;-
function TimeUtil::countOffDays, startTime, stopTime
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    try:
        t1 = TimeUtil.parseISO8601Time(startTime)
        t2 = TimeUtil.parseISO8601Time(stopTime)
    except ParseException, ex:
        stop, ex
    j1 = TimeUtil.julianDay(t1[0], t1[1], t1[2])
    j2 = TimeUtil.julianDay(t2[0], t2[1], t2[2])
    result = replicate(None,j2 - j1)
    time = strmid(TimeUtil.normalizeTimeString(startTime),0,10-1) + 'Z'
    stopTime = strmid(TimeUtil.floor(stopTime),0,10-1) + 'Z'
    i = 0
    nn = TimeUtil.isoTimeToArray(time)
    while time lt stopTime do begin
        result[i] = time
        nn[2] = nn[2] + 1
        if nn[2] gt 28 then TimeUtil.normalizeTime(nn)
        time = string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
        i += 1
    endwhile
    return, result
end

;+
; return the next day boundary. Note hours, minutes, seconds and
; nanoseconds are ignored.
;
; @return the next day in $Y-$m-$dZ
; @see #ceil(java.lang.String)
; @see #previousDay(java.lang.String)
;
; Parameters:
;   day - any isoTime format string.
;-
function TimeUtil::nextDay, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(day)
    nn[2] = nn[2] + 1
    TimeUtil.normalizeTime(nn)
    return, string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
end

;+
; return the previous day boundary. Note hours, minutes, seconds and
; nanoseconds are ignored.
;
; @return the next day in $Y-$m-$dZ
; @see #floor(java.lang.String)
; @see #nextDay(java.lang.String)
;
; Parameters:
;   day - any isoTime format string.
;-
function TimeUtil::previousDay, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(day)
    nn[2] = nn[2] - 1
    TimeUtil.normalizeTime(nn)
    return, string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
end

;+
; return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
; value (normalized) if we are already at a boundary.
;
; @return the next midnight or the value if already at midnight.
;
; Parameters:
;   time - any isoTime format string.
;-
function TimeUtil::ceil, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time = TimeUtil.normalizeTimeString(time)
    if strmid(time,11)=='00:00:00.000000000Z' then begin
        return, time
    endif else begin
        return, strmid(TimeUtil.nextDay(strmid(time,0,11-1)),0,10-1) + 'T00:00:00.000000000Z'
    endelse
end

;+
; return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
; value (normalized) if we are already at a boundary.
;
; @return the previous midnight or the value if already at midnight.
;
; Parameters:
;   time - any isoTime format string.
;-
function TimeUtil::floor, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time = TimeUtil.normalizeTimeString(time)
    if strmid(time,11)=='00:00:00.000000000Z' then begin
        return, time
    endif else begin
        return, strmid(time,0,10-1) + 'T00:00:00.000000000Z'
    endelse
end

;+
; return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
;
; @return the time in standard form.
;
; Parameters:
;   time - any isoTime format string.
;-
function TimeUtil::normalizeTimeString, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(time)
    TimeUtil.normalizeTime(nn)
    return, string(format='%d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
end

;+
; return the time as milliseconds since 1970-01-01T00:00Z. This does not
; include leap seconds. For example, in Jython:
; <pre>
; {@code
; from org.hapiserver.TimeUtil import *
; x= toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
; print x / 86400000   # 10958.0 days
; print x % 86400000   # and no milliseconds
; }
; </pre>
;
; DateTimeFormatter.ISO_INSTANT.parse.
; @return number of non-leap-second milliseconds since 1970-01-01T00:00Z.
; @see #fromMillisecondsSince1970(long) 
;
; Parameters:
;   time - the isoTime, which is parsed using
;-
function TimeUtil::toMillisecondsSince1970, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time = TimeUtil.normalizeTimeString(time)
    ta = DateTimeFormatter.ISO_INSTANT.parse(time)
    i = Instant.from(ta)
    d = Date.from(i)
    return, d.getTime()
end

;+
; return the array formatted as ISO8601 time, formatted to nanoseconds.
; For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
; formatted to "1999-12-31T23:00:00.000000000Z";
; @return the formatted time.
; @see #isoTimeToArray(java.lang.String)
;
; Parameters:
;   nn - the decomposed time
;-
function TimeUtil::isoTimeFromArray, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if nn[1] eq 1 and nn[2] gt 31 then begin
        month = TimeUtil.monthForDayOfYear(nn[0], nn[2])
        dom1 = TimeUtil.dayOfYear(nn[0], month, 1)
        nn[2] = nn[2] - dom1 + 1
        nn[1] = month
    endif 
    return, string(format='%04d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
end

;+
; format the time range components into iso8601 time range.  
; @return efficient representation of the time range
;
; Parameters:
;   timerange - 14-element time range
;-
function TimeUtil::formatIso8601TimeRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    ss1 = TimeUtil.formatIso8601TimeInTimeRange(timerange, 0)
    ss2 = TimeUtil.formatIso8601TimeInTimeRange(timerange, TIME_DIGITS)
    firstNonZeroDigit = 7
    while firstNonZeroDigit gt 3 and timerange[firstNonZeroDigit - 1] eq 0 and timerange[firstNonZeroDigit + TIME_DIGITS - 1] eq 0 do begin
        firstNonZeroDigit -= 1
    endwhile
    switch firstNonZeroDigit of
        2: begin
            return, strmid(ss1,0,10-1) + '/' + strmid(ss2,0,10-1)
        end
        3: begin
            return, strmid(ss1,0,10-1) + '/' + strmid(ss2,0,10-1)
        end
        4: begin
            return, strmid(ss1,0,16-1) + 'Z/' + strmid(ss2,0,16-1) + 'Z'
        end
        5: begin
            return, strmid(ss1,0,16-1) + 'Z/' + strmid(ss2,0,16-1) + 'Z'
        end
        6: begin
            return, strmid(ss1,0,19-1) + 'Z/' + strmid(ss2,0,19-1) + 'Z'
        end
        else:
            return, ss1 + '/' + ss2
        end
    end
end


;+
; return the string as a formatted string, which can be at an offset of seven positions 
; to format the end date.
; @return formatted time "1999-12-31T23:00:00.000000000Z"
; @see #isoTimeFromArray(int[]) 
;
; Parameters:
;   nn - fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
;   offset - 0 or 7
;-
function TimeUtil::formatIso8601TimeInTimeRange, nn, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    switch offset of
        0: begin
            return, TimeUtil.isoTimeFromArray(nn)
        end
        7: begin
            copy = TimeUtil.getStopTime(nn)
            return, TimeUtil.isoTimeFromArray(copy)
        end
        else:
            stop, 'offset must be 0 or 7'
        end
    end
end

;+
; return the string as a formatted string.
; @return formatted time "1999-12-31T23:00:00.000000000Z"
; @see #isoTimeFromArray(int[]) 
;
; Parameters:
;   nn - seven-element array of [ Y m d H M S nanos ]
;-
function TimeUtil::formatIso8601Time, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.isoTimeFromArray(nn)
end

;+
; format the duration into human-readable time, for example
; [ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
; @return ISO8601 duration
;
; Parameters:
;   nn - seven-element array of [ Y m d H M S nanos ]
;-
function TimeUtil::formatIso8601Duration, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    units = ['Y', 'M', 'D', 'H', 'M', 'S']
    if n_elements(nn) gt 7 then stop, 'decomposed time can have at most 7 digits'
    sb = 'P'
    if (n_elements(nn) lt 5):
        n = n_elements(nn)
    else:
        n = 5
    needT = 0
    for i=0,n-1 do begin
        if i eq 3 then needT = 1
        if nn[i] gt 0 then begin
            if needT then begin
                sb = sb + 'T'
                needT = 0
            endif 
            sb = sb + strtrim(nn[i],2) + strtrim(units[i],2)
        endif 
    endfor
    if n_elements(nn) gt 5 and nn[5] gt 0 or n_elements(nn) gt 6 and nn[6] gt 0 or length(sb) eq 2 then begin
        if needT then begin
            sb = sb + 'T'
        endif 
        seconds = nn[5]
        if n_elements(nn) eq 7:
            nanoseconds = nn[6]
        else:
            nanoseconds = 0
        if nanoseconds eq 0 then begin
            sb = sb + strtrim(seconds,2)
        endif else if nanoseconds mod 1000000 eq 0 then begin
            sb = sb + strtrim(string(format='%.3f',seconds + nanoseconds / 1e9),2)
        endif else if nanoseconds mod 1000 eq 0 then begin
            sb = sb + strtrim(string(format='%.6f',seconds + nanoseconds / 1e9),2)
        endif else begin
            sb = sb + strtrim(string(format='%.9f',seconds + nanoseconds / 1e9),2)
        endelse
        endif
        sb = sb + 'S'
    endif 
    if length(sb) eq 1 then begin
        if n_elements(nn) gt 3 then begin
            sb = sb + 'T0S'
        endif else begin
            sb = sb + '0D'
        endelse
    endif 
    return, sb
end



;+
; returns a 7 element array with [year,mon,day,hour,min,sec,nanos]. Note
; this does not allow fractional day, hours or minutes! Examples
; include:<ul>
; <li>P1D - one day
; <li>PT1M - one minute
; <li>PT0.5S - 0.5 seconds
; </ul>
; TODO: there exists more complete code elsewhere.
;
; @return 7-element array with [year,mon,day,hour,min,sec,nanos]
; @throws ParseException if the string does not appear to be valid.
; @see #iso8601duration
; @see #TIME_DIGITS
;
;
; Parameters:
;   stringIn - theISO8601 duration.
;-
function TimeUtil::parseISO8601Duration, stringIn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    m = iso8601DurationPattern.match(stringIn)
    if m!=None then begin
        dsec = TimeUtil.parseDouble(m.group(13), 0)
        sec = int(dsec)
        nanosec = int(((dsec - sec) * 1e9))
        return, [TimeUtil.parseIntegerDeft(m.group(2), 0), TimeUtil.parseIntegerDeft(m.group(4), 0), TimeUtil.parseIntegerDeft(m.group(6), 0), TimeUtil.parseIntegerDeft(m.group(9), 0), TimeUtil.parseIntegerDeft(m.group(11), 0), sec, nanosec]
    endif else begin
        if (strpos(stringIn,'P') ne -1) and (strpos(stringIn,'S') ne -1) and not (strpos(stringIn,'T') ne -1) then begin
            stop, Exception('ISO8601 duration expected but not found.  Was the T missing before S?')
        endif else begin
            stop, Exception('ISO8601 duration expected but not found.')
        endelse
    endelse
end

;+
; return the UTC current time, to the millisecond, in seven components.
; @return the current time, to the millisecond
;-
function TimeUtil::now
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    ctm = ( systime(1)*1000. )
    d = Date(ctm)
    timeZone = TimeZone.getTimeZone('UTC')
    c = Calendar.getInstance(timeZone)
    c.setTime(d)
    return, [c.get(Calendar.YEAR), 1 + c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH), c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE), c.get(Calendar.SECOND), 1000000 * c.get(Calendar.MILLISECOND)]
end

;+
; return seven-element array [ year, months, days, hours, minutes, seconds, nanoseconds ]
; preserving the day of year notation if this was used. See the class
; documentation for allowed time formats, which are a subset of ISO8601
; times.  This also supports "now", "now-P1D", and other simple extensions.  Note
; ISO8601-1:2019 disallows 24:00 to be used for the time, but this is still allowed here.
; The following are valid inputs:<ul>
; <li>2021
; <li>2020-01-01
; <li>2020-01-01Z
; <li>2020-01-01T00Z
; <li>2020-01-01T00:00Z
; <li>2022-W08
; <li>now
; <li>now-P1D
; <li>lastday-P1D
; <li>lasthour-PT1H
; </ul>
;
; @return the decomposed time
; @throws IllegalArgumentException when the time cannot be parsed.
; @see #isoTimeFromArray(int[])
; @see #parseISO8601Time(java.lang.String) 
;
; Parameters:
;   time - isoTime to decompose
;-
function TimeUtil::isoTimeToArray, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if strlen(time) eq 4 then begin
        result = [int(time), 1, 1, 0, 0, 0, 0]
    endif else if (time).startswith('now') or (time).startswith('last') then begin
        remainder = None
        if (time).startswith('now') then begin
            n = TimeUtil.now()
            remainder = strmid(time,3)
        endif else begin
            p = re.compile('last([a-z]+)([\\+|\\-]P.*)?')
            m = p.match(time)
            if m!=None then begin
                n = TimeUtil.now()
                unit = m.group(1)
                remainder = m.group(2)
                switch unit of
                    'year': begin
                        idigit = 1
                        break
                    end
                    'month': begin
                        idigit = 2
                        break
                    end
                    'day': begin
                        idigit = 3
                        break
                    end
                    'hour': begin
                        idigit = 4
                        break
                    end
                    'minute': begin
                        idigit = 5
                        break
                    end
                    'second': begin
                        idigit = 6
                        break
                    end
                    else:
                        stop, 'unsupported unit: ' + unit
                    end
                end
                for id=(1>idigit),DATE_DIGITS-1 do begin
                    n[id] = 1
                endfor
                for id=(DATE_DIGITS>idigit),TIME_DIGITS-1 do begin
                    n[id] = 0
                endfor
            endif else begin
                stop, 'expected lastday+P1D, etc'
            endelse
        endelse
        if remainder is None or strlen(remainder) eq 0 then begin
            return, n
        endif else if strmid(remainder,0,1) eq '-' then begin
            try:
                return, TimeUtil.subtract(n, TimeUtil.parseISO8601Duration(strmid(remainder,1)))
            except ParseException, ex:
                stop, ex
        endif else if strmid(remainder,0,1) eq '+' then begin
            try:
                return, TimeUtil.add(n, TimeUtil.parseISO8601Duration(strmid(remainder,1)))
            except ParseException, ex:
                stop, ex
        endif
        return, TimeUtil.now()
    endif else begin
        if strlen(time) lt 7 then begin
            stop, 'time must have 4 or greater than 7 characters'
        endif 
        if strmid(time,4,1).isdigit() and strmid(time,5,1).isdigit() then begin
            stop, 'date and time must contain delimiters between fields'
        endif 
        if strlen(time) eq 7 then begin
            if strmid(time,4,1) eq 'W' then begin
                ;+
                ; 2022W08
                ;-
                year = TimeUtil.parseInteger(strmid(time,0,4-1))
                week = TimeUtil.parseInteger(strmid(time,5))
                result = [year, 0, 0, 0, 0, 0, 0]
                TimeUtil.fromWeekOfYear(year, week, result)
                time = ''
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4-1)), TimeUtil.parseInteger(strmid(time,5,7-1)), 1, 0, 0, 0, 0]
                time = ''
            endelse
        endif else if strlen(time) eq 8 then begin
            if strmid(time,5,1) eq 'W' then begin
                ;+
                ; 2022-W08
                ;-
                year = TimeUtil.parseInteger(strmid(time,0,4-1))
                week = TimeUtil.parseInteger(strmid(time,6))
                result = [year, 0, 0, 0, 0, 0, 0]
                TimeUtil.fromWeekOfYear(year, week, result)
                time = ''
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4-1)), 1, TimeUtil.parseInteger(strmid(time,5,8-1)), 0, 0, 0, 0]
                time = ''
            endelse
        endif else if strmid(time,8,1) eq 'T' then begin
            if strmid(time,4,1).isdigit() then begin
                result = [TimeUtil.parseInteger(strmid(time,0,4-1)), TimeUtil.parseInteger(strmid(time,4,6-1)), TimeUtil.parseInteger(strmid(time,6,8-1)), 0, 0, 0, 0]
                time = strmid(time,9)
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4-1)), 1, TimeUtil.parseInteger(strmid(time,5,8-1)), 0, 0, 0, 0]
                time = strmid(time,9)
            endelse
        endif else if strmid(time,8,1) eq 'Z' then begin
            result = [TimeUtil.parseInteger(strmid(time,0,4-1)), 1, TimeUtil.parseInteger(strmid(time,5,8-1)), 0, 0, 0, 0]
            time = strmid(time,9)
        endif else begin
            result = [TimeUtil.parseInteger(strmid(time,0,4-1)), TimeUtil.parseInteger(strmid(time,5,7-1)), TimeUtil.parseInteger(strmid(time,8,10-1)), 0, 0, 0, 0]
            if strlen(time) eq 10 then begin
                time = ''
            endif else begin
                time = strmid(time,11)
            endelse
        endelse
        endif
        endif
        if time.endswith('Z') then begin
            time = strmid(time,0,strlen(time) - 1-1)
        endif 
        if strlen(time) ge 2 then begin
            result[3] = TimeUtil.parseInteger(strmid(time,0,2-1))
        endif 
        if strlen(time) ge 5 then begin
            result[4] = TimeUtil.parseInteger(strmid(time,3,5-1))
        endif 
        if strlen(time) ge 8 then begin
            result[5] = TimeUtil.parseInteger(strmid(time,6,8-1))
        endif 
        if strlen(time) gt 9 then begin
            result[6] = int((10^(18 - strlen(time)))) * TimeUtil.parseInteger(strmid(time,9))
        endif 
        TimeUtil.normalizeTime(result)
    endelse
    return, result
end

;+
; Rewrite the time using the format of the example time, which must start with
; $Y-$jT, $Y-$jZ, or $Y-$m-$d. For example,
; <pre>
; {@code
; from org.hapiserver.TimeUtil import *
; print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
; }
; </pre> This allows direct comparisons of times for sorting. 
; This works by looking at the character in the 8th position (starting with zero) of the 
; exampleForm to see if a T or Z is present (YYYY-jjjTxxx).
;
; TODO: there's
; an optimization here, where if input and output are both $Y-$j or both
; $Y-$m-$d, then we need not break apart and recombine the time
; (isoTimeToArray call can be avoided).
;
; @return same time but in the same form as exampleForm.
;
; Parameters:
;   exampleForm - isoTime string.
;   time - the time in any allowed isoTime format
;-
function TimeUtil::reformatIsoTime, exampleForm, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    c = strmid(exampleForm,8,1)
    nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time))
    switch c of
        'T': begin
            ;+
            ; $Y-$jT
            ;-
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = string(format='%d-%03dT%02d:%02d:%02d.%09dZ',nn[0], nn[2], nn[3], nn[4], nn[5], nn[6])
            break
        end
        'Z': begin
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = string(format='%d-%03dZ',nn[0], nn[2])
            break
        end
        else:
            if strlen(exampleForm) eq 10 then begin
                c = 'Z'
            endif else begin
                c = strmid(exampleForm,10,1)
            endelse

            if c eq 'T' then begin
                ;+
                ; $Y-$jT
                ;-
                time = string(format='%d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
            endif else if c eq 'Z' then begin
                time = string(format='%d-%02d-%02dZ',nn[0], nn[1], nn[2])

            break
        end
    end
    if exampleForm.endswith('Z') then begin
        return, strmid(time,0,strlen(exampleForm) - 1-1) + 'Z'
    endif else begin
        return, strmid(time,0,strlen(exampleForm)-1)
    endelse
end



;+
; this returns true or throws an IllegalArgumentException indicating the problem.
; @return true or throws an IllegalArgumentException
;
; Parameters:
;   time - the seven-component time.
;-
function TimeUtil::isValidTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    year = time[0]
    if year lt VALID_FIRST_YEAR then stop, 'invalid year at position 0'
    if year gt VALID_LAST_YEAR then stop, 'invalid year at position 0'
    month = time[1]
    if month lt 1 then stop, 'invalid month at position 1'
    if month gt 12 then stop, 'invalid month at position 1'
    if TimeUtil.isLeapYear(year):
        leap = 1
    else:
        leap = 0
    dayOfMonth = time[2]
    if month gt 1 then begin
        if dayOfMonth gt DAYS_IN_MONTH[leap][month] then begin
            stop, 'day of month is too large at position 2'
        endif 
    endif else begin
        if dayOfMonth gt DAY_OFFSET[leap][13] then begin
            stop, 'day of year is too large at position 2'
        endif 
    endelse
    if dayOfMonth lt 1 then stop, 'day is less than 1 at position 2'
    return, 1
end

;+
; return the number of days in the month.
; @return the number of days in the month.
; @see #isLeapYear(int) 
;
; Parameters:
;   year - the year
;   month - the month
;-
function TimeUtil::daysInMonth, year, month
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if TimeUtil.isLeapYear(year):
        leap = 1
    else:
        leap = 0
    return, DAYS_IN_MONTH[leap][month]
end

;+
; normalize the decomposed (seven digit) time by expressing day of year and month and day
; of month, and moving hour="24" into the next day. This also handles day
; increment or decrements, by:<ul>
; <li>handle day=0 by decrementing month and adding the days in the new
; month.
; <li>handle day=32 by incrementing month.
; <li>handle negative components by borrowing from the next significant.
; </ul>
; Note that [Y,1,dayOfYear,...] is accepted, but the result will be Y,m,d.
;
; Parameters:
;   time - the seven-component time Y,m,d,H,M,S,nanoseconds
;-
pro TimeUtil::normalizeTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    while time[6] ge 1000000000 do begin
        time[5] += 1
        time[6] -= 1000000000
    endwhile
    while time[5] gt 59 do begin
        ;+
        ; TODO: leap seconds?
        ;-
        time[4] += 1
        time[5] -= 60
    endwhile
    while time[4] gt 59 do begin
        time[3] += 1
        time[4] -= 60
    endwhile
    while time[3] ge 24 do begin
        time[2] += 1
        time[3] -= 24
    endwhile
    if time[6] lt 0 then begin
        time[5] -= 1
        time[6] += 1000000000
    endif 
    if time[5] lt 0 then begin
        time[4] -= 1
        ;+
        ; take a minute
        ;-
        time[5] += 60
    endif 
    if time[4] lt 0 then begin
        time[3] -= 1
        ;+
        ; take an hour
        ;-
        time[4] += 60
    endif 
    if time[3] lt 0 then begin
        time[2] -= 1
        ;+
        ; take a day
        ;-
        time[3] += 24
    endif 
    if time[2] lt 1 then begin
        time[1] -= 1
        ;+
        ; take a month
        ;-
        if time[1] eq 0 then begin
            daysInMonth = 31
        endif else begin
            if TimeUtil.isLeapYear(time[0]) then begin
                ;+
                ; This was  TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]] . TODO: review!
                ;-
                daysInMonth = TimeUtil.DAYS_IN_MONTH[1][time[1]]
            endif else begin
                daysInMonth = TimeUtil.DAYS_IN_MONTH[0][time[1]]
            endelse
        endelse
        time[2] += daysInMonth
    endif 
    if time[1] lt 1 then begin
        time[0] -= 1
        ;+
        ; take a year
        ;-
        time[1] += 12
    endif 
    if time[3] gt 24 then begin
        stop, 'time[3] is greater than 24 (hours)'
    endif 
    if time[1] gt 12 then begin
        time[0] += 1
        time[1] -= 12
    endif 
    if time[1] eq 12 and time[2] gt 31 and time[2] lt 62 then begin
        time[0] += 1
        time[1] = 1
        time[2] -= 31
        return
    endif 
    if TimeUtil.isLeapYear(time[0]):
        leap = 1
    else:
        leap = 0
    if time[2] eq 0 then begin
        ;+
        ;TODO: tests don't hit this branch, and I'm not sure it can occur.
        ;-
        time[1] -= 1
        if time[1] eq 0 then begin
            time[0] -= 1
            time[1] = 12
        endif 
        time[2] = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
    endif 
    d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
    while time[2] gt d do begin
        time[1] += 1
        time[2] -= d
        if time[1] gt 12 then begin
            time[0] += 1
            time[1] -= 12
        endif 
        d = TimeUtil.DAYS_IN_MONTH[leap][time[1]]
    endwhile
end

;+
; return the julianDay for the year month and day. This was verified
; against another calculation (julianDayWP, commented out above) from
; http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
; operations.
;
; @return the Julian day
; @see #fromJulianDay(int) 
;
; Parameters:
;   year - calendar year greater than 1582.
;   month - the month number 1 through 12.
;   day - day of month. For day of year, use month=1 and doy for day.
;-
function TimeUtil::julianDay, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if year le 1582 then begin
        stop, 'year must be more than 1582'
    endif 
    jd = 367 * year - 7 * (year + (month + 9) / 12) / 4 - 3 * ((year + (month - 9) / 7) / 100 + 1) / 4 + 275 * month / 9 + day + 1721029
    return, jd
end

;+
; Break the Julian day apart into month, day year. This is based on
; http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
; introduced when toTimeStruct failed when the year was 1886.
;
; @see #julianDay( int year, int mon, int day )
; initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
; @return a TimeStruct with the month, day and year fields set.
;
; Parameters:
;   julian - the (integer) number of days that have elapsed since the
;-
function TimeUtil::fromJulianDay, julian
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    j = julian + 32044
    g = j / 146097
    dg = j mod 146097
    c = (dg / 36524 + 1) * 3 / 4
    dc = dg - c * 36524
    b = dc / 1461
    db = dc mod 1461
    a = (db / 365 + 1) * 3 / 4
    da = db - a * 365
    y = g * 400 + c * 100 + b * 4 + a
    m = (da * 5 + 308) / 153 - 2
    d = da - (m + 4) * 153 / 5 + 122
    Y = y - 4800 + (m + 2) / 12
    M = (m + 2) mod 12 + 1
    D = d + 1
    result = replicate(0,TIME_DIGITS)
    result[0] = Y
    result[1] = M
    result[2] = D
    result[3] = 0
    result[4] = 0
    result[5] = 0
    result[6] = 0
    return, result
end

;+
; calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
; 2022-03-12 is a Saturday, so 5 is returned.
; @return the day of the week.
;
; Parameters:
;   year - the year
;   month - the month
;   day - the day of the month
;-
function TimeUtil::dayOfWeek, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    jd = TimeUtil.julianDay(year, month, day)
    daysSince2022 = jd - TimeUtil.julianDay(2022, 1, 1)
    mod7 = (daysSince2022 - 2) mod 7
    if mod7 lt 0 then mod7 = mod7 + 7
    return, mod7
end

;+
; calculate the week of year, inserting the month into time[1] and day into time[2]
; for the Monday which is the first day of that week.  Note week 0 is excluded from
; ISO8601, but since the Linux date command returns this in some cases, it is allowed to
; mean the same as week 52 of the previous year.  See 
; <a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
; 
;
; Parameters:
;   year - the year of the week.
;   weekOfYear - the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
;   time - the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
;-
pro TimeUtil::fromWeekOfYear, year, weekOfYear, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time[0] = year
    day = TimeUtil.dayOfWeek(year, 1, 1)
    if day lt 4 then begin
        doy = (weekOfYear * 7 - 7 - day) + 1
        if doy lt 1 then begin
            time[0] = time[0] - 1
            if TimeUtil.isLeapYear(time[0]) then begin
                ;+
                ; was  doy= doy + ( isLeapYear(time[0]) ? 366 : 365 );  TODO: verify
                ;-
                doy = doy + 366
            endif else begin
                doy = doy + 365
            endelse
        endif 
    endif else begin
        doy = weekOfYear * 7 - day + 1
    endelse
    time[1] = 1
    time[2] = doy
    TimeUtil.normalizeTime(time)
end

;+
; use consistent naming so that the parser is easier to find.
; @return seven-element decomposed time [ Y, m, d, H, M, S, N ]
; @throws ParseException when the string cannot be parsed.
; @see #isoTimeToArray(java.lang.String) 
;
; Parameters:
;   string - iso8601 time like "2022-03-12T11:17" (Z is assumed).
;-
function TimeUtil::parseISO8601Time, string
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.isoTimeToArray(string)
end

;+
; return true if the time appears to be properly formatted.  Properly formatted strings include:<ul>
; <li>Any supported ISO8601 time
; <li>2000 and 2000-01 (just a year and month)
; <li>now - the current time reported by the processing system
; <li>lastyear - last year boundary
; <li>lastmonth - last month boundary
; <li>lastday - last midnight boundary
; <li>lasthour - last midnight boundary
; <li>now-P1D - yesterday at this time
; <li>lastday-P1D - yesterday midnight boundary
; </ul>
; @return true if the time appears to be valid and will parse.
;
; Parameters:
;   time;-
function TimeUtil::isValidFormattedTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, strlen(time) gt 0 and (strmid(time,0,1).isdigit() or strmid(time,0,1) eq 'P' or (time).startswith('now') or (time).startswith('last'))
end

;+
; parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
; start and stop times, returned in a 14 element array of ints.
; @return the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
; @throws ParseException when the string cannot be used
;
; Parameters:
;   stringIn - string to parse, like "1998-01-02/1998-01-17"
;-
function TimeUtil::parseISO8601TimeRange, stringIn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    ss = strsplit(stringIn,'/',/extract)
    if n_elements(ss) ne 2 then begin
        stop, 'expected one slash (/) splitting start and stop times.'
    endif 
    if not TimeUtil.isValidFormattedTime(ss[0]) then begin
        stop, 'first time/duration is misformatted.  Should be ISO8601 time or duration like P1D.'
    endif 
    if not TimeUtil.isValidFormattedTime(ss[1]) then begin
        stop, 'second time/duration is misformatted.  Should be ISO8601 time or duration like P1D.'
    endif 
    result = replicate(0,14)
    if (ss[0]).startswith('P') then begin
        duration = TimeUtil.parseISO8601Duration(ss[0])
        time = TimeUtil.isoTimeToArray(ss[1])
        for i=0,TIME_DIGITS-1 do begin
            result[i] = time[i] - duration[i]
        endfor
        TimeUtil.normalizeTime(result)
        TimeUtil.setStopTime(time, result)
        return, result
    endif else if (ss[1]).startswith('P') then begin
        time = TimeUtil.isoTimeToArray(ss[0])
        duration = TimeUtil.parseISO8601Duration(ss[1])
        TimeUtil.setStartTime(time, result)
        stoptime = replicate(0,TIME_DIGITS)
        for i=0,TIME_DIGITS-1 do begin
            stoptime[i] = time[i] + duration[i]
        endfor
        TimeUtil.normalizeTime(stoptime)
        TimeUtil.setStopTime(stoptime, result)
        return, result
    endif else begin
        starttime = TimeUtil.isoTimeToArray(ss[0])
        if strlen(ss[1]) eq strlen(ss[0]) then begin
            stoptime = TimeUtil.isoTimeToArray(ss[1])
        endif else begin
            if (strpos(ss[1],'T') ne -1) then begin
                stoptime = TimeUtil.isoTimeToArray(ss[1])
            endif else begin
                partToShare = strlen(ss[0]) - strlen(ss[1])
                stoptime = TimeUtil.isoTimeToArray(strmid(ss[0],0,partToShare-1) + ss[1])
            endelse
        endelse
        TimeUtil.setStartTime(starttime, result)
        TimeUtil.setStopTime(stoptime, result)
        return, result
    endelse
end

;+
; subtract the offset from the base time.
;
; @return a time
;
; Parameters:
;   base - a time
;   offset - offset in each component.
;-
function TimeUtil::subtract, base, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TIME_DIGITS)
    for i=0,TIME_DIGITS-1 do begin
        result[i] = base[i] - offset[i]
    endfor
    if result[0] gt 400 then begin
        TimeUtil.normalizeTime(result)
    endif 
    return, result
end

;+
; add the offset to the base time. This should not be used to combine two
; offsets, because the code has not been verified for this use.
;
; @return a time
;
; Parameters:
;   base - a time
;   offset - offset in each component.
;-
function TimeUtil::add, base, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TIME_DIGITS)
    for i=0,TIME_DIGITS-1 do begin
        result[i] = base[i] + offset[i]
    endfor
    TimeUtil.normalizeTime(result)
    return, result
end

;+
; true if t1 is after t2.
; @return true if t1 is after t2.
;
; Parameters:
;   t1 - seven-component time
;   t2 - seven-component time
;-
function TimeUtil::gt, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil.normalizeTime(t1)
    TimeUtil.normalizeTime(t2)
    for i=0,TimeUtil.TIME_DIGITS-1 do begin
        if t1[i] gt t2[i] then begin
            return, 1
        endif else if t1[i] lt t2[i] then begin
            return, 0
    endfor
    return, 0
end

;+
; true if t1 is equal to t2.
; @return true if t1 is equal to t2.
;
; Parameters:
;   t1 - seven-component time
;   t2 - seven-component time
;-
function TimeUtil::eq, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil.normalizeTime(t1)
    TimeUtil.normalizeTime(t2)
    for i=0,TimeUtil.TIME_DIGITS-1 do begin
        if t1[i] ne t2[i] then begin
            return, 0
        endif 
    endfor
    return, 1
end

;+
; format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
; @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
; @see #formatIso8601TimeInTimeRangeBrief(int[] time, int offset ) 
;
; Parameters:
;   time - seven element time range
;-
function TimeUtil::formatIso8601TimeBrief, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0)
end


;+
; format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
; @return formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
; @see #formatIso8601TimeBrief(int[]) 
;
; Parameters:
;   time - seven element time range
;   offset - the offset into the time array (7 for stop time in 14-element range array).
;-
function TimeUtil::formatIso8601TimeInTimeRangeBrief, time, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    stime = TimeUtil.formatIso8601TimeInTimeRange(time, offset)
    nanos = time[COMPONENT_NANOSECOND + offset]
    micros = nanos mod 1000
    millis = nanos mod 10000000
    if nanos eq 0 then begin
        if time[5 + offset] eq 0 then begin
            return, strmid(stime,0,16-1) + 'Z'
        endif else begin
            return, strmid(stime,0,19-1) + 'Z'
        endelse
    endif else begin
        if millis eq 0 then begin
            return, strmid(stime,0,23-1) + 'Z'
        endif else if micros eq 0 then begin
            return, strmid(stime,0,26-1) + 'Z'
        endif else begin
            return, stime
        endelse
    endelse
end

;+
; return the next interval, given the 14-component time interval.  This
; has the restrictions:<ul>
; <li> can only handle intervals of at least one second
; <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
; <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
; </ul>
; @return 14-component time interval.
;
; Parameters:
;   timerange - 14-component time interval.
;-
function TimeUtil::nextRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil.TIME_RANGE_DIGITS)
    width = replicate(0,TimeUtil.TIME_DIGITS)
    for i=0,TimeUtil.TIME_DIGITS-1 do begin
        width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i]
    endfor
    if width[5] lt 0 then begin
        width[5] = width[5] + 60
        width[4] = width[4] - 1
    endif 
    if width[4] lt 0 then begin
        width[4] = width[4] + 60
        width[3] = width[3] - 1
    endif 
    if width[3] lt 0 then begin
        width[3] = width[3] + 24
        width[2] = width[2] - 1
    endif 
    if width[2] lt 0 then begin
        daysInMonth = TimeUtil.daysInMonth(timerange[COMPONENT_YEAR], timerange[COMPONENT_MONTH])
        width[2] = width[2] + daysInMonth
        width[1] = width[1] - 1
    endif 
    if width[1] lt 0 then begin
        width[1] = width[1] + 12
        width[0] = width[0] - 1
    endif 
    ;+
    ; System.arraycopy( range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
    ;-
    TimeUtil.setStartTime(TimeUtil.getStopTime(timerange), result)
    ;+
    ; This creates an extra array, but let's not worry about that.
    ;-
    TimeUtil.setStopTime(TimeUtil.add(TimeUtil.getStopTime(timerange), width), result)
    return, result
end

;+
; return the previous interval, given the 14-component time interval.  This
; has the restrictions:<ul>
; <li> can only handle intervals of at least one second
; <li> must be only one component which increments (20 days, but not 20 days and 12 hours)
; <li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
; </ul>
; @return 14-component time interval.
;
; Parameters:
;   timerange - 14-component time interval.
;-
function TimeUtil::previousRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil.TIME_RANGE_DIGITS)
    width = replicate(0,TimeUtil.TIME_DIGITS)
    for i=0,TimeUtil.TIME_DIGITS-1 do begin
        width[i] = timerange[i + TimeUtil.TIME_DIGITS] - timerange[i]
    endfor
    if width[5] lt 0 then begin
        width[5] = width[5] + 60
        width[4] = width[4] - 1
    endif 
    if width[4] lt 0 then begin
        width[4] = width[4] + 60
        width[3] = width[3] - 1
    endif 
    if width[3] lt 0 then begin
        width[3] = width[3] + 24
        width[2] = width[2] - 1
    endif 
    if width[2] lt 0 then begin
        daysInMonth = TimeUtil.daysInMonth(timerange[COMPONENT_YEAR], timerange[COMPONENT_MONTH])
        width[2] = width[2] + daysInMonth
        width[1] = width[1] - 1
    endif 
    if width[1] lt 0 then begin
        width[1] = width[1] + 12
        width[0] = width[0] - 1
    endif 
    TimeUtil.setStopTime(TimeUtil.getStartTime(timerange), result)
    TimeUtil.setStartTime(TimeUtil.subtract(TimeUtil.getStartTime(timerange), width), result)
    return, result
end

;+
; return true if this is a valid time range having a non-zero width.
; @return 
;
; Parameters:
;   timerange;-
function TimeUtil::isValidTimeRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    start = TimeUtil.getStartTime(timerange)
    stop = TimeUtil.getStopTime(timerange)
    return, TimeUtil.isValidTime(start) and TimeUtil.isValidTime(stop) and TimeUtil.gt(stop, start)
end

pro TimeUtil__define
; pass
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil_VERSION='20240730.1'
    TimeUtil_TIME_DIGITS=7
    TimeUtil_DATE_DIGITS=3
    TimeUtil_TIME_RANGE_DIGITS=14
    TimeUtil_COMPONENT_YEAR=0
    TimeUtil_COMPONENT_MONTH=1
    TimeUtil_COMPONENT_DAY=2
    TimeUtil_COMPONENT_HOUR=3
    TimeUtil_COMPONENT_MINUTE=4
    TimeUtil_COMPONENT_SECOND=5
    TimeUtil_COMPONENT_NANOSECOND=6
    TimeUtil_DAYS_IN_MONTH=[[0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0], [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 0]]
    TimeUtil_DAY_OFFSET=[[0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365], [0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]]
    TimeUtil_MONTH_NAMES=['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    TimeUtil_MONTH_NAMES_FULL=['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    TimeUtil_FORMATTER_MS_1970=DateTimeFormatterBuilder().appendInstant(3).toFormatter()
    TimeUtil_iso8601duration='P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?(\\d*?\\.?\\d*)S)?)?'
    TimeUtil_iso8601DurationPattern=re.compile('P((\\d+)Y)?((\\d+)M)?((\\d+)D)?(T((\\d+)H)?((\\d+)M)?((\\d*?\\.?\\d*)S)?)?')
    TimeUtil_VALID_FIRST_YEAR=1900
    TimeUtil_VALID_LAST_YEAR=2100

    dummy={TimeUtil,dummy:0}
    return
end


