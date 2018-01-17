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
const uuid = require('uuid/v4');

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
    databaseSelected: (ws) => {
        return ws.current.database != null;
    },
    getDatabaseObject: (db) => {
        if (databaseManager.databaseExists(db)) {
            let raw = fs.readFileSync(`./databases/${db}.json`);
            return JSON.parse(raw);
        } else {
            return null;
        }
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
        if (databaseManager.tableExists(db, table)) {
            let database = databaseManager.getDatabaseObject(db);
            delete database[table];
            fs.writeFileSync(`./databases/${db}.json`, JSON.stringify(database));
            return true;
        } else {
            return false;
        }
    },
    deleteRecord: (db, table, recordId) => {
        if (databaseManager.tableExists(db, table)) {
            let database = databaseManager.getDatabaseObject(db);
            database[table] = database[table].filter(obj => {
                return obj.id != recordId;
            });
            fs.writeFileSync(`./databases/${db}.json`, JSON.stringify(database));
        }
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
            let database = databaseManager.getDatabaseObject(db);
            database[table] = [];
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
    } else if (cmd == 'SELECT') {
        if (ws.isAuthenticated) {
            if (args.length < 2) {
                ws.send('NOT_ENOUGH_ARGUMENTS');
            } else {
                if (args[0] == 'DATABASE') {
                    if (databaseManager.databaseExists(args[1])) {
                        ws.current.database = args[1];
                        ws.send('OK');
                    } else {
                        ws.send('NON_EXISTANT');
                    }
                } else if (args[0] == 'TABLE') {
                    if (ws.current.database != undefined) {
                        if (databaseManager.tableExists(ws.current.database, args[1])) {
                            ws.current.table = args[1];
                            ws.send('OK');
                        } else {
                            ws.send('NON_EXISTANT');
                        }
                    } else {
                        ws.send('NO_DATABASE');
                    }
                }
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
    } else if (cmd == 'INSERT') {
        if (ws.isAuthenticated) {
            if (ws.current.database != undefined) {
                if (ws.current.table != undefined) {
                    let sentJson = args.join(' ');
                    let database = databaseManager.getDatabaseObject(ws.current.database);
                    let parsedJson = JSON.parse(sentJson);
                    parsedJson.id = uuid();
                    database[ws.current.table].push(parsedJson);
                    fs.writeFileSync(`./databases/${ws.current.database}.json`, JSON.stringify(database), 'utf-8');
                    ws.send('OK');
                } else {
                    ws.send('NO_TABLE');
                }
            } else {
                ws.send('NO_DATABASE');
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
    } else if (cmd == 'LIST') {
        if (ws.isAuthenticated) {
            if (args.length < 1) {
                ws.send('NOT_ENOUGH_ARGUMENTS');
            } else {
                if (args[0] == 'DATABASES') {
                    let files = fs.readdirSync('./databases');
                    for (let i = 0; i < files.length; i++) {
                        files[i] = files[i].slice(0, -5);
                    }
                    ws.send(JSON.stringify(files));
                } else if (args[0] == 'TABLES') {
                    if (ws.current.database != undefined) {
                        let database = databaseManager.getDatabaseObject(ws.current.database);
                        let tables = Object.keys(database);
                        ws.send(JSON.stringify(tables));
                    } else {
                        ws.send('NO_DATABASE');
                    }
                } else if (args[0] == 'RECORDS') {
                    if (ws.current.database != undefined) {
                        if (ws.current.table != undefined) {
                            let database = databaseManager.getDatabaseObject(ws.current.database);
                            ws.send(JSON.stringify(database[ws.current.table]));
                        } else {
                            ws.send('NO_TABLE');
                        }
                    } else {
                        ws.send('NO_DATABASE');
                    }
                }
            }
        } else {
            ws.send('NOT_AUTHENTICATED');
        }
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
                    if (ws.current.database != undefined) {
                        if (args[1] == null) {
                            ws.send('NOT_ENOUGH_ARGUMENTS');
                        } else {
                            if (databaseManager.createTable(ws.current.database, args[1])) {
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
                    if (ws.current.database != undefined) {
                        if (databaseManager.deleteDatabase(ws.current.database)) {
                            ws.current.database = undefined;
                            ws.current.table = undefined;
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
                    if (ws.current.database != undefined) {
                        if (ws.current.table != undefined) {
                            if (databaseManager.deleteTable(ws.current.database, ws.current.table)) {
                                ws.current.table = undefined;
                                ws.send('OK');
                            } else {
                                ws.send('FAILURE');
                            }
                        } else {
                            if (args[1] == null) {
                                ws.send('NOT_ENOUGH_ARGUMENTS');
                            } else {
                                if (databaseManager.deleteTable(ws.current.database, args[1])) {
                                    ws.current.table = undefined;
                                    ws.send('OK');
                                } else {
                                    ws.send('FAILURE');
                                }
                            }
                        }
                    } else {
                        ws.send('NO_DATABASE');
                    }
                } else if (args[0] == 'RECORD') {
                    if (ws.current.database != undefined) {
                        if (ws.current.table != undefined) {
                            if (args.length < 1) {
                                ws.send('NOT_ENOUGH_ARGUMENTS');
                            } else {
                                if (databaseManager.deleteRecord(ws.current.database, ws.current.table, args[0])) {
                                    ws.send('OK');
                                } else {
                                    ws.send('FAILURE');
                                }
                            }
                        } else {
                            ws.send('NO_TABLE');
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
