import unittest

from TimeUtil import TimeUtil

# Tests of the useful TimeUtil.java code.
# @author jbf
class TimeUtilTest(unittest.TestCase):
    # Test of reformatIsoTime method, of class TimeUtil.
    def testReformatIsoTime(self):
        print('reformatIsoTime')
        exampleForm = '2020-01-01T00:00Z'
        time = '2020-112Z'
        expResult = '2020-04-21T00:00Z'
        result = TimeUtil.reformatIsoTime(exampleForm, time)
        self.assertEqual(expResult,result)
        self.assertEqual(TimeUtil.reformatIsoTime('2020-01-01T00:00Z', '2020-112Z'),'2020-04-21T00:00Z')
        self.assertEqual(TimeUtil.reformatIsoTime('2020-010', '2020-020Z'),'2020-020')
        self.assertEqual(TimeUtil.reformatIsoTime('2020-01-01T00:00Z', '2021-01-01Z'),'2021-01-01T00:00Z')

    # Test of monthNameAbbrev method, of class TimeUtil.
    def testMonthNameAbbrev(self):
        print('monthNameAbbrev')
        expResult = 'Mar'
        result = TimeUtil.monthNameAbbrev(3)
        self.assertEqual(expResult,result)

    # Test of monthNameAbbrev method, of class TimeUtil.
    def testMonthNameFull(self):
        print('monthNameFull')
        expResult = 'March'
        result = TimeUtil.monthNameFull(3)
        self.assertEqual(expResult,result)

    # Test of monthNumber method, of class TimeUtil.
    def testMonthNumber(self):
        print('monthNumber')
        s = 'December'
        expResult = 12
        result = TimeUtil.monthNumber(s)
        self.assertEqual(expResult,result)

    # Test of countOffDays method, of class TimeUtil.
    def testCountOffDays(self):
        print('countOffDays')
        startTime = '1999-12-31'
        stopTime = '2000-01-03'
        expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
        result = TimeUtil.countOffDays(startTime, stopTime)
        self.assertEqual(expResult,result)
        startTime = '1999-12-31Z'
        stopTime = '2000-01-03Z'
        expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
        result = TimeUtil.countOffDays(startTime, stopTime)
        self.assertEqual(expResult,result)
        startTime = '1999-12-31T12:00Z'
        stopTime = '2000-01-03T12:00Z'
        expResult = ['1999-12-31Z', '2000-01-01Z', '2000-01-02Z']
        result = TimeUtil.countOffDays(startTime, stopTime)
        self.assertEqual(expResult,result)
        startTime = '1999'
        stopTime = '2000'
        result = TimeUtil.countOffDays(startTime, stopTime)
        self.assertEqual(len(result),365)
        self.assertEqual(result[0],'1999-01-01Z')
        self.assertEqual(result[364],'1999-12-31Z')

    # Test of nextDay method, of class TimeUtil.
    def testNextDay(self):
        print('nextDay')
        day = '2019-12-31Z'
        expResult = '2020-01-01Z'
        result = TimeUtil.nextDay(day)
        self.assertEqual(expResult,result)

    # Test of previousDay method, of class TimeUtil.
    def testPreviousDay(self):
        print('previousDay')
        day = '2020-01-01'
        expResult = '2019-12-31Z'
        result = TimeUtil.previousDay(day)
        self.assertEqual(expResult,result)

    # Test of nextDay method, of class TimeUtil.
    def testNextRange(self):
        try:
            print('nextRange')
            tr = TimeUtil.parseISO8601TimeRange('2022-12-05Z/2022-12-15Z')
            result = TimeUtil.formatIso8601TimeRange(TimeUtil.nextRange(tr))
            expResult = '2022-12-15/2022-12-25'
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise Exception(ex)

    # Test of nextDay method, of class TimeUtil.
    def testPreviousRange(self):
        try:
            print('previousRange')
            tr = TimeUtil.parseISO8601TimeRange('2022-12-05Z/2022-12-15Z')
            result = TimeUtil.formatIso8601TimeRange(TimeUtil.previousRange(tr))
            expResult = '2022-11-25/2022-12-05'
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise Exception(ex)

    # Test of ceil method, of class TimeUtil.
    def testCeil(self):
        print('ceil')
        time = '2000-01-01T00:00'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.ceil(time)
        self.assertEqual(expResult,result)
        time = '2000-01-01T23:59'
        expResult = '2000-01-02T00:00:00.000000000Z'
        result = TimeUtil.ceil(time)
        self.assertEqual(expResult,result)

    # Test of floor method, of class TimeUtil.
    def testFloor(self):
        print('floor')
        time = '2000-01-01T00:00'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.floor(time)
        self.assertEqual(expResult,result)
        time = '2000-01-01T23:59'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.floor(time)
        self.assertEqual(expResult,result)

    # Test of normalizeTimeString method, of class TimeUtil.
    def testNormalizeTimeString(self):
        print('normalizeTimeString')
        time = '2020-03-04T24:00:00Z'
        expResult = '2020-03-05T00:00:00.000000000Z'
        result = TimeUtil.normalizeTimeString(time)
        self.assertEqual(expResult,result)

    def testNormalizeTime(self):
        print('normalizeTime')
        time = [2000, 1, 1, 24, 0, 0, 0]
        expResult = [2000, 1, 2, 0, 0, 0, 0]
        TimeUtil.normalizeTime(time)
        self.assertEqual(expResult,time)
        time = [2000, 1, 1, -1, 0, 0, 0]
        expResult = [1999, 12, 31, 23, 0, 0, 0]
        TimeUtil.normalizeTime(time)
        self.assertEqual(expResult,time)
        time = [1979, 13, 6, 0, 0, 0, 0]
        expResult = [1980, 1, 6, 0, 0, 0, 0]
        TimeUtil.normalizeTime(time)
        self.assertEqual(expResult,time)
        time = [1979, 12, 37, 0, 0, 0, 0]
        expResult = [1980, 1, 6, 0, 0, 0, 0]
        TimeUtil.normalizeTime(time)
        self.assertEqual(expResult,time)

    # Test of isoTimeFromArray method, of class TimeUtil.
    def testIsoTimeFromArray(self):
        print('isoTimeFromArray')
        nn = [1999, 12, 31, 23, 0, 0, 0]
        expResult = '1999-12-31T23:00:00.000000000Z'
        result = TimeUtil.isoTimeFromArray(nn)
        self.assertEqual(expResult,result)
        nn = [2000, 1, 45, 23, 0, 0, 0]
        expResult = '2000-02-14T23:00:00.000000000Z'
        result = TimeUtil.isoTimeFromArray(nn)
        self.assertEqual(expResult,result)

    # Test of isoTimeToArray method, of class TimeUtil.
    def testIsoTimeToArray(self):
        print('isoTimeToArray')
        time = ''
        expResult = [2020, 2, 3, 6, 7, 8, 10001]
        result = TimeUtil.isoTimeToArray('2020-034T06:07:08.000010001')
        self.assertEqual(expResult,result)
        expResult = [2012, 1, 17, 2, 0, 0, 245000000]
        result = TimeUtil.isoTimeToArray('2012-01-17T02:00:00.245')
        self.assertEqual(expResult,result)
        result = TimeUtil.isoTimeToArray('2020-033T06:07:08.000010001')
        result = TimeUtil.isoTimeToArray('2020-03-03Z')
        result = TimeUtil.isoTimeToArray('2020-033Z')
        result = TimeUtil.isoTimeToArray('2020-033')
        result = TimeUtil.isoTimeToArray('2020-033T00:00Z')
        result = TimeUtil.isoTimeToArray('now')
        result = TimeUtil.isoTimeToArray('lastday')
        result = TimeUtil.isoTimeToArray('lastday+PT1H')
        result = TimeUtil.isoTimeToArray('lastminute+PT1M')

    # Test of dayOfYear method, of class TimeUtil.
    def testDayOfYear(self):
        print('dayOfYear')
        year = 2000
        month = 3
        day = 1
        expResult = 61
        result = TimeUtil.dayOfYear(year, month, day)
        self.assertEqual(expResult,result)

    # Test of toMillisecondsSince1970 method, of class TimeUtil.
    def testToMillisecondsSince1970(self):
        print('toMillisecondsSince1970')
        result = TimeUtil.toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
        self.assertEqual(10958,result // 86400000)
        #  # 10958.0 days
        self.assertEqual(0,result % 86400000)
        result = TimeUtil.toMillisecondsSince1970('2020-07-09T16:35:27Z')
        self.assertEqual(1594312527000,result)

    # Test of parseISO8601Duration method, of class TimeUtil.
    # @throws java.lang.Exception
    def testParseISO8601Duration(self):
        print('parseISO8601Duration')
        stringIn = 'PT5H4M'
        expResult = [0, 0, 0, 5, 4, 0, 0]
        result = TimeUtil.parseISO8601Duration(stringIn)
        self.assertEqual(expResult,result)
        expResult = [0, 0, 0, 0, 0, 0, 123000]
        result = TimeUtil.parseISO8601Duration('PT0.000123S')
        self.assertEqual(expResult,result)
        result = TimeUtil.parseISO8601Duration('PT52.000000S')
        # Das2 parsing has a problem with this.
        expResult = [0, 0, 0, 0, 0, 52, 0]
        self.assertEqual(expResult,result)

    # Test of julianDay method, of class TimeUtil.
    def testJulianDay(self):
        print('julianDay')
        year = 2020
        month = 7
        day = 9
        expResult = 2459040
        result = TimeUtil.julianDay(year, month, day)
        self.assertEqual(expResult,result)

    def testMonthForDayOfYear(self):
        print('monthForDayOfYear')
        self.assertEqual(TimeUtil.monthForDayOfYear(2000, 45),2)

    # Test of fromJulianDay method, of class TimeUtil.
    def testFromJulianDay(self):
        print('fromJulianDay')
        julian = 2459040
        expResult = [2020, 7, 9, 0, 0, 0, 0]
        result = TimeUtil.fromJulianDay(julian)
        self.assertEqual(expResult,result)

    # Test of fromJulianDay method, of class TimeUtil.
    def testFromMillisecondsSince1970(self):
        print('fromMillisecondsSince1970')
        s = TimeUtil.fromMillisecondsSince1970(0)
        self.assertEqual(s,'1970-01-01T00:00:00.000Z')
        s = TimeUtil.fromMillisecondsSince1970(2208988800000)
        self.assertEqual(s,'2040-01-01T00:00:00.000Z')
        s = TimeUtil.fromMillisecondsSince1970(1)
        self.assertEqual(s,'1970-01-01T00:00:00.001Z')

    # Test of fromJulianDay method, of class TimeUtil.
    def testFromTT2000(self):
        print('fromTT2000')
        s = TimeUtil.fromTT2000(0)
        self.assertEqual(s,'2000-01-01T11:58:55.816000000Z')
        s = TimeUtil.fromTT2000(631108869184000000)
        self.assertEqual(s,'2020-01-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(-583934347816000000)
        self.assertEqual(s,'1981-07-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(-31579135816000000)
        self.assertEqual(s,'1999-01-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(-63115136816000000)
        self.assertEqual(s,'1998-01-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(-94651137816000000)
        self.assertEqual(s,'1997-01-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(-631195148816000000)
        self.assertEqual(s,'1980-01-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(394372867184000000)
        self.assertEqual(s,'2012-07-01T00:00:00.000000000Z')
        s = TimeUtil.fromTT2000(394372866184000000)
        self.assertEqual(s,'2012-06-30T23:59:60.000000000Z')
        s = TimeUtil.fromTT2000(394372865684000000)
        self.assertEqual(s,'2012-06-30T23:59:59.500000000Z')

    # Test of subtract method, of class TimeUtil.
    def testSubtract(self):
        print('subtract')
        base = [2020, 7, 9, 1, 0, 0, 0]
        offset = [0, 0, 0, 2, 0, 0, 0]
        expResult = [2020, 7, 8, 23, 0, 0, 0]
        result = TimeUtil.subtract(base, offset)
        self.assertEqual(expResult,result)

    # Test of add method, of class TimeUtil.
    def testAdd(self):
        print('add')
        base = [2020, 7, 8, 23, 0, 0, 0]
        offset = [0, 0, 0, 2, 0, 0, 0]
        expResult = [2020, 7, 9, 1, 0, 0, 0]
        result = TimeUtil.add(base, offset)
        self.assertEqual(expResult,result)
        base = [1979, 12, 27, 0, 0, 0, 0]
        offset = [0, 0, 10, 0, 0, 0, 0]
        expResult = [1980, 1, 6, 0, 0, 0, 0]
        result = TimeUtil.add(base, offset)
        self.assertEqual(expResult,result)

    # Test of formatIso8601Duration method, of class TimeUtil.
    def testFormatIso8601Duration(self):
        print('formatIso8601Duration')
        nn = [0, 0, 7, 0, 0, 6]
        expResult = 'P7DT6S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 0, 0, 0, 0, 200000]
        expResult = 'PT0.000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 0, 0, 0, 0, 200000000]
        expResult = 'PT0.200S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 0, 0, 0, 0, 200]
        expResult = 'PT0.000000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 0, 0, 0, 2, 200000]
        expResult = 'PT2.000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 0, 0, 0, 0, 0]
        expResult = 'PT0S'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0, 1, 0, 0, 0, 0]
        expResult = 'P1D'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)
        nn = [0, 0]
        expResult = 'P0D'
        result = TimeUtil.formatIso8601Duration(nn)
        self.assertEqual(expResult,result)

    # Test of now method, of class TimeUtil.
    def testNow(self):
        print('now')
        result = TimeUtil.now()

    # Test of parseISO8601TimeRange method, of class TimeUtil.
    def testParseISO8601TimeRange(self):
        print('parseISO8601TimeRange')
        stringIn = '1998-01-02/1998-01-17'
        expResult = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2022-W13/P7D'
        expResult = [2022, 3, 28, 0, 0, 0, 0, 2022, 4, 4, 0, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = 'P7D/2022-01-02'
        expResult = [2021, 12, 26, 0, 0, 0, 0, 2022, 1, 2, 0, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2023-01-18T17:00/18:00'
        expResult = [2023, 1, 18, 17, 0, 0, 0, 2023, 1, 18, 18, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2013-01-01/07-01'
        expResult = [2013, 1, 1, 0, 0, 0, 0, 2013, 7, 1, 0, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2017-09-13T13:06Z/2023-09-30T23:57:41Z'
        expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 57, 41, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2017-09-13T13:06:00Z/2023-09-30T23:00Z'
        expResult = [2017, 9, 13, 13, 6, 0, 0, 2023, 9, 30, 23, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)

    # Test of formatIso8601TimeRange method, of class TimeUtil.
    def testFormatIso8601TimeRange(self):
        print('formatIso8601TimeRange')
        nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
        expResult = '1998-01-02/1998-01-17'
        result = TimeUtil.formatIso8601TimeRange(nn)
        self.assertEqual(expResult,result)
        nn = [1998, 1, 2, 0, 3, 0, 0, 1998, 1, 17, 0, 3, 0, 0]
        expResult = '1998-01-02T00:03Z/1998-01-17T00:03Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        self.assertEqual(expResult,result)
        nn = [1998, 1, 2, 0, 0, 2, 0, 1998, 1, 17, 0, 0, 6, 0]
        expResult = '1998-01-02T00:00:02Z/1998-01-17T00:00:06Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        self.assertEqual(expResult,result)
        nn = [1998, 1, 2, 0, 0, 0, 300, 1998, 1, 2, 0, 0, 0, 500]
        expResult = '1998-01-02T00:00:00.000000300Z/1998-01-02T00:00:00.000000500Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        self.assertEqual(expResult,result)

    # Test of formatIso8601Time method, of class TimeUtil.
    def testFormatIso8601TimeInTimeRange(self):
        print('formatIso8601Time')
        nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
        offset = 7
        expResult = '1998-01-17T00:00:00.000000000Z'
        result = TimeUtil.formatIso8601TimeInTimeRange(nn, offset)
        self.assertEqual(expResult,result)

    # Test of formatIso8601Time method, of class TimeUtil.
    def testFormatIso8601TimeInTime(self):
        print('formatIso8601Time')
        nn = [1998, 1, 2, 0, 0, 0, 0, 1998, 1, 17, 0, 0, 0, 0]
        expResult = '1998-01-02T00:00:00.000000000Z'
        result = TimeUtil.formatIso8601Time(nn)
        self.assertEqual(expResult,result)

    # Test of dayOfWeek method, of class TimeUtil.
    def testDayOfWeek(self):
        print('dayOfWeek')
        year = 2022
        month = 3
        day = 12
        expResult = 5
        result = TimeUtil.dayOfWeek(year, month, day)
        self.assertEqual(expResult,result)

    # Test of fromWeekOfYear method, of class TimeUtil.
    def testFromWeekOfYear(self):
        print('fromWeekOfYear')
        year = 2022
        weekOfYear = 13
        result = [0] * 7
        TimeUtil.fromWeekOfYear(year, weekOfYear, result)
        expResult = [2022, 3, 28, 0, 0, 0, 0]
        self.assertEqual(expResult,result)
        year = 2022
        weekOfYear = 0
        result = [0] * 7
        TimeUtil.fromWeekOfYear(year, weekOfYear, result)
        expResult = [2021, 12, 27, 0, 0, 0, 0]
        self.assertEqual(expResult,result)

    # Test of parseISO8601Time method, of class TimeUtil.
    def testParseISO8601Time(self):
        print('parseISO8601Time')
        string = '2020-033T00:00'
        expResult = [2020, 2, 2, 0, 0, 0, 0]
        try:
            result = TimeUtil.parseISO8601Time(string)
            self.assertEqual(expResult,result)
        except Exception as ex:  # J2J: exceptions
            raise AssertionError(ex)

    # Test of getStartTime method, of class TimeUtil.
    def testGetStartTime(self):
        print('getStartTime')
        timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10]
        expResult = [2025, 2, 4, 5, 6, 7, 8]
        result = TimeUtil.getStartTime(timerange)
        self.assertEqual(expResult,result)

    # Test of getStopTime method, of class TimeUtil.
    def testGetStopTime(self):
        print('getStopTime')
        timerange = [2025, 2, 4, 5, 6, 7, 8, 2025, 2, 4, 7, 8, 9, 10]
        expResult = [2025, 2, 4, 7, 8, 9, 10]
        result = TimeUtil.getStopTime(timerange)
        self.assertEqual(expResult,result)

    # Test of leapSecondsAt method, of class TimeUtil.
    def testLeapSecondsAt(self):
        print('leapSecondsAt')
        tt2000 = 0
        expResult = 32
        result = TimeUtil.leapSecondsAt(tt2000)
        self.assertEqual(expResult,result)
        result = TimeUtil.leapSecondsAt(536500869184000000)
        self.assertEqual(37,result)

    # Test of lastLeapSecond method, of class TimeUtil.
    def testLastLeapSecond(self):
        print('lastLeapSecond')
        tt2000 = 0
        expResult = -31579135816000000
        result = TimeUtil.lastLeapSecond(tt2000)
        self.assertEqual(expResult,result)

    # Test of formatHMSN method, of class TimeUtil.
    def testFormatHMSN(self):
        print('formatHMSN')
        nanosecondsSinceMidnight = 56
        expResult = '00:00:00.000000056'
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
        self.assertEqual(expResult,result)
        nanosecondsSinceMidnight = 3600 * 24 * 1000000000
        expResult = '23:59:60.000000000'
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
        self.assertEqual(expResult,result)
        nanosecondsSinceMidnight = 3600 * 24 * 1000000000 + 1 * 1000000000 + 500 * 1000000
        expResult = '23:59:61.500000000'
        result = TimeUtil.formatHMSN(nanosecondsSinceMidnight)
        self.assertEqual(expResult,result)

    def testDaysInMonth(self):
        print('daysInMonth')
        year = 2000
        month = 2
        expResult = 29
        result = TimeUtil.daysInMonth(year, month)
        self.assertEqual(expResult,result)
        year = 2004
        month = 1
        expResult = 31
        result = TimeUtil.daysInMonth(year, month)
        self.assertEqual(expResult,result)
        year = 2008
        month = 12
        expResult = 31
        result = TimeUtil.daysInMonth(year, month)
        self.assertEqual(expResult,result)

    # Test of setStartTime method, of class TimeUtil.
    def testSetStartTime(self):
        print('setStartTime')
        time = [2000, 1, 1, 2, 3, 4, 900000]
        timerange = [0] * 14
        TimeUtil.setStartTime(time, timerange)
        self.assertEqual(time,timerange[0:7])

    # Test of setStopTime method, of class TimeUtil.
    def testSetStopTime(self):
        print('setStopTime')
        print('setStopTime')
        time = [2000, 1, 1, 2, 3, 4, 900000]
        timerange = [0] * 14
        TimeUtil.setStopTime(time, timerange)
        self.assertEqual(time,timerange[7:14])

    # Test of fromSecondsSince1970 method, of class TimeUtil.
    def testFromSecondsSince1970(self):
        print('fromSecondsSince1970')
        time = 0.0
        expResult = '1970-01-01T00:00:00.000Z'
        result = TimeUtil.fromSecondsSince1970(time)
        self.assertEqual(expResult,result)
        time = 1707868800.5
        expResult = '2024-02-14T00:00:00.500Z'
        result = TimeUtil.fromSecondsSince1970(time)
        self.assertEqual(expResult,result)

    # Test of createTimeRange method, of class TimeUtil.
    def testCreateTimeRange(self):
        print('createTimeRange')
        t1 = [2024, 2, 14, 3, 4, 5, 0]
        t2 = [2024, 2, 14, 6, 4, 5, 0]
        expResult = [2024, 2, 14, 3, 4, 5, 0, 2024, 2, 14, 6, 4, 5, 0]
        result = TimeUtil.createTimeRange(t1, t2)
        self.assertEqual(expResult,result)

    # Test of formatIso8601Time method, of class TimeUtil.
    def testFormatIso8601Time_intArr(self):
        print('formatIso8601Time')
        nn = [2024, 2, 14, 6, 4, 5, 0]
        expResult = '2024-02-14T06:04:05.000000000Z'
        result = TimeUtil.formatIso8601Time(nn)
        self.assertEqual(expResult,result)

    # Test of isValidTime method, of class TimeUtil.
    def testIsValidTime(self):
        print('isValidTime')
        time = [2024, 2, 15, 3, 4, 5, 600000000]
        expResult = True
        result = TimeUtil.isValidTime(time)
        self.assertEqual(expResult,result)
        time = [9999, 2, 15, 3, 4, 5, 600000000]
        expResult = False
        try:
            result = TimeUtil.isValidTime(time)
            fail('should not be valid')
        except Exception as ex:  # J2J: exceptions
            pass
        time = [2024, 1, 245, 3, 4, 5, 600000000]
        expResult = True
        result = TimeUtil.isValidTime(time)
        self.assertEqual(expResult,result)

    # Test of isValidFormattedTime method, of class TimeUtil.
    def testIsValidFormattedTime(self):
        print('isValidFormattedTime')
        time = '2024-02-14T00:00Z'
        expResult = True
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(expResult,result)
        time = 'now-P1D'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = '2000'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = '2000-01'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'now'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'lastyear'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'lastmonth'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'lastday'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'lasthour'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'now-P1D'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)
        time = 'lastday-P1D'
        result = TimeUtil.isValidFormattedTime(time)
        self.assertEqual(True,result)

    # Test of gt method, of class TimeUtil.
    def testGt(self):
        print('gt')
        t1 = [2024, 1, 1, 0, 0, 0, 0]
        t2 = [2024, 1, 1, 0, 0, 0, 1]
        expResult = False
        result = TimeUtil.gt(t1, t2)
        self.assertEqual(expResult,result)
        expResult = True
        result = TimeUtil.gt(t2, t1)
        self.assertEqual(expResult,result)
        expResult = False
        result = TimeUtil.gt(t1, t1)
        self.assertEqual(expResult,result)

    # Test of eq method, of class TimeUtil.
    def testEq(self):
        print('eq')
        t1 = [2024, 1, 1, 0, 0, 0, 0]
        t2 = [2024, 1, 1, 0, 0, 0, 1]
        expResult = False
        result = TimeUtil.eq(t1, t2)
        self.assertEqual(expResult,result)
        expResult = False
        result = TimeUtil.eq(t2, t1)
        self.assertEqual(expResult,result)
        expResult = True
        result = TimeUtil.eq(t1, t1)
        self.assertEqual(expResult,result)

    # Test of formatIso8601TimeBrief method, of class TimeUtil.
    def testFormatIso8601TimeBrief_intArr(self):
        print('formatIso8601TimeBrief')
        time = [2000, 1, 1, 0, 0, 0, 0]
        expResult = '2000-01-01T00:00Z'
        result = TimeUtil.formatIso8601TimeBrief(time)
        self.assertEqual(expResult,result)
        time = [2000, 1, 1, 0, 0, 1, 0]
        expResult = '2000-01-01T00:00:01Z'
        result = TimeUtil.formatIso8601TimeBrief(time)
        self.assertEqual(expResult,result)
        time = [2000, 1, 1, 0, 0, 1, 500000000]
        expResult = '2000-01-01T00:00:01.500Z'
        result = TimeUtil.formatIso8601TimeBrief(time)
        self.assertEqual(expResult,result)
        time = [2000, 1, 1, 0, 0, 1, 500500000]
        expResult = '2000-01-01T00:00:01.500500Z'
        result = TimeUtil.formatIso8601TimeBrief(time)
        self.assertEqual(expResult,result)

    # Test of formatIso8601TimeInTimeRangeBrief method, of class TimeUtil.
    def testFormatIso8601TimeInTimeRangeBrief(self):
        print('formatIso8601TimeInTimeRangeBrief')
        time = [1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0]
        expResult = '1999-01-01T00:00Z'
        result = TimeUtil.formatIso8601TimeInTimeRangeBrief(time, 0)
        self.assertEqual(expResult,result)
        time = [1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 1, 0]
        expResult = '2000-01-01T00:00:01Z'
        result = TimeUtil.formatIso8601TimeInTimeRangeBrief(time, TimeUtil.TIME_DIGITS)
        self.assertEqual(expResult,result)

    # Test of isValidTimeRange method, of class TimeUtil.
    def testIsValidTimeRange(self):
        print('isValidTimeRange')
        timerange = [1999, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0]
        expResult = True
        result = TimeUtil.isValidTimeRange(timerange)
        self.assertEqual(expResult,result)
        timerange = [2000, 1, 1, 0, 0, 0, 0, 1999, 1, 1, 0, 0, 0, 0]
        expResult = False
        result = TimeUtil.isValidTimeRange(timerange)
        self.assertEqual(expResult,result)
        timerange = [2000, 1, 1, 0, 0, 0, 0, 2000, 1, 1, 0, 0, 0, 0]
        expResult = False
        result = TimeUtil.isValidTimeRange(timerange)
        self.assertEqual(expResult,result)


if __name__ == '__main__':
    unittest.main()
