# Readme

Normally, searching the website would mean that you do a query in 
a database or use a separate search engine to get back some results. 
However, this implies that you need to have such a service running 
on your server, making it less easy to create a standalone map 
application on a simple server that serves static HTML pages. For 
that reason, this offline search module is created. 

# How it works

The offline search module scans the projects.json solution file,
looking for projects. For each project, a new file is created,
offline_search_results.json, in the same folder as the project.json.

The OfflineSearchResults class:

- Runs when node.js starts up
- Scans the project.json for local layers and parses each of them
- Builds an array with source layer files: layer_id, title (for display), 
path, file_size, last_write_date
- Is configered with a list of stop words that should be excluded 
from the index.
- Is configured with the property names it needs to include in the 
search. These property names are also saved.
- Builds an index list based on these property names
- Each entry in the index contains a reference to: the layer, the 
feature, and the property name



