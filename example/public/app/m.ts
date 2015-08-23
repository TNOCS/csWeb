module MobileApp {
    // Mobile version
    import IFeature = csComp.Services.IFeature;

    export interface IAppLocationService extends ng.ILocationService {
        $$search: { layers: string };
    }

    export interface IAppScope extends ng.IScope {
        vm: AppCtrl;
        title: string;
        showMenuRight: boolean;
        featureSelected: boolean;
        layersLoading: number;
    }

    // TODO For setting the current culture for string formatting (note you need to include public/js/cs/stringformat.YOUR-CULTURE.js. See sffjs.1.09.zip for your culture.)
    declare var sffjs;
    declare var String;
    declare var omnivore;

    export class AppCtrl {
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        static $inject = [
            '$scope',
            '$location',
            'mapService',
            'layerService',
            'messageBusService', 'geoService'
        ];

        // public areaFilter: AreaFilter.AreaFilterModel;

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IAppScope,
            private $location: IAppLocationService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private geoService: csComp.Services.GeoService
            ) {
            sffjs.setCulture("nl-NL");

            $layerService.visual.leftPanelVisible = false;

            $scope.vm = this;
            $scope.showMenuRight = false;
            $scope.featureSelected = false;
            $scope.layersLoading = 0;


            $messageBusService.subscribe("feature", this.featureMessageReceived);
            $messageBusService.subscribe("layer", this.layerMessageReceived);

            this.$layerService.openSolution("data/projects/projects.json", $location.$$search.layers);

            $messageBusService.subscribe("geo", (action, loc: csComp.Services.Geoposition) => {
                switch (action) {
                    case "pos":
                        if (this.$layerService.project.features.length > 0) {
                            var f = this.$layerService.project.features[0];
                            f.geometry.coordinates = [loc.coords.longitude, loc.coords.latitude];
                            this.$layerService.updateFeature(f);
                            this.$layerService.saveFeature(f);

                        };
                        //alert(loc.coords.latitude + " - " + loc.coords.longitude);
                        break;
                }
            });

            this.geoService.start({});
        }

        /**
         * Publish a toggle request.
         */
        toggleMenuRight() {
            this.$messageBusService.publish("sidebar", "toggle");
        }

        private layerMessageReceived = (title: string, layer: csComp.Services.ProjectLayer): void => {
            switch (title) {
                case "loading":
                    this.$scope.layersLoading += 1;
                    console.log("Loading");
                    break;
                case "activated":
                    if (this.$scope.layersLoading >= 1) this.$scope.layersLoading -= 1;
                    console.log("Activated");
                    break;
                case "error":
                    this.$scope.layersLoading = 0;
                    console.log("Error loading");
                    break;
                case "deactivate":
                    break;
            }

            var $contextMenu = $("#contextMenu");

            $("body").on("contextmenu", "table tr", function(e) {
                $contextMenu.css({
                    display: "block",
                    left: e.pageX,
                    top: e.pageY
                });
                return false;
            });

            $contextMenu.on("click", "a", function() {
                $contextMenu.hide();
            });

            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        private featureMessageReceived = (title: string): void => {
            switch (title) {
                case "onFeatureSelect":
                    this.$scope.featureSelected = true;
                    break;
                case "onFeatureDeselect":
                    this.$scope.featureSelected = false;
                    break;
            }

            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        toggleMenu(): void {
            this.$mapService.invalidate();
        }

        toggleSidebar(): void {
            this.$messageBusService.publish("sidebar", "toggle");
            window.console.log("Publish toggle sidebar");
        }

        // showTable() {
        //     this.$mapService.mapVisible = false;
        // }
        //
        isActive(viewLocation: string) {
            return viewLocation === this.$location.path();
        }
    }

    // http://jsfiddle.net/mrajcok/pEq6X/
    //declare var google;

    // Start the application
    angular.module('csWebApp', [
        'csComp',
        'ngSanitize',
        'ui.router',
        'ui.bootstrap',
        'ui.select',
        'LocalStorageModule',
    // 'angularUtils.directives.dirPagination',
        'pascalprecht.translate',
    // 'ngCookies',
        'angularSpectrumColorpicker',
        'wiz.markdown'
    ])
        .config(localStorageServiceProvider => {
        localStorageServiceProvider.prefix = 'csMap';
    })
    //     .config(TimelineServiceProvider => {
    //     TimelineServiceProvider.setTimelineOptions({
    //         'width': '100%',
    //         "eventMargin": 0,
    //         "eventMarginAxis": 0,
    //         'editable': false,
    //         'layout': 'box'
    //     });
    // })
        .config($translateProvider => {
        // TODO ADD YOUR LOCAL TRANSLATIONS HERE, OR ALTERNATIVELY, CHECK OUT
        // http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
        // Translations.English.locale['MAP_LABEL'] = 'MY AWESOME MAP';
        $translateProvider.translations('en', Translations.English.locale);
        $translateProvider.translations('nl', Translations.Dutch.locale);
        $translateProvider.preferredLanguage('en');
    })
        .config($languagesProvider => {
        // Defines the GUI languages that you wish to use in your project.
        // They will be available through a popup menu.
        var languages = [];
        languages.push({ key: 'en', name: 'English', img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAflJREFUeNpinDRzn5qN3uFDt16+YWBg+Pv339+KGN0rbVP+//2rW5tf0Hfy/2+mr99+yKpyOl3Ydt8njEWIn8f9zj639NC7j78eP//8739GVUUhNUNuhl8//ysKeZrJ/v7z10Zb2PTQTIY1XZO2Xmfad+f7XgkXxuUrVB6cjPVXef78JyMjA8PFuwyX7gAZj97+T2e9o3d4BWNp84K1NzubTjAB3fH0+fv6N3qP/ir9bW6ozNQCijB8/8zw/TuQ7r4/ndvN5mZgkpPXiis3Pv34+ZPh5t23//79Rwehof/9/NDEgMrOXHvJcrllgpoRN8PFOwy/fzP8+gUlgZI/f/5xcPj/69e/37//AUX+/mXRkN555gsOG2xt/5hZQMwF4r9///75++f3nz8nr75gSms82jfvQnT6zqvXPjC8e/srJQHo9P9fvwNtAHmG4f8zZ6dDc3bIyM2LTNlsbtfM9OPHH3FhtqUz3eXX9H+cOy9ZMB2o6t/Pn0DHMPz/b+2wXGTvPlPGFxdcD+mZyjP8+8MUE6sa7a/xo6Pykn1s4zdzIZ6///8zMGpKM2pKAB0jqy4UE7/msKat6Jw5mafrsxNtWZ6/fjvNLW29qv25pQd///n+5+/fxDDVbcc//P/zx/36m5Ub9zL8+7t66yEROcHK7q5bldMBAgwADcRBCuVLfoEAAAAASUVORK5CYII=' });
        languages.push({ key: 'nl', name: 'Nederlands', img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFXSURBVHjaYvzPgAD/UNlYEUAAkuTgCAAIBgJggq5VoAs1qM0vdzmMz362vezjokxPGimkEQ5WoAQEKuK71zwCCKyB4c//J8+BShn+/vv/+w/D399AEox+//8FJH/9/wUU+cUoKw20ASCAWBhEDf/LyDOw84BU//kDtgGI/oARmAHRDJQSFwVqAAggxo8fP/Ly8oKc9P8/AxjiAoyMjA8ePAAIIJZ///5BVIM0MOBWDpRlZPzz5w9AALH8gyvCbz7QBrCJAAHEyKDYX15r/+j1199//v35++/Xn7+///77DST/wMl/f4Dk378K4jx7O2cABBALw7NP77/+ev3xB0gOpOHfr99AdX9/gTVASKCGP//+8XCyMjC8AwggFoZfIHWSwpwQk4CW/AYjsKlA8u+ff////v33998/YPgBnQQQQIzAaGNg+AVGf5AYf5BE/oCjGEIyAQQYAGvKZ4C6+xXRAAAAAElFTkSuQmCC' });
        //languages.push({ key: 'de', name: 'Deutsch', img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGzSURBVHjaYvTxcWb4+53h3z8GZpZff/79+v3n/7/fDAz/GHAAgABi+f37e3FxOZD1Dwz+/v3z9y+E/AMFv3//+Qumfv9et241QACxMDExAVWfOHkJJAEW/gUEP0EQDn78+AHE/gFOQJUAAcQiy8Ag8O+fLFj1n1+/QDp+/gQioK7fP378+vkDqOH39x9A/RJ/gE5lAAhAYhzcAACCQBDkgRXRjP034R0IaDTZTFZn0DItot37S94KLOINerEcI7aKHAHE8v/3r/9//zIA1f36/R+o4tevf1ANYNVA9P07RD9IJQMDQACxADHD3z8Ig4GMHz+AqqHagKp//fwLVA0U//v7LwMDQACx/LZiYFD7/5/53/+///79BqK/EMZ/UPACSYa/v/8DyX9A0oTxx2EGgABi+a/H8F/m339BoCoQ+g8kgRaCQvgPJJiBYmAuw39hxn+uDAABxMLwi+E/0PusRkwMvxhBGoDkH4b/v/+D2EDyz///QB1/QLb8+sP0lQEggFh+vGXYM2/SP6A2Zoaf30Ex/J+PgekHwz9gQDAz/P0FYrAyMfz7wcDAzPDtFwNAgAEAd3SIyRitX1gAAAAASUVORK5CYII=' });
        $languagesProvider.setLanguages(languages);
    })
    // Example switching the language (see http://angular-translate.github.io/).
    // <div ng-controller="Ctrl" class="ng-scope">
    //    <button class="btn ng-scope" ng-click="changeLanguage('en')" translate="BUTTON_LANG_EN"></button>
    //    <button class="btn ng-scope" ng-click="changeLanguage('de')" translate="BUTTON_LANG_DE"></button>
    // </div>
        .config(($stateProvider, $urlRouterProvider) => {
        // For any unmatched url, send to /
        $urlRouterProvider.otherwise("/map");
        $stateProvider
            .state('map', {
            url: "/map?layers",
            templateUrl: "views/map/map.html",
            sticky: true,
            deepStateRedirect: true
        })
            .state('table', {
            url: "/table",
            template: "<datatable id='datatable'></datatable>",
            sticky: true
        });
    })
        .controller('appCtrl', AppCtrl);
}
