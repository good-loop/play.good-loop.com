import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
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

const RulesPage = () => {
	return (
		<BG src='/img/lobby.jpg' fullscreen><Container><div className='p-4'>
			<Card body className='mt-3 rules'><CardTitle><h3>Ads Against Humanity: Game Rules</h3></CardTitle>
				<MDText source={`

Welcome to Asstchi & Asstchi!
The advertising agency that really believes in recycling.
We give clients the *best* ideas, with the serial numbers filed off.

#### How to Connect

The game is played online, via this website. You can use any device. 

One person creates a room - they're the Host. They share a 4 letter room code with the rest of the group, who use that to join the room.
There's a handy link which you can share e.g. via WhatsApp, which has the room code in. Or you can just type it in, it's only 4 letters.

Once everyone is in, the Host clicks start, and the game begins.

If you lose connection, reload. You may need to re-enter the 4-letter room code.

You can't change who is in the room mid-game -- if you need to, please create a fresh room.

#### How to Play

This game is similar to *Cards Against Humanity*, if a bit more safe-for-work. 
Note: This game is *not* made by or connected with *Cards Against Humanity*. 
It is an independent work of fun, provided for free by Good-Loop.

The goal is to have fun. There are also points; if you like things to have a point, this game has lots.

Each round, one player is assigned as the Client Rep. They run the round. Everyone else is an Advertising Exec, looking for their big break.

1. The Client Rep introduces the product, e.g. "ACME teaspoons".
2. The Advertising Execs have a set of slogan cards. They pick one to advertise the product.
3. The Client Rep reads out the slogans, then picks their favourite product/slogan combination.
4. Next is the trivia round: Who does the winning slogan really belong to? Everyone enters a guess, or passes.
5. The game keeps track of your points, and shows them at the end of each round.

That's it - Have fun!
		`} />
				<Button color='primary' onClick={() => window.history.back()}>&larr; back</Button>
			</Card></div>
		</Container></BG>
	);
};
export default RulesPage;
