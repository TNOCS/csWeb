require('rootpath')();
import express = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import pg = require('pg');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');

/**
 * Export a connection to the BAG database.
 */
class BagDatabase {
    private connectionString: string;

    constructor(config: ConfigurationService) {
        this.connectionString = process.env.DATABASE_URL || config["bagConnectionString"];
        //console.log("Poolsize: " + pg.defaults.poolSize);
        pg.defaults.poolSize = 10;
        console.log("BAG connection: " + this.connectionString);
        console.log("Poolsize: " + pg.defaults.poolSize);
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

    private formatHouseLetter(houseNumber: string|number): string {
        if (typeof houseNumber === 'string') {
            var houseLetter = houseNumber.replace(/[^a-zA-Z]+/g, "");
            if (houseLetter) {
                return houseLetter.charAt(0);
            }
        }
        return null;
    }

    public lookupBagArea(bounds: string, callback: (areas: Location[]) => void) {
        if (!bounds) {
            console.log('No valid bounds supplied');
            callback(null);
            return;
        }
        pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            //var sql = `SELECT ST_AsGeoJSON(ST_Transform(geovlak, 4326)) as area FROM ${sqlTable} WHERE ${sqlColumn}='${name}'`;
            var sql = `SELECT adres.postcode, adres.huisnummer, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour, pand.bouwjaar FROM adres, pand, verblijfsobjectpand WHERE adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND ST_Within(pand.geovlak, ST_Transform(ST_GeomFromGeoJSON('${bounds}'),28992))`

            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find areas in bounds: ${bounds}`);
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
        var houseLetter: string = this.formatHouseLetter(houseNumber);

        pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }

            //var sql = `SELECT openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, gemeentenaam, provincienaam, ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNumber}`;
            var sql: string;
            switch (bagOptions) {
                case IBagOptions.OnlyCoordinates:
                    sql = `SELECT ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM bagactueel.adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr}`;
                    break;
                case IBagOptions.WithBouwjaar:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, pand.bouwjaar as bouwjaar FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr}  AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                case IBagOptions.AddressCountInBuilding:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, adres.huisnummer as huisnummer, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour, adres.huisletter as huisletter,	adres.huisnummertoevoeging as huisnummertoevoeging,	adres.postcode as postcode,	adres.woonplaatsnaam as woonplaatsnaam,	adres.gemeentenaam as gemeentenaam,	adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, (SELECT COUNT(*) FROM (SELECT COUNT(*) FROM bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.pand WHERE pand.identificatie = ( SELECT pand.identificatie FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie LIMIT 1 ) AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' GROUP BY pand.identificatie, verblijfsobjectpand.identificatie ) as tempCount ) as woningen_in_pand FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                case IBagOptions.All:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, adres.huisnummer as huisnummer,	adres.huisletter as huisletter,	adres.huisnummertoevoeging as huisnummertoevoeging,	adres.postcode as postcode,	adres.woonplaatsnaam as woonplaatsnaam,	adres.gemeentenaam as gemeentenaam,	adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject  FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand  WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                default:
                    console.log("Error: Unknown IBagOptions");
                    break;
            }

            // If we have a house letter, add it to the query
            if (houseLetter) {
                sql.replace(/adres\.huisnummer=\${houseNr}/g, "adres.huisnummer=${houseNr} AND adres.huisletter=${houseLetter} ");
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

    private indexes(source: string, find: string) {
        if (!source) return [];
        var result: number[] = [];
        for (var i = 0; i < source.length; i++) {
            if (source.substr(i, find.length) === find) result.push(i);
        }
        return result;
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
