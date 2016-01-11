module csComp.Services {
    import IFeature = csComp.Services.IFeature;

    export class KeywordIndex { [key: string]: Entry[] }

    /** Description of the offline search index. */
    export interface OfflineSearchIndex {
        project: {
            title:   string,
            url:     string,
            dynamic: boolean
        };
        options: {
            propertyNames: string[],
            stopWords:     string[]
        };
        layers: [{
            groupTitle:   string,
            index:        number,
            id:           string,
            title:        string,
            path:         string,
            type:         string,
            featureNames: string[]
        }];
        keywordIndex: KeywordIndex;
    }

    /** Result returned when looking something up in the index. */
    export interface ILookupResult {
        title?:  string;
        score:   number;
        key:     string;
        entries: Entry[];
    }

    /** An index entry that contains a search result. */
    export class Entry {
        private v = Array<number>(2);

        constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number, propertyIndex?: number) {
            if (typeof layerIndexOrArray === 'number') {
                this.v[0] = layerIndexOrArray;
                this.v[1] = featureIndex;
            } else {
                this.v = layerIndexOrArray;
            }
        }

        get layerIndex()    { return this.v[0]; }
        get featureIndex()  { return this.v[1]; }
    }

    export class OfflineSearchResult {
        firstInGroup = false;

        constructor(public title: string, public layerTitle: string, public groupTitle: string, public entry: Entry, public score: number) { }

        toString() {
            return this.title;
        }

        get fullTitle(): string {
            return this.groupTitle + ' >> ' + this.layerTitle + ' >> ' + this.title;
        }
    }

    export class OfflineSearchActions extends BasicActionService {
        private offlineSearchResult: OfflineSearchIndex;
        private isReady = true;
        public id = 'OfflineSearchActions';

        /**
         * @param  {string} projectUri: path to the project.json file
         */
        constructor(private $http: angular.IHttpService, projectUri: string) {
            super();
            var offlineSearchResultUri = projectUri.replace('project.json', 'offline_search_result.json');
            this.loadIndex(offlineSearchResultUri);
        }

        /** Load the offline search index from a json file. */
        private loadIndex(url: string) {
            this.$http.get(url)
                .success((offlineSearchResult: OfflineSearchIndex) => {
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
                .error(() => { console.log(`OfflineSearch: error with $http `); });
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            var r: ISearchResultItem[] = [];

            var searchResults = this.getHits(query.query, 15);
            searchResults.sort((a, b) => { return b.score - a.score; }).forEach(sr => {
                r.push(<ISearchResultItem>{
                    title: sr.title,
                    description: `${sr.layerTitle} (${sr.groupTitle})`,
                    score: sr.score,
                    icon: 'bower_components/csweb/dist-bower/images/large-marker.png',
                    service: this.id,
                    click: () => this.onSelect(sr)
                });
            });
            result(null, r);
        }

        /**
         * Get the features based on the entered text.
         */
        private getHits(text: string, resultCount = 15) {
            if (!this.isReady || text === null || text.length < 1) return [];
            var searchWords = text.toLowerCase().split(' ');

            // test if last word in text might be a (part of) a stopword, if so remove it
            // var lastSearchTerm = searchWords[searchWords.length - 1];
            // var possibleStopWords = this.offlineSearchResult.options.stopWords.filter(stopword => stopword.indexOf(lastSearchTerm) > -1);

            // if (possibleStopWords.length > 0) {
            //   searchWords.splice(searchWords.length - 1, 1);
            // }

            // remove all exact stopwords
            // this.offlineSearchResult.options.stopWords.forEach(stopWord => {
            //   while (searchWords.indexOf(stopWord) > -1) {
            //     searchWords.splice(searchWords.indexOf(stopWord), 1);
            //   }
            // });

            var totResults: ILookupResult[];

            for (var j in searchWords) {
                var result = this.getKeywordHits(searchWords[j]);
                totResults = !totResults
                    ? result
                    : this.mergeResults(totResults, result);
            }
            var searchResults: OfflineSearchResult[] = [];
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
                    searchResults.push(new OfflineSearchResult(
                        layer.featureNames[entry.featureIndex],
                        layer.title,
                        layer.groupTitle,
                        entry,
                        r.score
                    ));
                }
            }
            // Group search results by groupTitle | layerTitle
            var groups: { [group: string]: OfflineSearchResult[] } = {};
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
                results.push({ score: score, key: key, entries: keywordIndex[key] });
            });
            results = results.sort((a, b) => { return b.score - a.score; });
            return results;
        }

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        public onSelect(selectedItem: OfflineSearchResult) {
            var layerIndex = selectedItem.entry.layerIndex;
            var layer = this.offlineSearchResult.layers[layerIndex];
            var projectLayer = this.layerService.findLayer(layer.id);

            if (!projectLayer) return;

            if (projectLayer.enabled) {
                this.selectFeatureById(layer.id, selectedItem.entry.featureIndex);
                return;
            } else {
                var handle = this.layerService.$messageBusService.subscribe('layer', (title: string, layer: csComp.Services.ProjectLayer) => {
                    if (title !== 'activated' || projectLayer.url !== layer.url) return;
                    this.selectFeatureById(layer.id, selectedItem.entry.featureIndex);
                    this.layerService.$messageBusService.unsubscribe(handle);
                });
                this.layerService.addLayer(projectLayer);
            }

            var group: any = $('#layergroup_' + projectLayer.groupId);
            group.collapse('show');
        }

        private selectFeatureById(layerId: string, featureIndex: number) {
            var feature = this.layerService.findFeatureByIndex(layerId, featureIndex);
            if (feature == null) return;
            this.layerService.$mapService.zoomTo(feature);
            // Force-select feature, otherwise we might deselect the feature immediately after it was selected.
            this.layerService.selectFeature(feature, false, true);
        }

        public selectFeature(feature: IFeature) {

        }
    }

}