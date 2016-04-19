module Presentation {
    /** 
     * This service keeps the presentation state, so that when we switch between tabs, 
     * we don't loose any information.
     */
    export class PresentationService {
        /** All slides, from all open layers, grouped by layer id. */
        presentations: { [key: string]: IPresentation } = {};
        /** The active slides for each widget, where each key represents a widget's id. */
        activePresentation: { [key: string]: IPresentation } = {};

        static $inject = [
            '$rootScope',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        constructor(
            private $rootScope:        ng.IRootScopeService,
            private layerService:      csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private dashboardService:  csComp.Services.DashboardService
           ) {
            // this.dashboardService.widgetTypes['presentation'] = <csComp.Services.IWidget>{
            //     id: 'presentation',
            //     icon: 'images/politie_zwart.png',
            //     description: 'Show presentation widget.'
            // };

            // var ppt = csComp.Helpers.createRightPanelTab(
            //     'containers', 'presentation', null, 'Presentation', '{{"PowerPoint view" | translate}}', 'images/politie_zwart.png', false, false);
            // messageBusService.publish('rightpanel', 'activate', ppt);

            messageBusService.subscribe('layer', (title: string, layer: csComp.Services.ProjectLayer) => {
                if (layer && !layer.tags || (layer.tags && layer.tags.indexOf('presentation') < 0)) return;
                switch (title) {
                    case 'activated':
                        this.addSlidesFromLayer(layer);
                        break;
                    case 'deactivate':
                        this.removeSlidesFromLayer(layer);
                        break;
                }
            });
        }

        /** Initialize the layer by creating an initial presentation */
        private createPresentation(layer: csComp.Services.ProjectLayer) {
            if (this.presentations.hasOwnProperty(layer.id)) return;
            var presentation: IPresentation = <IPresentation>{
                title: layer.title,
                slides: []
            };
            this.presentations[layer.id] = presentation;
            return presentation;
        }

        /** Add the slides from the project layer */
        private addSlidesFromLayer(layer: csComp.Services.ProjectLayer) {
            this.removeSlidesFromLayer(layer); // remove any old ones - shouldn't be there though
            var presentation: IPresentation = this.createPresentation(layer);
            var features: csComp.Services.Feature[] = csComp.Services.ProjectLayer.getFeatures(layer);
            if (features && features.length) {
                // TODO REMOVE
                // presentation.slides.push({ index: 1, content: `<h1>Huidige status</h1><br><ul><li>Drukte: 80%</li><li>Incidenten: ...</li><li>...</li></ul>` });
                // presentation.slides.push({ index: 2, content: `<h1>Huidige status</h1><br><ul><li>Punt 1</li><li>Punt 2</li><li>Punt 3</li></ul>` });
                // presentation.slides.push({ index: 3, content: `<h1>Verwachting</h1><br><ul><li>Drukte: ...</li><li>Punt 2</li><li>Punt 3</li></ul>` });
                features.forEach(f => {
                    if (!f.properties.hasOwnProperty('_slide')) return;
                    let slide = <ISlide> f.properties['_slide'];
                    slide.featureId = f.id;
                    presentation.slides.push(slide);
                });
                presentation.slides.sort((s1, s2) => { return s1.index - s2.index; });
            }
            this.messageBusService.publish('presentation', 'added', layer.id);
        }

        /** Remove the slides from the project layer */
        private removeSlidesFromLayer(layer: csComp.Services.ProjectLayer) {
            if (!this.presentations.hasOwnProperty(layer.id)) return;
            // if (this.slides[layer.id] === this.activeSlides) this.activeSlides = null;
            delete this.presentations[layer.id];
            this.messageBusService.publish('presentation', 'removed', layer.id);
            // if (this.activeSlides || Object.keys(this.slides).length === 0) {
            //     this.activeSlide = null;
            //     return;
            // }
            // this.activeSlides = this.slides[Object.keys(this.slides)[0]];
            // this.activeSlideIndex = 0;
            // this.updateActiveSlide();
        }

        /** Update all slides in the layer */
        save(layer: csComp.Services.ProjectLayer) {
            if (!this.presentations.hasOwnProperty(layer.id)) return;
            var presentation = this.presentations[layer.id];
            presentation.slides.forEach(slide => {
                let feature = this.layerService.findFeature(layer, slide.featureId);
                if (feature) {
                    feature.properties['_slide'] = slide;
                    this.layerService.saveFeature(feature);
                } else {
                    // create new feature
                    let f = new csComp.Services.Feature();
                    f.id = slide.featureId = csComp.Helpers.getGuid();
                    f.properties = {};
                    f.properties['_slide'] = slide;
                    this.layerService.createFeature(f, layer);
                }
            });
        }

        isFirstPresentation(presentation: IPresentation) {
            return Object.keys(this.presentations).length === 0 || presentation === this.presentations[Object.keys(this.presentations)[0]];
        }

        isLastPresentation(presentation: IPresentation)  {
            return Object.keys(this.presentations).length === 0 || presentation === this.presentations[Object.keys(this.presentations)[Object.keys(this.presentations).length - 1]]; 
        }

        /** Get the next or the previous presentation, if any */
        getNextPrevPresentation(activeSlides: IPresentation, isNext: boolean) {
            let isFound = false;
            let lastKey: string;
            for (var key in this.presentations) {
                if (!this.presentations.hasOwnProperty(key)) continue;
                if (isFound) return this.presentations[key];
                if (this.presentations[key] === activeSlides) {
                    if (!isNext) return this.presentations[lastKey];
                    isFound = true;
                }
                lastKey = key;
            }
            return this.presentations[lastKey];
        }

    }

     /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    (<ng.IModule>myModule).service('presentationService', Presentation.PresentationService);
}