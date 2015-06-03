module LanguageSwitch {
    export interface ILanguageSwitchScope extends ng.IScope {
        vm: LanguageSwitchCtrl;
    }

    export interface ILanguage {
        key : string;
        img : string;
        name: string;
    }

    export class LanguageSwitchCtrl {
        private scope: ILanguageSwitchScope;
        language     : ILanguage;

        public static $inject = [
            '$scope',
            '$translate',
            '$languages',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope       : ILanguageSwitchScope,
            private $translate   : ng.translate.ITranslateService,
            private $languages   : ILanguage[],
            private $layerService: csComp.Services.LayerService,
            private $messageBus  : csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            var prefLanguageIndex = 0;
            for (var i = 0; i < $languages.length; i++) {
              if($languages[i].key === $translate.preferredLanguage()) {
                prefLanguageIndex = i;
                break;
              }
            }
            this.language = $languages[prefLanguageIndex];
        }

        switchLanguage(language: ILanguage) {
            this.language = language;
            this.$translate.use(language.key);

            this.$messageBus.publish('language', 'newLanguage', language.key);
        }

    }
}
