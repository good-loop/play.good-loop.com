/**
 * Base class for Games
 */
import pako from 'pako';
import DataStore from './base/plumbing/DataStore';
import DataClass, {getClass, nonce} from './base/data/DataClass';
import Sprite from './data/Sprite';
import Rect from './data/Rect';
import StopWatch from './StopWatch';
import {assert, assMatch} from 'sjtest';
import Grid from './data/Grid';
import Tile from './data/Tile';
import * as PIXI from 'pixi.js';
import { randomPick } from './base/utils/miscutils';
import Pixies, { containerFor, setPSpriteFor, getPSpriteFor } from './components/Pixies';
import ServerIO from './base/plumbing/ServerIOBase';
import Kind from './data/Kind';

class Game extends DataClass {

	id = nonce(4);
	
	/**
	 * String to Sprite
	 */
	sprites = {};

	/** @type {StopWatch}  */
	ticker = new StopWatch();

	constructor(base) {
		super(base);
		Object.assign(this, base);
	}

	/**
	 * @return {Game} game object -- never null even pre-init. Will create if unset.
	 */
	static get() {
		return DataStore.getValue('data', 'Game') || doReset();
	}

} // ./Game
DataClass.register(Game, 'Game');

/**
 * @returns {?Sprite}
 */
Game.getPlayer = () => {
	// TODO manage
	return Game.get().player;
};

/**
 * 
 * @param {Game} game 
 * @returns {!Object} item-name: number / details
 */
Game.getInventory = game => {
	if ( ! game) game = Game.get();
	if ( ! game.inventory) game.inventory = {};
	return game.inventory;
};

const doReset = () => {
	let g = new Game();
	DataStore.setValue(['data','Game'], g, false);	
	return g;
};

const doSave = game => {
	console.log("saving... "+game.id);
	let json = JSON.stringify(game);
	console.log("20k",json.substring(0,20000));
	console.warn("SAVE SIZE: "+(json.length/512)+"k");

	var binaryString = pako.deflate(json, { to: 'string' });
	let data = binaryString; // send a string as post body??
	console.warn("BINARY SAVE SIZE: "+(data.length/512)+"k");
// //
// // Here you can do base64 encode, make xhr requests and so on.
// //

	let pSave = ServerIO.post('https://calstat.good-loop.com/stash/game/'+game.id, {
		data,
		// contentType: 'application/json',
	});
	
	let gameIds = JSON.parse(window.localStorage.getItem("gameIds") || "[]");
	if ( ! gameIds.includes(game.id)) {
		gameIds.push(game.id);
		window.localStorage.setItem("gameIds", JSON.stringify(gameIds));
	}
	// can get too big
	// window.localStorage.setItem("game"+game.id, json);
	return pSave;
};

const doLoad = gameId => {
	console.log("loading... "+gameId);
	if ( ! gameId) {
		let gameIds = JSON.parse(window.localStorage.getItem("gameIds") || "[]");
		if ( ! gameIds || ! gameIds.length) return null;
		gameId = gameIds[gameIds.length-1];
	}
	let pLoad = ServerIO.load('https://calstat.good-loop.com/stash/game/'+gameId);
	pLoad.then((res) => {
		console.warn("Loaded",res);
		// var restored = JSON.parse(pako.inflate(binaryString, { to: 'string' }));
	});
};
window.doLoad = doLoad; // debug

Game.setAutoSave = onOff => {
	if ( ! onOff) {
		return;
	}
	let huh = setInterval(() => {
		doSave(Game.get());
	}, 20000); // 20 seconds
	console.warn("autosave", huh);
};

Game.init = () => {
	// game object, if not already made
	const game = Game.get();
	if (game.initFlag) return;
	game.initFlag = true;
	// tick
	game.ticker = new StopWatch();

	// setup
	Game.setup(game);

	// // update loop - use request ani frame
	let gameLoop = () => {
		if (game.isStopped) {
			return;
		}
		//Call this `gameLoop` function on the next screen refresh
		//(which happens 60 times per second)
		requestAnimationFrame(gameLoop);		
		Game.update(game);
	};	
	//Start the loop
	gameLoop();
};


/**
 * @param {?String[]} types
 * @param {?Number} limit in tiles eg 5. If set, ignore sprites further away than this
 * @returns {?Sprite}
 */
Game.getNearest = ({sprite, game, types, limit, tile=false, filter}) => {	
	let sprites = Object.values(game.sprites);
	let bigFilter = s => {
		// type filter
		if (types && ! types.includes(s.kind)) return false;
		// ad-hoc filter
		if (filter && ! filter(s)) return false;
		// No invisibles
		if (s.visible === false) return false;
		// no Tiles
		if ( ! tile && Tile.isa(s)) return false;
		// not self
		if (s === sprite) return false;
		return true;
	};
	sprites = sprites.filter(bigFilter);

	if (limit) {
		// in pixels
		const plimit = limit * Game.grid(game).tileWidth;
		const l2 = plimit*plimit;
		sprites = sprites.filter(s => dist2(sprite,s) <= l2);
	}
	// NB: assume using the top-left corner gives the same order as using sprite pivot points
	sprites.sort((a,b) => dist2(sprite, a) - dist2(sprite, b));
	return sprites[0]; // TODO sort and pick!
};


/**
 * @param {!String} kind
 * @returns {!Sprite[]}
 */
