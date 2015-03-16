'use strict'
/**
* Offline Search Result contains the result of performing a scan of all the project layer files. 
*/

import path = require('path');
import fs   = require('fs');

export class Layer {
    /**
    * Size in bytes of the layer
    */
    size     : number;
    /**
    * Time it was last written
    */
    lastWrite: Date;

    constructor(private id: string, private title: string, private path: string) {}
}

export class PropertyName {
    /**
    * Name of the property
    */
    name: string;
    /**
    * Translation key of the property
    */
    key: string;
}

/**
* An index entry that contains a search result.
*/
export class Entry {
    constructor(private layerIndex: number, private featureIndex: number, private propertyIndex: number) {}
}

export class KeywordIndex { [key: string]: Entry[] }

export class OfflineSearchResult {
    layers       : Layer[] = [];
    propertyNames: PropertyName[] = [];
    keywordIndex : KeywordIndex = {};

    constructor(public projectFile: string, public stopwords: string[]) {}
}