module Timeline {
    declare var vis;

    export interface ITimelineScope extends ng.IScope {
        vm: TimelineCtrl;
        numberOfItems: number;
        timeline: any;
    }

    // export interface timelineItem {
    //     id: any;
    //     content: string;
    //     start: Date;
    // }

    export class TimelineCtrl {
        private scope: ITimelineScope;
        private locale = 'en-us';

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
        public line1: string;
        public line2: string;
        public startDate: Date;
        public endDate: Date;
        public expanded: boolean = false;
        public timer: any;
        public isPlaying: boolean;
        public showControl: boolean;
        public isPinned: boolean = true;

        public options: any;
        public expandButtonBottom = 52;
        public items = new vis.DataSet();
        private debounceUpdate: Function;
        private debounceSetItems: Function;
        private ids: string[] = [];


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ITimelineScope,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private TimelineService: Timeline.ITimelineService
        ) {
            this.loadLocales();

            this.options = {
                'width': '100%',
                'editable': false,
                'margin': 0,
                'height': '54px',
                'zoomMax' : 172800000,
                'zoomMin' : 3600000
                //'layout': 'box'
            };


            this.debounceUpdate = _.debounce(this.updateFeatures, 500);
            this.debounceSetItems = _.debounce((items) => { this.setItems(items); }, 500);

            $scope.vm = this;

            this.$messageBusService.subscribe('project', (s: string, data: any) => {
                setTimeout(() => {
                    //    this.initTimeline();
                    
                    
                    // set min/max zoom levels if available
                    if (this.$layerService.project && this.$layerService.project.timeLine !== null) {
                        if (!_.isUndefined(this.$layerService.project.timeLine.zoomMax)) this.$scope.timeline.options["zoomMax"] = this.$layerService.project.timeLine.zoomMax;
                        if (!_.isUndefined(this.$layerService.project.timeLine.zoomMin)) this.$scope.timeline.options["zoomMin"] = this.$layerService.project.timeLine.zoomMin;
                    }
                    
                    this.updateFocusTime();
                    this.updateDragging();
                    this.myTimer();
                    
                    if (this.$layerService.project.timeLine.isLive) this.goLive();
                }, 0);
            });

            this.initTimeline();

            this.$messageBusService.subscribe('timeline', (s: string, data: any) => { this.update(s, data); });

            this.$messageBusService.subscribe('feature', (s: string, feature: csComp.Services.IFeature) => {
                if (s === 'onFeatureSelect' && feature) {
                    if (this.ids.indexOf(feature.id) !== -1) {
                        this.$scope.timeline.setSelection(feature.id);
                    }
                }
            });

            //$scope.focusDate = $layerService.project.timeLine.focusDate();

            // Options for the timeline

            this.$messageBusService.subscribe('language', (s: string, newLanguage: string) => {
                switch (s) {
                    case 'newLanguage':
                        this.initTimeline();
                        break;
                }
            });
        }

        private update(s, data) {
            switch (s) {
                case 'updateTimerange':
                    this.$scope.timeline.setWindow(data.start, data.end);
                    this.updateFocusTime();
                    break;
                case 'loadProjectTimeRange':
                    if (typeof this.$layerService.project === 'undefined'
                        || this.$layerService.project === null
                        || typeof this.$layerService.project.timeLine === 'undefined'
                        || this.$layerService.project.timeLine === null) return;
                    this.$scope.timeline.setWindow(this.$layerService.project.timeLine.start, this.$layerService.project.timeLine.end);
                    this.updateFocusTime();
                    break;
                case 'setFocus':
                    this.setFocusContainerDebounce(data);
                    break;
                case 'updateFeatures':
                    this.debounceUpdate();
                    break;
                case 'setItems':
                    this.debounceSetItems(data);
                    break;
                case 'setGroups':
                    this.setGroups(data);
                    break;
            }
        }

        private setFocusContainerDebounce = _.debounce((data) => {
            this.updateFocusTimeContainer(data);
            //console.log(`Moved timeline and focuscontainer to ${data}`);
        }, 300, true);

