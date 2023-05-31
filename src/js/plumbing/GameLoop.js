// copy pasta

import StopWatch from "../StopWatch";

class GameLoop {
	/**
	 * @type {!Function} (tick:Number, StopWatch)
	 */
	onTick;
	/**
	 * @type {?Function}
	 */
	onClose;
	/**
	 * @type {?Function}
	 */
	onPause;
	stopFlag;
	/** @type {StopWatch} */
	ticker;
	
	initFlag;
	startFlag;
	
	/** @type {!Command[]} This is passed into Command.setQueue() */
	cmdq = [];

	/**
	 * 
	 * @param {!Function} onTick (EpochMSecs, StopWatch) -> any
	 */
	constructor({onTick, onClose, onPause}) {
		assMatch(onTick, Function);
		this.onTick = onTick;
		this.onClose = onClose;			
		this.onPause = onPause;			
		
		this.ticker = new StopWatch();
		this.ticker.tickLength = 1000/25; // 25fps fairly snappy steps
		
		// start paused!
		StopWatch.pause(this.ticker);
	}
};

GameLoop.state = gl => {
	if ( ! gl.startFlag) return "not-started";
	if ( gl.stopFlag) return "stopped";
	if (gl.ticker.paused) return "paused";
	return "active";
};
GameLoop.str = gl => {
	let state = GameLoop.state(gl);
	return "GameLoop["+state+", tick:"+StopWatch.tick(gl.ticker)+", commands: "+gl.cmdq.length+"]";
};

GameLoop._loop = gl => {
	if (gl.stopFlag) {
		console.log("GameLoop - STOPPED");
		return;
	}
	//Call this `gameLoop` function on the next screen refresh
	//(which happens 60 times per second)		
	requestAnimationFrame(() => GameLoop._loop(gl));
	// tick
	let tick = StopWatch.update(gl.ticker);
	if (tick) {
		gl.onTick(tick, gl.ticker);
	}
};

GameLoop.pause = gl => {
	if (gl.ticker.paused) {
		return;
	}
	StopWatch.pause(gl.ticker);
	// pause music??
};
GameLoop.start = gl => {
	gl.startFlag = true;
	// pause other GameLoops

	// swap Command Qs
	Command.setQueue(gl.cmdq);
	StopWatch.start(gl.ticker);
	// Go!
	GameLoop._loop(gl);
};
/**
 * pause, set the stopFlag, and call onClose if one was provided
 * @param {!GameLoop} gl 
 */
GameLoop.close = gl => {
	console.warn("close", gl, new Error());	
	gl.stopFlag = true;
	GameLoop.pause(gl);
	if (gl.onClose) onClose();
}


export default GameLoop;
