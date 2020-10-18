// copy pasta

import StopWatch from "../StopWatch";

class GameLoop {
	/**
	 * @type {Function}
	 */
	onTick;
	/**
	 * @type {Function}
	 */
	onClose;
	stopFlag;
	/** @type {StopWatch} */
	ticker;
	
	initFlag;
	startFlag;
	
	/** @type {!Command[]} This is passed into Command.setQueue() */
	cmdq = [];

	close() {
		console.warn("close", this, new Error());
		this.stopFlag = true;
		if (this.onClose) onClose();
	}

	/**
	 * 
	 * @param {Function} onTick (EpochMSecs, StopWatch) -> any
	 */
	constructor({onTick, onClose}) {
		assMatch(onTick, Function);
		this.onTick = onTick;
		this.onClose = onClose;			
		
		this.ticker = new StopWatch();
		this.ticker.tickLength = 1000/20; // snappy steps
		
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
	StopWatch.pause(gl.ticker);
};
GameLoop.start = gl => {
	gl.startFlag = true;
	// Command Q
	Command.setQueue(gl.cmdq);
	StopWatch.start(gl.ticker);
	// Go!
	GameLoop._loop(gl);
};

export default GameLoop;
