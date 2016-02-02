module csComp.Services {
    export class VectorTileSource extends GeoJsonSource implements ILayerSource {
        static CACHE_SIZE = 99;
        title = 'vectortile';
        layer: ProjectLayer;
        requiresLayer = false;
        tileCount: number = -1;
        /** Store obtained results in the cache, */
        cache: {[key: string]: IGeoJsonFile | IGeoJsonCollection} = {};
        /** The urls that are cached (in order to keep the cache from only growing). */
        cachedUrls: string[] = [];

        public constructor(public service: LayerService, $http: ng.IHttpService) {
            super(service, $http);
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            layer.renderType = 'geojson';
            // Open a layer URL

            layer.isLoading = true;
            layer.data = {};
            layer.data.features = [];
            var zoom = this.service.$mapService.map.getZoom();
            var slippyTiles = csComp.Helpers.GeoExtensions.slippyMapTiles(zoom, this.service.$mapService.map.getBounds());
            this.tileCount = slippyTiles.width * slippyTiles.height;
            for (var x = slippyTiles.left; x <= slippyTiles.right; x++) {
                for (var y = slippyTiles.top; y <= slippyTiles.bottom; y++) {
                    var url = layer.url.replace('{z}/{x}/{y}', `${zoom}/${x}/${y}`);
                    if (this.cache.hasOwnProperty(url)) {
                        this.addFeatures(layer, this.cache[url], true);
                        this.checkIfFinished(layer, callback);
                        continue;
                    }
                    this.$http.get(url)
                        .then(result => {
                            let data: IGeoJsonFile | IGeoJsonCollection;
                            if (result.data.hasOwnProperty('objects')) {
                                if (!(<any>result.data).objects.hasOwnProperty('vectile')) {
                                    // Multiple groups are returned: set the group name as featureTypeId
                                    for (var group in (<any>result.data).objects) {
                                        (<any>result.data).objects[group].geometries.forEach(f => {
                                            f.properties.featureTypeId = group;
                                        });
                                    }
                                }
                                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(result.data);
                            } else {
                                data = <IGeoJsonFile | IGeoJsonCollection>result.data;
                            }
                            this.addToCache(result.config.url, data);
                            this.addFeatures(layer, data);
                            this.checkIfFinished(layer, callback);
                        }, (e) => {
                            console.log('VectorTileSource error: ' + e);
                            this.checkIfFinished(layer, callback);
                        });
                }
            }
        }

        /**
         * Add a received object to the cache, and, if full, delete an old entry.
         */
        private addToCache(url: string, data: IGeoJsonFile | IGeoJsonCollection) {
            this.cache[url] = data;
            this.cachedUrls.push(url);
            if (this.cachedUrls.length < VectorTileSource.CACHE_SIZE) return;
            var oldUrl = this.cachedUrls.pop();
            delete this.cache[oldUrl];
        }

        private checkIfFinished(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.tileCount--;
            if (this.tileCount <= 0) {
                layer.isLoading = false;
                callback(layer);
            }
        }

        addFeatures(layer: ProjectLayer, data: IGeoJsonFile | IGeoJsonCollection, fromCache = false) {
            if (data.hasOwnProperty('features')) {
                var geojson = <IGeoJsonFile>data;
                geojson.features.forEach(f => {
                    if (fromCache) f._isInitialized = false;
                    layer.data.features.push(f);
                    this.service.initFeature(f, layer, false, false);
                });
            } else {
                var col: IGeoJsonCollection = <IGeoJsonCollection>data;
                for (var key in col) {
                    if (!col.hasOwnProperty(key)) continue;
                    col[key].features.forEach(f => {
                        if (fromCache) f._isInitialized = false;
                        f.properties['featureTypeId'] = key;
                        layer.data.features.push(f);
                        this.service.initFeature(f, layer, false, false);
                    });
                }
            }
        }

        removeLayer(layer: ProjectLayer) {
            var projLayer = this.service.findLayer(layer.id);
            if (projLayer) projLayer.enabled = false;
            layer.data.features = {};
            //alert('remove layer');
        }
    }
}
