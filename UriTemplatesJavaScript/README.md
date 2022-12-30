This version of the URI_Templates library provides support to JavaScript and NodeJS.  It was created
using a custom system for migrating code.

*It seems like https://www.jsweet.org/jsweet-live-sandbox was used, but it is uncertain.  Whatever automated system was used, 
a good amount of additional work was needed, perhaps to remove the javaemul.internal.StringHelper use to get sprintf.

# Method
This is a translation of the Java version of the library.  Much like with the creation of the Python version of the library,
a translator is used to do the bulk of the work.  This was apparently jsweet back in early 2022, but the Java-to-Python
converter could also be modified and give an improved result.  (JSweet tries to make a 100% working code at a cost of readability,
and we want more of a 90% working code which is more readable and must be finished by a human.)

The Java-to-Python framework was extended to have Java-to-JavaScript, using a Java AST and then navigating the nodes converting
bits to equivalent Python.

This also relies on sprintf.js, a code at Github: https://github.com/alexei/sprintf.js and more precisely
https://github.com/alexei/sprintf.js/blob/master/src/sprintf.js.

So the procedure is as follows:
* Using https://cottagesystems.com/JavaJythonConverter/ConvertJavaToJavascriptServlet, convert TimeUtil.java to TimeUtil.js
* manually install new fromMillisecondsSince1970, toMillisecondsSince1970, and now functions.  (Git is useful for maintaining these changes.)
* Using the converter, convert the unit test  TimeUtilTest.java to make TimeUtilTest.js.
* load the web page which runs the unit tests and verify the results in the console.