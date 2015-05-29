module csComp.Services {
    'use strict'

    export interface IGridDataSourceParameters extends IProperty {
        /**
         * Grid type, for example 'custom' (default) or 'esri' ASCII Grid
         */
        gridType: string,
        /**
         * Projection of the ESRI ASCII GRID
         */
        projection: string,
        /**
         * Property name of the cell value of the generated json.
         */
        propertyName: string,
        /**
         * Skip a comment line when it starts with this character
         */
        commentCharacter?: string,
        /**
         * Character that separates cells. Default is space.
         */
        separatorCharacter?: string,
        /**
         * Skip a number of lines from the start.
         */
        skipLines?: number,
        /**
         * Skip a number of lines after a comment block ends.
         */
        skipLinesAfterComment?: number,
        /**
         * Skip a number of spaces from the start of the line.
         */
        skipSpacesFromLine?: number,
        /**
         * Number of grid columns.
         */
        columns: number,
        /**
         * Number of grid rows.
         */
        rows: number,
        /**
         * Start latitude in degrees.
         */
        startLat: number,
        /**
         * Start longitude in degrees.
         */
        startLon: number,
        /**
         * Add deltaLat after processing a grid cell.
         * NOTE: When the direction is negative, use a minus sign e.g. when counting from 90 to -90..
         */
        deltaLat: number,
        /**
         * Add deltaLon degrees after processing a grid cell.
         */
        deltaLon: number,
        /**
         * Skip a first column, e.g. containing the latitude degree.
         */
        skipFirstColumn?: boolean,
        /**
         * Skip a first row, e.g. containing the longitude degree.
         */
        skipFirstRow?: boolean,
        /**
         * When the cell value is below this threshold, it is ignored.
         */
        minThreshold?: number,
        /**
        * When the cell value is above this threshold, it is ignored.
         */
        maxThreshold?: number,
        /**
         * The input values to be NoData in the output raster. Optional. Default is -9999.
         */
        noDataValue: number
    }

    /**
     * A GRID data source is a raster or grid in which the grid cells are delimited by spaces
     * and each newline indicates a new row of data.
     */
    export class GridDataSource extends csComp.Services.GeoJsonSource {
        title = "grid";
        gridParams: IGridDataSourceParameters;

        constructor(public service: csComp.Services.LayerService) {
            super(service);
        }

        public addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            this.layer = layer;
            if (typeof layer.dataSourceParameters === 'undefined') {
                throw new Error("Undefined IGridData data property in GridDataSource.");
                return;
            }
            this.gridParams = <IGridDataSourceParameters> layer.dataSourceParameters;
            // Open a layer URL
            layer.isLoading = true;
            // get data

            $.get(layer.url, (result: string, status: string) => {
                // https://github.com/caolan/async#seriestasks-callback
                async.series([
                    (cb) => {
                        layer.count = 0;
                        if (typeof this.gridParams.gridType !== 'undefined' && this.gridParams.gridType === 'esri') {
                            this.convertEsriHeaderToGridParams(result);
                        }
                        var data = this.convertDataToGeoJSON(result, this.gridParams);

                        // store raw result in layer
                        layer.data = <any>data.fc;
                        //layer.description = data.desc;

                        if (layer.data.geometries && !layer.data.features) {
                            layer.data.features = layer.data.geometries;
                        }
                        layer.data.features.forEach((f) => {
                            this.service.initFeature(f, layer);
                        });

                        layer.isLoading = false;
                        cb(null, null);
                    },
                    () => {
                        callback(layer);
                    }
                ]);
            });
        }

        /**
         * Convert the ESRI ASCII GRID header to grid parameters.
         *
ESRI ASCII Raster format
The ESRI ASCII raster format can be used to transfer information to or from other cell-based or raster systems. When an existing raster is output to an ESRI ASCII format raster, the file will begin with header information that defines the properties of the raster such as the cell size, the number of rows and columns, and the coordinates of the origin of the raster. The header information is followed by cell value information specified in space-delimited row-major order, with each row seperated by a carraige return.
In order to convert an ASCII file to a raster, the data must be in this same format. The parameters in the header part of the file must match correctly with the structure of the data values.
The basic structure of the ESRI ASCII raster has the header information at the beginning of the file followed by the cell value data:
    NCOLS xxx
    NROWS xxx
    XLLCENTER xxx | XLLCORNER xxx
    YLLCENTER xxx | YLLCORNER xxx
    CELLSIZE xxx
    NODATA_VALUE xxx
    row 1
    row 2
    ...
    row n
*
Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
Header format
The syntax of the header information is a keyword paired with the value of that keyword. The definitions of the kewords are:
*
Parameter	Description	Requirements
NCOLS	Number of cell columns.	Integer greater than 0.
NROWS	Number of cell rows.	Integer greater than 0.
XLLCENTER or XLLCORNER	X coordinate of the origin (by center or lower left corner of the cell).	Match with Y coordinate type.
YLLCENTER or YLLCORNER	Y coordinate of the origin (by center or lower left corner of the cell).	Match with X coordinate type.
CELLSIZE	Cell size.	Greater than 0.
NODATA_VALUE	The input values to be NoData in the output raster.	Optional. Default is -9999.
Data format
The data component of the ESRI ASCII raster follows the header information.
Cell values should be delimited by spaces.
No carriage returns are necessary at the end of each row in the raster. The number of columns in the header determines when a new row begins.
Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
         */
        private convertEsriHeaderToGridParams(data: string) {
            const regex = /(\S*)\s*([\d\.]*)/;

            var lines = data.split('\n', 6);
            var x: number,
                y: number;

            var isCenter = false;
            this.gridParams.skipLines = 0;
            lines.forEach(line => {
                var matches = line.match(regex);
                if (matches.length !== 3) return;
                this.gridParams.skipLines++;
                var value = +matches[2];
                switch (matches[1].toLowerCase()) {
                    case 'ncols':
                        // Number of cell columns. Integer greater than 0.
                        this.gridParams.columns = value;
                        break;
                    case 'nrows':
                        // Number of cell rows. Integer greater than 0.
                        this.gridParams.rows = value;
                        break;
                    case 'xllcorner':
                        x = value;
                        // X coordinate of the origin (by lower left corner of the cell).
                        break;
                    case 'yllcorner':
                        y = value;
                        // Y coordinate of the origin (by lower left corner of the cell).
                        break;
                    case 'xllcenter':
                        // X coordinate of the origin (by center corner of the cell).
                        x = value;
                        isCenter = true;
                        break;
                    case 'yllcenter':
                        // Y coordinate of the origin (by center corner of the cell).
                        y = value;
                        isCenter = true;
                        break;
                    case 'cellsize':
                        // Cell size. Greater than 0.
                        this.gridParams.deltaLon =  value;
                        this.gridParams.deltaLat = -value;
                        break;
                    case 'nodata_value':
                        // The input values to be NoData in the output raster. Optional. Default is -9999.
                        this.gridParams.noDataValue = value;
                        break;
                }
            });
            if (isCenter) {
                this.gridParams.startLon = x - this.gridParams.deltaLon / 2;
                this.gridParams.startLat = y - this.gridParams.deltaLat / 2;
            } else {
                this.gridParams.startLon = x;
                this.gridParams.startLat = y - this.gridParams.deltaLat;
            }

            switch (this.gridParams.projection || 'wgs84') {
                case 'wgs84':
                    break;
                default:
                    throw new Error('Current projection is not supported!')
                    break;
            }
        }

        /**
         * Convert data to GeoJSON.
         */
        private convertDataToGeoJSON(data: string, gridParams: IGridDataSourceParameters): {fc: csComp.Helpers.IGeoFeatureCollection, desc: string} {
            var propertyName = gridParams.propertyName || "v";
            var noDataValue  = gridParams.noDataValue || -9999;

            var skipLinesAfterComment = gridParams.skipLinesAfterComment,
                skipSpacesFromLine    = gridParams.skipSpacesFromLine,
                skipFirstRow          = gridParams.skipFirstRow || false,
                skipFirstColumn       = gridParams.skipFirstColumn || false;

            var separatorCharacter    = gridParams.separatorCharacter || ' ',
                splitCellsRegex       = new RegExp("[^"+ separatorCharacter +"]+","g");

            var deltaLon = gridParams.deltaLon,
                deltaLat = gridParams.deltaLat,
                lat = gridParams.startLat,
                lon = gridParams.startLon;

            var features: csComp.Helpers.IGeoFeature[] = [];

            var lines = data.split('\n');
            if (gridParams.skipLines) lines.splice(0, gridParams.skipLines);

            var rowsToProcess = gridParams.rows || Number.MAX_VALUE;
            lines.forEach((line) => {
                if (gridParams.commentCharacter)
                    if (line.substr(0, 1) === gridParams.commentCharacter) {
                        console.log(line);
                        return;
                    }

                if (skipLinesAfterComment && skipLinesAfterComment > 0) {
                    skipLinesAfterComment--;
                    return;
                }

                if (skipFirstRow) {
                    skipFirstRow = false;
                    return;
                }
                rowsToProcess--;
                if (rowsToProcess < 0) return;

                var cells: RegExpMatchArray;
                if (skipSpacesFromLine)
                    cells = line.substr(skipSpacesFromLine).match(splitCellsRegex);
                else
                    cells = line.match(splitCellsRegex);

                if (skipFirstColumn && cells.length > 1) cells = cells.splice(1);

                if (!cells || (!gridParams.skipFirstColumn && cells.length < gridParams.columns)) return;

                lon = gridParams.startLon;
                var minThreshold = gridParams.minThreshold || Number.MIN_VALUE,
                    maxThreshold = gridParams.maxThreshold || Number.MAX_VALUE;
                cells.forEach((n) => {
                    var value = +n;
                    if (value !== noDataValue && minThreshold <= value && value <= maxThreshold) {
                        var tl = [lon, lat + deltaLat],
                            tr = [lon + deltaLon, lat + deltaLat],
                            bl = [lon, lat],
                            br = [lon + deltaLon, lat],
                            result: IProperty = { };
                            result[propertyName] = value;

                        var pg = csComp.Helpers.GeoExtensions.createPolygonFeature([[tl, tr, br, bl, tl]], result);
                        features.push(pg);
                    }
                    lon += deltaLon;
                });
                lat += deltaLat;
            });

            var desc = "# Number of features above the threshold: " + features.length + ".\r\n";
            return {
                fc: csComp.Helpers.GeoExtensions.createFeatureCollection(features),
                desc: desc
            };
        }
    }
}
