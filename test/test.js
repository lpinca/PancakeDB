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

const WebSocket = require('ws');

const chai = require('chai');
const chaiFiles = require('chai-files');

chai.use(chaiFiles);

const expect = chai.expect;
const file = chaiFiles.file;
const dir = chaiFiles.dir;

var ws;

describe('Client', () => {
    afterEach(() => {
        ws.removeAllListeners('message');
    });
    after(() => {
        ws.close();
    });
    it('should connect', done => {
        ws = new WebSocket('ws://localhost:8080');
        ws.on('message', () => {
            done();
            ws.removeAllListeners('message'); // this is the only case that this is needed, mainly because the afterEach() isn't quick enough to run this before the next test.
        });
    });
    describe('AUTH', () => {
        it('should deny access when using an incorrect password', () => {
            ws.on('message', m => {
                expect(m).to.equal('AUTH_FAIL');
            });
            ws.send('AUTH this_is_not_the_password');
        });
        it('should grant access when using a correct password', () => {
            ws.on('message', m => {
                expect(m).to.equal('OK');
            });
            ws.send('AUTH pancake');
        });
    });
    describe('CREATE', () => {
        describe('DATABASE', () => {
            it('should create a database by the name test_database', () => {
                ws.on('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.exist();
                });
                ws.send('CREATE DATABASE test_database');
            });
        });
        describe('TABLE', () => {
            before(() => {
                ws.on('message', m => {
                    expect(m).to.equal('OK');
                });
                ws.send('SELECT DATABASE test_database');
            });
            it('should create a table by the name test_table in the database test_database', () => {
                ws.on('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.equal('{"test_table":[]}');
                });
                ws.send('CREATE TABLE test_table');
            });
        });
    });
    describe('INSERT', () => {
        before(() => {
            ws.on('message', m => {
                expect(m).to.equal('OK');
            });
            ws.send('SELECT TABLE test_table');
        });
        it('should insert a record into the table test_table in the database test_database', () => {
            ws.on('message', m => {
                expect(m).to.equal('OK');
            });
            ws.send('INSERT {"test_record":true}');
        });
    });
    describe('LIST', () => {
        describe('DATABASES', () => {
            it('should send an array of all the databases and the array should contain test_database', () => {
                ws.on('message', m => {
                    expect(m).to.equal('["test_database"]');
                });
                ws.send('LIST DATABASES');
            });
        });
        describe('TABLES', () => {
            it('should send an array of all the tables in the database test_database and the array should contain test_table', () => {
                ws.on('message', m => {
                    expect(m).to.equal('["test_table"]');
                });
                ws.send('LIST TABLES');
            });
        });
        describe('RECORDS', () => {
            it('should send an array of all the records in the table test_table in the database test_database and the array should contain test_record', () => {
                ws.on('message', m => {
                    expect(m).to.contain('test_record');
                });
                ws.send('LIST RECORDS');
            });
        });
    });
    describe('DELETE', () => {
        describe('TABLE', () => { // you may notice we're going TABLE => DATABASE rather than DATABASE => TABLE. this is because if we delete the database first we can't delete the table as it doesn't exist.
            it('should delete the table test_table from the database test_database', () => {
                ws.on('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.equal('{}');
                });
                ws.send('DELETE TABLE test_table');
            });
        });
        describe('DATABASE', () => { // now we delete the database
            it('should delete the the database test_database', () => {
                ws.on('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.not.exist();
                });
                ws.send('DELETE DATABASE test_database');
            });
        });
    });
    describe('SHUTDOWN', () => {
        it('should shut down the PancakeDB server', done => {
            ws.on('disconnect', () => done());
            ws.send('SHUTDOWN');
        });
    })
});