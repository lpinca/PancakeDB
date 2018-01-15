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

/**
 * Logs a message.
 * @param {string} prefix The prefix of the log message. 
 * @param {ChalkColor} prefixColour The colour of the prefix. 
 * @param {string} string The log message.
 */
module.exports = function log(prefix, prefixColour, string) {
    console.log(`${prefixColour(prefix)} ${chalk.magenta('==>')} ${string}`);
}