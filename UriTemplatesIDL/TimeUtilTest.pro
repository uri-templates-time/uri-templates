
; cheesy unittest temporary
pro TimeUtilTest::assertEquals, a, b 
    if not ( a eq b ) then stop, 'a ne b'
end

pro TimeUtilTest::assertArrayEquals, a, b
    if n_elements(a) eq n_elements(b) then begin
        for i=0,n_elements(a)-1 do begin
            if a[i] ne b[i] then stop, string(format='a[%d] ne [%d]',i,i)
        endfor
    endif else begin
        stop, 'arrays are different lengths'
    endelse
end

pro TimeUtilTest::fail, msg
    print, msg
    stop, 'fail: '+msg
end

;+
;Tests of the useful TimeUtil.java code.
;@author jbf
;-


;+
;Test of reformatIsoTime method, of class TimeUtil.
;-
pro TimeUtilTest::testReformatIsoTime
    print,'reformatIsoTime'
    exampleForm = '2020-01-01T00:00Z'
    time = '2020-112Z'
    expResult = '2020-04-21T00:00Z'
    result = TimeUtil.reformatIsoTime(exampleForm, time)
    self.assertEquals, expResult, result
end

;+
;Test of monthNameAbbrev method, of class TimeUtil.
;-
pro TimeUtilTest::testMonthNameAbbrev
    print,'monthNameAbbrev'
    expResult = 'Mar'
    result = TimeUtil.monthNameAbbrev(3)
    self.assertEquals, expResult, result
end

;+
;Test of monthNameAbbrev method, of class TimeUtil.
;-
pro TimeUtilTest::testMonthNameFull
    print,'monthNameFull'
    expResult = 'March'
    result = TimeUtil.monthNameFull(3)
    self.assertEquals, expResult, result
end

;+
;Test of monthNumber method, of class TimeUtil.
;-
pro TimeUtilTest::testMonthNumber
    print,'monthNumber'
    s = 'December'
    expResult = 12
    result = TimeUtil.monthNumber(s)
    self.assertEquals, expResult, result
end

;+
;Test of countOffDays method, of class TimeUtil.
;-
pro TimeUtilTest::testCountOffDays
    print,'countOffDays'
    startTime = '1999-12-31'
    stopTime = '2000-01-03'
    expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
    result = TimeUtil.countOffDays(startTime, stopTime)
    self.assertArrayEquals, expResult, result
    startTime = '1999-12-31Z'
    stopTime = '2000-01-03Z'
    expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
    result = TimeUtil.countOffDays(startTime, stopTime)
    self.assertArrayEquals, expResult, result
    startTime = '1999-12-31T12:00Z'
    stopTime = '2000-01-03T12:00Z'
    expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
    result = TimeUtil.countOffDays(startTime, stopTime)
    self.assertArrayEquals, expResult, result
    startTime = '1999'
    stopTime = '2000'
    result = TimeUtil.countOffDays(startTime, stopTime)
    self.assertEquals, n_elements(result), 365
    self.assertEquals, result[0], '1999-01-01Z'
    self.assertEquals, result[364], '1999-12-31Z'
end

;+
;Test of nextDay method, of class TimeUtil.
;-
pro TimeUtilTest::testNextDay
    print,'nextDay'
    day = '2019-12-31Z'
    expResult = '2020-01-01Z'
    result = TimeUtil.nextDay(day)
    self.assertEquals, expResult, result
end

;+
;Test of previousDay method, of class TimeUtil.
;-
pro TimeUtilTest::testPreviousDay
    print,'previousDay'
    day = '2020-01-01'
    expResult = '2019-12-31Z'
    result = TimeUtil.previousDay(day)
    self.assertEquals, expResult, result
end

;+
;Test of nextDay method, of class TimeUtil.
;-
pro TimeUtilTest::testNextRange
    catch, err
    if err eq 0 then begin
        print,'nextRange'
        tr = TimeUtil.parseISO8601TimeRange('2022-12-05Z/2022-12-15Z')
        result = TimeUtil.formatIso8601TimeRange(TimeUtil.nextRange(tr))
        expResult = '2022-12-15/2022-12-25'
        self.assertEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
