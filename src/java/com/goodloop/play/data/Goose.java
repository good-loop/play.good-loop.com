package com.goodloop.play.data;

public class Goose extends Sprite {

	public Goose() {
		id="goose";
		x = vec(0,0);
		dx = vec(1,2);
		width=20;
		height=20;
	}

	
	@Override
	public void onTick(double elapsedSecs) {
		super.onTick(elapsedSecs);		
	}
	
}
