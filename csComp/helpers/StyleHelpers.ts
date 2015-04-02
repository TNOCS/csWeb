module csComp.Helpers
{
  export function getColor(v: number, gs: csComp.Services.GroupStyle) {
      if (v > gs.info.sdMax) return gs.colors[gs.colors.length - 1];
      if (v < gs.info.sdMin) return gs.colors[0];
      //var bezInterpolator = chroma.interpolate.bezier(gs.colors);
      //var r = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
      var color = d3.scale.linear()
          .domain([gs.info.sdMin, gs.info.mean, gs.info.sdMax])
          .range(gs.colors);
      var hexColor = color(v).toString();
      return hexColor;
  }

  /**
  * Extract a valid color string, without transparency.
  */
  export function getColorString(color: string, defaultColor = '#f00') {
      if (!color) return defaultColor;
      if (color.length == 4 || color.length == 7) return color;
      if (color.length == 9) return '#' + color.substr(3, 6);
      return defaultColor;
  }
}
