module csComp.Services
{
    declare var Cesium;

    export class CesiumRenderer implements IMapRenderer
    {
        title = "cesium";
        service : LayerService;
        viewer : any;
        camera : any;
        features: { [key: string]: any } = {};

        public init(service : LayerService){
            this.service = service;
        }

        public enable()
        {
            this.viewer = new Cesium.Viewer('map');
            this.camera = this.viewer.camera;

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

        public addLayer(layer : ProjectLayer)
        {
            //alert('addLayer called');
            
            if (layer.type == "GeoJson")
            {
                var object:any = <Object> layer.data;
                
                if (object.type == null)
                    object.type = "FeatureCollection";

                var geoJSONPromise = Cesium.GeoJsonDataSource.load(object);

                Cesium.when(geoJSONPromise, (dataSource)=>
                {                
                    layer.cesiumDatasource = dataSource;                    
                });

                this.viewer.dataSources.add(geoJSONPromise);
            }
            if (layer.type == "dynamicgeojson")
            {
                var object : any = (<any>layer.data).features;
                
                //fix for some datasources with incomplete json
                if (object.type == null)
                    object.type = "FeatureCollection";

                //console.log('adding layer');
                //console.log(object);


                object.forEach((f: IFeature) => {
                    this.addFeature(f);
                });
            }
            if (layer.type == "wms")
            {
                //todo
            }
        }

        public removeLayer(layer : ProjectLayer)
        {
            alert('removelayer called');
            if (layer.type == "GeoJson")
            {
                this.viewer.dataSources.remove(layer.cesiumDatasource);
            }
            if (layer.type == "wms")
            {
                //todo
            }
        }


        public updateMapFilter(group : ProjectGroup) {}
        public addGroup(group : ProjectGroup) {}
        public removeGroup(group : ProjectGroup) {}

        public removeFeature( feature : IFeature)
        {
            if (this.features.hasOwnProperty(feature.id)) {
                this.viewer.dataSources.remove(this.features[feature.id]);
                delete this.features[feature.id];                
            }
        }

        public updateFeature( feature : IFeature)
        {          
            this.removeFeature(feature);
            this.addFeature(feature);
        }

        public addFeature(feature: IFeature)
        {
            //alert('addFeature called');
            //console.log('added feature:');
            //console.log(feature);
            //var entity = new Cesium.Entity({ id: feature.index, name: feature.featureTypeName, position: new Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.properties.Altitude) });
            //console.log('adding feature');
            //console.log(feature);

            //feature.coordinates = feature.coordinates
            //var entity = this.createEntity(feature);
 
            var dataSourcePromise = Cesium.GeoJsonDataSource.load(feature);
           
            Cesium.when(dataSourcePromise, (dataSource) => {

                //dataSource.entities.entities[0].billboard = null;
                //dataSource.entities.entities[0].model = new Cesium.ModelGraphics({ uri: '/models/plane.gltf', minimumPixelSize: 100 });
                

                this.features[feature.id] = dataSource;                
                this.viewer.dataSources.add(dataSource);
            });

        }

    
    }
}
