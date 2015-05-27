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

    export class VisualState {
        public leftPanelVisible: boolean = true;
        public rightPanelVisible: boolean = false;
        public dashboardVisible: boolean = true;
        public mapVisible: boolean = true;
        public timelineVisible: boolean = true;
    }

    //** class for describing time ranges for timeline, including focus time */
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
        dynamic : boolean;
    }

    /**
    * Simple class to hold the user privileges.
    */
    export interface IPrivileges {
        mca: { expertMode: boolean;}
        heatmap: { expertMode: boolean;}
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
        id: string;
        title           : string;
        description     : string;
        logo            : string;
        url             : string;
        /** true if a dynamic project and you want to subscribe to project changes using socket.io */
        connected       : boolean;
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
        datasources     : DataSource[];
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
            if (!res.mcas) res.mcas = [];
            if (res.id == null) res.id = res.title;
            return res;
        }
    }


}
