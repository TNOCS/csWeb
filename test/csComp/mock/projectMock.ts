angular.module('projectMock', [])
  .value('defaultProject', {
    "title": "csWeb Showcases",
    "description": "csMap is developed by the Dutch Research Organisation TNO, in first instance for the Dutch Ministry of Health (VWS).",
    "url": "https://github.com/TNOCS/csMap",
    "logo": "images/CommonSenseRound.png",
    "connected": true,
    "timeLine": {
      "start": 1375315200000,
      "end": 1425168000000,
      "range": 34128000000,
      "zoomLevelName": "years",
      "isLive": false
    },
    "datasources": [{
      "url": "/datasource",
      "type": "dynamic",
      "sensors": {
        "test": {
          "propertyTypeKey": "sensor_test"
        },
        "test2": {
          "propertyTypeKey": "sensor_test2"
        }
      }
    }],
    "dashboards": [{
      "id": "home",
      "name": "Home",
      "showTimeline": true,
      "showLeftmenu": true,
      "showMap": true
    }, {
      "id": "datatable",
      "name": "Table",
      "showTimeline": false,
      "showLeftmenu": false,
      "showMap": false,
      "widgets": [{
        "directive": "datatable",
        "borderwidth": "0px",
        "width": "100%",
        "height": "100%"
      }]
    }, {
      "name": "Test",
      "showTimeline": false,
      "showLeftmenu": false,
      "showMap": false,
      "widgets": [{
        "directive": "datatable",
        "borderwidth": "0px",
        "width": "100%",
        "height": "100%"
       }]
    }, {
      "id": "flight",
      "name": "Flights",
      "showTimeline": true,
      "showLeftmenu": true,
      "showMap": true,
      "baselayer": "Positron",
      "visiblelayers": [
        "FlightRadar"
      ],
      "widgets": [{
        "directive": "indicators",
        "left": "10px",
        "top": "10px",
        "borderwidth": "3px",
        "background": "red",
        "bordercolor": "red",
        "borderradius": "5px",
        "width": "255px",
        "height": "435px",
        "data": {
          "title": "Sensor Data 1",
          "indicators": [{
            "visual": "circular",
            "sensor": "datasource/test"
          }, {
            "visual": "sparkline",
            "sensor": "datasource/test2"
          }]
        }
      }]
    }],
    "expertMode": 3,
    "userPrivileges": {
      "mca": {
        "expertMode": true
      },
      "heatmap": {
        "expertMode": true
      }
    },
    "accentColor": "Green",

    "baselayers": {

    },
    "groups": [{
      "title": "Flight Radar",
      "description": "Demonstrates WMS layers.",
      "clustering": false,
      "layers": [{
        "id": "FlightRadar",
        "type": "dynamicgeojson",
        "typeUrl": "data/projects/resources/resources.json",
        "url": "/fr"
      }]
    }, {
      "languages": {
        "nl": {
          "title": "Locaties",
          "description": "Demonstreert kaartlagen gebaseerd op specifieke locaties"
        },
        "en": {
          "title": "Features",
          "description": "Demonstrates layers based on points"
        }
      },
      "clustering": true,
      "clusterLevel": 12,
      "layers": [{
        "id": "Hospitals",
        "reference": "Hospitals",
        "languages": {
          "nl": {
            "title": "Ziekenhuizen",
            "description": "De locaties van de Nederlandse ziekenhuizen."
          },
          "en": {
            "title": "Hospitals",
            "description": "These are the locations of the Dutch hospitals."
          }
        },
        "type": "GeoJson",
        "url": "data/projects/20141104_csMap/Ziekenhuizen.json",
        "typeUrl": "data/projects/resources/resources.json",
        "enabled": false,
        "opacity": 100
      }, {
        "id": "firestation",
        "reference": "firestation",
        "languages": {
          "nl": {
            "title": "Brandweerkazernes",
            "description": "De locaties van de Nederlandse brandweerkazernes en opleidingscentra (Bron: IFV, BAG, 1 november 2014)."
          },
          "en": {
            "title": "Fire stations",
            "description": "These are the locations of the fire station. (Source: IFV, BAG, 1 november 2014.)"
          }
        },
        "type": "GeoJson",
        "url": "data/projects/20141104_csMap/brandweerposten.json",
        "typeUrl": "data/projects/resources/resources.json",
        "enabled": false,
        "opacity": 100
      }, {
        "id": "traveltimes",
        "reference": "traveltimes",
        "languages": {
          "nl": {
            "title": "Reistijd",
            "description": "De reistijd van een brandweerkazerne naar de zorginstelling (Bron: IFV, BAG: 1 november 2014)."
          },
          "en": {
            "title": "Travel times",
            "description": "This is the travel time from the nearest fire station to a care institute. (Bron: IFV, BAG: 1 november 2014.)"
          }
        },
        "type": "GeoJson",
        "url": "data/projects/20141104_csMap/aanrijtijden.json",
        "typeUrl": "data/projects/resources/resources.json",
        "enabled": false,
        "opacity": 100
      }]
    }, {
      "title": "WMS",
      "description": "Demonstrates WMS layers.",
      "clustering": false,
      "oneLayerActive": true,
      "layers": [{
        "id": "bag",
        "reference": "bag",
        "languages": {
          "nl": {
            "title": "BAG",
            "description": "Basis Administratie Gebouwen (Bron: Kadaster, via PDOK.nl)."
          },
          "en": {
            "title": "BAG (Cadastre)",
            "description": "Dutch Cadastre's Basis Administratie Gebouwen. (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "pand,ligplaats,standplaats,verblijfsobject",
        "url": "http://geodata.nationaalgeoregister.nl/bagviewer/wms?",
        "enabled": false,
        "opacity": 25
      }, {
        "id": "us",
        "reference": "us",
        "title": "US",
        "type": "wms",
        "wmsLayers": "NoiseTrafficLden55dB",
        "url": "http://practice.tno.nl:8080/geoserver/rasters/wms?",
        "enabled": false,
        "opacity": 50
      }, {
        "id": "cbs",
        "reference": "cbs",
        "languages": {
          "nl": {
            "title": "CBS provincie data",
            "description": "(Bron: CBS, via PDOK.nl)."
          },
          "en": {
            "title": "CBS Provinces",
            "description": "Dutch Provinces. (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "cbsprovincies2012",
        "url": "http://geodata.nationaalgeoregister.nl/cbsprovincies/wms?",
        "enabled": false,
        "opacity": 50
      }, {
        "id": "aan",
        "reference": "aan",
        "languages": {
          "nl": {
            "title": "Agrarisch gebied",
            "description": "Agrarisch Areaal Nederland (AAN). Geografische afbakening van landbouwgrond in Nederland (grond die wordt gebruikt als bouwland, blijvend grasland of de teelt van blijvende gewassen). (Source: PDOK.nl.)"
          },
          "en": {
            "title": "Agricultural areas",
            "description": "Agrarisch Areaal Nederland (AAN). Geografische afbakening van landbouwgrond in Nederland (grond die wordt gebruikt als bouwland, blijvend grasland of de teelt van blijvende gewassen). (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "aan",
        "url": "http://geodata.nationaalgeoregister.nl/aan/wms?",
        "enabled": false,
        "opacity": 50
      }, {
        "id": "ahn",
        "reference": "ahn",
        "languages": {
          "nl": {
            "title": "AHN",
            "description": "Actuele Hoogtekaart Nederland (Source: PDOK.nl.)"
          },
          "en": {
            "title": "AHN2",
            "description": "Dutch height map, 0.5m, ruw. (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "ahn2_05m_ruw",
        "url": "http://geodata.nationaalgeoregister.nl/ahn2/wms?",
        "enabled": false,
        "opacity": 50
      }, {
        "id": "buurten",
        "reference": "buurten",
        "languages": {
          "nl": {
            "title": "Buurten",
            "description": "Het Bestand Wijk- en Buurtkaart 2013 bevat de geometrie van alle buurten in Nederland (Source: PDOK.nl.)"
          },
          "en": {
            "title": "Boroughs",
            "description": "From the Dutch Census, CBS (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "cbs_buurten_2013",
        "url": "http://geodata.nationaalgeoregister.nl/wijkenbuurten2013/wms?",
        "typeUrl": "data/projects/resources/resources.json",
        "enabled": false,
        "opacity": 50
      }, {
        "id": "top10terreinen",
        "reference": "top10terreinen",
        "languages": {
          "nl": {
            "title": "TOP10NL Terreinen",
            "description": "Terreinen (Source: PDOK.nl.)"
          },
          "en": {
            "title": "TOP10NL Terrains",
            "description": "Terreinen (Source: PDOK.nl.)"
          }
        },
        "type": "wms",
        "wmsLayers": "terreinen",
        "url": "http://geodata.nationaalgeoregister.nl/top10nl/wms?",
        "enabled": false,
        "opacity": 50
      }]
    }, {
      "languages": {
        "nl": {
          "title": "Gebieden",
          "description": "Demonstreert lagen gebaseerd op gebieden."
        },
        "en": {
          "title": "Areas",
          "description": "Demonstrates layers based on regions."
        }
      },
      "clustering": false,
      "oneLayerActive": true,
      "layers": [

        {
          "id": "9d1dc210f8f5474f977c9d0f24df2ff8",
          "reference": "zorgkantoor",
          "title": "Health regions",
          "description": "Data at the health office regions. (Source: CBS, BAG, TNO, DigiMV.)",
          "type": "GeoJson",
          "url": "data/projects/20141104_csMap/Regio ZK ZZP CBS.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "veiligheidsregio",
          "reference": "veiligheidsregio",
          "languages": {
            "nl": {
              "title": "Veiligheidsregios",
              "description": "Statistische data per veiligheidsregio. (Bron: CBS, Regioatlas. Geactualiseerd: 1 november 2014.)"
            },
            "en": {
              "title": "Safety region",
              "description": "Statistical data per safety region. (Source: CBS, Regioatlas: 1 november 2014.)"
            }
          },
          "type": "GeoJson",
          "url": "data/projects/20141104_csMap/veiligheidsregios.json",
          "typeUrl": "data/projects/resources/resources.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "gemeentes",
          "reference": "gemeentes",
          "languages": {
            "nl": {
              "title": "Gemeentes",
              "description": "Statistische data per gemeente. (Bron: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)"
            },
            "en": {
              "title": "Towns",
              "description": "Statistical data per city in Dutch. (Source: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)"
            }
          },
          "type": "GeoJson",
          "url": "data/projects/20141104_csMap/gemeente.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "cities2",
          "reference": "cities2",
          "languages": {
            "nl": {
              "title": "Gemeentes (vertaald)",
              "description": "Statistische data per gemeente. (Bron: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)"
            },
            "en": {
              "title": "Towns (localised)",
              "description": "Statistical data per city. (Source: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)"
            }
          },
          "type": "GeoJson",
          "url": "data/projects/20141104_csMap/localized_city_data.json",
          "typeUrl": "data/projects/resources/resources.json",
          "enabled": false,
          "opacity": 50
        }, {
          "id": "topo_cities",
          "reference": "topo_cities",
          "title": "TopoJSON Cities",
          "description": "Statistical data per city. (Source: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)",
          "type": "TopoJson",
          "url": "data/projects/20141104_csMap/gemeente.topo.json",
          "typeUrl": "data/projects/resources/resources.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "p4",
          "reference": "p4",
          "title": "P4 topojson",
          "description": "Statistical data per city. (Source: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)",
          "type": "TopoJson",
          "url": "data/projects/20141104_csMap/postcode4-nl.topo.json",
          "typeUrl": "data/projects/resources/resources.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "p4geo",
          "reference": "p4geo",
          "title": "P4 geojson",
          "description": "Statistical data per city. (Source: CBS, BAG, TNO, DigiMV. Geactualiseerd: 1 november 2014.)",
          "type": "TopoJson",
          "url": "data/projects/20141104_csMap/postcode4-nl.geo.json",
          "typeUrl": "data/projects/resources/resources.json",
          "enabled": false,
          "opacity": 100
        }, {
          "id": "ESRIGrid",
          "reference": "Esri",
          "languages": {
            "nl": {
              "title": "ESRI Grid",
              "description": "Test voor het inlezen van een ESRI Grid bestand."
            },
            "en": {
              "title": "ESRI Grid",
              "description": "Test reading an ESRI Grid file."
            }
          },
          "type": "grid",
          "renderType": "geojson",
          "dataSourceParameters": {
            "gridType": "esri"
          },
          "url": "data/projects/20141104_csMap/esri_ascii_grid.txt",
          "enabled": false,
          "opacity": 50
        }
      ]
    }, {
      "languages": {
        "nl": {
          "title": "Hierarchische data",
          "description": "Hierarchische data."
        },
        "en": {
          "title": "Hierarchical data",
          "description": "Hierarchical data."
        }
      },
      "oneLayerActive": true,
      "clustering": true,
      "clusterLevel": 15,
      "layers": [{
        "description": "Huisartsen in Nederland",
        "type": "hierarchy",
        "hierarchySettings": {
          "referenceList": [
            "gemeentes"
          ]
        },
        "title": "Huisartsen",
        "url": "data/projects/20141104_csMap/huisartsen.json",
        "typeUrl": "data/projects/resources/resources.json",
        "opacity": 50
      }, {
        "description": "Verzorgingshuizen in Nederland",
        "type": "hierarchy",
        "hierarchySettings": {
          "referenceList": [
            "gemeentes"
          ]
        },
        "title": "Verzorgingshuizen",
        "url": "data/projects/20141104_csMap/verzorgingshuizen.json",
        "typeUrl": "data/projects/resources/resources.json",
        "opacity": 50
      }]
    }, {
      "title": "3D",
      "clustering": false,
      "oneLayerActive": true,
      "layers": [{
        "id": "3Dtestamsterdam",
        "reference": "3D Test Amsterdam",
        "languages": {
          "nl": {
            "title": "3D Buildings Amsterdam",
            "description": "TOP10NL."
          },
          "en": {
            "title": "3D Buildings Amsterdam",
            "description": "TOP10NL."
          }
        },
        "type": "GeoJson",
        "url": "data/projects/20141104_csMap/amsterdam.json",
        "enabled": false,
        "opacity": 100
      }, {
        "id": "3Dtestamsterdamarena",
        "reference": "3D Test Amsterdam Arena",
        "languages": {
          "nl": {
            "title": "3D Buildings Amsterdam Arena",
            "description": "TOP10NL."
          },
          "en": {
            "title": "3D Buildings Amsterdam Arena",
            "description": "TOP10NL."
          }
        },
        "type": "GeoJson",
        "url": "data/projects/20141104_csMap/arena.json",
        "enabled": false,
        "opacity": 100
      }]
    }]
  }
);
