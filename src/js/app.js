import $ from 'jquery';
// Import root LESS file so webpack finds & renders it out to main.css
import '../style/main.less';
import GameLoop from './plumbing/GameLoop';

// global jquery for You-Again
window.$ = $;

// Game Loop
function onTick(tick) {
    console.warn("onTick", this, tick);
}
const gameLoop = new GameLoop({onTick});
window.gameLoop = gameLoop;
