module InfoWidget {
    
    /**
      * Config
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    } 

    /**
      * Directive to display the available map layers.
      */
    myModule.directive('infowidget', [function() : ng.IDirective {
            return {
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {
                },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/HeaderWidget/InfoWidget.tpl.html',
                replace      : true,    // Remove the directive from the DOM
                transclude   : false,   // Add elements and attributes to the template
                controller   : InfoWidgetCtrl
            }
        }
    ]);
    
    export class InfoWidgetData {
        title: string;
        subTitle : string;
        /**
         * Content to display: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: string;
        url: string;
        /**
         * Allows you to provide a link to a text file containing a list of properties (i.e. key-value pairs). When the keys
         * are stated in the markdown content (between curly braces {{KEY}}), they will be replaced by the value. 
         */
        dataSourceUrl: string;
        /**
         * Set true to use translate the content. To use it, create a separate file
         * for each language and add a pre-extension to the file corresponding to the language code, e.g.
         * data/mycontent.en.txt or data/mycontent.nl.txt . The url should then be "data/mycontent.txt"
         */
        useLanguagePrefix: boolean;
        /**
         * The actual content is being converted, if necessary, and set to the markdown text.
         */
        mdText: string;
        /**
         * If provided, indicates the feature type that needs to be selected in order to show the widget.
         */
        featureTypeName: string;
        /**
         * If provided, a list of properties that need to be injected into the content in order to generate the mdText.
         */
        dynamicProperties: string[];
    }

    export interface IInfoWidgetScope extends ng.IScope {
        vm: InfoWidgetCtrl;
        data: InfoWidgetData;
        minimized: boolean;
    }

    export class InfoWidgetCtrl {
        private scope: IInfoWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private dataProperties: { [key: string]: any };

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IInfoWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par;
            $scope.data = <InfoWidgetData>this.widget.data;
            if ($scope.data && $scope.data.content)
            {
                $scope.data.mdText = $scope.data.content;            
                this.parentWidget = $(`#${this.widget.elementId}-parent`);
            }

           
        }
        
        

       
    }

}
