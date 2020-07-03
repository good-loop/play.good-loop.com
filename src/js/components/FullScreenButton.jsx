import React from 'react';
import fscreen from 'fscreen';
import { Button } from 'reactstrap';

const isFull = false;

const fullscreenPlease = () => {
	if (fscreen.fullscreenEnabled) {
		console.log("Request Full Screen");
		fscreen.addEventListener('fullscreenchange', e => {
			console.warn("fscreen?", e);
		}, false);
		let bodyDiv = document.getElementsByTagName('body')[0];
		fscreen.requestFullscreen(bodyDiv);
	} else {
		console.log("No Full Screen");
	}
};

const FullScreenButton = () => {
	if ( ! fscreen.fullscreenEnabled) return null;
	if (isFull) {
		// TODO return shrink
	}
	// &#x1f5d6; max desktop window icon
	return (<div 
		style={{position:'fixed',bottom:'0.5vh',right:'1vw',zIndex:1000, color:'#ccc'}}
		onClick={fullscreenPlease}
	>&#x26f6;</div>);
};

export default FullScreenButton;
