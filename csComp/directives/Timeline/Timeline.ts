module Timeline {

    // Interface describing the members that the provider's service offers
    // @seealso: http://www.software-architects.com/devblog/2014/10/24/AngularJS-Provider-in-TypeScript
    export interface ITimelineService {
        getTimelineOptions(): csComp.Services.ITimelineOptions;
        setTimelineOptions(options: csComp.Services.ITimelineOptions): void;
    }
<<<<<<< HEAD
 
=======

>>>>>>> layer-sources-renders
    // The following class represents the provider
    class TimelineService implements ng.IServiceProvider {
        private timelineOptions: csComp.Services.ITimelineOptions = {
            'width'   : '100%',
            'height'  : '100px',
            'editable': false,
            'layout'  : 'box'
        };
<<<<<<< HEAD
 
=======

>>>>>>> layer-sources-renders
        // Configuration function
        public setTimelineOptions(options: csComp.Services.ITimelineOptions) {
            this.timelineOptions = options;
        }
<<<<<<< HEAD
 
=======

>>>>>>> layer-sources-renders
        // Provider's factory function
        $get(): ITimelineService {
            return {
                getTimelineOptions: () => { return this.timelineOptions; },
                setTimelineOptions: (options: csComp.Services.ITimelineOptions) => { return this.setTimelineOptions; }
            };
        }
    }
<<<<<<< HEAD
 
=======

>>>>>>> layer-sources-renders

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
<<<<<<< HEAD
      * 
=======
      *
>>>>>>> layer-sources-renders
      * When turning of the event margins in app.ts (see below), also set the #focustimeContainer { bottom: 45px; }
      * $layerService.timelineOptions = {
      *     'width': '100%',
      *     "eventMargin": 0,
      *     "eventMarginAxis": 0,
      *     'editable': false,
      *     'layout': 'box'
      * };
      * @seealso: http://almende.github.io/chap-links-library/downloads.html
      */
<<<<<<< HEAD
    myModule 
        .provider('TimelineService', TimelineService) 
        .directive('timeline', [ 
            '$compile',
            function($compile): ng.IDirective { 
=======
    myModule
        .provider('TimelineService', TimelineService)
        .directive('timeline', [
            '$compile',
            function($compile): ng.IDirective {
>>>>>>> layer-sources-renders
                return {
                    terminal  : true, // do not compile any other internal directives
                    restrict  : 'E', // E = elements, other options are A=attributes and C=classes
                    scope     : {}, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
<<<<<<< HEAD
                    template  : html, // I use gulp automatian to compile the FeatureProperties.tpl.html to a simple TS file, FeatureProperties.tpl.ts, which contains the html as string. The advantage is that you can use HTML intellisence in the html file.
=======
                    templateUrl: 'directives/Timeline/Timeline.tpl.html',
>>>>>>> layer-sources-renders
                    compile   : el => { // I need to explicitly compile it in order to use interpolation like {{xxx}}
                        var fn = $compile(el);
                        return scope => {
                            fn(scope);
                        };
                    },
                    replace   : true, // Remove the directive from the DOM
                    transclude: true, // Add elements and attributes to the template
                    controller: TimelineCtrl
                }
            }
        ]);
}
