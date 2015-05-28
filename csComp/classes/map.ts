module csComp.Services
{
  export var availableZoomLevels  = [
      { title: "decades",      value: 315360000000 },
      { title: "years",        value: 31536000000 },
      { title: "weeks",        value: 604800000 },
      { title: "days",         value: 86400000 },
      { title: "hours",        value: 3600000 },
      { title: "quarters",     value: 900000 },
      { title: "minutes",      value: 60000 },
      { title: "seconds",      value: 1000 },
      { title: "milliseconds", value: 1 }
  ];

  export interface IMapRenderer {
      title: string;
      init(service: LayerService);
      enable();
      disable();
      addGroup(group: ProjectGroup);
      addLayer(layer: ProjectLayer);
      removeGroup(group: ProjectGroup);
      createFeature(feature: IFeature);
      removeFeature(feature: IFeature);
      updateFeature(feature: IFeature);
      addFeature(feature: IFeature);
      removeLayer(layer : ProjectLayer);
      updateMapFilter(group: ProjectGroup);
      changeBaseLayer(layer: BaseLayer);
      getZoom();
  }
}
