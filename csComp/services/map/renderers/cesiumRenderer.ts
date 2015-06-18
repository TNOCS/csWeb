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
        private popup : any;
        private popupShownFor: IFeature;
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

            setTimeout(() => {
                for (var i = 0; i < this.service.project.features.length; ++i)
                    this.addFeature(this.service.project.features[i]);
            }, 0);

            // onclick events
            this.setUpMouseHandlers();
            this.fitBounds(this.service.$mapService.maxBounds);
            this.changeBaseLayer(this.service.$mapService.activeBaseLayer);
        }

        public getZoom()
        {
            // we dont get nearby relations for now
            return 0;
        }

        public fitBounds(bounds: L.LatLngBounds)
        {
            var ellipsoid = Cesium.Ellipsoid.WGS84;

            var west = Cesium.Math.toRadians(bounds.getSouthWest().lng);
            var south = Cesium.Math.toRadians(bounds.getSouthWest().lat);
            var east = Cesium.Math.toRadians(bounds.getNorthEast().lng);
            var north = Cesium.Math.toRadians(bounds.getNorthEast().lat);

            var extent = new Cesium.Rectangle(west, south, east, north);
            this.camera.viewRectangle(extent, ellipsoid);
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

                if (Cesium.defined(pickedObject) && pickedObject.id !== undefined && pickedObject.id.feature !== undefined)
                    this.showFeatureTooltip(pickedObject.id.feature, movement.endPosition);
                else
                    $(".cesiumPopup").fadeOut('fast').remove();
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            // zoom to mouse
            var eventHandler, mousePosition;

            this.scene.screenSpaceCameraController.enableZoom = false;
            eventHandler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);

            eventHandler.setInputAction((event) => {
                mousePosition = event.endPosition;
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            eventHandler.setInputAction((wheelZoomAmount) => {
                var cameraHeight, directionToZoom, zoomAmount;
                if (mousePosition) {
                    cameraHeight = this.scene.globe.ellipsoid.cartesianToCartographic(this.camera.position).height || Number.MAX_VALUE;
                    directionToZoom = this.camera.getPickRay(mousePosition).direction;
                    zoomAmount = wheelZoomAmount * cameraHeight / 1000;

                    this.camera.move(directionToZoom, zoomAmount);
                }
            }, Cesium.ScreenSpaceEventType.WHEEL);
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

        public showFeatureTooltip(feature : IFeature, endPosition) {
            if (this.popupShownFor !== undefined && feature.id == this.popupShownFor.id) return;
            $(".cesiumPopup").fadeOut('fast').remove();
            this.popupShownFor = feature;

            var layer = feature.layer;
            var group = layer.group;
            // var feature = <Feature>layer.feature;
            // add title
            var title = feature.properties["Name"];
            var rowLength = (title) ? title.length : 1;
            var content = '<td colspan=\'3\'>' + title + '</td></tr>';
            // add filter values
            if (group.filters != null && group.filters.length > 0) {
                group.filters.forEach((f: GroupFilter) => {
                    if (!feature.properties.hasOwnProperty(f.property)) return;
                    var value = feature.properties[f.property];
                    if (value) {
                        var valueLength = value.toString().length;
                        if (f.meta != null) {
                            value = Helpers.convertPropertyInfo(f.meta, value);
                            if (f.meta.type !== 'bbcode') valueLength = value.toString().length;
                        }
                        rowLength = Math.max(rowLength, valueLength + f.title.length);
                        content += '<tr><td><div class=\'smallFilterIcon\'></td><td>' + f.title + '</td><td>' + value + '</td></tr>';
                    }
                });
            }

            // add style values, only in case they haven't been added already as filter
            if (group.styles != null && group.styles.length > 0) {
                group.styles.forEach((s: GroupStyle) => {
                    if (group.filters != null && group.filters.filter((f: GroupFilter) => { return f.property === s.property; }).length === 0 && feature.properties.hasOwnProperty(s.property)) {
                        var value = feature.properties[s.property];
                        var valueLength = value.toString().length;
                        if (s.meta != null) {
                            value = Helpers.convertPropertyInfo(s.meta, value);
                            if (s.meta.type !== 'bbcode') valueLength = value.toString().length;
                        }
                        var tl = s.title ? s.title.length : 10;
                        rowLength = Math.max(rowLength, valueLength + tl);
                        content += '<tr><td><div class=\'smallStyleIcon\'></td><td>' + s.title + '</td><td>' + value + '</td></tr>';
                    }
                });
            }
            var widthInPixels = Math.max(Math.min(rowLength * 7 + 15, 250), 130);
            content = '<table style=\'width:' + widthInPixels + 'px;\'>' + content + '</table>';

            // cesium does not have a popup class like leaflet does, so we create our own div with absolute position
            this.popup = $("<div class='cesiumPopup featureTooltip'></div>").html(content).css({ position: 'absolute', top: endPosition.y - 30, left: endPosition.x - widthInPixels / 2 - 30, width: widthInPixels}).hide().fadeIn('fast');
            $("body").append(this.popup);
        }

        public addLayer(layer: ProjectLayer)
        {
            // console.log(layer);
            var dfd = jQuery.Deferred();
            switch(layer.renderType) {
                case "geojson":
                    setTimeout(() => {
                        layer.data.features.forEach((f: IFeature) => {
                            this.addFeature(f);
                        });
                        dfd.resolve();
                    }, 0);

                break;

                case "wms":
                    var wms_layer = this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
                        url : layer.url,
                        layers: layer.wmsLayers,
                        parameters: {
                          format: 'image/png',
                          transparent: true,
                        }
                    }));
                    wms_layer.id = layer.id;
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
                    this.viewer.imageryLayers._layers.forEach(ilayer => {
                        if (ilayer.id == layer.id)
                            this.viewer.imageryLayers.remove(ilayer);
                    });
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
            var dfd = jQuery.Deferred();
            setTimeout(() => {
                this.viewer.entities.values.forEach((entity) => {
                    var included;
                    if (group.filterResult) included = group.filterResult.filter((f: IFeature) => f.id === entity.feature.id).length > 0;
                    if (included)
                        entity.show = true;
                    else
                        entity.show = false;

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
            var dfd = jQuery.Deferred();

            setTimeout(() => {
                var toRemove = [];
                this.viewer.entities.values.forEach((entity) => {
                    features.forEach(feature => {
                      if (entity.feature.id === feature.id) {
                          entity.show(false);
                          //toRemove.push(entity);
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

        public updateFeature(feature : IFeature)
        {
            this.viewer.entities.values.forEach(entity => {
                if (entity.feature.id === feature.id)
                    this.updateEntity(entity, feature);
            });
        }

        private updateEntity(entity, feature: IFeature)
        {
            var height = feature.properties['mediaan_hoogte'] === undefined ?  feature.effectiveStyle.height : feature.properties['mediaan_hoogte'];

            if (feature.fType.style.iconUri !== undefined && entity.billboard !== undefined)
            {
                entity.billboard.width = feature.effectiveStyle.iconWidth;
                entity.billboard.height = feature.effectiveStyle.iconHeight;
            }

            switch (feature.geometry.type.toUpperCase())
            {
                case "POINT":
                case "MULTIPOINT":
                    entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]);
                    entity.point.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]);
                    entity.point.color = Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor);
                    entity.point.outlineColor = Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor);
                    entity.point.outlineWidth = feature.effectiveStyle.strokeWidth;
                break;

                case "POLYGON":
                case "MULTIPOLYGON":
                    entity.polygon.material = Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor);
                    entity.polygon.outlineColor = Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor);
                    entity.polygon.outlineWidth = feature.effectiveStyle.strokeWidth; // does not do anything on windows webGL: http://stackoverflow.com/questions/25394677/how-do-you-change-the-width-on-an-ellipseoutlinegeometry-in-cesium-map/25405483#25405483
                    entity.polygon.extrudedHeight = height;
                break;

                case "LINESTRING":
                case "MULTILINESTRING":
                    entity.polyline.material = Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor);
                    entity.polyline.width = feature.effectiveStyle.strokeWidth;
                break;

                default:
                    alert('unknown geometry type: ' + feature.geometry.type);
                break;
            }
        }

        public addFeature(feature: IFeature)
        {
            var entity = this.createFeature(feature);
        }

        public createFeature(feature: IFeature) {
            var entity = this.viewer.entities.getOrCreateEntity(feature.id);

            // link the feature to the entity for CommonSense.selectFeature
            entity.feature = feature;

            if (feature.properties['Name'] !== undefined)
                entity.name = feature.properties['Name'];

            // override for buildings from Top10NL
            var height = feature.properties['mediaan_hoogte'] === undefined ?  feature.effectiveStyle.height : feature.properties['mediaan_hoogte'];

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

            switch (feature.geometry.type.toUpperCase())
            {
                case "POINT":
                    // if there is no icon, a PointGraphics object is used as a fallback mechanism
                    entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]);

                    entity.point = {
                        pixelSize : pixelSize,
                        position : Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]),
                        color : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                        outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                        outlineWidth : feature.effectiveStyle.strokeWidth
                    };
                break;

                case "MULTIPOINT":
                    for (var i = 0; i < feature.geometry.coordinates.length; i++) {
                        var entity_multi = new Cesium.Entity();
                        entity_multi.feature = feature;

                        entity_multi.point = {
                            pixelSize : pixelSize,
                            position : Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[i][0], feature.geometry.coordinates[i][1], feature.geometry.coordinates[i][2]),
                            color : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                            outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                            outlineWidth : feature.effectiveStyle.strokeWidth
                        };

                        this.viewer.entities.add(entity_multi);
                    }
                    this.viewer.entities.remove(entity);
                break;

                case "POLYGON":
                    entity.polygon = new Cesium.PolygonGraphics( {
                          hierarchy : this.createPolygon(feature.geometry.coordinates).hierarchy,
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
                            hierarchy : polygons[i].hierarchy,
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
                    this.viewer.entities.remove(entity);
                break;

                case "LINESTRING":
                    entity.polyline = new Cesium.PolylineGraphics({
                        positions: this.coordinatesArrayToCartesianArray(feature.geometry.coordinates),
                        material : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                        width : feature.effectiveStyle.strokeWidth,
                    })
                break;

                case "MULTILINESTRING":
                    for (var i = 0; i < feature.geometry.coordinates.length; i++) {
                        var entity_multi = new Cesium.Entity();
                        entity_multi.feature = feature;

                        entity.polyline = new Cesium.PolylineGraphics({
                            positions: this.coordinatesArrayToCartesianArray(feature.geometry.coordinates[i]),
                            material : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                            width : feature.effectiveStyle.strokeWidth,
                        });

                        this.viewer.entities.add(entity_multi);
                    }
                    this.viewer.entities.remove(entity);
                break;

                default:
                    alert('unknown geometry type: ' + feature.geometry.type);
                break;
            }

            // add a 3D model if we have one
            if (feature.properties["FeatureTypeId"] === "3Dmodel")
            {
                var modelUri = feature.effectiveStyle.modelUri || feature.properties["modelUri"] || "";
                var modelScale = feature.effectiveStyle.modelScale || feature.properties["modelScale"] || 1;
                var modelMinimumPixelSize = feature.effectiveStyle.modelMinimumPixelSize || feature.properties["modelMinimumPixelSize"] || 32;

                entity.model = new Cesium.ModelGraphics({
                    uri : modelUri,
                    scale: modelScale,
                    minimumPixelSize: modelMinimumPixelSize,
                });

                // Hide icon and point when we have a 3D model
                if (entity.billboard !== undefined) entity.billboard.show = false;
                if (entity.point !== undefined) entity.point.show = false;                
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

            var polygon = new Cesium.PolygonGraphics();
            var holes = [];
            for (var i = 1, len = coordinates.length; i < len; i++)
                holes.push(new Cesium.PolygonHierarchy(this.coordinatesArrayToCartesianArray(coordinates[i])));

            var positions = this.coordinatesArrayToCartesianArray(coordinates[0]);

            polygon.hierarchy = new Cesium.PolygonHierarchy(positions, holes);

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

        private coordinatesArrayToCartesianArray(coordinates) {
            var positions = new Array(coordinates.length);
            for (var i = 0; i < coordinates.length; i++)
                positions[i] = this.defaultCrsFunction(coordinates[i]);

            return positions;
        }

        private defaultCrsFunction(coordinates) {
            return Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1], coordinates[2]);
        }
    }
}
