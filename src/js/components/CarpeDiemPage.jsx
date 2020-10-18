import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, { assert } from 'sjtest';
import Login from 'you-again';
import DataStore, { getValue } from '../base/plumbing/DataStore';
import C from '../C';
import Misc, {WEEKDAYS} from '../base/components/Misc';
import StopWatch from '../StopWatch';
import PropControl, { setInputStatus } from '../base/components/PropControl';
import { Alert, Button, Modal, ModalHeader, ModalBody, Card, CardBody, Row, Col, Container, Form, CardTitle, ToastBody } from 'reactstrap';
import DataClass, { nonce } from '../base/data/DataClass';
import { Room, getPeerId, getCurrentRoom } from '../plumbing/peeringhack';
import { stopEvent, copyTextToClipboard, randomPick, space, isoDate, is } from '../base/utils/miscutils';
import Messaging from '../base/plumbing/Messaging';
import BG from '../base/components/BG';
import LobbyPage, { isInLobby, Peeps, Chatter, peepName } from './LobbyPage';
import AdCardsGame from './AdCardsGame';
import CSS from '../base/components/CSS';
import MDText from '../base/components/MDText';
import Command, { doq } from '../data/Command';
import { Draggable, dragstate, DropZone } from '../base/components/DragDrop';
import GameLoop from '../plumbing/GameLoop';
import EvilTasks, { taskSizes } from '../data/EvilTasks';
import { assMatch } from '../base/utils/assert';
import { prettyNumber } from '../base/utils/printer';
import ChatLine from './ChatLine';

let game = {
	/** @type {Command} */
	say:null,
	over: false,
	score: 0,
	/** The date for the top-left of the calendar */
	date0: new Date("2019-12-30"),
	/** today (NB: this will get +1 straight away) */
	date: new Date("2019-12-31"),
	emails: [],
	/** e.g. "2020-01-02" (jan 2nd) */
	day4sdate: {}
};
window.game = game; // debug

class Day {
	/** e.g. "2020-01-02" (jan 2nd) */
	sdate;
	am;
	pm;
	isWeekend;

	constructor(sdate) {
		this.sdate = sdate;
		const date = new Date(sdate);
		let day = date.getDay();
		if (day===0 || day===6) {
			this.isWeekend = true;
		}
	}
}

class Spawner {
	constructor(msecs) {
		this.msecs = msecs;
		assert(msecs > 10, "Spawner - msecs ",msecs);
	}
}
Spawner.update = (spawner, tickMsecs) => {
	if ( ! spawner.tick) {
		spawner.tick = tickMsecs;
		return true;
	}
	if (tickMsecs < spawner.tick + spawner.msecs) return;
	spawner.tick = tickMsecs;
	return true;
};

let emailSpawner = new Spawner(5000);
let daySpawner = new Spawner(5000);

let onTick = (tick, stopwatch) => {
	Command.tick(tick);
	// a new email?
	if (Spawner.update(emailSpawner, tick)) {		
		doq(new Command(null, "todo", null));
	}
	if (Spawner.update(daySpawner, tick)) {		
		doq(new Command(null, "score", 10));
		plus1Day(game.date);
		// weekend tasks = lose
		if (game.date.getDay()===0 || game.date.getDay()===6) {
			let day = game.day4sdate[isoDate(game.date)];
			if (day && (day.am || day.pm)) {
				doq(new Command("weekend","game-over"));
			}
		}
		// new week?
		if (game.date.getDay() === 1) {
			doq(new Command(null, "new-week"));
			// speed up!
			// NB average slots per task is 32/12, week-day slots per day = 10/7 -- so days need to go 2x faster
			if (daySpawner.msecs > 300) {
				daySpawner.msecs -= 100;
			}
			if (emailSpawner.msecs > 600) {
				emailSpawner.msecs -= 100;
			}
		}
		// new month? +100 score
		if (game.date.getDate() === 1) {
			doq(new Command("New Month!", "score", 100));
		}
	}
};

