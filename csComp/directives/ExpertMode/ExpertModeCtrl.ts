module ExpertMode {
    import Expertise = csComp.Services.Expertise;

    export interface IExpertModeScope extends ng.IScope {
        vm: ExpertModeCtrl;
        expertMode: Expertise;
    }

    export class ExpertModeCtrl {
        public static $inject = [
            '$scope',
            'localStorageService',
            'layerService',
            'mapService',
            'messageBusService'
        ];

        constructor(
            private $scope: IExpertModeScope,
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            $scope.expertMode = $mapService.expertMode;

            $messageBus.subscribe('expertMode', (title: string, mode: Expertise) => {
                if (title !== 'newExpertise') return;
                $scope.expertMode = mode;
            });

            $scope.$watch('expertMode', () => {
                this.setExpertMode($scope.expertMode);
            });
        }

        /**
        * Get the CSS class to render the mode.
        */
        getCssClass() {
            switch (this.$mapService.expertMode) {
                case Expertise.Beginner:
                    return 'beginnerUserIcon';
                    break;
                case Expertise.Intermediate:
                    return 'intermediateUserIcon';
                    break;
                case Expertise.Expert:
                    return 'expertUserIcon';
                    break;
                case Expertise.Admin:
                    return 'expertUserIcon';
                    break;
            }
        }

        /**
        * Set the expert mode: although we assume that each directive is responsible for managing it by listening
        * to the expertMode.newExpertise message, we already set some common options here.
        * This is to reduce the dependency on this directive.
        */
        private setExpertMode(expertMode: Expertise) {
            this.$messageBus.publish('expertMode', 'newExpertise', expertMode);
        }
    }
}
