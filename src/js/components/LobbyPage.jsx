/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React, { useState, Children } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import DataStore, { getValue } from '../base/plumbing/DataStore';
import C from '../C';
import Misc from '../base/components/Misc';
import PropControl, { setInputStatus } from '../base/components/PropControl';
import { Alert, Button, Modal, ModalHeader, ModalBody, Card, CardBody, Row, Col, Container, Form, CardTitle } from 'reactstrap';
import DataClass, { nonce } from '../base/data/DataClass';
import {Room,getPeerId,getCurrentRoom} from '../plumbing/peeringhack';
import { stopEvent, copyTextToClipboard, randomPick } from '../base/utils/miscutils';
import Messaging from '../base/plumbing/Messaging';
import BG from '../base/components/BG';
import CGame from './ConsequencesGame';
// Game states: Name -> Create / Join -> Start -> Enter -> Deliver stories

/**
 * 
 * @param {!Room} room 
 * @returns {boolean}
 */
const isInLobby = room => {
	return ! room.state || ! room.state.stage || room.state.stage === 'lobby';
};

const LOBBIES = [
	{url:"https://source.unsplash.com/POKM7TN9_48/640x427", author:"Michael Glass",citation:"https://unsplash.com/@the_odyssey_image"},
	{url:"https://source.unsplash.com/Uhs7bhALLeM/640x426", author:"Ali Yahya",citation:"https://unsplash.com/@ayahya09"},
	{url:"https://source.unsplash.com/TzlERxVhGfc/640x800", author:"Brandon Hooper",citation:"https://unsplash.com/@brh00p3r"},	
];

/**
 * @param {String} world
 */
const LobbyPage = ({title,children}) => {
	let wpath = ['misc','consequences'];
	let pid = getPeerId();	
	let game = DataStore.getUrlValue('game');
	let join = DataStore.getUrlValue('join');
	let roomId = DataStore.getValue('misc','roomId');

	let room = roomId? DataStore.getValue('data','Room',roomId) : null;
	let [bgLobby] = useState(randomPick(LOBBIES));

	if ( ! room) {		
		return <BG image={bgLobby} minHeight="90vh"><Container>{title? <h2>{title}</h2> : null}<Entrance join={join} />{children}</Container></BG>;
	}

	let Guts;
	if (isInLobby(room)) {
		Guts = <RoomOpen room={room} />;
	} else {		
		// game on
		bg = '/img/paper-texture.jpg';
		Guts = <CGame room={room} />;
	}

	return (<BG image={bgLobby} minHeight="90vh"><Container>
		{title? <h2>{title}</h2> : null}
		<Row>
			<Col>{Guts}</Col>
			<Col>
				<Peeps room={room} />
				<Chatter room={room}/>
			</Col>
		</Row>
		<Row>{children}</Row>
	</Container></BG>);
};

let nameOnceFlag = false;

const Entrance = ({join}) => {
	if (join) {
		DataStore.setValue(['widget','Lobby','room'], join, false);
	}
	// First enter your name
	let name = DataStore.getValue("misc", "player", "name");
	if ( ! name && ! nameOnceFlag) { // stored? (one time only, so you can clear a value)
		nameOnceFlag = true;
		name = window.localStorage.getItem("name");
		DataStore.setValue(["misc", "player", "name"], name, false);		
	}
	if ( ! name) {
		return <Card body className='mt-2 mb-2'>
			<PropControl path={['misc','player']} prop="name" label="Your Name" />
		</Card>;
	}
	window.localStorage.setItem("name", name);

	return (<>				
		<Card body className='mt-2 mb-2'>
			<PropControl path={['misc','player']} prop="name" label="Your Name" />
		</Card>
		<Row>
			<Col>
				<Card body>
					<CardTitle><h3>Join a Room?</h3></CardTitle>
					<PropControl path={['widget','Lobby']} prop='room' label='Room ID' />
					<Button onClick={() => joinRoom(join || DataStore.getValue('widget','Lobby','room'))}>Join</Button>
				</Card>
			</Col>
			<Col>
				{join? null : <Card body><CardTitle><h3>Create a New Room?</h3></CardTitle><Button onClick={createRoom}>Create</Button></Card>}
			</Col>
		</Row>
	</>);
};

