module csComp.Services {
    /**
    * Implement this interface to make your object serializable
    * @see http://stackoverflow.com/a/22886730/319711
    */
    export interface ISerializable<T> {
        deserialize(input: Object): T;
    }

    var availableZoomLevels = [{ title: "decades", value: 315360000000 },
      { title: "years", value: 31536000000 }, { title: "weeks", value: 604800000 }, { title: "days", value: 86400000 }, { title: "hours", value: 3600000 }, { title: "quarters", value: 900000 }, { title: "minutes", value: 60000 }, { title: "seconds", value: 1000 }, { title: "milliseconds", value: 1 }
  ];


  export class DateRange {
    start : number;
    end: number;
    focus: number;
    range: number; // total time range in ms
    zoomLevel: number;
    zoomLevelName: string;
    isLive: boolean;


        public setFocus(d: Date,s? : Date, e? : Date) {
            this.focus = d.getTime();
            if (s) this.start = s.getTime();
            if (e) this.end = e.getTime();
            var newRange = this.end - this.start;
            if (this.range !== newRange) {
                this.range = newRange;
                availableZoomLevels.some((tl) => {
                    this.zoomLevel = tl.value;
                    this.zoomLevelName = tl.title;
                    return (tl.value < (this.range / 10));
                });
            }
        }


        constructor() {
            if (!focus) this.setFocus(new Date());
        }

        startDate = () => { return new Date(this.start); }
        focusDate = () => { return new Date(this.start); }
        endDate   = () => { return new Date(this.start); }
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

    export interface IPrivileges {
        mca: {
            expertMode: boolean;
        }
    }


        /** bouding box to specify a region. */
        export interface IBoundingBox {
            southWest: L.LatLng;
            northEast: L.LatLng;
        }

    /** project configuration. */
    export class Project implements ISerializable<Project> {
        title           : string;
        description     : string;
        logo            : string;
        url             : string;
        activeDashboard : Dashboard;
        baselayers      : IBaseLayer[];
        featureTypes    : { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
        groups          : Array<ProjectGroup>;
        startposition   : Coordinates;
        features        : IFeature[];
        timeLine        : DateRange;
        mcas            : Mca.Models.Mca[];
        dashboards      : Dashboard[];
        dataSets        : DataSet[];
        viewBounds      : IBoundingBox;
        userPrivileges  : IPrivileges;
        languages       : ILanguageData;

        markers = {}; 

        public deserialize(input: Project): Project {
            var res = <Project>jQuery.extend(new Project(), input);
            if (input.dashboards) {
                res.dashboards = [];
                input.dashboards.forEach((d) => {
                    res.dashboards.push(Dashboard.deserialize(d));
                });

                for (var mca in input.mcas) {
                    if (input.mcas.hasOwnProperty(mca)) {
                        res.mcas.push(new Mca.Models.Mca().deserialize(mca));
                    }
            }            
          }
            if (!res.propertyTypeData) res.propertyTypeData = {};
          return res;
        }
    }

    /** layer information. a layer is described in a project file and is always part of a group */
    export class ProjectLayer {
        title                       : string;
        description                 : string;
        type                        : string;
        url                         : string;
        styleurl                    : string;
        wmsLayers                   : string;
        enabled                     : boolean;
        opacity                     : number;
        isLoading                   : boolean;
        isSublayer                  : boolean;
        mapLayer                    : L.LayerGroup<L.ILayer>;
        group                       : ProjectGroup;
        timestamps                  : any[];
        /** Internal ID, e.g. for the Excel service */
        id                          : string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference                   : string;
        events                      : Event[];
        languages                   : ILanguageData;
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
