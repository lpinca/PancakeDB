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
const ini = require('ini');
const fs = require('fs');
const config = ini.parse(fs.readFileSync('./PancakeDB.ini', 'utf-8'));
const password = config.Configuration.Password;
const sha512 = require('js-sha512');


var checkAuthenticator = function(passwordToCheck){
    let hasher = sha512.hmac.create('pancakedb');
    hasher.update(passwordToCheck);
    let actualHash = hasher.hex();
    return actualHash === password;
};

var databaseManager = {
    databaseExists: (db) => {
        return fs.existsSync(`./databases/${db}.json`);
    },
    tableExists: (db, table) => {
        if (databaseManager.databaseExists(db)) {
            let raw = fs.readFileSync(`./databases/${db}.json`, 'utf-8');
            let database = JSON.parse(raw);
            return database[table] != undefined;
        } else {
            return false;
        }
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
    },
    databaseSelected: (ws) => {
        return ws.currentDatabase != null;
    },
    deleteDatabase: (db) => {
        if (databaseManager.databaseExists(db)) {
            fs.unlinkSync(`./databases/${db}.json`);
            return true;
        } else {
            return false;
        }
    },
    deleteTable: (db, table) => {
        return true;
    },
    createDatabase: (db) => {
        if (!databaseManager.databaseExists(db)) {
            fs.writeFileSync(`./databases/${db}.json`, JSON.stringify({}));
            return true;
        } else {
            return false;
        }
    },
    createTable: (db, table) => {
        if (!databaseManager.tableExists(db, table)) {
            let raw = fs.readFileSync(`./databases/${db}.json`, 'utf-8');
            let database = JSON.parse(raw);
            database[table] = {};
            fs.writeFileSync(`./databases/${db}.json`, JSON.stringify(database));
            return true;
        } else {
            return false;
        }
    }
};

/**
 * Handles PancakeDB WebSocket messages.
 * @param {WebsocketClient} ws The WebSocket client that sent the message.
 * @param {string} msg The message that the client sent.
 */
module.exports = function messageHandler(ws, msg) {
    let args = msg.split(' ');
    let cmd = args[0];
    args.shift();
    if (cmd == 'AUTH') {
        if (!ws.isAuthenticated) {
            if (checkAuthenticator(args[0])) {
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
    } else if (cmd == 'DATABASE') {
        databaseManager.selectDatabase(ws, args[0]);
    } else if (cmd == 'INSERT') {
        
    } else if (cmd == 'CREATE') {
        if (ws.isAuthenticated) {
            if (args.length < 1) {
                ws.send('NOT_ENOUGH_ARGUMENTS');
            } else {
                if (args[0] == 'DATABASE') {
                    if (args[1] == undefined) {
                        ws.send('NOT_ENOUGH_ARGUMENTS');
                    } else {
                        if (databaseManager.createDatabase(args[1])) {
                            ws.send('OK');
                        } else {
                            ws.send('FAILURE');
                        }
                    }
                } else if (args[0] == 'TABLE') {
                    if (ws.currentDatabase != undefined) {
                        if (args[1] == null) {
                            ws.send('NOT_ENOUGH_ARGUMENTS');
                        } else {
                            if (databaseManager.createTable(ws.currentDatabase, args[1])) {
                                ws.send('OK');
                            } else {
                                ws.send('FAILURE');
                            }
                        }
                    } else {
                        ws.send('NO_DATABASE');
                    }
                }
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
    } else if (cmd == 'DELETE') {
        if (ws.isAuthenticated) {
            if (args.length < 1) {
                ws.send('NOT_ENOUGH_ARGUMENTS');
            } else {
                if (args[0] == 'DATABASE') {
                    if (ws.currentDatabase != undefined) {
                        if (databaseManager.deleteDatabase(ws.currentDatabase)) {
                            ws.currentDatabase = undefined;
                            ws.send('OK');
                        } else {
                            ws.send('FAILURE');
                        }
                    } else {
                        if (args[1] == undefined) {
                            ws.send('NOT_ENOUGH_ARGUMENTS');
                        } else {
                            if (databaseManager.deleteDatabase(args[1])) {
                                ws.send('OK');
                            } else {
                                ws.send('FAILURE');
                            }
                        }
                    }
                } else if (args[0] == 'TABLE') {
                    if (ws.currentDatabase != undefined) {
                        if (args[1] == null) {
                            ws.send('NOT_ENOUGH_ARGUMENTS');
                        } else {
                            if (databaseManager.deleteTable(ws.currentDatabase, args[1])) {
                                ws.send('OK');
                            } else {
                                ws.send('FAILURE');
                            }
                        }
                    } else {
                        ws.send('NO_DATABASE');
                    }
                }
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
    }
}
