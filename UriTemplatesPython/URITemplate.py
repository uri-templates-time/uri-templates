import math
import re
import sys

from TimeUtil import TimeUtil

# URITemplate implements a URI_Template, as described in 
# https://github.com/hapi-server/uri-templates/wiki/Specification
# The main method shows how the library can be used to format
# and parse codes, but briefly parsing is done using the parse
# method:<pre>
#   URITemplate ut= new URITemplate("/tmp/$Y$m$d_$(v,name=sc).dat");
#   String filen1= "/tmp/20220314_3.dat";
#   int[] itimeRange= ut.parse( filen1, new HashMap<>() );
# </pre>
# Formatting is done with the format method:<pre>
#   URITemplate ut= new URITemplate("/tmp/$Y$m$d_$(v,name=sc).dat");
#   ut.format( new int[] { 2022, 3, 14, 0, 0, 0, 0 }, new int[] { 2022, 3, 15, 0, 0, 0, 0 }, Collections.singletonMap( "sc", "3" ) );
# </pre>
# 
# @author jbf
class URITemplate:

    VERSION = '20241217.1'
    
    @staticmethod
    def getVersion():
        return URITemplate.VERSION

    # the earliest valid year, limited because of Julian day calculations.
    MIN_VALID_YEAR = 1582

    # the last valid year.
    MAX_VALID_YEAR = 9000

    # the number of elements in an int array used to store times.  The
    # seven elements are: <ul>
    # <li>0: year, the four digit common era year
    # <li>1: month, the month number between 1 and 12.
    # <li>2: day, the day of the month, starting at 1.
    # <li>3: hour, the hour of the day, starting at 0 and as much as 23.
    # <li>4: minute, the minute of the hour, starting at 0 and as much as 59.
    # <li>5: seconds, the second of the minute, starting at 0 and as much as 59, and much as 60 for leap seconds.
    # <li>6: nanoseconds, the nanoseconds into the second, starting at 0 and as much as 999999999.
    # </ul>
    NUM_TIME_DIGITS = 7

    YEAR = 0

    MONTH = 1

    DAY = 2

    HOUR = 3

    MINUTE = 4

    SECOND = 5

    NANOSECOND = 6

    # initial state of the afterstop field, present when no stop time is found.
    AFTERSTOP_INIT = 999

    # the specification, like $Y$m$d_$(Y;end)$m$d.dat
    spec = None

    # number of digits, or components would be a better name.  For example, $Y/$Y$m$d.dat has four digits.
    ndigits = 0

    # non-template stuff between fields (_ in $Y_$m) are the "delims"
    delims = None

    qualifiers = None

    qualifiersMaps = None  # J2J added

    fieldHandlersById = None  # J2J added

    # one element for each field, it is the handler (or type) of each field.
    handlers = None  # J2J added

    handlerObjects = None  # J2J added

    # one element for each field, containing the offset to each field, or -1 if the offset is not determined.
    offsets = None  # J2J added

    # one element for each field, containing number of digits in each field, or -1 if the length is not known.
    lengths = None  # J2J added

    # shift found in each digit--going away
    shift = None  # J2J added

    # int[7] shift for each component for the start time.
    startShift = None

    # int[7] shift for each component for the stop time.
    stopShift = None

    fc = None

    # first digit which is part of the stop time
    stopTimeDigit = 0

    lsd = 0

    timeWidth = None  # J2J added

    # when adding (for example 100 days) don't allow stop time to be late in the year, truncate at the year boundary.
    disallowCarryForStopTime = False

    # the template explicitly defines the width, with delta or other specifiers.
    timeWidthIsExplicit = False

    regex = None

    context = None  # J2J added

    # typically zero, the number of digits which come from an external context.
    externalContext = 0

    valid_formatCodes = ['Y', 'y', 'j', 'm', 'd', 'H', 'M', 'S', 'N', 'milli', 'micro', 'z', 'ignore', 'b', 'p']

    formatName = ['Year', '2-digit-year', 'day-of-year', 'month', 'day', 'Hour', 'Minute', 'Second', 'nanosecond', 'millisecond', 'microsecond', 'RFC-822 numeric time zone', 'ignore', '3-char-month-name', 'am/pm']

    formatCode_lengths = [4, 2, 3, 2, 2, 2, 2, 2, 9, 3, 3, 5, -1, 3, 2]

    precision = [0, 0, 2, 1, 2, 3, 4, 5, 6, 6, 7, -1, -1, 1, -1]

    startTimeOnly = None  # J2J added

    # null or the phasestart.
    phasestart = None  # J2J added

    startLsd = 0

    twoDigitYearStart = 1950

    # parse the formatted arguments into a map from name to value.
    # @param args formatted arguments, like A=1;B=2;fmt=lc
    # @return map of arguments { 'A':'1'; 'B':'2'; 'fmt':'lc' }
    @staticmethod
    def parseArgs(args):
        argv = {}
        if args != None:
            ss2 = args.split(';')
            for ss21 in ss2:
                i3 = ss21.find('=')
                if i3 == -1:
                    argv[ss21.strip()] = ''
                else:
                    argv[ss21[0:i3].strip()] = ss21[i3 + 1:].strip()
        return argv

    # return the value within the map, or the deft if the argument is not in the map.
    # @param args a map (or dictionary) of the arguments
    # @param arg the argument to retrieve
    # @param deft the default value to return when the argument is not found.
    # @return the value.
    @staticmethod
    def getArg(args, arg, deft):
        if args is None:
            return deft
        if arg in args:
            return args[arg]
        else:
            return deft

    # Interface to add custom handlers for strings with unique formats.  For 
    # example, the RPWS group had files with two-hex digits indicating the 
    # ten-minute interval covered by the file name. 
    class FieldHandler:
        # arguments for the parser are passed in.
        # @param args map of arguments.  $(t,a1=v1,a2=v2,a3=v3)
        # @return null if the string is parseable, an error message otherwise.
        def configure(self, args):
            pass
        # return a regular expression that matches valid field entries.  ".*" can be used to match anything, but this limits use.
        # TODO: where is this used?  I added it because it's easy and I saw a TODO to add it.
        # @return null to match anything, or a regular expression matching valid entries.
        def getRegex(self):
            pass
        # parse the field to interpret as a time range.
        # @param fieldContent the field to parse, for example "2014" for $Y
        # @param startTime the current startTime
        # @param timeWidth the current timeWidth
        # @param extra extra data, such as version numbers, are passed out here.
        # @throws ParseException when the field is not consistent with the spec.
        def parse(self, fieldContent, startTime, timeWidth, extra):
            pass
        # create a string given the times, when this is possible.  An 
        # IllegalArgumentException should be thrown when this is not possible, 
        # but be loose so this can be composed with other field handlers.  
        # For example, imagine the $Y field handler.  This should not throw an 
        # exception when 2012-03-29 is passed in because it's not 2012-01-01, 
        # because the $m and $d might be used later.  However if a time is 
        # specified for a year before the first orbit of a spacecraft, then an 
        # exception should be thrown because there is an error that the 
        # developer is going to have to deal with.
        # 
        # @param startTime the startTime in [ Y, m, d, H, M, S, N ]
        # @param timeWidth the width in [ Y, m, d, H, M, S, N ]
        # @param length, -1 or the length of the field.
        # @param extra extra data, such as version numbers, are passed in here.
        # @return the string representing the time range specified.
        # @throws IllegalArgumentException when the arguments passed in are not sufficient.
        def format(self, startTime, timeWidth, length, extra):
            pass

    # $(subsec;places=6)  "36" → "36 microseconds"
    class SubsecFieldHandler(FieldHandler):
        places = 0

        nanosecondsFactor = 0

        formatStr = None

        def configure(self, args):
            self.places = int(URITemplate.getArg(args, 'places', None))
            if self.places > 9:
                raise Exception('only nine places allowed.')
            self.nanosecondsFactor = int((10**((9 - self.places))))
            self.formatStr = '%0' + str(self.places) + 'd'
            return None

        def getRegex(self):
            b = ""
            for i in range(0, self.places):
                b+= '[0-9]'
            return b

        def parse(self, fieldContent, startTime, timeWidth, extra):
            value = float(fieldContent)
            startTime[6] = int((value * self.nanosecondsFactor))
            timeWidth[5] = 0
            timeWidth[6] = self.nanosecondsFactor

        def format(self, startTime, timeWidth, length, extra):
            nn = startTime[6] // self.nanosecondsFactor
            return self.formatStr % int(round(nn))


    # $(hrinterval;names=a,b,c,d)  "b" → "06:00/12:00"
    class HrintervalFieldHandler(FieldHandler):
        values = None  # J2J added

        revvalues = None  # J2J added

        # multiply by this to get the start hour
        mult = 0

        def configure(self, args):
            vs = URITemplate.getArg(args, 'values', None)
            if vs is None:
                vs = URITemplate.getArg(args, 'names', None)
            if vs is None:
                return 'values must be specified for hrinterval'
            values1 = vs.split(',')
            self.mult = 24 / len(values1)
            if 24 - self.mult * len(values1) != 0:
                raise Exception('only 1,2,3,4,6,8 or 12 intervals')
            self.values = {}
            self.revvalues = {}
            for i in range(0, len(values1)):
                self.values[values1[i]] = i
                self.revvalues[i] = values1[i]
            return None

        def getRegex(self):
            vv = self.values.keySet().iterator()
            r = str(vv.next())
            while vv.hasNext():
                r+= '|' + str(vv.next())
            return r

        def parse(self, fieldContent, startTime, timeWidth, extra):
            if fieldContent in self.values:
                ii = self.values[fieldContent]
            else:
                raise Exception('expected one of ' + self.getRegex())
            hour = self.mult * ii
            startTime[3] = hour
            timeWidth[3] = self.mult
            timeWidth[0] = 0
            timeWidth[1] = 0
            timeWidth[2] = 0

        def format(self, startTime, timeWidth, length, extra):
            key = startTime[3] // self.mult
            if key in self.revvalues:
                v = self.revvalues[key]
                return v
            else:
                raise Exception('unable to identify enum for hour ' + str(startTime[3]))


    # regular intervals are numbered:
    # $(periodic;offset=0;start=2000-001;period=P1D) "0" → "2000-001"
    class PeriodicFieldHandler(FieldHandler):
        offset = 0

        start = None  # J2J added

        julday = 0

        period = None  # J2J added

        args = None  # J2J added

        def configure(self, args):
            self.args = {}
            s = URITemplate.getArg(args, 'start', None)
            if s is None:
                return 'periodic field needs start'
            self.start = TimeUtil.isoTimeToArray(s)
            self.julday = TimeUtil.julianDay(self.start[0], self.start[1], self.start[2])
            self.start[0] = 0
            self.start[1] = 0
            self.start[2] = 0
            s = URITemplate.getArg(args, 'offset', None)
            if s is None:
                return 'periodic field needs offset'
            self.offset = int(s)
            s = URITemplate.getArg(args, 'period', None)
            if s is None:
                return 'periodic field needs period'
            if not s.startswith('P'):
                if s.endswith('D'):
                    raise Exception('periodic unit for day is d, not D')
                if s.endswith('d'):
                    s = 'P' + s.upper()
                else:
                    s = 'PT' + s.upper()
            try:
                self.period = TimeUtil.parseISO8601Duration(s)
            except Exception as ex:  # J2J: exceptions
                return 'unable to parse period: ' + s + '\n' + str(ex.getMessage())
            return None

        def getRegex(self):
            return '[0-9]+'

        def parse(self, fieldContent, startTime, timeWidth, extra):
            i = int(fieldContent)
            addOffset = i - self.offset
            t = [0] * URITemplate.NUM_TIME_DIGITS
            limits = [-1, -1, 0, 24, 60, 60, 1000000000]
            timeWidth[0] = 0
            timeWidth[1] = 0
            timeWidth[2] = self.period[2]
            i = 6
            while i > 2:  # J2J for loop
                t[i] = self.start[i] + addOffset * self.period[i]
                while t[i] > limits[i]:
                    t[i - 1] += 1
                    t[i] -= limits[i]
                i = i - 1
            timeWidth[3] = self.period[3]
            timeWidth[4] = self.period[4]
            timeWidth[5] = self.period[5]
            timeWidth[6] = self.period[6]
            ts = TimeUtil.fromJulianDay(self.julday + timeWidth[2] * addOffset + t[2])
            startTime[0] = ts[0]
            startTime[1] = ts[1]
            startTime[2] = ts[2]
            startTime[3] = t[3]
            startTime[4] = t[4]
            startTime[5] = t[5]
            startTime[6] = t[6]

        def format(self, startTime, timeWidth, length, extra):
            jd = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2])
            if self.period[1] != 0 or self.period[3] != 0 or self.period[4] != 0 or self.period[5] != 0 or self.period[6] != 0:
                raise Exception('under implemented, only integer number of days supported for formatting.')
            deltad = int((math.floor((jd - self.julday) / (self.period[2])))) + self.offset
            result = '%d' % deltad
            if length > 16:
                raise Exception('length>16 not supported')
            elif length > -1:
                result = '_________________'[0:length - len(result)] + result
            return result


    # $(enum,values=a,b,c)
    class EnumFieldHandler(FieldHandler):
        values = None  # J2J added

        id = None

        def configure(self, args):
            self.values = {}
            svalues = URITemplate.getArg(args, 'values', None)
            if svalues is None:
                return 'need values'
            ss = svalues.split(',')
            if len(ss) == 1:
                ss2 = svalues.split('|')
                if len(ss2) > 1:
                    # J2J (logger) logger.fine("supporting legacy value containing pipes for values")
                    ss = ss2
            self.values.update( dict( zip( ss,ss) ))
            self.id = URITemplate.getArg(args, 'id', 'unindentifiedEnum')
            return None

        def getRegex(self):
            it = self.values.iterator()
            b = '['.append(it.next())
            while it.hasNext():
                b+= '|' + str(re.escape(it.next()))
            b+= ']'
            return b

        def parse(self, fieldContent, startTime, timeWidth, extra):
            if not fieldContent in self.values:
                raise Exception('value is not in enum: ' + fieldContent)
            extra[self.id] = fieldContent

        def format(self, startTime, timeWidth, length, extra):
            v = URITemplate.getArg(extra, self.id, None)
            if v is None:
                raise Exception('\"' + self.id + '\" is undefined in extras.')
            if v in self.values:
                return v
            else:
                raise Exception(self.id + ' value is not within enum: ' + self.values)

        # return the possible values.
        # @return the possible values.
        def getValues(self):
            return self.values.toArray([None] * len(self.values))

        def getId(self):
            return self.id


    # $(x,name=sc,regex=[a|b])
    class IgnoreFieldHandler(FieldHandler):
        regex = None

        pattern = None  # J2J added

        name = None

        pad = None

        def configure(self, args):
            self.regex = URITemplate.getArg(args, 'regex', None)
            if self.regex != None:
                self.pattern = re.compile(self.regex)
            self.name = URITemplate.getArg(args, 'name', 'unnamed')
            self.pad = URITemplate.getArg(args, 'pad', 'none')
            return None

        def getRegex(self):
            return self.regex

        def parse(self, fieldContent, startTime, timeWidth, extra):
            if self.regex != None:
                if not self.pattern.match(fieldContent) != None:
                    raise Exception('ignore content doesn\'t match regex: ' + fieldContent)
            if not self.pad == 'none':
                if self.pad == '_' or self.pad == 'underscore':
                    i0 = 0
                    while i0 < len(fieldContent) and fieldContent[i0] == '_':
                        i0 = i0 + 1
                    i1 = len(fieldContent) - 1
                    while i1 > i0 and fieldContent[i1] == '_':
                        i1 = i1 - 1
                    fieldContent = fieldContent[i0:i1 + 1]
            if not self.name == 'unnamed':
                # Java version tests for equality if it exists already. TODO: study this
                extra[self.name] = fieldContent

        def format(self, startTime, timeWidth, length, extra):
            return URITemplate.getArg(extra, self.name, '')


    class VersioningType:
        def compare( self, o1, o2 ):
            raise Exception('Implement me')
    VersioningType.none = VersioningType()
    VersioningType.numeric = VersioningType()
    # 4.10 > 4.01
    def compare(self, s1, s2):
        d1 = float(s1)
        d2 = float(s2)
        return d1.compareTo(d2)
    VersioningType.numeric.compare=compare
    VersioningType.alphanumeric = VersioningType()
    # a001
    def compare(self, s1, s2):
        return (s1.compareTo(s2))
    VersioningType.alphanumeric.compare=compare
    VersioningType.numericSplit = VersioningType()
    # 4.3.23   // 1.1.3-01 for RBSP (rbspice lev-2 isrhelt)
    def compare(self, s1, s2):
        ss1 = s1.split('[.-]')
        ss2 = s2.split('[.-]')
        n = min(len(ss1),len(ss2))
        for i in range(0, n):
            d1 = int(ss1[i])
            d2 = int(ss2[i])
            if d1 < d2:
                return -1
            elif d1 > d2:
                return 1
        return len(ss1) - len(ss2)
    VersioningType.numericSplit.compare=compare

    # Version field handler.  Versions are codes with special sort orders.
    class VersionFieldHandler(FieldHandler):
        versioningType = None  # J2J added

        versionGe = None

        # the version must be greater than or equal to this if non-null. 
        versionLt = None

        # the version must be less than this if non-null. 
        def configure(self, args):
            sep = URITemplate.getArg(args, 'sep', None)
            if sep is None:
                sep = URITemplate.getArg(args, 'separator', None)
            if sep is None and 'dotnotation' in args:
                sep = 'T'
            alpha = URITemplate.getArg(args, 'alpha', None)
            if alpha is None and 'alphanumeric' in args:
                alpha = 'T'
            type = URITemplate.getArg(args, 'type', None)
            if type != None:
                if type == 'sep' or type == 'dotnotation':
                    sep = 'T'
                elif type == 'alpha' or type == 'alphanumeric':
                    alpha = 'T'
            if 'gt' in args:
                raise Exception('gt specified but not supported: must be ge or lt')
            if 'le' in args:
                raise Exception('le specified but not supported: must be ge or lt')
            ge = URITemplate.getArg(args, 'ge', None)
            if ge != None:
                self.versionGe = ge
            lt = URITemplate.getArg(args, 'lt', None)
            if lt != None:
                self.versionLt = lt
            if alpha != None:
                if sep != None:
                    return 'alpha with split not supported'
                else:
                    self.versioningType = URITemplate.VersioningType.alphanumeric
            else:
                if sep != None:
                    self.versioningType = URITemplate.VersioningType.numericSplit
                else:
                    self.versioningType = URITemplate.VersioningType.numeric
            return None

        def parse(self, fieldContent, startTime, timeWidth, extra):
            v = URITemplate.getArg(extra, 'v', None)
            if v != None:
                self.versioningType = URITemplate.VersioningType.numericSplit
                fieldContent = v + '.' + fieldContent
            extra['v'] = fieldContent

        def getRegex(self):
            return '.*'

        def format(self, startTime, timeWidth, length, extra):
            return URITemplate.getArg(extra, 'v', None)


    # convert %() and ${} to standard $(), and support legacy modes in one
    # compact place.  Asterisk (*) is replaced with $x.
    # Note, commas may still appear in qualifier lists, and 
    # makeQualifiersCanonical will be called to remove them.
    # Copied from Das2's TimeParser.
    # @param formatString like %{Y,m=02}*.dat or $(Y;m=02)$x.dat
    # @return formatString containing canonical spec, $() and $x instead of *, like $(Y,m=02)$x.dat
    @staticmethod
    def makeCanonical(formatString):
        wildcard = '*' in formatString
        oldSpec = '${' in formatString
        p = re.compile('\\$[0-9]+\\{')
        oldSpec2 = p.search(formatString)!=None
        if formatString.startswith('$') and not wildcard and not oldSpec and not oldSpec2:
            return formatString
        if '%' in formatString and not '$' in formatString:
            formatString = re.sub('\\%', '$', formatString)
        oldSpec = '${' in formatString
        if oldSpec and not '$(' in formatString:
            formatString = re.sub('\\$\\{', '$(', formatString)
            formatString = re.sub('\\}', ')', formatString)
        if oldSpec2 and not '$(' in formatString:
            formatString = re.sub('\\$([0-9]+)\\{', '$$1(', formatString)
            formatString = re.sub('\\}', ')', formatString)
        if wildcard:
            formatString = re.sub('\\*', '$x', formatString)
        i = 1
        if i < len(formatString) and formatString[i] == '(':
            i += 1
        while i < len(formatString) and formatString[i].isalpha():
            i += 1
        if i < len(formatString) and formatString[i] == ',':
            formatString = re.sub(',', ';', formatString,1)
        return formatString

    # $(subsec,places=4) --> $(subsec;places=4)
    # $(enum,values=01,02,03,id=foo) --> $(enum;values=01,02,03;id=foo)
    # $a --> $a
    # (subsec,places=4) --> (subsec;places=4)
    # @param qualifiers
    # @return 
    @staticmethod
    def makeQualifiersCanonical(qualifiers):
        noDelimiters = True
        i = 0
        while noDelimiters and i < len(qualifiers):  # J2J for loop
            if qualifiers[i] == ',' or qualifiers[i] == ';':
                noDelimiters = False
            i = i + 1
        if noDelimiters:
            return qualifiers
        result = [None] * len(qualifiers)
        # If it is, then assume the qualifiers are properly formatted.
        result[0] = qualifiers[0]
        # '$'
        result[1] = qualifiers[1]
        istart = 2
        while istart < len(qualifiers):  # J2J for loop
            ch = qualifiers[istart]
            if ch == ';':
                return qualifiers
            if ch == ',':
                result[istart] = ';'
                break
            if ch.isalpha() or ch == ')':
                result[istart] = ch
            istart = istart + 1
        expectSemi = False
        for i in range(len(qualifiers) - 1, istart, -1):
            result[i] = qualifiers[i]
            ch = qualifiers[i]
            if ch == '=':
                expectSemi = True
            elif ch == ',' and expectSemi:
                result[i] = ';'
            elif ch == ';':
                expectSemi = False
        rr = ''.join( result)
        if not result == qualifiers:
            # J2J (logger) logger.log(Level.FINE, "qualifiers are made canonical: {0}->{1}", new Object[] { qualifiers, rr })
            pass
        return rr

    # create the array if it hasn't been created already.
    # @param digits
    # @return 
    @staticmethod
    def maybeInitialize(digits):
        if digits is None:
            return [0] * TimeUtil.TIME_DIGITS
        else:
            return digits

    # return the digit used to store the number associated with
    # the code.  For example, Y is the year, so it is stored in the 0th
    # position, H is hour and is stored in the 3rd position.
    # @param code one of YmjdHMS.
    # @return the digit 0-6, or -1 for none.
    @staticmethod
    def digitForCode(code):
        if code == 'Y':
            return 0
        elif code == 'm':
            return 1
        elif code == 'j':
            return 2
        elif code == 'd':
            return 2
        elif code == 'H':
            return 3
        elif code == 'M':
            return 4
        elif code == 'S':
            return 5
        else:
            return -1

    # use own floorDiv since JavaScript doesn't have floorDiv function.
    # Note that in Python, floorDiv is just "//".  Java also truncates when doing
    # integer division.
    # +---------------+--------+
    # | expression    | result |
    # +---------------+--------+
    # | floorDiv(0,7) |  0     |
    # | floorDiv(1,7) |  0     |
    # | floorDiv(7,7) |  1     |
    # | floorDiv(-1,7)| -1     |
    # | floorDiv(-7,7)| -1     |
    # | floorDiv(-8,7)| -2     |
    # +---------------+--------+
    # 
    # @param ndays
    # @param timeWidth
    # @return the integer number of widths which result in a number below ndays.
    @staticmethod
    def floorDiv(ndays, timeWidth):
        ncycles = ndays // timeWidth
        return ncycles

    # set the explicit width
    # @param spec specification like "4" or "4H" for four hours.
    def handleWidth(self, fc, spec):
        n = len(spec) - 1
        if spec[n].isdigit():
            span = int(spec)
            digit = URITemplate.digitForCode(fc[0])
            self.timeWidth[digit] = span
        else:
            span = int(spec[0:n])
            digit = URITemplate.digitForCode(spec[n])
            self.timeWidth[digit] = span
        self.timeWidthIsExplicit = True

    def __init__(self,formatString):
        # J2J (logger) logger.log(Level.FINE, "new TimeParser({0},...)", formatString)
        startTime = [0] * URITemplate.NUM_TIME_DIGITS
        startTime[0] = URITemplate.MIN_VALID_YEAR
        startTime[1] = 1
        startTime[2] = 1
        self.stopTimeDigit = URITemplate.AFTERSTOP_INIT
        stopTime = [0] * URITemplate.NUM_TIME_DIGITS
        stopTime[0] = URITemplate.MAX_VALID_YEAR
        stopTime[1] = 1
        stopTime[2] = 1
        #result.fieldHandlers = fieldHandlers;
        self.fieldHandlersById = {}
        formatString = URITemplate.makeCanonical(formatString)
        self.spec = formatString
        #this.formatString = formatString;
        ss = formatString.split('$')
        self.fc = [None] * len(ss)
        self.qualifiers = [None] * len(ss)
        self.handlerObjects = [None] * len(ss)
        delim = [None] * (len(ss) + 1)
        self.ndigits = len(ss)
        regex1 = ""
        regex1+= str(re.sub('\\+', '+', ss[0]))
        #TODO: I thought we did this already.
        self.lengths = [0] * self.ndigits
        for i in range(0, len(self.lengths)):
            self.lengths[i] = -1
        # -1 indicates not known, but we'll figure out as many as we can.
        self.startShift = None
        self.stopShift = None
        self.qualifiersMaps = [None] * self.ndigits
        self.phasestart = None
        delim[0] = ss[0]
        for i in range(1, self.ndigits):
            pp = 0
            ssi = ss[i]
            while len(ssi) > pp and (ssi[pp].isdigit() or ssi[pp] == '-'):
                pp += 1
            if pp > 0:
                # Note length ($5Y) is not supported in https://github.com/hapi-server/uri-templates/wiki/Specification, but is in this library.
                self.lengths[i] = int(ssi[0:pp])
            else:
                self.lengths[i] = 0
            ssi = URITemplate.makeQualifiersCanonical(ssi)
            # J2J (logger) logger.log(Level.FINE, "ssi={0}", ss[i])
            if ssi[pp] != '(':
                self.fc[i] = ssi[pp:pp + 1]
                delim[i] = ssi[pp + 1:]
            elif ssi[pp] == '(':
                endIndex = ssi.find(')',pp)
                if endIndex == -1:
                    raise Exception('opening paren but no closing paren in \"' + ssi + '\"')
                semi = ssi.find(';',pp)
                if semi != -1:
                    self.fc[i] = ssi[pp + 1:semi]
                    self.qualifiers[i] = ssi[semi + 1:endIndex]
                else:
                    self.fc[i] = ssi[pp + 1:endIndex]
                delim[i] = ssi[endIndex + 1:]
            if self.fc[i] == "x":
                self.handlerObjects[i] = URITemplate.IgnoreFieldHandler()
            elif self.fc[i] == "subsec":
                self.handlerObjects[i] = URITemplate.SubsecFieldHandler()
            elif self.fc[i] == "hrinterval":
                self.handlerObjects[i] = URITemplate.HrintervalFieldHandler()
            elif self.fc[i] == "periodic":
                self.handlerObjects[i] = URITemplate.PeriodicFieldHandler()
            elif self.fc[i] == "enum":
                self.handlerObjects[i] = URITemplate.EnumFieldHandler()
            elif self.fc[i] == "v":
                self.handlerObjects[i] = URITemplate.VersionFieldHandler()
        self.handlers = [0] * self.ndigits
        self.offsets = [0] * self.ndigits
        pos = 0
        self.offsets[0] = pos
        self.lsd = -1
        lsdMult = 1
        #TODO: We want to add $Y_1XX/$j/WAV_$Y$jT$(H,span=5)$M$S_REC_V01.PKT
        self.context = [0] * URITemplate.NUM_TIME_DIGITS
        self.context[0:URITemplate.NUM_TIME_DIGITS]=startTime[0:URITemplate.NUM_TIME_DIGITS]
        self.externalContext = URITemplate.NUM_TIME_DIGITS
        # this will lower and will typically be 0.
        self.timeWidth = [0] * URITemplate.NUM_TIME_DIGITS
        haveHour = False
        for i in range(1, self.ndigits):
            if pos != -1:
                pos += len(delim[i - 1])
            handler = 9999
            for j in range(0, len(self.valid_formatCodes)):
                if self.valid_formatCodes[j] == self.fc[i]:
                    handler = j
                    break
            if self.fc[i] == 'H':
                haveHour = True
            elif self.fc[i] == 'p':
                if not haveHour:
                    raise Exception('$H must preceed $p')
            if handler == 9999:
                handler = 100
                self.handlers[i] = 100
                self.offsets[i] = pos
                if self.lengths[i] < 1 or pos == -1:
                    # 0->indetermined as well, allows user to force indeterminate
                    pos = -1
                    self.lengths[i] = -1
                else:
                    pos += self.lengths[i]
                fh = self.handlerObjects[i]
                args = self.qualifiers[i]
                argv = {}
                if args != None:
                    ss2 = args.split(';')
                    for ss21 in ss2:
                        i3 = ss21.find('=')
                        if i3 == -1:
                            argv[ss21.strip()] = ''
                        else:
                            argv[ss21[0:i3].strip()] = ss21[i3 + 1:].strip()
                errm = fh.configure(argv)
                if errm != None:
                    raise Exception(errm)
                id = URITemplate.getArg(argv, 'id', None)
                if id != None:
                    self.fieldHandlersById[id] = fh
            else:
                self.handlers[i] = handler
                if self.lengths[i] == 0:
                    self.lengths[i] = self.formatCode_lengths[handler]
                self.offsets[i] = pos
            span = 1
            div = 1
            if self.qualifiers[i] != None:
                ss2 = self.qualifiers[i].split(';')
                self.qualifiersMaps[i] = {}
                for ss21 in ss2:
                    #TODO: handle end before shift.
                    okay = False
                    qual = ss21.strip()
                    if qual == 'startTimeOnly':
                        self.startTimeOnly = self.fc[i][0]
                        okay = True
                    idx = qual.find('=')
                    if not okay and idx > -1:
                        name = qual[0:idx].strip()
                        val = qual[idx + 1:].strip()
                        self.qualifiersMaps[i][name] = val
                        if name == "Y":
                            self.context[URITemplate.YEAR] = int(val)
                            self.externalContext = min(self.externalContext,0)
                        elif name == "m":
                            self.context[URITemplate.MONTH] = int(val)
                            self.externalContext = min(self.externalContext,1)
                        elif name == "d":
                            self.context[URITemplate.DAY] = int(val)
                            self.externalContext = min(self.externalContext,2)
                        elif name == "j":
                            self.context[URITemplate.MONTH] = 1
                            self.context[URITemplate.DAY] = int(val)
                            self.externalContext = min(self.externalContext,1)
                        elif name == "H":
                            self.context[URITemplate.HOUR] = int(val)
                            self.externalContext = min(self.externalContext,3)
                        elif name == "M":
                            self.context[URITemplate.MINUTE] = int(val)
                            self.externalContext = min(self.externalContext,4)
                        elif name == "S":
                            self.context[URITemplate.SECOND] = int(val)
                            self.externalContext = min(self.externalContext,5)
                        elif name == "cadence":
                            span = int(val)
                            self.handleWidth(self.fc[i], val)
                            self.timeWidthIsExplicit = True
                        elif name == "span":
                            span = int(val)
                            # not part of uri_templates
                            self.handleWidth(self.fc[i], val)
                            self.timeWidthIsExplicit = True
                        elif name == "delta":
                            span = int(val)
                            # see http://tsds.org/uri_templates
                            self.handleWidth(self.fc[i], val)
                            self.timeWidthIsExplicit = True
                        elif name == "resolution":
                            span = int(val)
                            self.handleWidth(self.fc[i], val)
                            self.timeWidthIsExplicit = True
                        elif name == "period":
                            if val.startswith('P'):
                                try:
                                    r = TimeUtil.parseISO8601Duration(val)
                                    for j in range(0, URITemplate.NUM_TIME_DIGITS):
                                        if r[j] > 0:
                                            self.lsd = j
                                            lsdMult = r[j]
                                            # J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult })
                                            break
                                except Exception as ex:  # J2J: exceptions
                                    # J2J (logger) logger.log(Level.SEVERE, null, ex)
                                    pass
                            else:
                                code = val[len(val) - 1]
                                if code == 'Y':
                                    self.lsd = 0
                                elif code == 'm':
                                    self.lsd = 1
                                elif code == 'd':
                                    self.lsd = 2
                                elif code == 'j':
                                    self.lsd = 2
                                elif code == 'H':
                                    self.lsd = 3
                                elif code == 'M':
                                    self.lsd = 4
                                elif code == 'S':
                                    self.lsd = 5
                                elif code == 'N':
                                    self.lsd = 6
                                else:
                                    pass
                                lsdMult = int(val[0:len(val) - 1])
                                # J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult })

                        elif name == "id":
                            pass
                        elif name == "places":
                            pass
                        elif name == "phasestart":
                            try:
                                self.phasestart = TimeUtil.isoTimeToArray(val)
                            except Exception as ex:  # J2J: exceptions
                                # J2J (logger) logger.log(Level.SEVERE, null, ex)
                                pass

                        elif name == "start":
                            if handler == 1:
                                self.twoDigitYearStart = int(val)

                        elif name == "shift":
                            if len(val) == 0:
                                raise Exception('shift is empty')

                            possibleUnit = val[len(val) - 1]

                            if possibleUnit.isalpha():
                                digit = URITemplate.digitForCode(possibleUnit)
                                val = val[0:len(val) - 1]
                            else:
                                digit = URITemplate.digitForCode(self.fc[i][0])

                            if i < self.stopTimeDigit:
                                self.startShift = URITemplate.maybeInitialize(self.startShift)
                                self.startShift[digit] = int(val)
                            else:
                                self.stopShift = URITemplate.maybeInitialize(self.stopShift)
                                self.stopShift[digit] = int(val)

                        elif name == 'pad' or name == 'fmt' or name == 'case' or name == "div":
                            if name == 'pad' and val == 'none':
                                self.lengths[i] = -1
                                pos = -1

                            if name == 'div' and self.lengths[i] != -1:
                                div = int(float(val))
                                dig = int(math.log10(div))
                                self.lengths[i] = max(1,self.lengths[i] - dig)
                                self.disallowCarryForStopTime = True

                            if self.qualifiersMaps[i] is None:
                                self.qualifiersMaps[i] = {}

                            self.qualifiersMaps[i][name] = val
                        elif name == "end":
                            if self.stopTimeDigit == URITemplate.AFTERSTOP_INIT:
                                self.startLsd = self.lsd
                                self.stopTimeDigit = i

                        elif name == "len":
                            self.lengths[i] = int(val)
                        else:
                            pass
                        okay = True
                    elif not okay:
                        name = qual.strip()
                        if name == 'end':
                            if self.stopTimeDigit == URITemplate.AFTERSTOP_INIT:
                                self.startLsd = self.lsd
                                self.stopTimeDigit = i
                            okay = True
                    if not okay and (qual == 'Y' or qual == 'm' or qual == 'd' or qual == 'j' or qual == 'H' or qual == 'M' or qual == 'S'):
                        raise Exception('%s must be assigned an integer value (e.g. %s=1) in %s' % (qual, qual, ss[i]))
                    if not okay:
                        # J2J (logger) logger.log(Level.WARNING, "unrecognized/unsupported field:{0} in {1}", new Object[] { qual, ss[i] })
                        pass
                if handler == 13:
                    # Month name might be full, so length is not known.
                    fmt = URITemplate.getArg(self.qualifiersMaps[i], 'fmt', None)
                    if 'full' == fmt:
                        self.lengths[i] = -1
            else:
                if len(self.fc[i]) == 1:
                    code = self.fc[i][0]
                    thisLsd = -1
                    if code == 'Y':
                        thisLsd = 0
                    elif code == 'm':
                        thisLsd = 1
                    elif code == 'd':
                        thisLsd = 2
                    elif code == 'j':
                        thisLsd = 2
                    elif code == 'H':
                        thisLsd = 3
                    elif code == 'M':
                        thisLsd = 4
                    elif code == 'S':
                        thisLsd = 5
                    elif code == 'N':
                        thisLsd = 6
                    else:
                        pass
                    if thisLsd == self.lsd:
                        # allow subsequent repeat fields to reset (T$y$(m,delta=4)/$x_T$y$m$d.DAT)
                        lsdMult = 1
            if self.lengths[i] < 1 or pos == -1:
                pos = -1
            else:
                pos += self.lengths[i]
            if len(self.fc[i]) == 1:
                if self.fc[i][0] == 'Y':
                    self.externalContext = min(self.externalContext,0)
                elif self.fc[i][0] == 'm':
                    self.externalContext = min(self.externalContext,1)
                elif self.fc[i][0] == 'd':
                    self.externalContext = min(self.externalContext,2)
                elif self.fc[i][0] == 'j':
                    self.externalContext = min(self.externalContext,1)
                elif self.fc[i][0] == 'H':
                    self.externalContext = min(self.externalContext,3)
                elif self.fc[i][0] == 'M':
                    self.externalContext = min(self.externalContext,4)
                elif self.fc[i][0] == 'S':
                    self.externalContext = min(self.externalContext,5)
                else:
                    pass
            if handler < 100:
                if self.precision[handler] > self.lsd and lsdMult == 1:
                    # omni2_h0_mrg1hr_$Y$(m,span=6)$d_v01.cdf.  Essentially we ignore the $d.
                    self.lsd = self.precision[handler]
                    lsdMult = max(span,div)
                    # J2J (logger) logger.log(Level.FINER, "lsd is now {0}, width={1}", new Object[] { lsd, lsdMult })
            dots = '.........'
            if self.lengths[i] == -1:
                regex1+= '(.*)'
            else:
                regex1+= '(' + dots[0:self.lengths[i]] + ')'
            regex1+= str(re.sub('\\+', '+', delim[i]))
        if self.lsd == 0 or self.lsd == 1 or self.lsd == 2 or self.lsd == 3 or self.lsd == 4 or self.lsd == 5 or self.lsd == 6:
            if not self.timeWidthIsExplicit:
                self.timeWidth[self.lsd] = lsdMult

        elif self.lsd == -1:
            self.timeWidth[0] = 8000
        elif self.lsd == 100:
            pass
        # J2J: if logger.isLoggable(Level.FINE) ... removed
        if self.stopTimeDigit == URITemplate.AFTERSTOP_INIT:
            if self.startShift != None:
                self.stopShift = self.startShift
        self.delims = delim
        self.regex = regex1

    # return the timeString, parsed into start time and stop time.  
    # The result is a 14-element array, with the first 7 the start time
    # and the last 7 the stop time.
    # @param timeString the template string to be parsed.
    # @return 14 element array [ Y, m, d, H, M, S, nano, Y, m, d, H, M, S, nano ]
    # @throws ParseException when a number is expected, or patterned not matched.
    # @see #parse(java.lang.String, java.util.Map) 
    def parse(self, timeString):
        return self.parse(timeString, {})

    # return the timeString, parsed into start time and stop time.  
    # The result is a 14-element array, with the first 7 the start time
    # and the last 7 the stop time.  The output will be decomposed into
    # year, month, and day even if year, day-of-year are in the time string.
    # @param timeString string in the format described by the template.
    # @param extra extension results, like $(x,name=sc) appear here.
    # @return 14 element array [ Y, m, d, H, M, S, nano, Y, m, d, H, M, S, nano ]
    # @throws ParseException when a number is expected, or patterned not matched.
    # @see TimeUtil#dayOfYear(int, int, int) if day-of-year is needed.
    # @see #parse(java.lang.String) which can be used when extra arguments are not needed.
    def parse(self, timeString, extra):
        # J2J (logger) logger.log(Level.FINER, "parse {0}", timeString)
        offs = 0
        length = 0
        startTime = [0] * URITemplate.NUM_TIME_DIGITS
        stopTime = [0] * URITemplate.NUM_TIME_DIGITS
        time = startTime
        time[0:URITemplate.NUM_TIME_DIGITS]=self.context[0:URITemplate.NUM_TIME_DIGITS]
        lastOffset = 0
        lastLength = 0
        for idigit in range(1, self.ndigits):
            if idigit == self.stopTimeDigit:
                # J2J (logger) logger.finer("switching to parsing end time")
                stopTime[0:URITemplate.NUM_TIME_DIGITS]=time[0:URITemplate.NUM_TIME_DIGITS]
                time = stopTime
            if self.offsets[idigit] != -1:
                # note offsets[0] is always known
                offs = self.offsets[idigit]
            else:
                offs += length + len(self.delims[idigit - 1])
            if self.lengths[idigit] != -1:
                length = self.lengths[idigit]
            else:
                if self.delims[idigit] == '':
                    if idigit == self.ndigits - 1:
                        length = len(timeString) - offs
                    else:
                        raise Exception('No delimiter specified after unknown length field, \"' + self.formatName[self.handlers[idigit]] + '\", field number=' + str((1 + idigit)) + '')
                else:
                    while offs < len(timeString) and timeString[offs].isspace():
                        offs += 1
                    if offs >= len(timeString):
                        raise Exception('expected delimiter \"' + self.delims[idigit] + '\" but reached end of string')
                    i = timeString.find(self.delims[idigit],offs)
                    if i == -1:
                        raise Exception('expected delimiter \"' + self.delims[idigit] + '\"')
                    length = i - offs
                    if length < 0:
                        raise Exception('bad state, length should never be less than zero.')
            foundDelim = timeString[lastOffset + lastLength:offs]
            if not foundDelim == self.delims[idigit - 1]:
                raise Exception('Expected \"' + self.delims[idigit - 1] + '\" before $' + self.fc[idigit] + ', got: ' + foundDelim)
            lastOffset = offs
            lastLength = length
            if len(timeString) < offs + length:
                raise Exception('string is too short: ' + timeString)
            field = timeString[offs:offs + length].strip()
            # J2J (logger) logger.log(Level.FINE, "handling \"{0}\" with {1}", new Object[] { field, handlers[idigit] })
            try:
                qual = self.qualifiersMaps[idigit]
                if self.handlers[idigit] < 10:
                    digit = int(field)
                    if qual != None:
                        s = URITemplate.getArg(qual, 'div', None)
                        if s != None:
                            div = int(float(s))
                            # TODO: we really have to parse this each time?
                            digit = digit * div
                    if self.handlers[idigit] == 0:
                        time[URITemplate.YEAR] = digit
                    elif self.handlers[idigit] == 1:
                        mod = self.twoDigitYearStart % 100
                        cent = self.twoDigitYearStart // 100
                        if digit >= mod:
                            time[URITemplate.YEAR] = cent * 100 + digit
                        else:
                            time[URITemplate.YEAR] = (cent + 1) * 100 + digit

                    elif self.handlers[idigit] == 2:
                        time[URITemplate.MONTH] = 1
                        time[URITemplate.DAY] = digit
                    elif self.handlers[idigit] == 3:
                        time[URITemplate.MONTH] = digit
                    elif self.handlers[idigit] == 4:
                        time[URITemplate.DAY] = digit
                    elif self.handlers[idigit] == 5:
                        time[URITemplate.HOUR] = digit
                    elif self.handlers[idigit] == 6:
                        time[URITemplate.MINUTE] = digit
                    elif self.handlers[idigit] == 7:
                        time[URITemplate.SECOND] = digit
                    elif self.handlers[idigit] == 8:
                        time[URITemplate.NANOSECOND] = digit
                    else:
                        raise Exception('handlers[idigit] was not expected value (which shouldn\'t happen)')
                elif self.handlers[idigit] == 100:
                    handler = self.handlerObjects[idigit]
                    #FieldHandler handler = (FieldHandler) fieldHandlers.get(fc[idigit]);
                    handler.parse(timeString[offs:offs + length], time, self.timeWidth, extra)
                elif self.handlers[idigit] == 10:
                    # AM/PM -- code assumes hour has been read already
                    ch = timeString[offs]
                    if ch == 'P' or ch == 'p':
                        if time[URITemplate.HOUR] == 12:
                            pass
                        else:
                            time[URITemplate.HOUR] += 12
                    elif ch == 'A' or ch == 'a':
                        if time[URITemplate.HOUR] == 12:
                            time[URITemplate.HOUR] -= 12
                        else:
                            pass
                elif self.handlers[idigit] == 11:
                    # TimeZone is not supported, see code elsewhere.
                    offset = int(timeString[offs:offs + length])
                    time[URITemplate.HOUR] -= offset // 100
                    # careful!
                    time[URITemplate.MINUTE] -= offset % 100
                elif self.handlers[idigit] == 12:
                    if length >= 0:
                        extra['ignore'] = timeString[offs:offs + length]
                elif self.handlers[idigit] == 13:
                    # month name
                    time[URITemplate.MONTH] = TimeUtil.monthNumber(timeString[offs:offs + length])
                elif self.handlers[idigit] == 14:
                    if length >= 0:
                        extra['X'] = timeString[offs:offs + length]
                elif self.handlers[idigit] == 15:
                    # "x"
                    if qual != None:
                        name = URITemplate.getArg(qual, 'name', 'x')
                    else:
                        name = 'x'
                    if length >= 0:
                        extra[name] = timeString[offs:offs + length]
            except Exception as ex:  # J2J: exceptions
                raise Exception('fail to parse digit number %d: %s' % (idigit, field))
        foundDelim = timeString[lastOffset + lastLength:]
        if not foundDelim == self.delims[self.ndigits - 1]:
            raise Exception('Expected \"' + self.delims[self.ndigits - 1] + '\" after $' + self.fc[self.ndigits - 1] + ', got: ' + foundDelim)
        if self.phasestart != None:
            if self.timeWidth is None:
                # J2J (logger) logger.warning("phasestart cannot be used for month or year resolution")
                pass
            else:
                if self.timeWidth[1] > 0:
                    startTime[1] = ((startTime[1] - self.phasestart[1]) // self.timeWidth[1]) * self.timeWidth[1] + self.phasestart[1]
                elif self.timeWidth[0] > 0:
                    startTime[0] = ((startTime[0] - self.phasestart[0]) // self.timeWidth[0]) * self.timeWidth[0] + self.phasestart[0]
                elif self.timeWidth[2] > 1:
                    phaseStartJulian = TimeUtil.julianDay(self.phasestart[0], self.phasestart[1], self.phasestart[2])
                    ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian
                    ncycles = URITemplate.floorDiv(ndays, self.timeWidth[2])
                    startTime = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * self.timeWidth[2])
                else:
                    # J2J (logger) logger.log(Level.WARNING, "phasestart can only be used when step size is integer number of days greater than 1: {0}", TimeUtil.formatIso8601Duration(timeWidth))
                    pass
                stopTime = TimeUtil.add(startTime, self.timeWidth)
        else:
            if self.stopTimeDigit == URITemplate.AFTERSTOP_INIT:
                if self.disallowCarryForStopTime:
                    stopTime = TimeUtil.add(startTime, self.timeWidth)
                    if self.timeWidth[0] == 0 and self.timeWidth[1] == 0 and self.timeWidth[2] > 1:
                        stopTime[1] = 1
                        stopTime[2] = 1
                else:
                    stopTime = TimeUtil.add(startTime, self.timeWidth)
        result = [0] * (URITemplate.NUM_TIME_DIGITS * 2)
        noShift = self.startShift is None
        if noShift:
            result[0:URITemplate.NUM_TIME_DIGITS]=startTime[0:URITemplate.NUM_TIME_DIGITS]
            TimeUtil.normalizeTime(result)
        else:
            for i in range(0, URITemplate.NUM_TIME_DIGITS):
                result[i] = startTime[i] + self.startShift[i]
            TimeUtil.normalizeTime(result)
        noShift = self.stopShift is None
        if noShift:
            TimeUtil.normalizeTime(stopTime)
            result[URITemplate.NUM_TIME_DIGITS:2*URITemplate.NUM_TIME_DIGITS]=stopTime[0:URITemplate.NUM_TIME_DIGITS]
        else:
            resultStop = [0] * URITemplate.NUM_TIME_DIGITS
            for i in range(0, URITemplate.NUM_TIME_DIGITS):
                resultStop[i] = stopTime[i] + self.stopShift[i]
            TimeUtil.normalizeTime(resultStop)
            result[URITemplate.NUM_TIME_DIGITS:2*URITemplate.NUM_TIME_DIGITS]=resultStop[0:URITemplate.NUM_TIME_DIGITS]
        return result

    # return the number of digits, starting with the year, which must be
    # provided by some external context.  For example, data_$j.dat has an
    # external context of 1 because there is no year field, and data_$d.dat
    # would be 2 because the year and month are provided externally.  Note
    # the modifier Y= can be used to provide the context within the 
    # URI template.
    # @return the external context implied by the template.
    def getExternalContext(self):
        return self.externalContext

    # set the context time.  The number of digits copied from 
    # externalContextTime is determined by the state of externalContext.
    # @param externalContextTime the context in [ Y, m, d, H, M, S, nanos ]
    def setContext(self, externalContextTime):
        self.context[0:self.externalContext]=externalContextTime[0:self.externalContext]


    # For convenience, add API to match that suggested by 
    # https://github.com/hapi-server/uri-templates/blob/master/formatting.json,
    # and allowing for extra named fields to be passed in.
    # Note if start and end appear in the template, then just one formatted
    # range is returned.  This works by formatting and parsing the time ranges,
    # stepping through the sequence.
    # @param template the template
    # @param startTimeStr the beginning of the interval to cover
    # @param stopTimeStr the end of the interval to cover
    # @param extra extra named parameters
    # @return the formatted times which cover the span.
    # @throws ParseException when the initial parsing cannot be done.
    @staticmethod
    def formatRange(template, startTimeStr, stopTimeStr, extra={} ):
        ut = URITemplate(template)
        result = []
        sptr = TimeUtil.isoTimeFromArray(TimeUtil.isoTimeToArray(startTimeStr))
        stopDigits = TimeUtil.isoTimeToArray(stopTimeStr)
        stop = TimeUtil.isoTimeFromArray(stopDigits)
        if sptr > stop:
            raise Exception('start time must be before or equal to stop time.')
        i = 0
        externalContext = ut.getExternalContext()
        if externalContext > 0:
            context = [0] * TimeUtil.TIME_DIGITS
            context[0:externalContext]=stopDigits[0:externalContext]
            ut.setContext(context)
        firstLoop = True
        while sptr < stop:
            sptr0 = sptr
            s1 = ut.format(sptr, sptr, extra)
            tta = ut.parse(s1, {})
            if firstLoop:
                sptr = TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(tta))
                s1 = ut.format(sptr, sptr, extra)
                firstLoop = False
            # CAREFUL with next line with conversion, it did something strange
            if ( TimeUtil.getStartTime(tta)==TimeUtil.getStopTime(tta) ):
                result.append(ut.format(startTimeStr, stopTimeStr))
                break
            else:
                result.append(s1)
            sptr = TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(tta))
            if sptr0 == sptr:
                raise Exception('template fails to advance')
            i = i + 1
        return result


    # return a the formatted name, using the spec and the given time range.
    # @param startTimeStr iso8601 formatted time.
    # @param stopTimeStr iso8601 formatted time.
    # @param extra extra parameters
    # @return formatted time, often a resolvable URI.
    def format(self, startTimeStr, stopTimeStr, extra={} ):
        startTime = TimeUtil.isoTimeToArray(startTimeStr)
        if self.timeWidthIsExplicit:
            stopTime = TimeUtil.add(startTime, self.timeWidth)
        else:
            stopTime = TimeUtil.isoTimeToArray(stopTimeStr)
        return self.formatStartStopRange(startTime, stopTime, extra)

    # return the formatted name, using the spec and the given time range.
    # @param timeRange fourteen-component time range
    # @param extra extra parameters
    # @return formatted time, often a resolvable URI.
    def formatTimeRange(self, timeRange, extra={}):
        start = TimeUtil.getStartTime(timeRange)
        stop = TimeUtil.getStopTime(timeRange)
        return self.formatStartStopRange(start, stop, extra)

    # return the formatted name, using the spec and the given time range.
    # @param startTime seven-component start time
    # @param stopTime seven-component stop time
    # @param extra extra parameters
    # @return formatted time, often a resolvable URI.
    def formatStartStopRange(self, startTime, stopTime, extra={}):
        if self.timeWidthIsExplicit:
            timeWidthl = self.timeWidth
        else:
            timeWidthl = TimeUtil.subtract(stopTime, startTime)
        if self.startShift != None:
            startTime = TimeUtil.subtract(startTime, self.startShift)
        if self.stopShift != None:
            stopTime = TimeUtil.subtract(stopTime, self.stopShift)
        if self.timeWidthIsExplicit:
            if self.phasestart != None and self.timeWidth[2] > 0:
                phaseStartJulian = TimeUtil.julianDay(self.phasestart[0], self.phasestart[1], self.phasestart[2])
                ndays = TimeUtil.julianDay(startTime[0], startTime[1], startTime[2]) - phaseStartJulian
                ncycles = URITemplate.floorDiv(ndays, self.timeWidth[2])
                tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * self.timeWidth[2])
                startTime[0] = tnew[0]
                startTime[1] = tnew[1]
                startTime[2] = tnew[2]
                stopTime = TimeUtil.add(startTime, self.timeWidth)
        timel = startTime
        result = ""
        offs = 0
        nf = [None] * 5
        nf[1] = '%1d'
        nf[2] = '%02d'
        nf[3] = '%03d'
        nf[4] = '%04d'
        for idigit in range(1, self.ndigits):
            if idigit == self.stopTimeDigit:
                timel = stopTime
            result = ''.join( ( result[0:offs], self.delims[idigit - 1], result[offs:] ) )  # J2J expr -> assignment
            if self.offsets[idigit] != -1:
                # note offsets[0] is always known
                offs = self.offsets[idigit]
            else:
                offs += len(self.delims[idigit - 1])
            if self.lengths[idigit] != -1:
                length = self.lengths[idigit]
            else:
                length = -9999
            if self.handlers[idigit] < 10:
                qualm = self.qualifiersMaps[idigit]
                delta = 1
                if qualm != None:
                    ddelta = URITemplate.getArg(qualm, 'delta', None)
                    if ddelta != None:
                        delta = int(ddelta)
                    else:
                        ddelta = URITemplate.getArg(qualm, 'span', None)
                        if ddelta != None:
                            delta = int(ddelta)
                if self.handlers[idigit] == 0:
                    digit = timel[0]
                elif self.handlers[idigit] == 1:
                    if timel[0] < 2000:
                        digit = timel[0] - 1900
                    else:
                        digit = timel[0] - 2000

                elif self.handlers[idigit] == 2:
                    digit = TimeUtil.dayOfYear(timel[0], timel[1], timel[2])
                elif self.handlers[idigit] == 3:
                    digit = timel[1]
                elif self.handlers[idigit] == 4:
                    digit = timel[2]
                elif self.handlers[idigit] == 5:
                    digit = timel[3]
                elif self.handlers[idigit] == 6:
                    digit = timel[4]
                elif self.handlers[idigit] == 7:
                    digit = timel[5]
                elif self.handlers[idigit] == 8:
                    digit = timel[6]
                elif self.handlers[idigit] == 9:
                    digit = timel[6] // 1000
                else:
                    raise Exception('shouldn\'t get here')
                if delta > 1:
                    h = self.handlers[idigit]
                    if h == 2 or h == 3:
                        # $j, $m all start with 1.
                        digit = (((digit - 1) // delta) * delta) + 1
                    elif h == 4:
                        if self.phasestart != None:
                            phaseStartJulian = TimeUtil.julianDay(self.phasestart[0], self.phasestart[1], self.phasestart[2])
                            ndays = TimeUtil.julianDay(timel[0], timel[1], timel[2]) - phaseStartJulian
                            ncycles = URITemplate.floorDiv(ndays, self.timeWidth[2])
                            tnew = TimeUtil.fromJulianDay(phaseStartJulian + ncycles * delta)
                            timel[0] = tnew[0]
                            timel[1] = tnew[1]
                            timel[2] = tnew[2]
                        else:
                            raise Exception('phasestart not set for delta days')

                    else:
                        digit = (digit // delta) * delta
                if length < 0:
                    ss = str(digit)
                    result = ''.join( ( result[0:offs], ss, result[offs:] ) )  # J2J expr -> assignment
                    offs += len(ss)
                else:
                    if self.qualifiersMaps[idigit] != None:
                        # TODO: suboptimal
                        div = URITemplate.getArg(self.qualifiersMaps[idigit], 'div', None)
                        if div != None:
                            digit = digit // int(float(div))
                        pad = URITemplate.getArg(self.qualifiersMaps[idigit], 'pad', None)
                        if pad is None or pad == 'zero':
                            result = ''.join( ( result[0:offs], nf[length] % digit, result[offs:] ) )  # J2J expr -> assignment
                            offs += length
                        else:
                            if digit < 10:
                                if pad == "space":
                                    result = ''.join( ( result[0:offs], ' ', result[offs:] ) )  # J2J expr -> assignment
                                    result = ''.join( ( result[0:offs], str(digit), result[offs:] ) )  # J2J expr -> assignment
                                    offs += 2
                                elif pad == "underscore":
                                    result = ''.join( ( result[0:offs], '_', result[offs:] ) )  # J2J expr -> assignment
                                    result = ''.join( ( result[0:offs], str(digit), result[offs:] ) )  # J2J expr -> assignment
                                    offs += 2
                                elif pad == "none":
                                    result = ''.join( ( result[0:offs], str(digit), result[offs:] ) )  # J2J expr -> assignment
                                    offs += 1
                                else:
                                    result = ''.join( ( result[0:offs], nf[length] % digit, result[offs:] ) )  # J2J expr -> assignment
                                    offs += length
                            else:
                                result = ''.join( ( result[0:offs], nf[length] % digit, result[offs:] ) )  # J2J expr -> assignment
                                offs += length
                    else:
                        result = ''.join( ( result[0:offs], nf[length] % digit, result[offs:] ) )  # J2J expr -> assignment
                        offs += length
            elif self.handlers[idigit] == 13:
                # month names
                cas = URITemplate.getArg(self.qualifiersMaps[idigit], 'case', None)
                fmt = URITemplate.getArg(self.qualifiersMaps[idigit], 'fmt', None)
                if 'full' == fmt:
                    ins = TimeUtil.monthNameFull(timel[1])
                else:
                    ins = TimeUtil.monthNameAbbrev(timel[1])
                if cas is None or cas == 'lc':
                    ins = ins.lower()
                elif cas == 'cap':
                    pass
                elif cas == 'uc':
                    ins = ins.upper()
                result = ''.join( ( result[0:offs], ins, result[offs:] ) )  # J2J expr -> assignment
                offs += len(ins)
            elif self.handlers[idigit] == 12 or self.handlers[idigit] == 14:
                raise Exception('cannot format spec containing ignore')
            elif self.handlers[idigit] == 100:
                if self.fc[idigit] == 'v':
                    # kludge for version.  TODO: This can probably use the code below now.
                    ins = URITemplate.getArg(extra, 'v', '00')
                    if length > -1:
                        if length > 20:
                            raise Exception('version lengths>20 not supported')
                        ins = '00000000000000000000'[0:length]
                    result = ''.join( ( result[0:offs], ins, result[offs:] ) )  # J2J expr -> assignment
                    offs += len(ins)
                else:
                    fh1 = self.handlerObjects[idigit]
                    timeEnd = stopTime
                    ins = fh1.format(timel, TimeUtil.subtract(timeEnd, timel), length, extra)
                    startTimeTest = [0] * URITemplate.NUM_TIME_DIGITS
                    startTimeTest[0:URITemplate.NUM_TIME_DIGITS]=timel[0:URITemplate.NUM_TIME_DIGITS]
                    timeWidthTest = [0] * URITemplate.NUM_TIME_DIGITS
                    timeWidthTest[0:URITemplate.NUM_TIME_DIGITS]=timeWidthl[0:URITemplate.NUM_TIME_DIGITS]
                    try:
                        fh1.parse(ins, startTimeTest, timeWidthTest, extra)
                        timel[0:URITemplate.NUM_TIME_DIGITS]=startTimeTest[0:URITemplate.NUM_TIME_DIGITS]
                        timeWidthl[0:URITemplate.NUM_TIME_DIGITS]=timeWidthTest[0:URITemplate.NUM_TIME_DIGITS]
                        stopTime[0:URITemplate.NUM_TIME_DIGITS]=TimeUtil.add(timel, timeWidthl)[0:URITemplate.NUM_TIME_DIGITS]
                    except Exception as ex:  # J2J: exceptions
                        # J2J (logger) logger.log(Level.SEVERE, null, ex)
                        pass
                    if length > -1 and len(ins) != length:
                        p = URITemplate.getArg(self.qualifiersMaps[idigit], 'pad', None)
                        if p is None:
                            raise Exception('length of fh is incorrect, should be ' + str(length) + ', got \"' + ins + '\", and pad is not defined.')
                        if length < len(ins):
                            raise Exception('length of fh is incorrect, should be ' + str(length) + ', got \"' + ins + '\", which has too many characters.')
                        else:
                            l = length - len(ins)
                            if p == 'underscore' or p == '_' or p == "none":
                                padx = '____________________'[0:l]
                            elif p == "space":
                                padx = '                    '[0:l]
                            else:
                                raise Exception('unsupported pad.  Must be underscore, _, or space')
                            ins = padx + ins
                    result = ''.join( ( result[0:offs], ins, result[offs:] ) )  # J2J expr -> assignment
                    offs += len(ins)
            elif self.handlers[idigit] == 10:
                raise Exception('AM/PM not supported')
            elif self.handlers[idigit] == 11:
                raise Exception('Time Zones not supported')
        result = ''.join( ( result[0:offs], self.delims[self.ndigits - 1], result[offs:] ) )  # J2J expr -> assignment
        return result.strip()

    def toString(self):
        return 'URITemplate ' + self.spec

    @staticmethod
    def printUsage():
        sys.stderr.write('URITemplate ' + URITemplate.VERSION+'\n')
        sys.stderr.write('Usage: \n')
        sys.stderr.write('java -jar UriTemplatesJava.jar [--formatRange|--parse] [--range=<ISO8601 range>] --template=<URI template> [--name=<name>]\n')
        sys.stderr.write('java -jar UriTemplatesJava.jar --formatRange --range=1999-01-01/1999-01-03 --template=\'http://example.com/data_$(d;pad=none).dat\'\n')
        #example.com/data_$(d;pad=none).dat'");
        sys.stderr.write('java -jar UriTemplatesJava.jar --parse --template=\'data_$(d;pad=none;Y=1999; m=5).dat\' --name=data_1.dat\n')
        sys.stderr.write('   --formatRange time ranges will be formatted into names\n')
        sys.stderr.write('   --parse names will be parsed into time ranges\n')
        sys.stderr.write('   --range is an iso8601 range, or - for ranges from stdin\n')
        sys.stderr.write('   --name is has been formatted by the template, or - for names from stdin\n')

    # Usage: java -jar dist/UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
    # @param args the command line arguments.
    @staticmethod
    def main(args):
        if len(args) == 0 or args[1] == '--help':
            URITemplate.printUsage()
            sys.exit(-1)
        argsm = {}
        for a in args:
            aa = a.split('=')
            if len(aa) == 1:
                argsm[aa[0]] = ''
            else:
                argsm[aa[0]] = aa[1]
        if '--formatRange' in argsm:
            argsm.pop('--formatRange')
            template = argsm.pop('--template')
            if template is None:
                URITemplate.printUsage()
                sys.stderr.write('need --template parameter\n')
                sys.exit(-2)
            timeRange = argsm.pop('--range')
            if timeRange is None:
                URITemplate.printUsage()
                sys.stderr.write('need --range parameter\n')
                sys.exit(-3)
            if timeRange == '-':
                tr1 = None
                try:
                    tr1 = r.readLine()
                    while tr1 != None:
                        itimeRange = TimeUtil.parseISO8601TimeRange(tr1)
                        result = URITemplate.formatRange(template, 
                                                         TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(itimeRange)), 
                                                         TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(itimeRange)))
                        for s in result:
                            print(s)
                        tr1 = r.readLine()
                except Exception as ex:  # J2J: exceptions
                    URITemplate.printUsage()
                    sys.stderr.write('range is misformatted: ' + tr1+'\n')
                    sys.exit(-3)
                except Exception as ex:  # J2J: exceptions
                    sys.stderr.write('IOException\n')
                    sys.exit(-4)
            else:
                try:
                    itimeRange = TimeUtil.parseISO8601TimeRange(timeRange)
                    result = URITemplate.formatRange(template, 
                                                     TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(itimeRange)), 
                                                     TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(itimeRange)))
                    for s in result:
                        print(s)
                except Exception as ex:  # J2J: exceptions
                    URITemplate.printUsage()
                    sys.stderr.write('range is misformatted\n')
                    return -3
        elif '--parse' in argsm:
            argsm.pop('--parse')
            template = argsm.pop('--template')
            if template is None:
                URITemplate.printUsage()
                sys.stderr.write('need --template parameter\n')
                return -2
            name = argsm.pop('--name')
            if name is None:
                URITemplate.printUsage()
                sys.stderr.write('need --name parameter\n')
                return -3
            if name == '-':
                filen1 = None
                try:
                    filen1 = r.readLine()
                    while filen1 != None:
                        ut = URITemplate(template)
                        itimeRange = ut.parse(filen1, argsm)
                        sys.stdout.write(TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(itimeRange)))
                        sys.stdout.write('/')
                        print(TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(itimeRange)))
                        filen1 = r.readLine()
                except Exception as ex:  # J2J: exceptions
                    URITemplate.printUsage()
                    sys.stderr.write('parseException from ' + filen1+'\n')
                    return -3
            else:
                try:
                    ut = URITemplate(template)
                    itimeRange = ut.parse(name, argsm)
                    sys.stdout.write(TimeUtil.isoTimeFromArray(TimeUtil.getStartTime(itimeRange)))
                    sys.stdout.write('/')
                    print(TimeUtil.isoTimeFromArray(TimeUtil.getStopTime(itimeRange)))
                except Exception as ex:  # J2J: exceptions
                    URITemplate.printUsage()
                    sys.stderr.write('parseException from ?\n')
                    return -3


if __name__ == '__main__':
    exitcode = URITemplate.main(sys.argv)
    sys.exit(exitcode)
