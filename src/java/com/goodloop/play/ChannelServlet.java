package com.goodloop.play;


import com.winterwell.depot.merge.Merger;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.time.TUnit;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.web.SimpleJson;
import com.winterwell.utils.web.WebUtils2;
import com.winterwell.web.ajax.JSend;
import com.winterwell.web.ajax.JThing;
import com.winterwell.web.app.CrudServlet;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

import org.eclipse.jetty.util.ajax.JSON;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
/**
 * TODO poor-mans web sockets
 * @author daniel
 * @testedby ChannelServletTest
 */
public class ChannelServlet implements IServlet {


	static Cache<String,Channel> channels = CacheBuilder.newBuilder()
				.expireAfterAccess(10, TimeUnit.MINUTES).build();
	
	@Override
	public void process(WebRequest state) throws Exception {
		String schannel = state.getSlugBits(1);		
		if ("_list".equals(schannel)) {
			doList(state);
			return;
		}
		
		Channel channel = channels.getIfPresent(schannel);
		if (channel==null) {
			channel = new Channel(schannel);
			channels.put(schannel, channel);
		}
		
		// set state?
		String room = state.get("room");
		String diff = state.get("diff");
		if (diff!=null) {
			Object jdiff = WebUtils2.parseJSON(diff);
			List<Map> diffs = Containers.asList(jdiff);
			channel.room = applyDiff(channel.room, diffs);
		} else if (room != null) {
			Map jroom = (Map) WebUtils2.parseJSON(room);
			channel.room = merge(channel.room, jroom);
		}
		String peerId = state.get("peerId");
		if (peerId !=null) {
			Map members = SimpleJson.getCreate(channel.room, "members");
			Map peer = SimpleJson.getCreate(members, peerId);
			peer.put("connection", new Time()); 
			// time out
			Time old = new Time().minus(10, TUnit.SECOND);
			Collection<Map> peers = members.values();
			for (Map user : peers) {
				Object conn = user.get("connection");
				System.out.println(conn);
				if (conn instanceof Time) {
					if (((Time)conn).isBefore(old)) {
						user.put("connection", false);
					}
				}
			}
		}
		
		JSend jsend = new JSend();
		JThing data = new JThing(channel);
		jsend.setData(data);
		jsend.send(state);
		
	}

	private void doList(WebRequest state) {
		JSend jsend = new JSend();		
		Collection<Channel> cs = channels.asMap().values();		
		jsend.setData(new JThing(cs));
		jsend.send(state);
	}

	/**
	 * 
	 * @param room
	 * @param diffs Each diff is {op:replace, path:/foo/bar, value:v}
	 * TODO other ops 
	 * @return
	 */
	Map applyDiff(Map room, List<Map> diffs) {			
		if (diffs.isEmpty()) {
			return room;
		}
		for (Map diff : diffs) {
			String op = (String) diff.get("op"); // replace
			String path = (String) diff.get("path");
			Object value = diff.get("value");
			// NB: drop the leading / on path
			String[] bits = path.substring(1).split("/");
			SimpleJson.set(room, value, bits);
		}
		return room;
	}

	static Merger merger = new Merger();
	
	private Map merge(Map room, Map jroom) {
		Map merged = (Map) merger.doMerge(null, room, jroom);
		return merged;
	}

}
