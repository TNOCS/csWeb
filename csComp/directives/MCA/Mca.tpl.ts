module Mca { export var html = '<div>    <div class="wide-tooltip">        <span class="pull-right fa fa-info-circle fa-2x"              tooltip-html-unsafe="{{\'MCA.DESCRIPTION\' | translate}}"              tooltip-placement="bottom"              tooltip-trigger="mouseenter"              tooltip-append-to-body="false"              style="margin-right: 5px;"></span>        <h4 class="leftpanel-header">MCA</h4>    </div>    <div>        <select data-ng-model="vm.mca"                data-ng-options="mca.title for mca in vm.availableMcas"                style="width: 75%; margin-bottom:10px;"></select>        <a href="" data-ng-click="vm.createMca()" class="pull-right" style="margin-right:5px;"><i class="fa fa-plus"></i></a>        <a href="" data-ng-click="vm.removeMca(vm.mca)" class="pull-right" style="margin-right:5px;"><i class="fa fa-trash"></i></a>        <a href="" data-ng-click="vm.editMca(vm.mca)" class="pull-right" style="margin-right:5px;"><i class="fa fa-edit"></i></a>    </div>        <div data-ng-if="!vm.mca">        <div data-ng-if="vm.expertMode"  translate>MCA.INFO_EXPERT</div>        <div data-ng-if="!vm.expertMode" translate>MCA.INFO</div>    </div>    <div data-ng-if="vm.mca" style="overflow-y: auto; overflow-x: hidden" resize resize-y="120">        <div data-ng-repeat="criterion in vm.mca.criteria" style="margin-left: 5px">            <div data-ng-if="criterion.criteria.length > 0 && criterion.userWeight != 0" class="pull-left" style="margin: 0 5px 0 0" data-toggle="collapse" data-target="#criterion_{{$index}}"><i class="fa fa-chevron-down togglebutton toggle-arrow-down"></i><i class="fa fa-chevron-up togglebutton toggle-arrow-up"></i></div>            <div data-ng-style="{\'display\': \'inline-block\', \'margin-bottom\': \'6px\', \'width\':\'10px\', \'height\':\'10px\', \'border\':\'solid 1px black\', \'background-color\': criterion.color}"></div>            <div class="truncate" data-ng-class="{true: \'ignoredCriteria\'}[criterion.userWeight == 0]" style="display: inline-block; width: 150px;">{{criterion.getTitle()}}</div>            <voting class="pull-right"                    data-ng-class="vm.getVotingClass(criterion)"                    min="-vm.mca.userWeightMax"                    max="vm.mca.userWeightMax"                    value="criterion.userWeight"                    style="margin-right: 5px;"></voting>            <div data-ng-if="criterion.criteria.length == 0" style="margin-top: 5px;" id="histogram_{{$index}}"></div>            <!--<div data-ng-if="vm.expertMode && criterion.criteria.length == 0" style="margin-top: 5px; margin-left: 10px;" id="histogram_{{$index}}"></div>-->            <div data-ng-if="criterion.criteria.length > 0" id="criterion_{{$parent.$index}}" class="collapse out" style="margin-left: 19px">                <div data-ng-repeat="crit in criterion.criteria">                    <div data-ng-style="{\'display\': \'inline-block\', \'margin-bottom\': \'6px\', \'width\':\'10px\', \'height\':\'10px\', \'border\':\'solid 1px black\', \'background-color\': crit.color}"></div>                    <div class="truncate" data-ng-class="{true: \'ignoredCriteria\'}[crit.userWeight == 0]" style="display: inline-block; width: 150px;">{{crit.getTitle()}}</div>                    <div class="pull-right" style="margin-right: 15px;">{{Math.abs(crit.userWeight)}}</div>                    <voting class="pull-right"                            data-ng-class="vm.getVotingClass(criterion)"                            min="0"                            max="vm.mca.userWeightMax"                            value="crit.userWeight"                            style="margin-right: 5px;"></voting>                    <div style="margin-top: 5px;" id="histogram_{{$parent.$index}}_{{$index}}"></div>                    <!--<div data-ng-if="vm.expertMode" style="margin-top: 5px; margin-left: 20px;" id="histogram_{{$parent.$index}}_{{$index}}"></div>-->                </div>            </div>        </div>        <!--<a href="" style="display: inline-block; width: 100%; text-transform: uppercase"               data-ng-click="vm.calculateMca()" translate="MCA.COMPUTE_MGS" translate-values="{ mcaTitle: vm.mca.title }"></a>-->        <h4 data-ng-if="vm.showChart">            <a href="" data-ng-click="vm.weightUpdated(vm.mca)" translate="MCA.TOTAL_RESULT"></a>            <a href="" data-ng-if="vm.selectedCriterion">&gt;&nbsp;{{vm.selectedCriterion.title}}</a>        </h4>        <div style="margin-top: 5px; margin-left: 70px;" id="mcaPieChart"></div>        <div data-ng-if="vm.showFeature">            <h4>                <img data-ng-if="vm.featureIcon" data-ng-src="{{vm.featureIcon}}" width="24" height="24" style="margin:0 5px" alt="Icon" />                {{vm.selectedFeature.properties[\'Name\']}}            </h4>            <table class="table table-condensed">                <tr data-ng-repeat="item in vm.properties"                    popover="{{item.description}}"                    popover-placement="right"                    popover-trigger="mouseenter"                    popover-append-to-body="true">                    <td><a class="fa fa-filter makeNarrow" data-ng-if="item.canFilter" data-ng-click="vm.$layerService.setFilter(item)" style="cursor: pointer"></a></td>                    <td><a class="fa fa-eye makeNarrow" data-ng-if="item.canStyle" data-ng-click="vm.setStyle(item)" style="cursor: pointer"></a></td>                    <td>{{item.key}}</td>                    <td class="text-right">{{item.value}}</td>                </tr>            </table>        </div>        <i data-ng-if="!vm.showFeature"><div translate="MCA.SHOW_FEATURE_MSG"></div></i>    </div>    <!--<div rating class="pull-right"             data-ng-style="{\'margin\': \'0 10px\', \'background\':\'rgba(0, 0, 0, 0.1)\', \'border-radius\': \'8px\', \'padding\': \'0 4px\', \'color\': criterion.color}"             ng-model="criterion.userWeight" max="11" readonly="isReadonly"             rating-states="ratingStates"             data-ng-click="vm.weightUpdated(criterion)"             on-hover="hoveringOver(value)" on-leave="overStar = null"></div>--></div>'; }