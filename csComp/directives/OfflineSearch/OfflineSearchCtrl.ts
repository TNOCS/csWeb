module OfflineSearch {
    export interface IOfflineSearchScope extends ng.IScope {
        vm: OfflineSearchCtrl;
    }

    export interface ILookupResult {
        title?: string;
        score: number;
        key: string;
        entries: Entry[];
    }

    export class OfflineSearchResultViewModel {
        firstInGroup = false;

        constructor(public title: string, public layerTitle: string, public groupTitle: string, public entry: Entry) { }

        toString() {
            return this.title;
        }

        get fullTitle(): string {
            return this.groupTitle + ' >> ' + this.layerTitle + ' >> ' + this.title;
        }
    }

    export class OfflineSearchCtrl {
        private offlineSearchResult: OfflineSearchResult;
        public searchText: string;
        public isReady = false;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IOfflineSearchScope,
            private $http: ng.IHttpService,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            $messageBus.subscribe('project', (title) => {
                switch (title) {
                    case 'loaded':
                        var offlineSearchResultUrl = $layerService.projectUrl.url.replace('project.json', 'offline_search_result.json');
                        this.loadSearchResults(offlineSearchResultUrl);
                        break;
                }
            });

            $messageBus.subscribe('language', (title: string, language: string) => {
                switch (title) {
                    case 'newLanguage':
                        // TODO switch language!
                        break;
                }
            });
        }

        /**
         * Load the offline search results (json file).
         */
        private loadSearchResults(url: string) {
            this.$http.get(url)
                .success((offlineSearchResult: OfflineSearchResult) => {
                    this.offlineSearchResult = offlineSearchResult;
                    var kwi = offlineSearchResult.keywordIndex;

                    var keywordIndex: KeywordIndex = {};
                    for (var key in kwi) {
                        if (!kwi.hasOwnProperty(key)) continue;
                        kwi[key].forEach((entry: any) => {
                            if (!keywordIndex.hasOwnProperty(key))
                                keywordIndex[key] = [];
                            keywordIndex[key].push(new Entry(entry));
                        });
                    }
                    this.offlineSearchResult.keywordIndex = keywordIndex;
                    this.isReady = true;
                })
                .error(() => { console.log("OfflineSearch: error with $http "); });
        }

        /**
         * Get the locations based on the entered text.
         */
        public getLocation(text: string, resultCount = 15): OfflineSearchResultViewModel[] {
            if (!this.isReady || text === null || text.length < 3) return [];
            var searchWords = text.toLowerCase().split(' ');

            // test if last word in text might be a (part of) a stopword, if so remove it
            var lastSearchTerm = searchWords[searchWords.length-1];
            var possibleStopWords = this.offlineSearchResult.options.stopWords.filter(stopword=>stopword.indexOf(lastSearchTerm) > -1);

            if (possibleStopWords.length > 0) {
              searchWords.splice(searchWords.length - 1, 1);
            }

            // remove all exact stopwords
            this.offlineSearchResult.options.stopWords.forEach(stopWord => {
              while (searchWords.indexOf(stopWord) > -1) {
                searchWords.splice(searchWords.indexOf(stopWord),1);
              }
            });

            var totResults: ILookupResult[];

            for (var j in searchWords) {
                var result = this.getKeywordHits(searchWords[j]);
                totResults = !totResults
                    ? result
                    : this.mergeResults(totResults, result);
            }
            var searchResults: OfflineSearchResultViewModel[] = [];
            var layers = this.offlineSearchResult.layers;
            var count = resultCount;

            var resultIndex = 0;
            while (count > 0 && resultIndex < totResults.length) {
                var r = totResults[resultIndex++];
                var subCount = Math.min(count, r.entries.length);
                for (var i = 0; i < subCount; i++) {
                    var entry = r.entries[i];
                    var layer = layers[entry.layerIndex];
                    count--;
                    searchResults.push(new OfflineSearchResultViewModel(
                        layer.featureNames[entry.featureIndex],
                        layer.title,
                        layer.groupTitle,
                        entry
                        ));
                }
            }
            // Group search results by groupTitle | layerTitle
            var groups: { [group: string]: OfflineSearchResultViewModel[] } = {};
            searchResults.forEach((sr) => {
                var group = sr.groupTitle + ' >> ' + sr.layerTitle;
                if (!groups.hasOwnProperty(group)) groups[group] = [];
                groups[group].push(sr);
            });
            searchResults = [];
            for (var key in groups) {
                if (!groups.hasOwnProperty(key)) continue;
                var firstInGroup = true;
                groups[key].forEach((sr) => {
                    sr.firstInGroup = firstInGroup;
                    searchResults.push(sr);
                    firstInGroup = false;
                });
            }
            return searchResults;
        }

        /**
         * Merge the resuls of two keyword lookups by checking whether different entries refer
         * to the same layer and feature.
         * @result1 {ILookupResult[]}
         * @result2 {ILookupResult[]}
         */
        private mergeResults(result1: ILookupResult[], result2: ILookupResult[]): ILookupResult[] {
            var r: ILookupResult[] = [];
            result1.forEach((r1) => {
                result2.forEach((r2) => {
                    r1.entries.forEach((entry1) => {
                        r2.entries.forEach((entry2) => {
                            if (entry1.layerIndex === entry2.layerIndex && entry1.featureIndex === entry2.featureIndex)
                                r.push({ score: r1.score * r2.score, key: r1.key + ' ' + r2.key, entries: [entry1] });
                        });
                    });
                });
            });
            r = r.sort((a, b) => { return b.score - a.score; });
            return r;
        }

        /**
         * Do a fuzzy keyword comparison between the entered text and the list of keywords,
         * and return a subset.
         * @text: {string}
         */
        private getKeywordHits(text: string) {
            var results: ILookupResult[] = [];
            var keywordIndex = this.offlineSearchResult.keywordIndex;
            var keywords = Object.getOwnPropertyNames(keywordIndex);

            keywords.forEach((key) => {
                var score = key.score(text, null);
                if (score < 0.5) return;
                results.push({ score: score, key: key, entries: keywordIndex[key] })
            });
            results = results.sort((a, b) => { return b.score - a.score; });
            return results;
        }

        /**
         * When an item is selected, optionally open the layer and jump to the selected feature.
         */
        public onSelect(selectedItem: OfflineSearchResultViewModel) {
            var layerIndex = selectedItem.entry.layerIndex;
            var layer = this.offlineSearchResult.layers[layerIndex];
            var projectLayer = this.$layerService.findLayer(layer.id);

            console.log(selectedItem);

            if (!projectLayer) return;

            if (projectLayer.enabled) {
                this.selectFeature(layer.id, selectedItem.entry.featureIndex);
                return;
            } else {
                var handle = this.$messageBus.subscribe('layer', (title: string, layer: csComp.Services.ProjectLayer) => {
                    if (title !== 'activated' || projectLayer.url !== layer.url) return;
                    this.selectFeature(layer.id, selectedItem.entry.featureIndex);
                    this.$messageBus.unsubscribe(handle);
                });
                this.$layerService.addLayer(projectLayer);
            }

            var group:any = $("#layergroup_" + projectLayer.groupId);
            group.collapse("show");
        }

        private selectFeature(layerId: string, featureIndex: number) {
            var feature = this.$layerService.findFeatureByIndex(layerId, featureIndex);
            if (feature == null) return;
            this.$mapService.zoomTo(feature);
            this.$layerService.selectFeature(feature);
        }

    }
}
