[![Build Status](https://travis-ci.org/TNOCS/csWeb.svg?branch=master)](https://travis-ci.org/TNOCS/csWeb)
[![Stories in Ready](https://badge.waffle.io/tnocs/csweb.png?label=ready&title=Ready)](https://waffle.io/tnocs/csweb)
[![bitHound Score](https://www.bithound.io/github/TNOCS/csWeb/badges/score.svg)](https://www.bithound.io/github/TNOCS/csWeb/layer-sources-renders)
[![Coverage Status](https://coveralls.io/repos/TNOCS/csWeb/badge.svg?branch=development)](https://coveralls.io/r/TNOCS/csWeb?branch=development)

# README #

**csWeb**, or the **Common Sense Web application**, is an intuitive open source web-based GIS application, providing casual users as well as business analysists and information manageners with a powerful tool to perform spatial analysis. It has a strong focus on usability and connectivity, be it connecting and sharing information with other users or connecting to services or calculation simulations and models

is a userfriendly web application for showing (GIS) data on a map. It allows you to apply multiple filters to filter your data, and to style it, so you can immediately see what's important. In addition, in the most basic form, you don't even need a web server, and a public folder on a website is sufficient to be up and running.

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

### How do I get set up? ###

The application is written in Typescript, which compiles to regular JavaScript, and further uses Angularjs as the framework, Leaflet and Cesium for rendering maps, d3 and others. A detailed guide is provided [here](https://github.com/TNOCS/csWeb/wiki/Getting-started).

This repository consists of several project folders. The  most important ones are csComp, a library containing client side functionality, and csServerComp, for server side components. Both libraries generate a JavaScript file that can be used by the actual map application which you can find in the `example` folder.

#### Deployment instructions ####

Just copy the example folder to a public folder and open the public\index.html file in that folder.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
