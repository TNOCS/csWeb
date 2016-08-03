module LayersDirective {

    declare var interact;

    export interface ILayersDirectiveScope extends ng.IScope {
        vm: LayersDirectiveCtrl;
        options: Function;
    }

    export class LayersDirectiveCtrl {
        private scope: ILayersDirectiveScope;
        private allCollapsed: boolean;
        public editing: boolean;
        public state: string = 'layers';
        public layer: csComp.Services.ProjectLayer;
        public resource: csComp.Services.TypeResource;
        public project: csComp.Services.Project;
        public directory: csComp.Services.ProjectLayer[];
        public mylayers: string[];
        public selectedFeatureType: csComp.Services.IFeatureType;
        public newLayer: csComp.Services.ProjectLayer;
        public layerResourceType: string;
        public resources: { [key: string]: csComp.Services.TypeResource };
        public layerGroup: any;
        public layerTitle: string;
        public newGroup: string;
        public groups: csComp.Services.ProjectGroup[];
        public layerfilter: string;

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
            '$uibModal',
            '$http'
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
                this.project = project;
                if (title !== 'loaded' || !project) return;
                if (project.hasOwnProperty('collapseAllLayers') && project.collapseAllLayers === true) {
                    this.allCollapsed = true;
                } else {
                    this.allCollapsed = false;
                }
            });
            this.$messageBusService.subscribe('layerdrop', (title: string, layer: csComp.Services.ProjectLayer) => {
                this.dropLayer(layer);
            });

            this.$messageBusService.subscribe('layer', (action: string, layer: csComp.Services.ProjectLayer) => {
                if (action === 'deactivate' && layer === this.layer) this.stopEditingLayer(layer);
                if (action === 'startEditing') this.editLayer(layer);
            });

            this.$messageBusService.subscribe('featuretype', (action: string, type: csComp.Services.IFeatureType) => {
                if (action === 'startEditing') {
                    this.editFeaturetype(type);
                }
                if (action === 'stopEditing') {
                    this.editLayer(this.layer);
                }
            });
        }

        public dropLayer(layer: csComp.Services.ProjectLayer) {
            this.initGroups();
            this.initResources();
            this.$layerService.visual.leftPanelVisible = true;
            (<any>$('#leftPanelTab a[data-target="#layers"]')).tab('show');
            this.state = 'createlayer';
            this.newLayer = layer;
            this.newGroup = layer.id;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            };
        }

        public editGroup(group: csComp.Services.ProjectGroup) {
            var rpt = csComp.Helpers.createRightPanelTab('edit', 'groupedit', group, 'Group Settings', 'Group Settings', 'cog', true, true);
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
        }

        public layerSettings(layer: csComp.Services.ProjectLayer) {
            var rpt = csComp.Helpers.createRightPanelTab('edit', 'layersettings', layer, 'Layer Settings', 'Layer Settings', 'cog', true, true);
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
        }

        /** add new type to a resource file */
        public addNewType() {
            if (this.resource) {
                var st = <csComp.Services.IFeatureTypeStyle>{
                    drawingMode: 'Point',
                    iconUri: '/images/home.png',
                    cornerRadius: 50,
                    fillColor: 'yellow',
                    iconWidth: 30,
                    iconHeight: 30
                };
                var newType = <csComp.Services.IFeatureType>{};
                newType.id = 'new type';
                newType.name = 'new type';
                newType.style = st;
                newType.propertyTypeKeys = 'title,notes';

                var id = newType.id;
                //this.resource.featureTypes[id] = newType;
                //this.$layerService.saveResource(this.resource);
                this.editFeaturetype(newType);
                //this.editLayer(this.layer);
            }
        }

        public dropdownpos(event) {
            // alert('drop down');
            //     var dropDownTop = button.offset().top + button.outerHeight();
            // dropdown.css('top', dropDownTop + 'px');
            // dropdown.css('left', button.offset().left + 'px');
        }

        public deleteFeaturetype(featureType: csComp.Services.IFeatureType) {
            if (_.isUndefined(featureType)) return;
            var tr = this.$layerService.findResourceByLayer(this.layer);
            if (!_.isUndefined(tr)) {
                var types = [];
                for (var t in tr.featureTypes) {
                    if (tr.featureTypes[t].id === featureType.id) types.push(t);
                }
                if (types.length > 0) {
                    types.forEach(t => {
                        tr.featureTypes[t] = null;
                        delete tr.featureTypes[t];
                    });
                    this.$layerService.saveResource(tr);
                }

                this.editLayer(this.layer);
            }
        }

        /** start editing feature type */
        public editFeaturetype(featureType: csComp.Services.IFeatureType) {
            if (this.resource && this.resource.isDynamic) {
                featureType._resource = this.resource;
                this.selectedFeatureType = featureType;
                this.state = 'editfeaturetype';
            }
        }

        public initGroups() {
            this.groups = [];
            if (this.$layerService.project.groups)
                this.$layerService.project.groups.forEach((g) => this.groups.push(g));
            var g = new csComp.Services.ProjectGroup;
            g.id = '<new>';
            g.title = '<new group>';
            this.groups.push(g);
        }

        // public initDrag(key: string, layer: csComp.Services.ProjectLayer) {
        //     var transformProp;
        //     var startx, starty;

        //     var i = interact('#layerfeaturetype-' + key)
        //         .draggable({
        //         max: Infinity,
        //         onstart: (event) => {
        //             startx = 0;
        //             starty = 0;
        //             event.interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
        //             event.interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
        //              var interaction = event.interaction;

        //             // if the pointer was moved while being held down
        //             // and an interaction hasn't started yet
        //                 var original = event.currentTarget,
        //                     // create a clone of the currentTarget element
        //                     clone = event.currentTarget.cloneNode(true);

        //                 // insert the clone to the page
        //                 // TODO: position the clone appropriately
        //                 document.body.appendChild(clone);

        //                 // start a drag interaction targeting the clone
        //                 interaction.start({ name: 'drag' },
        //                                     event.interactable,
        //                                     clone);


        //         },
        //         onmove: (event) => {



        //             event.interaction.x += event.dx;
        //             event.interaction.y += event.dy;

        //             event.target.style.left = event.interaction.x + 'px';
        //             event.target.style.top = event.interaction.y + 'px';
        //         },
        //         onend: (event) => {
        //             setTimeout(() => {
        //                 var x = event.clientX;
        //                 var y = event.clientY;
        //                 var pos = this.$layerService.activeMapRenderer.getLatLon(x, y - 50);
        //                 console.log(pos);
        //                 var f = new csComp.Services.Feature();

        //                 f.layerId = layer.id;
        //                 f.geometry = {
        //                     type: 'Point', coordinates: [pos.lon, pos.lat]
        //                 };
        //                 //f.
        //                 f.properties = { 'featureTypeId': key, 'Name': key };
        //                 layer.data.features.push(f);
        //                 this.$layerService.initFeature(f, layer);
        //                 this.$layerService.activeMapRenderer.addFeature(f);
        //                 this.$layerService.saveFeature(f);
        //             }, 100);

        //             //this.$dashboardService.mainDashboard.widgets.push(widget);
        //             event.target.setAttribute('data-x', 0);
        //             event.target.setAttribute('data-y', 0);
        //             event.target.style.left = '0px';
        //             event.target.style.top = '0px';

        //             console.log(key);
        //         }
        //     })
        // }

        public initDrag(key: string, layer: csComp.Services.ProjectLayer) {
            var transformProp;
            var startx, starty;

            var i = interact('#layerfeaturetype-' + key).draggable({
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
                        var fid = 'new object';
                        var tr = this.$layerService.findResourceByLayer(layer);
                        f.properties = { 'featureTypeId': key, 'Name': fid };
                        if (tr.featureTypes.hasOwnProperty(key)) {
                            var ft = tr.featureTypes[key];
                            if (!ft._isInitialized) {
                                this.$layerService.initFeatureType(ft, tr);
                            }
                            if (_.isArray(ft._propertyTypeData)) {
                                for (var k in ft._propertyTypeData) {
                                    var pt = ft._propertyTypeData[k];
                                    ft._propertyTypeData.forEach((pt: csComp.Services.IPropertyType) => {
                                        f.properties[pt.label] = pt.title; //_.isUndefined(pt.defaultValue) ? '' : pt.defaultValue;
                                    });
                                }
                            }
                            fid = ft.name;
                        }

                        layer.data.features.push(f);
                        this.$layerService.initFeature(f, layer);
                        this.$layerService.activeMapRenderer.addFeature(f);
                        this.$layerService.saveFeature(f);
                        this.$layerService.selectFeature(f);
                    }, 10);

                    //this.$dashboardService.mainDashboard.widgets.push(widget);
                    // event.target.setAttribute('data-x', 0);
                    // event.target.setAttribute('data-y', 0);
                    // event.target.style.left = '0px';
                    // event.target.style.top = '0px';
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
                    $(clone).css('left', pos.left);
                    $(clone).css('top', pos.top);
                    $(clone).css('z-index', 1000);
                    // insert the clone to the page
                    // TODO: position the clone appropriately
                    $(document.body).append(clone);

                    // start a drag interaction targeting the clone
                    interaction.start({ name: 'drag' }, event.interactable, clone);

                } else {
                    interaction.start({ name: 'drag' }, event.interacFtable, event.currentTarget);
                }
            });
        }

        public selectProjectLayer(layer: csComp.Services.ProjectLayer) {
            this.layer = layer;
        }

        public exitDirectory() {
            this.layer = null;
            this.layerTitle = '';
            this.state = 'layers';
        }

        /* start editing layer */
        public editLayer(layer: csComp.Services.ProjectLayer) {
            this.state = 'editlayer';

            (<csComp.Services.EditableGeoJsonSource>layer.layerSource).startEditing(layer);
            this.layer = layer;
            this.resource = null;
            if (this.layer.typeUrl) {
                if (this.$layerService.typesResources.hasOwnProperty(this.layer.typeUrl)) {
                    this.resource = this.$layerService.typesResources[this.layer.typeUrl];
                }
            }
        }

        /* stop editing layer */
        public stopEditingLayer(layer: csComp.Services.ProjectLayer) {
            this.state = 'layers';
            if (layer._gui['featureTypes']) {
                for (var key in layer._gui['featureTypes']) {
                    interact('#layerfeaturetype-' + key).onstart = null;
                    interact('#layerfeaturetype-' + key).onmove = null;
                    interact('#layerfeaturetype-' + key).onend = null;
                };
            }
            this.$layerService.stopEditingLayer(layer);
        }

        /** change layer opacity */
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

        /** get a list of available layers from the server */
        public loadAvailableLayers() {
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
            this.state = 'directory';
        }

        /** get a list of resources for the forms */
        private initResources() {
            this.resources = {};
            if (!this.project.groups) return;
            this.project.groups.forEach(g => {
                if (g.layers) g.layers.forEach(l => {
                    if (l.typeUrl && !this.resources.hasOwnProperty(l.typeUrl))
                        this.resources[l.typeUrl] = <csComp.Services.TypeResource>{ title: l.typeUrl };
                });
            });
            this.resources['<new>'] = <csComp.Services.TypeResource>{ title: '<new type file>' };
            this.layerResourceType = '<new>';
        }

        /** go to create layer state */
        public createLayer() {
            this.initGroups();
            this.loadAvailableLayers();
            this.initResources();

            if (this.$layerService.project.groups && this.$layerService.project.groups.length > 0) {
                this.layerGroup = this.$layerService.project.groups[0].id;
            } else {
                this.layerGroup = new csComp.Services.ProjectGroup;
                this.layerGroup.id = '<new>';
                this.layerGroup.title = '<new group>';
                this.$layerService.project.groups = [];
            }
            this.state = 'createlayer';
            this.newLayer = new csComp.Services.ProjectLayer();
            this.newLayer.type = 'dynamicgeojson';
            this.newLayer.layerSource = this.$layerService.layerSources['dynamicgeojson'];
        }

        /** actually create new layer */
        public createNewLayer() {
            //this.loadAvailableLayers();
            var group: csComp.Services.ProjectGroup;

            // new group was selected
            if (this.layerGroup === '<new>') {
                group = new csComp.Services.ProjectGroup;
                group.title = this.newGroup;
                if (this.$layerService.project.groups.some(g => g.title === this.newGroup)) {
                    this.$messageBusService.notify('Error creating group', 'Group already exists');
                    return;
                } else {
                    this.$layerService.project.groups.push(group);
                    this.$layerService.initGroup(group);
                }
            } else {
                group = this.$layerService.findGroupById(this.layerGroup);
            }

            if (group) {
                let id = encodeURI(this.newLayer.title.toLowerCase());
                this.newLayer.id = id;

                var nl = this.newLayer;

                //// make a sensible id
                //var id = nl.title.replace(' ', '_').toLowerCase();
                /// create layer on server
                if (this.newLayer.type === 'dynamicgeojson') {
                    this.newLayer.url = 'api/layers/' + id;

                    async.series([
                        // save or find resource
                        (cb) => {
                            if (this.layerResourceType === '<new>') {
                                // use layer id as a resource id
                                this.newLayer.typeUrl = 'api/resources/' + id;

                                // create empty resource
                                var r = <csComp.Services.TypeResource>{ id: id, title: this.newLayer.title, featureTypes: {}, propertyTypeData: {} };

                                if (this.newLayer.data && this.newLayer.data.features && this.newLayer.data.features.length > 0)
                                    r.featureTypes['Default'] = csComp.Helpers.createDefaultType(this.newLayer.data.features[0], r);

                                // call api
                                this.$http.post('api/resources', r)
                                    .then((res: {data: any}) => {
                                        // resource sucessfully added, continu
                                        cb(null);
                                    }, (e) => {
                                        // error adding resource, stop
                                        this.$messageBusService.notifyError('Creating layer', 'Error creating new layer, resource already exists');
                                        cb(e);
                                    });
                            } else {
                                this.newLayer.typeUrl = this.layerResourceType;
                                cb(null);
                            }
                        },
                        (cb) => {
                            var l = {
                                id: id,
                                title: nl.title,
                                isDynamic: true,
                                type: nl.type,
                                storage: 'file',
                                description: nl.description,
                                typeUrl: nl.typeUrl,
                                tags: nl.tags,
                                url: nl.url,
                                features: []
                            };
                            if (this.newLayer.data) l.features = this.newLayer.data.features;
                            // post layer to api
                            this.$http.post('/api/layers/' + l.id, l)
                                .then((res: {data: any}) => {
                                    let data = res.data;
                                    // init layer
                                    this.$layerService.initLayer(group, this.newLayer);

                                    // add to group
                                    group.layers.push(this.newLayer);

                                    this.$layerService.addLayer(this.newLayer);
                                    this.$layerService.saveProject();
                                    // layer sucessfully added, continu
                                    cb(null);
                                })
                                .catch((e) => {
                                    this.$messageBusService.notifyError('Creating layer', 'Error creating new layer');
                                    console.log('error adding layer');
                                    cb(e);
                                });
                        }
                    ], (e) => {
                        if (!e) {
                            this.$messageBusService.notifyError('Creating layer', 'Layer created');
                            this.exitDirectory();
                        }
                    });
                } else {// not a dynamic project, only save it locally
                    this.$layerService.initLayer(group, this.newLayer);
                    group.layers.push(this.newLayer);
                    this.$layerService.addLayer(this.newLayer);
                    this.exitDirectory();
                }
            }

        }

        /** toggle layer (use shift key to start editing) */
        public toggleLayer(layer: csComp.Services.ProjectLayer, event: any): void {

            // if shift key pressed go to edit mode
            if (event.altKey) {
                if (!layer.enabled) {
                    this.$layerService.addLayer(layer, () => { this.editLayer(layer); });
                } else {
                    this.editLayer(layer);
                }
            } else {
                this.$layerService.toggleLayer(layer);
            }
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        }

        /** execute layer action */
        public clickAction(o: IActionOption, layer: csComp.Services.ProjectLayer) {
            o.callback(layer, this.$layerService);
        }

        /** triggered when layer was created, make a list of layer actions */
        public openLayerMenu(event, layer: csComp.Services.ProjectLayer) {
            console.log('open layer menu');
            event.stopPropagation();
            layer._gui['options'] = [];
            this.$layerService.actionServices.forEach(acs => {
                if (_.isFunction(acs.getLayerActions)) {
                    var actions = acs.getLayerActions(layer);
                    if (_.isArray(actions)) actions.forEach(a => layer._gui['options'].push(a));
                }
            });

            layer._gui['options'].push({ title: 'Layer Settings', callback: (l, ls) => this.layerSettings(l) });

            (<any>$(event.target).next()).dropdown('toggle');

            //$(event.target).next().dropdown('toggle');
        }

        public collapseAll() {
            this.$layerService.collapseAll();
            this.allCollapsed = true;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        }

        public expandAll() {
            this.$layerService.expandAll();
            this.allCollapsed = false;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        }

        /** Hide groups whose title or id start with an underscore */
        private filterHiddenGroups(group: csComp.Services.ProjectGroup) {
            return group.title[0] !== '_' && group.id[0] !== '_';
        }

    }
}
