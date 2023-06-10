package com.goodloop.play.data;

public class Sprite {


	public static double[] vec(int x, int y) {
		return new double[] {x,y};
	}
	
	String id;
	
	double[] x;
	double[] dx;
	double width;
	double height;

	
	public void onTick(double elapsedSecs) {
		if (x != null && dx != null) {
			x[0] += dx[0]*elapsedSecs;
			x[1] += dx[1]*elapsedSecs;
		}
	}
}
