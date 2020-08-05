This is the Java code for parsing and formatting using URI Templates.  This uses two codes URITemplate.java and TimeUtil.java. This can be checked out and used immediately with Netbeans, or just download the .jar file in the store folder. 

## Building with Ant

You can also download and build using Ant (like Make but for Java).  

~~~~~
git clone git@github.com:hapi-server/uri-templates.git
cd uri-templates/UriTemplatesJava
ant jar
~~~~~
The jar file will be created in dist/UriTemplatesJava.jar

This can be verified using (not implemented, but will be shortly):

~~~~~
java -jar dist/UriTemplatesJava.jar --formatRange --timeRange='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
~~~~~
