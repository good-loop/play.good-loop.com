//
// ========================================================================
// Copyright (c) Mort Bay Consulting Pty Ltd and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// https://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
// which is available at https://www.apache.org/licenses/LICENSE-2.0.
//
// SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
// ========================================================================
//

package com.goodloop.play.websocket;

import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;

import org.eclipse.jetty.util.ajax.JSON;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.StatusCode;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;

import com.goodloop.play.data.GameState;
import com.winterwell.gson.Gson;
import com.winterwell.utils.log.Log;

public class EventEndpoint extends WebSocketAdapter
{
//    private static final Logger LOG = LoggerFactory.getLogger(EventEndpoint.class);
    private final CountDownLatch closureLatch = new CountDownLatch(1);

    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);
        Log.d("Endpoint connected: {}", sess);
    }

    
    GameState gameState = new GameState();
    
    @Override
    public void onWebSocketText(String message)
    {
        super.onWebSocketText(message);
        Log.d("Received TEXT message: {}", message);
        String json = Gson.toJSON(gameState);
        try {
			getRemote().sendString(json);
		} catch (IOException e) {
			Log.e(e);
		}
        
        if (message.toLowerCase(Locale.US).contains("bye"))
        {
            getSession().close(StatusCode.NORMAL, "Thanks");
        }
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason)
    {
        super.onWebSocketClose(statusCode, reason);
        Log.d("Socket Closed: "+statusCode+reason);
        closureLatch.countDown();
    }

    @Override
    public void onWebSocketError(Throwable cause)
    {
        super.onWebSocketError(cause);
        cause.printStackTrace(System.err);
    }

    public void awaitClosure() throws InterruptedException
    {
        Log.d("Awaiting closure from remote");
        closureLatch.await();
    }
}