end

;+
;Test of nextDay method, of class TimeUtil.
;-
pro TimeUtilTest::testPreviousRange
    catch, err
    if err eq 0 then begin
        print,'previousRange'
        tr = TimeUtil.parseISO8601TimeRange('2022-12-05Z/2022-12-15Z')
        result = TimeUtil.formatIso8601TimeRange(TimeUtil.previousRange(tr))
        expResult = '2022-11-25/2022-12-05'
        self.assertEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
end

;+
;Test of ceil method, of class TimeUtil.
;-
pro TimeUtilTest::testCeil
    print,'ceil'
    time = '2000-01-01T00:00'
    expResult = '2000-01-01T00:00:00.000000000Z'
    result = TimeUtil.ceil(time)
    self.assertEquals, expResult, result
    time = '2000-01-01T23:59'
    expResult = '2000-01-02T00:00:00.000000000Z'
    result = TimeUtil.ceil(time)
    self.assertEquals, expResult, result
end

;+
;Test of floor method, of class TimeUtil.
;-
pro TimeUtilTest::testFloor
    print,'floor'
    time = '2000-01-01T00:00'
    expResult = '2000-01-01T00:00:00.000000000Z'
    result = TimeUtil.floor(time)
    self.assertEquals, expResult, result
    time = '2000-01-01T23:59'
    expResult = '2000-01-01T00:00:00.000000000Z'
    result = TimeUtil.floor(time)
    self.assertEquals, expResult, result
end

;+
;Test of normalizeTimeString method, of class TimeUtil.
;-
pro TimeUtilTest::testNormalizeTimeString
    print,'normalizeTimeString'
    time = '2020-03-04T24:00:00Z'
    expResult = '2020-03-05T00:00:00.000000000Z'
    result = TimeUtil.normalizeTimeString(time)
    self.assertEquals, expResult, result
end

pro TimeUtilTest::testNormalizeTime
    print,'normalizeTime'
    time = [2000, 1, 1, 24, 0, 0, 0]
    expResult = [2000, 1, 2, 0, 0, 0, 0]
    TimeUtil.normalizeTime,time
    self.assertArrayEquals, expResult, time
    time = [2000, 1, 1, -1, 0, 0, 0]
    expResult = [1999, 12, 31, 23, 0, 0, 0]
    TimeUtil.normalizeTime,time
    self.assertArrayEquals, expResult, time
    time = [1979, 13, 6, 0, 0, 0, 0]
    expResult = [1980, 1, 6, 0, 0, 0, 0]
    TimeUtil.normalizeTime,time
    self.assertArrayEquals, expResult, time
    time = [1979, 12, 37, 0, 0, 0, 0]
    expResult = [1980, 1, 6, 0, 0, 0, 0]
    TimeUtil.normalizeTime,time
    self.assertArrayEquals, expResult, time
end

;+
;Test of isoTimeFromArray method, of class TimeUtil.
;-
pro TimeUtilTest::testIsoTimeFromArray
    print,'isoTimeFromArray'
    nn = [1999, 12, 31, 23, 0, 0, 0]
    expResult = '1999-12-31T23:00:00.000000000Z'
    result = TimeUtil.isoTimeFromArray(nn)
    self.assertEquals, expResult, result
    nn = [2000, 1, 45, 23, 0, 0, 0]
    expResult = '2000-02-14T23:00:00.000000000Z'
    result = TimeUtil.isoTimeFromArray(nn)
    self.assertEquals, expResult, result
end

