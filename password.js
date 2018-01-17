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

const ini = require('ini');
const fs = require('fs');
const config = ini.parse(fs.readFileSync('./PancakeDB.ini', 'utf-8'));
const Prompt = require('prompt-password');
const sha512 = require('js-sha512');

const p = new Prompt({
    type: 'password',
    message: 'Please input your desired password.',
    name: 'password'
});

p.run().then(password => {
    let passwordHash = sha512.hmac.create('pancakedb');
    passwordHash.update(password);
    config.Configuration.Password = passwordHash.hex();
    fs.writeFileSync('./PancakeDB.ini', ini.stringify(config));
    console.log('Password updated.');
});

