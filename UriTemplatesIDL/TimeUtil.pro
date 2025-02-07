function isAlpha, char
  char_code = BYTE(char)
  return, (char_code GE 65 AND char_code LE 90) OR  (char_code GE 97 AND char_code LE 122)
end
function isDigit, char
  char_code = BYTE(char)
  return, (char_code GE 48 AND char_code LE 58)
end









;+
;Utilities for times in IsoTime strings (limited set of ISO8601 times)
;Examples of isoTime strings include:<ul>
;<li>2020-04-21Z
;<li>2020-04-21T12:20Z
;<li>2020-04-21T23:45:67.000000001Z (nanosecond limit)
;<li>2020-112Z (day-of-year instead of $Y-$m-$d)
;<li>2020-112T23:45:67.000000001 (note Z is assumed)
;</ul>
;
;@author jbf
;-

















;+
;fast parser requires that each character of string is a digit.  Note this
;does not check the the numbers are digits!
;
;
; Parameters:
;   s - string containing an integer
;
; Returns:
;   the integer
;-
function TimeUtil::parseInteger, s
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    length = strlen(s)
    for i=0,length-1 do begin
        c = strmid(s,i,1)
        if long(byte(c)) lt 48 or long(byte(c)) ge 58 then begin
            stop, !error_state.msg
        endif 
    endfor
    SWITCH length OF
        2: BEGIN
            result = 10 * (long(byte(strmid(s,0,1))) - 48) + (long(byte(strmid(s,1,1))) - 48)
            return, result
        END
        3: BEGIN
            result = 100 * (long(byte(strmid(s,0,1))) - 48) + 10 * (long(byte(strmid(s,1,1))) - 48) + (long(byte(strmid(s,2,1))) - 48)
            return, result
        END
        ELSE: BEGIN
            result = 0
            for i=0,strlen(s)-1 do begin
                result = 10 * result + (long(byte(strmid(s,i,1))) - 48)
            endfor

            return, result
        END
    ENDSWITCH
end

;+
;fast parser requires that each character of string is a digit.
;
;
; Parameters:
;   s - the number, containing 1 or more digits.
;   deft - the number to return when s is missing.
;
; Returns:
;   the int value
;-
function TimeUtil::parseIntegerDeft, s, deft
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(s) eq 0 then begin
        return, deft
    endif 
    return, long(s)
end

function TimeUtil::parseDouble, val, deft
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(val) eq 0 then begin
        if deft ne -99 then begin
            return, deft
        endif else begin
            stop, !error_state.msg
        endelse
    endif 
    n = strlen(val) - 1
    if isAlpha(strmid(val,n,1)) then begin
        return, float(strmid(val,0,n))
    endif else begin
        return, float(val)
    endelse
end

;+
;return the seven element start time from the time range.  Note
;it is fine to use a time range as the start time, because codes
;will only read the first seven components, and this is only added
;to make code more readable.
;
; Parameters:
;   timerange - a fourteen-element time range.
;
; Returns:
;   the start time.
;-
function TimeUtil::getStartTime, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_DIGITS)
    result[0:(TimeUtil_TIME_DIGITS-1)]=timerange[0:(TimeUtil_TIME_DIGITS-1)]
    return, result
end

;+
;return the seven element stop time from the time range.  Note
;it is fine to use a time range as the start time, because codes
;will only read the first seven components.
;
; Parameters:
;   timerange - a fourteen-element time range.
;
; Returns:
;   the stop time.
;-
function TimeUtil::getStopTime, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_DIGITS)
    result[0:(TimeUtil_TIME_DIGITS-1)]=timerange[TimeUtil_TIME_DIGITS:2*TimeUtil_TIME_DIGITS-1]
    return, result
end

;+
;copy the components of time into the start position (indeces 7-14) of the time range.
;This one-line method was introduced to clarify code and make conversion to
;other languages (in particular Python) easier.
;
; Parameters:
;   time - the seven-element start time
;   timerange - the fourteen-element time range.
;-
pro TimeUtil::setStartTime, time, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(timerange) ne 14 then begin
        stop, !error_state.msg
    endif 
    timerange[0:(TimeUtil_TIME_DIGITS-1)]=time[0:(TimeUtil_TIME_DIGITS-1)]
end

;+
;copy the components of time into the stop position (indeces 7-14) of the time range.
;
; Parameters:
;   time - the seven-element stop time
;   timerange - the fourteen-element time range.
;-
pro TimeUtil::setStopTime, time, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if n_elements(timerange) ne 14 then begin
        stop, !error_state.msg
    endif 
    timerange[TimeUtil_TIME_DIGITS:2*TimeUtil_TIME_DIGITS-1]=time[0:(TimeUtil_TIME_DIGITS-1)]
end



;+
;format the time as (non-leap) milliseconds since 1970-01-01T00:00.000Z into a string.  The
;number of milliseconds should not include leap seconds.  The output will always include
;milliseconds.
;
;
; Parameters:
;   time - the number of milliseconds since 1970-01-01T00:00.000Z
;
; Returns:
;   the formatted time.
;
; See:
;    #toMillisecondsSince1970(java.lang.String)

;-
function TimeUtil::fromMillisecondsSince1970, time
    compile_opt idl2, static
    jul= floor( time / 86400000 ) + 2440588L
    caldat, jul, month, day, year
    ms= time mod 86400000
    if ms lt 0 then ms= ms + 86400000
    ms= long(ms)
    h= ms / 3600000
    ms= ms - h * 3600000
    m= ms / 60000
    ms= ms - m * 60000
    s= ms / 1000
    ms= ms - s * 1000
    result= STRING( format='%04d-%02d-%02dT%02d:%02d:%02d.%03dZ', year, month, day, h, m, s, ms ) 
    return, result
end

;+
;given the two times, return a 14 element time range.
;@throws IllegalArgumentException when the first time is greater than or equal to the second time.
;
; Parameters:
;   t1 - a seven digit time
;   t2 - a seven digit time after the first time.
;
; Returns:
;   a fourteen digit time range.
;-
function TimeUtil::createTimeRange, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if not(TimeUtil.gt_(t2, t1)) then begin
        stop, !error_state.msg
    endif 
    result = replicate(0,TimeUtil_TIME_DIGITS * 2)
    TimeUtil.setStartTime,t1, result
    TimeUtil.setStopTime,t2, result
    return, result
end