Command.setHandler({
	verb:"start", 
	onStart:cmd => {
		game.say = null;
		GameLoop.pause(talkLoop);
		GameLoop.start(gameLoop);
	}
});


Command.setHandler({
	verb:"game-over", 
	onStart:cmd => {
		console.error("GAME OVER");
		GameLoop.pause(gameLoop);
		GameLoop.start(talkLoop); // this will swap the command qs
		let msg = "What?!";
		if (cmd.subject==="overload") {
			msg = randomPick([
				"The inbox is overflowing!",
				"What is this? I will not tolerate a messy inbox!",
				"I told you to manage your inbox! Not to let it overflow like a hooker's bra!",
				"Your inbox has overflowed! This is unacceptable.",
			]);
		}
		if (cmd.subject==="weekend") {
			msg = randomPick([
				"My weekend's are sacrosanct. That's when I relax. I get very angry if I can't relax.",
				"You scheduled work in *my* weekend?! You scheduled your own demise!",
			]);
		}
		
		msg = "(angry) "+msg;
		doq(new Command("Dr Evilstein","say", msg));

		let msgDie = randomPick([
			"You're fired! Please feed yourself to the sharks on the way out.",
			"You have failed me for the last time! Also for the first time - I'm quick to judge.",
			"No - I don't want to hear your excuses -- tell them to the sharks.",
			"And so another diary secretary ends up as shark-food... Is it me? Am I doing something wrong?",
		]);
		doq(new Command("Dr Evilstein","say", "(angry) "+msgDie));
	}
});


Command.setHandler({
	verb:"new-week", 
	onStart:cmd => {
		// TODO remove done-week dramatically
	},
	onEnd:cmd => {
		// advance a week
		game.date0.setDate(game.date0.getDate() + 7);
	}
});

Command.setHandler({
	verb:"score", 
	onStart:cmd => {
		assMatch(cmd.object, Number, cmd);
		cmd.endScore = game.score + cmd.object;
	},
	onUpdate: (cmd, msecs, fraction) => {
		game.score = cmd.endScore - cmd.object*(1-fraction);
	},
	onEnd: cmd => {
		game.score = cmd.endScore;
	}
});

const MAX_EMAILS = 6;

Command.setHandler({
	verb:"todo", 
	onStart:cmd => {
		if ( ! cmd.subject) cmd.subject = randomPick(EvilTasks);
		// if ( ! cmd.size) cmd.size = randomPick(taskSizes);

		let todo = new ToDo(cmd.subject);
		// todo.size = cmd.object; 
		todo.color = randomPick(["#ADC4CE","#EEE0C9","#E4DECB","#E2F0CB","#bae1ff","#f1cbff", "#fff"]);
		todo.size = randomPick(taskSizes);

		if ( ! todo.size) { // bug workaround - how does this happen?
			todo.size = randomPick(taskSizes);			
			if ( ! todo.size) {
				console.error("No size?!", JSON.stringify(taskSizes), cmd);
				todo.size = taskSizes[0];
			}
		}

		game.emails.push(todo);
		// overload?
		if (game.emails.length > MAX_EMAILS) {
			game.over = true;
			doq(new Command("overload", "game-over"));			
		}
	}
});


Command.setHandler({
	verb:"say", 
	onStart:cmd => {
		// talk blocks normally
		if ( ! is(cmd.blocking)) cmd.setBlocking();
		game.say = cmd;
	}
});


let onTickTalk = (tick, stopwatch) => {
	Command.tick(tick);
};


let gameLoop = new GameLoop({onTick});
let talkLoop = new GameLoop({onTick: onTickTalk});

