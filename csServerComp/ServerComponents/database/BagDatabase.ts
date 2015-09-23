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
     * Expect the house number format in NUMBER-LETTER-ADDITION
     */
    private splitAdressNumber(input: string|number){
        var result = {nr: null, letter: null, addition: null};
        if (!input) return result;
        if (typeof input === 'number') {
            result.nr = input;
        } else {
            var splittedAdress = input.split('-');
            if (splittedAdress[0]) {result.nr = this.formatHouseNumber(splittedAdress[0])};
            if (splittedAdress[1]) {result.letter = this.formatHouseLetter(splittedAdress[1])};
            if (splittedAdress[2]) {result.addition = this.formatHouseNumberAddition(splittedAdress[2])};
        }
        return result;
    }

    /**
     * Format the house number such that we keep an actual number, e.g. 1a -> 1.
     */
    private formatHouseNumber(input: string|number): number {
        if (!input) return null;
        if (typeof input === 'number') {
            return input;
        } else {
            var formattedHouseNumber = input.replace(/^\D+|\D.*$/g, "");
            if (!formattedHouseNumber) {
                return null;
            } else {
                return +formattedHouseNumber;
            }
        }
    }

    /**
     * Format the house letter, max 1 character and in uppercase.
     */
    private formatHouseLetter(input: string|number): string {
        if (typeof input === 'string' && input.length > 0) {
            var houseLetter = input.replace(/[^a-zA-Z]+/g, "");
            if (houseLetter) {
                return houseLetter.charAt(0).toUpperCase();
            }
        }
        return null;
    }

    /**
     * Format the housenumber addition and in uppercase.
     */
    private formatHouseNumberAddition(input: string|number): string {
        if (typeof input === 'number') {
            input = (<number>input).toString();
        }
        if (typeof input === 'string' && input.length > 0) {
            var houseNumberAddition = input.replace(/ /g, '').toUpperCase();
            if (houseNumberAddition) {
                return houseNumberAddition;
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
        var splittedAdressNumber = this.splitAdressNumber(houseNumber);
        var houseNr: number = splittedAdressNumber.nr;
        if (!houseNr) {
            console.log('No house number: ' + houseNumber);
            callback(null);
            return;
        }
        var houseLetter: string = splittedAdressNumber.letter;
        var houseNumberAddition: string = splittedAdressNumber.addition;

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
                    sql = `SELECT ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM bagactueel.adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL`;
                    break;
                case IBagOptions.WithBouwjaar:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, pand.bouwjaar as bouwjaar FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr}  AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                case IBagOptions.AddressCountInBuilding:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as _BAG_contour, adres.huisnummer as huisnummer, adres.huisletter as huisletter, adres.huisnummertoevoeging as huisnummertoevoeging, adres.postcode as postcode,	adres.woonplaatsnaam as woonplaatsnaam,	adres.gemeentenaam as gemeentenaam,	adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, (SELECT COUNT(*) FROM (SELECT COUNT(*) FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.pand WHERE pand.identificatie = ( SELECT pand.identificatie FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie LIMIT 1 ) AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' GROUP BY pand.identificatie, verblijfsobjectpand.identificatie ) as tempCount ) as woningen_in_pand FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                case IBagOptions.All:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, adres.huisnummer as huisnummer, adres.huisletter as huisletter, adres.huisnummertoevoeging as huisnummertoevoeging, adres.postcode as postcode,	adres.woonplaatsnaam as woonplaatsnaam,	adres.gemeentenaam as gemeentenaam,	adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject  FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand  WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                default:
                    console.log("Error: Unknown IBagOptions");
                    break;
            }

            // If we have a house letter, add it to the query
            if (houseLetter) {
                sql = sql.replace(/adres\.huisletter\) IS NULL/g, `adres.huisletter)='${houseLetter}'`);
            }

            // If we have a house number addition, add it to the query
            if (houseNumberAddition) {
                sql = sql.replace(/adres\.huisnummertoevoeging\) IS NULL/g, `adres.huisnummertoevoeging)='${houseNumberAddition}'`);
            }

            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find zip: ${zipCode}, houseNumber: ${houseNumber}, letter: ${houseLetter}`);
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
