/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import DataStore, { getValue } from '../base/plumbing/DataStore';
import C from '../C';
import Misc from '../base/components/Misc';
import StopWatch from '../StopWatch';
import PropControl, { setInputStatus } from '../base/components/PropControl';
import { Alert, Button, Modal, ModalHeader, ModalBody, Card, CardBody, Row, Col, Container, Form, CardTitle } from 'reactstrap';
import DataClass, { nonce } from '../base/data/DataClass';
import {Room,getPeerId,getCurrentRoom} from '../plumbing/peeringhack';
import { stopEvent, copyTextToClipboard, randomPick, space } from '../base/utils/miscutils';
import Messaging from '../base/plumbing/Messaging';
import BG from './BG';
import LobbyPage, { isInLobby, Peeps, Chatter } from './LobbyPage';
import AdCardsGame from './AdCardsGame';

// Game states: Name -> Create / Join -> Start -> Enter -> Deliver stories

const AdCardsPage = () => {
	let room = getCurrentRoom();
	if ( ! room || isInLobby(room)) {
		return (<LobbyPage title='Ads Without Humanity'>
			TODO game options - showCards
		</LobbyPage>);
	}
	if ( ! room.game || ! room.game.playerIds) {
		// only setup once (the host)
		if ( ! Room.isHost(room)) {
			return <Misc.Loading />;
		}
		room.game = new AdCardsGame();
		room.game.playerIds = Room.memberIds(room);
		AdCardsGame.setup(room.game);
	}
	// my id
	let pid = getPeerId();
	let game = room.game;
	let clientMember = Room.member(room, game.client);
	const isClient = pid === game.client;
	const member = Room.member(room, pid);	
	return (<Container fluid>
		<Row>
			<Col>
				<h3>Ads Without Humanity</h3>				
				<h4>Client rep: {clientMember.name || game.client} {isClient? " - That's You!" : null}</h4>

				{isClient? <ClientView game={game} member={member} pid={pid} /> : null}
				{ ! isClient? <AdvertiserView game={game} member={member} pid={pid} /> : null}
				
				<TriviaStage game={game} pid={pid} isClient={isClient} />
				<DoneStage game={game} pid={pid} isClient={isClient} />

			</Col>
			<Col>
				<Peeps room={room} />
				<Chatter room={room} />
			</Col>
		</Row>
	<div>Room: {room.id}, Host: {room.oid}, Stage: {game.roundStage}</div>
	</Container>);
};

const WAIT_MSGS = [
	"Listen! That gurgling is the sound of creative juices flowing. Definitely not gin on a phone call.",
	"With passion and energy, the creatives set to work...",
];

const ClientView = ({game, member, pid}) => {	
	const pickedCards = AdCardsGame.pickedCards(game);
	const allPicked = pickedCards.length >= game.playerIds.length - 1;
	if (game.roundStage==='create' && allPicked) AdCardsGame.setRoundStage(game, 'pitch');
	
	const rstage = game.roundStage;

	if ( ! game.waitMsg) {
		// TODO why is this sometimes flickering? Is it not getting sent to the server & shared properly?
		game.waitMsg = randomPick(WAIT_MSGS);
	}
	return (<>
		<h3>Congratulations! You have just been made Chief Marketing Officer for</h3>
		<Card body color='dark'><h3 className='text-light'>ACME {game.product}</h3></Card>
		
		<h4 className={rstage!=='brief'? 'd-none' : null}>
			Tell the Advertisers what the product is. Then click this button 
			<Button color='primary' onClick={e => AdCardsGame.setRoundStage(game, 'create')}>Let Them Get Creative</Button>
		</h4>

		<h5 className={rstage!=='create'? 'd-none' : null}>{game.waitMsg}</h5>

		<h4 className={rstage!=='pitch'? 'd-none' : null}>
			Pitches! 
			Ask the Advertisers for their slogan pitches. Then click this button when you are ready to
			<Button color='primary' onClick={e => AdCardsGame.setRoundStage(game, 'pick')}>Choose the Winner</Button>
		</h4>

		<div className={rstage!=='pick'? 'd-none' : null}>
			<h4>Pick a winning slogan</h4>
			<ClientChoiceHand game={game} member={member} pid={pid} hand={pickedCards} />
		</div>

	</>);
};

