module csComp.Services {
    import IFeature = csComp.Services.IFeature;

    export interface IEsriFeature {
        address?: string,
        location?: { x: number, y: number, z: number },
        score?: number,
        attributes?: any
    }

    export interface IEsriSearchResult {
        spatialReference?: any;
        candidates?: IEsriFeature[];
    }

    export class EsriBagSearchAction extends BasicActionService {
        private isReady = true;
        private debouncedFn: Function;
        private queryUrl: string;
        public id = 'EsriBagSearchAction';
        public searchCache: { [query: string]: IEsriSearchResult } = {};

        /**
         * @param  {string} apiKey: route to the search api (optional, followed by a |), and the Bing maps key (required)
         */
        constructor(
            private $http: angular.IHttpService,
            public apiKey: string,
            public searchUrl: string = 'https://services.arcgisonline.nl/arcgis/rest/services/Geocoder_BAG/GeocodeServer/findAddressCandidates',
            private data: {}) {
            super();

            this.queryUrl = this.searchUrl+ `?f=pjson`;

            this.debouncedFn = _.debounce((query, result) => this.esriRestRequest(query, result), 1000);
        }

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            if (query.query.length < 3) return;
            this.debouncedFn(query, result);
        }

        /** Create the geocode request uri and call it using JSONP. */
        private esriRestRequest(query: ISearchQuery, handler: SearchResultHandler) {
            if (this.searchCache.hasOwnProperty(query.query)) {
                this.geocodeCallback(this.searchCache[query.query], handler, query.query);
                return;
            }
            var geocodeRequest = `${this.queryUrl}&SingleLine=${encodeURIComponent(query.query)}`;

            this.callRestService(geocodeRequest, (result, handler, query) => this.geocodeCallback(result, handler, query), handler, query.query);
        }

        /** JSONP callback wrapper */
        private callRestService(request: string, callback: (result: IEsriSearchResult, handler: SearchResultHandler, query: string) => void, handler: SearchResultHandler, query: string) {
            this.$http.get(request)
                .success((r: IEsriSearchResult) => {
                    callback(r, handler, query);
                })
                .error((data, status, error, thing) => {
                    console.log('Error contacting Esri')
                });
        }

        private geocodeCallback(result: IEsriSearchResult, handler: SearchResultHandler, query: string) {
            this.searchCache[query] = result;
            var searchResults: ISearchResultItem[] = [];
            result.candidates.forEach(f => {
                searchResults.push(<ISearchResultItem>{
                    title: f.address,
                    type: 'BAG',
                    service: this.id,
                    description: '',//f.annotations && f.annotations.what3words ? f.annotations.what3words.words : '',
                    score: (f.score / 101),
                    icon: 'bower_components/csweb/dist-bower/images/large-marker.png',
                    click: () => this.onSelect(f),
                    location: {
                        type: 'Point',
                        coordinates: [f.location.x, f.location.y]
                    }
                });
            });
            handler(null, searchResults);
        }

        private convertRD(location: { x: number, y: number, z: number }) {
            var res = csComp.Helpers.GeoExtensions.convertRDToWGS84(location.x, location.y);
            return {
                type: 'Point',
                coordinates: [res.latitude, res.longitude]
            }
        }

        private onSelect(feature: IEsriFeature) {
            this.layerService.$mapService.zoomToLocation(new L.LatLng((feature.location.y), (feature.location.x)), 16);
        }
    }
}
