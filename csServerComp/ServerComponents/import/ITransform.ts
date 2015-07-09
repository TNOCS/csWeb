import stream  = require('stream');
import IImport = require('./IImport');
import ConfigurationService = require('../configuration/ConfigurationService');

export enum InputDataType {
    file,
    url,
    mongo,
    pg,
    shape,
    geojson,
    zip
}

export enum OutputDataType {
    file,
    geojson,
    mongo,
    pg
}

export interface IParameterType {
    title:       string;
    description: string;
    type:        string;
}

export interface IParameter {
    value: string | number | boolean;
    type:  IParameterType;
}

export interface ITransformFactoryOptions extends stream.TransformOptions {
    importer?:   IImport;
    parameters?: IParameter[];
}

/**
 * Factory for creating a transform stream (readable, writeable or transform).
 */
export interface ITransform {
    id:               string;
    title:            string;
    description?:     string;
    type:             string;
    /**
     * Accepted input types.
     */
    inputDataTypes?:  InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes?: OutputDataType[];

    create?(config: ConfigurationService, opt?: ITransformFactoryOptions): NodeJS.ReadWriteStream;

    initialize(opt?: ITransformFactoryOptions, callback?: (error)=>void);
}

// import s = require('stream');
// class t {
//     constructor() {
//         var opts: stream.TransformOptions = {
//
//         }
//         _transform(chunk: string | Buffer, encoding: string, callback: Function);
//         new(opt?: stream.TransformOptions);
//         var transform = new stream.Transform();
//         transform._transform()
//         transform.pipe()
//     }
// }
