module LayersDirective {

    declare var interact;

    export interface ILayersDirectiveScope extends ng.IScope {
        vm: LayersDirectiveCtrl;
        options: Function;
        layerFilter: string;
    }

    export class LayersDirectiveCtrl {
        private scope: ILayersDirectiveScope;
        private allCollapsed: boolean;
        public editing: boolean;
        public state: string = "layers";
        public layer: csComp.Services.ProjectLayer;
        public project: csComp.Services.Project;
        public directory: csComp.Services.ProjectLayer[];
        public mylayers: string[];
        public selectedLayer: csComp.Services.ProjectLayer;
        public newLayer: csComp.Services.ProjectLayer;
        public layerResourceType: string;
        public resources: { [key: string]: csComp.Services.TypeResource };
        public layerGroup: any;
        public layerTitle: string;
        public newGroup: string;
        public groups: csComp.Services.ProjectGroup[];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            'mapService',
            'dashboardService',
            '$modal', '$http'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILayersDirectiveScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService,
            private $modal: any, private $http: ng.IHttpService) {
            $scope.vm = this;
            $scope.options = ((layer: csComp.Services.ProjectLayer) => {
                if (!layer.enabled) return null;
                if (layer.layerSource) {
                    return layer.layerSource.layerMenuOptions(layer);
                }
            });
            this.allCollapsed = false;
            this.$messageBusService.subscribe('project', (title: string, project: csComp.Services.Project) => {
                if (title !== 'loaded' || !project) return;
                if (project.hasOwnProperty('collapseAllLayers') && project.collapseAllLayers === true) {
                    this.allCollapsed = true;
                } else {
                    this.allCollapsed = false;
                }
            });
        }

        public editGroup(group: csComp.Services.ProjectGroup) {
            var rpt = csComp.Helpers.createRightPanelTab('edit', 'groupedit', group, 'Edit group', 'Edit group');
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
        }

        public editLayer(layer: csComp.Services.ProjectLayer) {
            var rpt = csComp.Helpers.createRightPanelTab('edit', 'layeredit', layer, 'Edit layer', 'Edit layer');
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
        }


        public createType() {
            if (this.layer.typeUrl) {
                if (this.$layerService.typesResources.hasOwnProperty(this.layer.typeUrl)) {
                    var tr = this.$layerService.typesResources[this.layer.typeUrl];
                    var st = <csComp.Services.IFeatureTypeStyle>{
                        drawingMode: 'point',
                        fillColor: 'red'
                    };
                    var nt = <csComp.Services.IFeatureType>{
                        id: 'test', name: 'test', style: st
                    }
                    var id = nt.id;
                    tr.featureTypes[id] = nt;
                    console.log(tr);
                }


            }
        }

        public initGroups() {
            this.groups = [];
            if (this.$layerService.project.groups)
                this.$layerService.project.groups.forEach((g) => this.groups.push(g));
            var g = new csComp.Services.ProjectGroup;
            g.id = "<new>";
            g.title = "<new group>";
            this.groups.push(g);
        }

        public initDrag(key: string, layer: csComp.Services.ProjectLayer) {
            var transformProp;
            var startx, starty;

            var i = interact('#layerfeaturetype-' + key)
                .draggable({
                max: Infinity,
                onstart: (event) => {
                    startx = 0;
                    starty = 0;
                    event.interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
                    event.interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
                },
                onmove: (event) => {
                    event.interaction.x += event.dx;
                    event.interaction.y += event.dy;

                    event.target.style.left = event.interaction.x + 'px';
                    event.target.style.top = event.interaction.y + 'px';
                },
                onend: (event) => {
                    setTimeout(() => {
                        var x = event.clientX;
                        var y = event.clientY;
                        var pos = this.$layerService.activeMapRenderer.getLatLon(x, y - 50);
                        console.log(pos);
                        var f = new csComp.Services.Feature();

                        f.layerId = layer.id;
                        f.geometry = {
                            type: 'Point', coordinates: [pos.lon, pos.lat]
                        };
                        //f.
                        f.properties = { "featureTypeId": key, "Name": key };
                        layer.data.features.push(f);
                        this.$layerService.initFeature(f, layer);
                        this.$layerService.activeMapRenderer.addFeature(f);
                        this.$layerService.saveFeature(f);
                    }, 100);

                    //this.$dashboardService.mainDashboard.widgets.push(widget);
                    event.target.setAttribute('data-x', 0);
                    event.target.setAttribute('data-y', 0);
                    event.target.style.left = '0px';
                    event.target.style.top = '0px';

                    console.log(key);
                }
            })
        }

