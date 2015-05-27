module csComp.Services {

    export class Widget {
        public content: Function;

        constructor() {}
    }

    export interface IWidget {
        directive        : string;  // name of the directive that should be used as widget
        data             : Object;  // json object that can hold parameters for the directive
        url              : string;  // url of the html page that should be used as widget
        template         : string;  // name of the template that should be shown as widget
        title            : string;  // title of the widget
        elementId        : string;
        enabled          : boolean;

        parentDashboard        : csComp.Services.Dashboard;
        renderer         : Function;
        resize           : Function;
        background       : string;
        init             : Function;
        start            : Function;
        left?            : string;
        right?           : string;
        top?             : string;
        bottom?          : string;
        borderWidth      : string;
        borderColor      : string;
        borderRadius     : string;

        name             : string; id: string;
        properties       : {};
        dataSets         : DataSet[];
        range            : csComp.Services.DateRange;
        updateDateRange  : Function;
        collapse         : boolean;
        canCollapse      : boolean;
        width            : string;
        height           : string;
        allowFullscreen  : boolean;
        messageBusService: csComp.Services.MessageBusService;
        layerService     : csComp.Services.LayerService;
    }

    export class BaseWidget implements IWidget {
        public directive        : string;
        public template         : string;
        public title            : string;
        public data             : {};
        public url              : string;
        public elementId        : string;
        public parentDashboard        : csComp.Services.Dashboard;
        public enabled          : boolean = true;
        public borderWidth      : string = "1px";
        public borderColor      : string = "green";
        public borderRadius     : string = "5px";

        public background       : string = "white";
        public left             : string;
        public right            : string;
        public top              : string;
        public bottom           : string;
        public name             : string; public id: string;
        public properties       : {};
        public dataSets         : DataSet[];
        public range            : csComp.Services.DateRange;
        public collapse         : boolean;
        public canCollapse      : boolean;
        public width            : string;
        public height           : string ;
        public allowFullscreen  : boolean;
        public messageBusService: csComp.Services.MessageBusService;
        public layerService     : csComp.Services.LayerService;
        public hover : boolean;

        //public static deserialize(input: IWidget): IWidget {
        //    var loader = new InstanceLoader(window);
        //    var w = <IWidget>loader.getInstance(widget.widgetType);
        //    var res = $.extend(new BaseWidget(), input);
        //    return res;
        //}

        constructor(title? : string, type? : string) {
            if (title) this.title = title;
            this.properties = {};
            this.dataSets = [];
        }

        public start() {}

        public init() {
            //if (!sizeX)
            //this.sizeX = sX;
            //this.sizeY = sY;
            //this.col = c;
            //this.row = r;
            this.background = "red";
            if (!this.id) this.id = "widget" + csComp.Helpers.getGuid().replace('-', '');
            //this.width = (width) ? width : 300;
            //this.height = (height) ? height : 150;
            //this.id = id;
            this.elementId = this.id;
            this.start();
        }

        public renderer = ($compile : any,$scope: any) => { };

        public updateDateRange(r: csComp.Services.DateRange) {
            this.range = r;
        }

        public resize = (status: string, width : number, height : number) => {};
    }

    export class Dashboard {
        widgets:         IWidget[];
        editMode:        boolean;
        showMap:         boolean;
        showTimeline:    boolean = true;
        showLeftmenu:    boolean;
        showRightmenu:   boolean = true;
        showBackgroundImage : boolean = false;
        draggable:       boolean = true;
        resizable:       boolean = true;
        background:      string;
        backgroundimage: string = "images/amsterdam.jpg";
        visiblelayers:   string[];
        baselayer:       string;
        viewBounds:      IBoundingBox;
        timeline:        DateRange;
        id:              string;
        name:            string;
        disabled: boolean = false;

        constructor() {
            this.widgets = [];
        }

        public static deserialize(input: Dashboard): Dashboard {
            var res = <Dashboard>$.extend(new Dashboard(), input);

            res.widgets = [];
            if (input.widgets) input.widgets.forEach((w: IWidget) => {
                this.addNewWidget(w, res);
            });
            if (input.timeline) res.timeline = $.extend(new DateRange(), input.timeline);

            return res;
        }

        public static addNewWidget(widget: IWidget, dashboard: Dashboard) : IWidget {
          //var loader = new InstanceLoader(window);
          //var w = <IWidget>loader.getInstance(widget.widgetType);
          //w.messageBusService = this.$messageBusService;
          //w.layerService = this.$layerService;
          //w.init();
          //var w = BaseWidget();
          if (!widget.id) widget.id = csComp.Helpers.getGuid();
          //alert(widget.id);
          widget.elementId = "widget-" + widget.id;
          widget.parentDashboard = dashboard;
          dashboard.widgets.push(widget);
          /*if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
          setTimeout(() => {
              //if (w != null) w.renderer(this.$compile, this.$rootScope);
              this.updateWidget(widget);

          }, 50);*/
          //this.editWidget(w);
          return widget;
      }
    }

    export class Timeline {
        public id : string;
        public timestamps : number[];
    }

    export class TimedDataSet {
        public timeline: Timeline;
        public timedata : number[];
    }

    export class DataSet {
        public color: string;

        public data: { [key: number]: number };

        constructor(public id?: string, public title?: string) {
            this.data = [];
        }
    }
}
