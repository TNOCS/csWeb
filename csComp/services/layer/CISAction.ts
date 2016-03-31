module CISAction {
    export interface ICISActionSettings {
        url: string;
    }
    
    export interface ICISMessage {
        msg: string;
        msgType: string;
        deParameters: { [ key: string]: any};
    }
    
    export interface IDEParameters {
        id: string;
        senderId: string;
        dateTimeSent: string;
        status: string;
        kind: string;
        descriptionType?: string;
        contentType?: string;
        contentObjectType?: string;
    }

    export interface ICAPAlert {
        identifier: string;
        sender: string;
        sent: string;
        status: string;
        msgType: string;
        scope: string;
        addresses?: string[];
        references?: string[];
        info: ICAPInfo;
    }
    
    export interface ICAPInfo {
        senderName?: string;
        event: string;
        description?: string;
        category: string;
        severity: string;
        certainty: string;
        urgency: string;
        onset?: string;
        eventCode?: string;
        headline?: string;
        expires?: string;
        responseType?: string;
        instruction?: string;
        area: ICAPArea;
    }

    export interface ICAPArea {
        areaDesc: string;
        polygon?: Object;
        point?: Object;
    }

    import IFeature = csComp.Services.IFeature;
    import IProjectLayer = csComp.Services.IProjectLayer;
    import IActionOption = csComp.Services.IActionOption;

    export class CISAction implements csComp.Services.IActionService {
        public id: string = 'CISAction';
        private layerService: csComp.Services.LayerService;
        private notifyUrl: string;

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }
        addLayer(layer : csComp.Services.IProjectLayer) {}
        removeLayer(layer : csComp.Services.IProjectLayer) {}

        getFeatureActions(feature: IFeature): IActionOption[] {
            if (!feature) return [];
            var sendCISMessageOption = <IActionOption>{
                title: 'Send CIS message'
            };
            sendCISMessageOption.callback = this.sendCISMessage;
            return [sendCISMessageOption];
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }
        
        getLayerActions(layer: IProjectLayer) { 
            return [];
        }

        private sendCISMessage(feature: IFeature, layerService: csComp.Services.LayerService) {
            var fType = layerService.getFeatureType(feature);
            var url = fType['cisUrl'] || '/cis/notify';
            console.log('Send CIS message');
            var cisMessage = JSON.parse(JSON.stringify(CISAction.createDefaultCISMessage()));
            console.log(url);
            $.ajax({
                contentType: 'application/json',
                data: JSON.stringify(cisMessage),
                url: url,
                dataType: 'json',
                crossDomain: true,
                type: 'POST',
                success: (data, status, jqxhr) => {
                    console.log('Sent CIS successfully');
                },
                error: (err) => {
                    console.log('Error sending CIS');
                }
            });
        }
        
        private static createDefaultCISMessage(): ICISMessage {
            var deParams: IDEParameters = {
                id: 'csweb' + csComp.Helpers.getGuid(),
                senderId: 'someone@csweb',
                dateTimeSent: (new Date().toISOString()),
                kind: 'Report',
                status: 'Excercise'                
            }

            var cisMessage: ICISMessage = {
                msgType: "CAP",
                msg: "csWeb-testmessage",
                deParameters: deParams
            }
            return cisMessage;
        }

        public init(layerService: csComp.Services.LayerService) {
            this.notifyUrl = '/cis/notify';
            console.log(`Init CISActionService with notify on ${this.notifyUrl}`);
        }
    }
}

