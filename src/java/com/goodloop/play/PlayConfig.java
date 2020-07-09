package com.goodloop.play;

import com.winterwell.web.app.ISiteConfig;

public class PlayConfig implements ISiteConfig {

	@Override
	public int getPort() {
		return 8328;
	}

}
