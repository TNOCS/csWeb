/*
 Generic  Canvas Overlay for leaflet,
 Stanislav Sumbera, April , 2014

 - added userDrawFunc that is called when Canvas need to be redrawn
 - added few useful params for userDrawFunc callback
  - fixed resize map bug
  inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat

*/

module L {
    var CanvasOverlay = L.Class.extend({
        initialize: function(userDrawFunc, options) {
            this._userDrawFunc = userDrawFunc;
            Util.setOptions(this, options);
        },

        drawing: function(userDrawFunc) {
            this._userDrawFunc = userDrawFunc;
            return this;
        },

        params: function(options) {
            Util.setOptions(this, options);
            return this;
        },

        canvas: function() {
            return this._canvas;
        },

        redraw: function() {
            if (!this._frame) {
                this._frame = (<any>L.Util).requestAnimFrame(this._redraw, this);
            }
            return this;
        },

        onAdd: function(map) {
            this._map = map;
            this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');

            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;
            this._context = this._canvas.getContext("2d");

            this._popup = null;

            this.onMouseMoveDelay = _.debounce((evt) => {
                var pos = this._getCanvasPos();
                var rgb = this._context.getImageData(evt.x - pos.left, evt.y - pos.top, 1, 1).data;
                if ((rgb[0] + rgb[1] + rgb[2]) > 0) {
                    var hexColor = ColorExt.Utils.rgbToHex([rgb[0],rgb[1],rgb[2]]);
                    var content = '<table>' + '<td>Color: '+ hexColor + '</td></tr>' + '</table>';
                    if (this._popup != null) {
                        this._popup.setLatLng(this._map.containerPointToLatLng(new L.Point(evt.x, evt.y))).setContent(content);
                    } else {
                        this._popup = L.popup({
                            offset: new L.Point(-25, -15),
                            closeOnClick: true,
                            autoPan: false,
                            className: 'featureTooltip'
                        }).setLatLng(this._map.containerPointToLatLng(new L.Point(evt.x, evt.y))).setContent(content).openOn(this._map);
                    }
                } else {
                    this._map.closePopup(this._popup);
                    this._popup = null;
                }
                console.log('mousemoved ' + evt.x + ', ' + evt.y + ',  color: R' + rgb[0] + ' G' + rgb[1] + ' B' + rgb[2]);
            }, 250);

            this._canvas.addEventListener('mousemove', this.onMouseMoveDelay);

            var animated = this._map.options.zoomAnimation && (<any>L.Browser).any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

            map._panes.overlayPane.appendChild(this._canvas);

            map.on('moveend', this._reset, this);
            map.on('resize', this._resize, this);

            if (map.options.zoomAnimation && (<any>L.Browser).any3d) {
                map.on('zoomanim', this._animateZoom, this);
            }

            this._reset();
        },

        onRemove: function(map) {
            map.getPanes().overlayPane.removeChild(this._canvas);

            map.off('moveend', this._reset, this);
            map.off('resize', this._resize, this);

            this._canvas.removeEventListener('mousemove', this.onMouseMoveDelay);
            map.closePopup(this._popup);
            this._popup = null;

            if (map.options.zoomAnimation) {
                map.off('zoomanim', this._animateZoom, this);
            }
            this._canvas = null;
        },

        addTo: function(map) {
            map.addLayer(this);
            return this;
        },

        _getCanvasPos: function() {
            var obj = this._canvas;
            var top = 0;
            var left = 0;
            while (obj.tagName != "BODY") {
                top += obj.offsetTop;
                left += obj.offsetLeft;
                obj = obj.offsetParent;
            }
            return {
                top: top,
                left: left
            };
        },

        _resize: function(resizeEvent) {
            this._canvas.width = resizeEvent.newSize.x;
            this._canvas.height = resizeEvent.newSize.y;
        },

        _reset: function() {
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._canvas, topLeft);
            this._redraw();
        },

        _redraw: function() {
            var size = this._map.getSize();
            var bounds = this._map.getBounds();
            var zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
            var zoom = this._map.getZoom();

            // console.time('process');

            if (this._userDrawFunc) {
                this._userDrawFunc(this,
                    {
                        canvas: this._canvas,
                        bounds: bounds,
                        size: size,
                        zoomScale: zoomScale,
                        zoom: zoom,
                        options: this.options
                    });
            }

            // console.timeEnd('process');
            this._frame = null;
        },

        _animateZoom: function(e) {
            var scale = this._map.getZoomScale(e.zoom),
                offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        }
    });

    export interface IUserDrawSettings {
        /** Canvas element for drawing */
        canvas: HTMLCanvasElement;
        /** Bounds of the map in WGS84 */
        bounds: L.Bounds;
        /** Size of the map in pixels in x and y direction */
        size: {
            x: number;
            y: number;
        };
        /** Zoom scale, e.g. 0.0026 */
        zoomScale: number;
        /** Zoom level, e.g. 12 */
        zoom: number;
        options: {
            // Grid data values
            data: number[][],
            // Values that must be ignored
            noDataValue: number,
            topLeftLat: number,
            topLeftLon: number,
            deltaLat: number,
            deltaLon: number,
            /** The minimum data value: below (<) this value, the cell is not drawn */
            min?: number,
            /** The maximum data value: above (>) this value, the cell is not drawn */
            max?: number,
            /** A value between 0 (transparent) and 1 (opaque) */
            opacity?: number,
            legend?: { val: number, color: string }[],
            [key: string]: any
        }
    }

    export function canvasOverlay(userDrawFunc: (overlay: any, settings: IUserDrawSettings) => void, options: Object) {
        return new CanvasOverlay(userDrawFunc, options);
    };
}