;+
;true if the year between 1582 and 2400 is a leap year.
;
; Parameters:
;   year - the year
;
; Returns:
;   true if the year between 1582 and 2400 is a leap year.
;-
function TimeUtil::isLeapYear, year
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if year lt 1582 or year gt 2400 then begin
        stop, !error_state.msg
    endif 
    return, (year mod 4) eq 0 and (year mod 400 eq 0 or year mod 100 ne 0)
end

;+
;return the English month name, abbreviated to three letters, for the
;month number.
;
;
; Parameters:
;   i - month number, from 1 to 12.
;
; Returns:
;   the month name, like "Jan" or "Dec"
;-
function TimeUtil::monthNameAbbrev, i
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil_MONTH_NAMES[i]
end

;+
;return the English month name, abbreviated to three letters, for the
;month number.
;
;
; Parameters:
;   i - month number, from 1 to 12.
;
; Returns:
;   the month name, like "January" or "December"
;-
function TimeUtil::monthNameFull, i
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil_MONTH_NAMES_FULL[i]
end

;+
;return the month number for the English month name, such as "Jan" (1) or
;"December" (12). The first three letters are used to look up the number,
;and must be one of: "Jan", "Feb", "Mar", "Apr", "May", "Jun",
;"Jul", "Aug", "Sep", "Oct", "Nov", or "Dec" (case insensitive).
;@throws ParseException when month name is not recognized.
;
; Parameters:
;   s - the name (case-insensitive, only the first three letters are used.)
;
; Returns:
;   the number, for example 1 for "January"
;-
function TimeUtil::monthNumber, s
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if strlen(s) lt 3 then begin
        stop, !error_state.msg
    endif 
    s = strmid(s,0,3)
    for i=1,12 do begin
        if strcmp(s,TimeUtil_MONTH_NAMES[i],/FOLD_CASE) then begin
            return, i
        endif 
    endfor
    stop, !error_state.msg
end

;+
;return the day of year for the given year, month, and day. For example, in
;Jython:
;<pre>
;{@code
;from org.hapiserver.TimeUtil import *
;print dayOfYear( 2020, 4, 21 ) # 112
;}
;</pre>
;
;
; Parameters:
;   year - the year
;   month - the month, from 1 to 12.
;   day - the day in the month.
;
; Returns:
;   the day of year.
;-
function TimeUtil::dayOfYear, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if month eq 1 then begin
        return, day
    endif 
    if month lt 1 then begin
        stop, !error_state.msg
    endif 
    if month gt 12 then begin
        stop, !error_state.msg
    endif 
    if day gt 366 then begin
        stop, !error_state.msg
    endif 
    leap = (TimeUtil.isLeapYear(year)) ? 1 : 0
    return, TimeUtil_DAY_OFFSET[month,leap] + day
end

;+
;return "2" (February) for 45 for example.
;
; Parameters:
;   year - the year
;   doy - the day of year.
;
; Returns:
;   the month 1-12 of the day.
;-
function TimeUtil::monthForDayOfYear, year, doy
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    leap = (TimeUtil.isLeapYear(year)) ? 1 : 0
    dayOffset = TimeUtil_DAY_OFFSET[*,leap]
    if doy lt 1 then begin
        stop, !error_state.msg
    endif 
    if doy gt dayOffset[13] then begin
        stop, !error_state.msg
    endif 
    for i=12,2,-1 do begin
        if dayOffset[i] lt doy then begin
            return, i
        endif 
    endfor
    return, 1
end

;+
;count off the days between startTime and stopTime, but not including
;stopTime.  For example, countOffDays("1999-12-31Z", "2000-01-03Z")
;will return [ "1999-12-31Z", "2000-01-01Z", "2000-01-02Z" ].
;
;
; Parameters:
;   startTime - an iso time string
;   stopTime - an iso time string
;
; Returns:
;   array of times, complete days, in the form $Y-$m-$dZ
;-
function TimeUtil::countOffDays, startTime, stopTime
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    catch, err
    if err eq 0 then begin
        t1 = TimeUtil.parseISO8601Time(startTime)
        t2 = TimeUtil.parseISO8601Time(stopTime)
    endif else begin
        stop, !error_state.msg
    endelse
    catch, /cancel
    j1 = TimeUtil.julianDay(t1[0], t1[1], t1[2])
    j2 = TimeUtil.julianDay(t2[0], t2[1], t2[2])
    result = replicate('',j2 - j1)
    time = strmid(TimeUtil.normalizeTimeString(startTime),0,10) + 'Z'
    stopTime = strmid(TimeUtil.floor(stopTime),0,10) + 'Z'
    i = 0
    nn = TimeUtil.isoTimeToArray(time)
    WHILE time lt stopTime DO BEGIN
        result[i] = time
        nn[2] = nn[2] + 1
        if nn[2] gt 28 then begin
            TimeUtil.normalizeTime,nn
        endif 
        time = string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
        i += 1
    ENDWHILE
    return, result
end

;+
;return the next day boundary. Note hours, minutes, seconds and
;nanoseconds are ignored.
;
;
; Parameters:
;   day - any isoTime format string.
;
; Returns:
;   the next day in $Y-$m-$dZ
;
; See:
;    #ceil(java.lang.String)
;    #previousDay(java.lang.String)

;-
function TimeUtil::nextDay, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(day)
    nn[2] = nn[2] + 1
    TimeUtil.normalizeTime,nn
    return, string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
end

;+
;return the previous day boundary. Note hours, minutes, seconds and
;nanoseconds are ignored.
;
;
; Parameters:
;   day - any isoTime format string.
;
; Returns:
;   the next day in $Y-$m-$dZ
;
; See:
;    #floor(java.lang.String)
;    #nextDay(java.lang.String)

;-
function TimeUtil::previousDay, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(day)
    nn[2] = nn[2] - 1
    TimeUtil.normalizeTime,nn
    return, string(format='%04d-%02d-%02dZ',nn[0], nn[1], nn[2])
end

;+
;return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
;value (normalized) if we are already at a boundary.
;
;
; Parameters:
;   time - any isoTime format string.
;
; Returns:
;   the next midnight or the value if already at midnight.
;-
function TimeUtil::ceil, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time = TimeUtil.normalizeTimeString(time)
    if strmid(time,11) eq '00:00:00.000000000Z' then begin
        return, time
    endif else begin
        return, strmid(TimeUtil.nextDay(strmid(time,0,11)),0,10) + 'T00:00:00.000000000Z'
    endelse
end