;+
;Test of isoTimeToArray method, of class TimeUtil.
;-
pro TimeUtilTest::testIsoTimeToArray
    print,'isoTimeToArray'
    time = ''
    expResult = [2020, 2, 3, 6, 7, 8, 10001]
    result = TimeUtil.isoTimeToArray('2020-034T06:07:08.000010001')
    self.assertArrayEquals, expResult, result
    expResult = [2012, 1, 17, 2, 0, 0, 245000000]
    result = TimeUtil.isoTimeToArray('2012-01-17T02:00:00.245')
    self.assertArrayEquals, expResult, result
    result = TimeUtil.isoTimeToArray('2020-033T06:07:08.000010001')
    result = TimeUtil.isoTimeToArray('2020-03-03Z')
    result = TimeUtil.isoTimeToArray('2020-033Z')
    result = TimeUtil.isoTimeToArray('2020-033')
    result = TimeUtil.isoTimeToArray('2020-033T00:00Z')
    result = TimeUtil.isoTimeToArray('now')
    result = TimeUtil.isoTimeToArray('lastday')
    result = TimeUtil.isoTimeToArray('lastday+PT1H')
    result = TimeUtil.isoTimeToArray('lastminute+PT1M')
end

;+
;Test of dayOfYear method, of class TimeUtil.
;-
pro TimeUtilTest::testDayOfYear
    print,'dayOfYear'
    year = 2000
    month = 3
    day = 1
    expResult = 61
    result = TimeUtil.dayOfYear(year, month, day)
    self.assertEquals, expResult, result
end

;+
;Test of toMillisecondsSince1970 method, of class TimeUtil.
;-
pro TimeUtilTest::testToMillisecondsSince1970
    print,'toMillisecondsSince1970'
    result = TimeUtil.toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
    self.assertEquals, 10958, result / 86400000
    ;+
    ;# 10958.0 days
    ;-
    self.assertEquals, 0, result mod 86400000
    result = TimeUtil.toMillisecondsSince1970('2020-07-09T16:35:27Z')
    self.assertEquals, 1594312527000, result
end

;+
;Test of parseISO8601Duration method, of class TimeUtil.
;@throws java.lang.Exception
;-
pro TimeUtilTest::testParseISO8601Duration
    print,'parseISO8601Duration'
    stringIn = 'PT5H4M'
    expResult = [0, 0, 0, 5, 4, 0, 0]
    result = TimeUtil.parseISO8601Duration(stringIn)
    self.assertArrayEquals, expResult, result
    expResult = [0, 0, 0, 0, 0, 0, 123000]
    result = TimeUtil.parseISO8601Duration('PT0.000123S')
    self.assertArrayEquals, expResult, result
    result = TimeUtil.parseISO8601Duration('PT52.000000S')
    ;+
    ;Das2 parsing has a problem with this.
    ;-
    expResult = [0, 0, 0, 0, 0, 52, 0]
    self.assertArrayEquals, expResult, result
end

;+
;Test of julianDay method, of class TimeUtil.
;-
pro TimeUtilTest::testJulianDay
    print,'julianDay'
    year = 2020
    month = 7
    day = 9
    expResult = 2459040
    result = TimeUtil.julianDay(year, month, day)
    self.assertEquals, expResult, result
end

pro TimeUtilTest::testMonthForDayOfYear
    print,'monthForDayOfYear'
    self.assertEquals, TimeUtil.monthForDayOfYear(2000, 45), 2
end

;+
;Test of fromJulianDay method, of class TimeUtil.
;-
pro TimeUtilTest::testFromJulianDay
    print,'fromJulianDay'
    julian = 2459040
    expResult = [2020, 7, 9, 0, 0, 0, 0]
    result = TimeUtil.fromJulianDay(julian)
    self.assertArrayEquals, expResult, result
end

;+
;Test of fromJulianDay method, of class TimeUtil.
;-
pro TimeUtilTest::testFromMillisecondsSince1970
    print,'fromMillisecondsSince1970'
    s = TimeUtil.fromMillisecondsSince1970(0)
    self.assertEquals, s, '1970-01-01T00:00:00.000Z'
    s = TimeUtil.fromMillisecondsSince1970(2208988800000)
    self.assertEquals, s, '2040-01-01T00:00:00.000Z'
    s = TimeUtil.fromMillisecondsSince1970(1)
    self.assertEquals, s, '1970-01-01T00:00:00.001Z'
end

