/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Enum from 'easy-enums';
import _ from 'lodash';
import SJTest, { assert } from 'sjtest';
import Login from 'you-again';
import DataStore from '../base/plumbing/DataStore';
import { space, substr } from '../base/utils/miscutils';
import MDText from '../base/components/MDText';
import { Button } from 'reactstrap';

/**
 * regex for dialogue, e.g. `Mom: (happy) We're off!` or `Omega "Morphing Person": Welcome`
 * match = [all, person, label, emotion, said]
 */
const rSpeech = /^([a-zA-Z0-9 ]+)("[a-zA-Z0-9\- ]+")?: ?(\([a-z ]+\)|)(.+)/;

/**
 * 
 * @param {?Command} cmd {img, duration}
 */
const ChatLine = ({ cmd, line }) => {
	let m = splitLine(line);
	if (!m) {
		console.warn("ChatLine - no pattern match: " + line);
		return <div>{line}</div>;
	}
	let { who, label, emotion, said } = m;
	let whoCanon = who.toLowerCase().replaceAll(' ','-');
	// let character = CHARACTERS[whoCanon] || MONSTERS[whoCanon];
	let img = cmd && cmd.img;
	// if (character) {
	// 	if (emotion && character.emotion) img = character.emotion[emotion];
	// 	if ( ! img) img = character.src;
	// }
	// fallback
	if ( ! img) {
		img = '/img/person/' + space(who, emotion) + ".svg";
	}
	img = img.replaceAll(' ', '-').toLowerCase();
	// // HACK - track people you know
	// if (who===label && character) {
	// 	if ( ! Game.get().cast) Game.get().cast = {};
	// 	Game.get().cast[who] = true;
	// }
	// avoid any commands
	said = said.replaceAll(/{[^}]+}/g, '');

	// className="animate__animated animate__faster animate__slideInRight"
	return <div className="chatline">
		<div className="who">{label}</div>
		{img && img!=="none" && <img src={img} alt={label} />}
		<div className="said"><MDText source={said} /></div>
		{cmd && <Button color='primary' onClick={e => cmd.duration = 0}>&times;</Button>}
	</div>;
};

/**
 * 
 * @param {!string} line e.g. Lucifer "Charming Devil": (happy) Hello
 * @returns {?object} {who, label, emotion, said} or null label defaults to who (not null)
 * 
 * emotion is lowercase, no spaces - eg "vhappy"
 */
export const splitLine = line => {
	let m = line.match(rSpeech);
	if (!m) {
		return null;
	}
	let who = m[1].trim();
	let label = m[2] ? substr(m[2], 1, -1) : who; // pop quotes
	let emotion = m[3] ? substr(m[3], 1, -1) : null; // pop brackets
	// emotion: lower case, no spaces
	if (emotion) emotion = emotion.toLowerCase().replaceAll(/\s/g, "");
	let said = m[4].trim();
	return { who, label, emotion, said };
};


const ChatControls2 = ({ currentNode, storyTree }) => {
	let text = StoryTree.text(currentNode);
	if (!text) return "END OF STORY (TODO)";
	if (text[0] === "|") {
		const i = text.indexOf("| ");
		let thenbit = i > 0 ? text.substr(i + 1).trim() : "";
		let choicebit = i > 0 ? text.substr(0, i) : text;
		let choices = choicebit.split("|").filter(c => c);
		// bump right to avoid accidental next clicks
		return (<div className="ml-5">
			{choices.map((c,j) =>
				<Button size="lg" className={"ml-2 mr-2 mb-2 animate__animated animate__delay-"+j+"s animate__slideInUp"} color="primary" 
					onClick={e => doChoice({ currentNode, storyTree, c, thenbit })} key={c}>
					{c}
				</Button>
			)}
		</div>);
	}
	return <Button size="lg" color="primary" onClick={e => StoryTree.next(storyTree)} ><Emoji>✏️</Emoji> ... (space)</Button>;
};


export const Emoji = ({children}) => <span aria-label="emoji" role="img">{children}</span>;

const doChoice = ({ currentNode, storyTree, c, thenbit }) => {
	// TODO modify history not source
	currentNode.value.text = c;
	storyTree.lastChoice = c;
	// HACK add to inventory
	if (thenbit === ">> inventory") {
		const inventory = Game.getInventory(Game.get());
		inventory[c] = (inventory[c] || 0) + 1;
	}
	StoryTree.next(storyTree);
};

export const ChatControls = ({ currentNode, storyTree }) => {
	return (<><hr />
		<div className="control-zone"><ChatControls2 currentNode={currentNode} storyTree={storyTree} /></div>
	</>);
};

export default ChatLine;
