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
            '$timeout',
            'layerService',
            'dashboardService',
            'mapService',
            'messageBusService',
            'localStorageService'
        ];

        public project: csComp.Services.Project;

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IProjectSettingsScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private dashboardService: csComp.Services.DashboardService,
            private mapService: csComp.Services.MapService,
            private messageBus: csComp.Services.MessageBusService,
            private $localStorageService: ng.localStorage.ILocalStorageService
        ) {
            $scope.vm = this;
        }

        toggleTouchMode() {
            this.dashboardService.touchMode = !this.dashboardService.touchMode;
            this.$localStorageService.set('touchmode', this.dashboardService.touchMode);
        }

        toggleRenderer() {
            if (this.$layerService.activeMapRenderer.title === 'cesium') {
                this.$layerService.selectRenderer('leaflet');
            } else {
                this.$layerService.selectRenderer('cesium');
            }
        }

        toggleShowLocation() {
            this.messageBus.publish('map', 'showLocation');
        }

        toggleAdminMode() {
            if (this.mapService.expertMode !== csComp.Services.Expertise.Admin) {
                this.mapService.expertMode = csComp.Services.Expertise.Admin;
                this.messageBus.publish('expertMode', 'newExpertise', csComp.Services.Expertise.Admin);
            } else {
                this.mapService.expertMode = csComp.Services.Expertise.Expert;
                this.messageBus.publish('expertMode', 'newExpertise', csComp.Services.Expertise.Expert);
            }
        }

        saveSettings() {
            this.$timeout(() => {
                var data = this.$layerService.project.serialize();
                //console.log(data);
                console.log('Save settings: ');
                csComp.Helpers.saveData(data, 'project', 'json');
            }, 0);
        }

        updateProject() {
            this.$layerService.saveProject();
        }

        private updateProjectReady(data) {
            if (data.success().statusText !== 'OK') {
                console.error('Error update project.json: ' + JSON.stringify(data));
            } else {
                console.log('Project.json updated succesfully!');
            }
        }
    }
}
