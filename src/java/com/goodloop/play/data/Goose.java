package com.goodloop.play.data;

import com.winterwell.utils.Utils;

public class Goose extends Sprite {

	public Goose() {
		texture="geese/row-2-column";
		x = vec(0,0);
		dx = vec(4,2);
		width=20;
		height=20;
	}

	
	@Override
	public void onTick(double elapsedSecs) {
		super.onTick(elapsedSecs);		
	}
	
}