;+
;return the $Y-$m-$dT00:00:00.000000000Z of the next boundary, or the same
;value (normalized) if we are already at a boundary.
;
;
; Parameters:
;   time - any isoTime format string.
;
; Returns:
;   the previous midnight or the value if already at midnight.
;-
function TimeUtil::floor, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time = TimeUtil.normalizeTimeString(time)
    if strmid(time,11) eq '00:00:00.000000000Z' then begin
        return, time
    endif else begin
        return, strmid(time,0,10) + 'T00:00:00.000000000Z'
    endelse
end

;+
;return $Y-$m-$dT$H:$M:$S.$(subsec,places=9)Z
;
;
; Parameters:
;   time - any isoTime format string.
;
; Returns:
;   the time in standard form.
;-
function TimeUtil::normalizeTimeString, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    nn = TimeUtil.isoTimeToArray(time)
    TimeUtil.normalizeTime,nn
    return, string(format='%d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
end

;+
;return the time as milliseconds since 1970-01-01T00:00Z. This does not
;include leap seconds. For example, in Jython:
;<pre>
;{@code
;from org.hapiserver.TimeUtil import *
;x= toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
;print x / 86400000   # 10958.0 days
;print x % 86400000   # and no milliseconds
;}
;</pre>
;
;DateTimeFormatter.ISO_INSTANT.parse.
;
; Parameters:
;   time - the isoTime, which is parsed using
;
; Returns:
;   number of non-leap-second milliseconds since 1970-01-01T00:00Z.
;
; See:
;    #fromMillisecondsSince1970(long)

;-
function TimeUtil::toMillisecondsSince1970, timeIn
    compile_opt idl2, static
    time = TimeUtil.normalizeTimeString(timeIn)
    j= julday(fix(strmid(time,5,2)),fix(strmid(time,8,2)),fix(strmid(time,0,4)))
    h= fix(strmid(time,11,2))
    m= fix(strmid(time,14,2))
    s= fix(strmid(time,17,2))
    n= long(strmid(time,20,9))
    return, ( j - 2440588L ) * 86400000.D + h * 3600000.D + m * 60000.D + s * 1000.D + n / 1D6
end

;+
;return the array formatted as ISO8601 time, formatted to nanoseconds.
;For example,  int[] nn = new int[] { 1999, 12, 31, 23, 0, 0, 0  } is
;formatted to "1999-12-31T23:00:00.000000000Z";
;
; Parameters:
;   nn - the decomposed time
;
; Returns:
;   the formatted time.
;
; See:
;    #isoTimeToArray(java.lang.String)

;-
function TimeUtil::isoTimeFromArray, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if nn[1] eq 1 and nn[2] gt 31 then begin
        month = TimeUtil.monthForDayOfYear(nn[0], nn[2])
        dom1 = TimeUtil.dayOfYear(nn[0], month, 1)
        nn[2] = nn[2] - dom1 + 1
        nn[1] = month
    endif 
    return, string(format='%04d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
end

;+
;format the time range components into iso8601 time range.
;
; Parameters:
;   timerange - 14-element time range
;
; Returns:
;   efficient representation of the time range
;-
function TimeUtil::formatIso8601TimeRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    ss1 = TimeUtil.formatIso8601TimeInTimeRange(timerange, 0)
    ss2 = TimeUtil.formatIso8601TimeInTimeRange(timerange, TimeUtil_TIME_DIGITS)
    firstNonZeroDigit = 7
    WHILE firstNonZeroDigit gt 3 and timerange[firstNonZeroDigit - 1] eq 0 and timerange[firstNonZeroDigit + TimeUtil_TIME_DIGITS - 1] eq 0 DO BEGIN
        firstNonZeroDigit -= 1
    ENDWHILE
    SWITCH firstNonZeroDigit OF
        2: BEGIN
            return, strmid(ss1,0,10) + '/' + strmid(ss2,0,10)
        END
        3: BEGIN
            return, strmid(ss1,0,10) + '/' + strmid(ss2,0,10)
        END
        4: BEGIN
            return, strmid(ss1,0,16) + 'Z/' + strmid(ss2,0,16) + 'Z'
        END
        5: BEGIN
            return, strmid(ss1,0,16) + 'Z/' + strmid(ss2,0,16) + 'Z'
        END
        6: BEGIN
            return, strmid(ss1,0,19) + 'Z/' + strmid(ss2,0,19) + 'Z'
        END
        ELSE: BEGIN
            return, ss1 + '/' + ss2
        END
    ENDSWITCH
end


;+
;return the string as a formatted string, which can be at an offset of seven positions
;to format the end date.
;
; Parameters:
;   nn - fourteen-element array of [ Y m d H M S nanos Y m d H M S nanos ]
;   offset - 0 or 7
;
; Returns:
;   formatted time "1999-12-31T23:00:00.000000000Z"
;
; See:
;    #isoTimeFromArray(int[])

;-
function TimeUtil::formatIso8601TimeInTimeRange, nn, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    SWITCH offset OF
        0: BEGIN
            return, TimeUtil.isoTimeFromArray(nn)
        END
        7: BEGIN
            copy = TimeUtil.getStopTime(nn)
            return, TimeUtil.isoTimeFromArray(copy)
        END
        ELSE: BEGIN
            stop, !error_state.msg
        END
    ENDSWITCH
end

;+
;return the string as a formatted string.
;
; Parameters:
;   nn - seven-element array of [ Y m d H M S nanos ]
;
; Returns:
;   formatted time "1999-12-31T23:00:00.000000000Z"
;
; See:
;    #isoTimeFromArray(int[])

;-
function TimeUtil::formatIso8601Time, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.isoTimeFromArray(nn)
end

;+
;format the duration into human-readable time, for example
;[ 0, 0, 7, 0, 0, 6 ] is formatted into "P7DT6S"
;
; Parameters:
;   nn - seven-element array of [ Y m d H M S nanos ]
;
; Returns:
;   ISO8601 duration
;-
function TimeUtil::formatIso8601Duration, nn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    units = ['Y', 'M', 'D', 'H', 'M', 'S']
    if n_elements(nn) gt 7 then begin
        stop, !error_state.msg
    endif 
    sb = 'P'
    n = ((n_elements(nn) lt 5)) ? n_elements(nn) : 5
    needT = 0
    for i=0,n-1 do begin
        if i eq 3 then begin
            needT = 1
        endif 
        if nn[i] gt 0 then begin
            if needT then begin
                sb = sb + 'T'
                needT = 0
            endif 
            sb = sb + strtrim(nn[i],2) + strtrim(units[i],2)
        endif 
    endfor
    if n_elements(nn) gt 5 and nn[5] gt 0 or n_elements(nn) gt 6 and nn[6] gt 0 or strlen(sb) eq 2 then begin
        if needT then begin
            sb = sb + 'T'
        endif 
        seconds = nn[5]
        nanoseconds = (n_elements(nn) eq 7) ? nn[6] : 0
        if nanoseconds eq 0 then begin
            sb = sb + strtrim(seconds,2)
        endif else if nanoseconds mod 1000000 eq 0 then begin
            sb = sb + strtrim(string(format='%.3f',seconds + nanoseconds / 1e9),2)
        endif else if nanoseconds mod 1000 eq 0 then begin
            sb = sb + strtrim(string(format='%.6f',seconds + nanoseconds / 1e9),2)
        endif else begin
            sb = sb + strtrim(string(format='%.9f',seconds + nanoseconds / 1e9),2)
        endelse
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
;returns a 7 element array with [year,mon,day,hour,min,sec,nanos]. Note
;this does not allow fractional day, hours or minutes! Examples
;include:<ul>
;<li>P1D - one day
;<li>PT1M - one minute
;<li>PT0.5S - 0.5 seconds
;</ul>
;TODO: there exists more complete code elsewhere.
;
;@throws ParseException if the string does not appear to be valid.
;
;
; Parameters:
;   stringIn - theISO8601 duration.
;
; Returns:
;   7-element array with [year,mon,day,hour,min,sec,nanos]
;
; See:
;    #iso8601duration
;    #TIME_DIGITS

;-
function TimeUtil::parseISO8601Duration, stringIn
    compile_opt idl2, static

    TimeUtil_iso8601duration='P((\d+)Y)?((\d+)M)?((\d+)D)?(T((\d+)H)?((\d+)M)?((\d*?\.?\d*)S)?)?'
    TimeUtil_iso8601DurationPattern=(obj_new('IDLJavaObject$Static$Pattern','java.util.regex.Pattern')).compile(TimeUtil_iso8601duration)

    m = TimeUtil_iso8601DurationPattern.matcher(stringIn)
    if m.matches() then begin
        dsec = TimeUtil.parseDouble(m.group(13), 0)
        sec = long(dsec)
        nanosec = long(((dsec - sec) * 1e9))
        return, [TimeUtil.parseIntegerDeft(m.group(2), 0), TimeUtil.parseIntegerDeft(m.group(4), 0), TimeUtil.parseIntegerDeft(m.group(6), 0), TimeUtil.parseIntegerDeft(m.group(9), 0), TimeUtil.parseIntegerDeft(m.group(11), 0), sec, nanosec]
    endif else begin
        if (strpos(stringIn,'P') ne -1) and (strpos(stringIn,'S') ne -1) and not (strpos(stringIn,'T') ne -1) then begin
            stop, !error_state.msg
        endif else begin
            stop, !error_state.msg
        endelse
    endelse
end

;+
;return the UTC current time, to the millisecond, in seven components.
;
; Returns:
;   the current time, to the millisecond
;-
function TimeUtil::now
    compile_opt idl2, static
    s= timestamp()
    return, [ long(strmid(s,0,4)), long(strmid(s,5,2)), long(strmid(s,8,2)), $
        long(strmid(s,11,2)), long(strmid(s,14,2)), long(strmid(s,17,2)), $
        long(strmid(s,20,9)) ]
end

;+
;return seven-element array [ year, months, days, hours, minutes, seconds, nanoseconds ]
;preserving the day of year notation if this was used. See the class
;documentation for allowed time formats, which are a subset of ISO8601
;times.  This also supports "now", "now-P1D", and other simple extensions.  Note
;ISO8601-1:2019 disallows 24:00 to be used for the time, but this is still allowed here.
;The following are valid inputs:<ul>
;<li>2021
;<li>2020-01-01
;<li>2020-01-01Z
;<li>2020-01-01T00Z
;<li>2020-01-01T00:00Z
;<li>2022-W08
;<li>now
;<li>now-P1D
;<li>lastday-P1D
;<li>lasthour-PT1H
;</ul>
;
;@throws IllegalArgumentException when the time cannot be parsed.
;
; Parameters:
;   time - isoTime to decompose
;
; Returns:
;   the decomposed time
;
; See:
;    #isoTimeFromArray(int[])
;    #parseISO8601Time(java.lang.String)

;-
function TimeUtil::isoTimeToArray, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if strlen(time) eq 4 then begin
        result = [long(time), 1, 1, 0, 0, 0, 0]
    endif else if (time).startswith('now') or (time).startswith('last') then begin
        if (time).startswith('now') then begin
            n = TimeUtil.now()
            remainder = strmid(time,3)
        endif else begin
            p = (obj_new('IDLJavaObject$Static$Pattern','java.util.regex.Pattern')).compile('last([a-z]+)([\\+|\\-]P.*)?')
            m = p.matcher(time)
            if m.matches() then begin
                n = TimeUtil.now()
                unit = m.group(1)
                remainder = m.group(2)
                SWITCH unit OF
                    'year': BEGIN
                        idigit = 1
                        break
                    END
                    'month': BEGIN
                        idigit = 2
                        break
                    END
                    'day': BEGIN
                        idigit = 3
                        break
                    END
                    'hour': BEGIN
                        idigit = 4
                        break
                    END
                    'minute': BEGIN
                        idigit = 5
                        break
                    END
                    'second': BEGIN
                        idigit = 6
                        break
                    END
                    ELSE: BEGIN
                        stop, !error_state.msg
                    END
                ENDSWITCH
                for id=(1>idigit),TimeUtil_DATE_DIGITS-1 do begin
                    n[id] = 1
                endfor
                for id=(TimeUtil_DATE_DIGITS>idigit),TimeUtil_TIME_DIGITS-1 do begin
                    n[id] = 0
                endfor
            endif else begin
                stop, !error_state.msg
            endelse
        endelse
        if n_elements(remainder) eq 0 or strlen(remainder) eq 0 then begin
            return, n
        endif else if strmid(remainder,0,1) eq '-' then begin
            catch, err
            if err eq 0 then begin
                return, TimeUtil.subtract(n, TimeUtil.parseISO8601Duration(strmid(remainder,1)))
            endif else begin
                stop, !error_state.msg
            endelse
            catch, /cancel
        endif else if strmid(remainder,0,1) eq '+' then begin
            catch, err
            if err eq 0 then begin
                return, TimeUtil.add(n, TimeUtil.parseISO8601Duration(strmid(remainder,1)))
            endif else begin
                stop, !error_state.msg
            endelse
            catch, /cancel
        endif
        return, TimeUtil.now()
    endif else begin
        if strlen(time) lt 7 then begin
            stop, !error_state.msg
        endif 
        if isDigit(strmid(time,4,1)) and isDigit(strmid(time,5,1)) then begin
            stop, !error_state.msg
        endif 
        if strlen(time) eq 7 then begin
            if strmid(time,4,1) eq 'W' then begin
                ;+
                ;2022W08
                ;-
                year = TimeUtil.parseInteger(strmid(time,0,4))
                week = TimeUtil.parseInteger(strmid(time,5))
                result = [year, 0, 0, 0, 0, 0, 0]
                TimeUtil.fromWeekOfYear,year, week, result
                timehms = ''
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4)), TimeUtil.parseInteger(strmid(time,5,2)), 1, 0, 0, 0, 0]
                timehms = ''
            endelse
        endif else if strlen(time) eq 8 then begin
            if strmid(time,5,1) eq 'W' then begin
                ;+
                ;2022-W08
                ;-
                year = TimeUtil.parseInteger(strmid(time,0,4))
                week = TimeUtil.parseInteger(strmid(time,6))
                result = [year, 0, 0, 0, 0, 0, 0]
                TimeUtil.fromWeekOfYear,year, week, result
                timehms = ''
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4)), 1, TimeUtil.parseInteger(strmid(time,5,3)), 0, 0, 0, 0]
                timehms = ''
            endelse
        endif else if strmid(time,8,1) eq 'T' then begin
            if isDigit(strmid(time,4,1)) then begin
                result = [TimeUtil.parseInteger(strmid(time,0,4)), TimeUtil.parseInteger(strmid(time,4,2)), TimeUtil.parseInteger(strmid(time,6,2)), 0, 0, 0, 0]
                timehms = strmid(time,9)
            endif else begin
                result = [TimeUtil.parseInteger(strmid(time,0,4)), 1, TimeUtil.parseInteger(strmid(time,5,3)), 0, 0, 0, 0]
                timehms = strmid(time,9)
            endelse
        endif else if strmid(time,8,1) eq 'Z' then begin
            result = [TimeUtil.parseInteger(strmid(time,0,4)), 1, TimeUtil.parseInteger(strmid(time,5,3)), 0, 0, 0, 0]
            timehms = strmid(time,9)
        endif else begin
            result = [TimeUtil.parseInteger(strmid(time,0,4)), TimeUtil.parseInteger(strmid(time,5,2)), TimeUtil.parseInteger(strmid(time,8,2)), 0, 0, 0, 0]
            if strlen(time) eq 10 then begin
                timehms = ''
            endif else begin
                timehms = strmid(time,11)
            endelse
        endelse
        if timehms.endswith('Z') then begin
            timehms = strmid(timehms,0,strlen(timehms) - 1)
        endif 
        if strlen(timehms) ge 2 then begin
            result[3] = TimeUtil.parseInteger(strmid(timehms,0,2))
        endif 
        if strlen(timehms) ge 5 then begin
            result[4] = TimeUtil.parseInteger(strmid(timehms,3,2))
        endif 
        if strlen(timehms) ge 8 then begin
            result[5] = TimeUtil.parseInteger(strmid(timehms,6,2))
        endif 
        if strlen(timehms) gt 9 then begin
            result[6] = long((10^(18 - strlen(timehms)))) * TimeUtil.parseInteger(strmid(timehms,9))
        endif 
        TimeUtil.normalizeTime,result
    endelse
    return, result
