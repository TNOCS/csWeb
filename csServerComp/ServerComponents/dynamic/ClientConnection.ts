import io = require('socket.io');
import MessageBus = require("../bus/MessageBus");
import Winston = require('winston');
import ApiManager = require('../api/ApiManager');
import ApiMeta = ApiManager.ApiMeta;


module ClientConnection {
    GetDataSource: Function;
    export class msgSubscription {
        public id: string;
        public type: string;
        public target: string;
        public callback: Function;
    }

    export class LayerSubscription {
        public layerId: string;
        public callback: MessageBus.IMessageBusCallback
    }

    export class KeySubscription {
        public keyId: string;
        public callback: MessageBus.IMessageBusCallback
    }

    /**
     * object for sending layer messages over socket.io channel
     */
    export class LayerUpdate {
        public layerId: string;
        public action: LayerUpdateAction;
        public item: any;
        public featureId: string;
    }

    /**
     * object for sending layer messages over socket.io channel
     */
    export class KeyUpdate {
        public keyId: string;
        public action: KeyUpdateAction;
        public item: any;
    }

    /**
     * List of available action for sending/receiving layer actions over socket.io channel
     */
    export enum LayerUpdateAction {
        updateFeature,
        updateLog,
        deleteFeature,
        updateLayer
    }

    /**
     * List of available action for sending/receiving key actions over socket.io channel
     */
    export enum KeyUpdateAction {
        updateKey
    }

    export class ClientMessage {
        constructor(public action: string, public data: any) { }
    }

    export class WebClient {
        public Name: string;
        public Subscriptions: { [key: string]: msgSubscription } = {};

        constructor(public Client: any) {
        }

        public FindSubscription(target: string, type: string): msgSubscription {
            for (var k in this.Subscriptions) {
                if ((this.Subscriptions[k].type === "key" && type === "key") || (this.Subscriptions[k].target == target && this.Subscriptions[k].type == type)) return this.Subscriptions[k];
            }
            return null;
        }

        public Subscribe(sub: msgSubscription) {
            this.Subscriptions[sub.id] = sub;
            this.Client.on(sub.id, (data) => {
                switch (data.action) {
                    case "unsubscribe":
                        Winston.info('clientconnection: unsubscribed (' + sub.id + ")");
                        delete this.Subscriptions[sub.id];
                        break;
                }
            });
            this.Client.emit(sub.id, new ClientMessage("subscribed", ""));
            Winston.info('clientconnection: subscribed to : ' + sub.target + " (" + sub.id + " : " + sub.type + ")");
        }
    }

    export class ConnectionManager {
        private users: { [key: string]: WebClient } = {};
        public server: SocketIO.Server;

        //public subscriptions: LayerSubscription[] = [];
        public msgSubscriptions: msgSubscription[] = [];


        constructor(httpServer: any) {
            this.server = io(httpServer);

            this.server.on('connection', (socket: SocketIO.Socket) => {
                // store user
                Winston.info('clientconnection: user ' + socket.id + ' has connected');
                var wc = new WebClient(socket);
                this.users[socket.id] = wc;

                socket.on('disconnect', (s: SocketIO.Socket) => {
                    delete this.users[socket.id];
                    Winston.info('clientconnection: user ' + socket.id + ' disconnected');
                });

                socket.on('subscribe', (msg: msgSubscription) => {
                    //Winston.error(JSON.stringify(msg));
                    Winston.info('clientconnection: subscribe ' + JSON.stringify(msg.target));
                    wc.Subscribe(msg);
                    // wc.Client.emit('laag', 'test');
                    //socket.emit('laag', 'test');
                });

                socket.on('msg', (msg: ClientMessage) => {
                    this.checkClientMessage(msg, socket.id);
                });

                // socket.on('layer', (msg: LayerMessage) => {
                //     this.checkLayerMessage(msg, socket.id);
                // });
                // create layers room
                //var l = socket.join('layers');
                //l.on('join',(j) => {
                //    Winston.info("layers: "+ j);
                //});
            });
        }


        public checkClientMessage(msg: ClientMessage, client: string) {
            this.msgSubscriptions.forEach((sub: msgSubscription) => {
                if (sub.target === msg.action) {
                    sub.callback(msg, client);
                }
            });
        }

        // public checkLayerMessage(msg: LayerMessage, client: string) {
        //     this.subscriptions.forEach((s: LayerSubscription) => {
        //         if (msg.layerId === s.layerId) {
        //             s.callback(LayerMessageAction[msg.action], msg, client);
        //         }
        //     });
        // }

