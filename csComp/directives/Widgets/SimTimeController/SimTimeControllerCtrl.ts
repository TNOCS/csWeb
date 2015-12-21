module SimTimeController {
    export enum PlayState {
        Stopped,
        Playing,
        Paused
    }

    export enum SimCommand {
        Start,
        Pause,
        Stop,
        Run,
        Finish,
        Exit
    }

    export interface ISimTimeMessage {
        simTime: string;
        simSpeed: string;
        simCmd: string;
        type: string;
    }

    export interface ISimTimeControllerScope extends ng.IScope {
        vm: SimTimeControllerCtrl;
    }

    export class SimTimeControllerCtrl {
        private timeSinceSimulationStart: number;
        public timeSinceStartString: string = '00:00';
        private scope: ISimTimeControllerScope;
        private fsm: FSM.FiniteStateMachine<PlayState>;
        /** REST endpoint method */
        private httpMethod: string;
        /** REST endpoint */
        private url: string;
        private speed = 1;
        /** Start time, e.g. when restarting */
        private startTime = new Date();
        /** Current time */
        private time = this.startTime;
        private editorData: SimTimeControllerEditorData;

        // DateTimePicker
        private isOpen = false;
        private timeOptions = {
            readonlyInput: false,
            showMeridian: false
        };

        // For the view's status
        public isPlaying = false;
        public isPaused = false;
        public isStopped = true;

        private messageBusHandle: csComp.Services.MessageBusHandle;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            'messageBusService',
            '$timeout'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ISimTimeControllerScope,
            private $http: ng.IHttpService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
            ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            this.editorData = <SimTimeControllerEditorData>par.widget.data;

            this.httpMethod = 'POST';
            if (this.editorData.hasOwnProperty('httpMethod') && this.editorData.httpMethod.hasOwnProperty('name'))
                this.httpMethod = this.editorData.httpMethod.name.toUpperCase();
            this.url = this.editorData.url || 'api/keys/simTime';

            this.fsm = new FSM.FiniteStateMachine<PlayState>(PlayState.Stopped);
            this.fsm.fromAny(PlayState).to(PlayState.Stopped).on(SimCommand.Stop);
            this.fsm.from(PlayState.Stopped).to(PlayState.Playing).on(SimCommand.Start);
            this.fsm.from(PlayState.Playing).to(PlayState.Stopped).on(SimCommand.Stop);
            this.fsm.from(PlayState.Playing).to(PlayState.Paused).on(SimCommand.Pause);
            this.fsm.from(PlayState.Paused).to(PlayState.Stopped).on(SimCommand.Stop);
            this.fsm.from(PlayState.Paused).to(PlayState.Playing).on(SimCommand.Start);

            this.fsm.onTransition = (fromState: PlayState, toState: PlayState) => {
                console.log(`Moving from ${PlayState[fromState]} to ${PlayState[toState]}.`)
            }

            this.fsm.onEnter(PlayState.Stopped, (from: PlayState) => {
                this.$timeout(() => {
                    this.time = this.startTime;
                    this.timeSinceSimulationStart = 0;
                    this.updateTimeSinceSimStart();
                    this.isStopped = true;
                    this.isPlaying = false;
                    this.isPaused = false;
                }, 0);
                this.sendSimTimeMessage(SimCommand.Stop);
                return true;
            });

            this.fsm.onEnter(PlayState.Playing, (from: PlayState) => {
                this.$timeout(() => {
                    this.isPlaying = true;
                    this.isStopped = false;
                    this.isPaused = false;
                }, 0);
                this.sendSimTimeMessage(SimCommand.Start);
                return true;
            });

            this.fsm.onEnter(PlayState.Paused, (from: PlayState) => {
                this.$timeout(() => {
                    this.isPaused = true;
                    this.isStopped = false;
                    this.isPlaying = false;
                }, 0);
                this.sendSimTimeMessage(SimCommand.Pause);
                return true;
            });

            // $http.get(this.url)
            //     .then((msg) => {
            //     // TODO Why does this always return an empty msg.data element
            //     // console.log('Received message: ');
            //     // console.log(msg);
            //     // console.log(JSON.stringify(msg, null, 2));
            // })
            console.log(`Simtimecontroller constructed`);
        }

        private updateTimeSinceSimStart() {
            var msec = this.time.valueOf() - this.startTime.valueOf();
            var days = Math.floor(msec / 86400000);
            msec -= days * 86400000;
            var hours = Math.floor(msec / 3600000);
            msec -= hours * 3600000;
            var minutes = Math.floor(msec / 60000);
            msec -= minutes * 60000;
            var seconds = Math.floor(msec / 1000);
            var result = '';
            if (days > 0) result = `${days}d `;
            result += `${hours < 10 ? '0'+hours : hours}:${minutes < 10 ? '0'+minutes : minutes}`;
            this.timeSinceStartString = result;
        }

        private subscribeToSimTime() {
            this.messageBusHandle = this.messageBusService.serverSubscribe('Sim.SimTime', 'key', (title: string, msg: any) => {
                //console.log(`Server subscription received: ${title}, ${JSON.stringify(msg, null, 2) }.`);
                if (!msg
                    || !msg.hasOwnProperty('data')
                    || !msg.data.hasOwnProperty('item')
                    || !msg.data.item) return;
                this.$timeout(() => {
                    if (msg.data.item.hasOwnProperty('simTime'))
                        this.time = new Date(+msg.data.item.simTime);
                    else
                        this.time = new Date(msg.data.item);
                    if (!isNaN(this.time.getTime())) {
                        this.updateTimeSinceSimStart();
                        this.messageBusService.publish('timeline', 'setFocus', this.time);
                        //console.log(`Simtimecontroller published focusTime: ${this.time}`);
                    } else {
                        console.log(`ERROR processing Sim.SimTime message! Received: (input: ${JSON.stringify(msg.data.item, null, 2) }`)
                    }
                    //console.log(`TIME: ${this.time} (input: ${JSON.stringify(data.data.item, null, 2)})`);
                }, 0);
            })
        }

        play() {
            if (!this.messageBusHandle) {
                this.subscribeToSimTime();
            }
            this.fsm.trigger(SimCommand.Start);
        }

        pause() {
            this.fsm.trigger(SimCommand.Pause);
        }

        stop() {
            if (this.messageBusHandle) {
                this.messageBusService.serverUnsubscribe(this.messageBusHandle);
                this.messageBusHandle = null;
            }
            this.fsm.trigger(SimCommand.Stop);
        }

        increaseSpeed() {
            this.speed *= 2;
            this.speedChanged();
        }

        decreaseSpeed() {
            this.speed /= 2;
            this.speedChanged();
        }

        setSpeed(newSpeed: number) {
            this.speed = newSpeed;
            this.speedChanged();
        }

        setTime(newTime: number) {
            if (this.fsm.currentState !== PlayState.Stopped) return;
            this.startTime = this.time = new Date(newTime);
        }

        openCalendar(e: Event) {
            e.preventDefault();
            e.stopPropagation();

            this.isOpen = true;
        };

        private speedChanged() {
            if (this.fsm.currentState === PlayState.Playing) this.sendSimTimeMessage(SimCommand.Start);
        }

        private sendSimTimeMessage(cmd: SimCommand) {
            var msg: ISimTimeMessage = {
                simTime: this.time.valueOf().toString(),
                simSpeed: this.speed.toString(),
                simCmd: SimCommand[cmd],
                type: 'simTime'
            };

            switch (this.httpMethod) {
                case 'POST':
                    this.$http.post(this.url, msg)
                        .error((err) => alert("Failed to deliver message: " + JSON.stringify({ err: err })));
                    break;
                case 'PUT':
                    this.$http.put(this.url, msg)
                        .error((err) => alert("Failed to deliver message: " + JSON.stringify({ err: err })));
                    break;
            }
            //
            // this.$http.post( '/api/keys/simTime', msg)
            //     .error((err) => alert( "Failed to deliver message: " + JSON.stringify({err: err})));
        }

    }
}
