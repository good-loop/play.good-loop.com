import DataClass from "./base/data/DataClass";

/**
 * @typedef TimeNumber
 * epoch milliseconds
 */

class StopWatch extends DataClass {
	
	/** @type {Number} */
	tickLength = 1000 / 20;

	/** 
	 * @type {TimeNumber} The last tick used */
	tick;

	/**
	 * @type {Boolean}
	 */
	paused;
	
	/**
	 * Start time of the current pause, or 0 if not paused
	 */
	pauseStart;

	pauseTime = 0;

	/**
	 * @type {TimeNumber}
	 */
	startTime = new Date().getTime();
	
	constructor(base) {
		super(base);
		Object.assign(this, base);
		delete this.status;
	}
}
DataClass.register(StopWatch, "StopWatch");

/**
 *  The dt in seconds since the last tick checked (call `update()` first).
 * @returns {Number}
 */
StopWatch.dt = sw => {
	let dt = sw.dt;
	// ...cap the dt at 0.2 second (for debugging, to avoid jumps)
	if (dt > 0.2) {
		dt = 0.2;
		console.log("cap game.dt");
	}
	return dt;
};

/**
	 * @return The time in milliseconds since this stopwatch was started, minus
	 *         any pauses.
	 */
StopWatch.time = sw => {
	if (sw.paused) {
		return (sw.pauseStart||0) - sw.startTime - (sw.pauseTime||0);
	}
	return new Date().getTime() - sw.startTime - (sw.pauseTime||0);
};

/**
 * Update and fetch tick. Also updates dt
 * @returns {?Number} null if the last call to tick was less than tickLength.
 */
StopWatch.update = sw => {	
	let newTick = StopWatch.time(sw);
	const lastTick = sw.tick || 0;
	if (newTick - lastTick < sw.tickLength) {
		return null; // target 20 fps
	}
	sw.tick = newTick;
	sw.dt = (newTick - lastTick) / 1000;
	return sw.tick;
};

StopWatch.tick = sw => sw.tick;

/**
 * Pause the stopwatch. Does nothing if already paused.
 * 
 * @returns {StopWatch} this 
 */
StopWatch.pause = sw => {
	if (sw.paused) return sw;
	sw.pauseStart = new Date().getTime();
	sw.paused = true;
	return sw;
};
	
/**
 * Identical to pause()! Provided to meet expectations.
 */
StopWatch.stop = StopWatch.pause;

StopWatch.str = t => StopWatch.dt(t).toFixed(2)+" seconds";


/**
 * Restart the stopwatch after a pause. Does nothing if the stopwatch is not
 * paused. Note that stopwatches are started automatically when constructed.
 * Does not reset the timer (just create a new one to do that).
 */
StopWatch.start = t => {
	if ( ! t.paused) return;
	// adjust pause time
	t.pauseTime += (new Date().getTime() - t.pauseStart);
	t.pauseStart = 0;
	t.paused = false;
};

export default StopWatch;
