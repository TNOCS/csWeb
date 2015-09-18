
module DataTable {
    import IGeoJsonFile = csComp.Services.IGeoJsonFile;
    import IPropertyType = csComp.Services.IPropertyType;
    import IFeature = csComp.Services.IFeature;
    import ProjectLayer = csComp.Services.ProjectLayer;

    export interface IDataTableViewScope extends ng.IScope {
        vm: DataTableCtrl;
        //numberOfItems  : number;
        //selectedLayerId: string;
    }

    /**
     * Represents a field in the table.
     * The value is the actual displayValue shown, the type is the propertyType type (e.g. number or text, useful when aligning the data), and the header is used for sorting.
     */
    export class TableField {
        constructor(public displayValue: string, public originalValue: any, public type: string, public header: string) { }
    }

    declare var String;

    export class DataTableCtrl {
        public mapLabel: string = "map";
        public dataset: IGeoJsonFile;
        public selectedType: csComp.Services.IFeatureType;
        public numberOfItems: number = 10;
        public selectedLayerId: string;
        public layerOptions: Array<any> = [];
        public propertyTypes: Array<IPropertyType> = [];
        public headers: Array<string> = [];
        public sortingColumn: number;
        public rows: Array<Array<TableField>> = [];
        private mapFeatureTitle: string;
        private selectAllText: string;
        private selectAllBool: boolean;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            '$sce',
            '$translate',
            '$timeout',
            'layerService',
            'localStorageService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IDataTableViewScope,
            private $http: ng.IHttpService,
            private $sce: ng.ISCEService,
            private $translate: ng.translate.ITranslateService,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
            // for its methods to be accessible from view / HTML
            $scope.vm = this;

            if (this.layerOptions && this.layerOptions.length > 0) {
                $translate('MAP_FEATURES').then(translation => {
                    this.layerOptions[0].title = translation;
                });
            }

            this.bindToStorage('vm.numberOfItems', 10);
            this.numberOfItems = $localStorageService.get('vm.numberOfItems');
            this.bindToStorage('vm.selectedLayerId', this.mapLabel);

            if (this.$layerService.project == null || this.$layerService.project.groups == null) return;
            this.updateLayerOptions();
            this.loadLayer();

            this.selectAllBool = false;
            $translate('SELECT_ALL').then(translation => {
                this.selectAllText = translation;
            });

            $messageBusService.publish('timeline', 'isEnabled', 'false');


        }


        /**
         * Add a label to local storage and bind it to the scope.
         */
        private bindToStorage(label: string, defaultValue: any) {
            if (this.$localStorageService.get(label) === null)
                this.$localStorageService.set(label, defaultValue); // You first need to set the key
            this.$localStorageService.bind(this.$scope, label);
        }

        /**
         * Create a list of layer options and select the one used previously.
         */
        private updateLayerOptions() {

            var chooseLayerOption = {
                "group": '',
                "id": this.mapLabel,
                "title": ''//this.$translate("CHOOSE_CATEGORY")//this.mapFeatureTitle
            };
            this.layerOptions.push(chooseLayerOption);

            this.$translate("CHOOSE_CATEGORY").then(translation=>{
              chooseLayerOption.title = translation
            });

            if (this.$layerService.project == null || this.$layerService.project.groups == null) return;
            this.$layerService.project.groups.forEach((group) => {
                group.layers.forEach((layer) => {
                    this.layerOptions.push({
                        "group": group.title,
                        "id": layer.id,
                        "title": layer.title
                    });
                });
            });

            for (var layerKey in this.$layerService.loadedLayers) {
              if (this.selectedLayerId == null) {
                return;
              }
              var layer: ProjectLayer = this.$layerService.loadedLayers[layerKey];
              if (layer.enabled) {
                this.selectedLayerId = layer.id;
              }
            };
            //this.selectedLayerId =  //this.$localStorageService.get('vm.selectedLayerId');
        }

