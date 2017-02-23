module csComp.Services {
    import IFeature = csComp.Services.IFeature;

    export interface IOCDFeature {
        geometry?: { lat: number, lng: number },
        annotations: {
            DMS?: {
                lat: string;
                lng: string;
            },
            MGRS?: string;
            Maidenhead: string;
            Mercator?: {
                x: number;
                y: number;
            };
            OSM?: {
                edit_url: string;
                url: string;
            };
            callingcode: number;
            geohash: string;
            sun?: {
                rise?: {
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    apparent?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    astronomical?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    civil?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    nautical?: number;
                };
                set?: {
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    apparent?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    astronomical?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    civil?: number;
                    /** UNIX timestamp. Multiply by 1000 to get the Javascript Date equivalent. */
                    nautical?: number;
                };
            };
            timezone?: {
                name?: string;
                now_in_dst?: number;
                offset_sec?: number;
                offset_string?: number;
                short_name?: string;
            };
            what3words?: {
                words?: string;
            };
        };
        bounds: {
            southwest: { lat: number; lng: number };
            northeast: { lat: number; lng: number };
        };
        components?: {
            city?: string;
            city_district?: string;
            country?: string;
            country_code?: string;
            county?: string;
            postcode?: string;
            road?: string;
            house_number?: string;
            state?: string;
            state_district?: string;
            neighbourhood?: string;
            suburb?: string;
            pedestrian?: string;
        };
        confidence: number;
        formatted: string;
    }

    /**
     * Describes the returned BING search result:
     * https://geocoder.opencagedata.com/api#forward
     */
    export interface IOCDSearchResult {
        type?: string;
        results?: IOCDFeature[];
    }

    export class OpenCageDataSearchAction extends BasicActionService {
        private messageBus: MessageBusService;
        private isReady = true;
        private debouncedFn: Function;
        private queryUrl: string;
        public id = 'OpenCageDataSearchAction';
        public searchCache: { [query: string]: IOCDSearchResult } = {};

        /**
         * @param  {string} apiKey: route to the search api (optional, followed by a |), and the Bing maps key (required)
         */
        constructor(
            private $http: angular.IHttpService,
            public apiKey: string,
            public searchUrl: string = 'https://api.opencagedata.com/geocode/v1/geojson',
            private data: {
                /** ISO Country code, e.g. "nl" */
                culture?: string,
                /** ISO language code, e.g. nl-NL */
                language?: string,
                /** This value will restrict the possible results to the supplied region (min long, min lat, max long, max lat). */
                bounds?: string,
                messageBus: MessageBusService
            }) {
            super();

            this.queryUrl = this.searchUrl
                + `?pretty=1&no_dedupe=1&limit=10&key=${this.apiKey}`
                + (this.data.bounds ? `&bounds=${this.data.bounds}` : '')
                + (this.data.culture ? `&countrycode=${this.data.culture}` : '&nl')
                + (this.data.language ? `&language=${this.data.language}` : '&nl-NL');

            this.debouncedFn = _.debounce((query, result) => this.ocdRestRequest(query, result), 2500);

            this.messageBus = data.messageBus;
            this.messageBus.subscribe('geocoding', (action: string, point: L.LatLng) => {
                if (action.toLowerCase() !== 'reverselookup') { return; }
                this.reverseGeocodeLookup(point);
            });
        }

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        /** Perform a reverse geocode query for the current point and publish the results. */
        private reverseGeocodeLookup(point: L.LatLng) {
            var geocodeRequest = `${this.queryUrl}&q=${point.lat},${point.lng}`;

            this.$http.get(geocodeRequest)
                .then((res: { data: IOCDSearchResult }) => {
                    let r = res.data;
                    if (!r.results || r.results.length === 0) return;
                    this.messageBus.publish('geocoding', 'reverseLookupResult', r.results[0]);
                })
                .catch((error) => {
                    console.log(error);
                });
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            if (query.query.length < 4) return;
            this.debouncedFn(query, result);
        }

        /** Create the geocode request uri and call it using JSONP. */
        private ocdRestRequest(query: ISearchQuery, handler: SearchResultHandler) {
            if (this.searchCache.hasOwnProperty(query.query)) {
                this.geocodeCallback(this.searchCache[query.query], handler, query.query);
                return;
            }
            var geocodeRequest = `${this.queryUrl}&q=${encodeURIComponent(query.query)}`;

            this.callRestService(geocodeRequest, (result, handler, query) => this.geocodeCallback(result, handler, query), handler, query.query);
        }

        /** JSONP callback wrapper */
        private callRestService(request: string, callback: (result: IOCDSearchResult, handler: SearchResultHandler, query: string) => void, handler: SearchResultHandler, query: string) {
            this.$http.jsonp(request)
                .then((res: { data: IOCDSearchResult }) => {
                    let r = res.data;
                    callback(r, handler, query);
                })
                .catch((error) => {
                    alert(error);
                });
        }

        private geocodeCallback(result: IOCDSearchResult, handler: SearchResultHandler, query: string) {
            console.log('Open cache location search result:');
            console.log(JSON.stringify(result, null, 2));
            this.searchCache[query] = result;
            var searchResults: ISearchResultItem[] = [];
            result.results.forEach(f => {
                searchResults.push(<ISearchResultItem>{
                    title: f.formatted,
                    type: f.annotations ? `${f.annotations.DMS.lat}, ${f.annotations.DMS.lng}` : '',
                    service: this.id,
                    description: f.annotations && f.annotations.what3words ? f.annotations.what3words.words : '',
                    score: f.confidence / 10,
                    icon: 'bower_components/csweb/dist-bower/images/large-marker.png',
                    click: () => this.onSelect(f),
                    location: {
                        type: 'Point',
                        coordinates: [f.geometry.lng, f.geometry.lat]
                    }
                });
            });
            handler(null, searchResults);
        }

        private swapLatLonInPoint(location: { type: string; coordinates: number[]; }) {
            return {
                type: location.type,
                coordinates: [location.coordinates[1], location.coordinates[0]]
            }
        }

        private onSelect(feature: IOCDFeature) {
            if (feature.bounds) {
                let bounds: L.LatLngBounds = new L.LatLngBounds(feature.bounds.southwest, feature.bounds.northeast);
                this.layerService.map.getMap().fitBounds(bounds);
            } else {
                this.layerService.$mapService.zoomToLocation(new L.LatLng((feature.geometry.lat), (feature.geometry.lng)), 18);
            }
        }
    }
}
