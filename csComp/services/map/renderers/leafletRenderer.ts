module csComp.Services
{
  export class LeafletRenderer implements IMapRenderer
  {

    title = "leaflet";
    service : LayerService;

    public init(service : LayerService){
      this.service = service;
    }

    public enable()
    {
      this.service.$mapService.map = L.map("map", {
      //var tl  = L.map("mapleft", {
          zoomControl: false,
          attributionControl: true
      });

    }
    public disable()
    {
      this.service.$mapService.map.remove();
      this.service.$mapService.map = null;
      $("#map").empty();

    }

    public addGroup(group : ProjectGroup) {}
    public removeGroup(group : ProjectGroup) {}
    public addFeature(feature : IFeature) {}
    public removeFeature(feature : IFeature) {}
    public updateFeature(feature : IFeature) {}
  }
}
