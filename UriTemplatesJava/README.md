This is the Java code for parsing and formatting using URI Templates.  This uses two codes URITemplate.java and TimeUtil.java. This can be checked out and used immediately with Netbeans, or just download the .jar file in the store folder. 

## Using Pre-Built Jar File
You can simply download the pre-built jar file, and use it within your codes or from the command line like so:
~~~~~
wget -N https://cottagesystems.com/autoplot/git/uri-templates/UriTemplatesJava/dist/UriTemplatesJava.jar
java -jar UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
java -jar UriTemplatesJava.jar --parse --template='data_$(d;pad=none;Y=1999; m=5).dat' --name='data_1.dat'
~~~~~

## Building with Ant

You can also download and build using Ant (like Make but for Java).  

~~~~~
git clone git@github.com:hapi-server/uri-templates.git
cd uri-templates/UriTemplatesJava
ant jar
~~~~~
The jar file will be created in dist/UriTemplatesJava.jar

This can be verified using:

~~~~~
java -jar dist/UriTemplatesJava.jar --formatRange --range='1999-01-01/1999-01-03' --template='http://example.com/data_$(d;pad=none).dat'
~~~~~

## Building with javac

It's assumed that typically `ant` would be used to build the library, but in cases where it is not available, `javac` can be used.
~~~~~
git clone git@github.com:hapi-server/uri-templates.git
cd uri-templates/UriTemplatesJava
mkdir build  # compiled classes will go here
mkdir dist   # jar file will go here
javac -sourcepath src/ -d build `find src -name *.java`
printf "Manifest-Version: 1.0\nMain-Class: org.hapiserver.URITemplate\n" > build/manifest.mf
cd build
jar cvmf manifest.mf ../dist/UriTemplatesJava.jar `find . -name '*.class'`
~~~~~
This will create dist/UriTemplatesJava.jar.

## Example uses
Use to show time range covered by each csv where the start and stop times are in the file:
~~~~~
~/data/ecobee
spot7> ls -1 *.csv
report-263415613960-2018-10-28-to-2019-01-28.csv
report-263415613960-2019-06-29-to-2019-09-29.csv
report-263415613960-2019-08-10-to-2019-11-10.csv
report-263415613960-2019-11-11-to-2019-12-23.csv
report-263415613960-2019-12-12-to-2020-01-12.csv
report-263415613960-2020-01-11-to-2020-02-06.csv
report-263415613960-2020-02-26-to-2020-05-26.csv

~/data/ecobee
spot7> ls -1 *.csv | java -jar ~/tmp/UriTemplatesJava.jar --parse --template='report-$x-$Y-$m-$d-to-$(Y,end)-$m-$(d,shift=1).csv' --name=-
2018-10-28T00:00:00.000000000Z/2019-01-29T00:00:00.000000000Z
2019-06-29T00:00:00.000000000Z/2019-09-30T00:00:00.000000000Z
2019-08-10T00:00:00.000000000Z/2019-11-11T00:00:00.000000000Z
2019-11-11T00:00:00.000000000Z/2019-12-24T00:00:00.000000000Z
2019-12-12T00:00:00.000000000Z/2020-01-13T00:00:00.000000000Z
2020-01-11T00:00:00.000000000Z/2020-02-07T00:00:00.000000000Z
2020-02-26T00:00:00.000000000Z/2020-05-27T00:00:00.000000000Z

~~~~~

# Java Documentation and use within Autoplot scripts.
A copy of the javadoc can be found at https://jfaden.net/~jbf/javadoc/uri-templates/.

This can be loaded into Autoplot scripts using the following code:
~~~~~
lib= 'wget -N https://cottagesystems.com/autoplot/git/uri-templates/UriTemplatesJava/dist/UriTemplatesJava.jar'
doc= 'https://cottagesystems.com/~jbf/javadoc/uri-templates/'

import sys
addToSearchPath( sys.path,lib,doc,monitor )  # caution: this only loads once!!!!!
~~~~~
