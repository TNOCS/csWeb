module csComp.Services {
    export class CesiumRenderer implements IMapRenderer {
        title     = 'cesium';
        service:  LayerService;
        viewer:   any;
        camera:   any;
        scene:    any;
        handler:  any;
        features: { [key: string]: any } = {};
        private popup: any;
        private popupShownFor: IFeature;
        public init(service: LayerService) {
            this.service = service;
        }

        public enable(baseLayer?: BaseLayer) {
            Utils.loadJsCssfile('js/Cesium.js', FileType.Js, (e) => {
                var imageProvider;
                if (baseLayer) {
                    imageProvider = this.createImageLayerProvider(baseLayer);
                }

                this.viewer = new Cesium.Viewer('map', {
                    selectionIndicator:   false,
                    infoBox:              false,
                    scene3DOnly:          true,
                    sceneModePicker:      false,
                    fullscreenButton:     false,
                    homeButton:           false,
                    baseLayerPicker:      false,
                    animation:            false,
                    timeline:             false,
                    geocoder:             false,
                    navigationHelpButton: false,
                    imageryProvider:      imageProvider
                });

                this.setTerrainProvider(baseLayer);
                this.camera = this.viewer.camera;
                this.scene  = this.viewer.scene;

                // dit staat uit vanwege de nadelen dat dit heeft op scientific visualisatie (kleuren afhankelijk van perspectief, schaduw als het ergens nacht is)
                // this.scene.globe.enableLighting = false;

                // Only depth test when we are dealing with our own terrain (https://cesiumjs.org/Cesium/Build/Documentation/Globe.html)
                this.scene.globe.depthTestAgainstTerrain = typeof baseLayer.cesium_tileUrl !== 'undefined';

                setTimeout(() => {
                    for (var i = 0; i < this.service.project.features.length; ++i)
                        this.addFeature(this.service.project.features[i]);
                }, 0);

                // onclick events
                this.setUpMouseHandlers();
                this.fitBounds(this.service.$mapService.maxBounds);
            });
        }

        public getLatLon(x: number, y: number): { lat: number, lon: number } {
            return { lat: 53, lon: 5 };
        }

        public refreshLayer() { return; }

        public getExtent(): csComp.Services.IBoundingBox {
            var r = <IBoundingBox>{};
            return r;
        }

        public getZoom() {
            // we dont get nearby relations for now
            return 0;
        }

        public fitBounds(bounds: csComp.Services.IBoundingBox) {
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            if (bounds) {
                var west   = Cesium.Math.toRadians(bounds.southWest[1]);
                var south  = Cesium.Math.toRadians(bounds.southWest[0]);
                var east   = Cesium.Math.toRadians(bounds.northEast[1]);
                var north  = Cesium.Math.toRadians(bounds.northEast[0]);

                var extent = new Cesium.Rectangle(west, south, east, north);
                this.camera.setView({ destination: extent });
            }
        }

        public setUpMouseHandlers() {
            this.handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
            this.handler.setInputAction((click) => {
                var pickedObject = this.scene.pick(click.position);
                if (pickedObject !== undefined && pickedObject.id !== undefined && pickedObject.id.feature !== undefined) {
                    this.service.selectFeature(pickedObject.id.feature);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            this.handler.setInputAction((click) => {

                var pickedObject = this.scene.pick(click.position);
                if (pickedObject !== undefined && pickedObject.id !== undefined && pickedObject.id.feature !== undefined) {
                    var feature = pickedObject.id.feature;
                    this.service._activeContextMenu = this.service.getActions(feature, ActionType.Context);

                    //e.stopPropagation();
                    var button: any = $("#map-contextmenu-button");
                    var menu: any = $("#map-contextmenu");
                    button.dropdown('toggle');
                    // var mapSize = this.map.getSize();
                    menu.css("left", click.position.x + 5);
                    menu.css("top", click.position.y - 35);
                    if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }

                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

            this.handler.setInputAction((movement) => {
                var pickedObject = this.scene.pick(movement.endPosition);

                if (pickedObject !== undefined && pickedObject.id !== undefined && pickedObject.id.feature !== undefined) {
                    this.showFeatureTooltip(pickedObject.id.feature, movement.endPosition);
                } else {
                    this.popupShownFor = undefined;
                    $('.cesiumPopup').fadeOut('fast').remove();
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

        public disable() {
            this.handler.destroy();
            this.viewer.destroy();
        }

        public changeBaseLayer(layer: BaseLayer) {
            if (!layer.cesium_url) {
                alert('This layer is not cesium compatible');
            } else {
                this.scene.imageryLayers.removeAll(); // optional
                var mapProvider = this.createImageLayerProvider(layer);
                this.viewer.imageryLayers.addImageryProvider(mapProvider);
            }
        }

        /** Specify the terrain provider to use, if any. */
        private setTerrainProvider(baseLayer: BaseLayer) {
            if (baseLayer.cesium_tileUrl) {
                this.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
                    url:                  baseLayer.cesium_tileUrl,
                    requestWaterMask:     false,
                    requestVertexNormals: true
                });
            }
        }

        /** Create the background image type provider. */
        private createImageLayerProvider(layer: BaseLayer) {
            var mapProvider;
            switch (layer.cesium_maptype.toUpperCase()) {
                case 'ARCGIS':
                    mapProvider = new Cesium.ArcGisMapServerImageryProvider({
                        url: layer.cesium_url,
                        minimumLevel: layer.minZoom,
                        maximumLevel: layer.maxNativeZoom || layer.maxZoom
                    });
                    break;

                case 'OPENSTREETMAP':
                    mapProvider = new Cesium.createOpenStreetMapImageryProvider({
                        url: layer.cesium_url,
                        minimumLevel: layer.minZoom,
                        maximumLevel: layer.maxNativeZoom || layer.maxZoom
                    });
                    break;

                case 'WEBMAPTILE':
                    mapProvider = new Cesium.WebMapTileServiceImageryProvider({
                        url: layer.cesium_url,
                        minimumLevel: layer.minZoom,
                        maximumLevel: layer.maxNativeZoom || layer.maxZoom
                    });
                    break;

                case 'TILEMAP':
                    mapProvider = new Cesium.TileMapServiceImageryProvider({
                        url: layer.cesium_url,
                        minimumLevel: layer.minZoom,
                        maximumLevel: layer.maxNativeZoom || layer.maxZoom
                    });
                    break;

                default:
                    alert('unknown maptype: ' + layer.cesium_maptype);
                    break;
            }
            return mapProvider;
        }

        public showFeatureTooltip(feature: IFeature, endPosition) {
            if (this.popupShownFor !== undefined && feature.id === this.popupShownFor.id)
            {
                var widthInPixels = $('.cesiumPopup').find('table').width();
                var heightInPixels = $('.cesiumPopup').find('table').height();

                $('.cesiumPopup').css({ position: 'absolute', top: endPosition.y - heightInPixels - 30, left: endPosition.x - widthInPixels / 2 - 30, width: widthInPixels })
            }
            else
            {
                var layer = feature.layer;
                var group = layer.group;
                // var feature = <Feature>layer.feature;
                // add title
                var title = feature.properties['Name'];
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
                            content += '<tr><td><div class="fa fa-filter makeNarrow"></td><td>' + f.title + '</td><td>' + value + '</td></tr>';
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
                            content += '<tr><td><div class="fa fa-paint-brush makeNarrow"></td><td>' + s.title + '</td><td>' + value + '</td></tr>';
                        }
                    });
                }
                var widthInPixels = Math.max(Math.min(rowLength * 7 + 15, 250), 130);
                content = '<table style="width:' + widthInPixels + 'px;">' + content + '</table>';

                // cesium does not have a popup class like leaflet does, so we create our own div with absolute position
                if ($('.cesiumPopup').length == 0)
                    $('body').append('<div class="cesiumPopup featureTooltip"></div>');

                $('.cesiumPopup').html(content);

                var heightInPixels = $('.cesiumPopup').find('table').height();
                $('.cesiumPopup').css({ position: 'absolute', top: endPosition.y - heightInPixels - 30, left: endPosition.x - widthInPixels / 2 - 30, width: widthInPixels });
            }

            this.popupShownFor = feature;
        }

        public addLayer(layer: ProjectLayer) {
            // console.log(layer);
            var dfd = jQuery.Deferred();

            switch (layer.renderType) {
                case 'geojson':

                    setTimeout(() => {
                        if (layer.id.substr(0,7) === "effects")
                        {
                            this.createInstancedLayer(layer);
                        } else {
                            // console.time('render features');
                            layer.data.features.forEach((f: IFeature) => {
                                this.addFeature(f);
                            });
                        }
                        // this.createLayer(layer);
                        // console.timeEnd('render features');
                        dfd.resolve();
                    }, 0);
                break;

                case 'wms':
                    var wms_layer = this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
                        url: layer.url,
                        layers: layer.wmsLayers,
                        parameters: {
                            format: 'image/png',
                            transparent: true
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
        public removeInstancedLayer(layer: ProjectLayer)
        {
            this.scene.primitives.forEach((primitive) => {
                primitive.show = false;
            });
        }

        public createInstancedLayer(layer: ProjectLayer)
        {
            var effStyle: IFeatureTypeStyle;

            // find the min, max of all properties in the pointcloud
            var numUniformX = 0;
            var numUniformY = 0;
            var numUniformZ = 0;
            var minNumUniformX = 999999;
            var minNumUniformY = 999999;
            var minNumUniformZ = 999999;
            var maxConcentration = 0;

            var minLon = 9999, minLat = 9999, minHeight = 9999;
            var maxLon = -9999, maxLat = -9999, maxHeight = -9999;
            console.log('loading layer with ' + layer.data.features.length + ' features');
            layer.data.features.forEach((feature: IFeature) => {
                numUniformX = Math.max(numUniformX, feature.properties['uniform_lon']);
                numUniformY = Math.max(numUniformY, feature.properties['uniform_lat']);
                numUniformZ = Math.max(numUniformZ, feature.properties['uniform_z']);
                minNumUniformX = Math.min(minNumUniformX, feature.properties['uniform_lon']);
                minNumUniformY = Math.min(minNumUniformY, feature.properties['uniform_lat']);
                minNumUniformZ = Math.min(minNumUniformZ, feature.properties['uniform_z']);

                minLon = Math.min(minLon, feature.geometry.coordinates[0]);
                minLat = Math.min(minLat, feature.geometry.coordinates[1]);
                minHeight = Math.min(minHeight, feature.geometry.coordinates[2]);
                maxLon = Math.max(maxLon, feature.geometry.coordinates[0]);
                maxLat = Math.max(maxLat, feature.geometry.coordinates[1]);
                maxHeight = Math.max(maxHeight, feature.geometry.coordinates[2]);

                maxConcentration = Math.max(maxConcentration, feature.properties['v']);

                // create feature: disabled because of performance and duplicate rendering
                // this.updateFeature(feature);
            });

            var height = (numUniformZ-minNumUniformZ+1) > 1 ? (numUniformZ-minNumUniformZ+1) : 1;
            var width = (numUniformX-minNumUniformX+1) > 1 ? (numUniformX-minNumUniformX+1) : 1;
            var length = (numUniformY-minNumUniformY+1) > 1 ? (numUniformY-minNumUniformY+1) : 1;

            // create an unsigned byte array in order to support linear interpolation on the GPU in webGL
            var pointcloud = new Uint8Array(length * width * height);

            var position_min = new Cesium.Cartesian3.fromDegrees(minLon, minLat, minHeight);
            var position_max = new Cesium.Cartesian3.fromDegrees(maxLon, maxLat, maxHeight);

            layer.data.features.forEach((feature: IFeature) => {
                var x = feature.properties['uniform_lon'];
                var y = feature.properties['uniform_lat'];
                var z = feature.properties['uniform_z'];
                pointcloud[((z-minNumUniformZ) * width * length) + ((y) * width) + (x)] = (feature.properties['v'] / maxConcentration) * 256;
            });

            // this is to trick Cesium into loading the texture directly from the Float32Array
            var source:any = new Object();
            source.arrayBufferView = pointcloud;

            // Create a texture with 1 channel in order to store the luminance, which is normalized because it is clipped between 0 and 1
            var tex = new Cesium.Texture({
                context : this.scene.context,
                width : width,
                height : length * height,
                pixelFormat : Cesium.PixelFormat.LUMINANCE,
                pixelDatatype : Cesium.PixelDatatype.UNSIGNED_BYTE,
                source: source,
                sampler: new Cesium.Sampler({
                    wrapS : Cesium.TextureWrap.CLAMP_TO_EDGE,
                    wrapT : Cesium.TextureWrap.CLAMP_TO_EDGE,
                    minificationFilter : Cesium.TextureMinificationFilter.LINEAR,
                    magnificationFilter : Cesium.TextureMagnificationFilter.LINEAR
                })
            });

            var shader_source = `
#define FACE_FORWARD
struct Ray {
    vec3 Origin;
    vec3 Dir;
};

struct AABB {
    vec3 Min;
    vec3 Max;
};

bool IntersectBox(Ray r, AABB aabb, out float t0, out float t1)
{
    vec3 invR = 1.0 / r.Dir;
    vec3 tbot = invR * (aabb.Min-r.Origin);
    vec3 ttop = invR * (aabb.Max-r.Origin);
    vec3 tmin = min(ttop, tbot);
    vec3 tmax = max(ttop, tbot);
    vec2 t = max(tmin.xx, tmin.yz);
    t0 = max(t.x, t.y);
    t = min(tmax.xx, tmax.yz);
    t1 = min(t.x, t.y);
    return t0 <= t1;
}

float getDensity(sampler2D sampler, vec3 position, float size)
{
    if (size > 1.0)
    {
        float sliceSize = 1.0 / size;
        float slicePixelSize = sliceSize / size;              // space of 1 pixel
        float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels
        float zSlice0 = min(floor(position.z * size), size - 1.0);
        float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
        float xOffset = slicePixelSize * 0.5 + position.x * sliceInnerSize;
        float s0 = xOffset + (zSlice0 * sliceSize);
        float s1 = xOffset + (zSlice1 * sliceSize);
        float slice0Color = texture2D(sampler, vec2(position.y, s0)).r / 256.0;
        float slice1Color = texture2D(sampler, vec2(position.y, s1)).r / 256.0;
        float zOffset = mod(position.z * size, 1.0);
        return mix(slice0Color, slice1Color, zOffset);
    }
    vec2 textureCoords = vec2(position.y, (position.x / size));
    return texture2D(sampler, textureCoords).r / 256.0;
}

czm_material czm_getMaterial(czm_materialInput materialInput)
{
    // set up the material for the return type cesium needs
    czm_material m = czm_getDefaultMaterial(materialInput);
    m.emission = vec3(0.0, 0.0, 0.0);

    //raycasting lighting properties
    vec3 LightIntensity = vec3(10.0);
    float Absorption = 15.0 * pc_height;

    // Bounding Box coordinates in World Coordinates
    vec3 minPosition = position_min;
    vec3 maxPosition = position_max;

    //convert to a local Fixed Frame
    minPosition = (fixedFrameTransformation * vec4(minPosition, 1.0)).xyz;
    maxPosition = (fixedFrameTransformation * vec4(maxPosition, 1.0)).xyz;

    //compute the center for the light
    vec3 center = (minPosition + maxPosition) / 2.0;
    vec3 LightPosition = center;

    // raycast sampling properties
    float maxDist = distance(minPosition, maxPosition);
    const int numSamples = 1536;
    float stepSize = maxDist/float(numSamples);
    const int numLightSamples = 32;
    float lscale = maxDist / float(numLightSamples);

    // Camera in World Coordinates (even though MC = WC because czm_model = czm_inverseModel = I)
    vec3 rayOrigin = czm_encodedCameraPositionMCHigh + czm_encodedCameraPositionMCLow;
    vec3 rayDirection = (czm_inverseView * vec4((-(materialInput.positionToEyeEC)), 0.0)).xyz;

    // convert to a local Fixed Frame
    rayOrigin = (fixedFrameTransformation * vec4(rayOrigin, 1.0)).xyz;
    rayDirection = (fixedFrameTransformation * vec4(rayDirection, 0.0)).xyz;

    // box intersection
    Ray eye = Ray(rayOrigin, normalize(rayDirection));
    AABB aabb = AABB(minPosition, maxPosition);

    float tnear, tfar;
    bool hit = IntersectBox(eye, aabb, tnear, tfar);
    if (tnear < 0.0) tnear = 0.0;

    vec3 rayStart = eye.Origin + eye.Dir * tnear;
    vec3 rayStop = eye.Origin + eye.Dir * tfar;

    // Transform from object space to texture coordinate space:
    rayStart = (rayStart - minPosition) / (maxPosition - minPosition);
    rayStop = (rayStop - minPosition) / (maxPosition - minPosition);

    // Perform the ray marching:
    vec3 pos = rayStart;
    vec3 step = normalize(rayStop-rayStart) * stepSize;
    float travel = distance(rayStop, rayStart);
    float T = 1.0;
    vec3 Lo = vec3(0.0);

    for (int i=0; i < numSamples; ++i) {
        // webgl does not allow us to put this in the for loop guard
        if (travel <= 0.0) break;

        float density = getDensity(pointcloud, pos, pc_height);

        if (density <= 0.0)
            continue;

        T *= 1.0-density*stepSize*Absorption;
        if (T <= 0.01)
            break;

        vec3 lightDir = normalize(LightPosition-pos)*lscale;
        float Tl = 1.0;
        vec3 lpos = pos + lightDir;

        for (int s=0; s < numLightSamples; ++s) {
            float ld = getDensity(pointcloud, lpos, pc_height);

            Tl *= 1.0-Absorption*stepSize*ld;
            if (Tl <= 0.01)
            lpos += lightDir;
        }

        vec3 Li = LightIntensity*Tl;
        Lo += Li*T*density*stepSize;

        pos += step;
        travel -= stepSize;
    }

    m.diffuse = vec3(1.0 - Lo.x, 0.0, 0.0);
    m.alpha = 1.0-T;

    return m;
}

`;

            var polygon = new Cesium.PolygonGeometry({
                polygonHierarchy : new Cesium.PolygonHierarchy(
                    Cesium.Cartesian3.fromDegreesArray([
                        minLon, minLat,
                        minLon, maxLat,
                        maxLon, maxLat,
                        maxLon, minLat
                    ])
                ),
                height: minNumUniformX,
                extrudedHeight: numUniformZ
            });

            var fixedFrameTransformationMatrix = Cesium.Transforms.northEastDownToFixedFrame(position_min, Cesium.Ellipsoid.WGS84, new Cesium.Matrix4());
            var inverseFixedFrameTransformationMatrix = Cesium.Matrix4.inverse(fixedFrameTransformationMatrix, new Cesium.Matrix4());
            var fixedFrameTransformationArray = Cesium.Matrix4.toArray(inverseFixedFrameTransformationMatrix);

            var geometry = Cesium.PolygonGeometry.createGeometry(polygon);
            var instance = new Cesium.Primitive({
                asynchronous: false,
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: geometry
                }),
                appearance : new Cesium.MaterialAppearance({
                    closed: true,
                    material : new Cesium.Material({
                        fabric : {
                            uniforms : {
                                pointcloud:                 tex,
                                pc_height:                  height,
                                position_min:               position_min,
                                position_max:               position_max,
                                fixedFrameTransformation:   fixedFrameTransformationArray
                            },
                            source : shader_source
                        }
                    })

                })
            });

            this.scene.primitives.add(instance);
        }

        // /** Create the layer using geometry instances. */
        // public createLayer(layer: ProjectLayer) {
        //     var featureHeight: number,
        //         heightAboveSea: number,
        //         effStyle: IFeatureTypeStyle;

        //     /** Hold all geometry instances */
        //     var instances = [];

        //     layer.data.features.forEach((feature: IFeature) => {
        //         switch (feature.geometry.type.toUpperCase()) {
        //             case 'POLYGON':
        //                 featureHeight  = this.getFeatureHeight(feature);
        //                 heightAboveSea = this.getHeightAboveSeaLevel(feature);
        //                 effStyle       = feature.effectiveStyle;
        //                 var instance = new Cesium.GeometryInstance({
        //                     id: feature.id,
        //                     attributes: {
        //                         color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({alpha : 0.5}))
        //                         //Cesium.Color.fromCssColorString(effStyle.fillColor).withAlpha(effStyle.fillOpacity)
        //                         // "value": {
        //                         //     "0": 133,
        //                         //     "1": 31,
        //                         //     "2": 165,
        //                         //     "3": 128
        //                         // }
        //                     },
        //                     geometry : new Cesium.PolygonGeometry(heightAboveSea
        //                     ? {
        //                         polygonHierarchy: this.createPolygon(feature.geometry.coordinates).hierarchy._value,
        //                         vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        //                         heightAboveSea: false,
        //                         extrudedHeight: heightAboveSea + featureHeight,
        //                         height: heightAboveSea
        //                     }
        //                     : {
        //                         polygonHierarchy: this.createPolygon(feature.geometry.coordinates).hierarchy._value,
        //                         vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        //                         heightAboveSea: true,
        //                         extrudedHeight: featureHeight
        //                     })
        //                 });
        //                 instances.push(instance);
        //                 break;
        //             default:
        //                 console.log('Skipping feature: ' + feature);
        //                 break;
        //         }
        //     });
        //     this.viewer.scene.primitives.add(new Cesium.Primitive({
        //         geometryInstances: instances,
        //         appearance: new Cesium.PerInstanceColorAppearance()
        //         // appearance: new Cesium.EllipsoidSurfaceAppearance({
        //         //     material : Cesium.Material.fromType('Dot')
        //         // })
        //     }));
        // }

        public removeLayer(layer: ProjectLayer) {
            var dfd = jQuery.Deferred();
            switch (layer.renderType.toUpperCase()) {
                case 'GEOJSON':
                case 'EDITABLEGEOJSON':
                case 'DYNAMICGEOJSON':
                case 'TOPOJSON':
                    setTimeout(() => {
                        if (layer.id.substr(0,7) === "effects")
                        {
                            this.removeInstancedLayer(layer);
                        } else {
                            if (!layer.data || !layer.data.features) return dfd.resolve();
                            this.removeFeatures(layer.data.features);
                        }
                        dfd.resolve();
                    }, 0);
                    break;

                case 'WMS':
                    this.viewer.imageryLayers._layers.forEach(ilayer => {
                        if (ilayer.id === layer.id)
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

        public updateMapFilter(group: ProjectGroup) {
            var dfd = jQuery.Deferred();
            setTimeout(() => {

                this.viewer.entities.values.forEach((entity) => {
                    entity.show = false;
                });

                group.filterResult.forEach((feature) => {
                    feature.entities.forEach((entity) => {
                        entity.show = true;
                    });
                })

                dfd.resolve();
            }, 0);
            return dfd.promise();
        }

        public addGroup(group: ProjectGroup) {
            console.log('addGroup called');
        }

        public removeGroup(group: ProjectGroup) {
            console.log('removeGroup called');
        }

        public removeFeature(feature: IFeature) {
            //console.log('removeFeature called');
            var toRemove = [];
            if (feature.entities === undefined) return;

            feature.entities.forEach((entity) => {
                //entity.show = false;
                toRemove.push(entity);
            });

            toRemove.forEach(entity => {
                this.viewer.entities.remove(entity);
            });
        }

        public removeFeatures(features: IFeature[]) {
            var dfd = jQuery.Deferred();

            setTimeout(() => {
                var toRemove = [];

                features.forEach(feature => {
                    feature.entities.forEach((entity) => {
                        entity.show = false;
                        //toRemove.push(entity);
                    });
                });

                toRemove.forEach(entity => {
                    this.viewer.entities.remove(entity);
                });
                dfd.resolve();
            }, 0);

            return dfd.promise();
        }

        public updateFeature(feature: IFeature) {
            if (feature.entities === undefined)
                this.addFeature(feature);
            else
                this.updateEntityStyle(feature.entities[0], feature);
        }

        /**
         * The feature height is either set in a property as defined in the style (heightProperty), or in a style. Otherwise, it is 0.
         * In either case, the effective style is calculated in LayerService.calculateFeatureStyle.
         */
        private getFeatureHeight(feature: IFeature) {
            return feature.effectiveStyle.height || feature.properties['mediaan_hoogte'] || 0;
        }

        private getHeightAboveSeaLevel(feature: IFeature) {
            return feature.effectiveStyle.heightAboveSeaProperty && feature.properties.hasOwnProperty(feature.effectiveStyle.heightAboveSeaProperty)
                ? feature.properties[feature.effectiveStyle.heightAboveSeaProperty]
                : undefined;
        }

        private updateEntityStyle(entity, feature: IFeature) {
            var pixelSize = 5;
            var style     = feature.fType.style;
            var effStyle  = feature.effectiveStyle;
            var fillColor = feature.effectiveStyle.height > 0 ? Cesium.Color.fromCssColorString(effStyle.fillColor) : Cesium.Color.fromCssColorString(effStyle.fillColor).withAlpha(effStyle.fillOpacity);
            var featureHeight, heightAboveSea: number;

            switch (entity.geometrytype.toUpperCase()) {
                case 'POINT':
                    if (typeof feature.effectiveStyle.iconUri !== 'undefined' && !feature.effectiveStyle.modelUri) {
                        // a billboard is an icon for a feature
                        entity.billboard = {
                            image:  style.iconUri,
                            width:  effStyle.iconWidth,
                            height: effStyle.iconHeight
                        };
                        // we draw this point very large because it serves as a background for the billboards
                        pixelSize = 35;


                    }

                    // if there is no icon, a PointGraphics object is used as a fallback mechanism
                    let position = Cesium.Cartesian3.fromDegrees(
                        feature.geometry.coordinates[0],
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[2] || this.getHeightAboveSeaLevel(feature));

                    entity.point = {
                        pixelSize: pixelSize,
                        color: fillColor,
                        outlineColor: Cesium.Color.fromCssColorString(effStyle.strokeColor),
                        outlineWidth: effStyle.strokeWidth
                    };

                    entity.position = position;

                    break;

                case 'MULTIPOINT':
                    for (var i = 0; i < feature.geometry.coordinates.length; i++) {
                        var entity_multi = this.getOrCreateEntity(feature, i+1);

                        entity_multi.point = {
                            pixelSize: pixelSize,
                            position: Cesium.Cartesian3.fromDegrees(
                                feature.geometry.coordinates[i][0],
                                feature.geometry.coordinates[i][1],
                                feature.geometry.coordinates[i][2] || this.getHeightAboveSeaLevel(feature)),
                            color: fillColor,
                            outlineColor: Cesium.Color.fromCssColorString(effStyle.strokeColor),
                            outlineWidth: effStyle.strokeWidth
                        };
                    }
                    break;

                case 'POLYGON':
                    featureHeight  = this.getFeatureHeight(feature);
                    heightAboveSea = this.getHeightAboveSeaLevel(feature);
                    entity.polygon = new Cesium.PolygonGraphics({
                        hierarchy:    this.createPolygon(feature.geometry.coordinates).hierarchy,
                        material:     fillColor,
                        outline:      false
                    });

                    if (heightAboveSea) {
                        entity.polygon.perPositionHeight = false;
                        entity.polygon.extrudedHeight    = heightAboveSea + featureHeight;
                        entity.polygon.height            = heightAboveSea;
                    } else {
                        entity.polygon.perPositionHeight = false;
                        entity.polygon.extrudedHeight    = featureHeight;
                    }

                    var entity_outline = this.getOrCreateEntity(feature, 1);

                    var outline_positions = feature.geometry.coordinates[0];
                    if (entity.polygon.extrudedHeight !== undefined)
                        for (var i = 0; i < outline_positions.length; ++i)
                            outline_positions[i][2] = heightAboveSea ? heightAboveSea + featureHeight : featureHeight;

                    entity_outline.polyline = {
                            positions : this.coordinatesArrayToCartesianArray(outline_positions),
                            width : effStyle.strokeWidth,
                            material : Cesium.Color.fromCssColorString(effStyle.strokeColor)
                    };

                break;

                case 'MULTIPOLYGON':
                    featureHeight = this.getFeatureHeight(feature);
                    heightAboveSea = this.getHeightAboveSeaLevel(feature);
                    var polygons = this.createMultiPolygon(feature.geometry.coordinates);

                    for (var i = 0; i < polygons.length; ++i) {
                        var entity_multi = this.getOrCreateEntity(feature, i*2+1);

                        entity_multi.polygon = new Cesium.PolygonGraphics({
                            hierarchy:    polygons[i].hierarchy,
                            material:     fillColor,
                            outline:      false
                        });

                        if (heightAboveSea) {
                            entity_multi.polygon.perPositionHeight = false;
                            entity_multi.polygon.extrudedHeight    = heightAboveSea + featureHeight;
                            entity_multi.polygon.height            = heightAboveSea;
                        } else {
                            entity_multi.polygon.perPositionHeight = false;
                            entity_multi.polygon.extrudedHeight    = featureHeight;
                        }

                        var entity_multi_outline = this.getOrCreateEntity(feature, i*2+2);

                        var outline_positions = feature.geometry.coordinates[i][0];

                        if (entity_multi.polygon.extrudedHeight !== undefined)
                            for (var j = 0; j < outline_positions.length; ++j)
                                outline_positions[j][2] = heightAboveSea ? heightAboveSea + featureHeight : featureHeight;

                        // add a seperate outline
                        entity_multi_outline.polyline = {
                                positions : this.coordinatesArrayToCartesianArray(outline_positions),
                                width : effStyle.strokeWidth,
                                material : Cesium.Color.fromCssColorString(effStyle.strokeColor)
                        }
                    }

                break;

                case 'LINESTRING':
                    entity.polyline = new Cesium.PolylineGraphics({
                        positions: this.coordinatesArrayToCartesianArray(feature.geometry.coordinates),
                        material: fillColor,
                        width: effStyle.strokeWidth
                    });
                break;

                case 'MULTILINESTRING':
                    for (var i = 0; i < feature.geometry.coordinates.length; i++) {
                        var entity = this.getOrCreateEntity(feature, i+1);

                        entity.polyline = new Cesium.PolylineGraphics({
                            positions: this.coordinatesArrayToCartesianArray(feature.geometry.coordinates[i]),
                            material: fillColor,
                            width: effStyle.strokeWidth
                        });
                    }
                break;

                default:
                    alert('unknown geometry type: ' + feature.geometry.type);
                break;
            }

            // add a 3D model if we have one
            if (effStyle.modelUri) {
                entity.model = new Cesium.ModelGraphics({
                    uri:              `/models/${effStyle.modelUri}`,
                    scale:            effStyle.modelScale || 1,
                    minimumPixelSize: effStyle.modelMinimumPixelSize || 32
                });

                // Hide icon and point when we have a 3D model
                if (entity.billboard !== undefined) entity.billboard.show = false;
                if (entity.point !== undefined) entity.point.show = false;
            }

            //account for rotation
            if (effStyle.rotate) {
                var headingQuaternion = Cesium
                    .Transforms
                    .headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0],
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[2]),
                    Cesium.Math.toRadians(effStyle.rotate), 0, 0);
                entity.orientation = headingQuaternion;
            }

        }

        private getOrCreateEntity(feature, index)
        {
            var entity;
            if (feature.entities[index] === undefined)
            {
                entity = new Cesium.Entity();
                entity.feature = feature;
                feature.entities[index] = entity;
                this.viewer.entities.add(entity);
            } else {
                entity = feature.entities[index];
            }
            return entity;
        }

        public addFeature(feature: IFeature) {
            var entity = this.createFeature(feature);
        }

        public selectFeature(feature: IFeature) {
            // TODO
            console.log('CesiumRenderer warning: selectFeature is not implemented!');
        }

        public createFeature(feature: IFeature) {
            var featureHeight, heightAboveSea: number;

            var entity = this.viewer.entities.getOrCreateEntity(feature.id);

            // save a list of entity references to the feature for updating / deleting later
            if (feature.entities === undefined) feature.entities = [];
            feature.entities[0] = entity;

            // link the feature to the entity for CommonSense.selectFeature
            entity.feature = feature;

            //if (feature.properties['Name'] !== undefined
            entity.name = feature.properties['Name'];

            entity.geometrytype = feature.geometry.type;

            this.updateEntityStyle(entity, feature);

            return feature.entities;
        }

        private createPolygon(coordinates) {
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

        private createMultiPolygon(coordinates) {
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
