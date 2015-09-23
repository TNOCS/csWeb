interface ILayer {
    index: number;
    id: string;
    reference: string;
    title: string;
    description: string;
    type: string;
    url: string;
    enabled: boolean;
    opacity: number;

    typeUrl?: string;
    defaultFeatureType?: string;
}
export = ILayer;