        private loadLayer(): void {
            if (!this.selectedLayerId || this.selectedLayerId === this.mapLabel) return this.loadMapLayers();
            var selectedLayer = this.findLayerById(this.selectedLayerId);
            if (selectedLayer == null) return this.loadMapLayers();


            this.$http.get(selectedLayer.url).
                success((data: IGeoJsonFile) => {
                this.dataset = data;

                if (data.featureTypes == null) data.featureTypes = {};
                if (data.features) {
                    data.features.forEach((f: IFeature) => {
                        if (f.properties.hasOwnProperty('FeatureTypeId')) {
                            f.featureTypeName = f.properties['FeatureTypeId'];
                        } else if (data.featureTypes.hasOwnProperty('Default')) {
                            f.featureTypeName = 'Default';
                        } else if (selectedLayer.defaultFeatureType != null && selectedLayer.defaultFeatureType != "") {
                          f.featureTypeName = selectedLayer.defaultFeatureType;
                        }
                        if (!(f.featureTypeName in data.featureTypes))
                            data.featureTypes[f.featureTypeName] = this.$layerService.getFeatureType(f);
                    });
                    this.updatepropertyType(data);
                }


            }).
                error((data, status, headers, config) => {
                this.$messageBusService.notify("ERROR opening " + selectedLayer.title, "Could not get the data.");
            });
        }

        /**
         * Load the features as visible on the map.
         */
        private loadMapLayers(): void {
            this.selectedLayerId = this.mapLabel;
            var data: IGeoJsonFile = {
                type: '',
                features: [],
                featureTypes: {}
            };
            // If we are filtering, load the filter results
            this.$layerService.project.groups.forEach((group) => {
                if (group.filterResult != null)
                    group.filterResult.forEach((f) => data.features.push(f));
            });
            // Otherwise, take all loaded features
            if (data.features.length === 0)
                data.features = this.$layerService.project.features;

            data.features.forEach((f: IFeature) => {
                if (!(f.featureTypeName in data.featureTypes))
                    data.featureTypes[f.featureTypeName] = this.$layerService.getFeatureType(f);
            });

            this.dataset = data;
            this.updatepropertyType(data);
        }

        private updatepropertyType(data: IGeoJsonFile): void {
            this.propertyTypes = [];
            this.headers = [];
            this.rows = [];
            var titles: Array<string> = [];
            var mis: Array<IPropertyType> = [];
            // Push the Name, so it always appears on top.
            /* rely on namelabel to determine the first property
            mis.push({
                label: "Name",
                visibleInCallOut: true,
                title: "Naam",
                type: "text",
                filterType: "text",
                isSearchable: true
            });
            */

            var featureType: csComp.Services.IFeatureType;
            for (var key in data.featureTypes) {
                featureType = data.featureTypes[key];
                if (featureType.propertyTypeData != null) {
                  featureType.propertyTypeData.forEach(ptd => {
                    if (featureType.style.nameLabel == ptd.label) {
                      mis.splice(0,0,ptd);
                    } else {
                      mis.push(ptd);
                    }
                  });
                }
                if (featureType.propertyTypeKeys != null) {
                    var keys: Array<string> = featureType.propertyTypeKeys.split(';');
                    keys.forEach((k) => {
                        var propertyType: csComp.Services.IPropertyType = null;
                        if (k in this.$layerService.propertyTypeData)
                          propertyType = this.$layerService.propertyTypeData[k];
                            //mis.push(this.$layerService.propertyTypeData[k]);
                        else if (featureType.propertyTypeData != null) {
                            var result = $.grep(featureType.propertyTypeData, e => e.label === k);
                            //if (result.length >= 1) mis.push(result[0]);
                            if (result.length >= 1) propertyType = result[0];
                        }

                        if (propertyType != null) {
                          if (featureType.style.nameLabel == propertyType.label) {
                            mis.splice(0,0,propertyType);
                          } else {
                            mis.push(propertyType);
                          }
                        }
                    });
                } else if (featureType.propertyTypeData != null) {
                    featureType.propertyTypeData.forEach((mi) => {
                      //mis.push(mi)

                      if (featureType.style.nameLabel == mi.label) {
                        mis.splice(0,0,mi);
                      } else {
                        mis.push(mi);
                      }
                      /*
                      var existingMis = mis.filter(existingMi=>existingMi.title == mi.title);
                      if (existingMis.length > 0) {
                        mis.splice(mis.indexOf(existingMis[0]),1,mi);
                      } else {
                        mis.push(mi);
                      }
                      */
                    });
                }
                mis.forEach((mi) => {
                    if ((mi.visibleInCallOut || mi.label === "Name") && titles.indexOf(mi.title) < 0) {
                        titles.push(mi.title);
                        this.propertyTypes.push(mi);
                    }
                });
            }
            // Add lat-lon coordinates for point features
            this.propertyTypes.push(csComp.Helpers.GeoExtensions.createPropertyType('Lat'));
            this.propertyTypes.push(csComp.Helpers.GeoExtensions.createPropertyType('Lon'));

            // Select the first couple of headers
            var nmbrOfDefaultSelectedHeaders = 3;
            for (var i = 0; i < nmbrOfDefaultSelectedHeaders; i++) {
                this.headers.push(titles[i]);
            }
            this.rows = this.getRows();
        }

