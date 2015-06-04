[![Build Status](https://travis-ci.org/TNOCS/csWeb.svg?branch=layer-sources-renders)](https://travis-ci.org/TNOCS/csWeb)
[![Stories in Ready](https://badge.waffle.io/tnocs/csweb.png?label=ready&title=Ready)](https://waffle.io/tnocs/csweb)
[![bitHound Score](https://www.bithound.io/github/TNOCS/csWeb/badges/score.svg)](https://www.bithound.io/github/TNOCS/csWeb/layer-sources-renders)

# README #

### What is this repository for? ###

**csWeb**, or the **Common Sense Web application**, is an intuitive open source web-based GIS application, providing casual users as well as business analysists and information manageners with a powerful tool to perform spatial analysis. It has a strong focus on usability and connectivity, be it connecting and sharing information with other users or connecting to services or calculation simulations and models

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