end

;+
;Rewrite the time using the format of the example time, which must start with
;$Y-$jT, $Y-$jZ, or $Y-$m-$d. For example,
;<pre>
;{@code
;from org.hapiserver.TimeUtil import *
;print rewriteIsoTime( '2020-01-01T00:00Z', '2020-112Z' ) # ->  '2020-04-21T00:00Z'
;}
;</pre> This allows direct comparisons of times for sorting.
;This works by looking at the character in the 8th position (starting with zero) of the
;exampleForm to see if a T or Z is present (YYYY-jjjTxxx).
;
;TODO: there's
;an optimization here, where if input and output are both $Y-$j or both
;$Y-$m-$d, then we need not break apart and recombine the time
;(isoTimeToArray call can be avoided).
;
;
; Parameters:
;   exampleForm - isoTime string.
;   time - the time in any allowed isoTime format
;
; Returns:
;   same time but in the same form as exampleForm.
;-
function TimeUtil::reformatIsoTime, exampleForm, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    c = strmid(exampleForm,8,1)
    nn = TimeUtil.isoTimeToArray(TimeUtil.normalizeTimeString(time))
    SWITCH c OF
        'T': BEGIN
            ;+
            ;$Y-$jT
            ;-
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = string(format='%d-%03dT%02d:%02d:%02d.%09dZ',nn[0], nn[2], nn[3], nn[4], nn[5], nn[6])
            break
        END
        'Z': BEGIN
            nn[2] = TimeUtil.dayOfYear(nn[0], nn[1], nn[2])
            nn[1] = 1
            time = string(format='%d-%03dZ',nn[0], nn[2])
            break
        END
        ELSE: BEGIN
            if strlen(exampleForm) eq 10 then begin
                c = 'Z'
            endif else begin
                c = strmid(exampleForm,10,1)
            endelse

            if c eq 'T' then begin
                ;+
                ;$Y-$jT
                ;-
                time = string(format='%d-%02d-%02dT%02d:%02d:%02d.%09dZ',nn[0], nn[1], nn[2], nn[3], nn[4], nn[5], nn[6])
            endif else if c eq 'Z' then begin
                time = string(format='%d-%02d-%02dZ',nn[0], nn[1], nn[2])
            endif

            break
        END
    ENDSWITCH
    if exampleForm.endswith('Z') then begin
        return, strmid(time,0,strlen(exampleForm) - 1) + 'Z'
    endif else begin
        return, strmid(time,0,strlen(exampleForm))
    endelse
