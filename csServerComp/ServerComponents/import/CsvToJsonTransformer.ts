import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

var splitStream = require("split");

class CsvToJsonTransformer implements transform.ITransform {
    id:          string;
    description: string;
    type = "CsvToJsonTransformer";
    headers:string[] = null;
    /**
     * Accepted input types.
     */
    inputDataTypes:  transform.InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes: transform.OutputDataType[];

    //create?(opt?: ITransformFactoryOptions[]): stream.Readable | stream.Writable | stream.Transform;

    constructor(public title: string) {
        this.id = Utils.newGuid();
        //this.description = description;
    }

    initialize(){
      this.headers = ["Registerletter","Dossiernummer","Subdossiernummer","Vestigingsnummer","Handelsnaam","adres","pc_plaats","adres_CA", "pc_plaats_CA", "Handelsnaam1x2x30", "Handelsnaam2x2x30", "Handelsnaam1x45", "postcode", "postcode_CA", "BeherendKamer-nummer", "GeografischKamer-nummer", "BoekjaarDeponeringJaarstuk", "DatumOpheffing", "DatumOprichting", "DatumVestiging", "DatumVestigingHuidigAdres", "Domeinnaam", "HoofdzaakFiliaalIndicatie", "IndicatieEconomischActief","NonMailingindicator", "Rechtsvorm", "RSIN", "Telefoonnummer", "gemeentecode", "HoofdactiviteitenCode", "NevenactiviteitenCode1", "NevenactiviteitenCode2", "HoofdactiviteitenOmschrijving", "HandelsnaamVolledig", "VennootschapnaamVolledig", "straat", "huisnummer", "toevoeging", "postcode", "woonplaats", "straat_CA", "huisnummer_CA", "toevoeging_CA", "postcode_CA", "woonplaats_CA"];
    }

    create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
      var t = new stream.Transform();
      /*stream.Transform.call(t);*/

      var split = -1;
      var headers :string[] = this.headers;

      t.setEncoding("utf8");
      t._transform = (chunk, encoding, done) => {
          // console.log("##### CTJT #####");
          // console.log(chunk.toString("utf8"));

          var line :string= chunk.toString("utf8");

          if (!line || line.trim() == "") {
            console.log("Empty line, ignore");
            done();
            return;
          }

          var lineMod = line.slice(1, line.length-1);
          var fields = lineMod.split(/\",\"/);
          // console.log(line);

          if (!headers) {
            headers = [];
            fields.forEach(f=>{
              headers.push(f);
            });

            // console.log(headers);
            done();
          }
          else {
            var obj:any = {properties:{}};

            headers.forEach(h=>{
              var hIndex = headers.indexOf(h);
              obj.properties[h] = fields[hIndex];
            })

            // console.log(obj);
            t.push(JSON.stringify(obj));
            done();
          }
        }

    //var s = splitStream().pipe(t);

    return t;
  }

}
export=CsvToJsonTransformer;
