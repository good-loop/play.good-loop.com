/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import _ from 'lodash';
import DataStore, { getValue, setValue } from '../base/plumbing/DataStore';
import C from '../C';
import DataClass, { nonce } from '../base/data/DataClass';
import { randomPick, asNum } from '../base/utils/miscutils';

class AdCardsGame extends DataClass {

	/** @type {string} brief|create|pitch|pick|winner|trivia|done */
	roundStage;

	/** @type {string[]} */
	playerIds;

	/** @type {string[]} */
	slogans;

	/** playerId -> their state */
	playerState;

	/** @type {string[]} */
	products;

	constructor(base) {
		super(base);
		Object.assign(this, base);
		delete this.status;
	}

}
DataClass.register(AdCardsGame, "AdCardsGame");

AdCardsGame.setRoundStage = (game, newStage) => {
	console.log("set roundStage "+newStage);
	game.roundStage = newStage;
	// TODO reset answer flags

	// update (but not a nested update)
	_.defer(AdCardsGame.update);
};

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
	let j, x, i;
	for (i = a.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = a[i];
		a[i] = a[j];
		a[j] = x;
	}
	return a;
}

let HAND_SIZE = 6;

// TODO fetch card data
DataStore.fetch(['misc', 'ads.tsv'], () => {
	const ptsv = fetch("/data/Ads-Without-Humanity.tsv");
	return ptsv
		.then(res0 => res0.text()) // TODO support in JSend
		.then(res => {
			// console.warn(res);
			let rows = res.split("\n");
			AdCardsGame.ALL_PRODUCTS = [];
			AdCardsGame.ALL_SLOGANS = [];
			AdCardsGame.BRAND_FOR_SLOGAN = {};
			rows.forEach(rs => {
				let row = rs.split("\t");
				if (row[0] && row[0] !== 'Products') AdCardsGame.ALL_PRODUCTS.push(row[0]);
				if (row[2] && row[2] !== 'Slogan') {
					AdCardsGame.ALL_SLOGANS.push(row[2]);
					if (row[1]) {
						AdCardsGame.BRAND_FOR_SLOGAN[row[2]] = row[1];
					}
				}
			});
		});
});

/**
 * Update the local view
 */
AdCardsGame.update = () => {
	DataStore.update();
};

AdCardsGame.setup = game => {
	// options
	game.options = { showCards: true };
	game.slogans = AdCardsGame.ALL_SLOGANS.slice(); // safety copy
	game.products = AdCardsGame.ALL_PRODUCTS.slice();
	// blank player state	
	const n = game.playerIds.length;
	game.playerState = {};
	game.playerIds.forEach(playerId => {
		game.playerState[playerId] = { hand: [], score: randomPick(["seasonal lull", "just warming up", "um...", "there's some great stuff in the pipeline"]) };
	});
	// deal slogan cards
	shuffle(game.slogans);
	shuffle(game.products);
	game.sloganIndex = 0;
	game.productIndex = 0;
	for (let i = 0; i < HAND_SIZE; i++) {
		for (let j = 0; j < n; j++) {
			dealCardTo(game, game.playerIds[j]);
		}
	}

	// whos the first client?
	game.client = randomPick(game.playerIds);
	AdCardsGame.newRound(game);
};

/**
 * 
 * @param {AdCardsGame} game 
 * @param {string} pid 
 * @param {number} dscore increase the score by this
 * @returns {number} new score
 */
AdCardsGame.addScore = (game, pid, dscore) => {
	const pstate = game.playerState[pid];
	// string = 0	
	let scr = pstate.score || 0;
	if (_.isString(scr) && ! asNum(scr)) { // paranoia re numbers getting accidentally converted to strings
		scr = 0;	
	}
	pstate.score = scr + dscore;
	return pstate.score;
};
AdCardsGame.getScore = (game, pid) => {
	const pstate = game.playerState[pid];	
	return pstate.score || 0;
};

AdCardsGame.brandForSlogan = slogan => {
	return AdCardsGame.BRAND_FOR_SLOGAN[slogan];
};

const dealCardTo = (game, pid) => {
	let phand = AdCardsGame.getHand(game, pid);
	let card = game.slogans[game.sloganIndex % game.slogans.length];
	game.sloganIndex++;
	phand.push(card);
	console.log("	deal "+card+" to "+pid);
};

AdCardsGame.newRound = (game) => {
	game.round = (game.round || 0) + 1;
	AdCardsGame.setRoundStage(game, 'brief');
	// false out most state, but not score or hand
	game.waitMsg = false;	
	game.winningCard = false;
	game.winner = false;
	game.triviaGuess = false;
	// client
	let cid = game.playerIds.indexOf(game.client);
	cid++;
	game.client = game.playerIds[cid % game.playerIds.length];
	// product
	game.product = game.products[game.productIndex % game.products.length];
	game.productIndex++;
	// remove played cards and clear picks
	game.playerIds.forEach(pid => {
		let pstate = game.playerState[pid];
		if ( ! pstate) { // paranoia / late joiner??
			pstate = {};
			game.playerState[pid] = pstate;
			console.error("No player state for "+pid+"? - making a blank one now");
		}
		pstate.hand = pstate.hand.filter(c => c !== pstate.picked);
		pstate.picked = false;
		pstate.triviaGuess = false;
	});
	// deal new cards
	game.playerIds.forEach(pid => {
		AdCardsGame.dealCardsTo(game, pid);
	});
};

AdCardsGame.dealCardsTo = (game, pid) => {
	let hand = AdCardsGame.getHand(game, pid);		
	let n = HAND_SIZE - hand.length;
	for(let i=0; i<n; i++) {
		dealCardTo(game, pid);
	}
};


AdCardsGame.pickedCards = (game) => {
	let picks = game.playerIds.map(pid => game.playerState[pid] && game.playerState[pid].picked);
	picks = picks.filter(p => p);
	return picks;
};

/**
 * 
 * @param {*} game 
 * @param {*} pid 
 * @returns {string[]} If you modify this, it changes the hand
 */
AdCardsGame.getHand = (game, pid) => {
	if ( ! game.playerState || ! game.playerState[pid]) {
		console.warn("Game not setup?! playerState missing", JSON.stringify(game));
		return [];
	}
	if ( ! game.playerState[pid].hand) game.playerState[pid].hand = [];
	return game.playerState[pid].hand;
};

export default AdCardsGame;