        private setItems(items: any[]) {
            if (!items) return;
            var its = new vis.DataSet(items);
            this.$scope.timeline.setItems(its);
        }

        private setGroups(groups: any[]) {
            if (!groups) return;
            var gs = new vis.DataSet(groups);
            this.$scope.timeline.setGroups(gs);
        }

        private updateFeatures() {
            //console.log('timeline: updating features');
            //this.items = [];
            //this.$scope.timeline.redraw();
            var temp: string[] = [];
            var hasChanged = false;

            // check for new items
            this.$layerService.project.features.forEach((f: csComp.Services.IFeature) => {
                hasChanged = true;
                if (f.layer.showOnTimeline && f.properties.hasOwnProperty('date')) {
                    temp.push(f.id);
                    if (this.ids.indexOf(f.id) === -1) {
                        var t = { id: f.id, group: 'all', content: f.properties['Name'], start: new Date(f.properties['date']) };
                        this.items.update(t);
                        this.ids.push(f.id);
                    }
                }
            });

            // check for old items
            this.ids.forEach((s) => {
                hasChanged = true;
                if (temp.indexOf(s) === -1) {
                    // remove item
                    var i = this.items.remove(s);
                    this.ids = this.ids.filter((t) => s !== t);
                }
            });

            //this.$scope.timeline.setItems(i);
            if (hasChanged) this.$scope.timeline.redraw();
        }

        private initTimeline() {

            var container = document.getElementById('timeline');

            // Remove old timeline before initializing a new one
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }


            
            
            

            this.$layerService.timeline = this.$scope.timeline = new vis.Timeline(container, this.items, this.options);

            this.$layerService.timeline.redraw();


            if (this.$layerService.project && this.$layerService.project.timeLine !== null) {
                this.$scope.timeline.setWindow(this.$layerService.project.timeLine.start, this.$layerService.project.timeLine.end);
                if (this.$layerService.project.timeLine.isLive) this.goLive();
            }
            this.updateDragging();
            this.updateFocusTime();

            this.$scope.timeline.on('select', (properties) => {
                if (properties.items && properties.items.length > 0) {
                    var id = properties.items[0];
                    var f = this.$layerService.findFeatureById(id);
                    if (f) {
                        this.$layerService.selectFeature(f);
                    } else if (this.$layerService.project.eventTab) {
                        this.$messageBusService.publish('eventtab', 'zoomto', { id: id });
                    }
                }
            });

