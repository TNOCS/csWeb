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

    public addGroup(group : ProjectGroup) {
      // for clustering use a cluster layer
      if (group.clustering) {
          group.cluster = new L.MarkerClusterGroup({
              maxClusterRadius: group.maxClusterRadius || 80,
              disableClusteringAtZoom: group.clusterLevel || 0
          });
          this.service.map.map.addLayer(group.cluster);
      } else {
          group.vectors = new L.LayerGroup<L.ILayer>();
          this.service.map.map.addLayer(group.vectors);
      }
    }

    public addLayer(layer : ProjectLayer)
    {


      // create leaflet layers
      if (layer.group.clustering) {
          var markers = L.geoJson(layer.data, {
              pointToLayer: (feature, latlng) => this.service.addFeature(feature, latlng, layer),
              onEachFeature: (feature: IFeature, lay) => {
                  //We do not need to init the feature here: already done in style.
                  //this.initFeature(feature, layer);
                  layer.group.markers[feature.id] = lay;
                  lay.on({
                      mouseover: (a) => this.service.showFeatureTooltip(a, layer.group),
                      mouseout: (s) => this.service.hideFeatureTooltip(s)
                  });
              }
          });
          layer.group.cluster.addLayer(markers);
      } else {
          layer.mapLayer = new L.LayerGroup<L.ILayer>();
          this.service.map.map.addLayer(layer.mapLayer);

          var v = L.geoJson(layer.data, {
              onEachFeature : (feature: IFeature, lay) => {
                  //We do not need to init the feature here: already done in style.
                  //this.initFeature(feature, layer);
                  layer.group.markers[feature.id] = lay;
                  lay.on({
                      mouseover : (a) => this.service.showFeatureTooltip(a, layer.group),
                      mouseout  : (s) => this.service.hideFeatureTooltip(s),
                      mousemove : (d) => this.service.updateFeatureTooltip(d),
                      click     : ()  => this.service.selectFeature(feature)
                  });
              },
              style: (f: IFeature, m) => {

                  this.service.initFeature(f, layer);
                  //this.updateSensorData();
                  layer.group.markers[f.id] = m;
                  return this.service.style(f, layer);
              },
              pointToLayer                                 : (feature, latlng) => this.service.addFeature(feature, latlng, layer)
          });
          this.service.project.features.forEach((f                 : IFeature) => {
              if (f.layerId !== layer.id) return;
              var ft = this.service.getFeatureType(f);
              f.properties['Name'] = f.properties[ft.style.nameLabel];
          });
          layer.mapLayer.addLayer(v);
      }
    }

    public removeGroup(group : ProjectGroup) {}
    public addFeature(feature : IFeature) {}
    public removeFeature(feature : IFeature) {}
    public updateFeature(feature : IFeature) {}
  }
}
