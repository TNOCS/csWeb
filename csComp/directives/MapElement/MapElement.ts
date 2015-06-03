  ﻿module MapElement{
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
      myModule.directive('map', [
          '$window', '$compile',
          function($window, $compile): ng.IDirective {
              return {
                  terminal: false, // do not compile any other internal directives
                  restrict: 'E', // E = elements, other options are A=attributes and C=classes
                  scope: {
                      mapid: '='
                  }, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                  //templateUrl: 'directives/MapElement/MapElement.tpl.html',
                  template: '<div id="map" tabindex="0" class="leaflet-container leaflet-touch leaflet-fade-anim" style="position:absolute"></div>',
                  link: (scope: any, element, attrs) => {
                      // Deal with resizing the element list
                    //   angular.element($window).bind('resize', () => {
                    //       //scope.onResizeFunction();
                    //       scope.$apply();
                    //   });

                      scope.mapid = attrs.mapid;
                      //var s = jQuery.parseJSON(attrs.param);
                      //scope.initDashboard();
                      scope.initMap();
                  },
                  replace:false,
                  transclude: true, // Add elements and attributes to the template
                  controller: MapElementCtrl
              }
          }
      ]);

}
