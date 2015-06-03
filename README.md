[![Build Status](https://travis-ci.org/TNOCS/csWeb.svg?branch=layer-sources-renders)](https://travis-ci.org/TNOCS/csWeb)
[![Stories in Ready](https://badge.waffle.io/tnocs/csweb.png?label=ready&title=Ready)](https://waffle.io/tnocs/csweb)
[![bitHound Score](https://www.bithound.io/github/TNOCS/csWeb/badges/score.svg)](https://www.bithound.io/github/TNOCS/csWeb/layer-sources-renders)

# README #

### What is this repository for? ###

**csWeb (version 0.1)**, or the **Common Sense Web application**, is a web-based open source GIS application, written in Typescript, with a focus on usability and connectivity, be it connecting and sharing information with other users or connecting to services or calculation simulations and models. 

Note, however, that this repository only contain the back-end functionality for the above-mentioned web application. You need [csMap](https://github.com/TNOCS/csMap) as a starting point for creating the actual web-based application. 

This repository consists of two projects, csComp, a library containing client side functionality, and csServerComp, for server side components, Both libraries generate a JavaScript file that can be used by the actual map application.

### How do I get set up? ###

#### Development environment ####

We further use **node.js** or IIS to run our web application, although currently it suffices to copy everything to a public folder on the web to get up running.

Finally, we rely on the Node Package Manager (part of node.js), **npm**, to install our server and development packages, **bower** (npm install -g bower), and **gulp.js** as our task runner. 

The Typescript files that we generate get, upon saving them in VS, immediately compiled to JavaScript files, and gulp copies them to the web applicatioin.

#### Folder structure ####

As explained, you need to check out two repositories to get up and running. This repository, which contains the shared functionality, and csMap, which contains the front end and the npm, bower and gulp tasks. If you recreate the following folder structure, you should be able to rebuild the project yourself.


```
#!dos

BASE_FOLDER
BASE_FOLDER\csWeb (this repository)

```

Under windows you could checkout `csWeb` in `c:\dev\web\cs\csWeb\`. You can choose any folder you like as a `BASE_FOLDER`, in the example above it is `c:\dev\web\cs\`.


Under OSX or linux you would do something like this:
```
#!/bin/bash
BASE_FOLDER=~/src/cs
mkdir $BASE_FOLDER
cd $BASE_FOLDER
git clone https://github.com/TNOCS/csWeb
cd -
```

#### Getting started ####
1. Create a BASE_FOLDER;
2. Checkout csWeb (this repo) in this folder

In apps\csMap\Website, run update.bat (windows) or ./update.sh (OSX/linux) to:
1. Download npm dependencies
2. Download bower dependencies
3. Run to perform background tasks.

If you want to run updates continuously go to apps\csMap\Website and run `gulp watch`. 

#### Deployment instructions ####

Just copy the example folder to a public folder and open the public\index.html file in that folder.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
