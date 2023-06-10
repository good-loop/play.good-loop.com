package com.goodloop.play.data;

import java.util.ArrayList;
import java.util.List;

public class GameState {

	List<Sprite> sprites = new ArrayList();
	List<Sprite> tiles = new ArrayList();
	
	public GameState() {
		// TODO Auto-generated constructor stub
		sprites.add(new Goose());
	}
}
