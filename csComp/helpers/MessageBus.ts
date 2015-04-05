module csComp.Services {
	// Interface for message bus callbacks, i.e. (data: any) => any,
	// so you can supply a single data argument of any type, and it may return any type.
	export interface IMessageBusCallback {
		(title: string, data?: any) : any;
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

    export class Connection {

        public isConnected: boolean;
        public isConnecting: boolean; 
        public cache: { [topic: string]: Array<IMessageBusCallback> } = {};       
        public socket;

        constructor(public id: string, public url: string) {
        }

        public connect(callback: Function) {
            if (this.isConnected || this.isConnecting) return;
            this.socket = io();
            this.isConnecting = true;
            this.socket.on('connect',() => {
                this.isConnecting = false;
                this.isConnected = true;   
                
                callback();
            });
            this.socket.on('disconnect',() => {
                this.isConnecting = false;
                this.isConnected = false;
            });
            this.socket.on('reconnect_attempt',() => {
                this.isConnecting = true;
                this.isConnected = false;
            });
            this.socket.on('reconnect_failed',() => {
                this.isConnecting = false;
            });
        }

        public disconnect() {

        }
        

    }

    export enum NotifyLocation {
        BottomRight,
        BottomLeft,
        TopRight,
        TopLeft
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

        constructor(private $translate: ng.translate.ITranslateService) {
            PNotify.prototype.options.styling = "fontawesome";
        }


        getConnection(id: string): Connection {            
            if (this.connections.hasOwnProperty(id)) return this.connections[id];
            return null;
        }

        public initConnection(id: string, url: string,callback : Function) {
            if (id == null) id = "";
            var c = this.getConnection(id);
            if (c==null) {
                c = new Connection(id, url);                                
                this.connections[c.id] = c;
            }
            this.connections[id].connect(() => {
                callback();
                     });            
        }

        public serverPublish(topic: string, message : any, serverId = "") {
            var c = this.getConnection(serverId);
            if (c == null) return null;
            c.socket.emit(topic, message);
        }

        
        public serverSubscribe(topic: string, callback: IMessageBusCallback, serverId = ""): MessageBusHandle {
            var c = this.getConnection(serverId);
            if (c == null) return null;
            
            
            // array van socket.io verbindingen
            // registeren
            if (!c.cache[topic]) {
                c.cache[topic] = new Array<IMessageBusCallback>();
                c.cache[topic].push(callback);
                c.socket.on(topic,(r) => {
                    //c.cache[topic].forEach(cb => cb(title, data));
                });
            } else {

                c.cache[topic].push(callback);
            }

            

            return new MessageBusHandle(topic, callback);
        }

        

		/** 
		 * Publish a notification that needs to be translated
         * @title:       the translation key of the notification's title
         * @text:        the translation key of the notification's content
         * @location:    the location on the screen where the notification is shown (default bottom right)
		 */
        notifyWithTranslation(title: string, text: string, location = NotifyLocation.BottomRight) {
            this.$translate(title).then((translatedTitle) => {
                this.$translate(text).then((translatedText) => {
                    this.notify(translatedTitle, translatedText, location);
                });
            });
        }

		/** 
		 * Publish a notification
         * @title:       the title of the notification
         * @text:        the contents of the notification
         * @location:    the location on the screen where the notification is shown (default bottom right)
		 */
        notify(title: string, text: string, location = NotifyLocation.BottomRight) {
            var cssLocation: string,
                dir1       : string,
                dir2       : string;

            switch (location) {
                case NotifyLocation.BottomLeft:
                    cssLocation = 'stack-bottomleft';
                    dir1 = 'up';
                    dir2 = 'right';
                    break;
                case NotifyLocation.TopRight:
                    cssLocation = 'stack-topright';
                    dir1 = 'down';
                    dir2 = 'left';
                    break;
                case NotifyLocation.TopLeft:
                    cssLocation = 'stack-topleft';
                    dir1 = 'down';
                    dir2 = 'right';
                    break;
                default:
                    cssLocation = 'stack-bottomright';
                    dir1 = 'up';
                    dir2 = 'left';
                    break;
            }

            var options : pnotifyDefaults = {
                title      : title,
                text       : text,
                icon       : 'fa fa-info',
                cornerclass: 'ui-pnotify-sharp',
                addclass   : cssLocation,
                stack      : { "dir1": dir1, "dir2": dir2, "firstpos1": 25, "firstpos2": 25 }
            };

            var pn = new PNotify(options);            
        }

		/** 
		 * Show a confirm dialog
         * @title           : the title of the notification
         * @text            : the contents of the notification
         * @callback        : the callback that will be called after the confirmation has been answered.
		 */
        public confirm(title: string, text: string, callback: (result: boolean) => any) {
            var options = {
                title       : title,
                text        : text,
                hide        : false,
                confirm     : {
                    confirm : true
                },
                buttons     : {
                    closer  : false,
                    sticker : false
                },
                history     : {
                    history : false
                },
                icon        : 'fa fa-question-circle',
                cornerclass : 'ui-pnotify-sharp',
                addclass    : "stack-topright",
                stack       : { "dir1": "down", "dir2": "left", "firstpos1": 25, "firstpos2": 25 }
            };

            var pn = new PNotify(options).get()
                .on('pnotify.confirm', () => { callback(true); })
                .on('pnotify.cancel', () => { callback(false); });
        }

        public notifyBottom(title: string, text: string) {
            var stack_bar_bottom = { "dir1": "up", "dir2": "right", "spacing1": 0, "spacing2": 0 };
            var options = {
                title: "Over Here",
                text: "Check me out. I'm in a different stack.",
                addclass: "stack-bar-bottom",
                cornerclass: "",
                width: "70%",
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
            //this.publish("notify", "", data);
        }

		/** 
		 * Publish to a topic 
		 */
		public publish(topic: string, title: string, data?: any): void {
			//window.console.log("publish: " + topic + ", " + title);
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

        

		//public subscribe(topic: string, callback: IMessageBusCallback): MessageBusHandle {            
		//	return MessageBusService.subscribe(topic, callback);
		//}

		/** 
		 * Unsubscribe to a topic by providing its handle 
		 */
		public unsubscribe(handle: MessageBusHandle): void {
			var topic = handle.topic;
			var callback = handle.callback;
			if (!MessageBusService.cache[topic]) return;
			MessageBusService.cache[topic].forEach((cb, idx) => {
				if (cb == callback) {
					MessageBusService.cache[topic].splice(idx, 1);
					return;
				}
			});
        }

	}

	export class EventObj {
		myEvents: any;
		constructor() {
		}

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
		registerEvent(evtname : string) {
			this[evtname] = function (callback, replace) {

				if (typeof callback == 'function') {
					if (replace) this.unbindEvent(evtname);

					this.bind(evtname, callback);
				}

				return this;
			}
		}
		registerEvents(evtnames: Array<string>) {
			evtnames.forEach(evtname => {
				this.registerEvent(evtname);
			});
			
		}

	}
}