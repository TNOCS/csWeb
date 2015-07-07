import fs = require('fs');
import path = require('path');
import HyperTimer = require('hypertimer');
import WorldState = require('./WorldState');
import Rule = require('./Rule');
import DynamicLayer = require("ServerComponents/dynamic/DynamicLayer");
import GeoJSON = require("../helpers/GeoJSON");

/**
 * Simplified abstraction of the ClientConnection.
 */
export interface IConnectionService {
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @skip: this one will be skipped ( e.g original source)
     */
     updateFeature(feature: GeoJSON.IFeature);
    //updateFeature(layer: string, object: any, action: string, skip?: string);
}

export interface IRuleEngineService extends IConnectionService {
    layer?: DynamicLayer.IDynamicLayer;
    activateRule?: (ruleId: string) => void;
    deactivateRule?: (ruleId: string) => void;
    timer?: HyperTimer;
}

export class RuleEngine {
    private worldState: WorldState = new WorldState();
    /** A set of rules that are active but have not yet fired. */
    private activeRules: Rule.IRule[] = [];
    /** A set of rules that are inactive and may become activated. */
    private inactiveRules: Rule.IRule[] = [];
    /** A set of rules to activate at the end of the rule evaluation cycle */
    private activateRules: string[] = [];
    /** A set of rules to deactivate at the end of the rule evaluation cycle */
    private deactivateRules: string[] = [];
    /** Unprocessed features that haven't been evaluated yet */
    private featureQueue: GeoJSON.IFeature[] = [];
    private isBusy: boolean;
    private timer: HyperTimer;

    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @skip: this one will be skipped ( e.g original source)
     */
    service: IRuleEngineService = { updateFeature: null };

    constructor(layer: DynamicLayer.IDynamicLayer) {
        this.timer = new HyperTimer( { rate: 1, time: new Date()});

        this.service.updateFeature = (feature: GeoJSON.IFeature) => layer.updateFeature(feature);
        this.service.layer = layer;
        this.service.activateRule = (ruleId: string) => this.activateRule(ruleId);
        this.service.deactivateRule = (ruleId: string) => this.deactivateRule(ruleId);
        this.service.timer = this.timer;

        layer.on("featureUpdated", (layerId: string, featureId: string) => {
            console.log(`Feature update with id ${featureId} and layer id ${layerId} received in the rule engine.`)

            this.worldState.activeFeature = undefined;
            this.worldState.features.some(f => {
                if (f.id !== featureId) return false;
                this.worldState.activeFeature = f;
                this.evaluateRules(f);
                return true;
            });
        });
    }

    activateRule(ruleId: string) {
        for (let i = 0; i < this.inactiveRules.length; i++) {
            var rule = this.inactiveRules[i];
            if (rule.id !== ruleId) continue;
            rule.isActive = true;
            this.activeRules.push(rule);
            // FIXME this.inactiveRules.splice(i, 1);
            return;
        }
    }

    deactivateRule(ruleId: string) {
        for (let i = 0; i < this.activeRules.length; i++) {
            var rule = this.activeRules[i];
            if (rule.id !== ruleId) continue;
            rule.isActive = false;
            this.inactiveRules.push(rule);
            // FIXME <this.activeRules.splice(i, 1);
            return;
        }
    }

    /**
     * Indicates whether the engine is ready to evaluate the rules.
     */
    isReady() { return this.isBusy; }

    /**
     * Load one or more rule files.
     * @filename: String or string[] with the full filename.
     * @activationTime: Optional date that indicates when the rules are activated.
     */
    loadRules(filename: string | string[], activationTime?: Date) {
        if (typeof activationTime === 'undefined') activationTime = new Date();
        if (typeof filename === "string") {
            this.loadRuleFile(filename, activationTime);
        } else {
            filename.forEach(f => this.loadRuleFile(f, activationTime));
        }
    }

    /**
     * Internal method to actually load a rule file.
     */
    private loadRuleFile(filename: string, activationTime: Date) {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.error('Error opening rules: ' + filename);
                console.error(err);
                return;
            }
            var geojson: GeoJSON.IGeoJson = JSON.parse(data);
            console.log("#features: " + geojson.features.length);
            geojson.features.forEach(f => {
                this.worldState.features.push(f);
                if (typeof f.properties === 'undefined' || !f.properties.hasOwnProperty("_rules")) return;
                // TODO Add feature to world state.
                var rules = f.properties["_rules"];
                /*console.log(JSON.stringify(rules, null, 2));*/
                rules.forEach(r => this.addRule(r, f, activationTime));
            });
        });
    }

    /**
     * Add a rule to the engine.
     */
    addRule(rule: Rule.IRule, feature?: GeoJSON.IFeature, activationTime?: Date) {
        if (typeof rule.actions === 'undefined' || rule.actions.length === 0 || rule.actions[0].length === 0) return;
        var newRule = new Rule.Rule(rule, activationTime);
        if (feature) {
            newRule.feature = feature;
        }
        if (newRule.isActive)
            this.activeRules.push(newRule);
        else
            this.inactiveRules.push(newRule);
    }

    /**
     * Evaluate the rules, processing the current feature
     */
    evaluateRules(feature?: GeoJSON.IFeature) {
        console.log('evaluating rules...');
        if (this.isBusy) {
            console.warn("Added feature ${feature.id} to the queue (#items: $this.featureQueue.length}).");
            this.featureQueue.push(feature);
            return;
        }
        this.isBusy = true;
        // Update the set of applicable rules
        this.activeRules   = this.activeRules.filter(r => r.isActive);
        this.inactiveRules = this.inactiveRules.filter(r => !r.isActive);
        // Process all rules
        this.worldState.activeFeature = feature;
        this.activeRules.forEach(r => r.process(this.worldState, this.service));
        // Add rules to activate to the activeRules
        /*this.activateRules.forEach(ruleId => {
            // use array.some
            for (let i = 0; i < this.inactiveRules.length; i++) {
                var rule = this.inactiveRules[i];
                if (rule.id !== ruleId) continue;
                rule.isActive = true;
                this.activeRules.push(rule);
                this.inactiveRules.splice(i, 1);
                return;
            }
        });*/
        // Add rules to deactivate to the inactiveRules
        /*this.deactivateRules.forEach(ruleId => {
            for (let i = 0; i < this.activeRules.length; i++) {
                var rule = this.activeRules[i];
                if (rule.id !== ruleId) continue;
                rule.isActive = false;
                this.inactiveRules.push(rule);
                this.activeRules.splice(i, 1);
                return;
            }
        });*/
        this.isBusy = false;
        if (this.featureQueue.length > 0) {
            var f = this.featureQueue.pop();
            this.evaluateRules(f);
        }
    }
}