const RoomOpen = ({room}) => {
	// onClick={e => doShare(e, this)
	return 	<Card body className='m-2'>
	<h3><ShareLink room={room}>Room: {room.id}</ShareLink></h3>

	<h2>{Room.isHost(room)? "Host" : "Guest"}</h2>
		
	{Room.isHost(room)? 
		<Button className='m-2' onClick={e => doStart(room)}>Everybody's In? - Let's Start!</Button> 
		: <p>Please wait for the host ({peepName(room, room.oid)}) to kick-off the game.</p>}
	</Card>;
};

const peepName = (room, pid) => {
	let m = Room.member(room, pid);
	return (m && m.name) || pid;
}

const Peeps = ({room}) => {
	assert(room, "Peeps - no room!");
	return (<Card><CardBody>
		<CardTitle><h3>People Here</h3></CardTitle>
		{Room.memberIds(room).map(pid => <Peep key={pid} pid={pid} room={room}/>)}
	</CardBody></Card>);
};
const Peep = ({pid,room}) => {
	let m = Room.member(room, pid);
	return <div>{m.name || pid}&nbsp;
		{m.connection? <span role='img' aria-label=':)' className='text-success'>&#x1F603;</span> : <><span role='img' aria-label=':(' className='text-danger'>&#x1F626;</span> lost connection</>}
		{m.answer? <span>{""+m.answer}</span> : null}
	</div>;
};

const doStart = room => {
	room.state.stage = 'game';
	Room.sendStateUpdate(room, room.state);
};

const Chatter = ({room}) => {
	assert(room, "Chatter - no room!");
	const doChat = e => {
		stopEvent(e);
		Room.sendChat(room, DataStore.getValue('misc','chat','text'));
		DataStore.setValue(['misc','chat','text'],null);
	};
	let chats = Room.chats(room);
	return (<Card><CardBody>
		<CardTitle><h3>Chat</h3></CardTitle>
		{chats.map((c,i) => <Chat key={i} room={room} chat={c} />)}
		<Form onSubmit={doChat} className='flex-row'>
			<PropControl path={['misc','chat']} prop='text' className='flex-grow mr-2' />
			<Button onClick={doChat} disabled={ ! DataStore.getValue('misc','chat')} >Send</Button>
		</Form>		
	</CardBody></Card>);
			// <video style={{width:'50px',height:'50px'}}/>
			// <Button onClick={e => Room.call(room)}>Call</Button>	
};

const Chat = ({room, chat}) => {
	let m = Room.member(room, chat.from);
	return <div ><small>{m.name}:</small> {chat.text}</div>;
};

const ShareLink = ({room}) => {
	// let shareUrl = $a.getAttribute('href');
	// let shareTitle = $a.getAttribute('data-sharetitle');
	// let shareText = $a.getAttribute('data-sharetext');
	let u = window.location;
	let href = u+"?join="+room.id;
	return (<>Room code: <a href={href} target='_blank' >{room.id}</a>
	<Button className='ml-1' size='sm' onClick={e => copyTextToClipboard(href)}>&#x1f4cb; copy link to clipboard</Button>
	</>);
};

// HACK
setInterval(() => DataStore.update({}), 500);

const getName = () => getValue('misc','player','name');

const createRoom = () => {
	let theRoom = Room.create();
	let me = Room.member(theRoom, getPeerId()) || {};
	me.name = getName();
	DataStore.setValue(['data','Room', theRoom.id], theRoom);
	DataStore.setValue(['misc','roomId'], theRoom.id);
};
const joinRoom = (roomId) => {
	if ( ! roomId) {
		Messaging.notifyUser("Please enter a Room ID");
		return;
	}
	
	// set your name
	let user = Login.getUser() || {};
	user.name = getName();

	let theRoom = Room.enter(roomId, user);
	
	DataStore.setValue(['data','Room', theRoom.id], theRoom, false);
	DataStore.setValue(['misc','roomId'], theRoom.id, false);
	return theRoom;
};

export default LobbyPage;
export {
	isInLobby, Peeps, Chatter, peepName
};
