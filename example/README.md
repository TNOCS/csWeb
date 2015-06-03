csMap
=====

csMap, short for common sense Map, is a userfriendly web application for showing (GIS) data on a map. It allows you to apply multiple filters to filter your data, and to style it, so you can immediately see what's important. In addition, in the most basic form, you don't even need a web server, and a public folder on a website is sufficient to be up and running.

Features include:
* Basic map interactions (zooming, geo-locating, selecting different base layers)
* Displaying geojson files
* Specifying how properties must be displayed (formatting, title, tooltips, etc.)
* Filtering on one or more properties
* Coloring icons and regions based on one or more properties
* Displaying data in a table, and allowing the users to download it
* Searching for a feature

Technically, we use the following frameworks:
* Typescript for coding the application
* Angularjs as the MVC framework
* Bootstrap 3 (and fontawesome) for the CSS design style
* Leaflet for mapping
* d3, dc, crossfilter for filtering and styling

NOTE
====
csMap is the front-end of the mapping framework. Most components are actually defined in another open source project on GitHub, [csWeb](https://github.com/TNOCS/csWeb). Check-out this project to see how they relate. 
