/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React, { useState } from 'react';
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
import { stopEvent, copyTextToClipboard, randomPick, space, yessy } from '../base/utils/miscutils';
import Messaging from '../base/plumbing/Messaging';
import LobbyPage, { isInLobby, Peeps, Chatter, peepName } from './LobbyPage';
import AdCardsGame from './AdCardsGame';
import CSS from '../base/components/CSS';
import BG from '../base/components/BG';

// Game states: Name -> Create / Join -> Start -> Enter -> Deliver stories


const title = 'Ads Against Humanity';

const AdCardsPage = () => {
	let room = getCurrentRoom();
	if (!room || isInLobby(room)) {
		return (<LobbyPage title={title}>
			<Card body className='mt-2 linkcard'><div><a href='#rules/adcards'>Game Rules</a></div></Card>
		</LobbyPage>);
	}
	if (!room.game || !room.game.playerIds) {
		// only setup once (the host)
		if (!Room.isHost(room)) {
			return <Misc.Loading />;
		}
		room.game = new AdCardsGame();
		room.game.playerIds = Room.memberIds(room);
		AdCardsGame.setup(room.game);
	}
	// my id
	let pid = getPeerId();
	let game = room.game;
	const rStage = game.roundStage;
	let clientMember = Room.member(room, game.client);
	const isClient = pid === game.client;
	const member = Room.member(room, pid);

	// Wot no cards? Handle late joiners by dealing them in
	if (!yessy(AdCardsGame.getHand(game, pid))) {
		if (!game.playerIds.includes(pid)) {
			console.warn("Push into the room!", pid, game.playerIds);
			game.playerIds.push(pid);
		}
		if (!game.playerState[pid]) game.playerState[pid] = {};
		AdCardsGame.dealCardsTo(game, pid);
	}

	return (
		<BG src='https://www.nme.com/wp-content/uploads/2017/07/2017_MadMen_AMC_180717-696x442.jpg' size='unset' fullscreen>
			<Container fluid className='gameon'>
				<h3 className='game-title'>{title}</h3>
				<Row>
					<Col>
						<Card body color='dark'><h3>Client Rep: {clientMember.name || game.client} {isClient ? " - That's You!" : null}</h3></Card>

						<Card body className='board'>
							{rStage === 'winner' || rStage === 'done' || game.roundStage === 'trivia' ? null :
								(isClient ? <ClientView game={game} member={member} pid={pid} />
									: <AdvertiserView game={game} member={member} pid={pid} />)
							}

							<WinnerStage room={room} game={game} pid={pid} isClient={isClient} />
							<TriviaStage game={game} pid={pid} isClient={isClient} />
							<DoneStage room={room} game={game} pid={pid} isClient={isClient} />
						</Card>
					</Col>
					<Col>
						<Peeps room={room} />
						<Chatter room={room} className='mt-2' />
					</Col>
				</Row>
				<div>Room: {room.id}, Host: {room.oid}, Stage: {game.roundStage}</div>
			</Container>
		</BG>);
};

const WAIT_MSGS = [
	"Listen! That gurgling is the sound of creative juices flowing. Definitely not gin on a phone call.",
	"With passion and energy, the creatives set to work...",
];
const WAIT_MSGS_CLIENT = [
	"Waiting for the client... Or give them a call? Is 5 reminders a day too much?",
	"The client is contemplating their strategy. Possibly on the golf course.",
];


const ClientView = ({ game, member, pid }) => {
	const pickedCards = AdCardsGame.pickedCards(game);
	const allPicked = pickedCards.length >= game.playerIds.length - 1;
	if (game.roundStage === 'create' && allPicked) AdCardsGame.setRoundStage(game, 'pitch');

	const rstage = game.roundStage;

	return (<>
		{rstage === 'brief' ? <p>Congratulations! You have just been made Chief Marketing Officer for</p> : null}

		<Card body color='light'><h3>ACME {game.product}</h3></Card>

		{rstage === 'brief' ? <>
			<p>Tell the Advertising Execs what the product is. Then click the button below.</p>
			<center className={rstage !== 'brief' ? 'd-none' : null}>
				<Button color='primary' onClick={e => AdCardsGame.setRoundStage(game, 'create')}>Let Them Get Creative</Button>
			</center>
		</> : null}

		{rstage === 'create' ? <p>Waiting for the Advertising Execs... <WaitMsg advertisers /></p> : null}

		{rstage === 'pitch' ? <>
			<p>The pitches are in! Read aloud the slogan pitches:</p>
			{pickedCards.map(pc => <Card key={pc} body className='mb-1'><p>ACME {game.product} - {pc}</p></Card>)}
			<center><Button color='primary' onClick={e => AdCardsGame.setRoundStage(game, 'pick')}>Choose the Winner...</Button></center>
		</> : null}

		{rstage === 'pick' ? <>
			<p>Pick a winning slogan</p>
			<ClientChoiceHand game={game} member={member} pid={pid} hand={pickedCards} />
		</> : null}

	</>);
};


