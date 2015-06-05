require('rootpath')();
import express              = require('express');
import ConfigurationService = require('ServerComponents/configuration/ConfigurationService');
import pg                   = require('pg');
import Location             = require('./Location');
import IBagOptions          = require('../database/IBagOptions');

/**
 * Export a connection to the BAG database.
 */
class BagDatabase {
    private connectionString: string;

    constructor(config: ConfigurationService) {
        this.connectionString = process.env.DATABASE_URL || config["bagConnectionString"];
        (<any>pg).defaults.poolSize = 20;
    }

    /**
     * Format the zip code so spaces are removed and the letters are all capitals.
     */
    private formatZipCode(zipCode: string) {
        if (!zipCode)
            return null;
        var formattedZipCode = zipCode.replace(/ /g, '').toUpperCase();
        if (formattedZipCode.length < 6)
            return;

        if (formattedZipCode.length == 6) {
            return formattedZipCode;
        } else {
            return null;
        }
    }

    /**
     * Format the house number such that we keep an actual number, e.g. 1a -> 1.
     */
    private formatHouseNumber(houseNumber: string|number): number {
        if (!houseNumber) return null;
        if (typeof houseNumber === 'number') {
            return houseNumber;
        } else {
            var formattedHouseNumber = houseNumber.replace(/^\D+|\D.*$/g, "");
            if (!formattedHouseNumber) {
                return null;
            } else {
                return +formattedHouseNumber;
            }
        }
	}

  public lookupBagArea(sqlTable: string, sqlColumn: string, name: string, callback: (coordinates: JSON[]) => void) {
    if (!name) {
        console.log('No area with name: ' + name);
        callback(null);
        return;
    }
    pg.connect(this.connectionString, (err, client, done) => {
        if (err) {
            console.log(err);
            callback(null);
            return;
        }
        //var sql = `SELECT openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, gemeentenaam, provincienaam, ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNumber}`;
        var sql = `SELECT ST_AsGeoJSON(ST_Transform(geovlak, 4326)) as area FROM ${sqlTable} WHERE ${sqlColumn}='${name}'`;
        client.query(sql, (err, result) => {
            done();
            if (err) {
                console.log(err);
                console.log(`Cannot find province: ${name}`);
                callback(null);
            } else {
                callback(result.rows);
            }
        });
    });
  }

    /**
     * Lookup the address from the BAG.
     */
    public lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: (addresses: Location[]) => void) {
        var zipCode: string = this.formatZipCode(zip);
        if (!zipCode) {
            console.log('No zip code: ' + zip);
            callback(null);
            return;
        }
        var houseNr: number = this.formatHouseNumber(houseNumber);
        if (!houseNr) {
            console.log('No house number: ' + houseNumber);
            callback(null);
            return;
        }

        pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            //var sql = `SELECT openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, gemeentenaam, provincienaam, ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNumber}`;
            var sql;
            switch (bagOptions) {
              case IBagOptions.OnlyCoordinates:
                  sql = `SELECT ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM bagactueel.adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr}`;
                  break;
              case IBagOptions.WithBouwjaar:
                  sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, pand.bouwjaar as bouwjaar FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr}  AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                  break;
              case IBagOptions.All:
                  sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat,	adres.huisnummer as huisnummer,	adres.huisletter as huisletter,	adres.huisnummertoevoeging as huisnummertoevoeging,	adres.postcode as postcode,	adres.woonplaatsnaam as woonplaatsnaam,	adres.gemeentenaam as gemeentenaam,	adres.provincienaam as provincienaam,	pand.bouwjaar as bouwjaar,	pand.identificatie as pandidentificatie,	verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject,	verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject  FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand  WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                  break;
              default:
                  console.log("Error: Unknown IBagOptions");
                  break;
            }
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find zip: ${zipCode}, houseNumber: ${houseNumber}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

    /**
     * Lookup the address from the BAG.
     */
    public lookupAddress(req: express.Request, res: express.Response) {
        var zipCode: string = this.formatZipCode(req.params.zip);
        if (!zipCode) return res.send(400, 'zip code is missing');
        var houseNumber: number = this.formatHouseNumber(req.params.number);
        if (!houseNumber) return res.send(400, 'house number is missing');

        pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                return;
            }
            var sql = `SELECT openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, gemeentenaam, provincienaam, ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNumber}`;
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(`Cannot find zip: ${zipCode}, houseNumber: ${houseNumber}`);
                    return;
                }
                res.json(result.rows);
            });
        });
    }
}
export = BagDatabase;
