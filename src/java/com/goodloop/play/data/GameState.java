package com.goodloop.play.data;

import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import com.winterwell.utils.time.StopWatch;
import com.winterwell.utils.time.Time;

public class GameState {

	StopWatch ticker = new StopWatch();
	List<Sprite> sprites = new ArrayList();
	Sprite[][] tiles = new Sprite[10][10];
	
	public GameState() {
		sprites.add(new Goose());
		sprites.add(new Dragon());
		for(int x=0; x<5; x++) {
			for(int y=0; y<5; y++) {
				tiles[x][y] = new Tile(x,y);
			}
		}
		
		timer.schedule(new TimerTask() {
			@Override
			public void run() {
				onTick();
			}
		}, 100, 100);
	}
	
	static Timer timer = new Timer();
	
	long lastTime = 0;
	
	void onTick() {
		long time = ticker.getTime();
		double esecs = (time - lastTime)/1000.0;
		lastTime = time;
		for(Sprite sprite : sprites) {
			sprite.onTick(esecs);
		}
	}
}