            this.$scope.timeline.addEventListener('rangechange', _.throttle((prop) => this.onRangeChanged(prop), 200));
            //this.addEventListener('featureschanged', _.throttle((prop) => this.updateFeatures(), 200));
        }

        public updateDragging() {
            if (this.$layerService.project && this.$layerService.project.timeLine.isLive) {
                (<any>$('#focustimeContainer')).draggable('disable');
            } else {
                (<any>$('#focustimeContainer')).draggable({
                    axis: 'x',
                    containment: 'parent',
                    drag: _.throttle(() => this.updateFocusTime(), 200)
                });
                (<any>$('#focustimeContainer')).draggable('enable');
            }
        }

        public expandToggle() {
            this.expanded = !this.expanded;
            //    this.options.margin = {};
            //    this.options.margin['item'] = (this.expanded) ? 65 : 0;
            this.options.height = (this.expanded) ? 150 : 54;

            this.expandButtonBottom = (this.expanded) ? 149 : 52;
            this.$layerService.timeline.setOptions(this.options);
            this.$layerService.timeline.redraw();
        }

        private throttleTimeSpanUpdate = _.debounce(this.triggerTimeSpanUpdated, 1000);

        /**
         * trigger a debounced timespan updated message on the message bus
         */
        private triggerTimeSpanUpdated() {
            this.$messageBusService.publish('timeline', 'timeSpanUpdated', '');
        }

        /**
         * time span was updated by timeline control
         */
        public onRangeChanged(prop) {
            this.updateFocusTime();
            this.throttleTimeSpanUpdate();
        }

        public start() {
            this.stop();
            this.isPlaying = true;
            if (this.timer) this.timer = null;
            this.timer = setInterval(() => { this.myTimer(); }, 500);
        }

        public goLive() {
            this.stop();
            this.$layerService.project.timeLine.isLive = true;
            this.isPlaying = false;
            if (this.$layerService.project.timeLine.isLive) {
                this.myTimer();
                this.start();
            }
            this.updateDragging();
        }

        public stopLive() {
            if (!this.$layerService.project) return;
            this.stop();
            this.$layerService.project.timeLine.isLive = false;
            this.isPlaying = false;
            this.updateDragging();
        }

        public myTimer() {
            var tl = this.$scope.timeline;
            if (this.$layerService.project.timeLine.isLive) {
                var pos = tl._toScreen(new Date());
                $('#focustimeContainer').css('left', pos - 65);
                if (this.isPinned)
                    tl.moveTo(new Date(), { animation: { duration: 500, easingFunction: 'linear' } });
                this.updateFocusTime();
            } else if (this.isPlaying) {
                var w = tl.getWindow();
                var dif = (w.end.getTime() - w.start.getTime()) / 200;

                tl.setWindow(w.start.getTime() + dif, w.end.getTime() + dif, { animation: { duration: 500, easingFunction: 'linear' } });

                //tl.move(0.005);
                this.updateFocusTime();
            }
        }

        public mouseEnter() {
            this.updateFocusTime();
            if (!isNaN(this.focusDate.getTime())) {
                this.showControl = true;
            }
        }

        public mouseLeave() {
            if (!this.isPlaying) this.showControl = false;
        }

        public pin() {
            this.isPinned = true;
        }

        public unPin() {
            this.isPinned = false;
        }

        public pinToNow() {
            this.isPinned = true;
            this.start();
        }

        public stop() {
            this.isPlaying = false;
            if (this.timer) clearInterval(this.timer);

        }

        public updateFocusTimeContainer(time: Date) {
            this.$scope.timeline.moveTo(time);
            this.$scope.timeline.redraw();
            if (this.$scope.$$phase !== '$apply' && this.$scope.$$phase !== '$digest') { this.$scope.$apply(); }
            let screenPos = this.$scope.timeline._toScreen(time);
            $('#focustimeContainer').css('left', screenPos - $('#focustimeContainer').width() / 2);
        }

        public updateFocusTime() {
            if (!this.$layerService.project) return;
            //if (!this.$mapService.timelineVisible) return;
            setTimeout(() => {
                var tl = this.$scope.timeline;
                tl.showCustomTime = true;

                // typeof this.$layerService.project === 'undefined'
                //     ? tl.setCustomTime(new Date())
                //     : tl.setCustomTime(this.$layerService.project.timeLine.focusDate());

                //var end = $("#timeline").width;

                var range = this.$scope.timeline.getWindow();
                //tl.calcConversionFactor();
                var pos = $('#focustimeContainer').position().left + $('#focustimeContainer').width() / 2;

                if (this.$layerService.project.timeLine.isLive) {
                    this.focusDate = new Date();
                } else {
                    this.focusDate = new Date(this.$scope.timeline._toTime(pos));
                }

                this.startDate = range.start; //new Date(range.start); //this.$scope.timeline.screenToTime(0));
                this.endDate = range.end; //new Date(this.$scope.timeline.screenToTime(end));

                if (this.$layerService.project != null && this.$layerService.project.timeLine != null) {
                    var projecttime = this.$layerService.project.timeLine;
                    projecttime.setFocus(this.focusDate, this.startDate, this.endDate);
                    var month = (<any>this.focusDate).toLocaleString(this.locale, { month: 'long' });

                    switch (projecttime.zoomLevelName) {
                        case 'decades':
                            this.line1 = this.focusDate.getFullYear().toString();
                            this.line2 = '';
                            break;
                        case 'years':
                            this.line1 = this.focusDate.getFullYear().toString();
                            this.line2 = month;
                            break;
                        case 'weeks':
                            this.line1 = this.focusDate.getFullYear().toString();
                            this.line2 = moment(this.focusDate).format('DD') + ' ' + month;
                            break;
                        case 'milliseconds':
                            this.line1 = moment(this.focusDate).format('MM - DD - YYYY');
                            this.line2 = moment(this.focusDate).format('HH:mm:ss.SSS');
                            break;
                        default:
                            this.line1 = moment(this.focusDate).format('MM - DD - YYYY');
                            this.line2 = moment(this.focusDate).format('HH:mm:ss');
                    }
                }
                if (this.$scope.$$phase !== '$apply' && this.$scope.$$phase !== '$digest') { this.$scope.$apply(); }
                this.$messageBusService.publish('timeline', 'focusChange', this.focusDate);
            }, 0);
            //this.$layerService.focusTime = new Date(this.timelineCtrl.screenToTime(centerX));
        }

        /**
        * Load the locales: instead of loading them from the original timeline-locales.js distribution,
        * add them here so you don't need to add another js dependency.
        * @seealso: http://almende.github.io/chap-links-library/downloads.html
        */
        loadLocales() {
            if (typeof vis === 'undefined') {
                vis = {};
                vis.locales = {};
            } else if (typeof vis.locales === 'undefined') {
                vis.locales = {};
            }
            // English ===================================================
            vis.locales['en'] = {
                'MONTHS': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                'MONTHS_SHORT': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                'DAYS': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                'DAYS_SHORT': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'ZOOM_IN': 'Zoom in',
                'ZOOM_OUT': 'Zoom out',
                'MOVE_LEFT': 'Move left',
                'MOVE_RIGHT': 'Move right',
                'NEW': 'New',
                'CREATE_NEW_EVENT': 'Create new event'
            };

            vis.locales['en_US'] = vis.locales['en'];
            vis.locales['en_UK'] = vis.locales['en'];
            // French ===================================================
            vis.locales['fr'] = {
                'MONTHS': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                'MONTHS_SHORT': ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
                'DAYS': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
                'DAYS_SHORT': ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
                'ZOOM_IN': 'Zoomer',
                'ZOOM_OUT': 'Dézoomer',
                'MOVE_LEFT': 'Déplacer à gauche',
                'MOVE_RIGHT': 'Déplacer à droite',
                'NEW': 'Nouveau',
                'CREATE_NEW_EVENT': 'Créer un nouvel évènement'
            };

            vis.locales['fr_FR'] = vis.locales['fr'];
            vis.locales['fr_BE'] = vis.locales['fr'];
            vis.locales['fr_CA'] = vis.locales['fr'];
            // German ===================================================
            vis.locales['de'] = {
                'MONTHS': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
                'MONTHS_SHORT': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
                'DAYS': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
                'DAYS_SHORT': ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'],
                'ZOOM_IN': 'Vergrößern',
                'ZOOM_OUT': 'Verkleinern',
                'MOVE_LEFT': 'Nach links verschieben',
                'MOVE_RIGHT': 'Nach rechts verschieben',
                'NEW': 'Neu',
                'CREATE_NEW_EVENT': 'Neues Ereignis erzeugen'
            };

            vis.locales['de_DE'] = vis.locales['de'];
            vis.locales['de_CH'] = vis.locales['de'];
            // Dutch =====================================================
            vis.locales['nl'] = {
                'MONTHS': ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
                'MONTHS_SHORT': ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
                'DAYS': ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
                'DAYS_SHORT': ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
                'ZOOM_IN': 'Inzoomen',
                'ZOOM_OUT': 'Uitzoomen',
                'MOVE_LEFT': 'Naar links',
                'MOVE_RIGHT': 'Naar rechts',
                'NEW': 'Nieuw',
                'CREATE_NEW_EVENT': 'Nieuwe gebeurtenis maken'
            };

            vis.locales['nl_NL'] = vis.locales['nl'];
            vis.locales['nl_BE'] = vis.locales['nl'];
        }
    }
}
