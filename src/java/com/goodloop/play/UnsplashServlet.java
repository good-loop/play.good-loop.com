package com.goodloop.play;

import java.util.List;
import java.util.Map;

import org.eclipse.jetty.util.ajax.JSON;

import com.winterwell.utils.Dep;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.web.SimpleJson;
import com.winterwell.web.FakeBrowser;
import com.winterwell.web.ajax.JSend;
import com.winterwell.web.app.CommonFields;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;

public class UnsplashServlet implements IServlet {

	@Override
	public void process(WebRequest state) throws Exception {
		String q = state.get(CommonFields.Q);
		List<Map> results = search(q);
		JSend js = new JSend(results);
		js.send(state);
	}
	
	

	public List<Map> search(String q) {
		UnsplashConfig config = Dep.get(UnsplashConfig.class);
		FakeBrowser fb = new FakeBrowser();
		fb.setRequestHeader("Authorization", "Client-ID "+config.accessKey);
		// color https://unsplash.com/documentation#search-photos
		String json = fb.getPage("https://api.unsplash.com/search/photos", new ArrayMap(
				"query",q, 
				"content_filter", "high"
				));
		Map jobj = (Map) JSON.parse(json);
		List<Map> results = SimpleJson.getList(jobj, "results");
		return results;
	}

}
