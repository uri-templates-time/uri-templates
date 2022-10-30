
from TimeUtil import TimeUtil

# cheesy unittest temporary
def assertEquals(a,b):
    if ( not a==b ): raise Exception('a!=b')
def assertArrayEquals(a,b):
    if ( len(a)==len(b) ): 
        for i in range(len(a)): 
            if ( a[i]!=b[i] ): raise Exception('a[%d]!=b[%d]'%(i,i))
def fail(msg):
    print(msg)
    raise Exception('fail: '+msg)

# Tests of the useful TimeUtil.java code.
# @author jbf
class TimeUtilTest:
    def __init__(self):
        pass

    # Test of reformatIsoTime method, of class TimeUtil.
    def testReformatIsoTime(self):
        print('reformatIsoTime')
        exampleForm = '2020-01-01T00:00Z'
        time = '2020-112Z'
        expResult = '2020-04-21T00:00Z'
        result = TimeUtil.reformatIsoTime(exampleForm,time)
        assertEquals(expResult,result)

    # Test of monthNameAbbrev method, of class TimeUtil.
    def testMonthNameAbbrev(self):
        print('monthNameAbbrev')
        expResult = 'Mar'
        result = TimeUtil.monthNameAbbrev(3)
        assertEquals(expResult,result)

    # Test of monthNumber method, of class TimeUtil.
    def testMonthNumber(self):
        print('monthNumber')
        s = 'December'
        expResult = 12
        result = TimeUtil.monthNumber(s)
        assertEquals(expResult,result)

    # Test of countOffDays method, of class TimeUtil.
    def testCountOffDays(self):
        print('countOffDays')
        startTime = '1999-12-31Z'
        stopTime = '2000-01-03Z'
        expResult = [ '1999-12-31Z','2000-01-01Z','2000-01-02Z' ]
        result = TimeUtil.countOffDays(startTime,stopTime)
        assertArrayEquals(expResult,result)
        startTime = '1999-12-31T12:00Z'
        stopTime = '2000-01-03T12:00Z'
        expResult = [ '1999-12-31Z','2000-01-01Z','2000-01-02Z' ]
        result = TimeUtil.countOffDays(startTime,stopTime)
        assertArrayEquals(expResult,result)

    # Test of nextDay method, of class TimeUtil.
    def testNextDay(self):
        print('nextDay')
        day = '2019-12-31Z'
        expResult = '2020-01-01Z'
        result = TimeUtil.nextDay(day)
        assertEquals(expResult,result)

    # Test of previousDay method, of class TimeUtil.
    def testPreviousDay(self):
        print('previousDay')
        day = '2020-01-01'
        expResult = '2019-12-31Z'
        result = TimeUtil.previousDay(day)
        assertEquals(expResult,result)

    # Test of ceil method, of class TimeUtil.
    def testCeil(self):
        print('ceil')
        time = '2000-01-01T00:00'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.ceil(time)
        assertEquals(expResult,result)
        time = '2000-01-01T23:59'
        expResult = '2000-01-02T00:00:00.000000000Z'
        result = TimeUtil.ceil(time)
        assertEquals(expResult,result)

    # Test of floor method, of class TimeUtil.
    def testFloor(self):
        print('floor')
        time = '2000-01-01T00:00'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.floor(time)
        assertEquals(expResult,result)
        time = '2000-01-01T23:59'
        expResult = '2000-01-01T00:00:00.000000000Z'
        result = TimeUtil.floor(time)
        assertEquals(expResult,result)

    # Test of normalizeTimeString method, of class TimeUtil.
    def testNormalizeTimeString(self):
        print('normalizeTimeString')
        time = '2020-03-04T24:00:00Z'
        expResult = '2020-03-05T00:00:00.000000000Z'
        result = TimeUtil.normalizeTimeString(time)
        assertEquals(expResult,result)

    def testNormalizeTime(self):
        print('normalizeTime')
        time = [ 2000,1,1,24,0,0,0 ]
        expResult = [ 2000,1,2,0,0,0,0 ]
        TimeUtil.normalizeTime(time)
        assertArrayEquals(expResult,time)
        time = [ 2000,1,1,-1,0,0,0 ]
        expResult = [ 1999,12,31,23,0,0,0 ]
        TimeUtil.normalizeTime(time)
        assertArrayEquals(expResult,time)
        time = [ 1979,13,6,0,0,0,0 ]
        expResult = [ 1980,1,6,0,0,0,0 ]
        TimeUtil.normalizeTime(time)
        assertArrayEquals(expResult,time)
        time = [ 1979,12,37,0,0,0,0 ]
        expResult = [ 1980,1,6,0,0,0,0 ]
        TimeUtil.normalizeTime(time)
        assertArrayEquals(expResult,time)

    # Test of isoTimeFromArray method, of class TimeUtil.
    def testIsoTimeFromArray(self):
        print('isoTimeFromArray')
        nn = [ 1999,12,31,23,0,0,0 ]
        expResult = '1999-12-31T23:00:00.000000000Z'
        result = TimeUtil.isoTimeFromArray(nn)
        assertEquals(expResult,result)
        nn = [ 2000,1,45,23,0,0,0 ]
        expResult = '2000-02-14T23:00:00.000000000Z'
        result = TimeUtil.isoTimeFromArray(nn)
        assertEquals(expResult,result)

    # Test of isoTimeToArray method, of class TimeUtil.
    def testIsoTimeToArray(self):
        print('isoTimeToArray')
        time = ''
        expResult = [ 2020,2,3,6,7,8,10001 ]
        result = TimeUtil.isoTimeToArray('2020-034T06:07:08.000010001')
        assertArrayEquals(expResult,result)
        expResult = [ 2012,1,17,2,0,0,245000000 ]
        result = TimeUtil.isoTimeToArray('2012-01-17T02:00:00.245')
        assertArrayEquals(expResult,result)
        TimeUtil.isoTimeToArray('2020-033T06:07:08.000010001')
        TimeUtil.isoTimeToArray('2020-03-03Z')
        TimeUtil.isoTimeToArray('2020-033Z')
        TimeUtil.isoTimeToArray('2020-033')
        TimeUtil.isoTimeToArray('2020-033T00:00Z')
        TimeUtil.isoTimeToArray('now')
        TimeUtil.isoTimeToArray('lastday')
        TimeUtil.isoTimeToArray('lastday+PT1H')
        TimeUtil.isoTimeToArray('lastminute+PT1M')

    # Test of dayOfYear method, of class TimeUtil.
    def testDayOfYear(self):
        print('dayOfYear')
        year = 2000
        month = 3
        day = 1
        expResult = 61
        result = TimeUtil.dayOfYear(year,month,day)
        assertEquals(expResult,result)

    # Test of toMillisecondsSince1970 method, of class TimeUtil.
    def testToMillisecondsSince1970(self):
        print('toMillisecondsSince1970')
        result = TimeUtil.toMillisecondsSince1970('2000-01-02T00:00:00.0Z')
        assertEquals(10958,result // 86400000)
        #  # 10958.0 days
        assertEquals(0,result % 86400000)
        result = TimeUtil.toMillisecondsSince1970('2020-07-09T16:35:27Z')
        assertEquals(1594312527000,result)

    # Test of parseISO8601Duration method, of class TimeUtil.
    # @throws java.lang.Exception
    def testParseISO8601Duration(self):
        print('parseISO8601Duration')
        stringIn = 'PT5H4M'
        expResult = [ 0,0,0,5,4,0,0 ]
        result = TimeUtil.parseISO8601Duration(stringIn)
        assertArrayEquals(expResult,result)
        expResult = [ 0,0,0,0,0,0,123000 ]
        result = TimeUtil.parseISO8601Duration('PT0.000123S')
        assertArrayEquals(expResult,result)

    # Test of julianDay method, of class TimeUtil.
    def testJulianDay(self):
        print('julianDay')
        year = 2020
        month = 7
        day = 9
        expResult = 2459040
        result = TimeUtil.julianDay(year,month,day)
        assertEquals(expResult,result)

    def testMonthForDayOfYear(self):
        print('monthForDayOfYear')
        assertEquals(TimeUtil.monthForDayOfYear(2000,45),2)

    # Test of fromJulianDay method, of class TimeUtil.
    def testFromJulianDay(self):
        print('fromJulianDay')
        julian = 2459040
        expResult = [ 2020,7,9,0,0,0,0 ]
        result = TimeUtil.fromJulianDay(julian)
        assertArrayEquals(expResult,result)

    # Test of subtract method, of class TimeUtil.
    def testSubtract(self):
        print('subtract')
        base = [ 2020,7,9,1,0,0,0 ]
        offset = [ 0,0,0,2,0,0,0 ]
        expResult = [ 2020,7,8,23,0,0,0 ]
        result = TimeUtil.subtract(base,offset)
        assertArrayEquals(expResult,result)

    # Test of add method, of class TimeUtil.
    def testAdd(self):
        print('add')
        base = [ 2020,7,8,23,0,0,0 ]
        offset = [ 0,0,0,2,0,0,0 ]
        expResult = [ 2020,7,9,1,0,0,0 ]
        result = TimeUtil.add(base,offset)
        assertArrayEquals(expResult,result)
        base = [ 1979,12,27,0,0,0,0 ]
        offset = [ 0,0,10,0,0,0,0 ]
        expResult = [ 1980,1,6,0,0,0,0 ]
        result = TimeUtil.add(base,offset)
        assertArrayEquals(expResult,result)

    # Test of formatIso8601Duration method, of class TimeUtil.
    def testFormatIso8601Duration(self):
        print('formatIso8601Duration')
        nn = [ 0,0,7,0,0,6 ]
        expResult = 'P7DT6S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,0,0,0,0,200000 ]
        expResult = 'PT0.000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,0,0,0,0,200000000 ]
        expResult = 'PT0.200S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,0,0,0,0,200 ]
        expResult = 'PT0.000000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,0,0,0,2,200000 ]
        expResult = 'PT2.000200S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,0,0,0,0,0 ]
        expResult = 'PT0S'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0,1,0,0,0,0 ]
        expResult = 'P1D'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)
        nn = [ 0,0 ]
        expResult = 'P0D'
        result = TimeUtil.formatIso8601Duration(nn)
        assertEquals(expResult,result)

    # Test of now method, of class TimeUtil.
    def testNow(self):
        print('now')
        TimeUtil.now()

    # Test of parseISO8601TimeRange method, of class TimeUtil.
    def testParseISO8601TimeRange(self):
        print('parseISO8601TimeRange')
        stringIn = '1998-01-02/1998-01-17'
        expResult = [ 1998,1,2,0,0,0,0,1998,1,17,0,0,0,0 ]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            assertArrayEquals(expResult,result)
        except Exception as ex: # J2J: exceptions
            raise AssertionError(ex)
        stringIn = '2022-W13/P7D'
        expResult = [ 2022,3,28,0,0,0,0,2022,4,4,0,0,0,0 ]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            assertArrayEquals(expResult,result)
        except Exception as ex: # J2J: exceptions
            raise AssertionError(ex)
        stringIn = 'P7D/2022-01-02'
        expResult = [ 2021,12,26,0,0,0,0,2022,1,2,0,0,0,0 ]
        try:
            result = TimeUtil.parseISO8601TimeRange(stringIn)
            assertArrayEquals(expResult,result)
        except Exception as ex: # J2J: exceptions
            raise AssertionError(ex)

    # Test of formatIso8601TimeRange method, of class TimeUtil.
    def testFormatIso8601TimeRange(self):
        print('formatIso8601TimeRange')
        nn = [ 1998,1,2,0,0,0,0,1998,1,17,0,0,0,0 ]
        expResult = '1998-01-02/1998-01-17'
        result = TimeUtil.formatIso8601TimeRange(nn)
        assertEquals(expResult,result)
        nn = [ 1998,1,2,0,3,0,0,1998,1,17,0,3,0,0 ]
        expResult = '1998-01-02T00:03Z/1998-01-17T00:03Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        assertEquals(expResult,result)
        nn = [ 1998,1,2,0,0,2,0,1998,1,17,0,0,6,0 ]
        expResult = '1998-01-02T00:00:02Z/1998-01-17T00:00:06Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        assertEquals(expResult,result)
        nn = [ 1998,1,2,0,0,0,300,1998,1,2,0,0,0,500 ]
        expResult = '1998-01-02T00:00:00.000000300Z/1998-01-02T00:00:00.000000500Z'
        result = TimeUtil.formatIso8601TimeRange(nn)
        assertEquals(expResult,result)

    # Test of formatIso8601Time method, of class TimeUtil.
    def testFormatIso8601TimeInTimeRange(self):
        print('formatIso8601Time')
        nn = [ 1998,1,2,0,0,0,0,1998,1,17,0,0,0,0 ]
        offset = 7
        expResult = '1998-01-17T00:00:00.000000000Z'
        result = TimeUtil.formatIso8601TimeInTimeRange(nn,offset)
        assertEquals(expResult,result)

    # Test of formatIso8601Time method, of class TimeUtil.
    def testFormatIso8601TimeInTime(self):
        print('formatIso8601Time')
        nn = [ 1998,1,2,0,0,0,0,1998,1,17,0,0,0,0 ]
        expResult = '1998-01-02T00:00:00.000000000Z'
        result = TimeUtil.formatIso8601Time(nn)
        assertEquals(expResult,result)

    # Test of dayOfWeek method, of class TimeUtil.
    def testDayOfWeek(self):
        print('dayOfWeek')
        year = 2022
        month = 3
        day = 12
        expResult = 5
        result = TimeUtil.dayOfWeek(year,month,day)
        assertEquals(expResult,result)

    # Test of fromWeekOfYear method, of class TimeUtil.
    def testFromWeekOfYear(self):
        print('fromWeekOfYear')
        year = 2022
        weekOfYear = 13
        result = [0] * 7
        TimeUtil.fromWeekOfYear(year,weekOfYear,result)
        expResult = [ 2022,3,28,0,0,0,0 ]
        assertArrayEquals(expResult,result)
        year = 2022
        weekOfYear = 0
        result = [0] * 7
        TimeUtil.fromWeekOfYear(year,weekOfYear,result)
        expResult = [ 2021,12,27,0,0,0,0 ]
        assertArrayEquals(expResult,result)

    # Test of parseISO8601Time method, of class TimeUtil.
    def testParseISO8601Time(self):
        print('parseISO8601Time')
        string = '2020-033T00:00'
        expResult = [ 2020,2,2,0,0,0,0 ]
        try:
            result = TimeUtil.parseISO8601Time(string)
            assertArrayEquals(expResult,result)
        except Exception as ex: # J2J: exceptions
            raise AssertionError(ex)

test = TimeUtilTest()
test.testReformatIsoTime()
test.testMonthNameAbbrev()
test.testMonthNumber()
test.testCountOffDays()
test.testNextDay()
test.testPreviousDay()
test.testCeil()
test.testFloor()
test.testNormalizeTimeString()
test.testNormalizeTime()
test.testIsoTimeFromArray()
test.testIsoTimeToArray()
test.testDayOfYear()
test.testToMillisecondsSince1970()
test.testParseISO8601Duration()
test.testJulianDay()
test.testMonthForDayOfYear()
test.testFromJulianDay()
test.testSubtract()
test.testAdd()
test.testFormatIso8601Duration()
test.testNow()
test.testParseISO8601TimeRange()
test.testFormatIso8601TimeRange()
test.testFormatIso8601TimeInTimeRange()
test.testFormatIso8601TimeInTime()
test.testDayOfWeek()
test.testFromWeekOfYear()
test.testParseISO8601Time()


