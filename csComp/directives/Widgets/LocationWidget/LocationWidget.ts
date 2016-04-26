module LocationWidget {
    /** Config */
    var moduleName = 'csComp';

    /** Module */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /** Directive to send a message to a REST endpoint. Similar in goal to the Chrome plugin POSTMAN. */
    myModule.directive('locationwidget', [function (): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/LocationWidget/LocationWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: LocationWidgetCtrl
        };
    }]);

    export interface ILocationWidgetScope extends ng.IScope {
        vm: LocationWidgetCtrl;
        data: ILocationData;
    }

    export interface ILocationWidget {
        id: string;
        name: string;
    }

    export interface ILocationData {
        /** Street view API key: https://developers.google.com/maps/documentation/streetview/get-api-key#get-an-api-key */
        streetViewApiKey: string;
        /** Optionally, specify the StreetView url, e.g. https://maps.googleapis.com/maps/api/streetview */
        streetViewUrl: string;
    }

    export interface LocationInfo {
        title?: string;
        address?: string;
        postcode?: string;
        city?: string;
        neighbourhood?: string;
        sunrise?: string;
        sunset?: string;
        locations?: string[];
        streetViewUrlThumb?: string;
        streetViewUrlFull?: string;
    }

    declare var String;

    export class LocationWidgetCtrl {
        private streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview';
        private parentWidget: JQuery;
        private location: LocationInfo = {};
        private selectedLocationFormat: string;

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            'actionService',
            '$timeout'
        ];

        constructor(
            private $scope: ILocationWidgetScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private actionService: csComp.Services.ActionService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <ILocationData>par.widget.data;
            if ($scope.data.streetViewUrl) this.streetViewUrl = $scope.data.streetViewUrl;
            this.parentWidget = $('#' + par.widget.elementId).parent();
            this.parentWidget.hide();

            messageBusService.subscribe('geocoding', (action: string, data: csComp.Services.IOCDFeature) => {
                if (action !== 'reverseLookupResult') return;
                this.parentWidget.show();
                this.updateWidget(data);
            });
        }

        private updateWidget(data: csComp.Services.IOCDFeature) {
            this.location = {};
            if (!data || !data.annotations) return;
            if (data.formatted) this.location.title = data.formatted;

            // Set address
            if (data.components) {
                if (data.components.postcode) this.location.postcode = data.components.postcode;
                if (data.components.city) this.location.city = data.components.city;
                if (data.components.neighbourhood) this.location.neighbourhood = data.components.neighbourhood;
                if (data.components.road || data.components.pedestrian) {
                    this.location.address = data.components.road || data.components.pedestrian;
                    if (data.components.house_number) this.location.address += ` ${data.components.house_number}`;
                    this.location.streetViewUrlThumb = `${this.streetViewUrl}?size=200x200&location=${this.location.address},${this.location.city}&key=${this.$scope.data.streetViewApiKey}`;
                    this.location.streetViewUrlFull = `${this.streetViewUrl}?size=640x640&location=${this.location.address},${this.location.city}&key=${this.$scope.data.streetViewApiKey}`;
                }
            }

            // Set locations
            this.location.locations = [];
            if (data.annotations.DMS) this.location.locations.push(`DMS latitude: ${data.annotations.DMS.lat}, longitude: ${data.annotations.DMS.lng}`);
            if (data.geometry) this.location.locations.push(`WGS84 latitude: ${(<any>data.geometry).lat}, longitude: ${(<any>data.geometry).lng}`);
            if (data.annotations.MGRS) this.location.locations.push(`MGRS: ${data.annotations.MGRS}`);
            if (data.annotations.Mercator) this.location.locations.push(`Mercator x: ${data.annotations.Mercator.x}, y: ${data.annotations.Mercator.y}`);
            if (this.location.locations.length > 0) this.selectedLocationFormat = this.location.locations[0];

            // Set sunrise and sunset
            if (data.annotations.sun) {
                let sunrise = new Date(data.annotations.sun.rise.apparent * 1000);
                this.location.sunrise = String.format('{0:HH}:{0:mm}:{0:ss}', sunrise);
                let sunset = new Date(data.annotations.sun.set.apparent * 1000);
                this.location.sunset = String.format('{0:HH}:{0:mm}:{0:ss}', sunset);
            }
        }

        private close() {
            this.location = {};
            this.parentWidget.hide();
        }
    }
}
