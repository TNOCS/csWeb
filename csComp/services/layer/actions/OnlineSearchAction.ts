module csComp.Services {
    import IFeature = csComp.Services.IFeature;

    /** The online search results should be an array of objects implementing this interface. */
    export interface IOnlineSearchResult {
        title: string;
        description: string;
        /** Location should be a stringified IGeoJsonGeometry object of the location that should be zoomed to */
        location: string;
        /** Score of the search result ranging between [0...1] */
        score: number;
    }

    export class OnlineSearchActions extends BasicActionService {
        private searchUrl: string;
        private isReady = true;
        public id = 'OnlineSearchActions';

        /**
         * @param  {string} searchUrl: route to the search api
         */
        constructor(private $http: angular.IHttpService, searchUrl: string) {
            super();
            this.searchUrl = searchUrl;
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            var r: ISearchResultItem[] = [];

            this.getHits(query.query, 10, (searchResults: IOnlineSearchResult[]) => {
                searchResults.forEach((sr: IOnlineSearchResult) => {
                    r.push(<ISearchResultItem>{
                        title: sr.title,
                        description: sr.description,
                        icon: 'bower_components/csweb/dist-bower/images/large-marker.png',
                        service: this.id,
                        location: JSON.parse(sr.location),
                        score: (sr.description == 'Gemeente') ? 0.99 : 0.98,
                        click: () => this.onSelect(sr)
                    });
                });
                result(null, r);
            });
        }

        /**
         * Get the features based on the entered text.
         */
        private getHits(text: string, resultCount = 10, cb: Function) {
            if (!this.isReady || text === null || text.length < 2) {
                cb([]);
                return;
            }
            var searchWords = text.toLowerCase().split(' ');
            var sqlSearch = searchWords.join(' & ');
            var searchObject = { query: sqlSearch, nrItems: resultCount };

            var searchResults: ISearchResultItem[] = [];

            $.ajax({
                type: 'POST',
                url: this.searchUrl,
                data: JSON.stringify(searchObject),
                contentType: 'application/json',
                dataType: 'json',
                statusCode: {
                    200: (data) => {
                        console.log('Received online search result');
                        if (data.hasOwnProperty('result')) {
                            searchResults = data.result;
                        }
                        cb(searchResults);
                    },
                    404: (data) => {
                        console.log('Could not get online search result');
                        cb(searchResults);
                    }
                },
                error: () => {
                    console.log('Error getting online search results');
                    cb(searchResults);
                }
            });
        }


        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        public onSelect(selectedItem: IOnlineSearchResult) {
            var geoLoc: IGeoJsonGeometry;
            if (typeof selectedItem.location === 'string') {
                try {
                    geoLoc = JSON.parse(<any>selectedItem.location);
                } catch (error) {
                    console.log(error);
                }
            }
            if (geoLoc && geoLoc.hasOwnProperty('coordinates') && geoLoc.hasOwnProperty('type')) {
                switch (geoLoc.type) {
                    case 'Point':
                        this.layerService.$mapService.zoomToLocation(new L.LatLng(geoLoc.coordinates[1], geoLoc.coordinates[0]), 19);
                        break;
                    case 'MultiPolygon':
                    case 'Polygon':
                    default:
                        this.layerService.map.getMap().fitBounds(L.geoJson(geoLoc).getBounds());
                        this.layerService.map.getMap().setZoom(14);
                        break;
                }
            }
        }

        private selectFeatureById(layerId: string, featureIndex: number) {

        }

        public selectFeature(feature: IFeature) {

        }
    }

}
