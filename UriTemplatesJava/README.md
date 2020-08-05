This is the Java code for parsing and formatting using URI Templates.  This uses two codes URITemplate.java and TimeUtil.java. This can be checked out and used immediately with Netbeans, or just download the .jar file in the store folder. 

## Using Pre-Built Jar File
You can simply download the pre-built jar file, and use it within your codes or from the command line like so:
~~~~~
wget -N https://github.com/hapi-server/uri-templates/raw/master/UriTemplatesJava/store/UriTemplatesJava.jar
java -jar UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
java -jar UriTemplatesJava.jar --parse --template='http://example.com/data_$(d;pad=none;Y=1999; m=5).dat' --name='http://example.com/data_1.dat'
~~~~~

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
java -jar dist/UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
~~~~~
