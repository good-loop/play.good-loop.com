package com.goodloop.play;

import com.winterwell.utils.Proc;
import com.winterwell.utils.Utils;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.time.Dt;
import com.winterwell.utils.time.TUnit;

public class MusicalBumps {

	public static void main(String[] args) {		
		while(true) {
			double dt = 5000 + Utils.getRandom().nextDouble()*TUnit.MINUTE.millisecs;
			Utils.sleep((long) dt);
			Proc proc = null;
			try {
				proc = new Proc("amixer set Master 0%");
				proc.start();
				proc.waitFor(new Dt(5, TUnit.SECOND));
				proc.close();
				
				Utils.sleep(7000);

				proc = new Proc("amixer set Master 100%");
				proc.start();
				proc.waitFor(new Dt(5, TUnit.SECOND));
				
			} catch(Throwable ex) {
				FileUtils.close(proc);
				throw Utils.runtime(ex);
			}
		}
	}
}
