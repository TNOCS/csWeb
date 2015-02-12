module csComp.Services {  
    export class TitleWidget extends csComp.Services.BaseWidget {

        public widgetType: string = "Title";
        public title: string = "Title";
        public sizeY: number = 1;
        public sizeX: number = 2;

        public renderer = ($compile, $scope: Dashboard.DashboardCtrl) => {
            //var html = "<h1>{{dashboard.name}}</h1>";
            //return html;
            //$compile(htmlcontent.contents())($scope);
            $("#" + this.elementId).html("<h1>" + this.dashboard.name + "<h1>");
        }


    }

    export class DataSetWidget extends csComp.Services.BaseWidget {

        public widgetType: string = "DataSet";
        public title: string = "DataSet";
        public sizeY: number = 1;
        public sizeX: number = 2;

        public dataSet: DataSet;
        public project : Project;
        public date: string;
        public messageBusService: MessageBusService;
        public value : string;

        public start() {
            //if (!this.messageBusService) return;
            //this.messageBusService.subscribe("timeline", (s, data) => {
            //    switch (s) {
            //        case "focusChange":
            //            this.date = this.project.timeLine.focus.toString();
            //            this.value = this.date;
            //            //alert('focus');
            //            break;  
            //    }
            //});
        }


        public renderer = ($compile : any,$scope: any) => {            
            var el = $("#" + this.elementId);
            //var template = "<h3>{{widget.value}}</h3>";
            var template = "<datasetWidget />"
            el.html(template).show();
            $scope.widget = this;
            $compile(el.contents())($scope);
            $scope.$apply();
            
        }
    }

    export class LayerWidget extends csComp.Services.BaseWidget {

        public widgetType: string = "Layer";
        public title: string = "LayerWidget";
        public sizeY: number = 1;
        public sizeX: number = 2;

        public renderer = ($compile: any,$scope: Dashboard.DashboardCtrl) => {
            //var html = "<h1>{{dashboard.name}}</h1>";
            //return html;
            //$compile(htmlcontent.contents())($scope);
            $("#" + this.elementId).html("<h1>" + this.dashboard.name + "<h1>");
        }
    }

    export class TextWidget extends csComp.Services.BaseWidget {

        public widgetType: string = "Text";
        public title: string = "Text";
        public name : string = "arnoud";
        

        public renderer = ($compile: any,$scope: any) => {
            var el = $("#" + this.elementId);
            var template = "<h3><testwidget text='hoi'></testwidget>{{widget.name}}</h3>";
            el.html(template).show();
            $scope.widget = this;
            $compile(el.contents())($scope);
            $scope.$apply();

            //element.html(getTemplate(scope.content.content_type)).show();


        }
    }
}