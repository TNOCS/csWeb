module ProjectSettings {
    export interface IProjectSettingsScope extends ng.IScope {
        vm: ProjectSettingsCtrl;
    }

    export class ProjectSettingsCtrl {
        private scope: IProjectSettingsScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$modal',
            '$timeout',
            'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : IProjectSettingsScope,
            private $modal       : any,
            private $timeout     : ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService
            ) {
            $scope.vm = this;
        }

        saveSettings() {
            this.$timeout(() => {
                var data = this.$layerService.project.serialize();
                //console.log(data);
                console.log("Save settings: ");
                csComp.Helpers.saveData(data, "project", "json");
            }, 0);
        }

    }
}
