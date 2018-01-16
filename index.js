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

const chalk = require('chalk');
const log = require('./log');
const WebSocket = require('ws');
const ini = require('ini');

const messageHandler = require('./database');

const config = ini.parse(fs.readFileSync('./PancakeDB.ini', 'utf-8'));
const port = config.Configuration.Port;

const asciiArt = chalk.yellow(`
   ___              ___      _           ___  ___ 
  / _ \\__ _ _ __   / __\\__ _| | _____   /   \\/ __\\
 / /_)/ _\` | '_ \\ / /  / _\` | |/ / _ \\ / /\\ /__\\//
/ ___/ (_| | | | / /__| (_| |   <  __// /_// \\/  \\
\\/    \\__,_|_| |_\____/\\__,_|_|\\_\\___/___,'\\_____/
                                                  

PancakeDB - nodejs database software`);

console.log(asciiArt);
log('Server', chalk.green, 'Starting PancakeDB server...');

const server = new WebSocket.Server({port: port});

function noop() {}

function heartbeat() {
    this.isAlive = true;
}

server.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.isAuthenticated = false;
    ws.on('pong', heartbeat);
    ws.on('error', () => log('Server', chalk.green, 'Lost connection to ' + req.connection.remoteAddress));
    log('Server', chalk.green, 'Connection established with ' + req.connection.remoteAddress);
    ws.send('CONNECTION_SUCCESS');
    ws.send('PancakeDB ' + require('./package.json').version);

    ws.on('message', msg => messageHandler(ws, msg));
});

const interval = setInterval(() => {
    server.clients.forEach(ws => {
        if (ws.isAlive === false) {
            log('Server', chalk.green, 'Terminating connection with a client due to not receiving a heartbeat within 1 minute.');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(noop);
    });
}, 30000);

log('Server', chalk.green, 'Server listening on port ' + port);