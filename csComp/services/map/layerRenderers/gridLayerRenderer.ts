module csComp.Services {
    export class GridLayerRenderer {
        static render(service: LayerService, layer: ProjectLayer) {

            var gridParams = <IGridDataSourceParameters>layer.dataSourceParameters;

            var legend: { val: number, color: string }[] = [];
            var levels;
            if (typeof gridParams.contourLevels === 'number') {
                levels = [];
                var nrLevels = <number>(gridParams.contourLevels);
                var dl = (gridParams.maxThreshold - gridParams.minThreshold) / nrLevels;
                for (let l = gridParams.minThreshold + dl / 2; l < gridParams.maxThreshold; l += dl) levels.push(Math.round(l * 10) / 10); // round to nearest decimal.
            } else {
                levels = gridParams.contourLevels;
            }

            // Create a new groupstyle. If no legend is provided, this style can be used to change the colors used to draw the grid.
            // If a legend is provided, that will be used as activelegend.
            var gs = new GroupStyle(service.$translate);
            gs.id = Helpers.getGuid();
            gs.title = (gridParams.legendDescription) ? gridParams.legendDescription : layer.title;
            gs.meta = null;
            gs.visualAspect = 'fillColor';
            gs.availableAspects = ['fillColor'];
            gs.info = { min: 0, max: 0, count: 0, mean: 0, varience: 0, sd: 0 };
            gs.fixedColorRange = true;
            gs.enabled = true;
            gs.group = layer.group;
            if (!gridParams.legend) {
                gs.property = 'gridlayer';
                gs.canSelectColor = true;
                gs.colors = [(gridParams.minColor) ? gridParams.minColor : '#0055FF', (gridParams.maxColor) ? gridParams.maxColor : '#FF5500'];
                gs.activeLegend = <Legend>{
                    legendKind: 'interpolated',
                    description: gs.title,
                    visualAspect: 'fillColor',
                    legendEntries: []
                }
            } else {
                gs.property = '';
                gs.canSelectColor = false;
                gs.colors = ['#ffffff', '#000000'];
                gs.activeLegend = <Legend>gridParams.legend;
                gs.activeLegend.legendEntries.forEach((le) => {
                    legend.push({val: le.value, color: le.color});
                })
            }
            service.saveStyle(layer.group, gs);

            var overlay = L.canvasOverlay(GridLayerRenderer.drawFunction, layer, {
                data: layer.data,
                noDataValue: gridParams.noDataValue,
                topLeftLat: gridParams.startLat,
                topLeftLon: gridParams.startLon,
                deltaLat: gridParams.deltaLat,
                deltaLon: gridParams.deltaLon,
                min: gridParams.minThreshold,
                max: gridParams.maxThreshold,
                minColor: gs.colors[0],
                maxColor: gs.colors[1],
                areColorsUpdated: false,
                levels: levels,
                legend: legend,
                opacity: (layer.opacity) ? (+layer.opacity) / 100 : 0.3
            });

            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(overlay);
        }

        static drawFunction(overlay: any, layer: ProjectLayer, settings: L.IUserDrawSettings) {
            var map: L.Map = (<any>this)._map;
            var opt = settings.options,
                data = opt.data;

            if (!data) return;

            var row = data.length,
                col = data[0].length,
                size = settings.size,
                legend = opt.legend;

            // update the legend when new from- and to-colors are chosen.
            // the complete color range of the legend will be calculated using the hue value of the from and to colors.
            if (legend.length === 0 || opt.areColorsUpdated) {
                legend = [];
                if (opt.minColor[0] !== '#') opt.minColor = ColorExt.Utils.colorNameToHex(opt.minColor);
                if (opt.maxColor[0] !== '#') opt.maxColor = ColorExt.Utils.colorNameToHex(opt.maxColor);
                let fromHue = ColorExt.Utils.rgbToHue(opt.minColor);
                let toHue = ColorExt.Utils.rgbToHue(opt.maxColor);
                for (let i = 0; i < opt.levels.length; i++) {
                    let level = opt.levels[i];
                    legend.push({ val: level, color: ColorExt.Utils.toColor(level, opt.levels[0], opt.levels[opt.levels.length - 1], fromHue, toHue) });
                }
                if (layer.group.styles && layer.group.styles.length > 0) {
                    layer.group.styles[0].activeLegend = <Legend>{
                        legendKind: 'interpolated',
                        description: layer.group.styles[0].title,
                        visualAspect: 'fillColor',
                        legendEntries: []
                    };
                    legend.forEach((i) => {
                        let legEntry = <LegendEntry>{ label: (<any>String).format(layer.dataSourceParameters['legendStringFormat'] || '{0:000}', i.val), value: i.val, color: i.color };
                        layer.group.styles[0].activeLegend.legendEntries.push(legEntry);
                    });
                }
                overlay.options.legend = opt.legend = legend;
                opt.areColorsUpdated = false;
            }

            var min = opt.min || Number.MIN_VALUE,
                max = opt.max || Number.MAX_VALUE;

            var topLeft = map.latLngToContainerPoint(new L.LatLng(opt.topLeftLat, opt.topLeftLon)),
                botRight = map.latLngToContainerPoint(new L.LatLng(opt.topLeftLat + row * opt.deltaLat, opt.topLeftLon + col * opt.deltaLon));

            var startX = topLeft.x,
                startY = topLeft.y,
                deltaX = (botRight.x - topLeft.x) / col,
                botOfFirstRow = map.latLngToContainerPoint(new L.LatLng(opt.topLeftLat + opt.deltaLat, opt.topLeftLon)),
                deltaY = botOfFirstRow.y - topLeft.y;

            var ctx = settings.canvas.getContext("2d");
            ctx.clearRect(0, 0, size.x, size.y);

            // Check the boundaries
            if (startX > size.x || startY > size.y || botRight.x < 0 || botRight.y < 0) {
                //console.log('Outside boundary');
                return;
            }
            var sJ = 0,
                eI = row,
                eJ = col;

            if (startX < -deltaX) {
                sJ = -Math.ceil(startX / deltaX);
                startX += sJ * deltaX;
            }
            if (botRight.x > size.x) {
                eJ -= Math.floor((botRight.x - size.x) / deltaX);
            }
            if (botRight.y > size.y && deltaY > 0) {
                eI -= Math.floor((botRight.y - size.y) / deltaY);
            }

            var noDataValue = opt.noDataValue;

            ctx.globalAlpha = opt.opacity || 0.3;

            console.time('process');
            var y = startY;
            var lat = opt.topLeftLat;// + sI * opt.deltaLat;
            for (var i = 0; i < eI; i++) {
                lat += opt.deltaLat;
                let botY = map.latLngToContainerPoint(new L.LatLng(lat, opt.topLeftLon)).y;
                deltaY = botY - y;
                if (y <= -deltaY || deltaY === 0) {
                    y = botY;
                    continue;
                }
                let x = startX;
                for (var j = sJ; j < eJ; j++) {
                    var cell = data[i][j];
                    if (cell === noDataValue || cell < min || cell > max) {
                        x += deltaX;
                        continue;
                    }
                    var closest = legend.reduce(function(prev, curr) {
                        return (Math.abs(curr.val - cell) < Math.abs(prev.val - cell) ? curr : prev);
                    });
                    ctx.fillStyle = closest.color;
                    ctx.fillRect(x, y, deltaX, deltaY);
                    x += deltaX;
                }
                y = botY;
            }
            console.timeEnd('process');
        }
    }
}