        public selectProjectLayer(layer: csComp.Services.ProjectLayer) {
            this.selectedLayer = layer;
        }

        public exitDirectory() {
            this.selectedLayer = null;
            this.layerTitle = "";
            this.state = 'layers';
        }

        public addProjectLayer() {
            
            if (this.layerResourceType === "<new>") {
                        this.selectedLayer.typeUrl = "/api/resources/" + this.selectedLayer.title;
                        
                        var r = <csComp.Services.TypeResource>{ id: this.selectedLayer.title, title: this.selectedLayer.title, featureTypes: { }, propertyTypeData: {} };
                        r.featureTypes["default"] = <csComp.Services.IFeatureType>{ name : "default", style : <csComp.Services.IFeatureTypeStyle>{
                            drawingMode : "Point"
                        }}; 
                        this.$layerService.saveResource(r);
                        
                    }
                    else {
                        this.selectedLayer.typeUrl = this.layerResourceType;
                    }
            
            var group;
            if (this.layerGroup == "<new>") {
                group = new csComp.Services.ProjectGroup;
                group.title = this.newGroup;
                this.$layerService.project.groups.push(group);
                this.$layerService.initGroup(group);
            }
            else {
                group = this.$layerService.findGroupById(this.layerGroup);
            }
            
            if (group) {
                this.$layerService.initLayer(group, this.selectedLayer);
                group.layers.push(this.selectedLayer);
            }
            this.selectedLayer = null;
            this.state = "layers";
        }

        public startAddingFeatures(layer: csComp.Services.ProjectLayer) {
            this.state = "editlayer";
            (<csComp.Services.DynamicGeoJsonSource>layer.layerSource).startAddingFeatures(layer);
            this.layer = layer;
            if (!this.layer.typeUrl) {

            }
        }

        public stopAddingFeatures(layer: csComp.Services.ProjectLayer) {
            this.state = "layers";
            if (layer.gui["featureTypes"]) {
                for (var key in layer.gui["featureTypes"]) {
                    interact('#layerfeaturetype-' + key).onstart = null;
                    interact('#layerfeaturetype-' + key).onmove = null;
                    interact('#layerfeaturetype-' + key).onend = null;
                };
            }
            (<csComp.Services.DynamicGeoJsonSource>layer.layerSource).stopAddingFeatures(layer);
        }

        updateLayerOpacity = _.debounce((layer: csComp.Services.ProjectLayer) => {
            console.log('update opacity');
            if (!layer) return;
            if (layer.renderType && layer.renderType.toLowerCase() === 'gridlayer') {
                this.$layerService.updateCanvasOverlay(layer);
            } else {
                this.$layerService.updateLayerFeatures(layer);
            }
        }, 500);

        public setLayerOpacity(layer: csComp.Services.ProjectLayer) {
            this.updateLayerOpacity(layer);
        }

        public openLayerMenu(e) {
            //e.stopPropagation();
            (<any>$('.left-menu')).contextmenu('show', e);
            //alert('open layers');
        }

        public loadAvailableLayers() {
            this.project = this.$layerService.project;
            this.mylayers = [];

            if (this.project.groups) {
                this.project.groups.forEach((g) => {
                    g.layers.forEach((l) => this.mylayers.push(l.url));
                });
            }

            if (this.project.layerDirectory) {
                $.getJSON(this.project.layerDirectory, (result) => {
                    this.directory = [];
                    for (var l in result) this.directory.push(result[l]);
                });
            }
        }

