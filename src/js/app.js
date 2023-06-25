import $ from 'jquery';
// Import root LESS file so webpack finds & renders it out to main.css
import '../style/main.less';
import * as PIXI from 'pixi.js';
import { assert } from './base/utils/assert';
import Key from './rge/js/Key';
import { space } from './base/utils/miscutils';


// global jquery for You-Again
window.$ = $;
const game = {
  $sprite4id: {}
};
window.game = game;

function onTick(delta) {
  // Add the time to our total elapsed time
  game.elapsed += delta;
  // TODO if the server comms are going slow -- then update based on dx
}
 

// debounce
let getUpdateStatus = false;
function getUpdate() {
  if (getUpdateStatus) return;
  // fetch latest state
  game.ws.send("get");
  getUpdateStatus = true;
}
function getUpdate2(json) {
  getUpdateStatus = false; 
  let serverState = JSON.parse(json);
  game.serverState = serverState;

  // tiles
  let tw = game.serverState.tiles.length;
  let th = game.serverState.tiles[0].length;
  for(let tx=0; tx<tw; tx++) {
    for(let ty=0; ty<th; ty++) {
      let sprite = game.serverState.tiles[tx][ty];
      if ( ! sprite) continue;
      assert(sprite.id, sprite);
      let $sprite = game.$sprite4id[sprite.id];
      if ( ! $sprite) {      
        $sprite = addSprite(game, sprite);
      }
      $sprite.x = sprite.x[0];
      $sprite.y = sprite.x[1];  
    }
  }

  game.serverState.sprites.forEach(sprite => {
    assert(sprite.id, sprite);
    if ( ! sprite) return;
    let $sprite = game.$sprite4id[sprite.id];
    if ( ! $sprite) {      
      $sprite = addSprite(game, sprite);
    }
    $sprite.x = sprite.x[0];
    $sprite.y = sprite.x[1];
  });

  // HACK info
  let $arrows = document.getElementById("arrows");
  $arrows.innerHTML = space(keyLeft.isDown && "Left", keyRight.isDown && "Right");
}

function addSprite(game, sprite) {
  let textureName = sprite.texture;
  let $sprite;
  if (game.animations[textureName]) {   
    // = PIXI.Sprite.from('https://pixijs.io/guides/static/images/sample.png');   
    //  
    $sprite = PIXI.AnimatedSprite.fromFrames(game.animations[textureName]);
        // configure + start animation:
        $sprite.animationSpeed = 1/20;
        $sprite.play();
    
  } else if (game.spritesheetData.frames[textureName]) {
    // let frame = game.spritesheetData.frames[textureName];
    let texture = PIXI.Texture.from(textureName);
    $sprite = PIXI.Sprite.from(texture);
  } else {
    console.error(textureName);
    return;
  }
  game.app.stage.addChild($sprite);    
  game.$sprite4id[sprite.id] = $sprite;
  console.log("addSprite", sprite, $sprite);
  return $sprite;
}

function startGameWS() {
  game.ws = new WebSocket('ws://localhost:8080/events/');

  // // Browser WebSockets have slightly different syntax than `ws`.
  // // Instead of EventEmitter syntax `on('open')`, you assign a callback
  // // to the `onopen` property.
  // game.ws.onopen = function() {
  //   document.querySelector('#send').disabled = false;

  //   document.querySelector('#send').addEventListener('click', function() {
  //     game.ws.send(document.querySelector('#message').value);
  //   });
  // };

  game.ws.onmessage = function(msg) {    
    // document.querySelector('#messages').innerHTML = `<div>${msg.data}</div>`;
    getUpdate2(msg.data);
  };

  setInterval(getUpdate, 100);
}

function startGamePixi() {
  game.app = new PIXI.Application({ width: 1200, height: 500 });
  game.spritesheetData = PIXI.Assets.cache.get("/build/img/spritesheet.json").data;
  game.animations = game.spritesheetData.animations;

  document.body.appendChild(game.app.view);
  // addSprite(game, {id:"1"});
  // Add a variable to count up the seconds our demo has been running
  game.elapsed = 0.0;
  // Tell our application's ticker to run a new callback every frame, passing
  // in the amount of time that has passed since the last tick
  game.app.ticker.add(onTick);

  console.warn(game.animations, "animations");
}


PIXI.Assets.load([
  "/build/img/spritesheet.json"
]).then(() => {
  startGame();
});

/** @type{Key} */
let keyLeft, keyRight, ketUp, keyDown;

function startGameControls() {
  keyLeft = new Key("ArrowLeft");
  keyRight = new Key("ArrowRight");
  keyUp = new Key("ArrowUp");
  keyDown = new Key("ArrowDown");
}


function startGame() {
  startGameWS();
  startGamePixi();
  startGameControls();
};


// setTimeout(startGame, 100); // allow document to load