        public toggleSelection(propertyTypeTitle: string) {
            var idx = this.headers.indexOf(propertyTypeTitle);
            // is currently selected
            if (idx > -1) {
                this.headers.splice(idx, 1);
            }
            // is newly selected
            else {
                this.headers.push(propertyTypeTitle);
            }
            this.rows = this.getRows();
        }

        private findLayerById(id: string): ProjectLayer {
            for (var i = 0; i < this.$layerService.project.groups.length; i++) {
                var group = this.$layerService.project.groups[i];
                for (var j = 0; j < group.layers.length; j++) {
                    var layer = group.layers[j];
                    if (layer.id != id) continue;
                    return layer;
                }
            }
            return null;
        }

        /**
         * Returns the data rows that are relevant for the current selection.
         */
        public getRows(): Array<Array<TableField>> {
            var meta: Array<IPropertyType> = [this.headers.length];
            this.propertyTypes.forEach((mi: IPropertyType) => {
                // Keep headers and mi in the right order
                var index = this.headers.indexOf(mi.title);
                if (index >= 0) meta[index] = mi;
            });
            var props: Array<Array<TableField>> = [];
            var displayValue: string;
            if (this.dataset && this.dataset.features) {
                this.dataset.features.forEach((f: IFeature) => {
                    var row: Array<TableField> = [];
                    meta.forEach((mi) => {
                        if (mi.label === 'Lat') {
                            (f.geometry.type === 'Point') ? displayValue = f.geometry.coordinates[1] : displayValue = '';
                            text = displayValue;
                        } else if (mi.label === 'Lon') {
                            (f.geometry.type === 'Point') ? displayValue = f.geometry.coordinates[0] : displayValue = '';
                            text = displayValue;
                        } else {
                            var text = f.properties[mi.label];
                            displayValue = csComp.Helpers.convertPropertyInfo(mi, text);
                        }
                        //if (!text)
                        //    text = ' ';
                        //else if (!$.isNumeric(text))
                        //    text = text.replace(/&amp;/g, '&');
                        //switch (mi.type) {
                        //    case "bbcode":
                        //        displayValue = XBBCODE.process({ text: text }).html;
                        //        break;
                        //    case "number":
                        //        if (!$.isNumeric(text)) displayValue ='??';
                        //        else if (!mi.stringFormat)
                        //            displayValue = text.toString();
                        //        else
                        //            displayValue = String.format(mi.stringFormat, parseFloat(text));
                        //        break;
                        //    default:
                        //        displayValue = text;
                        //        break;
                        //}
                        row.push(new TableField(displayValue, text, mi.type, mi.title));
                    });
                    props.push(row);
                });
            }
            return props;
        }

        /**
         * Generate a font awesome class based on the order.
         */
        public sortOrderClass(headerIndex: number, reverseOrder: boolean): string {
            var t: string;
            if (reverseOrder != null && headerIndex == this.sortingColumn) {
                t = ('fa fa-sort-' + ((reverseOrder) ? 'desc' : 'asc'));
            }
            else {
                t = 'fa fa-sort';
            }
            return t;
        }

        /**
         * Order the rows based on the header index and the order.
         */
        public orderBy(headerIndex: number, reverseOrder: boolean) {
            this.sortingColumn = headerIndex;
            this.rows = this.rows.sort((a, b) => {
                var order: boolean; // Original sort order
                if (a[headerIndex].type == 'number')
                    order = a[headerIndex].originalValue > b[headerIndex].originalValue;
                else
                    order = a[headerIndex].originalValue.toLowerCase() > b[headerIndex].originalValue.toLowerCase();
                if (order == reverseOrder)
                    return 1;
                else
                    return -1;
            });
        }

