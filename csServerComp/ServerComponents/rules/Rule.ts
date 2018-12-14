import RuleEngine = require('./RuleEngine');
import WorldState = require('./WorldState');
import Utils = require('../helpers/Utils')
import ApiManager = require('../api/ApiManager');
import Feature = ApiManager.Feature;
import DynamicLayer = require('../dynamic/DynamicLayer');

export interface IRule {
    /** Identifier */
    id?: string;

    /**
     * Descriptive text, is not used in the code but only for annotation purposes.
     * @type {string}
     */
    description?: string;

    /**
     * The time the rule is activated.
     * Typically, at start, but some rules may be activated at a later time..
     */
    activatedAt?: Date;

    /** * The rule can only be fired when it is active. */
    isActive?: boolean;

    /**
     * If true (default is false), indicates that we are dealing with a generic rule,
     * i.e. not tied to a specific feature.
     * @type {boolean}
     */
    isGenericRule?: boolean;

    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence?: number;

    /** Feature this rule applies too */
    feature?: Feature;

    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions?: [[string | number | boolean, string | number | boolean, string | number | boolean | undefined]];

    /** Set of actions that will be executed when */
    actions?: [[string | number | boolean, string | number | boolean, string | number | boolean | undefined]];

    /** Evaluate the rule and execute all actions, is applicable. */
    process?: (worldState: WorldState.WorldState, service: RuleEngine.IRuleEngineService) => void;
}

/**
 * Simple rule, consisting of a condition and an action.
 */
export class Rule implements IRule {
    /** Identifier */
    id: string;
    description: string;

    /**
     * The time the rule is activated.
     * Typically, at start, but some rules may be activated at a later time..
     */
    activatedAt: Date;

    isGenericRule: boolean;

    /** The rule can only be fired when it is active. */
    isActive: boolean;

    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence: number = 1;

    feature: Feature;
    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions: [[string | number | boolean, string | number | boolean, string | number | boolean | undefined]];

    /** Set of actions that will be executed when */
    actions: [[string | number | boolean, string | number | boolean, string | number | boolean | undefined]];

    /** Create a new rule. */
    constructor(rule: IRule, activationTime?: Date) {
        // Don't bother with rules that take no actions.
        if (typeof rule.actions === 'undefined') return;
        if (typeof activationTime === 'undefined') activationTime = new Date();
        this.id = (typeof rule.id === 'undefined')
            ? Utils.newGuid()
            : rule.id;
        // By default, actions are active unless explicitly set.
        this.isActive = (typeof rule.isActive === 'undefined')
            ? true
            : rule.isActive;
        this.isGenericRule = (typeof rule.isGenericRule === 'undefined')
            ? false
            : rule.isGenericRule;
        if (this.isActive && typeof rule.activatedAt === 'undefined') this.activatedAt = activationTime;
        this.recurrence = rule.recurrence | 1;
        this.conditions = rule.conditions;
        this.actions = rule.actions;
    }

    /** Evaluate the rule and execute all actions, is applicable. */
    process(worldState: WorldState.WorldState, service: RuleEngine.IRuleEngineService) {
        // Check if we need to do anything.
        if (!this.isActive || this.recurrence === 0) return;
        // Check if we are dealing with a rule that belongs to a feature, and that feature is being processed.
        if (!this.isGenericRule && typeof worldState.activeFeature !== 'undefined' && typeof this.feature !== 'undefined' && worldState.activeFeature.id !== this.feature.id) return;
        // Finally, check the conditions, if any (if none, just go ahead and execute the actions)
        if (typeof this.conditions === 'undefined' || this.evaluateConditions(worldState)) {
            console.log('Start executing actions...');
            this.executeActions(worldState, service);
            if (this.recurrence > 0) this.recurrence--;
            if (this.recurrence === 0) service.deactivateRule(this.id);
        }
    }

