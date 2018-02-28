import express = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');
import IAddressSource = require('../database/IAddressSource');
import _ = require('underscore');

/**
 * Export a connection to the BAG database.
 */
export class BagDatabase implements IAddressSource.IAddressSource {
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

    public searchGemeenteAtLocation(query: string, limit: number = 10, callback: (searchResults) => void) {
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
            var sql = `SELECT gemeente.gemeentenaam, gemeente.gemeentecode FROM bagactueel.gemeente WHERE ST_Within(ST_Transform(ST_GeomFromGeoJSON('${query}'),28992), gemeente.geovlak) LIMIT ${limit}`;
            // console.log(sql);
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find gemeente with query: ${sql}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

     public searchGemeenteWithBuCode(query: string, limit: number = 10, callback: (searchResults) => void) {
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
            var sql = `SELECT gm_naam AS gemeentenaam, gm_code AS gemeentecode FROM bagactueel.buurt_2014 WHERE bu_code = '${query}' LIMIT ${limit}`;
            // console.log(sql);
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find gemeente with query: ${sql}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

    public searchBuurtAtLocation(query: string, limit: number = 10, callback: (searchResults) => void) {
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
            var sql = `SELECT buurt_2014.bu_naam, buurt_2014.bu_code FROM bagactueel.buurt_2014 WHERE ST_Within(ST_Transform(ST_GeomFromGeoJSON('${query}'),28992), buurt_2014.geom) LIMIT ${limit}`;
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find buurt with query: ${sql}`);
                    callback(null);
                } else {
                    callback(result.rows);
                }
            });
        });
    }

    public searchPandAtLocation(coords: string, limit: number = 10, callback: (searchResults) => void) {
        if (!coords) {
            console.log('No valid coords supplied');
            callback(null);
            return;
        }
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                callback(null);
                return;
            }
            var sql = `SELECT pand.identificatie FROM bagactueel.pand WHERE ST_Within(ST_Transform(ST_GeomFromGeoJSON('${coords}'),28992), pand.geovlak) LIMIT ${limit}`;
            client.query(sql, (err, result) => {
                done();
                if (err) {
                    console.log(err);
                    console.log(`Cannot find buurt with query: ${sql}`);
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
                sql = `SELECT DISTINCT ON (pand.identificatie) pand.identificatie as pandid, pand.woningen_in_pand, pand.niet_woningen_in_pand, pand.icon, adres.postcode, adres.openbareruimtenaam, adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, adres.woonplaatsnaam, adres.gemeentenaam, adres.buurtnaam, adres.wijknaam, adres.wijkcode, adres.buurtcode, adres.leeftijd_bewoner, adres.eigendom, adres.verhuurder, adres.corporatie, pand.pandtype, pand.lift, pand.plint, pand.lift_oz, pand.plint_oz, pand.bouwjaar, pand.pandhoogte, pand.ster_0, pand.ster_1,pand.ster_2,pand.ster_3,pand.ster_4,pand.ster_5, pand.ster_onb, pand.ster_in_ond, pand.pandoppervlakte, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, verblijfsobjectpand.gerelateerdpand, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326)), 6, 0) as latlon, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour FROM bagactueel.adres, bagactueel.pand, bagactueel.verblijfsobject, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel WHERE adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobject.identificatie = verblijfsobjectpand.identificatie AND (verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik' OR verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik (niet ingemeten)') AND ST_Within(pand.geovlak, ST_Transform(ST_GeomFromGeoJSON('${bounds}'),28992)) ORDER BY pand.identificatie, pand.documentdatum DESC LIMIT 10000`
            } else {
                sql = `SELECT DISTINCT ON (pand.identificatie) pand.identificatie as pandid, pand.woningen_in_pand, pand.niet_woningen_in_pand, pand.icon, adres.postcode, adres.openbareruimtenaam, adres.huisnummer, adres.huisletter, adres.huisnummertoevoeging, adres.woonplaatsnaam, adres.gemeentenaam, adres.buurtnaam, adres.wijknaam, adres.wijkcode, adres.buurtcode, adres.leeftijd_bewoner, adres.eigendom, adres.verhuurder, adres.corporatie, pand.pandtype, pand.lift, pand.plint, pand.lift_oz, pand.plint_oz, pand.bouwjaar, pand.pandhoogte, pand.ster_0, pand.ster_1,pand.ster_2,pand.ster_3,pand.ster_4,pand.ster_5, pand.ster_onb, pand.ster_in_ond, pand.pandoppervlakte, verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject as gebruiksdoelverblijfsobject, verblijfsobject.oppervlakteverblijfsobject as oppervlakteverblijfsobject, verblijfsobjectpand.gerelateerdpand, ST_AsGeoJSON(ST_Force_2D(ST_Transform(adres.geopunt, 4326)), 6, 0) as latlon, ST_AsGeoJSON(ST_Force_2D(ST_Transform(pand.geovlak, 4326)), 6, 0) as contour FROM bagactueel.adres, bagactueel.pand, bagactueel.verblijfsobject, bagactueel.verblijfsobjectpand, bagactueel.verblijfsobjectgebruiksdoel WHERE adres.adresseerbaarobject = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.identificatie = verblijfsobjectpand.identificatie AND verblijfsobjectgebruiksdoel.gebruiksdoelverblijfsobject = 'woonfunctie' AND verblijfsobjectpand.gerelateerdpand = pand.identificatie AND verblijfsobject.identificatie = verblijfsobjectpand.identificatie AND (verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik' OR verblijfsobject.verblijfsobjectstatus = 'Verblijfsobject in gebruik (niet ingemeten)') AND adres.buurtcode = '${bounds}' ORDER BY pand.identificatie, pand.documentdatum DESC`
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
                sql = `SELECT bu_naam, bu_code, gm_naam, gm_code, gm_code_2015, aant_inw, woningen, woz, p_1gezw, p_mgezw, p_koopwon,p_huurwon, p_huko_onb,
                 ster_0, ster_1, ster_2, ster_3, ster_4, ster_5, ster_onb, ster_in_ond, ster_totaal, lb_situ,lb_score,dim_won,dim_bev,dim_voorz,dim_veil,
                 dim_fys,afs_adl,afs_harts,afs_apo,afs_super,afs_wnkl,afs_ziek_in,afs_ziek_ex,wdruk_ha,mantelz,afs_trein,afs_adl_int,p_65_eo_jr, 
                 ST_AsGeoJSON(ST_Force_2D(ST_Transform(geom, 4326)), 6, 0) as contour FROM bagactueel.buurt_2014 
                 WHERE ST_Intersects(geom, ST_Transform(ST_GeomFromGeoJSON('${bounds}'),28992)) AND aant_inw > 0 LIMIT 1000`;
            } else {
                sql = `SELECT bu_naam, bu_code, gm_naam, gm_code, gm_code_2015, aant_inw, woningen, woz, p_1gezw, p_mgezw, p_koopwon,p_huurwon, p_huko_onb,
                 ster_0, ster_1, ster_2, ster_3, ster_4, ster_5, ster_onb, ster_in_ond, ster_totaal,lb_situ,lb_score,dim_won,dim_bev,dim_voorz,dim_veil,
                 dim_fys,afs_adl,afs_harts,afs_apo,afs_super,afs_wnkl,afs_ziek_in,afs_ziek_ex,wdruk_ha,mantelz,afs_trein,afs_adl_int,p_65_eo_jr,
                 ST_AsGeoJSON(ST_Force_2D(ST_Transform(geom, 4326)), 6, 0) as contour FROM bagactueel.buurt_2014 
                 WHERE gm_code_2015 = '${bounds}' AND aant_inw > 0 LIMIT 1000`;
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

    public exportBuurten(req: express.Request, res: express.Response) {
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                res.send(400, 'Could not connect to database');
                return;
            }
            var sql = `select gm.gemeentenaam,gm.gemeentecode,bu.gm_code_2015 as gm_code, wk_code,bu_naam,bu_code,gm.aant_inw as a_inw_gm, bu.aant_inw as a_inw_bu, gm.ster_totaal as tot_won_vrd_gm, bu.ster_totaal as tot_won_vrd_bu,
gm.ster_0 as gm_ster_0,gm.ster_1 as gm_ster_1, gm.ster_2 as gm_ster_2, gm.ster_3 as gm_ster_3, gm.ster_4 as gm_ster_4, gm.ster_5 as gm_ster_5, gm.ster_in_ond as gm_ster_ster_in_ond,
gm.ster_onb as gm_ster_ster_onb, 
bu.ster_0 as bu_ster_0,bu.ster_1 as bu_ster_1, bu.ster_2 as bu_ster_2, bu.ster_3 as bu_ster_3, bu.ster_4 as bu_ster_4, bu.ster_5 as bu_ster_5, bu.ster_in_ond as bu_ster_ster_in_ond,
bu.ster_onb as bu_ster_ster_onb, gm.a_huurwon as aant_huurw_gm, bu.p_huurwon as perc_huurw_bu, bu.p_65_eo_jr as perc_65eo_bu
from bagactueel.gemeente gm, bagactueel.buurt_2014 bu
where bu.gm_code_2015 = concat('GM',lpad(gm.gemeentecode::text, 4, '0'))
order by gemeentenaam, bu_naam`;

            client.query(sql, (err, result) => {
                done();
                if (err || !result || !result.rows || result.rows.length < 1) {
                    console.log(err);
                    res.send(400, 'Cannot get buurten');
                } else {
                    let header = Object.keys(result.rows[0]).join(';');
                    let rows = [header];
                    result.rows.forEach((r) => {
                        let row = _.values(r).join(';');
                        rows.push(row);
                    })
                    res.setHeader('Content-Type', 'text/plain');
                    res.setHeader('Content-Disposition', 'attachment; filename="export_buurten.csv"');
                    res.send(rows.join('\n'));
                }
            });
        });
    }

    public exportGemeenten(req: express.Request, res: express.Response) {
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                res.send(400, 'Could not connect to database');
                return;
            }
            var sql = `select gm.gemeentenaam,gm.gemeentecode, concat('GM',lpad(gm.gemeentecode::text, 4, '0')) as gm_code, gm.ster_totaal as tot_won_vrd_gm,
gm.ster_0 as gm_ster_0,gm.ster_1 as gm_ster_1, gm.ster_2 as gm_ster_2, gm.ster_3 as gm_ster_3, gm.ster_4 as gm_ster_4, gm.ster_5 as gm_ster_5, gm.ster_in_ond as gm_ster_ster_in_ond,
gm.ster_onb as gm_ster_ster_onb, gm.a_huurwon as aant_huurw_gm, gm.a_koopwon as aant_koopw_gm, gm.a_huko_onb as aant_huko_onbek_gm, gm.a_1gezw as aant_1gezw_gm, gm.a_mgezw as aant_mgezw_gm, gm.aant_inw as aant_inw_gm from bagactueel.gemeente gm order by gemeentenaam`;

            client.query(sql, (err, result) => {
                done();
                if (err || !result || !result.rows || result.rows.length < 1) {
                    console.log(err);
                    res.send(400, 'Cannot get buurten');
                } else {
                    let header = Object.keys(result.rows[0]).join(';');
                    let rows = [header];
                    result.rows.forEach((r) => {
                        let row = _.values(r).join(';');
                        rows.push(row);
                    })
                    res.setHeader('Content-Type', 'text/plain');
                    res.setHeader('Content-Disposition', 'attachment; filename="export_gemeenten.csv"');
                    res.send(rows.join('\n'));
                }
            });
        });
    }

    public exportWijken(req: express.Request, res: express.Response) {
        this.pg.connect(this.connectionString, (err, client, done) => {
            if (err) {
                console.log(err);
                res.send(400, 'Could not connect to database');
                return;
            }
            var sql = `select wk.wk_naam, wk.wk_code, wk.gm_code_2015 as gm_code, gm.gemeentenaam as gm_naam, wk.ster_totaal as tot_won_vrd_wk,
wk.ster_0 as wk_ster_0,wk.ster_1 as wk_ster_1, wk.ster_2 as wk_ster_2, wk.ster_3 as wk_ster_3, wk.ster_4 as wk_ster_4, wk.ster_5 as wk_ster_5, wk.ster_in_ond as wk_ster_ster_in_ond,
wk.ster_onb as wk_ster_ster_onb, wk.a_huurwon as aant_huurw_wk, wk.a_koopwon as aant_koopw_wk, wk.a_huko_onb as aant_huko_onbek_wk, wk.a_1gezw as aant_1gezw_wk, wk.a_mgezw as aant_mgezw_wk, wk.aant_inw as aant_inw_wk from bagactueel.wijk_2014 wk, bagactueel.gemeente gm where wk.water = 'NEE' and concat('GM',lpad(gm.gemeentecode::text, 4, '0')) = wk.gm_code_2015 order by wk_code`;

            client.query(sql, (err, result) => {
                done();
                if (err || !result || !result.rows || result.rows.length < 1) {
                    console.log(err);
                    res.send(400, 'Cannot get wijken');
                } else {
                    let header = Object.keys(result.rows[0]).join(';');
                    let rows = [header];
                    result.rows.forEach((r) => {
                        let row = _.values(r).join(';');
                        rows.push(row);
                    })
                    res.setHeader('Content-Type', 'text/plain');
                    res.setHeader('Content-Disposition', 'attachment; filename="export_wijken.csv"');
                    res.send(rows.join('\n'));
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