        public downloadGeoJson() {
            var geoJsonString = '{"type": "FeatureCollection",' +
                '"featureTypes": ' +
                JSON.stringify(this.dataset.featureTypes, (key, val) => { return (key === '$$hashKey') ? undefined : val; });
            //geoJsonString += ', "features" : [';
            geoJsonString += ', "features": [';
            this.dataset.features.forEach((f) => {
                var cleanFeature = new csComp.Services.Feature();
                cleanFeature.type = f.type;
                cleanFeature.properties = f.properties;
                cleanFeature.geometry = f.geometry;
                geoJsonString += JSON.stringify(cleanFeature) + ',';
            });
            geoJsonString = geoJsonString.substring(0, geoJsonString.length - 1) + ']}';

            var filename = this.mapLabel;
            if (this.selectedLayerId !== this.mapLabel) {
                var layer = this.findLayerById(this.selectedLayerId);
                if (layer) filename = layer.title.replace(' ', '_');
            }

            this.$timeout(() => {
                var data = this.$layerService.project.serialize();
                //console.log(data);
                console.log("Save settings: ");
                csComp.Helpers.saveData(geoJsonString, filename, "json");
            }, 0);
        }

        public downloadCsv() {
            var csvRows: Array<string> = [];

            csvRows.push(this.headers.join(';'));

            for (var i = 0; i < this.rows.length; i++) {
                csvRows.push(this.rows[i].map((f) => { return f.originalValue; }).join(';'));
            }

            var csvString = csvRows.join('\r\n');

            var filename = this.mapLabel;
            if (this.selectedLayerId !== this.mapLabel) {
                var layer = this.findLayerById(this.selectedLayerId);
                if (layer) filename = layer.title.replace(' ', '_');
            }
            //this.saveData(csvString, filename + '.csv');
            this.$timeout(() => {
                var data = this.$layerService.project.serialize();
                //console.log(data);
                console.log("Save settings: ");
                csComp.Helpers.saveData(csvString, filename, "csv");
            }, 0);
        }

        // private saveData(csvData: string, filename: string) {
        //     if (navigator.msSaveBlob) {
        //         // IE 10+
        //         var link: any = document.createElement('a');
        //         link.addEventListener("click", event => {
        //             var blob = new Blob([csvData], {"type": "text/csv;charset=utf-8;"});
        //             navigator.msSaveBlob(blob, filename);
        //         }, false);
        //         document.body.appendChild(link);
        //         link.click();
        //         document.body.removeChild(link);
        //     } else if (!csComp.Helpers.supportsDataUri()) {
        //         // Older versions of IE: show the data in a new window
        //         var popup = window.open('', 'csv', '');
        //         popup.document.body.innerHTML = '<pre>' + csvData + '</pre>';
        //     } else {
        //         // Support for browsers that support the data uri.
        //         var a: any = document.createElement('a');
        //         document.body.appendChild(a);
        //         a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData);
        //         a.target = '_blank';
        //         a.download = filename;
        //         a.click();
        //         document.body.removeChild(a);
        //     }
        // }

        private selectAll() {
            if (this.selectAllBool) {
                this.$translate('SELECT_ALL').then(translation => {
                    this.selectAllText = translation;
                });
                this.propertyTypes.forEach((mi) => {
                    var idx = this.headers.indexOf(mi.title);
                    if (idx > -1) {
                        this.headers.splice(idx, 1);
                    }
                });
                this.rows = this.getRows();
            } else {
                this.$translate('DESELECT_ALL').then(translation => {
                    this.selectAllText = translation;
                });
                this.propertyTypes.forEach((mi) => {
                    if (this.headers.indexOf(mi.title) <= -1) {
                        this.headers.push(mi.title);
                    }
                });
                this.rows = this.getRows();
            }
            this.selectAllBool = !this.selectAllBool;
        }

        /**
         * Convert to trusted html string.
         */
        public toTrusted(html: string) {
            try {
                if (html === undefined || html === null)
                    return this.$sce.trustAsHtml(html);
                return this.$sce.trustAsHtml(html.toString());
            } catch (e) {
                console.log(e + ': ' + html);
                return '';
            }
        }
    }
}
