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
}
interface HyperTimerOptions {
    /**
     * Speed of the simulation time: 1 is realtime, >1 is faster than realtime.
     */
    rate?: number;
    /**
     * Initial start time of the timer.
     */
    time?: Date;
    /**
     * Run discrete events as fast as possible (unpaced)
     * Time will jump from scheduled event to scheduled event.
     */
    paced?: boolean;
    /**
     * Can create a non-deterministic timer.
     */
    deterministic?: boolean;
}

declare module 'hypertimer' {
    export = hypertimer;
}
declare var hypertimer: HyperTimer;