const TriviaStage = ({game, pid, isClient}) => {
	if (game.roundStage !== 'trivia') return null;
	const tpath = ['misc','trivia',game.winningCard];
	const triviaGuess = DataStore.getValue(tpath.concat('brand'));

	let guesses = game.playerIds.map(p => game.playerState[p].triviaGuess).filter(g => g);
	const allGuessed = guesses.length >= game.playerIds.length;
	if (allGuessed && isClient) {
		AdCardsGame.setRoundStage(game, 'done');
	}

	return (
		<div>
			<h4>The winning slogan is: </h4>
			<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
			<Card body color='success' ><h3>{game.winningCard}</h3></Card>
			
			<h4>Trivia Bonus: Whose slogan was it really?</h4>			
			<PropControl path={tpath} prop='brand' />
			<Button onClick={e => game.playerState[pid].triviaGuess = triviaGuess||'pass'}>{triviaGuess? 'Enter':'Pass'}</Button>
		</div>);
};

const DoneStage = ({game,pid,isClient}) => {
	if (game.roundStage !== 'done') return null;
	return (<div>
		<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
		<Card body color='success' ><h3>{game.winningCard}</h3></Card>

		The slogan belongs to {AdCardsGame.brandForSlogan(game.winningCard)}. It is used here without endorsement.
		
		<p>TODO show points</p>

		{isClient? <Button color='success' onClick={e => AdCardsGame.newRound(game)}>New Round</Button> : null}
	</div>);
};

const AdvertiserView = ({game,member,pid}) => {
	const rstage = game.roundStage;
	let picked = game.playerState && game.playerState[pid] && game.playerState[pid].picked;

	return (<>
		<h4 className={rstage!=='brief'? 'd-none' : null}>
			Ask the Client about the product			
		</h4>

		<div className={rstage!=='create'? 'd-none' : null}>
			<h4>Pick your best slogan for</h4>
			<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
			<YourHand member={member} game={game} pid={pid} />
		</div>

		<div className={rstage!=='pitch'? 'd-none' : null}>
			<h4>Pitch It!</h4>
			<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
			<Card body color='success' ><h3>{picked}</h3></Card>
		</div>	

		<div className={rstage!=='pick'? 'd-none' : null}>
			<h4>The Client is deciding...</h4>
			<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
			<Card body color='success' >
				<h3 className='text-muted'>{picked}</h3>
			</Card>			
		</div>
		
	</>);
};


const YourHand = ({member, game, pid}) => {
	const hand = AdCardsGame.getHand(game, pid);
	let picked = game.playerState[pid] && game.playerState[pid].picked;
	if ( ! picked) member.answer = false;
	const pickCard = card => {
		game.playerState[pid].picked = card;
		member.answer = true;
	};
	return (<Row>
		{hand.map((card, i) => 
			<Col key={i} className='pt-5'>
				<Card body style={{cursor:"pointer"}} 
					className={space('playing-card', picked===card && 'card-picked')} 
					color='success' 
					onClick={e => pickCard(card)} >
					<h3>{card}</h3>
				</Card>
			</Col>
		)}
	</Row>);
};

// copy pasta code :(
const ClientChoiceHand = ({hand, member, game, pid}) => {
	let picked = game.playerState[pid].picked;
	if ( ! picked) member.answer = false;
	const pickCard = card => {
		game.winningCard = card;		
		member.answer = true;
		AdCardsGame.setRoundStage(game, 'trivia');
	};
	return (<Row>
		{hand.map((card, i) => 
			<Col key={i}>
				<Card body style={{cursor:"pointer"}} className={game.winningCard===card? 'mt-n5' : null} color='success' 
					onClick={e => pickCard(card)} ><h3>{card}</h3>
				</Card>
			</Col>
		)}
	</Row>);
};

export default AdCardsPage;
