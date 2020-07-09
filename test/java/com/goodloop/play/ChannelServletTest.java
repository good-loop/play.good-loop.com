package com.goodloop.play;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.goodloop.play.ChannelServlet;
import com.winterwell.utils.containers.ArrayMap;

public class ChannelServletTest {

	@Test
	public void testApplyDiff() {
		ChannelServlet cs = new ChannelServlet();
		Map room = new ArrayMap("hand", new ArrayList());
		List<Map> diffs = Arrays.asList(
			new ArrayMap("op", "replace",
					"path", "/hand/0",
					"value", "ace")
		);
		cs.applyDiff(room, diffs);
		assert room.toString().equals("{hand=[ace]}") : room.toString();
	}
	
	@Test
	public void testApplyDiffNeedsPadding() {
		ChannelServlet cs = new ChannelServlet();
		Map room = new ArrayMap("hand", new ArrayList());
		List<Map> diffs = Arrays.asList(
			new ArrayMap("op", "replace",
					"path", "/hand/2",
					"value", "ace")
		);
		cs.applyDiff(room, diffs);
		assert room.toString().equals("{hand=[null, null, ace]}") : room.toString();
	}

}
