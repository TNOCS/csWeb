module csComp.Services {
    'use strict';

    import IFeature = csComp.Services.IFeature;

    export enum ActionType {
        Context = 0,
        Hover = 1
    }

    export interface IActionOption {
        title: string;
        icon: string;
        feature: IFeature;
        callback: Function;
    }

    export interface ISearchResultItem {
        type?: string;
        feature?: IFeature;
        description?: string;
        title: string;
        score?: number;
        icon?: string;
        service: string;
        click: Function;
        location?: IGeoJsonGeometry;
        /** The position the item has in the result, e.g. A, B, or C... */
        searchIndex?: string;
    }

    export declare type SearchResultHandler = (error: Error, result: ISearchResultItem[]) => void;

    export interface ISearchQuery {
        query: string;
        results: ISearchResultItem[];
    }

    export interface IActionService {
        id: string;
        init(ls: LayerService);
        stop();
        addFeature(feature: IFeature);
        addLayer(layer: IProjectLayer);
        removeLayer(layer: IProjectLayer);
        removeFeature(feature: IFeature);
        selectFeature(feature: IFeature);
        getLayerActions(layer: IProjectLayer): IActionOption[];
        getFeatureActions(feature: IFeature): IActionOption[];
        getFeatureHoverActions(feature: IFeature): IActionOption[];
        deselectFeature(feature: IFeature);
        updateFeature(feuture: IFeature);
        search?(query: ISearchQuery, result: SearchResultHandler);
    }

    export class BasicActionService implements csComp.Services.IActionService {
        public id; //: string = 'LayerActions';
        public layerService: csComp.Services.LayerService;

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }


        getLayerActions(layer: IProjectLayer): IActionOption[] {
            return [];
        }

        getFeatureActions(feature: IFeature): IActionOption[] {
            return [];
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        addLayer(layer: IProjectLayer) { }
        removeLayer(layer: IProjectLayer) { }

        updateFeature(feuture: IFeature) { }

        search(query: ISearchQuery, result: Function) {
            result(null, []);
        }

        public init(layerService: csComp.Services.LayerService) {
            this.layerService = layerService;
        }
    }

    export class LayerActions extends BasicActionService {
        public id: string = 'LayerActions';

        addLayer(layer: ProjectLayer) {
            if (layer.fitToMap && layer.layerSource && _.isFunction(layer.layerSource.fitMap)) {
                layer.layerSource.fitMap(layer);
            }
        }

        getLayerActions(layer: ProjectLayer): IActionOption[] {
            if (!layer) return;
            var res = [];

            if (layer.isEditable && this.layerService.$mapService.isExpert && layer.enabled) res.push({
                title: 'Edit Layer', icon: 'pencil', callback: (l, ls) => {
                    this.layerService.$messageBusService.publish('layer', 'startEditing', l);
                }
            });

            if (layer.enabled && layer.layerSource) {
                var refresh = <IActionOption>{ title: 'Refresh Layer', icon: 'refresh' };
                refresh.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                    layer.layerSource.refreshLayer(layer);
                };
                res.push(refresh);

                if (_.isFunction(layer.layerSource.fitMap)) {
                    var fit = <IActionOption>{ title: 'Fit Map', icon: 'map' };
                    fit.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                        layer.layerSource.fitMap(layer);
                    };
                    res.push(fit);
                }

                if (layer.hasSensorData && _.isFunction(layer.layerSource.fitTimeline)) {
                    var fit = <IActionOption>{ title: 'Fit Timeline', icon: 'map' };
                    fit.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                        layer.layerSource.fitTimeline(layer);
                    };
                    res.push(fit);
                }
            }

            if (layer.enabled && layer.isEditable && !layer.isDynamic && layer.layerSource) {
                var reset = <IActionOption>{ title: 'Reset Layer', icon: 'reset' };
                reset.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                    console.log('Resetting layer: ' + layer.title);
                    if (layer.data && layer.data.features) {
                        layer.data.features.forEach((f) => {
                            layer.layerSource.service.removeFeature(f)
                        });
                    }
                    layer.data.features = [];
                    layer.layerSource.refreshLayer(layer);
                };
                res.push(reset);
            }

            if (layer.enabled && layer.isDynamic) {
                var erase = <IActionOption>{ title: 'Clean Layer', icon: 'eraser' };
                erase.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                    console.log('Eraseing features from layer: ' + layer.title);
                    layer.data.features.forEach((f) => {
                        layerService.removeFeature(f);
                    });
                    layer.data.features.length = 0;
                };
                res.push(erase);
            }

            if (this.layerService.$mapService.isAdminExpert) {
                var remove = <IActionOption>{ title: 'Remove Layer', icon: 'trash' };
                remove.callback = (layer: ProjectLayer, layerService: csComp.Services.LayerService) => {
                    layerService.$messageBusService.confirm('Delete layer', 'Are you sure', (result) => {
                        if (result) layerService.removeLayer(layer, true);
                    });
                };
                res.push(remove);
            }
            return res;

        }

        getFeatureActions(feature: IFeature): IActionOption[] {
            var res = [];
            if (feature.timestamps && feature.timestamps.length > 0) {
                var setTimelineZoomActionOption = <IActionOption>{
                    title: 'Zoom on timeline'
                };
                setTimelineZoomActionOption.callback = this.zoomFeatureTimeline;
                res.push(setTimelineZoomActionOption);
            }
            if (feature.layer.isDynamic) {
                var setFilterActionOption = <IActionOption>{
                    title: 'Edit'
                };
                setFilterActionOption.callback = this.setAsFilter;
                res.push(setFilterActionOption);

            }
            return res;
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        private zoomFeatureTimeline(feature: IFeature, layerService: csComp.Services.LayerService) {
            var s = new Date(feature.timestamps[0]);
            var e = new Date(feature.timestamps[feature.timestamps.length - 1]);
            layerService.$messageBusService.publish('timeline', 'updateTimerange', { start: s, end: e });
        }

        private setAsFilter(feature: IFeature, layerService: csComp.Services.LayerService) {
            layerService.editFeature(feature);
        }

        public search(query: ISearchQuery, result: SearchResultHandler) {
            const scoreMinThreshold = 0.5;
            var r: ISearchResultItem[] = [];
            var temp = [];
            this.layerService.project.features.forEach(f => {
                var inp = [];
                if (!f._gui.hasOwnProperty('searchString')) {
                    var title = csComp.Helpers.getFeatureTitle(f);
                    inp.push(title);
                    for (var o in f.properties) {
                        inp.push(f.properties[o]);
                    }

                    if (inp.length > 0) {
                        f._gui["searchString"] = inp.join(' ');
                        f._gui["title"] = title;
                    }
                }
                if (f._gui.hasOwnProperty('searchString') && f._gui.hasOwnProperty('title')) {
                    var score;
                    if (query.query.toLowerCase() === f._gui['title'].toLowerCase()) {
                        score = 1;
                    } else {
                        score = f._gui['searchString'].score(query.query, null);
                    }
                    if (score > scoreMinThreshold) temp.push({ score: score, feature: f, title: f._gui['title'] });
                }
            });
        temp.sort((a, b) => { return b.score - a.score; }).forEach((rs) => {
            if (r.length < 10) {
                var f = <IFeature>rs.feature;
                var res = <ISearchResultItem>{
                    title: rs.title,
                    description: f.layer.title,
                    feature: f,
                    score: rs.score,
                    icon: 'bower_components/csweb/dist-bower/images/large-marker.png',
                    service: this.id,
                    click: () => {
                        this.layerService.$mapService.zoomTo(f);
                        this.layerService.selectFeature(f);
                            this.layerService.$messageBusService.publish('search', 'reset');
                            this.layerService.visual.leftPanelVisible = false;
                    }
                };
                //if (f.fType && f.fType.name!=='default') res.description += ' (' + f.fType.name + ')';
                r.push(res);
            }
        });
    result(null, r);
}

        public init(layerService: csComp.Services.LayerService) {
    super.init(layerService);
}
    }
}