end



;+
;this returns true or throws an IllegalArgumentException indicating the problem.
;
; Parameters:
;   time - the seven-component time.
;
; Returns:
;   true or throws an IllegalArgumentException
;-
function TimeUtil::isValidTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    year = time[0]
    if year lt TimeUtil_VALID_FIRST_YEAR then begin
        stop, !error_state.msg
    endif 
    if year gt TimeUtil_VALID_LAST_YEAR then begin
        stop, !error_state.msg
    endif 
    month = time[1]
    if month lt 1 then begin
        stop, !error_state.msg
    endif 
    if month gt 12 then begin
        stop, !error_state.msg
    endif 
    leap = (TimeUtil.isLeapYear(year)) ? 1 : 0
    dayOfMonth = time[2]
    if month gt 1 then begin
        if dayOfMonth gt TimeUtil_DAYS_IN_MONTH[month,leap] then begin
            stop, !error_state.msg
        endif 
    endif else begin
        if dayOfMonth gt TimeUtil_DAY_OFFSET[13,leap] then begin
            stop, !error_state.msg
        endif 
    endelse
    if dayOfMonth lt 1 then begin
        stop, !error_state.msg
    endif 
    return, 1
end

;+
;return the number of days in the month.
;
; Parameters:
;   year - the year
;   month - the month
;
; Returns:
;   the number of days in the month.
;
; See:
;    #isLeapYear(int)

