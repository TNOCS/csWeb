module csComp.Services {
	// Interface for message bus callbacks, i.e. (data: any) => any,
	// so you can supply a single data argument of any type, and it may return any type.
	export interface IMessageBusCallback {
		(title: string, data?: any) : any;
    }

	// Handle returned when subscribing to a topic
	export class MessageBusHandle {
		constructor(topic: string, callback: IMessageBusCallback) {
			this.topic = topic; 
			this.callback = callback;
		}

		public topic: string;
		public callback: IMessageBusCallback;
	}

	/** 
	 * Simple message bus service, used for subscribing and unsubsubscribing to topics.
	 * @see {@link https://gist.github.com/floatingmonkey/3384419}
	 */
	export class MessageBusService {
		private static cache: { [topic: string]: Array<IMessageBusCallback> } = {};

        constructor() {
            PNotify.prototype.options.styling = "fontawesome";
        }

		/** 
		 * Publish a notification
         * @title: the title of the notification
         * @text:  the contents of the notification
		 */
        public notify(title: string, text: string) {
            var options : pnotifyDefaults = {
                title      : title,
                text       : text,
                icon       : 'fa fa-info',
                cornerclass: 'ui-pnotify-sharp',
                addclass   : "stack-bottomright",
                stack      : { "dir1": "up", "dir2": "left", "firstpos1": 25, "firstpos2": 25 }
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