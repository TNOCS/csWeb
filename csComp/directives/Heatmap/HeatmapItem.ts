module Heatmap {
    /**
    * A simple interface to describe an item that can be used in a heatmap.
    * We either accept a FeatureType (e.g. Hospital or Shop), or a property that
    * is of type options (e.g. shop, magazine).
    */
    export interface IHeatmapItem {
        title          : string;
        featureType    : csComp.Services.IFeatureType;
        /**
         * In case we are not interested in the feature type itself, but in a certain property,
         * e.g. the property that determines what it represents like buildingFunction.
         * @type {string}
         */
        propertyTitle? : string;
        propertyLabel  : string;
        /**
         * When we are using an options property type, such as buildingFunction, we need
         * to indicate the particular option that we will evaluate.
         * @type {number}
         */
        optionIndex?   : number;
        /**
         * The user weight specifies how much you like this item, e.g. the maximum value.
         * @type {number}, range [-5..5].
         */
        userWeight     : number;
        /**
         * The weight specifies how much you like this item, relative to others.
         * @type {number}, range [-1..1].
         */
        weight         : number;
        /**
         * The ideality measure specifies how much you like this item with respect to its
         * distance.
         * @type {IIdealityMeasure}
         */
        idealityMeasure: IIdealityMeasure;
        isSelected    : boolean;
        intensityScale: number 

        reset(): void;
        setScale(latitude: number, longitude: number): void;
        calculateHeatspots(feature: csComp.Services.IFeature, cellWidth: number, cellHeight: number, horizCells: number, vertCells: number, mapBounds: L.LatLngBounds, paddingRatio: number) : IHeatspot[];
    }

    export class HeatmapItem implements IHeatmapItem {
        /**
        * 1 meter represents meterToLatDegree degrees in vertical direction.
        */
        private static meterToLatDegree: number;

        /**
        * 1 meter represents meterToLonDegree degrees in horizontal direction.
        */
        private static meterToLonDegree: number;

        /**
         * In case we are not interested in the feature type itself, but in a certain property,
         * e.g. the property that determines what it represents like buildingFunction.
         * @type {string}
         */
        propertyTitle       : string;
        propertyLabel       : string;
        /**
         * When we are using an options property type, such as buildingFunction, we need
         * to indicate the particular option that we will evaluate.
         * @type {number}
         */
        optionIndex         : number;
        /**
         * The user weight specifies how much you like this item, e.g. the maximum value.
         * @type {number}, range [-5..5].
         */
        userWeight = 1;
        /**
         * The weight specifies how much you like this item, relative to others.
         * @type {number}, range [-1..1].
         */
        weight = 0;
        /**
         * The ideality measure specifies how much you like this item with respect to its
         * distance.
         * @type {IIdealityMeasure}
         */
        idealityMeasure     : IIdealityMeasure = new IdealityMeasure();
        heatspots           : IHeatspot[] = [];
        /** Represents the number of items that are needed to obtain an ideal location. */
        isSelected = false;
        intensityScale = 1;
        private static twoPi: number = Math.PI * 2;

        constructor(public title: string, public featureType: csComp.Services.IFeatureType) {
            // TODO Needs improvement based on actual location
            this.setScale(52);
        }

        calculateHeatspots(feature: csComp.Services.Feature, cellWidth: number, cellHeight: number,
                horizCells: number, vertCells: number, mapBounds: L.LatLngBounds, paddingRatio: number) {
            // right type?
            if (!this.isSelected || this.featureType !== feature.fType) return null;
            if (this.heatspots.length === 0) this.calculateHeatspot(cellWidth, cellHeight);
            // create heatspot solely based on feature type?
            if (!this.propertyLabel) {
                return this.pinHeatspotToGrid(feature, horizCells, vertCells, mapBounds, paddingRatio);
            }
            // create heatspot based on the preferred option?
            if (feature.properties.hasOwnProperty(this.propertyLabel)
                && feature.properties[this.propertyLabel] === this.optionIndex) {
                return this.pinHeatspotToGrid(feature, horizCells, vertCells, mapBounds, paddingRatio);
            }
            return null;
        }

        /**
        * Calculate the intensity around the location. 
        * NOTE We are performing a relative computation around location (0,0) in a rectangular grid. 
        */
        private calculateHeatspot(cellWidth: number, cellHeight: number) {
            var maxRadius    = this.idealityMeasure.lostInterestDistance;
            var horizCells   = Math.floor(maxRadius / cellWidth);
            var vertCells    = Math.floor(maxRadius / cellHeight);
            var sCellSize    = cellWidth * cellHeight;
            var scaledWeight = this.weight * this.intensityScale;
            var arrayLength  = horizCells * vertCells;

            this.heatspots = new Array<IHeatspot>(arrayLength);
            this.heatspots.push(new Heatspot(0, 0, scaledWeight * this.idealityMeasure.atLocation));

            for (var i = -vertCells; i <= vertCells; i++) {
                for (var j = -horizCells; j <= horizCells; j++) {
                    var radius = Math.sqrt(i * i * sCellSize + j * j * sCellSize);
                    var weightedIntensity = scaledWeight * this.idealityMeasure.computeIdealityAtDistance(radius);
                    if (!(i == 0 && j == 0) && weightedIntensity != 0) {
                        this.heatspots.push(new Heatspot(i, j, weightedIntensity));
                        //console.log('Add spot at ' + i + ', ' + j + ' with intensity ' + weightedIntensity);
                    }
                }
            }

            //var latRadius = radius * HeatmapItem.meterToLatDegree; 
            //var lonRadius = radius * HeatmapItem.meterToLonDegree; 
            
            //for (var lat = -latRadius; lat < latRadius; lat += deltaLatDegree) {
            //    for (var lon = -lonRadius; lat < lonRadius; lat += deltaLonDegree) {
            //        // TODO Compute radius
            //        var intensity = this.idealityMeasure.computeIdealityAtDistance(radius);
            //        this.heatspots.push(new Heatspot(lat, lon, this.weight * intensity.ideality));
            //    }
            //}
            //var count = 0;
            //while (count++ < 200) {
            //    var radius    = Math.random() * this.idealityMeasure.lostInterestDistance;
            //    var latRadius = radius * HeatmapItem.meterToLatDegree; 
            //    var lonRadius = radius * HeatmapItem.meterToLonDegree; 
            //    var angleRad  = Math.random() * HeatmapItem.twoPi;
            //    var lat       = Math.sin(angleRad) * latRadius;
            //    var lon       = Math.cos(angleRad) * lonRadius;
            //    var intensity = this.idealityMeasure.computeIdealityAtDistance(radius);
            //    this.heatspots.push(new Heatspot(lat, lon, this.weight * intensity.ideality, intensity.radius));
            //}

            //var twoPi: number = Math.PI * 2;
            //var lat = 0,
            //    lon = 0;
            //// add start point
            //this.heatspots.push(new Heatspot(lat, lon, this.weight * this.idealityMeasure.atLocation));
            //// halfway between start and ideal location
            //var stepSize  = Math.PI / 2;
            //var radius    = this.idealityMeasure.idealDistance / 2;
            //var latRadius = radius * HeatmapItem.meterToLatDegree; 
            //var lonRadius = radius * HeatmapItem.meterToLonDegree; 
            //var itensity  = 0.5 * this.weight;
            //for (var i = Math.PI / 4; i < twoPi; i += stepSize) {
            //    lat = Math.sin(i) * latRadius;
            //    lon = Math.cos(i) * lonRadius;
            //    this.heatspots.push(new Heatspot(lat, lon, itensity));
            //}
            //// At ideal distance
            //stepSize /= 2;
            //radius = this.idealityMeasure.idealDistance;
            //latRadius = radius * HeatmapItem.meterToLatDegree;
            //lonRadius = radius * HeatmapItem.meterToLonDegree; 
            //itensity = this.weight;
            //for (var i = 0; i < twoPi; i += stepSize) {
            //    lat = Math.sin(i) * latRadius;
            //    lon = Math.cos(i) * lonRadius;
            //    this.heatspots.push(new Heatspot(lat, lon, itensity));
            //}
            //// At ring halfway between ideal distance and no interest
            //stepSize /= 2;
            //radius   += (this.idealityMeasure.lostInterestDistance - this.idealityMeasure.idealDistance) / 2;
            //latRadius = radius * HeatmapItem.meterToLatDegree;
            //lonRadius = radius * HeatmapItem.meterToLonDegree; 
            //itensity = this.weight / 2;
            //for (var i = Math.PI / 8; i < twoPi; i += stepSize) {
            //    lat = Math.sin(i) * latRadius;
            //    lon = Math.cos(i) * lonRadius;
            //    this.heatspots.push(new Heatspot(lat, lon, itensity));
            //}
        }

        /** 
        * Translate the heatspot (at (0,0)) to the actual location.
        */
        private pinHeatspotToGrid(feature: csComp.Services.Feature, horizCells: number, vertCells: number, mapBounds: L.LatLngBounds, paddingRatio: number) {
            if (feature.geometry.type !== 'Point') return null;
            var latlong = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
            //TODO add a padding that takes the current zoom into account
            var paddedBounds: L.LatLngBounds = mapBounds.pad(paddingRatio);
            if (!paddedBounds.contains(latlong)) return null; //Only draw features that are visible in the map
            var actualHeatspots: IHeatspot[] = [];
            //Find the indices of the feature in the grid
            var hCell = Math.floor(((latlong.lng - mapBounds.getNorthWest().lng) / (mapBounds.getNorthEast().lng - mapBounds.getNorthWest().lng)) * horizCells);
            var vCell = Math.floor(((latlong.lat - mapBounds.getSouthWest().lat) / (mapBounds.getNorthWest().lat - mapBounds.getSouthWest().lat)) * vertCells);
            this.heatspots.forEach((hs) => {
                //TODO actualHeatspots.push(hs.AddLocation(lat, lon));
                actualHeatspots.push(hs.AddLocation(hCell,vCell));
            });
            return actualHeatspots;
        }

        /**
        * Set the scale to convert a 1x1 meter grid cell to the appropriate number of degrees 
        * in vertical and horizontal direction.
        */
        setScale(latitude: number) {
            var latlonlen = csComp.Helpers.GeoExtensions.convertDegreesToMeters(latitude);
            HeatmapItem.meterToLatDegree = 1 / latlonlen.latitudeLength;
            HeatmapItem.meterToLonDegree = 1 / latlonlen.longitudeLength;
        }

        select() {
            this.reset();
            this.isSelected = !this.isSelected; 
            if (!this.isSelected) {
                this.idealityMeasure = null;
            }
            else {
                switch (this.featureType.style.drawingMode.toLowerCase()) {
                    case 'point':
                    case 'image':
                        this.idealityMeasure = new IdealityMeasure();
                        break;
                    default:
                        //this.idealityMeasure = 1;
                        break;
                }
            }
        }

        reset() {
            this.heatspots = [];
        }

        toString() {
            return this.propertyTitle
                ? this.propertyTitle + '.' + this.title + ' (' + this.featureType.name + ')'
                : this.title;            
        }
    }
}
