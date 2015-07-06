import RuleEngine = require('./RuleEngine');
import WorldState = require('./WorldState');
import Utils = require('../helpers/Utils')

export interface IRule {
    /** Identifier */
    id?: string;
    description?: string;

    /**
     * The time the rule is activated.
     * Typically, at start, but some rules may be activated at a later time..
     */
    activatedAt?: Date;

    /** * The rule can only be fired when it is active. */
    isActive?: boolean;

    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence?: number;

    /** Feature this rule applies too */
    feature?: WorldState.IFeature;

    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions?: [[string | number | boolean]];

    /** Set of actions that will be executed when */
    actions?: [[string | number | boolean]];

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

    /** The rule can only be fired when it is active. */
    isActive: boolean;

    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence: number = 1;

    feature: WorldState.IFeature;
    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions: [[string | number | boolean]];

    /** Set of actions that will be executed when */
    actions: [[string | number | boolean]];

    /** Create a new rule. */
    constructor(rule: IRule, activationTime?: Date) {
        // Don't bother with rules that take no actions.
        if (typeof rule.actions === 'undefined') return;
        if (typeof activationTime === 'undefined') activationTime = new Date();
        // By default, actions are active unless explicitly set.
        if (typeof rule.isActive === 'undefined') this.isActive = true;
        if (typeof rule.id === 'undefined') this.id = Utils.newGuid();
        if (typeof rule.recurrence === 'undefined') this.recurrence = 1;
        if (this.isActive && typeof rule.activatedAt === 'undefined') this.activatedAt = activationTime;
        if (typeof rule.conditions !== 'undefined') {
            this.conditions = rule.conditions;
        }
        this.actions = rule.actions;
    }

    /** Evaluate the rule and execute all actions, is applicable. */
    process(worldState: WorldState.WorldState, service: RuleEngine.IRuleEngineService) {
        // Check if we need to do anything.
        if (!this.isActive || this.recurrence === 0) return;
        // Check if we are dealing with a rule that belongs to a feature, and that feature is being processed.
        if (typeof worldState.activeFeature !== 'undefined' && typeof this.feature !== 'undefined' && worldState.activeFeature.id === this.feature.id) return;
        // Finally, check the conditions, if any (if none, just go ahead and execute the actions)
        if (typeof this.conditions === 'undefined' || this.evaluateConditions(worldState))
        {
            this.executeActions(worldState, service);
            this.recurrence--;
            if (this.recurrence === 0) service.deactivateRule(this.id);
        }
    }

    /** Evaluate the conditions and check whether all of them are true (AND). */
    private evaluateConditions(worldState: WorldState.WorldState) {
        for (let i = 0; i < this.conditions.length; i++) {
            var c = this.conditions[i];
            var key = c[0];
            if (typeof key === 'string') {
                var length = c.length;
                switch (key.toLowerCase()) {
                    case "propertyexists":
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length !== 2) {
                            console.warn(`Rule ${this.id} contains an invalid condition (ignored): ${c}!`);
                            return false;
                        }
                        var prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                        }
                        break;
                    case "propertyisset":
                        if (typeof worldState.activeFeature === 'undefined') return false;
                        if (length < 2) return false;
                        var prop = c[1];
                        if (typeof prop === 'string') {
                            if (!worldState.activeFeature.properties.hasOwnProperty(prop)) return false;
                            var propValue = worldState.activeFeature.properties[key];
                            if (length === 2 && propValue === null) return false;
                            if (length === 3 && propValue !== c[2]) return false;
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

    private executeActions(worldState: WorldState.WorldState, service: RuleEngine.IRuleEngineService) {
        for (let i = 0; i < this.actions.length; i++) {
            var a = this.actions[i];
            var key = a[0];
            if (typeof key === 'string') {
                let length = a.length;
                switch (key.toLowerCase()) {
                    case "add":
                        // add feature
                        service.timer.setTimeout(() => {
                            console.log('Add feature');
                            service.layer.addFeature(this.feature)},
                            this.getDelay(a, 1));
                        break;
                    case "set":
                        // Set property
                        if (length < 3) {
                            console.warn(`Rule ${this.id} contains an invalid action (ignored): ${a}!`);
                            return;
                        }
                        var key = a[1];
                        if (typeof key === 'string') {
                            service.timer.setTimeout( () => {
                                    console.log(`set ${key}: ${a[2]}`);
                                    this.feature.properties[key] = a[2];
                                },
                                this.getDelay(a, 3));
                        }
                        break;
                    case "setGeometry":
                        // set/activate the geometry
                        break;
                }
            } else {
                console.warn(`Rule ${this.id} contains an invalid action (ignored): ${a}!`);
            }
        }
    }

    /** Get the delay, if present, otherwise return 0 */
    private getDelay(actions: [string | number | boolean], index: number) {
        if (index >= actions.length) return 0;
        var delay = actions[index];
        return (typeof delay === 'number')
            ? delay * 1000
            : 0;
    }
}
