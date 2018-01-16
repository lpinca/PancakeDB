/**
* PancakeDB - nodejs database software
* Copyright (C) 2018 LewisTehMinerz
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
* 
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const log = require('./log');
const chalk = require('chalk');
const PropertiesReader = require('properties-reader');
const config = PropertiesReader('PancakeDB.ini');
const password = config.get('Configuration.Password');
const sha512 = require('js-sha512');


var checkAuthenticator = function(passwordToCheck){
    let hasher = sha512.hmac(passwordToCheck);
    let actualHash = passwordHash.finalize('pancakedb');
    if actualHash.ToString('hex') === password {
        return true
    } else {
        return false
    }
};

var databaseManager = {
    databaseExists: (db) => {
        return db == "speedboat";
    },
    selectDatabase: (ws, db) => {
        if (ws.isAuthenticated) {
            if (databaseManager.databaseExists(db)) {
                ws.currentDatabase = db;
                ws.send('OK');
            } else {
                ws.send('INVALID_DB');
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
    }
};

/**
 * Handles WaffleDB WebSocket messages.
 * @param {WebsocketClient} ws The WebSocket client that sent the message.
 * @param {string} msg The message that the client sent.
 */
module.exports = function messageHandler(ws, msg) {
    let args = msg.split(' ');
    let cmd = args[0];
    args.shift();
    if (cmd == 'AUTH') {
        if (!ws.isAuthenticated) {
            if (checkAuthenticator(cmd)) {
                ws.isAuthenticated = true;
                ws.send('OK');
            } else {
                ws.send('AUTH_FAIL');
            }
        } else {
            ws.send('ALREADY_AUTHED');
        }
    } else if (cmd == 'DISCONNECT') {
        ws.close();
        log('Server', chalk.green, 'Connection closed to ' + req.connection.remoteAddress);
    } else if (cmd == 'DATABASE') {
        databaseManager.selectDatabase(ws, args[0]);
    } else if (cmd == 'INSERT') {
        
    }
}
