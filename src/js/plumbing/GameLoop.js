// copy pasta

import StopWatch from "../StopWatch";

let gl = null;

class GameLoop {
	/**
	 * @type {Function}
	 */
	onTick;
	onClose;
	stop;
	/** @type {StopWatch} */
	ticker;

	close() {
		this.stop = true;
		if (onClose) onClose();
	}

	/**
	 * 
	 * @param {Function} onTick (EpochMSecs, StopWatch) -> any
	 */
	constructor({onTick, onClose}) {
		// clean up previous
		if (gl) {
			gl.close();			
		}
		gl = this;
		assMatch(onTick, Function);
		this.onTick = onTick;
		this.onClose = onClose;
			
		const gameLoop = () => {
			if (gl.stop) {
				console.log("GameLoop - STOPPED");
				return;
			}
			//Call this `gameLoop` function on the next screen refresh
			//(which happens 60 times per second)		
			requestAnimationFrame(gameLoop);
			// tick
			let tick = StopWatch.update(gl.ticker);
			if (tick) {
				onTick(tick, gl.ticker);
			}
		};

		// init
		gl.ticker = new StopWatch();
		gl.ticker.tickLength = 1000/10; // moderately slow steps
		// update loop - use request ani frame
		console.log("GameLoop - START");
		gameLoop();
	}
};

/**
 * @returns {?GameLoop}
 */
GameLoop.get = () => gl;

export default GameLoop;
