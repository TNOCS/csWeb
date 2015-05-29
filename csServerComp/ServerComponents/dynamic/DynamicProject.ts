require('rootpath')();
import express       = require('express')
import ClientConnection = require('ClientConnection');
import MessageBus = require('ServerComponents/bus/MessageBus');
import fs = require('fs');
import path = require('path');
var chokidar = require('chokidar');


module DynamicProject {

  export class IDynamicLayer {
      Connection: ClientConnection.ConnectionManager;
      GetLayer: Function;
      GetDataSource : Function;
      layerId: string;
  }

  export class DynamicProject
  {

    public project : any;


    constructor(public folder : string, public id, public service : DynamicProjectService,public messageBus : MessageBus.MessageBusService )
    {

    }

    public Start()
    {
      // load project file
      this.openFile();

      // watch directory changes for new geojson files
      this.watchFolder();

      // listen to messagebus




      // setup http handler
      this.service.server.get("/project/" + this.id,(req,res)=>{this.GetLayer(req,res);});

    }

    public AddLayer(data : any)
    {
      var groupFolder = this.folder + "\\" + data.group;
      var file = groupFolder + "\\" + data.layerTitle + ".json";
      if(!fs.existsSync(groupFolder)) fs.mkdirSync(groupFolder);
      fs.writeFileSync(file, JSON.stringify(data.geojson));
      console.log('done!');
    }


    /***
    Open project file from disk
    */
    public openFile()
    {
      var f = this.folder + "/project.json";
      fs.readFile(f, 'utf8', (err, data)=> {
          if (!err)
            {
                try{
                  this.project = JSON.parse(data);
                  if (!this.project.id) this.project.id = this.project.title;

                  if (!this.project.groups) this.project.groups = [];
                  //console.log("ProjectID: " + this.project.id);
                }
                catch(e)
                {
                    console.log("Error (" + f + "): " + e);
                }
            }
        });
    }

    public watchFolder()
    {
      var watcher = chokidar.watch(this.folder, {ignoreInitial: false,ignored: /[\/\\]\./, persistent: true});
      watcher.on('add', (path)=> { this.addLayer(path); });
      watcher.on('change', (path)=> { this.addLayer(path); });
      watcher.on('unlink', (path)=> { this.removeLayer(path); });
    }

    public removeLayer(file : string)
    {
      var p = <any>path;
      var pp = p.parse(file);
      if (pp.base === "project.json") return;

      // determine group
      var groupTitle = pp.dir.replace(this.folder,"").replace("\\","");
      if (groupTitle === "") return;

      // check if group exists
      var gg = this.project.groups.filter((element:any)=>(element!=null && element.title && element.title.toLowerCase() == groupTitle.toLowerCase()));
      var g : any = {};
      if (gg.length>0)
      {
        g = gg[0];
        var layer : any = {};
        layer.id = file;
        layer.groupId = g.title;
        g.layers = g.layers.filter(l => layer.id != l.id);
        this.service.connection.sendUpdate(this.project.id,"project","layer-remove",[layer]);
      }

    }

    public addLayer(file : string)
    {
      var p = <any>path;
      var pp = p.parse(file);
      if (pp.base === "project.json") return;

      // determine group
      var groupTitle = pp.dir.replace(this.folder,"").replace("\\","");
      if (groupTitle === "") return;

      // obtain additional parameters (useClustering, isEnabled, etc.)
      var parameters = this.service.projectParameters[groupTitle];
      if (!parameters) return;

      // check if group exists
      var gg = this.project.groups.filter((element:any)=>(element!=null && element.title && element.title.toLowerCase() == groupTitle.toLowerCase()));
      var g : any = {};
      if (gg.length>0)
      {
        g = gg[0];
      }
      else
      {
      //  var g : any; //new csComp.Services.ProjectGroup();
        g.id = groupTitle.toLowerCase();
        g.title = groupTitle;
        g.layers = [];
        g.styles = [];
        g.oneLayerActive = false;
        this.project.groups.push(g);
      }
      if (parameters.useClustering) {
        g.clustering = true;
        g.clusterLevel = parameters.clusterLevel;
      }

      var layer : any = {};
      layer.id = file;
      layer.description = parameters.description;
      layer.title = parameters.layerTitle;//pp.name.split('_').join(' ');
      layer.type = "geojson";
      layer.url = "data/projects/" + this.id + "/" + g.title + "/" + pp.base;
      layer.groupId = g.id;
      layer.enabled = parameters.enabled;
      layer.reference = parameters.reference;

      var layerExists = false;
      for (var i = 0; i < g.layers.length; i++) {
        if (g.layers[i].id === layer.groupId) {
          layerExists = true;
          break;
        }
      }
      if (!layerExists) g.layers.push(layer);

      this.service.connection.sendUpdate(this.project.id,"project","layer-update",{layer: [layer], group: g});

      // save project.json (+backup)

      //console.log("g:" + group);

    }

    public GetLayer(req: express.Request, res: express.Response) {
      console.log("Get Layer: " + this.folder);
            res.send(JSON.stringify(this.project));

        //res.send("postgres layer");
    }

  }

    export class DynamicProjectService {
      public test : string;
      public projects : { [key: string] : DynamicProject} = {};
      public projectParameters : { [key: string] : any} = {};

      public constructor(public server : express.Express, public connection : ClientConnection.ConnectionManager, public messageBus : MessageBus.MessageBusService)
      {

      }

      public Start(server: express.Express)
      {
        console.log("Start project service");
        this.messageBus.subscribe('dynamic_project_layer', (title : string, data : any)=> {
          // find project
          if (this.projects.hasOwnProperty(data.project)){
            var dp = this.projects[data.project];
            //console.log("adding layer");
            dp.AddLayer(data);
            this.projectParameters[data.group] = data;
          }

          //



        });


        var rootDir = "public\\data\\projects";
        fs.readdir(rootDir,(error,folders)=>{
          if (!error)
          {
            folders.forEach((f)=>
            {
              var filePath = rootDir + "\\" + f;
              fs.stat(filePath,(error,stat)=>
              {
                if (!error && stat.isDirectory && filePath.indexOf('projects.json')==-1) {
                  var dp = new DynamicProject(filePath,f,this,this.messageBus);
                  this.projects[f] = dp;
                  dp.Start();
                }
              });

            });
          }
        });



      }



    }
}

export = DynamicProject;
