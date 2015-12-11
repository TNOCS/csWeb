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
        feature? : IFeature;
        description? : string;
        title: string;
        score? : number;
        icon? : string;
        service : string;
        click : Function;
    }
    
    export declare type SearchResultHandler = (error : Error,result: ISearchResultItem[]) => void;
    
    export interface ISearchQuery{
        query : string;
        results : ISearchResultItem[];
    }

    export interface IActionService {
        id: string;
        init(ls: LayerService);
        stop();
        addFeature(feature: IFeature);
        removeFeature(feature: IFeature);
        selectFeature(feature: IFeature);
        getFeatureActions(feature: IFeature): IActionOption[];
        getFeatureHoverActions(feature: IFeature): IActionOption[];
        deselectFeature(feature: IFeature);
        updateFeature(feuture: IFeature);
        search?(query : ISearchQuery, result : SearchResultHandler);        
    }
    
    export class BasicActionService implements csComp.Services.IActionService {
        public id; //: string = 'LayerActions';
        public layerService: csComp.Services.LayerService

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }

        getFeatureActions(feature: IFeature): IActionOption[] {
         return [];
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }
        
        search(query : ISearchQuery, result : Function)
        {
            result(null,[]);
        }

        public init(layerService: csComp.Services.LayerService) {        
            this.layerService = layerService;
        }        
    } 

    export class LayerActions extends BasicActionService {
        public id: string = 'LayerActions';
                
        getFeatureActions(feature: IFeature): IActionOption[] {
            if (feature.layer.isDynamic) {
                var setFilterActionOption = <IActionOption>{
                    title: "Edit"
                };
                setFilterActionOption.callback = this.setAsFilter;
                return [setFilterActionOption];
            }
            else { return []; }
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }
        
        private setAsFilter(feature: IFeature, layerService: csComp.Services.LayerService) {
            layerService.editFeature(feature);
        }
        
        public search(query : ISearchQuery, result : SearchResultHandler)
        {            
            var r : ISearchResultItem[]= [];
            var temp = [];
            this.layerService.project.features.forEach(f=>{
                
                    var title = csComp.Helpers.getFeatureTitle(f);
                    
                     if (title)
                     {
                        var score = title.toString().score(query.query, null);
                        temp.push({score : score, feature : f, title : title});                                 
                     }
            });
            temp.sort((a, b) => { return b.score - a.score; }).forEach((rs)=>{
                if (r.length<20)
                {
                    var f = <IFeature>rs.feature;
                    var res =<ISearchResultItem>{ title : rs.title, description : f.layer.title, feature : f, score : rs.score, icon: 'data/projects/smartcycling/buurt.png', service : this.id, click : ()=>{                            
                            this.layerService.$mapService.zoomTo(f);
                            this.layerService.selectFeature(f); } } 
                        //if (f.fType && f.fType.name!=="default") res.description += " (" + f.fType.name + ")";
                        r.push(res);
                }
            })                          
            result(null,r);
        }

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);            
        }

    }
    
    

}
