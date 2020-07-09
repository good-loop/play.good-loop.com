package com.goodloop.play;

import static org.junit.Assert.*;

import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.goodloop.play.UnsplashConfig;
import com.goodloop.play.UnsplashServlet;
import com.winterwell.utils.io.ConfigFactory;

public class UnsplashServletTest {

	@Test
	public void testSearch() {
		UnsplashConfig uc = ConfigFactory.get().getConfig(UnsplashConfig.class);
		UnsplashServlet us = new UnsplashServlet();
		List<Map> hm = us.search("field");
		System.out.println(hm);
	}

}
