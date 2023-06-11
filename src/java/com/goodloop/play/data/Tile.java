package com.goodloop.play.data;

public class Tile extends Sprite {

	public Tile(int col, int row) {
		id = "t"+col+"_"+row;
		texture="celiana-tileA2/row-"+(row+1)+"-column-"+(col+1)+".png";
		width=32;
		height=32;
		x = vec(col*width,row*height);
	}
	
}
