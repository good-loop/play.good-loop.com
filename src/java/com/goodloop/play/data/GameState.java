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
	List<Sprite> tiles = new ArrayList();
	
	public GameState() {
		// TODO Auto-generated constructor stub
		sprites.add(new Goose());
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
