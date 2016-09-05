import express = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');

/**
 * Export a connection to the BAG database.
 */
export class BagDatabase {
    private connectionString: string;
    private isInitialized: boolean = false;
    private pg;

    constructor(config: ConfigurationService.ConfigurationService) {
        this.connectionString = process.env.DATABASE_URL || config["bagConnectionString"];
    }

    public init() {
        this.pg = require('pg');
        if (this.isInitialized) return;
        this.pg.defaults.poolSize = 10;
        console.log("BAG connection: " + this.connectionString);
        console.log("Poolsize: " + this.pg.defaults.poolSize);
        this.isInitialized = true;
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
    private splitAdressNumber(input: string | number) {
        var result = { nr: null, letter: null, addition: null };
        if (!input) return result;
        if (typeof input === 'number') {
            result.nr = input;
        } else {
            var splittedAdress = input.split('-');
            if (splittedAdress[0]) { result.nr = this.formatHouseNumber(splittedAdress[0]) };
            if (splittedAdress[1]) { result.letter = this.formatHouseLetter(splittedAdress[1]) };
            if (splittedAdress[2]) { result.addition = this.formatHouseNumberAddition(splittedAdress[2]) };
        }
        return result;
    }

    /**
     * Format the house number such that we keep an actual number, e.g. 1a -> 1.
     */
    private formatHouseNumber(input: string | number): number {
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
    private formatHouseLetter(input: string | number): string {
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
    private formatHouseNumberAddition(input: string | number): string {
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

    public searchAddress(query: string, limit: number = 15, callback: (searchResults) => void) {
        if (!query) {
            console.log('No valid query supplied');
            callback(null);
            return;
        }
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            // var sql = `SELECT ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326))) as location, adres.openbareruimtenaam as straatnaam, adres.huisnummer as huisnummer, adres.huisletter as huisletter, adres.huisnummertoevoeging as huisnummertoevoeging, adres.woonplaatsnaam as woonplaatsnaam FROM bagactueel.adres WHERE textsearchable_adres @@ to_tsquery('dutch', '${query}') ORDER BY adres.openbareruimtenaam, adres.woonplaatsnaam, adres.huisnummer LIMIT ${limit}`;
            // var sql = `WITH q_adr as ( SELECT DISTINCT ON (adres.openbareruimtenaam) openbareruimtenaam, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326))) as location, concat(left(adres.huisletter, 0), 'Adres') as description, concat(adres.openbareruimtenaam, ' ', adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, ', ', adres.woonplaatsnaam) as title FROM bagactueel.adres WHERE textsearchable_adres @@ to_tsquery('dutch', '${query}') ORDER BY adres.openbareruimtenaam, adres.woonplaatsnaam, adres.huisnummer LIMIT ${limit - 1} ) SELECT q_adr.* FROM q_adr UNION ALL (SELECT '' as dummy, ST_AsGeoJSON(ST_Force_2D(ST_Transform(gemeente.geovlak, 4326))) as location, 'Gemeente' as description, gemeente.gemeentenaam FROM bagactueel.gemeente WHERE lower(gemeente.gemeentenaam) LIKE '${query}%' ORDER BY gemeentenaam ) LIMIT ${limit}`
            var sql = `WITH q_gem as (SELECT gemeente.gemeentenaam, 0.99 as score, ST_AsGeoJSON(ST_Force_2D(ST_Transform(gemeente.geovlak, 4326))) as location, concat('Gemeente') as description, gemeente.gemeentenaam as title FROM bagactueel.gemeente WHERE lower(gemeente.gemeentenaam) LIKE '${query}%' ORDER BY gemeentenaam LIMIT ${limit}) SELECT q_gem.* FROM q_gem UNION ALL( SELECT DISTINCT ON (adres.openbareruimtenaam) openbareruimtenaam, 0.98 as score, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326))) as location, concat(left(adres.huisletter, 0), 'Adres') as description, concat(adres.openbareruimtenaam, ' ', adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, ', ', adres.woonplaatsnaam) as title FROM bagactueel.adres WHERE NOT EXISTS (SELECT * FROM q_gem) AND textsearchable_adres @@ to_tsquery('dutch', '${query}') ORDER BY adres.openbareruimtenaam, adres.woonplaatsnaam, adres.huisnummer ) LIMIT ${limit}`
            // console.log(sql);
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find address with query: ${query}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }
    
    public searchGemeente(query: string, limit: number = 10, callback: (searchResults) => void) {
        if (!query) {
            console.log('No valid query supplied');
            callback(null);
            return;
        }
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            var sql = `SELECT gemeente.gemeentenaam, 1.0 as score, ST_AsGeoJSON(ST_Force_2D(ST_Transform(gemeente.geovlak, 4326))) as location, concat('Gemeente') as description, gemeente.gemeentenaam as title FROM bagactueel.gemeente WHERE lower(gemeente.gemeentenaam) LIKE '${query}%' ORDER BY gemeentenaam LIMIT ${limit}`
            // console.log(sql);
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find gemeente with query: ${query}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

    public lookupBagArea(bounds: string, isArea: boolean, callback: (areas: Location[]) => void) {
        if (!bounds) {
            console.log('No valid bounds supplied');
            callback(null);
            return;
        }
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            var sql;
            if (isArea) {
                sql = `SELECT DISTINCT ON (pand.identificatie) pand.identificatie as pandid, pand.woningen_in_pand, pand.niet_woningen_in_pand, pand.icon, adres.postcode, adres.openbareruimtenaam, adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, adres.woonplaatsnaam, adres.gemeentenaam, adres.buurtnaam, adres.wijknaam, adres.wijkcode, adres.buurtcode, pand.pandtype, pand.lift, pand.plint, pand.bouwjaar, pand.pandhoogte, pand.ster_0, pand.ster_1,pand.ster_2,pand.ster_3,pand.ster_4,pand.ster_5, pand.ster_onb, pand.pandoppervlakte, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, verblijfsobjectpand.gerelateerdpand, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326)), 6, 0) as latlon, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour FROM bagactueel.adres, bagactueel.pand, bagactueel.verblijfsobject, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel WHERE adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobject.identificatie = verblijfsobjectpand.identificatie AND (verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik' OR verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik (niet ingemeten)') AND ST_Within(pand.geovlak, ST_Transform(ST_GeomFromGeoJSON('${bounds}'),28992)) ORDER BY pand.identificatie, pand.documentdatum DESC LIMIT 10000`
            } else {
                sql = `SELECT DISTINCT ON (pand.identificatie) pand.identificatie as pandid, pand.woningen_in_pand, pand.niet_woningen_in_pand, pand.icon, adres.postcode, adres.openbareruimtenaam, adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, adres.woonplaatsnaam, adres.gemeentenaam, adres.buurtnaam, adres.wijknaam, adres.wijkcode, adres.buurtcode, adres.leeftijd_bewoner, adres.eigendom, adres.verhuurder, adres.corporatie, pand.pandtype, pand.lift, pand.plint, pand.lift_oz, pand.plint_oz, pand.bouwjaar, pand.pandhoogte, pand.ster_0, pand.ster_1,pand.ster_2,pand.ster_3,pand.ster_4,pand.ster_5, pand.ster_onb, pand.pandoppervlakte, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, verblijfsobjectpand.gerelateerdpand, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326)), 6, 0) as latlon, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour FROM bagactueel.adres, bagactueel.pand, bagactueel.verblijfsobject, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel WHERE adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobject.identificatie = verblijfsobjectpand.identificatie AND (verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik' OR verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik (niet ingemeten)') AND adres.buurtcode = '${bounds}' ORDER BY pand.identificatie, pand.documentdatum DESC`
            }
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find areas in bounds/with property: ${bounds}. \n sql: ${sql}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

    public lookupBagBuurt(bounds: string, isArea: boolean, callback: (areas: Location[]) => void) {
        if (!bounds) {
            console.log('No valid bounds supplied');
            callback(null);
            return;
        }
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            var sql;
            if (isArea) {
                sql = `SELECT bu_naam, bu_code, gm_naam, gm_code, aant_inw, woningen, woz, p_1gezw, p_mgezw, p_koopwon,p_huurwon, p_huko_onb, ster_0, ster_1, ster_2, ster_3, ster_4, ster_5, ster_onb, ster_totaal, ST_AsGeoJSON(ST_Force_2D(ST_Transform(geom, 4326)), 6, 0) as contour FROM bagactueel.buurt_2014 WHERE ST_Intersects(geom, ST_Transform(ST_GeomFromGeoJSON('${bounds}'),28992)) AND aant_inw > 0 LIMIT 1000`;
            } else {
                sql = `SELECT bu_naam, bu_code, gm_naam, gm_code, aant_inw, woningen, woz, p_1gezw, p_mgezw, p_koopwon,p_huurwon, p_huko_onb, ster_0, ster_1, ster_2, ster_3, ster_4, ster_5, ster_onb, ster_totaal, ST_AsGeoJSON(ST_Force_2D(ST_Transform(geom, 4326)), 6, 0) as contour FROM bagactueel.buurt_2014 WHERE gm_code = '${bounds}' AND aant_inw > 0 LIMIT 1000`;
            }
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find buurten in bounds/with property: ${bounds}`);
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

        this.pg.connect(this.connectionString, (err, client, done) => {
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
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as _BAG_contour, adres.huisnummer as huisnummer, adres.huisletter as huisletter, adres.huisnummertoevoeging as huisnummertoevoeging, adres.postcode as postcode,    adres.woonplaatsnaam as woonplaatsnaam, adres.gemeentenaam as gemeentenaam, adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, (SELECT COUNT(*) FROM (SELECT COUNT(*) FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.pand WHERE pand.identificatie = ( SELECT pand.identificatie FROM bagactueel.adres, bagactueel.verblijfsobjectpand, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie LIMIT 1 ) AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' GROUP BY pand.identificatie, verblijfsobjectpand.identificatie ) as tempCount ) as woningen_in_pand FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
                    break;
                case IBagOptions.All:
                    sql = `SELECT ST_X(ST_Transform(adres.geopunt, 4326)) as lon, ST_Y(ST_Transform(adres.geopunt, 4326)) as lat, adres.huisnummer as huisnummer, adres.huisletter as huisletter, adres.huisnummertoevoeging as huisnummertoevoeging, adres.postcode as postcode, adres.woonplaatsnaam as woonplaatsnaam, adres.gemeentenaam as gemeentenaam, adres.provincienaam as provincienaam, pand.bouwjaar as bouwjaar, pand.identificatie as pandidentificatie, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as _BAG_contour FROM bagactueel.adres, bagactueel.verblijfsobjectgebruiksdoel, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobject, bagactueel.pand  WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNr} AND upper(adres.huisletter) IS NULL AND upper(adres.huisnummertoevoeging) IS NULL AND adres.adresseerbaarobject = verblijfsobject.identificatie AND adres.adresseerbaarobject = verblijfsobjectgebruiksdoel.identificatie AND adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectpand.gerelateerdpand = pand.identificatie`;
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
    public lookupAddress(req: express.Request, res: express.Response): void {
        var zipCode: string = this.formatZipCode(req.params.zip);
        if (!zipCode) {
            res.send(400, 'zip code is missing');
            return;
        }
        var houseNumber: number = this.formatHouseNumber(req.params.number);
        if (!houseNumber) {
            res.send(400, 'house number is missing');
            return;
        }

        this.pg.connect(this.connectionString, (err, client, done) => {
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
