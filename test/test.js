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
    it('should connect', done => {
        ws = new WebSocket('ws://localhost:8080');
        ws.once('message', () => {
            done();
            ws.setMaxListeners(500);
        });
    });
    describe('AUTH', () => {
        it('should deny access when using an incorrect password', () => {
            ws.once('message', m => {
                expect(m).to.equal('AUTH_FAIL');
            });
            ws.send('AUTH this_is_not_the_password');
        });
        it('should grant access when using a correct password', () => {
            ws.once('message', m => {
                expect(m).to.equal('OK');
            });
            ws.send('AUTH pancake');
        });
    });
    describe('CREATE', () => {
        describe('DATABASE', () => {
            it('should create 1 database by the name test_database', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.exist;
                });
                ws.send('CREATE DATABASE test_database');
            });
            it('should create 1 database by the name test_database1', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database1.json')).to.exist;
                });
                ws.send('CREATE DATABASE test_database1');
            });
        });
        describe('TABLE', () => {
            let testInt = 1;
            beforeEach(() => {
                if (testInt == 1) {
                    ws.once('message', m => {
                        expect(m).to.equal('OK');
                    });
                    ws.send('SELECT DATABASE test_database');
                } else if (testInt == 2) {
                    ws.once('message', m => {
                        expect(m).to.equal('OK');
                    });
                    ws.send('SELECT DATABASE test_database1');
                }
                testInt++;
            });
            it('should create a table by the name test_table in the database test_database', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.equal('{"test_table":[]}');
                });
                ws.send('CREATE TABLE test_table');
            });
            it('should create a table by the name test_table1 in the database test_database1', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database1.json')).to.equal('{"test_table1":[]}');
                });
                ws.send('CREATE TABLE test_table1');
            });
        });
    });
    describe('INSERT', () => {
        before(() => {
            ws.once('message', m => {
                expect(m).to.equal('OK');
            });
            ws.send('SELECT DATABASE test_database');
        });
        it('should insert a record into the table test_table in the database test_database', () => {
            ws.once('message', m => {
                expect(m).to.equal('OK');
                expect(file('./databases/test_database.json')).to.contain('"test_record":true');
            });
            ws.send('INSERT {"test_record":true}');
        });
    });
    describe('MERGE', () => {
        describe('DATABASE', () => {
            it('should merge the two databases named test_database and test_database1', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.have.any.keys('test_table1');
                });
                ws.send('MERGE DATABASE test_database1');
            }); 
        });
    });
    describe('LIST', () => {
        describe('DATABASES', () => {
            it('should send an array of all the databases and the array should contain test_database', () => {
                ws.once('message', m => {
                    expect(m).to.equal('["test_database"]');
                });
                ws.send('LIST DATABASES');
            });
        });
        describe('TABLES', () => {
            it('should send an array of all the tables in the database test_database and the array should contain test_table', () => {
                ws.once('message', m => {
                    expect(m).to.equal('["test_table"]');
                });
                ws.send('LIST TABLES');
            });
        });
        describe('RECORDS', () => {
            it('should send an array of all the records in the table test_table in the database test_database and the array should contain test_record', () => {
                ws.once('message', m => {
                    expect(m).to.contain('test_record');
                });
                ws.send('LIST RECORDS');
            });
        });
    });
    describe('DELETE', () => {
        describe('TABLE', () => { // you may notice we're going TABLE => DATABASE rather than DATABASE => TABLE. this is because if we delete the database first we can't delete the table as it doesn't exist.
            it('should delete the table test_table from the database test_database', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.equal('{}');
                });
                ws.send('DELETE TABLE test_table');
            });
        });
        describe('DATABASE', () => { // now we delete the database
            it('should delete database test_database', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database.json')).to.not.exist;
                });
                ws.send('DELETE DATABASE test_database');
            });
            it('should delete database test_database1', () => {
                ws.once('message', m => {
                    expect(m).to.equal('OK');
                    expect(file('./databases/test_database1.json')).to.not.exist;
                });
                ws.send('DELETE DATABASE test_database1');
            });
        });
    });
    describe('SHUTDOWN', () => {
        it('should shut down the PancakeDB server', () => {
            ws.send('SHUTDOWN');
        });
    });
});