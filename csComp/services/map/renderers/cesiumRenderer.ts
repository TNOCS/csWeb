module csComp.Services
{

  declare var Cesium;

  export class CesiumRenderer implements IMapRenderer
  {

    title = "cesium";
    service : LayerService;
    viewer : any;
    camera : any;

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

      //console.log(this.service.project);
      $(".cesium-viewer-toolbar").hide();


    }
    public disable()
    {
      this.viewer.destroy();
      //$("#map").empty();
    }

    public addLayer(layer : ProjectLayer)
    {
      if (layer.type == "GeoJson")
      {
        var object:any = <Object> layer.data;
        if (object.type == null)
          object.type = "FeatureCollection";

        var geoJSONPromise = Cesium.GeoJsonDataSource.load(object);

        Cesium.when(geoJSONPromise, function(dataSource)
        {
          layer.cesiumDatasource = dataSource;
        });

        this.viewer.dataSources.add(geoJSONPromise);
      }
      if (layer.type == "wms")
      {
        //todo
      }
    }

    public removeLayer(layer : ProjectLayer)
    {
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
    public createFeature( feature : IFeature) {}
    public removeFeature( feature : IFeature) {}
    public updateFeature( feature : IFeature) {

    }
  }
}
