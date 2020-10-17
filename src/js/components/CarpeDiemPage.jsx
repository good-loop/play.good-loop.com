import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, { assert } from 'sjtest';
import Login from 'you-again';
import DataStore, { getValue } from '../base/plumbing/DataStore';
import C from '../C';
import Misc from '../base/components/Misc';
import StopWatch from '../StopWatch';
import PropControl, { setInputStatus } from '../base/components/PropControl';
import { Alert, Button, Modal, ModalHeader, ModalBody, Card, CardBody, Row, Col, Container, Form, CardTitle } from 'reactstrap';
import DataClass, { nonce } from '../base/data/DataClass';
import { Room, getPeerId, getCurrentRoom } from '../plumbing/peeringhack';
import { stopEvent, copyTextToClipboard, randomPick, space } from '../base/utils/miscutils';
import Messaging from '../base/plumbing/Messaging';
import BG from '../base/components/BG';
import LobbyPage, { isInLobby, Peeps, Chatter, peepName } from './LobbyPage';
import AdCardsGame from './AdCardsGame';
import CSS from '../base/components/CSS';
import MDText from '../base/components/MDText';
import Command, { doq } from '../data/Command';
import { Draggable, DropZone } from '../base/components/DragDrop';
import GameLoop from '../plumbing/GameLoop';
import EvilTasks from '../data/EvilTasks';

let game = {
	date: new Date("2020-01-01"),
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
	constructor(sdate) {
		this.sdate = sdate;
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

let onTick = (tick, stopwatch) => {
	Command.tick(tick);
	// a new email?
	if (Spawner.update(emailSpawner, tick)) {
		let todo = randomPick(EvilTasks);
		doq(new Command(todo, "todo"));
		if (emailSpawner.msecs > 200) emailSpawner.msecs -= 100; // a bit faster every time!
	}
};


Command.setHandler({
	verb:"game-over", 
	onStart:cmd => {
		console.error("GAME OVER");
	}
});

Command.setHandler({
	verb:"todo", 
	onStart:cmd => {
		game.emails.push(new ToDo(cmd.subject));
		if (game.emails.length > 6) {
			doq(new Command(null, "game-over"));
		}
	}
});

const CarpePage = () => {
	
	// let game = Game.get();
	let gameLoop = GameLoop.get();
	if ( ! gameLoop) {
		// Start!
		gameLoop = new GameLoop({onTick})
		doq(new Command("Dr Evilstein","say", "Hello"));		
	}

	return (<Container fluid className="h-100">
		<div className='score'>Score etc {Misc.dateTag(game.date)} </div>
		<Row className='h-100'>
			<Col sm={4}><Inbox /></Col>
			<Col sm={8} ><Calendar /></Col>
		</Row>
	</Container>);
};

class ToDo {
	id = "ToDo"+nonce();

	constructor(msg) {
		this.msg = msg;
	}
}

const Inbox = () => {
	return <div className='inbox'>{game.emails.map(e => <Email key={e.id} email={e}/>)}</div>
};
const Email = ({email}) => {
	return <div className='email'><Draggable id={email.id}>{email.msg}</Draggable></div>;
};

const Calendar = () => {
	let sdays = "";
	for(let i=0; i<6*7; i++) sdays += " 2020-01-"+i
	let days = sdays.trim().split(" ");
	return (<div className='calendar gridbox gridbox-sm-7'>
		{days.map(day => <DayBox key={day} sdate={day}></DayBox>)}
	</div>);
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
	day.am = email;
	game.emails = game.emails.filter(e => e !== email);
};

const DayBox = ({sdate}) => {
	let msg = null;
	let day = game.day4sdate[sdate];
	if (day && day.am) {
		msg = day.am.msg;
	}
	return <div className='DayBox'><DropZone id={sdate} onDrop={(e,dropInfo) => drop(sdate,e,dropInfo)}>{sdate} {msg}</DropZone></div>;
};

export default CarpePage;
