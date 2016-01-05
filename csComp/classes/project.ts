module csComp.Services {
    /**
    * Expert level for determining what options to show to the user.
    */
    export enum Expertise {
        Beginner     = 1,
        Intermediate = 2,
        Expert       = 3,
        Admin        = 4
    }

    /**
    * Implement this interface to make your object serializable
    * @see http://stackoverflow.com/a/22886730/319711
    */
    export interface ISerializable<T> {
        deserialize(input: Object, solution?: Solution): T;
    }

    export class VisualState {
        public leftPanelVisible:  boolean = true;
        public rightPanelVisible: boolean = false;
        public dashboardVisible:  boolean = true;
        public mapVisible:        boolean = true;
        public timelineVisible:   boolean = true;

        // For debugging purposes, I've added below functionality so I can set breakpoints on the setter.
        // get rightPanelVisible(): boolean {
        //     console.log(`Right panel visible (get): ${this._rightPanelVisible}`);
        //     return this._rightPanelVisible;
        // }
        // set rightPanelVisible(isVisible: boolean) {
        //     this._rightPanelVisible = isVisible;
        //     console.log(`Right panel visible (set): ${this._rightPanelVisible}`);
        // }
    }

    //** class for describing time ranges for timeline, including focus time */
    export class DateRange {
        start:         number;
        end:           number;
        focus:         number;
        range:         number; // total time range in ms
        zoomLevel:     number;
        zoomLevelName: string;
        isLive:        boolean;

        //constructor() {
        //    if (!this.focus) this.setFocus(new Date());
        //}

        static deserialize(input: DateRange): DateRange {
            var res = <DateRange>$.extend(new DateRange(), input);
            if (typeof res.focus === 'undefined' || res.focus === null) { res.focus = Date.now(); }
            return res;
        }

        /**
        * Set the focus time of the timeline, optionally including start and end time.
        */
        setFocus(d: Date, s?: Date, e?: Date) {
            this.focus = d.getTime();
            if (s) { this.start = s.getTime(); }
            if (e) { this.end = e.getTime(); }
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
            if (this.focus < this.start) { this.start = this.focus - this.range / 5; }
            return new Date(this.start);
        };

        focusDate = () => { return new Date(this.focus); };

        endDate = () => {
            if (this.focus > this.end) { this.end = this.focus + this.range / 5; }
            return new Date(this.end);
        };
    }

    /**
     * Represents to the overall solution class. A solution can contain multiple project.
     * This can be usefull when you want to have the same website, but with different content.
     * e.g. you could make it so that you can switch between different regions or different domains of interest.
     */
    export class Solution {
        title:        string;
        maxBounds:    IBoundingBox;
        viewBounds:   IBoundingBox;
        baselayers:   IBaseLayer[];
        widgetStyles: { [key: string]: WidgetStyle } = {};
        projects:     SolutionProject[];
    }

    /** Project within a solution file, refers to a project url*/
    export class SolutionProject {
        title: string;
        url: string;
        dynamic: boolean;
    }

    /**
    * Simple class to hold the user privileges.
    */
    export interface IPrivileges {
        mca:     { expertMode: boolean; };
        heatmap: { expertMode: boolean; };
    }

    /** bouding box to specify a region. */
    export interface IBoundingBox {
        southWest: number[];
        northEast: number[];
    }

    export interface ITimelineOptions {
        width?:           string;
        height?:          string;
        eventMargin?:     number;
        eventMarginAxis?: number;
        editable?:        boolean;
        layout?:          string;
        /** NOTE: For internal use only. Do not set it, as it will be overwritten by the $layerService.currentLocale. */
        locale?:   string;
        timeLine?: DateRange;
    }

    /** project configuration. */
    export class Project implements ISerializable<Project> {
        id:          string;
        title:       string;
        description: string;
        logo:        string;
        otpServer:   string;
        storage:     string;
        url:         string;
        opacity:     number;
        /** true if a dynamic project and you want to subscribe to project changes using socket.io */
        connected:         boolean;
        activeDashboard:   Dashboard;
        baselayers:        IBaseLayer[];
        allFeatureTypes:   { [id: string]: IFeatureType };
        featureTypes:      { [id: string]: IFeatureType };
        propertyTypeData:  { [id: string]: IPropertyType };
        solution:          Solution;
        groups:            ProjectGroup[];
        mapFilterResult:   L.Marker[];
        startposition:     Coordinates;
        features:          IFeature[];
        timeLine:          DateRange;
        mcas:              Mca.Models.Mca[];
        dashboards:        Dashboard[];
        typeUrls:          string[];
        datasources:       DataSource[];
        dataSets:          DataSet[];
        viewBounds:        IBoundingBox;
        collapseAllLayers: boolean;
        userPrivileges:    IPrivileges;
        languages:         ILanguageData;
        /** link to layer directory, if empty do not use it */
        layerDirectory: string;
        expertMode      = Expertise.Expert;
        markers         = {};
        eventTab:       boolean;
        /** If true (default false), indicates that we should load an offline search result. */
        useOfflineSearch: boolean = false;
        /**
         * Serialize the project to a JSON string.
         */
        public serialize(): string {
            return JSON.stringify(Project.serializeableData(this), (key: string, value: any) => {
                // Skip serializing certain keys
                switch (key) {
                    case 'timestamp':
                    //case 'values':
                    //case 'mcas':
                    case '$$hashKey':
                    case 'div':
                        return undefined;
                    default:
                        return value;
                }
            }, 2);
        }

        public static serializeFeatureType(ft: IFeatureType): Object {
            return {
                name: ft.name,
                style: ft.style,
                propertyTypeKeys: ft.propertyTypeKeys,
                showAllProperties: ft.showAllProperties
            };
        }

        /**
         * Returns an object which contains all the data that must be serialized.
         */
        public static serializeableData(project: Project): Object {
            return {
                id:                project.id,
                title:             project.title,
                description:       project.description,
                logo:              project.logo,
                otpServer:         project.otpServer,
                url:               project.url,
                connected:         project.connected,
                startPosition:     project.startposition,
                timeLine:          project.timeLine,
                opacity:           project.opacity,
                mcas:              project.mcas,
                datasources:       csComp.Helpers.serialize<DataSource>(project.datasources, DataSource.serializeableData),
                dashboards:        csComp.Helpers.serialize<Dashboard>(project.dashboards, Dashboard.serializeableData),
                viewBounds:        project.viewBounds,
                collapseAllLayers: project.collapseAllLayers,
                userPrivileges:    project.userPrivileges,
                languages:         project.languages,
                expertMode:        project.expertMode,
                baselayers:        project.baselayers,
                featureTypes:      project.featureTypes, //reset
                propertyTypeData:  project.propertyTypeData,
                groups:            csComp.Helpers.serialize<ProjectGroup>(project.groups, ProjectGroup.serializeableData),
                layerDirectory:    project.layerDirectory,
                eventTab:          project.eventTab
            };
        }

        public deserialize(input: Project): Project {
            var res = <Project>jQuery.extend(new Project(), input);
            res.solution = input.solution;
            if (!input.opacity) { input.opacity = 100; }
            if (input.timeLine) { res.timeLine = DateRange.deserialize(input.timeLine); }// <DateRange>jQuery.extend(new DateRange(), input.timeLine);
            if (input.dashboards) {
                res.dashboards = [];
                input.dashboards.forEach((d) => {
                    res.dashboards.push(Dashboard.deserialize(d, input.solution));
                });
            }
            res.mcas = [];
            for (var index in input.mcas) {
                var mca = new Mca.Models.Mca();
                res.mcas.push(mca.deserialize(input.mcas[index]));
            }

            if (!res.propertyTypeData) { res.propertyTypeData = {}; }
            if (!res.mcas) { res.mcas = []; }
            if (input.groups) {
                res.groups = [];
                input.groups.forEach(group => {
                    res.groups.push(ProjectGroup.deserialize(group));
                });
            }
            if (res.id == null) { res.id = res.title; }
            return res;
        }
    }
}
