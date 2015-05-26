module csComp.Services
{
    declare var Cesium;

    export class CesiumRenderer implements IMapRenderer
    {
        title = "cesium";
        service : LayerService;
        viewer : any;
        camera : any;
        scene  : any;
        features: { [key: string]: any } = {};

        public init(service : LayerService){
            this.service = service;
        }

        public enable()
        {
            this.viewer = new Cesium.Viewer('map', {
                selectionIndicator : false,
                infoBox: false,
                scene3DOnly: true,
                sceneModePicker: false,
                fullscreenButton: false,
                homeButton: false,
                baseLayerPicker: false,
                animation: false,
                timeline: false,
                navigationHelpButton: false
            });

            this.camera = this.viewer.camera;
            this.scene  = this.viewer.scene;

            this.camera.setView({
                position : Cesium.Cartesian3.fromDegrees(5, 52, 1000000)
            });

            setTimeout(() => {
                for (var i = 0; i < this.service.project.features.length; ++i)
                    this.addFeature(this.service.project.features[i]);
            }, 0);

            // onclick events
            this.setUpMouseHandlers();

            this.changeBaseLayer(this.service.$mapService.activeBaseLayer);
        }
        
        public setUpMouseHandlers()
        {
            var handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
            handler.setInputAction((click) => {
                var pickedObject = this.scene.pick(click.position);
                if (Cesium.defined(pickedObject) && pickedObject.id !== undefined && pickedObject.id.feature !== undefined) {
                    this.service.selectFeature(pickedObject.id.feature);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            handler.setInputAction((movement) => {
                var pickedObject = this.scene.pick(movement.endPosition);
                this.viewer.entities.values.forEach((entity) => {
                      if (entity.label !== undefined)
                          entity.label.show = false;
                });

                if (Cesium.defined(pickedObject) && pickedObject.id !== undefined && pickedObject.id.label !== undefined)
                    pickedObject.id.label.show = true;

            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
        public disable()
        {
            this.viewer.destroy();
        }

        public changeBaseLayer(layer : BaseLayer)
        {
            if (layer.cesium_url === undefined)
                alert('This layer is not cesium compatible');
            else
            {
                switch (layer.cesium_maptype.toUpperCase())
                {
                    case "ARCGIS":
                        var mapProvider = new Cesium.ArcGisMapServerImageryProvider({
                            url: layer.cesium_url,
                            minimumLevel: layer.minZoom,
                            maximumLevel: layer.maxZoom
                        });
                    break;

                    case "OPENSTREETMAP":
                        var mapProvider = new Cesium.OpenStreetMapImageryProvider({
                            url: layer.cesium_url,
                            minimumLevel: layer.minZoom,
                            maximumLevel: layer.maxZoom
                        });
                    break;

                    case "WEBMAPTILE":
                        var mapProvider = new Cesium.WebMapTileServiceImageryProvider({
                            url: layer.cesium_url,
                            minimumLevel: layer.minZoom,
                            maximumLevel: layer.maxZoom
                        });
                    break;

                    case "TILEMAP":
                        var mapProvider = new Cesium.TileMapServiceImageryProvider({
                            url: layer.cesium_url,
                            minimumLevel: layer.minZoom,
                            maximumLevel: layer.maxZoom
                        });
                    break;

                    default:
                        alert('unknown maptype: ' + layer.cesium_maptype);
                    break;
                }
                this.viewer.imageryLayers.addImageryProvider(mapProvider);
            }
        }

        public addLayer(layer: ProjectLayer)
        {
            console.log(layer);
            var dfd = jQuery.Deferred();
            switch(layer.type.toUpperCase()) {
                case "GEOJSON":
                case "DYNAMICGEOJSON":
                case "TOPOJSON":
                    setTimeout(() => {
                        layer.data.features.forEach((f: IFeature) => {
                            this.addFeature(f);
                        });
                        dfd.resolve();
                    }, 0);

                break;

                case "WMS":
                    var wms_layer = this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
                        url : layer.url,
                        layers: layer.wmsLayers,
                        parameters: {
                          format: 'image/png',
                          transparent: true,
                        }
                    }));
                    wms_layer.alpha = layer.opacity / 100;
                    dfd.resolve();
                break;

                default:
                    alert('unknown layertype: ' + layer.type);
                    dfd.resolve();
                break;
            }
            return dfd.promise();
        }

        public removeLayer(layer: ProjectLayer)
        {
            var dfd = jQuery.Deferred();
            switch(layer.type.toUpperCase()) {
                case "GEOJSON":
                case "DYNAMICGEOJSON":
                case "TOPOJSON":
                    setTimeout(() => {
                      layer.data.features.forEach((f: IFeature) => {
                          this.removeFeature(f);
                      });
                      dfd.resolve();
                    }, 0);

                break;

                case "WMS":
                    // just pop the last one, since it is a radiobutton
                    this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(1));
                    dfd.resolve();
                break;

                default:
                    alert('unknown layertype: ' + layer.type);
                    dfd.resolve();
                break;
            }
            return dfd.promise();
        }

        public updateMapFilter(group : ProjectGroup)
        {
            //console.log('updateMapFilter called (cesium)');
            var dfd = jQuery.Deferred();
            setTimeout(() => {
                var toRemove = [];
                this.viewer.entities.values.forEach((entity) => {
                    if (group.filterResult === undefined || (group.filterResult.length > 0 && entity.feature.layer.id === group.filterResult[0].layer.id))
                        toRemove.push(entity);
                });
                toRemove.forEach(entity => {
                    this.removeFeature(entity.feature);
                });

                group.filterResult.forEach((f: IFeature) => {
                    this.addFeature(f);
                });
                dfd.resolve();
            }, 0);
            return dfd.promise();
        }

        public addGroup(group: ProjectGroup) {
            console.log('addGroup called');
        }

        public removeGroup(group: ProjectGroup)
        {
            console.log('removeGroup called');
        }

        public removeFeature(feature: IFeature)
        {
            //console.log('removeFeature called');

            var toRemove = [];
            this.viewer.entities.values.forEach((entity) => {
                if (entity.feature.id === feature.id) {
                    toRemove.push(entity);
                }
            });

            toRemove.forEach(entity => {
                this.viewer.entities.remove(entity);
            });

        }

        public removeFeatures(features: IFeature [])
        {
            //console.log('removeFeature called');
            var dfd = jQuery.Deferred();

            setTimeout(() => {
                var toRemove = [];
                this.viewer.entities.values.forEach((entity) => {
                    features.forEach(feature => {
                      if (entity.feature.id === feature.id) {
                          toRemove.push(entity);
                      }
                    });
                });
                toRemove.forEach(entity => {
                    this.viewer.entities.remove(entity);
                });
                dfd.resolve();
            }, 0);

            return dfd.promise();
        }

        public updateFeature( feature : IFeature)
        {
            this.removeFeature(feature);
            this.addFeature(feature);
        }

        public addFeature(feature: IFeature)
        {
            // var dfd = jQuery.Deferred();
            // setTimeout(() => {
                var entity = this.createFeature(feature);
                // dfd.resolve();
            // }, 0);
            // return dfd.promise();
        }

        public createFeature(feature: IFeature) {
            var entity = this.viewer.entities.getOrCreateEntity(feature.id);

            entity.feature = feature;

            if (feature.properties['Name'] !== undefined)
              entity.name = feature.properties['Name'];

            // override for buildings from Top10NL
            var height = feature.properties['mediaan_hoogte'] === undefined ?  feature.effectiveStyle.height : feature.properties['mediaan_hoogte'];

            switch (feature.geometry.type.toUpperCase())
            {
                case "POINT":
                    // use 2D or 3D coordinates as a basis if we have them
                    if (feature.geometry.coordinates.length === 2)
                        entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
                    else if (feature.geometry.coordinates.length === 3)
                        entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]);
                break;

                case "POLYGON":
                    entity.polygon = new Cesium.PolygonGraphics( {
                          hierarchy : this.createPolygon(feature.geometry.coordinates),
                          material : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                          outline : true,
                          outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                          outlineWidth: feature.effectiveStyle.strokeWidth, // does not do anything on windows webGL: http://stackoverflow.com/questions/25394677/how-do-you-change-the-width-on-an-ellipseoutlinegeometry-in-cesium-map/25405483#25405483
                          extrudedHeight: height,
                          perPositionHeight: true
                    });
                break;

                case "MULTIPOLYGON":
                    var polygons = this.createMultiPolygon(feature.geometry.coordinates);
                    for (var i = 0; i < polygons.length; ++i)
                    {
                        var entity_multi = new Cesium.Entity();
                        entity_multi.feature = feature;

                        var polygon = new Cesium.PolygonGraphics({
                            hierarchy : polygons[i],
                            material : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                            outline : true,
                            outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                            outlineWidth : feature.effectiveStyle.strokeWidth,
                            extrudedHeight : height,
                            perPositionHeight: true
                        });
                        entity_multi.polygon = polygon;

                        this.viewer.entities.add(entity_multi);
                    }
                    return null;
                break;

                default:
                    alert('unknown geometry type: ' + feature.geometry.type);
                break;
            }

            var pixelSize = 5;
            if (feature.fType.style.iconUri !== undefined)
            {
                // a billboard is an icon for a feature
                entity.billboard = {
                    image : feature.fType.style.iconUri,
                    width : feature.effectiveStyle.iconWidth,
                    height : feature.effectiveStyle.iconHeight
                };
                // we draw this point very large because it serves as a background for the billboards
                pixelSize = 35;
            }

            // if there is no icon, a PointGraphics object is used as a fallback mechanism
            entity.point = {
                pixelSize : pixelSize,
                color : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                outlineWidth : feature.effectiveStyle.strokeWidth
            };

            //label for mouseover events
            entity.label = {
                text : entity.name,
                font : '12pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                pixelOffset : new Cesium.Cartesian2(0, 40),
                show : false
            };

            // add a 3D model if we have one
            if (feature.effectiveStyle.modelUri !== undefined)
            {
                entity.model = new Cesium.ModelGraphics({
                    uri : feature.effectiveStyle.modelUri,
                    scale: feature.effectiveStyle.modelScale,
                    minimumPixelSize: feature.effectiveStyle.modelMinimumPixelSize,
                });

                // Hide icon and point when we have a 3D model
                entity.billboard.show = false;
                entity.point.show = false;
            }

            //account for rotation
            if (feature.properties["Track"] !== undefined)
            {
                var headingQuaternion = Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]), Cesium.Math.toRadians(feature.properties["Track"]), 0, 0);
                entity.orientation = headingQuaternion;
            }

            return entity;
        }

        private createPolygon(coordinates)
        {
            if (coordinates.length === 0 || coordinates[0].length === 0)
                return;

            var polygon = new Cesium.PolygonHierarchy();
            var holes = [];
            for (var i = 1, len = coordinates.length; i < len; i++) {
                var flattenedPositions = Array.prototype.concat.apply([], coordinates[i]);
                if (coordinates[i][0].length == 3)
                    holes.push(Cesium.Cartesian3.fromDegreesArrayHeights(flattenedPositions));
                else
                    holes.push(Cesium.Cartesian3.fromDegreesArray(flattenedPositions));
            }
            polygon.holes = holes;

            var positions = coordinates[0];
            var flattenedPositions = Array.prototype.concat.apply([], positions);
            if (coordinates[0][0].length == 3)
                polygon.positions = Cesium.Cartesian3.fromDegreesArrayHeights(flattenedPositions);
            else
                polygon.positions = Cesium.Cartesian3.fromDegreesArray(flattenedPositions);

            return polygon;
        }

        private createMultiPolygon(coordinates)
        {
            var polygons = [];

            for (var i = 0; i < coordinates.length; i++) {
                polygons.push(this.createPolygon(coordinates[i]));
            }
            return polygons;
        }
    }
}
