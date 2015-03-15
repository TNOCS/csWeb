module Timeline {
    declare var links;

    export interface ITimelineScope extends ng.IScope {
        vm            : TimelineCtrl;
        numberOfItems : number;
        timeline      : any;
    }

    export class TimelineCtrl {
        private scope: ITimelineScope;
        private locale = "en-us";

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'mapService',
            'messageBusService',
            'TimelineService'
        ];

        public focusDate: Date;
        public line1    : string;
        public line2    : string;
        public startDate: Date;
        public endDate  : Date;

        public timer       : any;
        public isPlaying   : boolean;
        public showControl : boolean;
        public isPinned    : boolean;

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : ITimelineScope,
            private $layerService      : csComp.Services.LayerService,
            private $mapService        : csComp.Services.MapService,
            private $messageBusService : csComp.Services.MessageBusService,
            private TimelineService    : Timeline.ITimelineService
            ) {
            this.loadLocales();

            $scope.vm = this;

            this.initTimeline();

            this.$messageBusService.subscribe("timeline", (s: string, data: any) => {
                switch (s) {
                    case "updateTimerange":
                        this.$scope.timeline.setVisibleChartRange(data.start, data.end);
                        this.updateFocusTime();
                        break;
                    case "loadProjectTimeRange":
                        if (typeof $layerService.project === 'undefined'
                            || $layerService.project === null
                            || typeof $layerService.project.timeLine === 'undefined'
                            || $layerService.project.timeLine === null) return;
                        this.$scope.timeline.setVisibleChartRange($layerService.project.timeLine.start, $layerService.project.timeLine.end);
                        this.updateFocusTime();
                        break;
                }
                //if ($scope.$$phase != '$apply' && $scope.$$phase != '$digest') { $scope.$apply(); }
            });

            //$scope.focusDate = $layerService.project.timeLine.focusDate();

            // Options voor de timeline

            this.$messageBusService.subscribe("language",(s: string, newLanguage: string) => {
                switch (s) {
                    case "newLanguage":
                        this.initTimeline();
                        break;
                }
            });
        }

        private initTimeline() {
            var options = this.TimelineService.getTimelineOptions();
            options.locale = this.$layerService.currentLocale;

            this.$layerService.timeline = this.$scope.timeline = new links.Timeline(document.getElementById('timeline'), options);

            this.$scope.timeline.draw();
            links.events.addListener(this.$scope.timeline, 'rangechange', _.throttle((prop) => this.onRangeChanged(prop), 200));
            links.events.addListener(this.$scope.timeline, 'rangechange',() => {
                if (this.$layerService.project && this.$layerService.project.timeLine.isLive) {
                    this.myTimer();
                }
            });

            if (typeof this.$layerService.project !== 'undefined' && this.$layerService.project.timeLine !== null)
                this.$scope.timeline.setVisibleChartRange(this.$layerService.project.timeLine.start, this.$layerService.project.timeLine.end);
            this.updateDragging();
            this.updateFocusTime();
        }

        public updateDragging() {
            if (this.$layerService.project && this.$layerService.project.timeLine.isLive) {
                (<any>$("#focustimeContainer")).draggable('disable');
            } else {
                (<any>$("#focustimeContainer")).draggable({
                    axis: "x",
                    containment: "parent",
                    drag: _.throttle(() => this.updateFocusTime(), 200)
                });
                (<any>$("#focustimeContainer")).draggable('enable');
            }
        }


        public onRangeChanged(properties) {
            this.updateFocusTime();
        }

        public start() {
            this.stop();
            this.isPlaying = true;
            if (this.timer) this.timer = null;
            this.timer = setInterval(()=> { this.myTimer(); }, 500);
        }

        public toggleLive() {
            if (!this.$layerService.project) return;
            this.stop();
            this.$layerService.project.timeLine.isLive = !this.$layerService.project.timeLine.isLive;
            if (this.$layerService.project.timeLine.isLive) {
                this.myTimer();
                this.start();
            }
            this.updateDragging();
            //this.isPlaying = this.isLive;
        }

        public myTimer() {
            var tl = this.$scope.timeline;
            if (this.$layerService.project.timeLine.isLive) {
                var pos = tl.timeToScreen(new Date());
                $("#focustimeContainer").css('left', pos - 75);
                this.$scope.$apply();
                this.updateFocusTime();
            } else {
                tl.move(0.005);
                this.updateFocusTime();
            }
        }

        public mouseEnter() {
            this.showControl = true;
        }

        public mouseLeave() {
            if (!this.isPlaying) this.showControl = false;
        }

        public pinToNow() {
            this.isPinned = true;
            this.start();
        }

        public stop() {
            this.isPlaying = false;
            if (this.timer) clearInterval(this.timer);

        }

        public updateFocusTime() {
            //if (!this.$mapService.timelineVisible) return;
            var tl = this.$scope.timeline;
            tl.showCustomTime = true;
            tl.setCustomTime = typeof this.$layerService.project === 'undefined'
                ? new Date()
                : this.$layerService.project.timeLine.focusDate();
            var tc1 = $("#focustimeContainer").offset().left;
            var tc2 = $("#timelinecontainer").offset().left - 15; // + 55;
            var centerX = tc1 - tc2 + $("#focustimeContainer").width() / 2;
            //var end = $("#timeline").width;

            var range = this.$scope.timeline.getVisibleChartRange();
            //tl.calcConversionFactor();

            this.focusDate = new Date(this.$scope.timeline.screenToTime(centerX));

            this.startDate = range.start; //new Date(range.start); //this.$scope.timeline.screenToTime(0));
            this.endDate = range.end; //new Date(this.$scope.timeline.screenToTime(end));

            if (this.$layerService.project != null && this.$layerService.project.timeLine != null) {
                var projecttime = this.$layerService.project.timeLine;
                projecttime.setFocus(this.focusDate, this.startDate, this.endDate);
                var month = (<any>this.focusDate).toLocaleString(this.locale, { month: "long" });
                switch (projecttime.zoomLevelName) {
                    case "decades":
                        this.line1 = this.focusDate.getFullYear().toString();
                        this.line2 = "";
                        break;
                    case "years":
                        this.line1 = this.focusDate.getFullYear().toString();
                        this.line2 = month;
                        break;
                    case "weeks" :
                        this.line1 = this.focusDate.getFullYear().toString();
                        this.line2 = moment(this.focusDate).format('DD')+ " " + month;
                        break;
                    case "milliseconds":
                        this.line1 = moment(this.focusDate).format('MM - DD - YYYY');
                        this.line2 = moment(this.focusDate).format('HH:mm:ss.SSS');
                        break;
                    default:
                        this.line1 = moment(this.focusDate).format('MM - DD - YYYY');
                        this.line2 = moment(this.focusDate).format('HH:mm:ss');
                }
            }
            //if (this.$scope.$$phase != '$apply' && this.$scope.$$phase != '$digest') { this.$scope.$apply(); }
            this.$messageBusService.publish("timeline", "focusChange", this.focusDate);
            //this.$layerService.focusTime = new Date(this.timelineCtrl.screenToTime(centerX));
        }

        /** 
        * Load the locales: instead of loading them from the original timeline-locales.js distribution, 
        * add them here so you don't need to add another js dependency.
        * @seealso: http://almende.github.io/chap-links-library/downloads.html
        */
        loadLocales() {
            if (typeof links === 'undefined') {
                links = {};
                links.locales = {};
            } else if (typeof links.locales === 'undefined') {
                links.locales = {};
            }
            // English ===================================================
            links.locales['en'] = {
                'MONTHS': ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                'MONTHS_SHORT': ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                'DAYS': ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                'DAYS_SHORT': ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                'ZOOM_IN': "Zoom in",
                'ZOOM_OUT': "Zoom out",
                'MOVE_LEFT': "Move left",
                'MOVE_RIGHT': "Move right",
                'NEW': "New",
                'CREATE_NEW_EVENT': "Create new event"
            };

            links.locales['en_US'] = links.locales['en'];
            links.locales['en_UK'] = links.locales['en'];
            // French ===================================================
            links.locales['fr'] = {
                'MONTHS': ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
                'MONTHS_SHORT': ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"],
                'DAYS': ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
                'DAYS_SHORT': ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
                'ZOOM_IN': "Zoomer",
                'ZOOM_OUT': "Dézoomer",
                'MOVE_LEFT': "Déplacer à gauche",
                'MOVE_RIGHT': "Déplacer à droite",
                'NEW': "Nouveau",
                'CREATE_NEW_EVENT': "Créer un nouvel évènement"
            };

            links.locales['fr_FR'] = links.locales['fr'];
            links.locales['fr_BE'] = links.locales['fr'];
            links.locales['fr_CA'] = links.locales['fr'];
            // German ===================================================
            links.locales['de'] = {
                'MONTHS': ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
                'MONTHS_SHORT': ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
                'DAYS': ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
                'DAYS_SHORT': ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
                'ZOOM_IN': "Vergrößern",
                'ZOOM_OUT': "Verkleinern",
                'MOVE_LEFT': "Nach links verschieben",
                'MOVE_RIGHT': "Nach rechts verschieben",
                'NEW': "Neu",
                'CREATE_NEW_EVENT': "Neues Ereignis erzeugen"
            };

            links.locales['de_DE'] = links.locales['de'];
            links.locales['de_CH'] = links.locales['de'];
            // Dutch =====================================================
            links.locales['nl'] = {
                'MONTHS': ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
                'MONTHS_SHORT': ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
                'DAYS': ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
                'DAYS_SHORT': ["zo", "ma", "di", "wo", "do", "vr", "za"],
                'ZOOM_IN': "Inzoomen",
                'ZOOM_OUT': "Uitzoomen",
                'MOVE_LEFT': "Naar links",
                'MOVE_RIGHT': "Naar rechts",
                'NEW': "Nieuw",
                'CREATE_NEW_EVENT': "Nieuwe gebeurtenis maken"
            };

            links.locales['nl_NL'] = links.locales['nl'];
            links.locales['nl_BE'] = links.locales['nl'];
        }
    }
}
