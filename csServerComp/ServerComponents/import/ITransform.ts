interface ITransform {
    id:                    string;
    title:                 string;
    description:           string;
    parameterTitles:       string[];
    parameterDescriptions: string[];
    parameterTypes:        string[];

    transform(s: MSStreamReader, ...params);

    init();
    run();
}
export=ITransform;
