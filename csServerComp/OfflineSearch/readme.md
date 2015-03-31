OfflineSearch
=============

A small node library providing csMap with the option to create an index file of the static GeoJson and TopoJson files.

## Installation

`npm install cs-offline-search --save`

## Usage

```
  import offlineSearch = require('cs-offline-search');

  var offlineSearchManager = new offlineSearch('public/data/projects/projects.json', {
      propertyNames: ['Name', 'postcode', 'Postcode'],
      stopWords    : ['the', 'a', 'an', 'of', 'to']
  });
```

## Tests

`npm test`

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 0.0.1 Initial release
* 0.0.2 Added test
* 0.0.3 Fixed bug when a property returns a number
* 0.0.4 Reorganized the output (added dist folder)
* 0.0.5 Updated documentation
* 0.0.7 Added fix for files that contain geometries without features

## About the code

Normally, searching the website would mean that you do a query in
a database or use a separate search engine to get back some results.
However, this implies that you need to have such a service running
on your server, making it less easy to create a standalone map
application on a simple server that serves static HTML pages. For
that reason, this offline search module is created.

### How it works

The offline search module scans the projects.json solution file,
looking for projects. For each project, a new file is created,
offline_search_results.json, in the same folder as the project.json.

The `OfflineSearchManager` class (in index.ts):

* Runs when node.js starts up
* Scans the projects.json for local projects
* Starts an OfflineSearcher for each project in projects found

The `OfflineSearcher`

* Scans the project.json for local layers and parses each of them
* Builds an `OfflineSearchResult` with
* Saves the `OfflineSearchResult`.

    * An array with source layer files: layer_id, title (for display),
path, file_size, last_write_date
    * Is configered with a list of stop words that should be excluded
from the index.
    * Is configured with the property names it needs to include in the
search. These property names are also saved.
    * Builds an index list based on these property names
    * Each entry in the index contains a reference to: the layer, the
feature, and the property name

The `OfflineSearchDirective`

* Retreives the OfflineSearchResult file (async)
* Uses it for locating search requests: found results are returned
using the layer name & feature name.
