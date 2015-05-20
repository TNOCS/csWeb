//require('rootpath')();
import express       = require('express')
import ClientConnection = require('ClientConnection');
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


    constructor(public folder : string, public id, public service : DynamicProjectService )
    {

    }

    public Start()
    {
      // load project file
      this.openFile();

      // watch directory changes for new geojson files
      this.watchFolder();


      // setup http handler
      this.service.server.get("/project/" + this.id,(req,res)=>{this.GetLayer(req,res);});

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
                  console.log("ProjectID: " + this.project.id);
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
      watcher.on('unlink', (path)=> { this.removeLayer(path); });
    }

    public removeLayer(file : string)
    {
      var p = <any>path;
      var pp = p.parse(file);
      if (pp.base === "project.json") return;

      // determine group
      var groupTitle = pp.dir.toLowerCase().replace(this.folder.toLowerCase(),"").replace("\\","");
      if (groupTitle === "") return;

      // check if group exists
      var gg = this.project.groups.filter((element:any)=>(element!=null && element.title && element.title.toLowerCase() == groupTitle));
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
      var groupTitle = pp.dir.toLowerCase().replace(this.folder.toLowerCase(),"").replace("\\","");
      if (groupTitle === "") return;

      // check if group exists
      var gg = this.project.groups.filter((element:any)=>(element!=null && element.title && element.title.toLowerCase() == groupTitle));
      var g : any = {};
      if (gg.length>0)
      {
        g = gg[0];
      }
      else
      {
      //  var g : any; //new csComp.Services.ProjectGroup();
        g.id = groupTitle;
        g.title = groupTitle;
        g.layers = [];
        g.styles = [];
        g.oneLayerActive = false;
        this.project.groups.push(g);
      }

      var layer : any = {};
      layer.id = file;
      layer.title = pp.name.split('_').join(' ');
      layer.type = "geojson";
      layer.url = "data/projects/" + this.id + "/" + g.title + "/" + pp.base;
      layer.groupId = g.title;
      g.layers.push(layer);
      console.log("project id:" + this.project.id);
      this.service.connection.sendUpdate(this.project.id,"project","layer-update",[layer]);

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

      public constructor(public server : express.Express, public connection : ClientConnection.ConnectionManager)
      {

      }

      public Start(server: express.Express)
      {
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
                  var dp = new DynamicProject(filePath,f,this);
                  this.projects[f] = dp;
                  dp.Start();
                }
              });

            });
          }
        });
        console.log("Start project service");

      }



    }
}

export = DynamicProject;
