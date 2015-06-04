= Grid-based heatmap algorithm =

== Introduction ==

Normally, a heatmap represents a map where the density of an item is depicted. So where we have many items of type x, the area is colored red (or orange, yellow green when the density decreases). However, in this case we wish to create a heatmap that represents the ideality of a location: based on certain criteria, color an area, thereby assuming that the presence of a certain feature on the map has a positive of negative influence on that area. For an example of a server-side solution, see geotrellis.io. 

The difference with a multi-criteria analysis (MCA) is that in an MCA, we compute the ideality of the item itself, and in an ideality map, we compute the ideality of an area on the map.   

== Algorithm ==

Compute a heatmap a uniform grid for the heatmap (heigth = width in meters of a cell, but not uniform in degrees lat/lon) on the map

For example, at 50 degrees latitude, one degree is:
lat 111229.03 meter (North-South)
lon  71695.73 meter (East-West)

At 57 degrees latitude, one degree is:
lat 111359.83 meter (North-South)
lon  60772.16 meter (East-West)

As you can see, there especially is a big difference in the width (East-West) of a grid cell when moving North. 

1. Determine the map extent
2. Determine the height in meter -> choose a grid cell size which covers the extent (max 100? rows)
3. For every selected HeatmapItem, compute a matrix [i j weighted_intensity], where i and j are indexes in a grid cell relative to the centre of the spot, and the intensity is:

	* for i=j=0 is the average intensity between the centre and the border of the grid 
	* for all other i,j is the intensity based on the distance between the centre and the centre of the current cell
	* the weighted intensity is the computed intensity * weight / scale
	* the scale is a relative factor: when scale is 5, it means that we need 5 spots at the ideal distance in a grid cell (we don't want to reach a maximum intensity when one item is at the ideal distance.)

4. Expand the extent by x meters in each direction (so we will include features just outside the border too), where x is determined by the HeatmapItem with the largest radius of influence.
5. For every feature within the expanded extent, add the intensity to the grid matrix (also [i j total_intensity])
6. Compute a color scale, mapping total_intensity (in the range [-1 1]) to a color [red white blue], where white reresents 0. In case the total_intensity exceeds the range, cap it to [-1 1]. Alternatively, first compute the max and min, and map them to blue and red respectively, where a value of 0 indicates transparent.  
6. Create a GeoJSON grid, where each height and width are equal to the grid cell size (this means that the longitude angle will be wider when moving North), and whose color is determined by the grid matrix's total_intensity value. In case the total_intensity is 0 (or a very small value), ignore the cell and don't add it to the GeoJSON grid.

When panning or zooming in/out, recalculate the grid, and replace the current grid when you are done.