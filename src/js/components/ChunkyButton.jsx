
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * A chunky corner button for one-button multi-player games
 * @param onClick {Function} ACtually uses onTouchStart as that gives
 * better arcade control.
 */
const ChunkyButton = ({player, onClick}) => {
	let players = Game.get().players;
	let pi = players.indexOf(player);
	let style = {
		position: 'fixed',
		zIndex:10000,
		width: '10vw',
		height: '10vw',
		borderRadius: '5vw',
	};
	let col;
	if (pi) {
		style.bottom = '-1vw';
		style.right = '-1vw';
		col='primary';
	} else {
		style.top = '-1vw';
		style.left = '-1vw';
		col='success';
	}
	return (
<button style={style} className={'btn btn-xlg btn-'+col} 
	onClick={e => console.log("onClick - no-op")}
	onTouchStart={e => {
		// console.log("onTouchStart",e);
		onClick(e);
	} }
	> {pi} </button>
	);
	// 	onTouchMove={e => console.log("onTouchMove",e)}
}

export default ChunkyButton;
