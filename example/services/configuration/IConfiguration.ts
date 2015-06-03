interface IConfiguration {
    add(key: string, value: string) : void;
    remove(key: string)             : void;
    containsKey(key: string)        : boolean;
    keys()                          : string[];
    clear()                         : void;
    count()                         : number;
    values()                        : Array<string>;
}
export = IConfiguration;