    /** Evaluate the conditions and check whether all of them are true (AND). */
    private evaluateConditions(worldState: WorldState.WorldState) {
        for (let i = 0; i < this.conditions.length; i++) {
            var c = this.conditions[i];
            var check = c[0];
            if (typeof check === 'string') {
                var length: number = c.length;
                var prop: string | number | boolean;
                switch (check.toLowerCase()) {
                    case 'propertyexists':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 2) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            console.log(`Property ${prop} exists.`);
                        }
                        break;
                    case 'propertyisset':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length < 2) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (length === 2 && propValue === null) return false;
                            if (length === 3 && propValue !== c[2]) return false;
                            console.log(`Property ${prop} is set` + (length === 2 ? '.' : ' ' + c[2]));
                        }
                        break;
                    case 'propertygreaterorequalthan':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue < c[2]) return false;
                            console.log(`Property ${prop} is greater than ${c[2]}.`);
                        }
                        break;
                    case 'propertygreaterthan':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue <= c[2]) return false;
                            console.log(`Property ${prop} is greater than ${c[2]}.`);
                        }
                        break;
                    case 'propertyequals':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue !== c[2]) return false;
                            console.log(`Property ${prop} equals ${c[2]}.`);
                        }
                        break;
                    case 'propertydoesnotequal':
                    case 'propertynotequal':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue === c[2]) return false;
                            console.log(`Property ${prop} does not equal ${c[2]}.`);
                        }
                        break;
                    case 'propertylessthan':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue >= c[2]) return false;
                            console.log(`Property ${prop} is less than ${c[2]}.`);
                        }
                        break;
                    case 'propertylessorequalthan':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let propValue = worldState.activeFeature.properties[prop];
                            if (propValue > c[2]) return false;
                            console.log(`Property ${prop} is less or equal than ${c[2]}.`);
                        }
                        break;
                    case 'propertycontains':
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 3) return this.showWarning(c);
                        prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            let props: any[] = worldState.activeFeature.properties[prop];
                            if (props instanceof Array && props.indexOf(c[2]) < 0) return false;
                            console.log(`Property ${prop} contains ${c[2]}.`);
                        }
                        break;
                    default:
                        return false;
                }
            } else {
                // First item is not a key/string
                return false;
            }
        }
        return true;
    }

    private showWarning(condition: [string | number | boolean, string | number | boolean, string | number | boolean | undefined]) {
        console.warn(`Rule ${this.id} contains an invalid condition (ignored): ${condition}!`);
        return false;
    }

    private executeActions(worldState: WorldState.WorldState, service: RuleEngine.IRuleEngineService) {
        console.log(`Executing ${this.actions.length} actions:`);
        for (let i = 0; i < this.actions.length; i++) {
            var a = this.actions[i];
            console.log(`Executing action: ` + JSON.stringify(a, null, 2));
            var action = a[0];
            var key: string | number | boolean;
            if (typeof action === 'string') {
                var length = a.length;
                switch (action.toLowerCase()) {
                    case 'add':
                        // add feature
                        var id = service.timer.setTimeout(function(f, fid, service) {
                            return () => {
                                var feature = f;
                                if (length > 1) {
                                    var featureId = <string>a[1];
                                    worldState.features.some(feat => {
                                        if (feat && feat.id !== fid) return false;
                                        feature = feat;
                                        return true;
                                    });
                                }
                                console.log('Add feature ' + feature.id);
                                if (!feature.properties.hasOwnProperty('date')) feature.properties['date'] = new Date();
                                if (!feature.properties.hasOwnProperty('roles')) feature.properties['roles'] = ['rti'];
                                service.addFeature(feature)
                            }
                        } (this.feature, length > 1 ? <string>a[1] : '', service), this.getDelay(a, length - 1));
                        console.log(`Timer ${id}: Add feature ${this.isGenericRule ? a[1] : this.feature.id}`)
                        break;
                    case 'answer':
                    case 'set':
                        // Anwer, property, value [, delay], as set, but also sets answered to true and removes the action tag.
                        // Set, property, value [, delay] sets value and updated.
                        if (length < 3) {
                            console.warn(`Rule ${this.id} contains an invalid action (ignored): ${a}!`);
                            return;
                        }
                        var key = a[1];
                        if (typeof key === 'string') {
                            this.setTimerForProperty(service, key, a[2], this.getDelay(a, 3), action === 'answer');
                        }
                        break;
                    case 'push':
                        // push property value [, delay]
                        if (length < 3) {
                            console.warn(`Rule ${this.id} contains an invalid action (ignored): ${a}!`);
                            return;
                        }
                        var key2 = a[1];
                        if (typeof key2 === 'string') {
                            var valp = a[2];
                            var id = service.timer.setTimeout(function(f, k, v, service, updateProperty) {
                                return () => {
                                    console.log(`Feature ${f.id}. Pushing ${k}: ${v}`);
                                    if (!f.properties.hasOwnProperty(k)) {
                                        f.properties[k] = [v];
                                    } else {
                                        f.properties[k].push(v);
                                    }
                                    updateProperty(f, service, k, f.properties[k]);
                                }
                            } (this.feature, key2, valp, service, this.updateProperty), this.getDelay(a, 3));
                            console.log(`Timer ${id}: push ${key2}: ${valp}`)
                        }
                        break;
                }
            } else {
                console.warn(`Rule ${this.id} contains an invalid action (ignored): ${a}!`);
            }
        }
    }

    private setTimerForProperty(service: RuleEngine.IRuleEngineService, key: string, value: any, delay = 0, isAnswer = false) {
        var id = service.timer.setTimeout(function(f, k, v, service, updateProperty) {
            return () => {
                console.log(`Feature ${f.id}: ${k} = ${v}`);
                f.properties[k] = v;
                updateProperty(f, service, k, f.properties[key], isAnswer);
            }
        } (this.feature, key, value, service, this.updateProperty), delay);
        console.log(`Timer ${id}: ${key} = ${value}`)
    }

    private static updateLog(f: Feature, logs: { [prop: string]: DynamicLayer.IPropertyUpdate[] }, key: string, now: number, value: string | number | boolean) {
        if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
        var log: DynamicLayer.IPropertyUpdate = {
            'prop': key,
            'ts': now,
            'value': value
        };
        f.logs[key].push(log);
        if (logs) logs[key] = f.logs[key];
    }

    private updateProperty(f: Feature, service: RuleEngine.IRuleEngineService, key: string, value: any, isAnswer = false) {
        var now = service.timer.now();
        if (!f.hasOwnProperty('logs')) f.logs = {};
        var logs: { [prop: string]: DynamicLayer.IPropertyUpdate[] } = {};
        Rule.updateLog(f, logs, key, now, value);
        Rule.updateLog(f, null, 'updated', now, now);

        if (isAnswer) {
            Rule.updateLog(f, logs, 'answered', now, true);

            key = 'tags';
            if (f.properties.hasOwnProperty(key)) {
                let index = f.properties[key].indexOf('action');
                if (index >= 0) {
                    f.properties[key].splice(index, 1);
                    Rule.updateLog(f, logs, key, now, f.properties[key]);
                }
            }
        }
        console.log('Log message: ');
        service.updateLog(f.id, logs);
        service.updateFeature(f);
    }

    /** Get the delay, if present, otherwise return 0 */
    private getDelay(actions: [string | number | boolean, string | number | boolean, string | number | boolean | undefined], index: number) {
        if (index >= actions.length) return 0;
        var delay = actions[index];
        return (typeof delay === 'number')
            ? delay * 1000
            : 0;
    }
}
