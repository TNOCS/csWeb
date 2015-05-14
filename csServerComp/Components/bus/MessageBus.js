var MessageBusHandle = (function () {
    function MessageBusHandle(topic, callback) {
        this.topic = topic;
        this.callback = callback;
    }
    return MessageBusHandle;
})();
var MessageBusService = (function () {
    function MessageBusService() {
    }
    MessageBusService.prototype.publish = function (topic, title, data) {
        if (!MessageBusService.cache[topic])
            return;
        MessageBusService.cache[topic].forEach(function (cb) { return cb(title, data); });
    };
    MessageBusService.prototype.subscribe = function (topic, callback) {
        if (!MessageBusService.cache[topic])
            MessageBusService.cache[topic] = new Array();
        MessageBusService.cache[topic].push(callback);
        return new MessageBusHandle(topic, callback);
    };
    MessageBusService.prototype.unsubscribe = function (handle) {
        var topic = handle.topic;
        var callback = handle.callback;
        if (!MessageBusService.cache[topic])
            return;
        MessageBusService.cache[topic].forEach(function (cb, idx) {
            if (cb == callback) {
                MessageBusService.cache[topic].splice(idx, 1);
                return;
            }
        });
    };
    MessageBusService.cache = {};
    return MessageBusService;
})();
module.exports = MessageBusService;
