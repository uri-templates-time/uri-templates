Python TimeUtil.py and URITemplate.py was created using a Java AST parser and formatting the 
Java AST into a Python code.  The goal is to make a conversion process which
can be done within a couple of hours.  

The website https://cottagesystems.com/JavaJythonConverter/ConvertJavaToPythonServlet was used
to do the conversion, and then a bit of human time and unit testing is needed
beyond that.

Note this may change as it is finalized.

To run unit tests:
```
python TimeUtilTest.py
python URITemplateTest.py
```

Note there are some strange conversions done (in formatRange, 
see "CAREFUL with next line with conversion") which need critical review.
