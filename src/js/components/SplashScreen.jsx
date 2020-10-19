/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React, {  } from 'react';
import _ from 'lodash';
import { Alert, Button, Card, CardTitle, Col, Container, Row } from 'reactstrap';
import Command, { doq } from '../data/Command';
import BG from '../base/components/BG'
import Cookies from 'js-cookie';
import Misc from '../base/components/Misc';
import { isMobile } from '../base/utils/miscutils';
// import svg from '../img/angry-robot.svg';


import { useHowl, Play } from 'rehowl'
import DataStore from '../base/plumbing/DataStore';

  
const SplashScreen = ({game}) => {	
	window.document.title = "PA to Evil";
	let silent = DataStore.getValue('misc','silent') || false;
	let snd = ! silent;
	const { howl, state } = useHowl({
		src: '/sound/sb_marchofmidnight.mp3'
	  });
  
	return <div id='SplashScreen'>
		{snd && <Play howl={howl} volume={0.7} />}
		<BG src='/img/bg/james_vaugn_x-ray_delta_one_flickr_4970199230_e4e9de6a7a_c.jpg' fullscreen opacity={80} />
		<h1><span className='caps'>PA</span> to <span className='caps'>E</span>vil</h1>
		
		<Container>
			{isMobile() && <Alert color='warning'>Sorry - not ready for mobile yet!</Alert>}
			<Row>
				<Col>
				{game && game.prevDate && <LastScore game={game} />}
				<HighScore game={game} />
				</Col>
				<Col className='newspaper'>
					<Card body className='courier'>
						<CardTitle><h3>Position Vacant</h3></CardTitle>
						<p>
							<b>Personal assistant to Dr Evilstein.</b> Taking over the world is hard work. Manage Dr Evilstein's busy calendar.
						</p>
						<Button color='primary' size='lg' onClick={() => doq(new Command("game","screen"))}>Play!</Button>
					</Card>
					<div className='w-100 mt-2'>
						<center><Button className='btn-circle' size='lg' color='info' onClick={e => DataStore.setValue(['misc','silent'], ! silent)} active={ ! silent} >{silent? "🔇" : "🔊"}</Button></center>
					</div>
				</Col>
			</Row>
			<div id='about'>
				&copy; Daniel Winterstein 2020, with code from <a href='https://good-loop.com' target="_blank">Good-Loop</a> and
				many other open-source heroes (see <a href='https://github.com/good-loop/play.good-loop.com' target="_blank">source code</a> for details).
				Images from creative commons stars Benson Kua, James Vaugn, plus <a href='https://pixton.com' target="_blank">Pixton Edu</a> and Pixabay. 
				Music (cc) <a href='https://www.scottbuckley.com.au/' target='_blank'>Scott Buckley</a>.
			</div>
		</Container>
		
	</div>;
};

const LastScore = ({game}) => {
	if ( ! game || ! game.prevScore) return null;
	return <div id='LastScore'>
		<h3>Survived to: {Misc.dateStr(game.prevDate)}</h3>
		<h3>Score: {""+game.prevScore}</h3>
	</div>;
};

const HighScore = ({game={}}) => {
	let highScore = Cookies.get("hiscore");
	let highScoreDate = Cookies.get("hiscoredate");
	if ( ! highScore) {
		if ( ! game.prevScore) return null;
		highScore = game.prevScore;
		highScoreDate = Misc.dateStr(game.prevDate);
		game.isHighScore = true;
	}
	if (game.prevScore > highScore) {
		game.isHighScore = true;
		highScore = game.prevScore;
		highScoreDate = Misc.dateStr(game.prevDate);
	}
	if (game.isHighScore) {
		Cookies.set("hiscore", highScore);
		Cookies.set("hiscoredate", highScoreDate);
	}
	// TODO cookie get
	return <div id='hiscore'>
		<div className='gravetext'>
		<h2>{game.isHighScore && "NEW"} High Score</h2>		
		<h2>{highScore}</h2>
		<h2>{highScoreDate}</h2>
		</div>
	</div>;
};

export default SplashScreen;
