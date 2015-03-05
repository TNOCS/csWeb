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

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http  ://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$translate',
            '$languages',
            'messageBusService'
        ];

        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope     : ILanguageSwitchScope,
            private $translate : any,
            private $languages : ILanguage[],
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            this.language = $languages[0];
        }

        switchLanguage(language: ILanguage) {
            this.language = language;
            this.$translate.use(language.key);

            this.$messageBus.publish('language', 'newLanguage', language.key);
        }

    }
}  