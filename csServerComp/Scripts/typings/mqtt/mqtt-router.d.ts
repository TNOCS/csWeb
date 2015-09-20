declare module "mqtt-router" {
    var mqttrouter: mqttrouter.MqttClientWrapper;

    export = mqttrouter;

    module mqttrouter {
        interface MqttClientWrapper {
            wrap(mqttClient: any): MqttRouter;
        }

        interface MqttRouter {
            subscribe(topic: string, callback: (topic: string, message: any, params?: any) => void);
        }
    }
}
//declare var mqttrouter: "mqtt-router".MqttClientWrapper;


// interface MqttClientWrapper {
//     wrap(mqttClient: any): MqttRouter;
// }
//
// interface MqttRouter {
//     subscribe(topic: string, callback: (topic: string, message: any, params?: any) => {});
// }
//
// declare var mqttrouter: MqttClientWrapper;
//
// declare module "mqtt-router" {
//     export = mqttrouter;
// }
