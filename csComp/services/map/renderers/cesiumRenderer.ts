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

            for (var i = 0; i < this.service.project.features.length; ++i)
                this.addFeature(this.service.project.features[i]);

            // onclick events
            this.setUpMouseHandlers();
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

        public addLayer(layer: ProjectLayer)
        {
            console.log(layer);
            switch(layer.type.toUpperCase()) {
                case "GEOJSON":
                case "DYNAMICGEOJSON":
                case "TOPOJSON":
                    layer.data.features.forEach((f: IFeature) => {
                        this.addFeature(f);
                    });
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
                break;

                default:
                    alert('unknown layertype: ' + layer.type);
                break;
            }
        }

        public removeLayer(layer: ProjectLayer)
        {
            switch(layer.type.toUpperCase()) {
                case "GEOJSON":
                case "DYNAMICGEOJSON":
                case "TOPOJSON":
                  layer.data.features.forEach((f: IFeature) => {
                      this.removeFeature(f);
                  });
                break;

                case "WMS":
                    // just pop the last one, since it is a radiobutton
                    this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(1));
                break;

                default:
                    alert('unknown layertype: ' + layer.type);
                break;
            }
        }

        public updateMapFilter(group : ProjectGroup)
        {
            console.log('updateMapFilter called (cesium)');

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
            console.log('removeFeature called');

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

        public updateFeature( feature : IFeature)
        {
            this.removeFeature(feature);
            this.addFeature(feature);
        }

        public addFeature(feature: IFeature)
        {
            var entity = this.createFeature(feature);
        }

        public createFeature(feature: IFeature) {
            var entity = this.viewer.entities.getOrCreateEntity(feature.id);

            entity.feature = feature;

            if (feature.properties['Name'] !== undefined)
              entity.name = feature.properties['Name'];

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
                    entity.polygon = {
                          hierarchy : this.createPolygon(feature.geometry.coordinates).hierarchy,
                          material : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                          outline : true,
                          outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                          outlineWidth: feature.effectiveStyle.strokeWidth,
                          extrudedHeight: feature.effectiveStyle.height
                    }
                break;

                case "MULTIPOLYGON":
                    var polygons = this.createMultiPolygon(feature.geometry.coordinates);
                    for (var i = 0; i < polygons.length; ++i)
                    {
                        var entity_multi = new Cesium.Entity();
                        entity_multi.feature = feature;

                        var polygon = polygons[i];

                        polygon.material = Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor);
                        polygon.outline = true;
                        polygon.outlineColor = Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor);
                        polygon.outlineWidth = feature.effectiveStyle.strokeWidth;
                        polygon.extrudedHeight = feature.effectiveStyle.height;
                        entity_multi.polygon = polygon;

                        this.viewer.entities.add(entity_multi);
                    }
                    return null;
                break;

                default:
                    alert('unknown geometry type: ' + feature.geometry.type);
                break;
            }

            // a billboard is an icon for a feature
            entity.billboard = {
                image : feature.fType.style.iconUri,
                color : Cesium.Color.WHITE,
                width : feature.fType.style.iconWidth,
                height : feature.fType.style.iconHeight
            };

            // if there is no icon, a PointGraphics object is used as a fallback mechanism
            entity.point = {
                pixelSize : 5,
                color : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                outlineWidth : feature.effectiveStyle.strokeWidth,
            };

            //label for mouseover events
            entity.label = {
                text : entity.name,
                font : '12pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                pixelOffset : new Cesium.Cartesian2(0, 20),
                show : false
            };

            // add a 3D model if we have one
            if (feature.effectiveStyle.modelUri !== undefined)
            {
                entity.model = new Cesium.ModelGraphics({
                    uri : feature.effectiveStyle.modelUri,
                    scale: feature.effectiveStyle.modelScale,
                    minimumPixelsize: feature.effectiveStyle.modelMinimumPixelSize,
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
                holes.push(new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(Array.prototype.concat.apply([], coordinates[i]))));
            }

            var positions = coordinates[0];
            polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(Array.prototype.concat.apply([],positions)), holes));

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
