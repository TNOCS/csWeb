module csComp.Services {
    /** 
    * Implement this interface to make your object serializable 
    * @see http://stackoverflow.com/a/22886730/319711
    */
    export interface ISerializable<T> {
        deserialize(input: Object): T;
    }

    export class DateRange {
        start : number;
        end: number;
        focus: number;

        public setFocus(d: Date,s? : Date, e? : Date) {
            this.focus = d.getTime();
            if (s) this.start = s.getTime();
            if (e) this.end = e.getTime();


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
    export class Project implements ISerializable<Project> {
        title           : string;
        description     : string;
        logo            : string;
        featureTypes    : { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
        groups          : Array<ProjectGroup>;
        startposition   : Coordinates;
        features        : IFeature[];
        timeLine        : DateRange;
        mcas            : Mca.Models.Mca[];
        dashboards      : { [id: string]: Dashboard };
        dataSets        : DataSet[];
        viewBounds      : IBoundingBox;
        markers = {};

        public deserialize(input: Project): Project {
            this.viewBounds       = input.viewBounds;
            this.title            = input.title;
            this.description      = input.description;
            this.logo             = input.logo;
            this.markers          = input.markers;
            this.startposition    = input.startposition;
            this.features         = input.features;
            this.featureTypes     = input.featureTypes;
            this.propertyTypeData = input.propertyTypeData;
            this.groups           = input.groups;
            this.mcas             = [];
            for (var mca in input.mcas) {
                this.mcas.push(new Mca.Models.Mca().deserialize(mca));
            }
            return this;
        }
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
        reference: string;
        events  : Event[];
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