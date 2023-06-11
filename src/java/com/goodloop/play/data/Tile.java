package com.goodloop.play.data;

public class Tile extends Sprite {

	public Tile(int col, int row) {
		texture="celiana_tileA2/row-"+row+"-column-"+col;
		width=48;
		height=48;
		x = vec(col*width,row*height);
	}
	
}