const CarpePage = () => {
	// Start with the intro
	if ( ! talkLoop.startFlag) {
		// Start!
		GameLoop.start(talkLoop);
		doq(new Command("Dr Evilstein","say", "Hello - You must be my new diary secretary."));
		doq(new Command("Dr Evilstein","say", "It's a simple job - just drag tasks from the inbox, and drop them into the calendar."));
		doq(new Command("Dr Evilstein","say", "Don't let your inbox overflow!"));
		doq(new Command(null, "start"));
	}

	return (<Container fluid className="h-100">
		<CSS css="footer{display:none !important;}" />
		<div className='score'>{Misc.dateTag(game.date)} <span className='pull-right'>Score {prettyNumber(Math.round(game.score), 10)}</span></div>
		<Row className={space('h-100',game.say&&"defocus")}>
			<Col sm={4}><Inbox /></Col>
			<Col sm={8} ><Calendar /></Col>
		</Row>
		{game.say && <ChatLine cmd={game.say} line={game.say.subject+": "+game.say.object} />}
	</Container>);
};

class ToDo {
	id = "ToDo"+nonce();

	constructor(msg) {
		this.msg = msg;
	}
}

const Inbox = () => {
	return (<>
		<div className='weekdays'>Inbox</div>
		<div className={space('inbox', game.emails.length===MAX_EMAILS-1&&'warning', game.emails.length >= MAX_EMAILS&&'danger')}>
			{game.emails.map(e => <Email key={e.id} email={e}/>)}
		</div>
		</>)
};
const Email = ({email}) => {
	let size = email.size || taskSizes[0];
	return (<div className='email'>
		<Row>
			<Col>{email.msg}</Col>
			<Col>
				<Draggable id={email.id}><table><tbody>
					<BlockRow srow={size[0]} color={email.color || 'brown'} />
					<BlockRow srow={size[1]} color={email.color || 'brown'} />
				</tbody></table></Draggable>
			</Col>
		</Row>
		</div>);
};
const BlockRow = ({srow, color}) => (<tr>{srow.split("").map((c,i) => 
		<td key={i} style={{backgroundColor:c==="x"&&color}} className={c==="x"? "block": "gap"}>&nbsp;</td>
	)}</tr>);

const MWEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const Calendar = () => {
	let date = new Date(game.date0.getTime()); // copy so we can modify
	let days = [];
	for(let i=0; i<6*7; i++) {
		days.push(isoDate(date));
		plus1Day(date);		
	}
	// what days are being dropped on?
	let on4sdate = dropOnDays(dragstate.dragging, dragstate.dragover) || {};

	return (<>
	<div className='weekdays gridbox gridbox-sm-7'>{MWEEKDAYS.map(d => <div key={d}>{d}</div>)}</div>
	<div className='calendar gridbox gridbox-sm-7'>		
		{days.map(day => <DayBox key={day} sdate={day} dragover={on4sdate[day]}></DayBox>)}
	</div></>);
};

/**
 * Modify date
 * @param {Date} date 
 * @returns {Date} the same object
 */
const plus1Day = date => {
	date.setDate(date.getDate() + 1);
	return date;
};

/**
 * 
 * @returns {sdate: am/pm/am+pm}
 */
const dropOnDays = (emailId, sdate) => {
	if ( ! emailId || ! sdate) {
		return;
	}
	let email = game.emails.find(e => e.id === emailId);
	if ( ! email) {
		return;
	}
	let on4sdate = {};
	let ams = email.size[0];
	let pms = email.size[1];
	{
		let on = "";
		if (ams[0]==="x") on += "am";
		if (pms[0]==="x") on += "pm"
		on4sdate[sdate] = on;
	}
	let date1 = new Date(sdate)
	{		
		plus1Day(date1);
		let sdate1 = isoDate(date1)
		let on = "";
		if (ams[1]==="x") on += "am";
		if (pms[1]==="x") on += "pm"
		on4sdate[sdate1] = on;
	}
	{		
		plus1Day(date1);
		let sdate2 = isoDate(date1)
		let on = "";
		if (ams[2]==="x") on += "am";
		if (pms[2]==="x") on += "pm"
		on4sdate[sdate2] = on;
	}

	return on4sdate;
};

