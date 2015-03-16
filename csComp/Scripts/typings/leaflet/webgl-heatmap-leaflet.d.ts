declare module L {
    module TileLayer {
        export class WebGLHeatMap implements ILayer {
            constructor(options: any); 

            /**
            * Adds the overlay to the map.
            */
            addTo(map: Map): ImageOverlay;
    
            /**
              * Sets the opacity of the overlay.
              */
            setOpacity(opacity: number): ImageOverlay;
    
            /**
              * Brings the layer to the top of all overlays.
              */
            bringToFront(): ImageOverlay;
    
            /**
              * Brings the layer to the bottom of all overlays.
              */
            bringToBack(): ImageOverlay;

            /**
              * Should contain code that creates DOM elements for the overlay, adds them
              * to map panes where they should belong and puts listeners on relevant map events.
              * Called on map.addLayer(layer).
              */
            onAdd(map: Map): void;
    
            /**
              * Should contain all clean up code that removes the overlay's elements from
              * the DOM and removes listeners previously added in onAdd. Called on map.removeLayer(layer).
              */
            onRemove(map: Map): void;
            scale(latlng: L.LatLng, radiusInMeter?: number): number;
            addDataPoint(lat: number, lon: number, intensity: number, radius?: number): void;
        }
    }
}