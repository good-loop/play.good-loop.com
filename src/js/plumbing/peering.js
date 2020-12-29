
/**
 * 
 * DEPRECATED -- This worked fine on one computer
 * but ran into issues when properly networking.
 * 
 * So I just did something simple and dumb instead.
 *
 * * see peeringhack.js
 * 
 */

import Peer from 'peerjs';
import Login from '../base/youagain';
import _ from 'lodash';
import DataStore from '../base/plumbing/DataStore';
import DataClass, { nonce, getType } from '../base/data/DataClass';
import Messaging, { notifyUser } from '../base/plumbing/Messaging';
import { assert } from '../base/utils/assert';


class Room {

	constructor() {
		this['@type'] = 'Room';
	}

	/**
	 * @type {String}
	 */
	id;
	/**
	 * @type {String[]}
	 */
	memberIds = [];

	members = {};	

	chats = [];

	open;
	closed;
	
	state = {};
}
window.Room = Room;

class Chat extends DataClass {
	from;
	text;
}
DataClass.register(Chat, 'Chat');


Room.create = () => {	
	let room = new Room();
	room.id = getPeerId();
	room.open = true;
	let u = getUser();
	room.memberIds = [getPeerId()];
	room.members[getPeerId()] = u || {};
	console.log("Room.create", room);

	peer.on('connection', connb => {			
		console.log("connection", connb);
		window.myconnb = connb;
		wireUpConnection(connb, room);
	});

	roomUpdateFromHost(room);

	return room;
};

Room.memberIds = room => room.memberIds;

const roomUpdateFromHost = room => {
	assert(Room.isHost(room), room);
	if (room.closed) {
		console.warn("Cancel roomUpdateFromHost! "+room.id,room);
		return;
	}
	// do it again (set early in case of errors below)
	setTimeout(() => roomUpdateFromHost(room), 5000);	
	// connection status?
	room.memberIds.forEach(pid => {
		let m = room.members[pid];
		if ( ! m) {
			console.error("No member for "+pid);
			return;
		}
		if (pid===room.id) {
			m.connection = true; // self!
			return;
		}
		let conn = getExistingConnectionTo(pid);
		if ( ! conn) {
			m.connection = false;
			return;
		}
		if ( ! conn.open) {
			m.connection = false;
			return;
		}
		m.connection = true;
		console.log(pid, m, conn);		
	});
	doSyndicate(room, room);	
};

const getUser = () => {
	let u = Login.getUser() || {};
	u.peerId = getPeerId();	
	return u;
};


Room.sendRoomUpdate = room => {
	assert(room);
	assert(room.id, "No host?!", room);

	if (Room.isHost(room)) {
		doSyndicate(room);
		return;
	}

	let conn = getExistingConnectionTo(room.id);	
	sendData(conn, room, room);
};


Room.sendStateUpdate = (room, state) => {
	room.state = Object.assign(room.state, state);
	Room.sendRoomUpdate(room);
};


Room.sendChat = (room, text) => {
	assert(room && text, room,text);
	assert(room.id, "No host?!", room);
	let chat = new Chat();
	chat.text = text;
	chat.from = getPeerId();
	chat = Object.assign({}, chat); // Peer doesnt like classes :(

	room.chats.push(chat);

	Room.sendRoomUpdate(room);
};

Room.enter = (id, user) => {	
	console.log("Room.enter", id, room);
	let room = doJoin(id, user);
	return room;
};
Room.exit = room => {
	if (Room.isHost(room)) {
		// ?
		return; 
	}
	let conn = getExistingConnectionTo(room.id);
	conn.close();
};
Room.isHost = room => getPeerId() === room.id;

Room.member = (room, peerId) => {
	return room.members[peerId];
};

const sendDataQ = [];

const sendData = (c, data, room) => {
	assert(c && data, c,data,room);
	if ( ! c.open) {
		console.warn("not open", c);
		doJoin(c.peer);
		// sendDataQ
		setTimeout(() => {
			let c2 = getExistingConnectionTo(c.peer);
			sendData(c2,data, room);
		},100);
		return;
	}
	console.log("send", data, "to", c.metadata); 
	let d = Object.assign({}, data); // non-object eg Room causes bug?? But what about nested non-objects :(
	c.send(d);
};

/**
 * 
 * @param {String} pid 
 * @returns {?Peer.DataConnection}
 */
const getExistingConnectionTo = (pid) => {
	if ( ! pid) return null;
	let conns = peer.connections;
	console.warn(peer, conns);
	let consToPid = conns[pid];
	if ( ! consToPid) return null;
	let con = consToPid.find(c => c.metadata.to === pid);
	if (con) return con;
	return consToPid[0];
};

