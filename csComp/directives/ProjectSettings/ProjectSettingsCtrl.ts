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
            'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IProjectSettingsScope,
            private $timeout: ng.ITimeoutService,
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

        updateProject() {
            console.log('Updating project');
            this.$timeout(() => {
                var data = this.$layerService.project.serialize();
                var url = this.$layerService.projectUrl.url; 
                //.substr(0, this.$layerService.projectUrl.url.indexOf('/project.json'));
                console.log('URL: ' + url);
                $.ajax({
                    url: url,
                    type: "PUT",
                    data: data,
                    contentType: "application/json",
                    complete: this.updateProjectReady
                });
            }, 0);

            // for (var id in this.$layerService.typesResources) {
            //     if (id.indexOf('data/resourceTypes/') >= 0) {

            //         var file = this.$layerService.typesResources[id];
            //         var data = csComp.Services.TypeResource.serialize(file);
            //         var url = "api/resourceTypes/" + id.replace('data/resourceTypes/', ''); //this.$layerService.projectUrl.url.substr(0, this.$layerService.projectUrl.url.indexOf('/project.json'));
            //         $.ajax({
            //             url: url,
            //             type: "POST",
            //             data: data,
            //             contentType: "application/json",
            //             complete: this.updateProjectReady
            //         });
            //     }
            // }
        }

        private updateProjectReady(data) {
            if (data.success().statusText != 'OK') console.error('Error update project.json: ' + JSON.stringify(data));
            else console.log('Project.json updated succesfully!')
        }
    }
}
