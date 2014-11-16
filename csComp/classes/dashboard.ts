﻿module csComp.Services {

    export class Widget {
        public content: Function;
        constructor() {

        }
    }

    export interface IWidget {
        widgetType: string;
        title: string;
        elementId: string;
        dashboard: csComp.Services.Dashboard;
        renderer: Function;
        resize: Function;
        background : string;
        init : Function;
        col: number; row: number; sizeY: number; sizeX: number; name: string; id: string;
    }

   

    export class BaseWidget implements IWidget {
        public widgetType: string;
        public title: string;
        public elementId: string;
        public dashboard: csComp.Services.Dashboard;
        public col: number;
        public row: number;
        public background : string;
        public sizeY: number = 2;
        public sizeX: number = 4;
        public name: string; public id: string;

        constructor(title?: string, type?: string) {
            if (title) this.title = title;
            if (type) this.widgetType = type;
        }

        public init(sX: number, sY: number, c: number, r: number, id? : string) {
            this.sizeX = sX;
            this.sizeY = sY;
            this.col = c;
            this.row = r;
            this.background = "red";
            if (!id) id = "widget" + csComp.Helpers.getGuid().replace('-', '');
            this.id = id;

        }
        public renderer = () => { };

        public resize = () => {};
    }



    

    export class Dashboard {        
        widgets: IWidget[];
        editMode : boolean;
        constructor(public id: string, public name: string) {
            this.widgets = [];
        }
    }



    export class DataSet {
        public id    : string;
        public title : string;
        public color : string;
        public data: { [key: number]: number };


    }

} 