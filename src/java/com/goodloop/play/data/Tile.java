package com.goodloop.play.data;

public class Tile extends Sprite {

	public Tile(int col, int row) {
		id = "t"+col+"_"+row;
		int r = (row % 12) + 1;
		int c = (col % 12) + 1;
		texture="celiana-tileA2/row-"+r+"-column-"+c+".png";
		width=32;
		height=32;
		x = vec(col*width,row*height);
	}
	
}
