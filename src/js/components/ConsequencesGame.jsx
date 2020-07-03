/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import DataStore, { getValue, setValue } from '../base/plumbing/DataStore';
import C from '../C';
import Misc from '../base/components/Misc';
import PropControl, { setInputStatus } from '../base/components/PropControl';
import { Alert, Button, Modal, ModalHeader, ModalBody, Card, CardBody, Row, Col, Container, Form, CardTitle } from 'reactstrap';
import DataClass, { nonce } from '../base/data/DataClass';
import {Room,getPeerId} from '../plumbing/peeringhack';
import { stopEvent } from '../base/utils/miscutils';
import BG from './BG';
import ServerIO from '../base/plumbing/ServerIOBase';
import JSend from '../base/data/JSend';

const ConsequencesGame = ({room}) => {		

	let myId = getPeerId();
	const statePath = ['data','Room',room.id,'state'];
	const sstate = Room.sharedState(room);
	
	if ( ! sstate.done) sstate.done = {};
	const dones = sstate.done;
			
	let myAnswersPath = statePath.concat([myId, 'answers']);
	let myAnswers = getValue(myAnswersPath) || {};

	const imDone = dones[myId];

	// All done??
	if (Room.isHost(room)) {
		let done = checkDone(room, dones);		
		if (done) {
			makeStories(room);
		}
	}
	if (sstate.story) {
		return <ShowStories room={room} />;
	}

	let sdones = Object.keys(dones).map(pid => Room.member(room, pid).name).join(", ");

	const setDone = e => {
		dones[myId] = true;
		DataStore.update();
		Room.sendRoomUpdate(room);
	};
	let a = Object.keys(myAnswers).length;
	const ready = a===6;

	return (<div>
		<h2>Consequences Game</h2>
		
		<PropControl label='He was' path={myAnswersPath} prop={0} disabled={imDone} />
		
		<PropControl label='She was' path={myAnswersPath} prop={1} disabled={imDone} />
		<PropControl label='They met' path={myAnswersPath} prop={2} disabled={imDone} />
		<PropControl label='He said' path={myAnswersPath} prop={3} disabled={imDone} />
		<PropControl label='She said' path={myAnswersPath} prop={4} disabled={imDone} />
		<PropControl label='As a consequence' path={myAnswersPath} prop={5} disabled={imDone} />
		<div>
			<Button color={ready?'primary':'secondary'} disabled={imDone} onClick={setDone} >I'm Done!</Button>
			<div>Done: {sdones}</div>
		</div>

	</div>);		
};


/**
 * @returns {string} The story!
 */
const makeStory = (answerSet) => {
	return "He was "+answerSet[0]+". She was "+answerSet[1]+". They met "+answerSet[2]+". He said "+answerSet[3]+". She said "+answerSet[4]+". As a consequence "+answerSet[5];
};


const ShowStories = ({room}) => {
	// alphabetical id sort, to give consistency between clients
	let mids = [...Room.memberIds(room)];
	mids.sort();
	const sstate = Room.sharedState(room);
	const stories = sstate.story;
	let myi = mids.indexOf(getPeerId()) || 0;		
	myi = myi % stories.length;

	const story = stories[myi];
	
	// grab a backdrop?	
	let pvImg = DataStore.fetch(['misc','bg',room.id, 'story'+myi], () => {
		let q = sstate.bg[myi];
		return ServerIO.load('/unsplash', {data:{q, size:1}})
			.then(resp => {
				console.warn(resp);			
				let res = JSend.data(resp);			
				return res[0];	
			});
	});

	return (<div style={{fontSize:'150%'}}>
		<h2>Consequences Game</h2>
		{pvImg.value? <BG src={pvImg.value.urls && pvImg.value.urls.regular} /> : null}
		<Card body>
			<CardTitle><h3>Story {myi+1} of {stories.length}</h3></CardTitle>
			{JSON.stringify(story)}
		</Card>
		<Card body className='mt-4'><Button onClick={e => Room.clearState(room)}>Return to Start</Button></Card>
	</div>);
};


const makeStories = room => {
	// make stories
	let n = Room.memberIds(room).length;
	let sstate = Room.sharedState(room);
	sstate.story = [];
	let answerArrays = Room.memberIds(room).map(mid => room.state[mid].answers);
	let numQs = answerArrays[0].length;	
	if (numQs===undefined) numQs = Object.keys(answerArrays[0]).length;	// e.g. {0:'Alan',1:'Betty'} instead of an array
	const numAnswerSets = answerArrays.length;
	sstate.bg = {};
	for(let i=0; i<n; i++) {			
		let answerSet = [];
		for(let j=0; j<numQs; j++) {
			answerSet.push(answerArrays[(i+j) % numAnswerSets][j]);
		}
		let storyi = makeStory(answerSet);
		sstate.story[i] = storyi;
		sstate.bg[i] = answerSet[2];
	}
	sstate.done = true;
	Room.sendRoomUpdate(room);
};

const checkDone = (room, dones) => {
	if ( ! dones) return false;
	let dcnt = Object.values(dones).filter(d => d).length;
	if (dcnt === Room.memberIds(room).length) {
		return true;
	}
};

export default ConsequencesGame;
