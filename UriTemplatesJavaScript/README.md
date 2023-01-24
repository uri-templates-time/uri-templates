This version of the URI_Templates library provides support to JavaScript and NodeJS.  It was created
using a custom system for migrating code.

# Method
This is a translation of the Java version of the library.  Much like with the creation of the Python version of the library,
a translator is used to do the bulk of the work.  The converter used is here: https://cottagesystems.com/JavaJythonConverter/ConvertJavaToJavascriptServlet
and a bit of manual translation was done and then preserved by carefully merging in changes to GitHub.

This also relies on sprintf.js, a code at Github: https://github.com/alexei/sprintf.js and more precisely
https://github.com/alexei/sprintf.js/blob/master/src/sprintf.js.

So the procedure is as follows:
* Using https://cottagesystems.com/JavaJythonConverter/ConvertJavaToJavascriptServlet, convert TimeUtil.java to TimeUtil.js
* manually install new fromMillisecondsSince1970, toMillisecondsSince1970, and now functions.  (Git is useful for maintaining these changes.)
* Using the converter, convert the unit test  TimeUtilTest.java to make TimeUtilTest.js.
* load the web page which runs the unit tests and verify the results in the console.
* Similarly convert URI_Templates.java.
* Versioning is done in Java as inner classes and this needed to be converted by hand.