;+
;Test of fromJulianDay method, of class TimeUtil.
;-
pro TimeUtilTest::testFromTT2000
    print,'fromTT2000'
    s = TimeUtil.fromTT2000(0)
    self.assertEquals, s, '2000-01-01T11:58:55.816000000Z'
    s = TimeUtil.fromTT2000(631108869184000000)
    self.assertEquals, s, '2020-01-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(-583934347816000000)
    self.assertEquals, s, '1981-07-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(-31579135816000000)
    self.assertEquals, s, '1999-01-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(-63115136816000000)
    self.assertEquals, s, '1998-01-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(-94651137816000000)
    self.assertEquals, s, '1997-01-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(-631195148816000000)
    self.assertEquals, s, '1980-01-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(394372867184000000)
    self.assertEquals, s, '2012-07-01T00:00:00.000000000Z'
    s = TimeUtil.fromTT2000(394372866184000000)
    self.assertEquals, s, '2012-06-30T23:59:60.000000000Z'
    s = TimeUtil.fromTT2000(394372865684000000)
    self.assertEquals, s, '2012-06-30T23:59:59.500000000Z'
end

;+
;Test of subtract method, of class TimeUtil.
;-
pro TimeUtilTest::testSubtract
    print,'subtract'
    base = [2020, 7, 9, 1, 0, 0, 0]
    offset = [0, 0, 0, 2, 0, 0, 0]
    expResult = [2020, 7, 8, 23, 0, 0, 0]
    result = TimeUtil.subtract(base, offset)
    self.assertArrayEquals, expResult, result
end

;+
;Test of add method, of class TimeUtil.
;-
pro TimeUtilTest::testAdd
    print,'add'
    base = [2020, 7, 8, 23, 0, 0, 0]
    offset = [0, 0, 0, 2, 0, 0, 0]
    expResult = [2020, 7, 9, 1, 0, 0, 0]
    result = TimeUtil.add(base, offset)
    self.assertArrayEquals, expResult, result
    base = [1979, 12, 27, 0, 0, 0, 0]
    offset = [0, 0, 10, 0, 0, 0, 0]
    expResult = [1980, 1, 6, 0, 0, 0, 0]
    result = TimeUtil.add(base, offset)
    self.assertArrayEquals, expResult, result
end

;+
;Test of formatIso8601Duration method, of class TimeUtil.
;-
pro TimeUtilTest::testFormatIso8601Duration
    print,'formatIso8601Duration'
    nn = [0, 0, 7, 0, 0, 6]
    expResult = 'P7DT6S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 0, 0, 0, 0, 200000]
    expResult = 'PT0.000200S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 0, 0, 0, 0, 200000000]
    expResult = 'PT0.200S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 0, 0, 0, 0, 200]
    expResult = 'PT0.000000200S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 0, 0, 0, 2, 200000]
    expResult = 'PT2.000200S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 0, 0, 0, 0, 0]
    expResult = 'PT0S'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0, 1, 0, 0, 0, 0]
    expResult = 'P1D'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
    nn = [0, 0]
    expResult = 'P0D'
    result = TimeUtil.formatIso8601Duration(nn)
    self.assertEquals, expResult, result
end

;+
;Test of now method, of class TimeUtil.
;-
pro TimeUtilTest::testNow
    print,'now'
    result = TimeUtil.now()
end

