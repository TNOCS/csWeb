import fs = require('fs');
import path = require('path');
import express = require('express');
import request = require('request');
import xml2js = require('xml2js');
import IApiService = require('../api/IApiService');
import IApiServiceManager = require('../api/IApiServiceManager');
import ConfigurationService = require('../configuration/ConfigurationService');
import rss = require('../helpers/Rss');
import RssGeoJSON = require("../helpers/RssGeoJSON");

/* Multiple storage engine supported, e.g. file system, mongo  */
class RssService implements IApiService {
    private server: express.Express;
    private config: ConfigurationService;
    private baseUrl: string;
    id: string;

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService) {
        this.server = server;

        this.baseUrl = apiServiceManager.BaseUrl + (config['rssAddress'] || '/rss');
        //console.log(this.baseUrl);
        server.get(this.baseUrl, (req, res) => {
            var id = req.query.url;
            this.getRss(id, res);
        });
    }

    shutdown() { }

    private getRss(feedUrl: string, res: express.Response) {
        console.log('RSS request: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';

        var parseNumbers = function(str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };

        request(feedUrl, function(error, response, xml) {
            if (!error && response.statusCode == 200) {
                var parser = new xml2js.Parser({ trim: true, normalize: true, explicitArray: false, mergeAttrs: true }); //, valueProcessors: [parseNumbers]
                parser.parseString(xml, function(err, rssFeed: rss.IRss) {
                    if (err) {
                        console.error(err);
                    } else {
                        var r = rssFeed.rss;
                        var c = r.channel;
                        //console.log(c.title);
                        //console.log(c.description);
                        if (c.item) {
                            var geo = new RssGeoJSON.RssGeoJSON();
                            c.item.forEach(i => {
                                //console.log(i.title);
                                var feature: RssGeoJSON.RssFeature;
                                if (i["geo:lat"] && i["geo:long"])
                                    feature = new RssGeoJSON.RssFeature(i["geo:lat"], i["geo:long"]);
                                else
                                    feature = new RssGeoJSON.RssFeature();
                                if (i.title) feature.properties["Name"] = i.title;
                                if (i.link) feature.properties["link"] = i.link;
                                if (i.description) feature.properties["description"] = i.description;
                                if (i.category) feature.properties["category"] = i.category;
                                if (i.pubDate) feature.properties["pubDate"] = i.pubDate;
                                if (i["dc:date"]) feature.properties["date"] = i["dc:date"];
                                geo.features.push(feature);
                            });
                            res.json(geo);
                        }
                    }
                });
            } else {
                res.statusCode = 404;
                res.end();
            }
        })
    }
}
export =RssService;
