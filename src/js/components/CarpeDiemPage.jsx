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

const CarpePage = () => {

	useEffect(() => {
		doq(new Command("Dr Evilstein","say", "Hello"));
	}, []);

	return (<Container fluid className="h-100">
		<div className='score'>Score etc</div>
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

let emails = [
	new ToDo("Water the plants"),
	new ToDo("Paint the spare dungeon"),
	new ToDo("Push Granny off the bus"),
	new ToDo("Invent freeze gun"),
];

const Inbox = () => {
	return <div className='inbox'>{emails.map(e => <Email key={e.id} email={e}/>)}</div>
};
const Email = ({email}) => {
	return <div className='email'><Draggable id={email.id}>{email.msg}</Draggable></div>;
};

const Calendar = () => {
	let sdays = "";
	for(let i=0; i<6*7; i++) sdays += " "+i
	let days = sdays.trim().split(" ");
	return (<div className='calendar gridbox gridbox-sm-7'>
		{days.map(day => <DayBox key={day} day={day}></DayBox>)}
	</div>);
};

const drop = (day, e, dropInfo) => {
	// console.warn("drop", e, dropInfo, e.dataTransfer, e.currentTarget); 
	foo[""+day] = (dropInfo && dropInfo.draggable) || 'X';
};
let foo = {};
const DayBox = ({day}) => {
	let msg = null;
	if (foo[day]) {
		msg = (emails.find(e => e.id===foo[day]) || {}).msg || foo[day];
	}
	return <div className='DayBox'><DropZone onDrop={(e,dropInfo) => drop(day,e,dropInfo)}>{day} {msg}</DropZone></div>;
};

export default CarpePage;