const canDrop = (sdate, email) => {
	let ams = email.size[0];
	let pms = email.size[1];
	let day = game.day4sdate[sdate];
	if (ams[0]==="x" && day.am) return false;
	if (pms[0]==="x" && day.pm) return false;	
	
	let date1 = new Date(sdate)
	plus1Day(date1);
	let sdate1 = isoDate(date1)
	let day1 = game.day4sdate[sdate1] || {};
	if (ams[1]==="x" && day1.am) return false;
	if (pms[1]==="x" && day1.pm) return false;	

	plus1Day(date1);
	let sdate2 = isoDate(date1)
	let day2 = game.day4sdate[sdate2] || {};
	if (ams[2]==="x" && day2.am) return false;
	if (pms[2]==="x" && day2.pm) return false;	
	
	return true;
};

const drop = (sdate, e, dropInfo) => {	
	let email = game.emails.find(e => e.id === dropInfo.draggable);
	if ( ! email) {
		console.error("drop No Task?!", dropInfo);
		return;
	}
	let day = game.day4sdate[sdate];
	if ( ! day) {
		day = new Day(sdate);
		game.day4sdate[sdate] = day;
	}
	console.warn("drop", email, day, e, dropInfo);	
	if ( ! canDrop(sdate, email)) {
		console.error("BAD drop", email, day, e, dropInfo);	
		// TODO play sound
		return;
	}
	// drop where? HACK
	let date1 = new Date(sdate)
	plus1Day(date1);
	let sdate1 = isoDate(date1)
	plus1Day(date1);
	let sdate2 = isoDate(date1)
	let day1 = game.day4sdate[sdate1] || {};
	let day2 = game.day4sdate[sdate2] || {};
	let ams = email.size[0];
	let pms = email.size[1];
	// ...ams
	if (ams[0]==="x") day.am = email;
	if (ams[1]==="x") day1.am = email;
	if (ams[2]==="x") day2.am = email;
	// ...pms
	if (pms[0]==="x") day.pm = email;
	if (pms[1]==="x") day1.pm = email;
	if (pms[2]==="x") day2.pm = email;
	// remove from inbox
	game.emails = game.emails.filter(e => e !== email);
	if ( ! game.emails.length) {
		// avoid empty
		doq(new Command(null, "todo"));
	}
};

const styleSlot = (todo, isDragover, dragover) => {
	// if (dragover) {
	// 	if ( ! dragover) console.log("FOO");
	// }
	if (todo) {
		return {backgroundColor: todo.color || 'brown'};
	}
	if (isDragover) {
		return {backgroundColor: 'lightsalmon'};
	}
	return null;
};

const DayBox = ({sdate, dragover}) => {	
	let day = game.day4sdate[sdate];
	if ( ! day) {
		day = new Day(sdate);
		game.day4sdate[sdate] = day;
	}
	let amMsg = day.am && day.am.msg;
	let pmMsg = day.pm && day.pm.msg;
	let date = new Date(sdate);
	if (date <= game.date) {
		day.done = true;
	}

	let $boxDate = <div className='box-date'>{space(date.getDate()===1 && MONTHS[date.getMonth()], date.getDate())}</div>;
	let amStyle = styleSlot(day.am, dragover&&dragover.includes("am"), dragover);
	let $am = <div className='box-am' style={amStyle} >{amMsg}</div>;
	// let $am = <div className={space('box-am', amMsg&&"full")} style={{backgroundColor:day.am&&day.am.color}}>{amMsg}</div>;
	let $pm = <div className='box-pm' style={styleSlot(day.pm, dragover&&dragover.includes("pm"), dragover)} >{pmMsg}</div>;

	if (day.done) {
		let isToday = sdate === isoDate(game.date);
		return (<div className={space('DayBox done', isToday&&"today")}>
			{$boxDate}{$am}{$pm}
			{isToday && <img src='/img/person/dr-evilstein-fwd.svg' className='dr-evilstein' />}
		</div>);
	}

	return (<div className={space('DayBox', day.isWeekend &&"weekend")}>
		<DropZone id={sdate} 
			onDrop={(e,dropInfo) => drop(sdate,e,dropInfo)}
			canDrop={(dragId,zoneId) => ! (amMsg && pmMsg)}
		>
			{$boxDate}{$am}{$pm}
		</DropZone>
	</div>);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default CarpePage;
