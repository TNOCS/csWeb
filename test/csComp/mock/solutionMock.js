angular.module('solutionMock', [])
    .value('defaultSolution', [{
        "title": "csMap",
        "maxBounds": {
            "southWest": [49.2, 1.0],
            "northEast": [54.0, 10.0]
        },
        "viewBounds": {
            "southWest": [50.7, 3.3],
            "northEast": [53.5, 7.3]
        },
        "baselayers": [{
                "title": "OpenStreetMap HOT",
                "subtitle": "Road",
                "url": "http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                "isDefault": false,
                "minZoom": 0,
                "maxZoom": 19,
                "cesium_url": "http://c.tile.openstreetmap.fr/hot/",
                "cesium_maptype": "openstreetmap",
                "subdomains": ["a", "b", "c"],
                "attribution": "Tiles courtesy of <a href='http://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>",
                "preview": "http://b.tile.openstreetmap.fr/hot/11/1048/675.png"
            }, {
                "title": "OpenStreetMap",
                "subtitle": "Road",
                "url": "http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png",
                "isDefault": false,
                "cesium_url": "http://otile3.mqcdn.com/tiles/1.0.0/osm/",
                "cesium_maptype": "openstreetmap",
                "minZoom": 0,
                "maxZoom": 19,
                "subdomains": ["otile1", "otile2", "otile3", "otile4"],
                "attribution": "Tiles courtesy of <a href='http://www.mapquest.com/' target='_blank'>MapQuest</a> <img src='http://developer.mapquest.com/content/osm/mq_logo.png'>. Map data (c) <a href='http://www.openstreetmap.org/' target='_blank'>OpenStreetMap</a> contributors, CC-BY-SA.",
                "preview": "http://c.tile.openstreetmap.org/11/1051/673.png"
            }],
        "projects": [{
                "title": "csWeb Showcases",
                "url": "data/projects/20141104_csMap/project.json"
            }, {
                "title": "Dynamic Example",
                "url": "data/projects/DynamicExample/project.json",
                "dynamic": true
            }
        ]
    }
]);