;-
function TimeUtil::daysInMonth, year, month
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    leap = (TimeUtil.isLeapYear(year)) ? 1 : 0
    return, TimeUtil_DAYS_IN_MONTH[month,leap]
end

;+
;normalize the decomposed (seven digit) time by expressing day of year and month and day
;of month, and moving hour="24" into the next day. This also handles day
;increment or decrements, by:<ul>
;<li>handle day=0 by decrementing month and adding the days in the new
;month.
;<li>handle day=32 by incrementing month.
;<li>handle negative components by borrowing from the next significant.
;</ul>
;Note that [Y,1,dayOfYear,...] is accepted, but the result will be Y,m,d.
;
; Parameters:
;   time - the seven-component time Y,m,d,H,M,S,nanoseconds
;-
pro TimeUtil::normalizeTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    WHILE time[6] ge 1000000000 DO BEGIN
        time[5] += 1
        time[6] -= 1000000000
    ENDWHILE
    WHILE time[5] gt 59 DO BEGIN
        ;+
        ;TODO: leap seconds?
        ;-
        time[4] += 1
        time[5] -= 60
    ENDWHILE
    WHILE time[4] gt 59 DO BEGIN
        time[3] += 1
        time[4] -= 60
    ENDWHILE
    WHILE time[3] ge 24 DO BEGIN
        time[2] += 1
        time[3] -= 24
    ENDWHILE
    if time[6] lt 0 then begin
        time[5] -= 1
        time[6] += 1000000000
    endif 
    if time[5] lt 0 then begin
        time[4] -= 1
        ;+
        ;take a minute
        ;-
        time[5] += 60
    endif 
    if time[4] lt 0 then begin
        time[3] -= 1
        ;+
        ;take an hour
        ;-
        time[4] += 60
    endif 
    if time[3] lt 0 then begin
        time[2] -= 1
        ;+
        ;take a day
        ;-
        time[3] += 24
    endif 
    if time[2] lt 1 then begin
        time[1] -= 1
        ;+
        ;take a month
        ;-
        if time[1] eq 0 then begin
            daysInMonth = 31
        endif else begin
            if TimeUtil.isLeapYear(time[0]) then begin
                ;+
                ;This was  TimeUtil.DAYS_IN_MONTH[isLeapYear(time[0]) ? 1 : 0][time[1]] . TODO: review!
                ;-
                daysInMonth = TimeUtil_DAYS_IN_MONTH[time[1],1]
            endif else begin
                daysInMonth = TimeUtil_DAYS_IN_MONTH[time[1],0]
            endelse
        endelse
        time[2] += daysInMonth
    endif 
    if time[1] lt 1 then begin
        time[0] -= 1
        ;+
        ;take a year
        ;-
        time[1] += 12
    endif 
    if time[3] gt 24 then begin
        stop, !error_state.msg
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
    leap = (TimeUtil.isLeapYear(time[0])) ? 1 : 0
    if time[2] eq 0 then begin
        ;+
        ;TODO: tests don't hit this branch, and I'm not sure it can occur.
        ;-
        time[1] -= 1
        if time[1] eq 0 then begin
            time[0] -= 1
            time[1] = 12
        endif 
        time[2] = TimeUtil_DAYS_IN_MONTH[time[1],leap]
    endif 
    d = TimeUtil_DAYS_IN_MONTH[time[1],leap]
    WHILE time[2] gt d DO BEGIN
        time[1] += 1
        time[2] -= d
        if time[1] gt 12 then begin
            time[0] += 1
            time[1] -= 12
        endif 
        d = TimeUtil_DAYS_IN_MONTH[time[1],leap]
    ENDWHILE
end

;+
;return the julianDay for the year month and day. This was verified
;against another calculation (julianDayWP, commented out above) from
;http://en.wikipedia.org/wiki/Julian_day. Both calculations have 20
;operations.
;
;
; Parameters:
;   year - calendar year greater than 1582.
;   month - the month number 1 through 12.
;   day - day of month. For day of year, use month=1 and doy for day.
;
; Returns:
;   the Julian day
;
; See:
;    #fromJulianDay(int)

;-
function TimeUtil::julianDay, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    if year le 1582 then begin
        stop, !error_state.msg
    endif 
    jd = 367 * year - 7 * (year + (month + 9) / 12) / 4 - 3 * ((year + (month - 9) / 7) / 100 + 1) / 4 + 275 * month / 9 + day + 1721029
    return, jd
end

;+
;Break the Julian day apart into month, day year. This is based on
;http://en.wikipedia.org/wiki/Julian_day (GNU Public License), and was
;introduced when toTimeStruct failed when the year was 1886.
;
;initial epoch at noon Universal Time (UT) Monday, January 1, 4713 BC
;
; Parameters:
;   julian - the (integer) number of days that have elapsed since the
;
; Returns:
;   a TimeStruct with the month, day and year fields set.
;
; See:
;    #julianDay( int year, int mon, int day )

;-
function TimeUtil::fromJulianDay, julian
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
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
    result = replicate(0,TimeUtil_TIME_DIGITS)
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
;calculate the day of week, where 0 means Monday, 1 means Tuesday, etc.  For example,
;2022-03-12 is a Saturday, so 5 is returned.
;
; Parameters:
;   year - the year
;   month - the month
;   day - the day of the month
;
; Returns:
;   the day of the week.
;-
function TimeUtil::dayOfWeek, year, month, day
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    jd = TimeUtil.julianDay(year, month, day)
    daysSince2022 = jd - TimeUtil.julianDay(2022, 1, 1)
    mod7 = (daysSince2022 - 2) mod 7
    if mod7 lt 0 then begin
        mod7 = mod7 + 7
    endif 
    return, mod7
