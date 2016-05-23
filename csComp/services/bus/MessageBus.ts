module csComp.Services {
    // Interface for message bus callbacks, i.e. (data: any) => any,
    // so you can supply a single data argument of any type, and it may return any type.

    export interface IMessageBusCallback {
        (title: string, data?: any): any;
    }

    export class ClientMessage {
        constructor(public action: string, public data: any) { }
    }

    declare var io;

    // Handle returned when subscribing to a topic
    export class MessageBusHandle {
        constructor(topic: string, callback: IMessageBusCallback) {
            this.topic = topic;
            this.callback = callback;
        }

        public topic: string;
        public callback: IMessageBusCallback;
    }

    export interface IBaseEvent {
        add(listener: () => void): void;
        remove(listener: () => void): void;
        trigger(...a: any[]): void;
    }

    export class TypedEvent implements IBaseEvent {
        // Private member vars
        private _listeners: any[] = [];

        public add(listener: () => void): void {
            /// <summary>Registers a new listener for the event.</summary>
            /// <param name='listener'>The callback function to register.</param>
            this._listeners.push(listener);
        }

        public remove(listener?: () => void): void {
            /// <summary>Unregisters a listener from the event.</summary>
            /// <param name='listener'>The callback function that was registered. If missing then all listeners will be removed.</param>
            if (typeof listener === 'function') {
                for (var i = 0, l = this._listeners.length; i < l; l++) {
                    if (this._listeners[i] === listener) {
                        this._listeners.splice(i, 1);
                        break;
                    }
                }
            } else {
                this._listeners = [];
            }
        }

        public trigger(...a: any[]): void {
            /// <summary>Invokes all of the listeners for this event.</summary>
            /// <param name='args'>Optional set of arguments to pass to listners.</param>
            var context = {};
            var listeners = this._listeners.slice(0);
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(context, a || []);
            }
        }
    }

    // Exposing events
    export interface IMessageEvent extends IBaseEvent {
        add(listener: (message: string) => void): void;
        remove(listener: (message: string) => void): void;
        trigger(message: string): void;
    }

    export class Connection {
        public isConnected: boolean;
        public isConnecting: boolean;
        public cache: { [topic: string]: Array<IMessageBusCallback> } = {};
        public subscriptions: { [id: string]: ServerSubscription } = {};
        public socket;

        // Events
        public events: IMessageEvent = new TypedEvent();

        constructor(public id: string, public url: string, public bus: MessageBusService) {

        }

        public unsubscribe(id: string, callback: IMessageBusCallback) {
            if (this.subscriptions.hasOwnProperty(id)) {
                var s = this.subscriptions[id];
                s.callbacks = s.callbacks.filter((f) => { return f !== callback; });
                if (s.callbacks.length === 0) {
                    this.socket.emit(id, { action: 'unsubscribe' });
                    this.socket.removeListener(id, s.serverCallback);
                    s.serverCallback = null;
                    delete this.subscriptions[id];
                }
            }
        }

        public reSubscribeAll() {
            console.log('resubscribing...');
            for (var s in this.subscriptions) {
                console.log('reconnecting ' + s);
                var sub = this.subscriptions[s];
                this.socket.emit('subscribe', { id: sub.id, target: sub.target, type: sub.type });
            }
        }

        public disconnectAll() {
            console.log('resubscribing...');
            for (var s in this.subscriptions) {
                var sub = this.subscriptions[s];
                sub.callbacks.forEach(cb => cb(sub.id, { action: 'unsubscribed' }));
            }
        }

        public subscribe(target: string, type: string, callback: IMessageBusCallback): ServerSubscription {
            if (!this.socket) return;
            var sub: ServerSubscription;
            var subs = [];
            for (var s in this.subscriptions) {
                if (this.subscriptions[s].target === target && this.subscriptions[s].type === type) subs.push(this.subscriptions[s]);
            }

            if (subs == null || subs.length === 0) {
                sub = new ServerSubscription(target, type);
                this.socket.emit('subscribe', { id: sub.id, target: sub.target, type: sub.type });

                sub.callbacks.push(callback);
                this.subscriptions[sub.id] = sub;
                sub.serverCallback = (r) => {
                    if (type === 'key') {
                        this.bus.publish('keyupdate', target, r);
                    }
                    //console.log(r.action);
                    sub.callbacks.forEach(cb => cb(sub.id, r));
                };
                this.socket.on(sub.id, sub.serverCallback);
            } else {
                sub = subs[0];
                sub.callbacks.push(callback);
            }

            return sub;
        }

        public connect(callback: Function) {
            if (this.isConnected || this.isConnecting || typeof io === 'undefined') return;
            this.socket = io();
            this.isConnecting = true;
            this.socket.on('connect', () => {
                //console.log(JSON.stringify(this.socket));
                console.log('socket.io connected');
                this.isConnecting = false;
                this.isConnected = true;
                this.events.trigger('connected');
                this.reSubscribeAll();
                callback();
            });
            this.socket.on('disconnect', () => {
                this.isConnecting = false;
                this.isConnected = false;
                this.disconnectAll();
                this.events.trigger('disconnected');
            });
            this.socket.on('reconnect_attempt', () => {
                console.log('socket.io reconnect attempt');
                this.isConnecting = true;
                this.isConnected = false;
            });
            this.socket.on('reconnect_failed', () => {
                console.log('socket.io reconnect failed');
                this.isConnecting = false;
            });

        }

        public disconnect() { return; }
    }

    export enum NotifyLocation {
        BottomRight,
        BottomLeft,
        TopRight,
        TopLeft,
        TopBar
    }

    export enum NotifyType {
        Normal,
        Info,
        Error,
        Success
    }

    export class ServerSubscription {
        public callbacks: Array<IMessageBusCallback>;
        public id: string;
        public serverCallback: any;

        constructor(
            public target: string,
            public type: string
        ) {
            this.callbacks = [];
            this.id = Helpers.getGuid();
        }
    }

	/**
	 * Simple message bus service, used for subscribing and unsubsubscribing to topics.
	 * @see {@link https://gist.github.com/floatingmonkey/3384419}
	 */
    export class MessageBusService {
        private static cache: { [topic: string]: Array<IMessageBusCallback> } = {};

        static $inject = [
            '$translate'
        ];

        private connections: { [id: string]: Connection } = {};
        private notifications: any[] = [];

        constructor(private $translate: ng.translate.ITranslateService) {
            PNotify.prototype.options.styling = 'fontawesome';
        }

        getConnection(id: string): Connection {
            if (this.connections.hasOwnProperty(id)) return this.connections[id];
            return null;
        }

        public initConnection(id: string, url: string, callback: Function) {
            if (id == null) id = '';
            var c = this.getConnection(id);
            if (c == null) {
                c = new Connection(id, url, this);
                this.connections[c.id] = c;
            }
            this.connections[id].connect(() => {
                //for (var topic in c.cache) {
                //    c.socket.on(topic,(r) => {
                //        c.cache[topic].forEach(cb => cb(topic, r));
                //    });
                //}
                callback();
            });
        }

        public serverPublish(topic: string, message: any, serverId = '') {
            var c = this.getConnection(serverId);
            if (c == null) return null;
            c.socket.emit(topic, message);
        }

        public serverSendMessage(msg: ClientMessage, serverId = '') {
            var c = this.getConnection(serverId);
            if (c == null) return null;
            c.socket.emit('msg', msg);
        }

        public serverSendMessageAction(action: string, data: any, serverId = '') {
            var cm = new ClientMessage(action, data);
            this.serverSendMessage(cm, serverId);
        }

        public serverSubscribe(target: string, type: string, callback: IMessageBusCallback, serverId = ''): MessageBusHandle {
            var c = this.getConnection(serverId);
            if (c == null) return null;

            var sub = c.subscribe(target, type, callback);
            return new MessageBusHandle(sub.id, callback);
        }

        public serverUnsubscribe(handle: MessageBusHandle, serverId: string = '') {
            if (!handle) return;
            var c = this.getConnection(serverId);
            if (c == null) return null;
            c.unsubscribe(handle.topic, handle.callback);
        }

		/**
		 * Publish a notification that needs to be translated
         * @title:       the translation key of the notification's title
         * @text:        the translation key of the notification's content
         * @location:    the location on the screen where the notification is shown (default bottom right)
		 */
        notifyWithTranslation(title: string, text: string, location = NotifyLocation.BottomRight, type = NotifyType.Normal, duration = 4000) {
            this.$translate(title).then((translatedTitle) => {
                this.$translate(text).then((translatedText) => {
                    this.notify(translatedTitle, translatedText, location, type, duration);
                });
            });
        }

        public notifyError(title: string, text: string) {
            this.notify(title, text, NotifyLocation.TopBar, NotifyType.Error);
        }


		/**
		 * Publish a notification
         * @title:       the title of the notification
         * @text:        the contents of the notification
         * @location:    the location on the screen where the notification is shown (default bottom right)
         * @notifyType:  the type of notification
		 */
        public notify(title: string, text: string, location = NotifyLocation.TopBar, notifyType = NotifyType.Normal, duration = 4000): any {

            //Check if a notication with the same title exists. If so, update existing, if not, add new notification.
            if (this.notifications) {
                this.notifications = this.notifications.filter((n) => { return (n.state && n.state !== 'closed'); });
                var updatedText: string;
                this.notifications.some((n) => {
                    if (n.state === 'closed') return false;
                    if (n.options.title === title) {
                        var foundText = false;
                        var splittedText = n.options.text.split('\n');
                        splittedText.some((textLine, index, _splittedText) => {
                            if (textLine.replace(/(\ \<\d+\>$)/, '') === text) {
                                let txt = textLine.replace(/(\ \<\d+\>$)/, '');
                                let nrWithBrackets = textLine.match(/(\ \<\d+\>$)/);
                                var nr;
                                nr = (!nrWithBrackets) ? 2 : +(nrWithBrackets[0].match(/\d+/)) + 1;
                                _splittedText[index] = txt + ' <' + nr + '>';
                                foundText = true;
                                return true;
                            }
                            return false;
                        });
                        if (!foundText) {
                            splittedText.push(text);
                        }
                        updatedText = splittedText.join('\n');
                        n.update({ text: updatedText });
                        return true;
                    } else {
                        return false;
                    }
                });
                if (updatedText) {
                    return;
                }
            }


            var opts = {
                title: title,
                text: text,
                cornerclass: 'ui-pnotify-sharp',
                shadow: false,
                addclass: "csNotify",
                width: "500px",
                animation: "fade",
                mouse_reset: true,
                animate_speed: "slow",
                nonblock: {
                    nonblock: true,
                    nonblock_opacity: .2
                },
                buttons: {
                    closer: true,
                    sticker: false
                },
                hide: true
            };
            if (typeof duration != 'undefined') opts['delay'] = duration;

            var PNot = new PNotify(opts);
            this.notifications.push(PNot);
            return PNot;
        }

        public confirmButtons(title: string, text: string, buttons: string[], callback: (result: string) => any) : any {
            var c = [];
            // buttons.forEach(b=>{
            //     c.push({ text: c, addClass: "", promptTrigger: true, click: (notice, value) =>{ notice.remove(); notice.get().trigger("pnotify.confirm", [notice, value]); } })
            // })            
            var options = {
                title: title,
                text: text,
                addclass: "csNotify",
                width: "500px",
                animation: "fade",
                hide: false,
                confirm: {
                    confirm: true,
                    buttons : c
                },
                buttons: {
                    closer: false,
                    sticker: false
                },
                history: {
                    history: false
                },
                icon: 'fa fa-question-circle',
                cornerclass: 'ui-pnotify-sharp'

            };

            var pn = new PNotify(options).get()
                .on('pnotify.confirm', (notice,value) => { 
                    callback("ok"); })
                .on('pnotify.cancel', () => { callback(null); });
            return pn;
            
            
            
        }

		/**
		 * Show a confirm dialog
         * @title           : the title of the notification
         * @text            : the contents of the notification
         * @callback        : the callback that will be called after the confirmation has been answered.
		 */
        public confirm(title: string, text: string, callback: (result: boolean) => any) : any {
            var options = {
                title: title,
                text: text,
                addclass: "csNotify",
                width: "500px",
                animation: "fade",
                hide: false,
                confirm: {
                    confirm: true
                },
                buttons: {
                    closer: true,
                    sticker: true
                },
                history: {
                    history: false
                },
                icon: 'fa fa-question-circle',
                cornerclass: 'ui-pnotify-sharp',
                duration: 60000

            };

            var pn = new PNotify(options).get()
                .on('pnotify.confirm', () => { callback(true); })
                .on('pnotify.cancel', () => { callback(false); });
            return pn;
        }



        public notifyBottom(title: string, text: string) {
            var stack_bar_bottom = { 'dir1': 'up', 'dir2': 'right', 'spacing1': 0, 'spacing2': 0 };
            var options = {
                title: 'Over Here',
                text: 'Check me out. I\'m in a different stack.',
                addclass: 'stack-bar-bottom',
                cornerclass: '',
                width: '70%',
                stack: stack_bar_bottom
            };
            var pn = new PNotify(options);
        }

		/**
		 * Publish a notification
         * @title: the title of the notification
         * @text:  the contents of the notification
		 */
        public notifyData(data: any) {
            var pn = new PNotify(data);
            //this.publish('notify', '', data);
        }

		/**
		 * Publish to a topic
		 */
        public publish(topic: string, title: string, data?: any): void {
            //window.console.log('publish: ' + topic + ', ' + title);
            if (!MessageBusService.cache[topic]) return;
            MessageBusService.cache[topic].forEach(cb => cb(title, data));
        }

        //public publish(topic: string, title: string, data?: any): void {
        //	MessageBusService.publish(topic, title, data);
        //}

		/**
		 * Subscribe to a topic
		 * @param {string} topic The desired topic of the message.
		 * @param {IMessageBusCallback} callback The callback to call.
		 */
        public subscribe(topic: string, callback: IMessageBusCallback): MessageBusHandle {
            if (!MessageBusService.cache[topic]) MessageBusService.cache[topic] = new Array<IMessageBusCallback>();
            MessageBusService.cache[topic].push(callback);
            return new MessageBusHandle(topic, callback);
        }

		/**
		 * Unsubscribe to a topic by providing its handle
		 */
        public unsubscribe(handle: MessageBusHandle): void {
            var topic = handle.topic;
            var callback = handle.callback;
            if (!MessageBusService.cache[topic]) return;
            MessageBusService.cache[topic].forEach((cb, idx) => {
                if (cb === callback) {
                    MessageBusService.cache[topic].splice(idx, 1);
                    return;
                }
            });
        }
    }

    export class EventObj {
        myEvents: any;

        // Events primitives ======================
        bind(event, fct) {
            this.myEvents = this.myEvents || {};
            this.myEvents[event] = this.myEvents[event] || [];
            this.myEvents[event].push(fct);
        }

        unbind(event, fct) {
            this.myEvents = this.myEvents || {};
            if (event in this.myEvents === false) return;
            this.myEvents[event].splice(this.myEvents[event].indexOf(fct), 1);
        }

        unbindEvent(event) {
            this.myEvents = this.myEvents || {};
            this.myEvents[event] = [];
        }

        unbindAll() {
            this.myEvents = this.myEvents || {};
            for (var event in this.myEvents) this.myEvents[event] = false;
        }

        trigger(event, ...args: any[]) {
            this.myEvents = this.myEvents || {};
            if (event in this.myEvents === false) return;
            for (var i = 0; i < this.myEvents[event].length; i++) {
                this.myEvents[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }

        registerEvent(evtname: string) {
            this[evtname] = function (callback, replace) {
                if (typeof callback === 'function') {
                    if (replace) this.unbindEvent(evtname);

                    this.bind(evtname, callback);
                }
                return this;
            };
        }

        registerEvents(evtnames: Array<string>) {
            evtnames.forEach(evtname => {
                this.registerEvent(evtname);
            });
        }
    }

    /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('messageBusService', csComp.Services.MessageBusService);
}
