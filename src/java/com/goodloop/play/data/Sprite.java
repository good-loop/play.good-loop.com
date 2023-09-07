package com.goodloop.play.data;

import com.winterwell.utils.Utils;

public class Sprite {

	public Sprite() {
		id= getClass().getSimpleName()+"_"+Utils.getNonce();
	}

	public static double[] vec(double x, double y) {
		return new double[] {x,y};
	}
	
	String id;
	
	String texture;
	
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
