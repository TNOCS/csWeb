import * as chai from 'chai';
import * as fs from 'fs';
import { csServer, csServerOptions, StartOptions } from '../../../../csServerComp/csServer';
import { ResourceFile, Project, Group } from '../../../../csServerComp/ServerComponents/api/ApiManager';
import { deleteFolderRecursively } from '../../../../csServerComp/ServerComponents/helpers/Utils';

chai.should();
chai.use(require('chai-http'));

describe('RestAPI: ', () => {
    const resourceFile = <ResourceFile>{
        id: 'f5da61db-31bd-4282-984b-fd44951d4623',
        featureTypes: {
            'f5da61db-31bd-4282-984b-fd44951d4623': {
                name: 'test',
                propertyTypeKeys: 'A'
            }
        },
        propertyTypeData: {
            A: {
                label: 'A',
                title: 'Aantal inwoners',
                type: 'text',
                description: '',
                visibleInCallOut: true
            },
        },
        _localFile: '',
        title: 'original_title',
        storage: 'file'
    };

    const projectFile = <Project>{
        id: 'testproject',
        title: 'Test project',
        description: 'This is a test project',
        url: '',
        _localFile: '',
        isDynamic: false,
        storage: 'file',
        logo: '',
        groups: [<Group>{
            id: 'group1',
            title: 'Group 1',
            clusterLevel: 12,
            clustering: true,
            description: 'My test group',
            layers: {}
        }]
    };

    let originalTimeout: number;
    const server = new csServer(__dirname, <csServerOptions>{
        port: 3456,
        swagger: false,
        connectors: {}
    });

    let serverStarted = false;
    beforeEach((done: Function) => {
        if (serverStarted) {
            done();
            return;
        }
        const testFolder = './out/test/csServerComp/ServerComponents/api/public';
        deleteFolderRecursively(testFolder);
        server.start(() => {
            this.config = server.config;
            this.config.add('server', 'http://localhost:' + server.options.port);
            console.log('CS server started');
            serverStarted = true;
            done();
        }, <StartOptions>{
            'bagConnectionStringDesc': 'Add the BAG connection string here, including username and pwd, if any.',
            'bagConnectionString': 'postgres://bag_user:bag4all@cool3.sensorlab.tno.nl:8039/bag',
            //'bagConnectionString': 'postgres://bag_user:bag4all@localhost:5432/bag',
            'resolveAddress': '/lookup_address/zip_number/:zip/:number'
        });
    });

    beforeEach(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    });

    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    describe('The resource API', () => {
        it('should create a new resource file', (done: Function) => {
            chai.request(server.httpServer)
                .post('/api/resources')
                .send(resourceFile)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    done();
                });
        });

        it('should get a specific resource', (done: Function) => {
            chai.request(server.httpServer)
                .get(`/api/resources/${resourceFile.id}`)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    expect(res.body.title).toEqual(resourceFile.title);
                    done();
                });
        });

        it('should update an existing resource file', (done: Function) => {
            const newTitle = 'New name';
            resourceFile.title = newTitle;
            chai.request(server.httpServer)
                .put('/api/resources')
                .send(resourceFile)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);

                    chai.request(server.httpServer)
                        .get(`/api/resources/${resourceFile.id}`)
                        .end((err, res) => {
                            res.should.have.status(HTTPStatusCodes.OK);
                            expect(res.body.title).toEqual(newTitle);
                            done();
                        });
                });
        });

        it('should get resources', (done: Function) => {
            chai.request(server.httpServer)
                .get('/api/resources')
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    res.body.hasOwnProperty(resourceFile.id).should.be.true;
                    done();
                });
        });
    });

    describe('The project API', () => {
        it('should create new projects', (done: Function) => {
            chai.request(server.httpServer)
                .post('/api/projects')
                .send(projectFile)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    expect(res.body.url).toEqual('/api/projects/testproject');
                    done();
                });
        });

        it('should get existing projects', (done: Function) => {
            chai.request(server.httpServer)
                .get('/api/projects')
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    res.body.hasOwnProperty(projectFile.id).should.be.true;
                    expect(res.body[projectFile.id].url).toEqual('/api/projects/testproject');
                    done();
                });
        });

        it('should get an existing project', (done: Function) => {
            chai.request(server.httpServer)
                .get(`/api/projects/${projectFile.id}`)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    res.body.hasOwnProperty('title').should.be.true;
                    expect(res.body.title).toEqual(projectFile.title);
                    expect(res.body.url).toEqual(`/api/projects/${projectFile.id}`);
                    done();
                });
        });

        it('should update an existing project', (done: Function) => {
            const newTitle = 'New project title';
            projectFile.title = newTitle;
            chai.request(server.httpServer)
                .put(`/api/projects/${projectFile.id}`)
                .send(projectFile)
                .end((err, res) => {
                    res.should.have.status(HTTPStatusCodes.OK);
                    chai.request(server.httpServer)
                        .get(`/api/projects/${projectFile.id}`)
                        .end((err, res) => {
                            res.should.have.status(HTTPStatusCodes.OK);
                            res.body.hasOwnProperty('title').should.be.true;
                            expect(res.body.title).toEqual(newTitle);
                            done();
                        });
                });
        });

        it('should stop', () => {
            server.httpServer.close();
            process.exit(0);
        });


    });
});
