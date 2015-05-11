module LayersDirective {
    export interface ILayersDirectiveScope extends ng.IScope {
        vm: LayersDirectiveCtrl;
        options : Function;
    }

    export class LayersDirectiveCtrl {
        private scope: ILayersDirectiveScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'

        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : ILayersDirectiveScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService : csComp.Services.MessageBusService)
        {
            $scope.vm = this;
            $scope.options = ((layer : csComp.Services.ProjectLayer)=>{
              if (!layer.enabled) return null;
              if (layer.layerSource)
              {
                return layer.layerSource.layerMenuOptions(layer);
              }
          });
          
        }

        public openLayerMenu(e)
        {
          //e.stopPropagation();
          (<any>$('.left-menu')).contextmenu( 'show', e );
          //alert('open layers');
        }

        public toggleLayer(layer: csComp.Services.ProjectLayer): void {
          $(".left-menu" ).on( "click", function( clickE ) {
            //alert('context menu');
            (<any>$( this )).contextmenu( { x: clickE.offsetX, y: clickE.offsetY } );
          } );
            //layer.enabled = !layer.enabled;
			//if (this.$layerService.loadedLayers.containsKey(layer.id)) {
            // Unselect when dealing with a radio group, so you can turn a loaded layer off again.
            if (layer.group.oneLayerActive && this.$layerService.findLoadedLayer(layer.id)) layer.enabled = false;
            if (layer.enabled) {
                this.$layerService.addLayer(layer);
            } else {
                this.$layerService.removeLayer(layer);
            }

            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }
    }
}
