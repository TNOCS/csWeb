/**
 * Time control for simulations
 * Hypertimer offers time control for simulations and animations. Hypertimer can be used to:
 *
 * Run in an unpaced mode for simulations: the time jumps from scheduled event to the next scheduled event, unrolling all events as fast as possible.
 * Run in a paced mode for animations or real-time applications: the time proceeds at a continuous, configurable rate. Time can run at a faster or slower pace than real-time, and can run in the past, current, or future.
 * Hypertimer offers basic functionality to control time:
 *
 * Configure pacing, rate, and time on construction or via the function config().
 * Get simulated time using functions getTime() or now().
 * Schedule events using functions setTimeout(), setInterval(), and setTrigger().
 * These functions are compatible with JavaScript's built-in functions Date.now(), setTimeout(), and setInterval(), with the difference that they use a simulated time rather than the system time.
 *
 * Hypertimer enables writing code which can be used interchangeably in simulations as well as for real-time applications. For example, a process could predict its future state by running a simulation of itself, given a current state, its own behavior, and a model of the surrounding world.
 *
 * Hypertimer runs on node.js and on any modern browser (Chrome, FireFox, Opera, Safari, IE9+).
 * @see https://www.npmjs.com/package/hypertimer
 */
interface HyperTimer {
    new(options?: HyperTimerOptions): HyperTimer;

    /**
     * Is the timer running?
     */
    running: boolean;
    /**
     * Get the time as Date.
     */
    getTime(): Date;
    /**
     * Get the time as number.
     */
    now(): number;
    /**
     * Allows you to change the time/rate.
     */
    config(options: HyperTimerOptions);
    /**
     * Pause the timer.
     */
    pause();
    /**
     * Continue the timer.
     */
    continue();
    /**
     * Schedule a callback after a delay in milliseconds.
     * Returns a timeout id, which can be used to cancel a timeout.
     */
    setTimeout(callback: Function, delay: number): number;
    /**
     * Schedule a callback at a specific time. Time can be a Date or a number (timestamp).
     * Returns a timeout id, which can be used to cancel a timeout.
     */
    setTrigger(callback: Function, time: number | Date): number;
    /**
     * Schedule a callback to be triggered once every interval. interval is a number in milliseconds.
     * Optionally, a firstTime can be provided.
     * Returns a timeout id, which can be used to cancel a timeout.
     */
     setInterval(callback: Function, interval: number, firstTime?: number | Date): number;
     /**
      * Clears a timeout.
      * @id
      */
     clearTimeout(id: number);
     /**
      * Clears a trigger.
      * @id
      */
     clearTrigger(id: number);
     /**
      * Clears an interval.
      * @id
      */
     clearInterval(id: number);
     /**
      * Clears all scheduled events.
      */
     clear();

     /** Returns a list with the id's of all running timeouts. */
     list()

     /**
      * Destroy the hypertimer. Clears all timeouts, and closes
      * any connection to master and slave hypertimers.
      */
     destroy()

     /**
      * The timer emits two events:
      * config	Triggered when the configuration is changed by the master timer. Called with the new configuration as first argument, and the previous configuration as second argument.
      * error	Triggered when an error occurred, for example when one of the timout callbacks throws an Error.
      */
     on(event: string, cb: Function);
     /** Emit an event */
     emit(event: string, ...args);
     /** Register a listener for an event, which will be invoked only once and is removed after that. */
     once(event: string, callback: Function);
     /** Unregister a listener for an event */
     off(event: string, callback: Function);
}

interface HyperTimerOptions {
    /**
     * The rate of progress of time with respect to real-time (default 1). Rate must be
     * a positive number. For example when 2, the time of the hypertimer runs twice as
     * fast as real-time. Only applicable when option paced is true.
     */
    rate?: number;
    /**
     * Sets the simulation time. If not configured, a hypertimer is instantiated with the
     * system time.
     */
    time?: Date | string | number;
    /**
     * Mode for pacing of time. When paced (default), the time proceeds at a continuous,
     * configurable rate, useful for animation purposes.
     * When unpaced, the time jumps immediately from scheduled event to the next scheduled event.
     */
    paced?: boolean;
    /**
     * If true, (default) events taking place at the same time are executed in a
     * deterministic order: in the same order they where created. If false, they
     * are executed in a randomized order.
     */
    deterministic?: boolean;
    /**
     * The url of a master hypertimer, for example "ws://localhost:8081". If configured,
     * the hypertimer will run as a slave, and synchronize it's configuration and time
     * with its masters configuration and time.
     */
    master?: string;
    /**
     * If provided, the hypertimer will open a websocket on the given port. The hypertimer
     * will than act as a master. Multiple hypertimer slaves can connect to a master.
     */
    port?: number;
}

declare module 'hypertimer' {
    export = hypertimer;
}
declare var hypertimer: HyperTimer;
