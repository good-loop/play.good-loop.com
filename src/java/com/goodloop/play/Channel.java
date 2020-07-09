package com.goodloop.play;

import java.util.HashMap;
import java.util.Map;

import com.winterwell.data.AThing;
import com.winterwell.utils.containers.ArrayMap;

public class Channel extends AThing {

	public Map room = new ArrayMap();

	public Channel(String schannel) {
		name = schannel;
	}

}
