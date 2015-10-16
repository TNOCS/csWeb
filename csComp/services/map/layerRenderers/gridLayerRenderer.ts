module csComp.Services {
    export class GridLayerRenderer {
        static render(service: LayerService, layer: ProjectLayer) {
            var legend: { val: number, color: string }[] = [];
            var levels = [0.1, 0.5, 1, 2, 3, 4, 5];
            for (let i = 0; i < levels.length; i++) {
                let level = levels[i];
                legend.push({ val: level, color: ColorExt.Utils.toColor(level, levels[0], levels[levels.length - 1], 180, 240) });
            }

            var gridParams = <IGridDataSourceParameters>layer.dataSourceParameters;

            var overlay = L.canvasOverlay(GridLayerRenderer.drawFunction, {
                data: layer.data,
                noDataValue: gridParams.noDataValue,
                topLeftLat: gridParams.startLat,
                topLeftLon: gridParams.startLon,
                deltaLat: gridParams.deltaLat,
                deltaLon: gridParams.deltaLon,
                min: gridParams.minThreshold,
                max: gridParams.maxThreshold,
                legend: legend,
                opacity: (layer.opacity) ? (+layer.opacity)/100 : 0.3
            });

            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(overlay);
        }

        static drawFunction(overlay: any, settings: L.IUserDrawSettings) {
            var map: L.Map = (<any>this)._map;
            var opt = settings.options,
                data = opt.data;

            if (!data) return;

            var row = data.length,
                col = data[0].length,
                size = settings.size,
                legend = opt.legend;

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