Game.getAllSprites = (kind) => {
	let game = Game.get();	
	let sprites = Object.values(game.sprites);
	sprites = sprites.filter(s => kind === s.kind);
	return sprites;
};

/**
 * xy distance squared
 * @param {!Sprite} s1 
 * @param {!Sprite} s2 
 */
const dist2 = (s1, s2) => (s1.x-s2.x)*(s1.x-s2.x) + (s1.y-s2.y)*(s1.y-s2.y);

/**
 * @param {Game} game
 * @returns {!Grid}
 */
Game.grid = game => {
	return Grid.get(); // just return the default
};

/**
 * @returns {{row:Number, column:Number}}
 */
Game.getTileInFront = (game, sprite) => {	
	// the sprite's tile
	let {row,column} = Game.getRowColumn(game,sprite);
	// the one in front
	if (sprite.dx) {
		if (sprite.dx>0) column++; else column--;	
	} else if (sprite.dy) {
		if (sprite.dy>0) row++; else row--;
	} else if (sprite.animate && sprite.animate.name) {
		const an = sprite.animate.name;
		switch(an) {
		case "left": column--; break;
		case "right": column++; break;
		case "up": row--; break;
		case "down": row++; break;			
		}
	}
	return {row, column};
};

/**
 * @param {!Game} game
 * @param {!Sprite} sprite
 * @returns {{row:Number, column:Number}}
 */
Game.getRowColumn = (game, sprite) => {	
	// the sprite's tile
	const half = 24; // hack to get pivot point
	let c = Math.floor((sprite.x + half) / 48);
	let r = Math.floor((sprite.y + 36) / 48); // hack plus a bit to the feet 
	return {row:r, column:c};
};

Game.getTile = ({game, row, column}) => {
	let tileName = "row"+row+"_col"+column;
	let tile = game.sprites[tileName];
	return tile;
};

/**
 * Easy way to make a sprite
 * @param kindName {!String} name of a KindOfCreature
 */
Game.make = (kindName, spriteSettings={}, container) => {
	const game = Game.get();
	const kind = Kind.getKind(kindName);
	if ( ! kind) {
		throw new Error("Cannot make "+kindName+" - kind unknown");
	}
	
	let variant = Math.floor(kind.sprites.length*Math.random());
	let base = kind.sprites[variant] || {}; // TODO store v instead so we can save / ship states?? 	
	const freshBase = Object.assign({}, base);
	let sprite = kind.bg? new Tile(freshBase) : new Sprite(freshBase);
	delete sprite.sprites; // keep our sprite a json blob - no circular refs
	sprite.kind = kindName;
	if (variant) sprite.variant = variant; // no need to store most 0s
	// sprite['@type'] = kind.bg? 'Tile' : 'Sprite';
	sprite.speed = kind.speed; // HACK

	if (kind.bg) {
		let {row, column} = spriteSettings;
		// NB: sets a row_col id
		Game.make2_Tile({game, row, column, tile:sprite});
	}

	// dont duplicate template stuff
	delete sprite.frames;
	delete sprite.animations;
	delete sprite.src;
	
	// special settings? often x and y
	if (spriteSettings) {
		sprite = Object.assign(sprite, spriteSettings);
	}
	if ( ! container) {
		container = kind.bg? containerFor.ground : containerFor.characters;
	}
	Game.make2_addSprite({game, sprite, container});
	return sprite;
};

Game.make2_Tile = ({game, row, column, tile}) => {
	Sprite.assIsa(tile);
	const grid = Game.grid(game);
	const tileWidth = grid.tileWidth;
	const tileHeight = grid.tileHeight;
	tile.x = column * tileWidth;
	tile.y = row * tileHeight;
	tile.width = tileWidth;
	tile.height = tileHeight;
	tile.name = "row"+row+"_col"+column;//deprecated
	tile.id = "row"+row+"_col"+column;	
	// remove any existing sprite
	let old = game.sprites[tile.id];
	if (old) {
		Game.removeSprite(game, old);
	}
};


/**
 * Add a sprite to game, plus make a Pixi sprite and add to container.
 * @param {?String} id a nonce will be made if blank. Cannot be a duplicate
 */
Game.make2_addSprite = ({game, sprite, id, container}) => {
	Game.assIsa(game);
	Sprite.assIsa(sprite);
	if (id) sprite.id = id;
	if ( ! sprite.id) sprite.id = sprite.kind+nonce();
		
	assert( ! game.sprites[sprite.id], "Duplicate sprite for "+sprite.id);
	game.sprites[sprite.id] = sprite;
	
	let psprite = new PIXI.Sprite();
	setPSpriteFor(sprite, psprite);

	Sprite.setPixiProps(sprite);

	// sprite parts?
	if (sprite.background && false) {
		let bgsprite = new PIXI.Sprite();	
		Sprite.setPixiProps(bgsprite);
		// TODO add to container
	}

	if ( ! container) container = containerFor.world;
	container.addChild(psprite);

	return sprite;
};

Game.removeSprite = (game, sprite) => {
	// console.log("removeSprite", sprite);
	Sprite.assIsa(sprite);
	delete game.sprites[sprite.id];
	// clean up Pixi
	const psprite = getPSpriteFor(sprite);
	if (psprite) {		
		if (psprite.parent) psprite.parent.removeChild(psprite);
		psprite.destroy({children:true});
		setPSpriteFor(sprite, null);
	}
};

window.Game = Game; //debug
export default Game;

export {
	dist2,
	doSave, doLoad, doReset
};
