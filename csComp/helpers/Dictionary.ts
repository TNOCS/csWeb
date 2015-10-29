module csComp.Helpers {
    export interface IDictionary<T> {
        add(key        : string, value: T): void;
        remove(key     : string): void;
        containsKey(key: string): boolean;
        keys()         : string[];
        clear()        : void;
        count()        : number;
        values()       : Array<T>;
    }

    export class Dictionary<T> implements IDictionary<T> {
        private theKeys: string[] = [];
        private theValues: Array<T> = [];

        constructor() {}

        initialize(init: { key: string; value: T; }[]) {
            for (var x = 0; x < init.length; x++) {
                this[init[x].key] = init[x].value;
                this.theKeys.push(init[x].key);
                this.theValues.push(init[x].value);
            }
        }

        add(key: string, value: any) {
            this[key] = value;
            this.theKeys.push(key);
            this.theValues.push(value);
        }

        remove(key: string) {
            var index = this.theKeys.indexOf(key, 0);
            this.theKeys.splice(index, 1);
            this.theValues.splice(index, 1);
            delete this[key];
        }

        clear() {
            for (var i = this.theKeys.length; i >= 0; i--) {
                var key = this.theKeys[i];
                this.remove(key);
            }
        }

        count() {
            return this.theKeys.length;
        }

        keys(): string[] {
            return this.theKeys;
        }

        values(): Array<T> {
            return this.theValues;
        }

        containsKey(key: string) {
            return (typeof this[key] !== "undefined")
        }

        toLookup(): IDictionary<T> {
            return this;
        }
    }
} 