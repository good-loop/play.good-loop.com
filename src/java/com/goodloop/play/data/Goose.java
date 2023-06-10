package com.goodloop.play.data;

public class Goose extends Sprite {

	public Goose() {
		id="goose";
		x = vec(0,0);
		dx = vec(1,0);
		width=20;
		height=20;
	}

	private double[] vec(int x, int y) {
		return new double[] {x,y};
	}
}
