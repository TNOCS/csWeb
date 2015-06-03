declare module XBBCODE {
    export interface IConfig {
        text                  : string;
        removeMisalignedTags? : boolean;
        addInLineBreaks?      : boolean;
    }

    export interface IBBCodeResult {
        html        : string;
        error       : boolean; 
        errorQueue? : string[];
    }

    export function process(config: IConfig): IBBCodeResult;
}