
import DataClass, {getType, nonce} from '../base/data/DataClass';
import { assMatch, assert } from '../base/utils/assert';
import StopWatch from '../StopWatch';
import { space } from '../base/utils/miscutils';
import printer from '../base/utils/printer';
import DataStore from '../base/plumbing/DataStore';

// copy pasta

class Command extends DataClass {
	id = nonce(4);
	/**
	 * @typedef {Sprite}
	 */
	subject;
	/**
	 * Register handlers for verbs
	 * @typedef {!String}
	 */
	verb;
	/**
	 * @typedef {Sprite|string|any} e.g. field name for "set"
	 */
	object;

	/**
	 * @typedef {Boolean}
	 */
	started;
	/**
	 * @typedef {Boolean}
	 */
	finished;

	/**
	 * @typedef {import('../StopWatch').EpochMSecs}
	 */
	duration = 1000;

	/**
	 * @typedef {import('../StopWatch').EpochMSecs}
	 */
	startTick;

	/**
	 * @typedef {?Command}
	 */
	then;

	constructor(subject, verb, object, value, params) {
		super(); // base
		DataClass._init(this, params);
		this.subject = subject;
		this.verb = assMatch(verb, String);
		this.object = object;
		this.value = value;		
	}

	setDuration(msecs) {
		this.duration = msecs;
		return this;
	}
	setBlocking() {
		this.duration = 1000*60*60*24; // 1 day!
		this.blocking = true;
		return this;
	}
}
DataClass.register(Command, 'Command');
export default Command;

/**
 * 
 * @param {Function} onStart Command => any
 * @param {Function} onUpdate (Command, msecs, fraction) => any
 * @param {Function} onEnd Command => any
 */
Command.setHandler = ({verb, onStart, onUpdate, onEnd}) => {
	assMatch(verb, String);
	starter4verb[verb] = onStart;
	updater4verb[verb] = onUpdate;
	finisher4verb[verb] = onEnd;	
};

Command.str = c => space(c.id, DataClass.str(c.subject), c.verb, c.object, c.value, 
	c.startTick && c.latestTick && "done: "+printer.str(100*(c.latestTick - c.startTick)/c.duration)+"% of "+c.duration
);
/**
 * Call this from within a game loop
 * @param {import('../StopWatch').EpochMSecs} tick
 * @returns {?Command} falsy if the queue is empty
 */
Command.tick = (tick) => {
	const c = Command.peek();
	if ( ! c) return false;
	if ( ! c.started) {
		console.warn("Command Q error: tick but not started?!", c); // swallow the error, and start now
		Command.start(c);
	}
	if ( ! c.startTick) {
		c.startTick = tick;		
	}
	c.latestTick = tick;
	let dmsecs = tick - c.startTick;
	if (dmsecs < c.duration) {
		Command.updateCommand(c, dmsecs);		
		return c;
	}
	
	// Done!!	
	assert(c.started, c);
	assert( ! c.finished, "Not finished?!", c);
	Command.finish(c);
	c.finished = true;
	// NB: do after finish, so any commands added during finish() dont preemptively start
	const _c = Command._q.shift();
	assert(c === _c, "Command.js", c, _c);

	// next?
	if (c.then) {
		// NB: c.then is _not_ queued, so we now elbow it into the queue
		Command._q.unshift(c.then);
	}
	let c2 = Command.peek();
	if (c2) {
		assert( ! c2.started, "Already started?!",c2, "after",c);
		Command.start(c2);
		return c2;
	}
	// all done
	return false;
};

/**
 * @typedef {Command[]}
 */
Command._q = [];

/**
 * Swap in a new queue. Use-case: for switching between GameLoops
 * @param {!Command[]} q 
 * @returns {Command[]} old queue
 */
Command.setQueue = q => {
	assMatch(q, "Command[]");
	const old = Command._q;
	Command._q = q;
	return old;
};

/**
 * 
 * @param {Command} command 
 */
export const cmd = (command) => {
	Command.assIsa(command);
	assert( ! Command._q.includes(command), "Command.js - Already queued!",command);
	Command._q.push(command);
	console.log("queue", Command.str(command));
	// do now?
	if (Command._q.length===1) {
		assert( ! command.started, "No - Already started?!", command);
		Command.start(command);
	}
};

/** "Do Queue" */
export const doq = cmd;

/**
 * @returns {?Command}
 */
Command.peek = () => Command._q[0];


const starter4verb = {};
const updater4verb = {};
const finisher4verb = {};

/**
 * 
 * @param {Command} command 
 */
Command.start = command => {
	console.log("start", Command.str(command));
	let ufn = starter4verb[command.verb];
	if (ufn) {
		ufn(command);
		DataStore.update();
	}
	command.started = true;
}; // ./start

/**
 * 
 * @param {Command} command 
 */
Command.finish = command => {
	console.log("finishing...", Command.str(command));
	let ufn = finisher4verb[command.verb];
	if (ufn) {
		ufn(command);
		DataStore.update();
	}
	console.log("...finished", Command.str(command));
}; // ./finish

/**
 * @param {Command} command 
 * @param {Number} msecs since the command started
 */
Command.updateCommand = (command, msecs) => {
	const fraction = msecs / command.duration;
	let ufn = updater4verb[command.verb];
	if (ufn) {
		ufn(command, msecs, fraction);
		DataStore.update();
	}
}; // ./updateCommand