end

;+
;calculate the week of year, inserting the month into time[1] and day into time[2]
;for the Monday which is the first day of that week.  Note week 0 is excluded from
;ISO8601, but since the Linux date command returns this in some cases, it is allowed to
;mean the same as week 52 of the previous year.  See
;<a href='https://en.wikipedia.org/wiki/ISO_8601#Week_dates' target='_blank'>Wikipedia ISO8601#Week_dates</a>.
;
;
; Parameters:
;   year - the year of the week.
;   weekOfYear - the week of the year, where week 01 is starting with the Monday in the period 29 December - 4 January.
;   time - the result is placed in here, where time[0] is the year provided, and the month and day are calculated.
;-
pro TimeUtil::fromWeekOfYear, year, weekOfYear, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    time[0] = year
    day = TimeUtil.dayOfWeek(year, 1, 1)
    if day lt 4 then begin
        doy = (weekOfYear * 7 - 7 - day) + 1
        if doy lt 1 then begin
            time[0] = time[0] - 1
            if TimeUtil.isLeapYear(time[0]) then begin
                ;+
                ;was  doy= doy + ( isLeapYear(time[0]) ? 366 : 365 );  TODO: verify
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
    TimeUtil.normalizeTime,time
end

;+
;use consistent naming so that the parser is easier to find.
;@throws ParseException when the string cannot be parsed.
;
; Parameters:
;   string - iso8601 time like "2022-03-12T11:17" (Z is assumed).
;
; Returns:
;   seven-element decomposed time [ Y, m, d, H, M, S, N ]
;
; See:
;    #isoTimeToArray(java.lang.String)

;-
function TimeUtil::parseISO8601Time, string
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.isoTimeToArray(string)
end

;+
;return true if the time appears to be properly formatted.  Properly formatted strings include:<ul>
;<li>Any supported ISO8601 time
;<li>2000 and 2000-01 (just a year and month)
;<li>now - the current time reported by the processing system
;<li>lastyear - last year boundary
;<li>lastmonth - last month boundary
;<li>lastday - last midnight boundary
;<li>lasthour - last midnight boundary
;<li>now-P1D - yesterday at this time
;<li>lastday-P1D - yesterday midnight boundary
;</ul>
;
; Parameters:
;   time;
; Returns:
;   true if the time appears to be valid and will parse.
;-
function TimeUtil::isValidFormattedTime, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, strlen(time) gt 0 and (isDigit(strmid(time,0,1)) or strmid(time,0,1) eq 'P' or (time).startswith('now') or (time).startswith('last'))
end

;+
;parse the ISO8601 time range, like "1998-01-02/1998-01-17", into
;start and stop times, returned in a 14 element array of ints.
;@throws ParseException when the string cannot be used
;
; Parameters:
;   stringIn - string to parse, like "1998-01-02/1998-01-17"
;
; Returns:
;   the time start and stop [ Y,m,d,H,M,S,nano, Y,m,d,H,M,S,nano ]
;-
function TimeUtil::parseISO8601TimeRange, stringIn
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    ss = strsplit(stringIn,'/',/extract)
    if n_elements(ss) ne 2 then begin
        stop, !error_state.msg
    endif 
    if not(TimeUtil.isValidFormattedTime(ss[0])) then begin
        stop, !error_state.msg
    endif 
    if not(TimeUtil.isValidFormattedTime(ss[1])) then begin
        stop, !error_state.msg
    endif 
    result = replicate(0,14)
    if (ss[0]).startswith('P') then begin
        duration = TimeUtil.parseISO8601Duration(ss[0])
        time = TimeUtil.isoTimeToArray(ss[1])
        for i=0,TimeUtil_TIME_DIGITS-1 do begin
            result[i] = time[i] - duration[i]
        endfor
        TimeUtil.normalizeTime,result
        TimeUtil.setStopTime,time, result
        return, result
    endif else if (ss[1]).startswith('P') then begin
        time = TimeUtil.isoTimeToArray(ss[0])
        duration = TimeUtil.parseISO8601Duration(ss[1])
        TimeUtil.setStartTime,time, result
        stoptime = replicate(0,TimeUtil_TIME_DIGITS)
        for i=0,TimeUtil_TIME_DIGITS-1 do begin
            stoptime[i] = time[i] + duration[i]
        endfor
        TimeUtil.normalizeTime,stoptime
        TimeUtil.setStopTime,stoptime, result
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
                stoptime = TimeUtil.isoTimeToArray(strmid(ss[0],0,partToShare) + ss[1])
            endelse
        endelse
        TimeUtil.setStartTime,starttime, result
        TimeUtil.setStopTime,stoptime, result
        return, result
    endelse
end

;+
;subtract the offset from the base time.
;
;
; Parameters:
;   base - a time
;   offset - offset in each component.
;
; Returns:
;   a time
;-
function TimeUtil::subtract, base, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_DIGITS)
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        result[i] = base[i] - offset[i]
    endfor
    if result[0] gt 400 then begin
        TimeUtil.normalizeTime,result
    endif 
    return, result
end

;+
;add the offset to the base time. This should not be used to combine two
;offsets, because the code has not been verified for this use.
;
;
; Parameters:
;   base - a time
;   offset - offset in each component.
;
; Returns:
;   a time
;-
function TimeUtil::add, base, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_DIGITS)
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        result[i] = base[i] + offset[i]
    endfor
    TimeUtil.normalizeTime,result
    return, result
end

;+
;true if t1 is after t2.
;
; Parameters:
;   t1 - seven-component time
;   t2 - seven-component time
;
; Returns:
;   true if t1 is after t2.
;-
function TimeUtil::gt_, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil.normalizeTime,t1
    TimeUtil.normalizeTime,t2
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        if t1[i] gt t2[i] then begin
            return, 1
        endif else if t1[i] lt t2[i] then begin
            return, 0
        endif
    endfor
    return, 0
end

;+
;true if t1 is equal to t2.
;
; Parameters:
;   t1 - seven-component time
;   t2 - seven-component time
;
; Returns:
;   true if t1 is equal to t2.
;-
function TimeUtil::eq_, t1, t2
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil.normalizeTime,t1
    TimeUtil.normalizeTime,t2
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        if t1[i] ne t2[i] then begin
            return, 0
        endif 
    endfor
    return, 1
