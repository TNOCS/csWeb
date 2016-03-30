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
        DISTR_ID: string;
        DISTR_SENDERID: string;
        DISTR_DATETIMESENT: string;
        DISTR_DATETIMEEXPIRES: string;
        DISTR_STATUS: string;
        DISTR_KIND: string;
    }

    import IFeature = csComp.Services.IFeature;
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

        private sendCISMessage(feature: IFeature, layerService: csComp.Services.LayerService) {
            var fType = layerService.getFeatureType(feature);
            var url = fType['cisUrl'] || '/cis/notify';
            console.log('Send CIS message');
            var cisMessage = JSON.parse(JSON.stringify(CISAction.createDefaultCISMessage()));
            url += `?msgType=${cisMessage.msgType}&msg=${cisMessage.msg}`;//&deParameters=${cisMessage.deParameters}`;
            console.log(url);
            $.get(url, {
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
                DISTR_ID: 'csweb' + csComp.Helpers.getGuid(),
                DISTR_SENDERID: 'someone@csweb',
                DISTR_DATETIMESENT: (new Date().toISOString()),
                DISTR_DATETIMEEXPIRES: (new Date(Date.now() + 300000).toISOString()), //5mins
                DISTR_KIND: 'Report',
                DISTR_STATUS: 'Excercise'
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

