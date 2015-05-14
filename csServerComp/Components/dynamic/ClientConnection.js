var io = require('socket.io');
var ClientConnection;
(function (ClientConnection) {
    GetDataSource: Function;
    var ClientSubscription = (function () {
        function ClientSubscription() {
        }
        return ClientSubscription;
    })();
    ClientConnection.ClientSubscription = ClientSubscription;
    var ClientMessage = (function () {
        function ClientMessage(action, data) {
            this.action = action;
            this.data = data;
        }
        return ClientMessage;
    })();
    ClientConnection.ClientMessage = ClientMessage;
    var WebClient = (function () {
        function WebClient(Client) {
            this.Client = Client;
            this.Subscriptions = {};
        }
        WebClient.prototype.FindSubscription = function (target, type) {
            for (var k in this.Subscriptions) {
                if (this.Subscriptions[k].target == target && this.Subscriptions[k].type == type)
                    return this.Subscriptions[k];
            }
            return null;
        };
        WebClient.prototype.Subscribe = function (sub) {
            this.Subscriptions[sub.id] = sub;
            this.Client.on(sub.id, function (data) {
                switch (data.action) {
                    case "unsubscribe":
                        console.log('unsubscribed');
                        break;
                }
            });
            this.Client.emit(sub.id, new ClientMessage("subscribed", ""));
            console.log('subscribed to : ' + sub.target + " (" + sub.type + ")");
        };
        return WebClient;
    })();
    ClientConnection.WebClient = WebClient;
    var ConnectionManager = (function () {
        function ConnectionManager(httpServer) {
            var _this = this;
            this.users = {};
            this.server = io(httpServer);
            this.server.on('connection', function (socket) {
                console.log('user ' + socket.id + ' has connected');
                var wc = new WebClient(socket);
                _this.users[socket.id] = wc;
                socket.on('disconnect', function (s) {
                    delete _this.users[socket.id];
                    console.log('user ' + socket.id + ' disconnected');
                });
                socket.on('subscribe', function (msg) {
                    console.log('subscribe ' + JSON.stringify(msg.target));
                    wc.Subscribe(msg);
                });
            });
        }
        ConnectionManager.prototype.registerLayer = function (id) {
        };
        ConnectionManager.prototype.updateSensorValue = function (sensor, date, value) {
            for (var uId in this.users) {
                for (var s in this.users[uId].Subscriptions) {
                    var sub = this.users[uId].Subscriptions[s];
                    if (sub.type == "sensor" && sub.target == sensor) {
                        var cm = new ClientMessage("sensor-update", [{ sensor: sensor, date: date, value: value }]);
                        this.users[uId].Client.emit(sub.id, cm);
                    }
                }
            }
        };
        ConnectionManager.prototype.sendUpdate = function (key, type, command, object) {
            for (var uId in this.users) {
                var sub = this.users[uId].FindSubscription(key, type);
                if (sub != null) {
                    this.users[uId].Client.emit(sub.id, new ClientMessage("command", object));
                }
            }
        };
        ConnectionManager.prototype.updateFeature = function (layer, feature) {
            for (var uId in this.users) {
                var sub = this.users[uId].FindSubscription(layer, "layer");
                if (sub != null) {
                    this.users[uId].Client.emit(sub.id, new ClientMessage("feature-update", [feature]));
                }
            }
        };
        ConnectionManager.prototype.deleteFeature = function (layer, feature) {
            for (var uId in this.users) {
                var sub = this.users[uId].FindSubscription(layer, "layer");
                if (sub != null) {
                    this.users[uId].Client.emit(sub.id, new ClientMessage("feature-delete", [feature.id]));
                }
            }
        };
        return ConnectionManager;
    })();
    ClientConnection.ConnectionManager = ConnectionManager;
})(ClientConnection || (ClientConnection = {}));
module.exports = ClientConnection;
