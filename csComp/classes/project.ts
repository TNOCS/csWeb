module csComp.Services {
    /**
    * Expert level for determining what options to show to the user.
    */
    export enum Expertise {
        Beginner     = 1,
        Intermediate = 2,
        Expert       = 3
    }

    /**
    * Implement this interface to make your object serializable
    * @see http://stackoverflow.com/a/22886730/319711
    */
    export interface ISerializable<T> {
        deserialize(input: Object): T;
    }

    var availableZoomLevels  = [
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

    export class DateRange {
        start        : number;
        end          : number;
        focus        : number;
        range        : number; // total time range in ms
        zoomLevel    : number;
        zoomLevelName: string;
        isLive       : boolean;

        //constructor() {
        //    if (!this.focus) this.setFocus(new Date());
        //}

        static deserialize(input: DateRange): DateRange {
            var res = <DateRange>$.extend(new DateRange(), input);
            if (typeof res.focus === 'undefined' || res.focus === null) res.focus = Date.now();
            return res;
        }

        /**
        * Set the focus time of the timeline, optionally including start and end time.
        */
        setFocus(d: Date, s? : Date, e? : Date) {
            this.focus = d.getTime();
            if (s) this.start = s.getTime();
            if (e) this.end   = e.getTime();
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

        startDate = () => {
            if (this.focus < this.start) this.start = this.focus - this.range / 5;
            return new Date(this.start);
        }

        focusDate = () => { return new Date(this.focus); }

        endDate = () => {
            if (this.focus > this.end) this.end = this.focus + this.range / 5;
            return new Date(this.end);
        }
    }

    /**
     * Represents to the overall solution class. A solution can contain multiple project.
     * This can be usefull when you want to have the same website, but with different content.
     * e.g. you could make it so that you can switch between different regions or different domains of interest.
     */
    export class Solution {
        title     : string;
        maxBounds : IBoundingBox;
        viewBounds: IBoundingBox;
        baselayers: IBaseLayer[];
        projects  : SolutionProject[];
    }

    /** Project within a solution file, refers to a project url*/
    export class SolutionProject {
        title: string;
        url  : string;
    }

    /**
    * Simple class to hold the user privileges.
    */
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

    export interface ITimelineOptions {
        width?          : string;
        height?         : string;
        eventMargin?    : number;
        eventMarginAxis?: number;
        editable?       : boolean;
        layout?         : string;
        /** NOTE: For internal use only. Do not set it, as it will be overwritten by the $layerService.currentLocale. */
        locale?         : string;
        timeLine?       : DateRange;
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

        expertMode = Expertise.Expert;
        markers = {};

        public deserialize(input: Project): Project {
            var res = <Project>jQuery.extend(new Project(), input);
            if (input.timeLine) res.timeLine = DateRange.deserialize(input.timeLine); // <DateRange>jQuery.extend(new DateRange(), input.timeLine);
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
        /** Title as displayed in the menu */
        title                       : string;
        /** Description as displayed in the menu */
        description                 : string;
        /** Type of layer, e.g. GeoJSON, TopoJSON, or WMS */
        type                        : string;
        /** Data source */
        url                         : string;
        /** List of references to required sources (in case of multiple sources) */
        referenceList                    : string[]
        /** In case we keep the style information in a separate file */
        styleurl                    : string;
        /** how should the layer be renderer, default (can also be null), webgl, heatmap, isolines, etc. */
        layerRenderer               : string;
        /** WMS sublayers that must be loaded */
        wmsLayers                   : string;
        /** If enabled, load the layer */
        enabled                     : boolean;
        /** Layer opacity */
        opacity                     : number;
        /** When loading the data, the isLoading variable is true (e.g. used for the spinner control) */
        isLoading                   : boolean;
        /** Indent the layer, so it seems to be a sublayer. */
        isSublayer                  : boolean;
        mapLayer                    : L.LayerGroup<L.ILayer>;
        /** Group of layers */
        group                       : ProjectGroup;
        /**
        * A list of UNIX timestamp, or the UTC time in milliseconds since 1/1/1970, which define the time a sensor value
        * was taken. So in case we have 10 timestamps, each feature's sensor (key) in the feature's sensors dictionary should
        * also have a lnegth of 10.
        * Note that this value is optional, and can be omitted if the sensor already contains a timestamp too. This is mainly intended
        * when all 'sensor measurements' are taken on the same moment. For example, the CENSUS date.
        * In Excel, you can use the formula =24*(A4-$B$1)*3600*1000 to convert a date to a UNIX time stamp.
        */
        timestamps                  : number[];
        /** Internal ID, e.g. for the Excel service */
        id                          : string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference                   : string;
        events                      : Event[];
        /** Language information that can be used to localize the title and description */
        languages                   : ILanguageData;
        /** layer original source */
        data                        : JSON;
        cesiumDatasource            : any;
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
        /** URL pointing to the basemap source. */
        url        : string;
        /** Maximum zoom level */
        maxZoom    : number;
        /** Minimum zoom level */
        minZoom    : number;
        subdomains : string[];
        /** String that is shown on the map, attributing the source of the basemap */
        attribution: string;
        test       : string;
    }
}
