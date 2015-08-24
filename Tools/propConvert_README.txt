Tool to convert 'old' json files containing both the featuretypes and the feature, to the 


USAGE:
------

In the console, change directory to the folder containing propCovert.js.
Then type 'node propConvert.js par1 par2 par3' where the parameters are:
 
 - parameter 1: file to convert
 - parameter 2: name of resourceType that is created (e.g., hospital)
 - parameter 3: output file

Example: 

node propConvert.js dutch_hospitals.json Hospital dutch_hospitals_converted.json

If the file dutch_hospitals.json is located in the same folder as propConvert.js, this
command will create a resourceType file 'Hospital.json' and a features file named 
'dutch_hospitals_converted.json'. 