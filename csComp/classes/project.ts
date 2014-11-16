module csComp.Services {


    export class DateRange {
        start : number;
        end: number;
        focus: number;

        public setFocus(d: Date) {
            this.focus = d.getTime();

        }

        constructor() {
            if (!focus) this.setFocus(new Date());
        }

        startDate = () => { return new Date(this.start); }
        focusDate = () => { return new Date(this.start); }
        endDate = () => { return new Date(this.start); }

    }
    

    /**
     * Represents to the overall solution class. A solution can contain multiple project.
     * This can be usefull when you want to have the same website, but with different content.
     * e.g. you could make it so that you can switch between different regions
     */
    export class Solution {
        title     : string;
        maxBounds : IBoundingBox;
        viewBounds: IBoundingBox;
        baselayers: IBaseLayer[];
        projects  : SolutionProject[];
    }

    /** project within a solution file, refers to a project url*/
    export class SolutionProject {
        title: string;
        url  : string;
    }

    /** project configuration. */
    export class Project {
        title           : string;
        description     : string;
        logo            : string;
        featureTypes    : { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
        groups          : Array<ProjectGroup>;
        startposition   : Coordinates;
        features        : IFeature[];
        timeLine        : DateRange;
        dashboards      : { [id: string]: Dashboard };
        dataSets        : DataSet[];
        viewBounds      : IBoundingBox;
        markers = {};

    }

    /** bouding box to specify a region. */
    export interface IBoundingBox {
        southWest: L.LatLng;
        northEast: L.LatLng;
    }

    /** layer information. a layer is described in a project file and is always part of a group */
    export class ProjectLayer {
        title                       : string;
        description                 : string;
        type                        : string;
        url                         : string;
        styleurl                    : string;
        enabled                     : boolean;
        opacity                     : number;
        isLoading                   : boolean;
        isSublayer                  : boolean;
        mapLayer                    : L.LayerGroup<L.ILayer>;
        group: ProjectGroup;
        timestamps : any[];
        /** Internal ID, e.g. for the Excel service */
        id                          : string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference                   : string;
    }

    /**
     * Baselayers are background maps (e.g. openstreetmap, nokia here, etc).
     * They are described in the project file
     */
    export interface IBaseLayer {
        id         : string;
        title      : string;
        isDefault  : boolean;
        subtitle   : string;
        preview    : string;
        url        : string;
        maxZoom    : number;
        minZoom    : number;
        subdomains : string[];
        attribution: string;
        test       : string;
    }
}