const onData = (data, conn, room) => {
	// Will print 'hi!'
	console.log("onData!", data, "from", conn && conn.metadata);
	const dtype = getType(data);
	if (dtype === 'Room') {
		// merge in
		let ns = {data:{Room:{[room.id]: data}}};
		DataStore.update(ns);
		// DataStore.setValue(['data','Room',room.id], room);
		console.log("...onData Room", data, "from", conn && conn.metadata);
	}
	if (dtype === 'Chat') {
		console.log("...onData Chat", data, "from", conn && conn.metadata);
		if ( ! room.chats) room.chats = [];
		room.chats.push(data);
	}
	
	// update	
	onChange();

	// syndicate?
	if (Room.isHost(room)) {
		doSyndicate(data);
	}
};

/**
 * 
 * @param {*} conn 
 * @param {Room} room 
 */
const onConnect = (conn, room) => {
	conn.didOpen = true; // so we can tell between closed and opening
	console.log("onConnect", conn, room);
	let m = conn.peer;
	if ( ! room.memberIds.includes(m)) {
		room.memberIds.push(m);
	}
	room.members[m] = conn.metadata || {};
	onChange();
};
const onError = (e, conn) => {
	conn.didError = true;
	console.error("error", e, conn);
	onChange();
};
const onClose = conn => {
	conn.didClose = true;
	console.error(conn);
	onChange();
};

const onChange = () => {
	DataStore.update();
};

const doSyndicate = (data, room) => {
	console.log("doSyndicate", data);
	let conns = peer.connections || {};
	const conlist = _.flatten(Object.values(conns));
	conlist.forEach(c => {
		if ( ! c.open) {
			console.warn("skip syndicate to closed ",c);
		} else {
			sendData(c, data, room);
		}
	});
};

/**
 * Idempotent
 * @param {String} host 
 */
const doJoin = (host, user={}) => {
	const oldCon = getExistingConnectionTo(host);
	if (oldCon) {
		if (oldCon.open) {
			return;
		}
		if ( ! oldCon.didOpen && ! oldCon.didError && ! oldCon.didError) {
			let rs = oldCon.dataChannel.readyState;
			if (rs==="connecting") {
				console.warn("oldCon _probably_ opening", oldCon);		
				return;
			}
		}
		console.warn("oldCon not open", oldCon);		
	}
	let room = new Room();
	room.id = host;
	const metadata = {from:pid, to:host, host, fromxid:Login.getId(), ...user};
	console.log("doJoin connect "+host+"...");
	const conn = peer.connect(host, {metadata});		
	console.log("...doJoin connect "+host, conn);
	wireUpConnection(conn, room);
	return room;
};

const wireUpConnection = (conn, room) => {
	conn.on('data', data => onData(data, conn, room));
	conn.on('open', () => onConnect(conn, room));
	conn.on('close', () => onClose(conn, room));
	conn.on('error', e => onError(e, conn, room));	
};

Room.call = (room) => {
	startAudioCall(room.id);
};

const pid = nonce(4).toLowerCase();
const peer = new Peer(pid);

peer.on('call', function(call) {
	// Answer the call, providing our mediaStream
	let um = Navigator.getUserMedia(); // deprecated but simpler
	// let constraints = {};	
	// navigator.mediaDevices.getUserMedia(constraints);
	call.answer(um);
	call.on('stream', function(stream) {		
		// `stream` is the MediaStream of the remote peer.
		// Here you'd add it to an HTML video/canvas element.
		document.querySelector('video').srcObject = stream;
	});
});

/**
 * 
 * @param {?String} toPeerId
 */
const startAudioCall = (toPeerId) => {
	if ( ! toPeerId) {
		notifyUser({type:'error', text:"No destination given"});
		return;
	}
	if ( ! navigator.mediaDevices) {
		notifyUser({type:'error', text:"No Media (can be caused by http vs https)"});
		return;
	}
	let pMediaStream = navigator.mediaDevices.getUserMedia({ audio: true, video: true });
	pMediaStream.then(mediaStream => {
		const call = peer.call(toPeerId, mediaStream);
		call.on('stream', function(stream) {
			// `stream` is the MediaStream of the remote peer.
			// Here you'd add it to an HTML video/canvas element.
			document.querySelector('video').srcObject = stream;
		});
	});
};

const getPeerId = () => pid;

/**
 * @returns {String: DataConnection[]}
 */
const getConnections = () => peer.connections;

const getConnectionsList = () => {
	return _.flatten(Object.values(peer.connections));
};

export {
	Room,
	getPeerId, doJoin, startAudioCall, getExistingConnectionTo as getConnectionTo, getConnections, getConnectionsList
};
