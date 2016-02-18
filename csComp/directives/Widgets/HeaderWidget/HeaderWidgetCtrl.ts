module HeaderWidget {
    export class HeaderWidgetData {
        title: string;
        subTitle : string;
        autoShow : boolean;
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

    export interface IHeaderWidgetScope extends ng.IScope {
        vm: HeaderWidgetCtrl;
        data: HeaderWidgetData;
        minimized: boolean;
    }

    export class HeaderWidgetCtrl {
        private scope: IHeaderWidgetScope;
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
            private $scope: IHeaderWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            if (this.widget.data)
            {
                $scope.data = <HeaderWidgetData>this.widget.data;
                $scope.data.mdText = $scope.data.content;
                if ($scope.data.autoShow) this.showContent();
            }
            
            
            this.dataProperties = {};

            this.parentWidget = $('#' + this.widget.elementId).parent();

           
        }
        
        public showContent()
        {
            var rpt = csComp.Helpers.createRightPanelTab('headerinfo', 'infowidget', this.$scope.data, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'question');
            this.$messageBus.publish('rightpanel', 'activate', rpt);
            this.$layerService.visual.rightPanelVisible = true; // otherwise, the rightpanel briefly flashes open before closing.
        }

       
    }

}
