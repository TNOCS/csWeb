module StyleList {
    export interface IStyleListScope extends ng.IScope {
        vm: StyleListCtrl;
    }



    export class StyleListCtrl {
        private scope: IStyleListScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService'
        ];

        public selectedGroup: csComp.Services.ProjectGroup;
        public selectedSection: csComp.Services.Section;
        public activeStyles: string[];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IStyleListScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private messageBus: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            this.activeStyles = [];

            messageBus.subscribe('layer', (title) => {
                switch (title) {
                    case 'activated':
                    case 'deactivate':
                        // Update the legend when a layer is added or removed.
                        this.initWizard();
                        break;
                }
            });

            messageBus.subscribe('updatelegend', (title, gs) => {
                if (title === 'updatedstyle') {
                    if (this.selectedGroup) {
                        var g = this.$layerService.findGroupById(this.selectedGroup.id);
                        if (g.styles) {
                            this.$timeout(() => {
                                this.activeStyles = _.map(g.styles.filter((s) => {return s.enabled;}), (enabledStyle) => { return enabledStyle.property; });
                            }, 0);
                        }
                    }
                }
            });
        }

        public selectGroup(group: csComp.Services.ProjectGroup) {
            this.selectedGroup = group;
            if (!group._gui['showSections']) {
                for (var s in group._gui['sections']) this.selectSection(group._gui['sections'][s]);
            }
            else {
                setTimeout(() => {
                    (<any>$('#styles_sections')).collapse('show');
                }, 100);
            }
        }

        public selectSection(section : csComp.Services.Section )
        {
            this.selectedSection = section;
            setTimeout(() => {
                    (<any>$('#styles_properties')).collapse('show'); //.attr('aria-expanded', 'true');
                }, 100);
        }

        public initWizard() {
            console.log('init wizard');
            this.selectedSection = null;
            this.selectedGroup = null;
            if (this.$layerService.project.groups && this.$layerService.project.groups.length > 0) {
                this.$layerService.project.groups.forEach((g) => {
                    delete g._gui['sections'];
                    delete g._gui['showSections'];

                    if (g.layers) {
                        var resources = [];
                        var sections: { [key: string]: csComp.Services.Section } = {};
                        g.layers.forEach((l) => {
                            if (l.enabled) {
                                if (l._gui['sections'])
                                {
                                    for (var s in l._gui['sections'])
                                    {
                                        var section : csComp.Services.Section = l._gui['sections'][s];
                                        if (!sections.hasOwnProperty(s)) sections[s] = new csComp.Services.Section();

                                        for (var label in section.properties)
                                        {
                                            if (!sections[s].properties.hasOwnProperty(label)) sections[s].properties[label] = section.properties[label];
                                        };
                                    }
                                }
                            }
                        });
                        if (_.keys(sections).length > 0) g._gui['sections'] = sections;
                        if (_.keys(sections).length > 1) g._gui['showSections'] = true;

                    }
                });
                this.selectGroup(this.$layerService.project.groups[0]);
            }
        }

        public setStyle(g: csComp.Services.ProjectGroup, property: csComp.Services.IPropertyType) {
            this.$layerService.setGroupStyle(g, property);
        }

        getStyle(legend: csComp.Services.Legend, le: csComp.Services.LegendEntry, key: number) {
            return {
                'float': 'left',
                'position': 'relative',
                'top': '10px',
                'background': `linear-gradient(to bottom, ${le.color}, ${legend.legendEntries[legend.legendEntries.length - key - 2].color})`
            };
        }

    }
}
