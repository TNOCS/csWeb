[![Build Status](https://travis-ci.org/TNOCS/csWeb.svg?branch=master)](https://travis-ci.org/TNOCS/csWeb)
[![Stories in Ready](https://badge.waffle.io/tnocs/csweb.png?label=ready&title=Ready)](https://waffle.io/tnocs/csweb)
[![bitHound Score](https://www.bithound.io/github/TNOCS/csWeb/badges/score.svg)](https://www.bithound.io/github/TNOCS/csWeb/layer-sources-renders)
[![Coverage Status](https://coveralls.io/repos/TNOCS/csWeb/badge.svg?branch=development)](https://coveralls.io/r/TNOCS/csWeb?branch=development)

# README #

**csWeb**, or the **Common Sense Web application**, is an intuitive open source web-based GIS application, providing casual users as well as business analysists and information manageners with a powerful tool to perform spatial analysis. It has a strong focus on usability and connectivity, be it connecting and sharing information with other users or connecting to services or calculation simulations and models. [LIVE DEMO](http://tnocs.github.io/csWeb/)

## Features
* Basic map interactions (zooming, geo-locating, selecting different base layers)
* Displaying geojson files
* Specifying how properties must be displayed (formatting, title, tooltips, etc.)
* Filtering on one or more properties
* Coloring icons and regions based on one or more properties
* Displaying data in a table, and allowing the users to download it
* Searching for a feature

## Technical overview

Technically, we use the following frameworks:
* Typescript for coding the application
* Angularjs as the MVC framework
* Bootstrap 3 (and fontawesome) for the CSS design style
* Leaflet for the 2D map layer, and Cesium for the 3D maps
* d3, dc, crossfilter for filtering and styling

### How do I get set up? ###

The application is written in Typescript, which compiles to regular JavaScript, and further uses Angularjs as the framework, Leaflet and Cesium for rendering maps, d3 and others. A detailed guide is provided [here](https://github.com/TNOCS/csWeb/wiki/Getting-started).

This repository consists of several project folders. The  most important ones are csComp, a library containing client side functionality, and csServerComp, for server side components. Both libraries generate a JavaScript file that can be used by the actual map application which you can find in the `example` folder.

#### Deployment instructions ####

Just copy the example folder to a public folder and open the public\index.html file in that folder.

### Using Docker contaiiners
There are two types of docker containers built for CommonSense:
* [`tnocs/csWeb-demo`](https://hub.docker.com/r/tnocs/csweb-demo/)
* [`tnocs/csWeb-dev`](https://hub.docker.com/r/tnocs/csweb-dev/)

#### `tnocs/csWeb-demo`
This container runs whole csWeb application. To run it and access csWeb in the web browser at `<port>` run:
```sh
# replace <port> with the port number you want to access csWeb at
docker run -d -p 3002:<port> tnocs/csWeb-demo
```
If your're using docker running in your system (Linux), application should be avaiilable at `localhost`,
otherwise when using `docker-machine`, you can ask about ip address with `docker-machine ip default` (in case your vm with docker is named default).

#### `tnocs/csWeb-dev`
This container is meant to run csWeb build in the docker container istread of local machine. csWeb local repository will be mounted inside the container and the build process will happen inside the container. This is usefull in at least two cases.
* to check if you understand all dependencies of your build process since only dependencies specified in the [Dockerfile](https://github.com/TNOCS/csWeb/blob/development-docker/docker-dev/Dockerfile) will be installed
* to avoid installing dependencies on local machin

Run container from within csWeb directory:
```sh
docker run -it --rm -p 3002:<port> -v $PWD:/app/ tno/csWeb-dev /bin/bash
```

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

#### Testing ####



```
karma start test/karma.conf.js
```

### Who do I talk to? ###

* Repo owner or admin
