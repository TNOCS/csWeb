module Presentation {
    /** Config */
    var moduleName = 'csComp';

    /** Module */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /** Directive to send a message to a REST endpoint. Similar in goal to the Chrome plugin POSTMAN. */
    myModule.directive('presentation', [function (): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/Presentation/PresentationWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: PresentationWidgetCtrl
        };
    }
    ]);

    export interface IPresentationWidgetScope extends ng.IScope {
        vm: PresentationWidgetCtrl;
        data: PresentationData;
    }

    export interface PresentationData {
        selectedLayerId: string;
    }

    /** Describes a feature's slide information property */
    export interface ISlide {
        /** Reference to feature that holds the _slide property. */
        featureId?: string;
        /** For ordering the slides */
        index?: number;
        /** HTML string with the content, including images */
        content?: string;
        /** Bounding box which holds the map view to show */
        boundingBox?: csComp.Services.IBoundingBox;
    }

    /** Collection of slides and layer title */
    export interface IPresentation {
        /** Layer title */
        title: string;
        /** Slides */
        slides: ISlide[];
    }

    /**
     * The presentation widget is inspired by ESRI Storymaps, collects slides from all enabled layers, which you can show one by one.
     * The slides are stored in the GeoJSON, as part of regular features, in the _slide property, which is of type ISlide.
     */
    export class PresentationWidgetCtrl {
        private widget: csComp.Services.IWidget;
        // TODO Do we need this? We are listening to any layer with a presentation tag.
        private selectedLayer: csComp.Services.ProjectLayer;

        /** The index of the active slide */
        private activeSlideIndex: number;
        /** The active/visible slide */
        private activeSlide: ISlide;
        /** The active layer, used as a source for slides */
        private activeLayerId: string;
        /** Are we in edit mode */
        private isEditing = false;

        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            'presentationService'
        ];

        constructor(
            private $scope: IPresentationWidgetScope,
            private layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private presentationService: PresentationService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            this.widget = par.widget;

            if (!this.widget) this.widget = { id: 'rightPanel' };

            // $scope.data = <PresentationData>this.widget.data;

            // let selectedLayerId = $scope.data.selectedLayerId;
            // this.selectedLayer = layerService.findLayer(selectedLayerId);

            if (!presentationService.activePresentation.hasOwnProperty(this.widget.id)) {
                this.activePresentation = <IPresentation>{};
            } else {
                this.activeSlideIndex = 0;
                this.updateActiveSlide();
            }

            messageBusService.subscribe('presentation', (title, layerId) => {
                switch (title) {
                    case 'added':
                        if (this.activePresentation && this.activePresentation.slides && this.activePresentation.slides.length > 0) return;
                        this.activeLayerId = layerId;
                        this.activePresentation = presentationService.presentations[layerId];
                        this.activeSlideIndex = 0;
                        this.updateActiveSlide();
                        break;
                    case 'removed':
                        if (this.activeLayerId === layerId) this.activePresentation = null;
                        break;
                }
            });
        }

        /** The active slides from one layer */
        private get activePresentation(): IPresentation {
            return this.presentationService.activePresentation[this.widget.id];
        }
        private set activePresentation(slides: IPresentation) {
            this.presentationService.activePresentation[this.widget.id] = slides;
        }

        private updateActiveSlide() {
            this.activeSlide = {};
            if (!this.activePresentation || !this.activePresentation.slides || this.activePresentation.slides.length === 0) return;
            this.activeSlide = this.activePresentation.slides[this.activeSlideIndex];
            if (!this.activeSlide) return;
            if (this.activeSlide.boundingBox) {
                this.layerService.activeMapRenderer.fitBounds(this.activeSlide.boundingBox);
            }
        }

        private selectSlide(index: number) {
            if (index >= this.activePresentation.slides.length) return;
            this.activeSlideIndex = index;
            this.updateActiveSlide();
        }

        private get isFirstSlide() { return !this.activePresentation || !this.activePresentation.slides || this.activeSlideIndex === 0; }

        private get isLastSlide() { return !this.activePresentation || !this.activePresentation.slides || this.activeSlideIndex === this.activePresentation.slides.length - 1; }

        private isActiveSlide(index: number) { return this.activeSlideIndex === index; }

        private nextSlide() {
            if (this.isLastSlide) return;
            this.activeSlideIndex++;
            this.updateActiveSlide();
        }

        private previousSlide() {
            if (this.isFirstSlide) return;
            this.activeSlideIndex--;
            this.updateActiveSlide();
        }

        private get isFirstPresentation() { return this.presentationService.isFirstPresentation(this.activePresentation); }

        private get isLastPresentation() { return this.presentationService.isLastPresentation(this.activePresentation); }

        private nextPresentation() {
            this.activePresentation = this.presentationService.getNextPrevPresentation(this.activePresentation, true);
            this.activeSlideIndex = 0;
            this.updateActiveSlide();
        }

        private previousPresentation() {
            this.activePresentation = this.presentationService.getNextPrevPresentation(this.activePresentation, false);
            this.activeSlideIndex = 0;
            this.updateActiveSlide();
        }

        private toggleEdit() {
            this.isEditing = !this.isEditing;
            if (this.isEditing) {
                this.layerService.visual.leftPanelVisible = false;
            } else {
                this.save();
            }
        }

        private addSlide() {
            this.activeSlide = <ISlide>{ content: '' };
            this.activeSlideIndex++;
            if (this.activeSlideIndex === this.activePresentation.slides.length) {
                this.activePresentation.slides.push(this.activeSlide);
            } else {
                this.activePresentation.slides.splice(this.activeSlideIndex, 0, this.activeSlide);
            }
            this.reindexSlides();
            this.toggleEdit();
            this.save();
        }

        private reindexSlides() {
            let index = 0;
            this.activePresentation.slides.forEach(s => s.index = index++);
        }

        private deleteSlide() {
            this.messageBusService.confirm('Delete slide?', 'Are you sure you want to delete this slide?', answer => {
                if (!answer) return;
                // Delete slide in feature.
                let featureId = this.activeSlide.featureId;
                var layer = this.layerService.findLayer(this.activeLayerId);
                var feature = this.layerService.findFeature(layer, featureId);
                if (feature.properties.hasOwnProperty('Name') && feature.properties['Name'] !== '_slide') {
                    // Assume that we are dealing with a regular property, so only delete the slide.
                    delete feature.properties['_slide'];
                } else if (layer.data && layer.data.features) {
                    // This feature was created to hold the slide: delete it.
                    let i = layer.data.features.indexOf(feature);
                    layer.data.features.splice(i, 1);
                    this.layerService.removeFeature(feature, true);
                }

                let index = this.activeSlideIndex;
                let slides = this.activePresentation.slides;
                slides.splice(index, 1);
                if (slides.length === 0) {
                    this.toggleEdit();
                    this.save();
                    return;
                }
                if (index >= slides.length) {
                    index--;
                    this.activeSlideIndex = index;
                }
                this.reindexSlides();
                this.updateActiveSlide();
                this.save();
            });
        }

        private saveLocation() {
            this.activeSlide.boundingBox = this.layerService.activeMapRenderer.getExtent();
            this.messageBusService.notify('Location saved', 'The current location has been saved with this slide.');
            this.save();
        }

        private save() {
            var layer = this.layerService.findLayer(this.activeLayerId);
            if (!layer) return;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') this.$scope.$digest();
            this.presentationService.save(layer);
        }
    }
}
