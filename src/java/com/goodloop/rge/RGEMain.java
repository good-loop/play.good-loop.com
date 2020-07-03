package com.goodloop.rge;
import com.winterwell.utils.io.ConfigFactory;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.log.LogConfig;
import com.winterwell.web.app.AMain;
import com.winterwell.web.app.JettyLauncher;
import com.winterwell.web.app.MasterServlet;

public class RGEMain extends AMain<RGEConfig> {

	public static void main(String[] args) {
		RGEMain m = new RGEMain();
		m.doMain(args);
	}
	
	@Override
	protected void init2(RGEConfig config) {
		super.init2(config);
		init3_gson();
		// unsplash
		UnsplashConfig us = ConfigFactory.get().getConfig(UnsplashConfig.class);		
	}
	
	public RGEMain() {
		super("rge", RGEConfig.class);
		// limit logs
		LogConfig lc = new LogConfig();
		lc.fileMaxSize = "10mb";
		lc.fileHistory = -1;
		Log.setConfig(lc);
	}
	
	@Override
	protected void addJettyServlets(JettyLauncher jl) {	
		super.addJettyServlets(jl);
		MasterServlet ms = jl.addMasterServlet();
//		ms.addServlet("stash", StashServlet.class);
		ms.addServlet("channel", ChannelServlet.class);
		ms.addServlet("unsplash", UnsplashServlet.class);
		
		// websocket
		// SEE https://github.com/jetty-project/embedded-jetty-websocket-examples/tree/master/native-jetty-websocket-example/src/main/java/org/eclipse/jetty/demo
		// OR https://stackoverflow.com/questions/42817476/how-can-i-add-a-websocketservlet-to-an-embedded-jetty-server-with-context-path
	}
	
}
