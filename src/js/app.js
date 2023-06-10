import $ from 'jquery';
// Import root LESS file so webpack finds & renders it out to main.css
import '../style/main.less';
import * as PIXI from 'pixi.js';
import { assert } from './base/utils/assert';


// global jquery for You-Again
window.$ = $;
const game = {
  $sprite4id: {}
};
window.game = game;

function onTick(delta) {
  // Add the time to our total elapsed time
  game.elapsed += delta;
  // Update the sprite's X position based on the cosine of our elapsed time.  We divide
  // by 50 to slow the animation down a bit...
  game.$sprite4id["1"].x = 100.0 + Math.cos(game.elapsed/50.0) * 100.0;
  // console.log(game.$sprite4id);
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
  game.serverState.sprites.forEach(sprite => {
    assert(sprite.id, sprite);
    let $sprite = game.$sprite4id[sprite.id];
    if ( ! $sprite) {      
      $sprite = addSprite(game, sprite);
    }
    $sprite.x = sprite.x[0];
    $sprite.y = sprite.x[1];
  });
}

function addSprite(game, sprite) {
  let $sprite = 
    // = PIXI.Sprite.from('https://pixijs.io/guides/static/images/sample.png');
    PIXI.AnimatedSprite.fromFrames(game.animations["geese/row-1-column"]);

    // configure + start animation:
    $sprite.animationSpeed = 1 / 6;                     // 6 fps
    $sprite.play();
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
    document.querySelector('#messages').innerHTML = `<div>${msg.data}</div>`;
    getUpdate2(msg.data);
  };

  setInterval(getUpdate, 100);
}

function startGamePixi() {
  game.app = new PIXI.Application({ width: 640, height: 360 });
  game.animations = PIXI.Assets.cache.get("/build/img/spritesheet.json").data.animations;

  document.body.appendChild(game.app.view);
  addSprite(game, {id:"1"});
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

function startGame() {
  startGameWS();
  startGamePixi();
};


// setTimeout(startGame, 100); // allow document to load
