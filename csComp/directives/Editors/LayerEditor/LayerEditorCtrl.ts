module LayerEditor {

    declare var interact;
    declare var L;


    export interface ILayerEditorScope extends ng.IScope {
        vm: LayerEditorCtrl;
        layer : csComp.Services.ProjectLayer;
    }

    export class LayerEditorCtrl {
        private scope: ILayerEditorScope;
        public layer: csComp.Services.ProjectLayer;
        public availabeTypes: { (key: string): csComp.Services.IFeatureType };

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILayerEditorScope,
            private $http: ng.IHttpService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
        ) {
            this.scope = $scope;
            $scope.vm = this;
            if (!this.scope.layer) {
                if ($scope.$parent.hasOwnProperty("b")) {
                    this.layer = $scope.$parent["b"]["_layer"];
                } else if ($scope.$parent.$parent.hasOwnProperty("vm")) this.layer = $scope.$parent.$parent["vm"]["layer"];
            }
            else
            {
                this.layer = this.scope.layer;
            }

            var ft = <csComp.Services.IFeatureType>{};




            // ft.style.drawingMode
        }

        public startDraw(featureType: csComp.Services.IFeatureType, event?) {
            if (event) event.stopPropagation();
            this.$mapService.startDraw(this.layer, featureType);
        }


        public initDrag(key: string, layer: csComp.Services.ProjectLayer) {
            var transformProp;
            var startx, starty;

            var tr = this.$layerService.findResourceByLayer(layer);

            var i = interact('#layerfeaturetype-' + (<any>tr.featureTypes[key])._guid).draggable({

                'onmove': (event) => {

                    var target = event.target;

                    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    // translate the element
                    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

                    // update the posiion attributes
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                },
                'onend': (event) => {

                    console.log('Draggable: ', event);
                    setTimeout(() => {
                        var x = event.clientX;
                        var y = event.clientY;
                        var pos = this.$layerService.activeMapRenderer.getLatLon(x, y);
                        console.log(pos);
                        var f = new csComp.Services.Feature();
                        f.layerId = layer.id;
                        f.geometry = {
                            type: 'Point', coordinates: [pos.lon, pos.lat]
                        };

                        var fid = "new object"
                        if (tr.featureTypes.hasOwnProperty(key)) {
                            var ft = tr.featureTypes[key];
                            if (!ft._isInitialized) {
                                this.$layerService.initFeatureType(ft, tr);
                            }
                            if (_.isArray(ft._propertyTypeData)) {
                                for (var k in ft._propertyTypeData) {
                                    var pt = ft._propertyTypeData[k];
                                    ft._propertyTypeData.forEach((pt: csComp.Services.IPropertyType) => {
                                        f.properties[pt.label] = _.isUndefined(pt.defaultValue) ? "" : pt.defaultValue;
                                    })
                                }
                            }
                            fid = ft.name;
                        }
                        
                        fid += '-'+csComp.Helpers.getGuid();
                        f.properties = { "featureTypeId": key, "Name": fid };
                        
                        layer.data.features.push(f);
                        this.$messageBusService.publish("feature", "dropped", f);
                        this.$layerService.initFeature(f, layer);
                        this.$layerService.activeMapRenderer.addFeature(f);
                        this.$layerService.saveFeature(f);
                        this.$layerService.editFeature(f, true);

                    }, 10);
                    $(event.target).remove();
                }
            }).on('move', (event) => {

                var interaction = event.interaction;

                // if the pointer was moved while being held down
                // and an interaction hasn't started yet
                if (interaction.pointerIsDown && !interaction.interacting() && event.currentTarget.classList.contains('drag-element-source')) {

                    var original = event.target;

                    var pos = { left: 0, top: 0 }; //$(original).offset();

                    // create a clone of the currentTarget element
                    var clone = event.currentTarget.cloneNode(true);

                    // Remove CSS class using JS only (not jQuery or jQLite) - http://stackoverflow.com/a/2155786/4972844
                    clone.className = clone.className.replace(/\bdrag-element-source\b/, '');

                    pos.left = event.clientX - 20; //-interaction.startOffset.left;
                    pos.top = event.clientY - 20; //-interaction.startOffset.top;


                    // update the posiion attributes
                    //  clone.setAttribute('data-x', pos.left);
                    // clone.setAttribute('data-y', pos.top);
                    $(clone).css("left", pos.left);
                    $(clone).css("top", pos.top);
                    $(clone).css("z-index", 1000);
                    // insert the clone to the page
                    // TODO: position the clone appropriately
                    $(document.body).append(clone);

                    // start a drag interaction targeting the clone
                    interaction.start({ name: 'drag' }, event.interactable, clone);

                } else {

                    interaction.start({ name: 'drag' }, event.interactable, event.currentTarget);

                }



            });
        }

        deleteFeaturetype(type: csComp.Services.IFeatureType) {
            this.$messageBusService.confirm('Delete type', 'Are you sure?', (result) => {
                if (result) {
                    var r = this.$layerService.findResourceByLayer(this.layer);
                    if (r) {
                        for (var ft in r.featureTypes) {
                            if (r.featureTypes[ft].id === r.url + "#" + type.id || r.featureTypes[ft].id === type.id) {
                                delete r.featureTypes[ft];
                            }

                        }
                        this.$layerService.saveResource(r);
                        this.$messageBusService.publish('featuretype', 'stopEditing', type);
                    }
                }
            })
        }

        editFeaturetype(type: csComp.Services.IFeatureType) {
            this.$messageBusService.publish('featuretype', 'startEditing', type);
        }


    }


}
