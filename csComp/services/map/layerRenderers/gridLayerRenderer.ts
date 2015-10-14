module csComp.Services {
    export class GridLayerRenderer {
        static render(service: LayerService, layer: ProjectLayer) {
            var legend: { val: number, color: string }[] = [];
            var levels = [0.1, 0.5, 1, 2, 3, 4, 5];
            for (let i = 0; i < levels.length; i++) {
                let level = levels[i];
                legend.push({ val: level, color: ColorExt.Utils.toColor(level, levels[0], levels[levels.length - 1], 180, 240) });
            }

            var overlay = L.canvasOverlay(GridLayerRenderer.drawFunction, {
                // data: data,
                noDataValue: -9999,
                topLeftLat: 51.99990035800966,
                topLeftLon: 4.624149821641468,
                deltaLat: -0.0008877220420775024,
                deltaLon: 0.0014584581460220312,
                legend: legend,
                opacity: 0.6
            });

            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(overlay);

            // var wms: any = L.tileLayer.wms(layer.url, <any>{
            //     layers: layer.wmsLayers,
            //     opacity: layer.opacity / 100,
            //     format: 'image/png',
            //     transparent: true,
            //     attribution: layer.description,
            //     tiled: true
            // });
            // layer.mapLayer = new L.LayerGroup<L.ILayer>();
            // service.map.map.addLayer(layer.mapLayer);
            // layer.mapLayer.addLayer(wms);
            // wms.on('loading', (event) => {
            //     layer.isLoading = true;
            //     service.$rootScope.$apply();
            //     if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            // });
            // wms.on('load', (event) => {
            //     layer.isLoading = false;
            //     if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            // });
            // layer.isLoading = true;
        }

        static drawFunction(overlay: any, settings: L.IUserDrawSettings) {
            var map: L.Map = (<any>this)._map;
            var opt = settings.options,
                data = opt.data;

            var row = data.length,
                col = data[0].length,
                size = settings.size,
                legend = opt.legend;

            var topLeft = map.latLngToContainerPoint(new L.LatLng(opt.topLeftLat, opt.topLeftLon)),
                botRight = map.latLngToContainerPoint(new L.LatLng(opt.topLeftLat + row * opt.deltaLat, opt.topLeftLon + col * opt.deltaLon));

            var startX = topLeft.x,
                startY = topLeft.y,
                deltaX = (botRight.x - topLeft.x) / col,
                deltaY = (botRight.y - topLeft.y) / row;

            var ctx = settings.canvas.getContext("2d");
            ctx.clearRect(0, 0, size.x, size.y);

            // Check the boundaries
            if (startX > size.x || startY > size.y || botRight.x < 0 || botRight.y < 0) {
                //console.log('Outside boundary');
                return;
            }
            var sI = 0,
                sJ = 0,
                eI = row,
                eJ = col;

            if (startX < -deltaX) {
                sJ = -Math.ceil(startX / deltaX);
                startX += sJ * deltaX;
            }
            if (startY < -deltaY) {
                sI = -Math.ceil(startY / deltaY);
                //startY += sI * deltaY;
            }
            if (botRight.x > size.x) {
                eJ -= Math.floor((botRight.x - size.x) / deltaX);
            }
            if (botRight.y > size.y) {
                eI -= Math.floor((botRight.y - size.y) / deltaY);
            }

            //console.log(`Bounds: ${JSON.stringify(settings, null, 2)}`);
            var noDataValue = opt.noDataValue;

            ctx.globalAlpha = opt.opacity || 0.3;

            console.time('process');
            for (var i = sI; i < eI; i++) {
                let x = startX - deltaX;
                let y = startY + i * deltaY;
                for (var j = sJ; j < eJ; j++) {
                    x += deltaX;
                    var cell = data[i][j];
                    if (cell === noDataValue) continue;
                    var closest = legend.reduce(function(prev, curr) {
                        return (Math.abs(curr.val - cell) < Math.abs(prev.val - cell) ? curr : prev);
                    });
                    ctx.fillStyle = closest.color;
                    ctx.fillRect(x, y, deltaX, deltaY);
                }
            }
            console.timeEnd('process');
        }
    }
}
