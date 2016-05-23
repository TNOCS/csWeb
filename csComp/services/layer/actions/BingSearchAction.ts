module csComp.Services {
    import IFeature = csComp.Services.IFeature;

    /**
     * Describes the returned BING search result:
     * https://msdn.microsoft.com/en-us/library/ff701726.aspx
     */
    export interface IBingSearchResult {
        authenticationResultCode?: string;
        brandLogoUri?: string;
        copyright?: string;
        resourceSets?: [ {
            estimatedTotal?: number;
            resources?: IBingSearchResource[];
        }];
        statusCode: number;
        statusDescription?: string;
        traceId?: string;
    }

    export interface IBingSearchResource {
        __type: string;
        /**
         * A bounding box is defined by two latitudes and two longitudes that represent the four sides of a
         * rectangular area on the Earth. Use the following syntax to specify a bounding box.
         * South Latitude, West Longitude, North Latitude, East Longitude
         */
        bbox?: number[];
        name?: string;
        /** The coordinates are double values that are separated by commas and are specified in the following order. */
        point?: {
            type: string; // e.g. Point
            /** Coordinate of point in lat, lon */
            coordinates: number[];
        };
        /**
         * An address can contain the following fields: address line, locality, neighborhood, admin district,
         * admin district 2, formatted address, postal code and country or region. For descriptions see the
         */
        address?: {
            /** A string specifying the name of the landmark when there is a landmark associated with an address. */
            landmark?: string;
            /**
             * The official street line of an address relative to the area, as specified by the Locality,
             * or PostalCode, properties. Typical use of this element would be to provide a street
             * address or any official address.
             */
            addressLine?: string;
            /**
             * A string specifying the subdivision name in the country or region for an address. This
             * element is typically treated as the first order administrative subdivision, but in some
             * cases it is the second, third, or fourth order subdivision in a country, dependency, or region.
             */
            adminDistrict?: string;
            /**
             * A string specifying the subdivision name in the country or region for an address. This element
             * is used when there is another level of subdivision information for a location, such as the county.
             */
            adminDistrict2?: string;
            /** A string specifying the country or region name of an address. */
            countryRegion?: string;
            /**
             * A string specifying the two-letter ISO country code.
             * You must specify include=ciso2 in your request to return this ISO country code.
             */
            countryRegionIso2?: string;
            /** A string specifying the complete address. This address may not include the country or region. */
            formattedAddress?: string;
            /**
             * A string specifying the populated place for the address. This typically refers to a city,
             * but may refer to a suburb or a neighborhood in certain countries.
             */
            locality?: string;
            /** A string specifying the post code, postal code, or ZIP Code of an address. */
            postalCode?: string;
            /**
             * A string specifying the neighborhood for an address.
             * You must specify includeNeighborhood=1 in your request to return the neighborhood.
             */
            neighborhood?: string;
        },
        confidence?: string;
        entityType?: string; // e.g. Address
        geocodePoints?: [ {
            type: string; // e.g. Point
            coordinates: number[]; // lat, lon
            calculationMethod: string; // e.g. Rooftop
            usageTypes: string[]; // e.g. Route
        }];
        matchCodes?: string[];
    }

    export class BingSearchAction extends BasicActionService {
        private isReady = true;
        private debouncedFn: Function;
        public id = 'BingSearchActions';
        public searchCache: { [query: string]: IBingSearchResult } = {};

        /**
         * @param  {string} apiKey: route to the search api (optional, followed by a |), and the Bing maps key (required)
         */
        constructor(
            private $http: angular.IHttpService,
            public apiKey: string,
            public searchUrl: string = 'http://dev.virtualearth.net/REST/v1/Locations',
            public data: { culture?: string; userLocation?: string; } = {
                culture: 'nl',
                userLocation: '52.077857,4.316639'
            }) {
            super();

            this.debouncedFn =_.debounce((query, result) => this.bingRestRequest(query, result), 2500);
        }

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            if (query.query.length < 4) return;
            this.debouncedFn(query, result);
        }

        /** Create the geocode request uri and call it using JSONP. */
        private bingRestRequest(query: ISearchQuery, handler: SearchResultHandler) {
            if (this.searchCache.hasOwnProperty(query.query)) {
                this.geocodeCallback(this.searchCache[query.query], handler, query.query);
                return;
            }
            var geocodeRequest = `${this.searchUrl}?query=`
                + encodeURIComponent(query.query)
                + `&culture=${this.data.culture}&userLocation=${this.data.userLocation}&maxResults=10&jsonp=JSON_CALLBACK&key=${this.apiKey}`;

            this.callRestService(geocodeRequest, (result, handler, query) => this.geocodeCallback(result, handler, query), handler, query.query);
        }

        /** JSONP callback wrapper */
        private callRestService(request: string, callback: (result: IBingSearchResult, handler: SearchResultHandler, query: string) => void, handler: SearchResultHandler, query: string){
            this.$http.jsonp(request)
                .success((r: IBingSearchResult) => {
                    callback(r, handler, query);
                })
                .error((data, status, error, thing) => {
                    alert(error);
                });
        }

        private geocodeCallback(result: IBingSearchResult, handler: SearchResultHandler, query: string) {
            console.log('BING location search result:');
            console.log(JSON.stringify( result, null, 2));
            this.searchCache[query] = result;
            var searchResults: ISearchResultItem[] = [];
            result.resourceSets.forEach(rs => {
                rs.resources.forEach((r: IBingSearchResource) => {
                    searchResults.push(<ISearchResultItem>{
                        type: r.entityType,
                        description: r.entityType,
                        title: r.name,
                        score: r.confidence === 'High' ? 1 : 0.3,
                        icon: result.brandLogoUri,
                        service: this.id,
                        click: () => this.onSelect(r),
                        location: this.swapLatLonInPoint(r.point)
                    });
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

        private onSelect(selectedItem: IBingSearchResource) {
            var geoLoc: IGeoJsonGeometry = selectedItem.point;
            if (selectedItem.bbox) {
                this.layerService.map.getMap().fitBounds( new L.LatLngBounds( selectedItem.bbox.slice(0, 2), selectedItem.bbox.slice(2, 4)));
            } else {
                this.layerService.$mapService.zoomToLocation(new L.LatLng( geoLoc.coordinates[1], geoLoc.coordinates[0]), 19);
            }
        }
    }
}
