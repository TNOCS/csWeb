# README #

### What is this repository for? ###

**csWeb (version 0.1)**, or the **Common Sense Web application**, is a web-based open source GIS application, written in Typescript, with a focus on usability and connectivity, be it connecting and sharing information with other users or connecting to services or calculation simulations and models. 

Note, however, that this repository only contain the back-end functionality for the above-mentioned web application. You need csWebApp as a starting point for creating the actual web-based application. 

This repository consists of two projects, csComp, a library containing client side functionality, and csServerComp, for server side components, Both libraries generate a JavaScript file that can be used by the actual map application.

### How do I get set up? ###

#### Development environment ####

This project was creating in **Visual Studio 2013**, update 3, using the **Web Extension** and **nodejstools.codeplex.com** extensions, among others. Although we use VS, this shouldn't keep you from developing in another environment. 

We further use **node.js** or IIS to run our web application, although currently it suffices to copy everything to a public folder on the web to get up running.

Finally, we rely on the Node Package Manager (part of node.js), **npm**, to install our server and development packages, **bower** (npm install -g bower), and **gulp.js** as our task runner. 

The Typescript files that we generate get, upon saving them in VS, immediately compiled to JavaScript files, and gulp copies them to the web applicatioin.

#### Folder structure ####

As explained, you need to check out two repositories to get up and running. This repository, which contains the shared functionality, and csWebApp, which contains the front end and the npm, bower and gulp tasks. If you recreate the following folder structure, you should be able to rebuild the project yourself.


```
#!dos

BASE_FOLDER
BASE_FOLDER\apps\csWebApp (go to repository)
BASE_FOLDER\csWeb\csComp (this repository)
BASE_FOLDER\csWeb\csServerComp

```
waarbij ik csWeb in c:\dev\web\cs\csWeb\ uitcheck, en ZorgOpDeKaart in c:\dev\web\cs\apps
en c:\dev\web\cs\ is natuurlijk vrij te kiezen‏

#### Getting started ####

1. Create a BASE_FOLDER;
2. Create BASE_FOLDER\apps
3. Checkout csWebApp in this folder
4. Create BASE_FOLDER\csWeb
5. Checkout csWeb (this repo) in this folder

In apps\csWebApp\Website, run update.bat to:
1. Download npm dependencies
2. Download bower dependencies
3. Run gulp to perform background tasks.

Open apps\csWebApp\csWebApp.sln, rebuild the project (probably twice), and press CTRL-F5 to run node.js and open your browser on the local website. 

#### Deployment instructions ####

Just copy the apps\csWebApp\Website\public to a public folder and open the index.html file in that folder.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin