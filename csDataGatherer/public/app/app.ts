//import Importer = require('../../ServerComponents/import/importer');

module App {
    'use strict';

    export interface IAppScope extends ng.IScope {
        vm: AppCtrl;
        importerInputForm: any;
    }

    export interface ITransform {
        id?: string;
        title?: string;
        description?: string;
    }

    export interface IImport {
        id?: string;
        title?: string;
        description?: string;
        transformers?: ITransform[];
    }

    export class AppCtrl {
        private importers:           IImport[]    = [];
        private transformers:        ITransform[] = [];
        private activeImporter:      IImport      = {};
        private selectedTransformer: ITransform;
        private originalImporter:    IImport;

        private repeatOptions = [
            { value: 0, text: "Never" },
            { value: 1, text: "Once" },
            { value: 2, text: "Every hour" },
            { value: 3, text: "Every day" },
            { value: 4, text: "Every week" },
            { value: 5, text: "Every month" },
            { value: 6, text: "Every year" }
        ];

        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        static $inject = [
            '$scope',
            '$http',
            '$timeout',
            'BASE_URL'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IAppScope,
            private $http: ng.IHttpService,
            private $timeout: ng.ITimeoutService,
            private BASE_URL: string
            ) {
            $scope.vm = this;

            this.refreshImporters();
            this.refreshTransformers();
        }

        private refreshImporters() {
            this.$http.get(this.BASE_URL)
                .success((data: any) => {
                    console.log(data);
                    this.$timeout(() => { this.importers = data }, 0);
                })
                .error(() => {
                    console.log("Error loading " + this.BASE_URL);
                });
        }

        private refreshTransformers() {
            this.$http.get(this.BASE_URL + "/transformers")
                .success((data: any) => {
                    console.log(data);
                    this.$timeout(() => {
                        this.transformers = data;
                        if (this.transformers.length > 0) {
                            this.selectedTransformer = this.transformers[0];
                        }
                    }, 0);
                })
                .error(() => {
                    console.log("Error loading " + this.BASE_URL + "/transformers");
                });
        }

        select(importer) {
            this.activeImporter = importer;
            this.originalImporter = angular.copy(importer);
        }

        revert() {
            var index = this.importers.indexOf(this.activeImporter);
            if (index < 0) return;
            this.activeImporter = this.importers[index] = angular.copy(this.originalImporter);
            this.$scope.importerInputForm.$setPristine();
        }

        canRevert() {
            return !angular.equals(this.activeImporter, this.originalImporter);
        }

        submit() {
            if (typeof this.activeImporter.id === 'undefined')
                this.createImporter(this.activeImporter);
            else
                this.updateImporter(this.activeImporter);
            this.refreshImporters();
        }

        private newImporter() {
            this.select({});
        }

        private createImporter(importer) {
            this.$http({
                url: this.BASE_URL,
                data: $.param(this.activeImporter),
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            })
                .success(function(data, status, headers, config) {
                })
                .error(function(data, status, headers, config) {
                    console.log(data);
                });

            this.refreshImporters();
        }

        canDeleteImporter() {
            return typeof this.activeImporter !== 'undefined' && typeof this.activeImporter.id !== 'undefined';
        }

        private deleteImporter() {
            var index = this.importers.indexOf(this.activeImporter);
            if (index < 0) return;
            this.$http.delete(this.BASE_URL + "/" + this.activeImporter.id)
                .success((data, status, headers, config) => {
                    this.importers.splice(index, 1);
                })
                .error(function(data, status, headers, config) {
                    console.log(data);
                });
        }

        private updateImporter(importer) {
            var params = {
                importer: this.activeImporter
            };

            var config = {
                params: params
            };

            this.$http.put(this.BASE_URL + "/" + this.activeImporter.id, this.activeImporter, config)
                .success(function(data, status, headers, config) {
                })
                .error(function(data, status, headers, config) {
                    console.log(data);
                });

            this.refreshImporters();
        }

        private removeTransformer(index: number) {
            this.activeImporter.transformers.splice(index, 1);
        }

        private addTransformer() {
            if (angular.isUndefined(this.activeImporter.transformers) || this.activeImporter.transformers === null) this.activeImporter.transformers = [];
            this.activeImporter.transformers.push(this.selectedTransformer);
        }

        private canRun() {
            return angular.isDefined(this.activeImporter);
        }

        private runImporter() {
            this.$http.get(this.BASE_URL + "/" + this.activeImporter.id + "/run")
                .success(function(data, status, headers, config) {
                })
                .error(function(data, status, headers, config) {
                    console.log(data);
                });
        }
    }

    // Start the application
    angular.module('csDataGatherer', [
        'ui.bootstrap',
        'ngTagsInput'
    ])
    .constant("BASE_URL", "/api/importers")
    .controller('appCtrl', AppCtrl);
}