const WinnerStage = ({ room, game, pid, isClient }) => {
	if (game.roundStage !== 'winner') return null;
	if (!game.winner) {
		console.error("No winner?!", game);
	}
	return (<>
		<h4>The winning slogan is: </h4>
		<Card body color='dark'><h3>ACME {game.product}</h3></Card>
		<Card body><h3>{game.winningCard}</h3></Card>

		<h4 className='mt-1'>
			By {peepName(room, game.winner)}
			{game.winner === pid ? <> - <span className='text-success'>That's You!</span></> : null}
		</h4>

		<center>{isClient ? <Button color='primary' onClick={e => AdCardsGame.setRoundStage(game, 'trivia')}>Next</Button> : "Waiting for the client..."}</center>
	</>);
};

const WaitMsg = ({ client }) => {
	let [waitMsg] = useState(randomPick(client ? WAIT_MSGS_CLIENT : WAIT_MSGS));
	return waitMsg;
}

const TriviaStage = ({ game, pid, isClient }) => {
	if (game.roundStage !== 'trivia') return null;
	const tpath = ['misc', 'trivia', game.winningCard];
	const triviaGuess = DataStore.getValue(tpath.concat('brand')) || game.playerState[pid].triviaGuess;
	const isGuessMade = !!game.playerState[pid].triviaGuess;
	let guesses = game.playerIds.map(p => game.playerState[p].triviaGuess).filter(g => g);
	const allGuessed = guesses.length >= game.playerIds.length;
	console.log(allGuessed, guesses, isGuessMade, triviaGuess);
	if (allGuessed && isClient) {
		// who got it right?
		const answer = AdCardsGame.brandForSlogan(game.winningCard);
		game.playerIds.map(p => {
			let pguess = game.playerState[p].triviaGuess;
			if (triviaMatch(pguess, answer)) {
				const pscore = AdCardsGame.addScore(game, p, 50);
				console.log("Yay 50 trivia points for " + p + ": " + pguess + " score: " + pscore);
			} else {
				console.log("No trivia points for " + p + ": " + pguess);
			}
		});
		// move on
		AdCardsGame.setRoundStage(game, 'done');
	}

	const settriv = e => {
		stopEvent(e);
		game.playerState[pid].triviaGuess = triviaGuess || 'pass';
	}

	return (<>
		<h4>The winning slogan is: {game.winningCard}</h4>

		<h4>Trivia Bonus: Whose slogan was it really?</h4>
		<form className='flex-row' onSubmit={settriv} >
			<PropControl path={tpath} prop='brand' className='flex-grow mr-2' readOnly={isGuessMade} />
			<Button color='primary' className='pl-3 pr-3'
				onClick={settriv}
				disabled={isGuessMade}
			>{triviaGuess && triviaGuess !== 'pass' ? 'Enter' : 'Pass'}</Button>
		</form>
	</>);
};

/**
 * @param {string} guess 
 * @param {string} answer 
 */
const triviaMatch = (guess, answer) => {
	if (!guess || !answer) return;
	guess = toCanon(guess);
	if (!guess) return;
	// support alternative names, e.g. "coke / coca-cola" 
	let answers = answer.split("/").map(toCanon);
	if (answers.includes(guess)) {
		return true;
	}
	return false;
};

/**
 * e.g. "L'Oreal " -> "loreal"
 * @param {?string} s 
 */
const toCanon = s => {
	if (!s) return s;
	return s.toLowerCase().trim().replace(/\W/g, '');
}


const DoneStage = ({ room, game, pid, isClient }) => {
	if (game.roundStage !== 'done') return null;
	return (<>
		<Card body><p>ACME {game.product} - {game.winningCard}</p></Card>

		<p>The slogan really belongs to {AdCardsGame.brandForSlogan(game.winningCard)}.</p>

		<div>
			<h4>The Scores after Round {game.round}</h4>
			<table className='table table-striped'>
				<tbody>
					<tr><td>Player</td><td>Score</td></tr>
					{game.playerIds.map(p =>
						<tr key={p}><td>{peepName(room, p)}</td>
							<td>{AdCardsGame.getScore(game, p)}</td></tr>
					)}
				</tbody>
			</table>
		</div>

		{isClient ? <center><Button color='success' onClick={e => AdCardsGame.newRound(game)}>New Round</Button></center> : null}
	</>);
};

const AdvertiserView = ({ game, member, pid }) => {
	const rstage = game.roundStage;
	let picked = game.playerState && game.playerState[pid] && game.playerState[pid].picked;

	return (<>
		{rstage === 'brief' ? <>
			<p>Ask the Client about the product!</p>
			<p>Your slogan cards are:</p>
			<Hand hand={AdCardsGame.getHand(game, pid)} />
		</> : null}

		{rstage === 'create' ? <>
			<p>Pick your best slogan for</p>
			<Card body color='dark'><h3>ACME {game.product}</h3></Card>
			<YourHand member={member} game={game} pid={pid} />
		</> : null}

		{rstage === 'pitch' ? <>
			<p>Pitches!</p>
			<p>The Client Rep will read aloud all the slogan ideas.</p>
			<p>Your's is:</p>
			<Card body>ACME {game.product} - {picked}</Card>
		</> : null}

		{rstage === 'pick' ? <>
			<h4>The Client is deciding...</h4>
			<Card body color='dark'><h3 className='text-light mb-5'>ACME {game.product}</h3></Card>
			<Card body className='playing-card'>
				<h3 className='text-muted'>{picked}</h3>
			</Card>
			<WaitMsg client />
		</> : null}

	</>);
};


const YourHand = ({ member, game, pid }) => {
	const hand = AdCardsGame.getHand(game, pid);
	let picked = game.playerState[pid] && game.playerState[pid].picked;
	if (!picked) member.answer = false;
	const pickCard = card => {
		console.log("pickCard", card);
		game.playerState[pid].picked = card;
		member.answer = true;
	};
	return <Hand hand={hand} onPick={pickCard} picked={picked} />;
};

const Hand = ({ hand, picked, onPick }) => {
	return (<Grid sm='1' md='3' >
		{hand.map((card, i) =>
			<Cell md={4} sm={6} key={i} className='pt-5 pr-2'>
				<Card body style={{ cursor: onPick ? "pointer" : null, height: "100%" }}
					className={space('playing-card', picked === card && 'card-picked')}
					onClick={e => onPick && onPick(card)} >
					<h3>{card}</h3>
				</Card>
			</Cell>
		)}
	</Grid>);
};

const Grid = ({ children, sm, md }) => {
	return <div className={space('gridbox', sm && 'gridbox-sm-' + sm, md && 'gridbox-md-' + md)}>{children}</div>;
};
const Cell = ({ className, children }) => {
	return <div className={className}>{children}</div>
};

// copy pasta code :(
const ClientChoiceHand = ({ hand, member, game, pid }) => {
	let picked = game.playerState[pid].picked;
	if (!picked) member.answer = false;
	const pickCard = card => {
		game.winningCard = card;
		member.answer = true;
		// Who said it?
		let winner = Object.keys(game.playerState).find(wpid => game.playerState[wpid].picked === game.winningCard);
		if (!winner) console.error("No winner?!", card, game);
		game.winner = winner;
		AdCardsGame.addScore(game, winner, 100);
		AdCardsGame.setRoundStage(game, 'winner');
	};
	return <Hand hand={hand} picked={game.winningCard} onPick={pickCard} />;
};

// attrubtion TODO <a href="https://www.freepik.com/vectors/people">People vector created by pch.vector - www.freepik.com</a>
// <a href='https://www.freepik.com/vectors/business'>Business vector created by studiogstock - www.freepik.com</a>

export default AdCardsPage;