end

;+
;format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
;
; Parameters:
;   time - seven element time range
;
; Returns:
;   formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
;
; See:
;    #formatIso8601TimeInTimeRangeBrief(int[] time, int offset )

;-
function TimeUtil::formatIso8601TimeBrief, time
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    return, TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0)
end


;+
;format the time, but omit trailing zeros.  $Y-$m-$dT$H:$M is the coursest resolution returned.
;
; Parameters:
;   time - seven element time range
;   offset - the offset into the time array (7 for stop time in 14-element range array).
;
; Returns:
;   formatted time, possibly truncated to minutes, seconds, milliseconds, or microseconds
;
; See:
;    #formatIso8601TimeBrief(int[])

;-
function TimeUtil::formatIso8601TimeInTimeRangeBrief, time, offset
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    stime = TimeUtil.formatIso8601TimeInTimeRange(time, offset)
    nanos = time[TimeUtil_COMPONENT_NANOSECOND + offset]
    micros = nanos mod 1000
    millis = nanos mod 10000000
    if nanos eq 0 then begin
        if time[5 + offset] eq 0 then begin
            return, strmid(stime,0,16) + 'Z'
        endif else begin
            return, strmid(stime,0,19) + 'Z'
        endelse
    endif else begin
        if millis eq 0 then begin
            return, strmid(stime,0,23) + 'Z'
        endif else if micros eq 0 then begin
            return, strmid(stime,0,26) + 'Z'
        endif else begin
            return, stime
        endelse
    endelse
end

;+
;return the next interval, given the 14-component time interval.  This
;has the restrictions:<ul>
;<li> can only handle intervals of at least one second
;<li> must be only one component which increments (20 days, but not 20 days and 12 hours)
;<li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
;</ul>
;
; Parameters:
;   timerange - 14-component time interval.
;
; Returns:
;   14-component time interval.
;-
function TimeUtil::nextRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_RANGE_DIGITS)
    width = replicate(0,TimeUtil_TIME_DIGITS)
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        width[i] = timerange[i + TimeUtil_TIME_DIGITS] - timerange[i]
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
        daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil_COMPONENT_YEAR], timerange[TimeUtil_COMPONENT_MONTH])
        width[2] = width[2] + daysInMonth
        width[1] = width[1] - 1
    endif 
    if width[1] lt 0 then begin
        width[1] = width[1] + 12
        width[0] = width[0] - 1
    endif 
    ;+
    ;System.arraycopy( range, TimeUtil.TIME_DIGITS, result, 0, TimeUtil.TIME_DIGITS );
    ;-
    TimeUtil.setStartTime,TimeUtil.getStopTime(timerange), result
    ;+
    ;This creates an extra array, but let's not worry about that.
    ;-
    TimeUtil.setStopTime,TimeUtil.add(TimeUtil.getStopTime(timerange), width), result
    return, result
end

;+
;return the previous interval, given the 14-component time interval.  This
;has the restrictions:<ul>
;<li> can only handle intervals of at least one second
;<li> must be only one component which increments (20 days, but not 20 days and 12 hours)
;<li> increment must be a divisor of the component (e.g. months), so 1, 2, 3, 4, or 6 months is valid, but 5 months is not.
;</ul>
;
; Parameters:
;   timerange - 14-component time interval.
;
; Returns:
;   14-component time interval.
;-
function TimeUtil::previousRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    result = replicate(0,TimeUtil_TIME_RANGE_DIGITS)
    width = replicate(0,TimeUtil_TIME_DIGITS)
    for i=0,TimeUtil_TIME_DIGITS-1 do begin
        width[i] = timerange[i + TimeUtil_TIME_DIGITS] - timerange[i]
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
        daysInMonth = TimeUtil.daysInMonth(timerange[TimeUtil_COMPONENT_YEAR], timerange[TimeUtil_COMPONENT_MONTH])
        width[2] = width[2] + daysInMonth
        width[1] = width[1] - 1
    endif 
    if width[1] lt 0 then begin
        width[1] = width[1] + 12
        width[0] = width[0] - 1
    endif 
    TimeUtil.setStopTime,TimeUtil.getStartTime(timerange), result
    TimeUtil.setStartTime,TimeUtil.subtract(TimeUtil.getStartTime(timerange), width), result
    return, result
end

;+
;return true if this is a valid time range having a non-zero width.
;
; Parameters:
;   timerange;-
function TimeUtil::isValidTimeRange, timerange
    compile_opt idl2, static
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    start = TimeUtil.getStartTime(timerange)
    stop = TimeUtil.getStopTime(timerange)
    return, TimeUtil.isValidTime(start) and TimeUtil.isValidTime(stop) and TimeUtil.gt_(stop, start)
end

pro TimeUtil__define
    dummy={TimeUtil,dummy:0}
; pass
    common TimeUtil, TimeUtil_VERSION, TimeUtil_TIME_DIGITS, TimeUtil_DATE_DIGITS, TimeUtil_TIME_RANGE_DIGITS, TimeUtil_COMPONENT_YEAR, TimeUtil_COMPONENT_MONTH, TimeUtil_COMPONENT_DAY, TimeUtil_COMPONENT_HOUR, TimeUtil_COMPONENT_MINUTE, TimeUtil_COMPONENT_SECOND, TimeUtil_COMPONENT_NANOSECOND, TimeUtil_DAYS_IN_MONTH, TimeUtil_DAY_OFFSET, TimeUtil_MONTH_NAMES, TimeUtil_MONTH_NAMES_FULL, TimeUtil_FORMATTER_MS_1970, TimeUtil_FORMATTER_MS_1970_NS, TimeUtil_J2000_EPOCH_MILLIS, TimeUtil_LEAP_SECONDS, TimeUtil_iso8601duration, TimeUtil_iso8601DurationPattern, TimeUtil_VALID_FIRST_YEAR, TimeUtil_VALID_LAST_YEAR
    TimeUtil_VERSION='20250205.1'
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
    TimeUtil_iso8601duration='P((\d+)Y)?((\d+)M)?((\d+)D)?(T((\d+)H)?((\d+)M)?((\d*?\.?\d*)S)?)?'
    TimeUtil_iso8601DurationPattern=(obj_new('IDLJavaObject$Static$Pattern','java.util.regex.Pattern')).compile(TimeUtil_iso8601duration)
    TimeUtil_VALID_FIRST_YEAR=1900
    TimeUtil_VALID_LAST_YEAR=2100

    return
end

