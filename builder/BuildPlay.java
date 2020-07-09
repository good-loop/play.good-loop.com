import java.io.File;
import java.util.List;

import org.junit.Test;

import com.winterwell.bob.BuildTask;
import com.winterwell.bob.tasks.MavenDependencyTask;
import com.winterwell.bob.wwjobs.BuildWinterwellProject;
import com.winterwell.utils.io.FileUtils;

public class BuildPlay extends BuildWinterwellProject {

	public BuildPlay() {
		super("play.good-loop.com");
	}

	@Override
	public List<BuildTask> getDependencies() {
		List<BuildTask> deps = super.getDependencies();
		MavenDependencyTask mdt = new MavenDependencyTask();
		mdt.addDependency("com.google.guava", "guava", "28.2-jre");
//		mdt.addDependency("org.eclipse.jetty.websocket:websocket-server:9.4.28.v20200408");
		deps.add(mdt);
		return deps;
	}
	
}