        public registerLayer(layerId: string, callback: MessageBus.IMessageBusCallback) {
            var sub = new LayerSubscription();
            sub.layerId = layerId;

            sub.callback = callback;
            //this.subscriptions.push(sub);
        }

        public subscribe(on: string, callback: Function) {
            var cs = new msgSubscription();
            cs.target = on;
            cs.callback = callback;
            this.msgSubscriptions.push(cs);
        }

        //
        // //Winston.info('updateSensorValue:' + sensor);
        // for (var uId in this.users) {
        //     //var sub = this.users[uId].FindSubscription(sensor,"sensor");
        //     for (var s in this.users[uId].Subscriptions) {
        //         var sub = this.users[uId].Subscriptions[s];
        //         if (sub.type == "sensor" && sub.target == sensor) {
        //             //Winston.info('sending update:' + sub.id);
        //             var cm = new ClientMessage("sensor-update", [{ sensor: sensor, date: date, value: value }]);
        //             //Winston.info(JSON.stringify(cm));
        //             this.users[uId].Client.emit(sub.id, cm);
        // }
        public updateSensorValue(sensor: string, date: number, value: number) {
            //Winston.info('updateSensorValue:' + sensor);
            for (var uId in this.users) {
                //var sub = this.users[uId].FindSubscription(sensor,"sensor");
                for (var s in this.users[uId].Subscriptions) {
                    var sub = this.users[uId].Subscriptions[s];
                    if (sub.type == "sensor" && sub.target == sensor) {
                        //Winston.info('sending update:' + sub.id);
                        var cm = new ClientMessage("sensor-update", [{ sensor: sensor, date: date, value: value }]);
                        //Winston.info(JSON.stringify(cm));
                        this.users[uId].Client.emit(sub.id, cm);
                    }
                }
            }
        }

        public publish(key: string, type: string, command: string, object: any) {
            for (var uId in this.users) {
                var sub = this.users[uId].FindSubscription(key, type);
                if (sub != null) {
                    Winston.info('sending update:' + sub.id);
                    this.users[uId].Client.emit(sub.id, new ClientMessage(command, object));
                }
            }
        }

        public updateDirectory(layer: string) {

        }

        /**
         * Send update to all clients.
         * @action: logs-update, feature-update
         * @meta: used to determine source/user, will skip
         */
        public updateFeature(layerId: string, update: LayerUpdate, meta: ApiMeta) {
            //Winston.info('update feature ' + layer);
            var skip = (meta.source === "socketio") ? meta.user : undefined;
            for (var uId in this.users) {
                if (!skip || uId != skip) {
                    var sub = this.users[uId].FindSubscription(layerId, "layer");
                    if (sub != null) {
                        Winston.info('send to : ' + sub.id);
                        this.users[uId].Client.emit(sub.id, new ClientMessage("layer", update));
                    }
                }
            }
        }

        /**
         * Send update to all clients.
         * @action: logs-update, feature-update
         * @meta: used to determine source/user, will skip
         */
        public updateLayer(layerId: string, update: LayerUpdate, meta: ApiMeta) {
            //Winston.info('update feature ' + layer);
            var skip = (meta.source === "socketio") ? meta.user : undefined;
            for (var uId in this.users) {
                if (!skip || uId != skip) {
                    var sub = this.users[uId].FindSubscription("", "directory");
                    if (sub != null) {
                        Winston.info('send to : ' + sub.id);
                        this.users[uId].Client.emit(sub.id, new ClientMessage("layer", update));
                    }
                }
            }
        }

        /**
         * Send update to all clients.
         * @action: logs-update, feature-update
         * @meta: used to determine source/user, will skip
         */
        public updateKey(keyId: string, update: KeyUpdate, meta: ApiMeta) {

            //Winston.info('update feature ' + layer);
            var skip = (meta.source === "socketio") ? meta.user : undefined;
            for (var uId in this.users) {
                if (!skip || uId != skip) {
                    console.log(JSON.stringify(this.users[uId].Subscriptions));
                    var sub = this.users[uId].FindSubscription(keyId, "key");
                    if (sub != null) {
                        Winston.info('send to : ' + sub.id);
                        this.users[uId].Client.emit(sub.id, new ClientMessage("key", update));
                    }
                }
            }
        }


    }
}
export = ClientConnection;
