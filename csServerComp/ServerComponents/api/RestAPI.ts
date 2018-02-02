import { Request, Response, Express, Router } from 'express';
import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Group = ApiManager.Group;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Logs = ApiManager.Log;
import ResourceFile = ApiManager.ResourceFile;
import BaseConnector = require('./BaseConnector');
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import Winston = require('winston');
import request = require('request');
import fs = require('fs');

export class RestAPI extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager;
    public resourceUrl;
    public layersUrl;
    public keysUrl;
    public filesUrl;
    public searchUrl;
    public projectsUrl;
    public proxyUrl;
    public tilesUrl;

    constructor(public server: Express, public baseUrl: string = '/api') {
        super();
        Winston.info(`Constructing restApi with baseUrl ${baseUrl}`);
        this.isInterface = true;
        this.resourceUrl = '/resources/';
        this.layersUrl = '/layers/';
        this.searchUrl = '/search/';
        this.filesUrl = '/files/';
        this.keysUrl = '/keys/';
        this.projectsUrl = '/projects/';
        this.proxyUrl = '/proxy';
        this.tilesUrl = '/tiles/';
        Winston.info(`Constructed restApi with baseUrl ${baseUrl}`);
    }

    private getResources(req: Request, res: Response) {
        res.json(this.cloneWithoutUnderscore(this.manager.resources));
    }

    private getTheResource(req: Request, res: Response) {
        this.manager.getResource(req.params.resourceId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            if (result.result === ApiResult.OK) {
                res.json(this.cloneWithoutUnderscore(result.resource));
            } else {
                res.sendStatus(result.result);
            }
        });
    }

    private createTheResource(req: Request, res: Response) {
        var resource = new ResourceFile();
        resource = req.body;
        this.manager.addResource(resource, false, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private updateTheResource(req: Request, res: Response) {
        var resource = new ResourceFile();
        resource = req.body;
        this.manager.addResource(resource, true, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private getLayers(req: Request, res: Response) {
        res.json(this.manager.layers);
    }

    private getTheProjects(req: Request, res: Response) {
        res.json(this.manager.projects);
    }

    private getTheProject(req: Request, res: Response) {
        this.manager.getProject(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            if (result.result === ApiResult.OK) {
                res.json(result.project);
            } else {
                res.sendStatus(result.result);
            }
        });
    }

    private updateTheProject(req: Request, res: Response) {
        req['projectId'] = req.params.projectId;
        this.manager.updateProject(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.sendStatus(result.result);
        });
    }

    private createTheProject(req: Request, res: Response) {
        var project = new Project();
        project = req.body;
        this.manager.addProject(project, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            if (result.result === ApiResult.OK || result.result === ApiResult.ProjectAlreadyExists) {
                res.json(result.project);
            }
        });
    }

    private deleteTheProject(req: Request, res: Response) {
        this.manager.deleteProject(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.sendStatus(result.result);
        });
    }

    private addTheLayer(req: Request, res: Response) {
        this.manager.addLayerToProject(req.params.projectId, req.params.groupId, req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    deleteTheLayer(req: Request, res: Response) {
        this.manager.removeLayerFromProject(req.params.projectId, req.params.groupId, req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private deleteTheLayer2(req: Request, res: Response) {
        this.manager.deleteLayer(req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.sendStatus(result.result);
        });
    }

    private getTheGroups(req: Request, res: Response) {
        this.manager.allGroups(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            if (result.result === ApiResult.OK) {
                res.send(result.groups);
            } else {
                res.sendStatus(result.result);
            }
        });
    }

    private createTheGroup(req: Request, res: Response) {
        var group = new Group();
        group = req.body;
        this.manager.addGroup(group, req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private updateTheGroup(req: Request, res: Response) {
        this.manager.updateGroup(req.params.projectId, req.params.groupId, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private deleteTheGroup(req: Request, res: Response) {
        this.manager.removeGroup(req.params.groupId, req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    private createTheLayer(req: Request, res: Response) {
        var layer = new Layer();
        //layer.features = req.body.features;
        layer = <Layer>req.body;
        this.manager.addUpdateLayer(layer, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.sendStatus(result.result);
        });
    }

    /** Similar to createLayer, but also checks if a layer exists: Should probably be removed as it is an update! */
    private createTheLayer2(req: Request, res: Response) {
        Winston.warn('DEPRECATED - USE PUT TO UPDATE A LAYER');
        req['layerId'] = req.params.layerId;
        if (this.manager.layers.hasOwnProperty(req['layerId'])) {
            res.sendStatus(ApiResult.LayerAlreadyExists);
        } else {
            this.manager.addUpdateLayer(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        }
    }

    private getTheLayer(req: Request, res: Response) {
        this.manager.getLayer(req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            if (result.result === ApiResult.OK) {
                res.json(result.layer);
            } else {
                res.sendStatus(result.result);
            }
        });
    }

    private updateTheLayer(req: Request, res: Response) {
        req['layerId'] = req.params.layerId;
        this.manager.addUpdateLayer(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.sendStatus(result.result);
        });
    }

    private addTheFeature(req: Request, res: Response) {
        this.manager.addFeature(req.params.layerId, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private getTheFeature(req: Request, res: Response) {
        this.manager.getFeature(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.sendStatus(result.result);
        });
    }

    private updateTheFeature(req: Request, res: Response) {
        var feature = new Feature();
        feature = req.body;
        this.manager.updateFeature(req.params.layerId, feature, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private deleteTheFeature(req: Request, res: Response) {
        this.manager.deleteFeature(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private searchLayers(req: Request, res: Response) {
        this.manager.searchLayers(req.params.keyword, [], <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.json(result);
        });
    }

    private getLayerFeaturesInBBox(req: Request, res: Response) {
        var southWest: number[] = [Number(req.query.swlng), Number(req.query.swlat)];
        var northEast: number[] = [Number(req.query.nelng), Number(req.query.nelat)];
        this.manager.getBBox(req.params.layerId, southWest, northEast, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private getLayerFeaturesInSphere(req: Request, res: Response) {
        this.manager.getSphere(req.params.layerId, Number(req.query.maxDistance), Number(req.query.lng), Number(req.query.lat), <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            // this.server.post(this.sensorsUrl + ':sensorId', (req: Request, res: Response) => {
            //     this.manager.addSensor(req.body, (result: CallbackResult) => { res.send(result) });
            // });
            //todo: check error
            res.send(result);
        });
    }

    private getLayerFeaturesInPolygon(req: Request, res: Response) {
        var feature: Feature = req.body;
        // this.server.get(this.sensorsUrl, (req: Request, res: Response) => {
        //     this.manager.getSensors((result: CallbackResult) => { res.send(result) });
        // });
        this.manager.getWithinPolygon(req.params.layerId, feature, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private updateTheKey(req: Request, res: Response) {
        this.manager.updateKey(req.params.keyId, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private getTheKeys(req: Request, res: Response) {
        this.manager.getKeys(<ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result.keys);
        });
    }

    private getTheKey(req: Request, res: Response) {
        this.manager.getKey(req.params.keyId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.send(result.key);
        });
    }

    private addTheFile(req: Request, res: Response) {
        if (!req.body.hasOwnProperty('base64')) {
            Winston.error('Error receiving base64 encoded image: post the data as JSON, with the base64 property set to the base64 encoded string!');
            return;
        }
        this.manager.addFile(req.body['base64'], req.params.folderId, req.params.fileName, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private getTheFile(req: Request, res: Response) {
        this.manager.getFile(req.params.fileName, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            res.send(result);
        });
    }

    private addTheLogs(req: Request, res: Response) {
        var logs: { [key: string]: Logs[] };
        logs = req.body;
        this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private addTheLog(req: Request, res: Response) {
        this.manager.addLog(req.params.layerId, req.params.featureId, req.body.prop, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            console.log('received log');
            res.send(result);
        });
    }

    private getTheLog(req: Request, res: Response) {
        this.manager.getLog(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private deleteTheLog(req: Request, res: Response) {
        this.manager.deleteLog(req.params.layerId, req.params.featureId, req.body.ts, req.body.prop, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private getLogs(req: Request, res: Response) {
        var logs: { [key: string]: Logs[] };
        logs = req.body;
        this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
            //todo: check error
            res.send(result);
        });
    }

    private proxyTheUrl(req: Request, res: Response) {
        var id = req.query.url;
        console.log(id);
        this.getUrl(id, req, res);
    }

    public init(layerManager: ApiManager.ApiManager, options: any, callback: Function) {
        this.manager = layerManager;
        console.log('Init Rest API on port ' + this.server.get('port') + '. Base path is ' + this.baseUrl);

        const router = Router();

        router.route(this.resourceUrl)
            .get((req: Request, res: Response) => this.getResources(req, res))
            .put((req: Request, res: Response) => this.updateTheResource(req, res))
            .post((req: Request, res: Response) => this.createTheResource(req, res));

        router.route(this.resourceUrl + ':resourceId')
            .get((req: Request, res: Response) => this.getTheResource(req, res));

        router.route(this.layersUrl)
            .get((req: Request, res: Response) => this.getLayers(req, res));

        //------ Project API paths, in CRUD order

        router.route(this.projectsUrl)
            .get((req: Request, res: Response) => this.getTheProjects(req, res))
            .post((req: Request, res: Response) => this.createTheProject(req, res));

        router.route(this.projectsUrl + ':projectId')
            .get((req: Request, res: Response) => this.getTheProject(req, res))
            .put((req: Request, res: Response) => this.updateTheProject(req, res))
            .delete((req: Request, res: Response) => this.deleteTheProject(req, res));

        router.route(this.projectsUrl + ':projectId/group/')
            .get((req: Request, res: Response) => this.getTheGroups(req, res))
            .post((req: Request, res: Response) => this.createTheGroup(req, res));

        router.route(this.projectsUrl + ':projectId/group/:groupId')
            .put((req: Request, res: Response) => this.updateTheGroup(req, res))
            .delete((req: Request, res: Response) => this.deleteTheGroup(req, res));

        router.route(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId')
            .delete((req: Request, res: Response) => this.deleteTheLayer(req, res))
            .post((req: Request, res: Response) => this.addTheLayer(req, res));

        //------ layer API paths, in CRUD order

        router.route(this.layersUrl)
            .post((req: Request, res: Response) => this.createTheLayer(req, res));

        router.route(this.layersUrl + ':layerId')
            .get((req: Request, res: Response) => this.getTheLayer(req, res))
            .put((req: Request, res: Response) => this.updateTheLayer(req, res))
            .post((req: Request, res: Response) => this.createTheLayer2(req, res))
            .delete((req: Request, res: Response) => this.deleteTheLayer2(req, res));

        //------ feature API paths, in CRUD order

        router.route(this.layersUrl + ':layerId/feature')
            .post((req: Request, res: Response) => this.addTheFeature(req, res));

        router.route(this.layersUrl + ':layerId/feature/:featureId')
            .get((req: Request, res: Response) => this.getTheFeature(req, res))
            .put((req: Request, res: Response) => this.updateTheFeature(req, res))
            .delete((req: Request, res: Response) => this.deleteTheFeature(req, res));

        // LOGS

        // ROUTE should be :layerId/features/:featureId/log
        router.route(this.layersUrl + ':layerId/:featureId/log')
            .get((req: Request, res: Response) => this.getTheLog(req, res))
            .put((req: Request, res: Response) => this.addTheLog(req, res))
            .delete((req: Request, res: Response) => this.deleteTheLog(req, res)); // Shouldn't it be post?

        router.route(this.layersUrl + ':layerId/:featureId/logs')
            .put((req: Request, res: Response) => this.addTheLogs(req, res));

        router.route(this.searchUrl + ':keyword')
            .get((req: Request, res: Response) => this.searchLayers(req, res));

        router.route(this.layersUrl + ':layerId/bbox')
            .get((req: Request, res: Response) => this.getLayerFeaturesInBBox(req, res));

        router.route(this.layersUrl + ':layerId/getsphere')
            .get((req: Request, res: Response) => this.getLayerFeaturesInSphere(req, res));

        router.route(this.layersUrl + ':layerId/getwithinpolygon')
            .post((req: Request, res: Response) => this.getLayerFeaturesInPolygon(req, res));

        router.route(this.keysUrl)
            .post((req: Request, res: Response) => this.getTheKeys(req, res));

        router.route(this.keysUrl + ':keyId')
            .get((req: Request, res: Response) => this.getTheKey(req, res))
            .post((req: Request, res: Response) => this.updateTheKey(req, res));

        router.route(this.filesUrl + ':folderId/:fileName')
            .post((req: Request, res: Response) => this.addTheFile(req, res));

        router.route(this.filesUrl + ':folderId/:fileName')
            .get((req: Request, res: Response) => this.getTheFile(req, res));

        router.route(this.proxyUrl)
            .get((req: Request, res: Response) => this.proxyTheUrl(req, res));

        this.server.use(this.baseUrl, router);

        callback();
    }

    private getUrl(feedUrl: string, req: Request, res: Response) {
        Winston.info('proxy request 2: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';
        var options = {
            method: 'get',
            headers: req.headers
        };


        var parseNumbers = function (str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };

        request(feedUrl, options, function (error, response, xml) {
            if (!error && response.statusCode === 200) {
                res.send(xml);

            } else {
                res.statusCode = 404;
                res.end();
            }
        });
    }

    private cloneWithoutUnderscore(v: any): any {
        if (typeof v !== 'object') return v;
        if (v instanceof Array) {
            var a = [];
            v.forEach((i) => {
                a.push(this.cloneWithoutUnderscore(i));
            });
            return a;
        } else {
            var c = {};
            for (var k in v) {
                if (k[0] !== '_') c[k] = this.cloneWithoutUnderscore(v[k]);
            }
            return c;
        }
    }


}
