module csComp.Services
{
    declare var Cesium;

    export class CesiumRenderer implements IMapRenderer
    {
        title = "cesium";
        service : LayerService;
        viewer : any;
        camera : any;
        scene  : any;
        features: { [key: string]: any } = {};

        public init(service : LayerService){
            this.service = service;
        }

        public enable()
        {
            this.viewer = new Cesium.Viewer('map');
            this.camera = this.viewer.camera;
            this.scene  = this.viewer.scene;


            this.camera.setView({
                position : Cesium.Cartesian3.fromDegrees(5, 52, 1000000)
            });

            //console.log('project:');
            //console.log(this.service.project.features);
            for (var i = 0; i < this.service.project.features.length; ++i)
                this.addFeature(this.service.project.features[i]);

            $(".cesium-viewer-toolbar").hide();
        }

        public disable()
        {
            this.viewer.destroy();
            //$("#map").empty();
        }

        public addLayer(layer: ProjectLayer)
        {
            //alert('addLayer called: ' + layer.type);
            switch(layer.type.toUpperCase()) {
                case "GEOJSON":
                case "DYNAMICGEOJSON":
                    layer.data.features.forEach((f: IFeature) => {
                        this.addFeature(f);
                    });

                break;
                case "WMS":
                    var wms_layer = this.scene.globe.imageryLayers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
                        url : layer.url,
                        layers: layer.wmsLayers,
                        parameters: {
                          format: 'image/png',
                          transparent: true,
                        }
                    }));
                    wms_layer.alpha = layer.opacity / 100;
                break;

                default:
                    alert('unknown layertype: ' + layer.type);
                break;

            }
        }

        public removeLayer(layer: ProjectLayer)
        {
            alert('removeLayer called: ' + layer.type);
            if (layer.type.toUpperCase() === "GEOJSON")
            {
                var object:any = <Object> layer.data;
                console.log(object);

                object.features.forEach((f: IFeature) => {
                    this.removeFeature(f);
                });

            }
        }

        public updateMapFilter(group : ProjectGroup) {}

        public addGroup(group: ProjectGroup) { }

        public removeGroup(group: ProjectGroup) { }


        public removeFeature(feature: IFeature)
        {
            console.log('removeFeature called');
            this.viewer.entities.remove(feature.id);
            //if (this.features.hasOwnProperty(feature.id)) {
            //    this.viewer.dataSources.remove(this.features[feature.id]);
            //    delete this.features[feature.id];
            //}
        }

        public updateFeature( feature : IFeature)
        {
            //console.log('updateFeature called', feature);
            //this.removeFeature(feature);
            this.addFeature(feature);
        }

        public addFeature(feature: IFeature)
        {
            var entity = this.createFeature(feature);
        }

        public createFeature(feature: IFeature) {
            var entity = this.viewer.entities.getOrCreateEntity(feature.id);

            entity.name = feature.properties['Name'];

            // use 2D or 3D coordinates as a basis if we have one
            if (feature.geometry.coordinates.length === 2)
                entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
            else if (feature.geometry.coordinates.length === 3)
                entity.position = Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2]);

            // a billboard is an icon for a feature
            entity.billboard = {
                image : feature.fType.style.iconUri,
                color : Cesium.Color.WHITE,
                width : feature.fType.style.iconWidth,
                height : feature.fType.style.iconHeight
            };

            // if there is no icon, a PointGraphics object is used as a fallback mechanism
            entity.point = {
                pixelSize : 5,
                color : Cesium.Color.fromCssColorString(feature.effectiveStyle.fillColor),
                outlineColor : Cesium.Color.fromCssColorString(feature.effectiveStyle.strokeColor),
                outlineWidth : feature.effectiveStyle.strokeWidth,
            };

            //label for mouseover events
            entity.label = {
                text : entity.name,
                font : '12pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                pixelOffset : new Cesium.Cartesian2(0, 20),
                show : false
            };

            // add a 3D model if we have one
            if (feature.properties["model"] != "")
            {
              entity.model =  new Cesium.ModelGraphics({
                uri : feature.properties["model"],
                minimumPixelSize: 100
              });

              // Hide icon and point when we have a 3D model
              //entity.billboard.show = false;
              //entity.point.show = false;

              // account for rotation
              if (feature.properties["Track"] != "")
              {
                  //todo: account for current rotation
                  var headingQuaternion = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, -feature.properties["Track"] );

                  //entity.orientation = headingQuaternion;
              }


            }

            // onclick events
            if (feature.layer.type.toUpperCase() === "GEOJSON" || feature.layer.type.toUpperCase() === "DYNAMICGEOJSON")
            {
                var handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
                handler.setInputAction((movement) => {
                    var pickedObject = this.scene.pick(movement.position);
                    if (Cesium.defined(pickedObject) && (pickedObject.id === entity)) {
                        this.service.selectFeature(feature);
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
            if (feature.layer.type.toUpperCase() === "GEOJSON")
            {
                handler.setInputAction((movement) => {
                    var pickedObject = this.scene.pick(movement.endPosition);
                    if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
                        entity.label.show = true;
                    } else {
                        entity.label.show = false;
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            }
            return entity;
        }

    }
}
