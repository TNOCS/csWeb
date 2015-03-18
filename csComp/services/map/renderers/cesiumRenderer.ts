module csComp.Services
{

  declare var Cesium;

  export class CesiumRenderer implements IMapRenderer
  {

    title = "cesium";
    service : LayerService;
    viewer : any;

    public init(service : LayerService){
      this.service = service;
    }

    public enable()
    {
      this.viewer = new Cesium.Viewer('map');
      $(".cesium-viewer-toolbar").hide();

    }
    public disable()
    {
      this.viewer.destroy();
      //$("#map").empty();

    }

    public addLayer(layer : ProjectLayer)
    {
       this.viewer.dataSources.add(Cesium.GeoJsonDataSource.load(layer.url));
    }

    public removeLayer(layer : ProjectLayer)
    {

    }


    public updateMapFilter(group : ProjectGroup) {}
    public addGroup(group : ProjectGroup) {}
    public removeGroup(group : ProjectGroup) {}
    public addFeature( feature : IFeature) {}
    public removeFeature( feature : IFeature) {}
    public updateFeature( feature : IFeature) {

    }
  }
}