        public openDirectory() {
            this.initGroups();
            this.loadAvailableLayers();
            this.initResources();
            
            this.state = "directory";            
            
            // var modalInstance = this.$modal.open({
            //     templateUrl: 'directives/LayersList/AddLayerView.tpl.html',
            //     controller: AddLayerCtrl,
            //     resolve: {
            //         //mca: () => newMca
            //     }
            // });
            // modalInstance.result.then((s: any) => {
            //     console.log('done adding');
            //     console.log(s);
            //     // this.showSparkline = false;
            //     // this.addMca(mca);
            //     // this.updateMca();
            //     //console.log(JSON.stringify(mca, null, 2));
            // }, () => {
            //         //console.log('Modal dismissed at: ' + new Date());
            //     });
        }

        private initResources() {
            this.resources = {};
            if (!this.project.groups) return;
            this.project.groups.forEach((g) => {
                if (g.layers) g.layers.forEach((l) => {
                    if (l.typeUrl && !this.resources.hasOwnProperty(l.typeUrl))
                        this.resources[l.typeUrl] = <csComp.Services.TypeResource> { title: l.typeUrl };
                })
            })
            this.resources["<new>"] = <csComp.Services.TypeResource> { title: "<new type file>" };
            this.layerResourceType = "<new>";
        }

        public createLayer() {
            this.initGroups();
            this.loadAvailableLayers();
            this.initResources();

            if (this.$layerService.project.groups && this.$layerService.project.groups.length > 0) {
                this.layerGroup = this.$layerService.project.groups[0].id;
            } else {
                this.layerGroup = new csComp.Services.ProjectGroup;
                this.layerGroup.id = "<new>";
                this.layerGroup.title = "<new group>";
                this.$layerService.project.groups = [];
            }
            this.state = "createlayer";
            this.newLayer = new csComp.Services.ProjectLayer();
            this.newLayer.type = "dynamicgeojson";
        }

        public addLayer() {
            //this.loadAvailableLayers();
            var group: csComp.Services.ProjectGroup;
            if (this.layerGroup == "<new>") {
                group = new csComp.Services.ProjectGroup;
                group.title = this.newGroup;
                this.$layerService.project.groups.push(group);
                this.$layerService.initGroup(group);
            }
            else {
                group = this.$layerService.findGroupById(this.layerGroup);
            }

            if (group) {
                this.$layerService.initLayer(group, this.newLayer);
                group.layers.push(this.newLayer);

                var nl = this.newLayer;

                /// create layer on server
                if (this.newLayer.type === "dynamicgeojson") {
                    this.newLayer.url = "api/layers/" + nl.title;
                    if (this.layerResourceType === "<new>") {
                        this.newLayer.typeUrl = "/api/resources/" + this.newLayer.title;
                        var r = <csComp.Services.TypeResource>{ id: this.newLayer.title, title: this.newLayer.title, featureTypes: {}, propertyTypeData: {} };
                        this.$http.post("/api/resources", r)
                            .success((data) => {

                        })
                            .error((e) => {
                            console.log('error adding resource');
                        });
                    }
                    else {
                        this.newLayer.typeUrl = this.layerResourceType;
                    }

                    var l = { id: nl.title, title: nl.title, isDynamic: true, type: nl.type, storage : 'file', description: nl.description, typeUrl: nl.typeUrl, tags: nl.tags, url: nl.url };
                    this.$http.post("/api/layers", l)
                        .success((data) => {
                        console.log(data);
                    })
                        .error(() => {
                        console.log('error adding layer');

                    });
                }

                if (this.layerResourceType === "<new>") {

                }

                var rpt = csComp.Helpers.createRightPanelTab("edit", "layeredit", this.newLayer, "Edit layer");
                this.$messageBusService.publish("rightpanel", "activate", rpt);
            }
            this.exitDirectory();
        }

        public toggleLayer(layer: csComp.Services.ProjectLayer): void {
            $(".left-menu").on("click", function(clickE) {
                //alert('context menu');
                (<any>$(this)).contextmenu({ x: clickE.offsetX, y: clickE.offsetY });
            });
            //layer.enabled = !layer.enabled;
            //if (this.$layerService.loadedLayers.containsKey(layer.id)) {
            // Unselect when dealing with a radio group, so you can turn a loaded layer off again.
            this.$layerService.toggleLayer(layer);

            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        public collapseAll() {
            this.$layerService.collapseAll();
            this.allCollapsed = true;
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        public expandAll() {
            this.$layerService.expandAll();
            this.allCollapsed = false;
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }


    }
}