;+
;Test of parseISO8601TimeRange method, of class TimeUtil.
;-
pro TimeUtilTest::testParseISO8601TimeRange
    print,'parseISO8601TimeRange'
    stringIn = '1998-01-02/1998-01-17'
    expResult = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = '2022-W13/P7D'
    expResult = [2022, 3, 28, 0, 0, 0, 0, 2022, 4, 4, 0, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = 'P7D/2022-01-02'
    expResult = [2021, 12, 26, 0, 0, 0, 0, 2022, 1, 2, 0, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = '2023-01-18T17:00/18:00'
    expResult = [2023, 1, 18, 17, 0, 0, 0, 2023, 1, 18, 18, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = '2013-01-01/07-01'
    expResult = [2013, 1, 1, 0, 0, 0, 0, 2013, 7, 1, 0, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = '2017-09-13T13:06Z/2023-09-30T23:57:41Z'
    expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 57, 41, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
    stringIn = '2017-09-13T13:06:00Z/2023-09-30T23:00Z'
    expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601TimeRange(stringIn)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
end

;+
;Test of formatIso8601TimeRange method, of class TimeUtil.
;-
pro TimeUtilTest::testFormatIso8601TimeRange
    print,'formatIso8601TimeRange'
    nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
    expResult = '1998-01-02/1998-01-17'
    result = TimeUtil.formatIso8601TimeRange(nn)
    self.assertEquals, expResult, result
    nn = [1998, 1, 2, 0, 3, 0, 0, 1998, 1, 17, 0, 3, 0, 0]
    expResult = '1998-01-02T00:03Z/1998-01-17T00:03Z'
    result = TimeUtil.formatIso8601TimeRange(nn)
    self.assertEquals, expResult, result
    nn = [1998, 1, 2, 0, 0, 2, 0, 1998, 1, 17, 0, 0, 6, 0]
    expResult = '1998-01-02T00:00:02Z/1998-01-17T00:00:06Z'
    result = TimeUtil.formatIso8601TimeRange(nn)
    self.assertEquals, expResult, result
    nn = [1998, 1, 2, 0, 0, 0, 300, 1998, 1, 2, 0, 0, 0, 500]
    expResult = '1998-01-02T00:00:00.000000300Z/1998-01-02T00:00:00.000000500Z'
    result = TimeUtil.formatIso8601TimeRange(nn)
    self.assertEquals, expResult, result
end

;+
;Test of formatIso8601Time method, of class TimeUtil.
;-
pro TimeUtilTest::testFormatIso8601TimeInTimeRange
    print,'formatIso8601Time'
    nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
    offset = 7
    expResult = '1998-01-17T00:00:00.000000000Z'
    result = TimeUtil.formatIso8601TimeInTimeRange(nn, offset)
    self.assertEquals, expResult, result
end

;+
;Test of formatIso8601Time method, of class TimeUtil.
;-
pro TimeUtilTest::testFormatIso8601TimeInTime
    print,'formatIso8601Time'
    nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
    expResult = '1998-01-02T00:00:00.000000000Z'
    result = TimeUtil.formatIso8601Time(nn)
    self.assertEquals, expResult, result
end

;+
;Test of dayOfWeek method, of class TimeUtil.
;-
pro TimeUtilTest::testDayOfWeek
    print,'dayOfWeek'
    year = 2022
    month = 3
    day = 12
    expResult = 5
    result = TimeUtil.dayOfWeek(year, month, day)
    self.assertEquals, expResult, result
end

;+
;Test of fromWeekOfYear method, of class TimeUtil.
;-
pro TimeUtilTest::testFromWeekOfYear
    print,'fromWeekOfYear'
    year = 2022
    weekOfYear = 13
    result = replicate(0,7)
    TimeUtil.fromWeekOfYear,year, weekOfYear, result
    expResult = [2022, 3, 28, 0, 0, 0, 0]
    self.assertArrayEquals, expResult, result
    year = 2022
    weekOfYear = 0
    result = replicate(0,7)
    TimeUtil.fromWeekOfYear,year, weekOfYear, result
    expResult = [2021, 12, 27, 0, 0, 0, 0]
    self.assertArrayEquals, expResult, result
end

;+
;Test of parseISO8601Time method, of class TimeUtil.
;-
pro TimeUtilTest::testParseISO8601Time
    print,'parseISO8601Time'
    string = '2020-033T00:00'
    expResult = [2020, 2, 2, 0, 0, 0, 0]
    catch, err
    if err eq 0 then begin
        result = TimeUtil.parseISO8601Time(string)
        self.assertArrayEquals, expResult, result
    endif else begin
        stop, ex
    endelse
    catch, /cancel
end

;+
;Test of getStartTime method, of class TimeUtil.
;-
pro TimeUtilTest::testGetStartTime
    print,'getStartTime'
    timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10]
    expResult = [2025, 2, 4, 5, 6, 7, 8]
    result = TimeUtil.getStartTime(timerange)
    self.assertArrayEquals, expResult, result
end

;+
;Test of getStopTime method, of class TimeUtil.
;-
pro TimeUtilTest::testGetStopTime
    print,'getStopTime'
    timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10]
    expResult = [2025, 2, 4, 7, 8, 9, 10]
    result = TimeUtil.getStopTime(timerange)
    self.assertArrayEquals, expResult, result
end

;+
;Test of leapSecondsAt method, of class TimeUtil.
;-
pro TimeUtilTest::testLeapSecondsAt
    print,'leapSecondsAt'
    tt2000 = 0
    expResult = 32
    result = TimeUtil.leapSecondsAt(tt2000)
    self.assertEquals, expResult, result
    result = TimeUtil.leapSecondsAt(536500869184000000)
    self.assertEquals, 37, result
end

;+
;Test of lastLeapSecond method, of class TimeUtil.
;-
pro TimeUtilTest::testLastLeapSecond
    print,'lastLeapSecond'
    tt2000 = 0
    expResult = -31579135816000000
    result = TimeUtil.lastLeapSecond(tt2000)
    self.assertEquals, expResult, result
end

;+
;Test of formatHMSN method, of class TimeUtil.
;-
pro TimeUtilTest::testFormatHMSN
    print,'formatHMSN'
    nanosecondsSinceMidnight = 56
    expResult = '00:00:00.000000056'
    result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
    self.assertEquals, expResult, result
    nanosecondsSinceMidnight = 3600 * 24 * 1000000000
    expResult = '23:59:60.000000000'
    result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
    self.assertEquals, expResult, result
    nanosecondsSinceMidnight = 3600 * 24 * 1000000000 + 1 * 1000000000 + 500 * 1000000
    expResult = '23:59:61.500000000'
    result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
    self.assertEquals, expResult, result
end

pro TimeUtilTest::testDaysInMonth
    print,'daysInMonth'
    year = 2000
    month = 2
    expResult = 29
    result = TimeUtil.daysInMonth(year, month)
    self.assertEquals, expResult, result
    year = 2004
    month = 1
    expResult = 31
    result = TimeUtil.daysInMonth(year, month)
    self.assertEquals, expResult, result
    year = 2008
    month = 12
    expResult = 31
    result = TimeUtil.daysInMonth(year, month)
    self.assertEquals, expResult, result
end

pro TimeUtilTest__define
    dummy={TimeUtilTest,dummy:0}
; pass
    return
end
; Run the following code on the command line:
; o=obj_new('TimeUtilTest')    
; o.runtests                   pro TimeUtilTest::RunTests
    Test = obj_new('TimeUtilTest')
    test.testReformatIsoTime
    test.testMonthNameAbbrev
    test.testMonthNameFull
    test.testMonthNumber
    test.testCountOffDays
    test.testNextDay
    test.testPreviousDay
    test.testNextRange
    test.testPreviousRange
    test.testCeil
    test.testFloor
    test.testNormalizeTimeString
    test.testNormalizeTime
    test.testIsoTimeFromArray
    test.testIsoTimeToArray
    test.testDayOfYear
    test.testToMillisecondsSince1970
    test.testParseISO8601Duration
    test.testJulianDay
    test.testMonthForDayOfYear
    test.testFromJulianDay
    test.testFromMillisecondsSince1970
    test.testFromTT2000
    test.testSubtract
    test.testAdd
    test.testFormatIso8601Duration
    test.testNow
    test.testParseISO8601TimeRange
    test.testFormatIso8601TimeRange
    test.testFormatIso8601TimeInTimeRange
    test.testFormatIso8601TimeInTime
    test.testDayOfWeek
    test.testFromWeekOfYear
    test.testParseISO8601Time
    test.testGetStartTime
    test.testGetStopTime
    test.testLeapSecondsAt
    test.testLastLeapSecond
    test.testFormatHMSN
    test.testDaysInMonth
end

