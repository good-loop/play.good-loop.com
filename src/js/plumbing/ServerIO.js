/** 
 * Wrapper for server calls.
 *
 */
import $ from 'jquery';
import {SJTest, assert, assMatch} from 'sjtest';
import C from '../C.js';

import Login from 'you-again';

// Try to avoid using this for modularity!
import DataStore from '../base/plumbing/DataStore';
import Messaging, {notifyUser} from '../base/plumbing/Messaging';

import ServerIO from '../base/plumbing/ServerIOBase';
export default ServerIO;

/** dataspace = data-controller = (usually) app
 * This is the dataspace used in unit.js for reporting events */
ServerIO.dataspace = 'gl';

ServerIO.APIBASE = 'https://play.good-loop.com';
ServerIO.CHANNEL_ENDPOINT = ServerIO.APIBASE+'/channel';

ServerIO.PROFILER_ENDPOINT = `${C.HTTPS}://${C.SERVER_TYPE}profiler.good-loop.com`;
// ServerIO.PROFILER_ENDPOINT = 'https://testprofiler.good-loop.com';
// ServerIO.PROFILER_ENDPOINT = 'https://profiler.good-loop.com';

// /**
//  * My Loop has no backend, so use profiler
//  */
// ServerIO.LOGENDPOINT = ServerIO.PROFILER_ENDPOINT + '/log';

ServerIO.checkBase();

