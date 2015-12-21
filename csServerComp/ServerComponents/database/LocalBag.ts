import fs = require('fs');
import path = require('path');
import sqlite3 = require('sqlite3');
import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');

/**
 * Export a connection to the BAG database.
 */
export class LocalBag {
    private connectionString: string;
    private db: sqlite3.Database;

    constructor(path: string) {
        this.connectionString = path;//process.env.DATABASE_URL || config["bagConnectionString"];
        console.log('Opening db ' + this.connectionString);
        this.db = new sqlite3.Database(this.connectionString, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log('Error Opening Database ' + err.message);
            } else {
                console.log('Opened BAG db');
            }
        });

        //console.log("Poolsize: " + pg.defaults.poolSize);
        // console.log("BAG connection: " + this.connectionString);
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
    private splitAdressNumber(input: string|number) {
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
        console.log('Function not implemented');
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

        //var sql = `SELECT openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, gemeentenaam, provincienaam, ST_X(ST_Transform(geopunt, 4326)) as lon, ST_Y(ST_Transform(geopunt, 4326)) as lat FROM adres WHERE adres.postcode='${zipCode}' AND adres.huisnummer=${houseNumber}`;
        var sql: string;
        switch (bagOptions) {
            default:
                sql = `SELECT * from bagactueel WHERE postcode='${zipCode}' AND huisnummer=${houseNr} AND upper(huisletter)='' AND upper(huisnummertoevoeging)=''`;
                break;
        }

        // If we have a house letter, add it to the query
        if (houseLetter) {
            sql = sql.replace(/huisletter\)\=\'\'/g, `huisletter)='${houseLetter}'`);
        }

        // If we have a house number addition, add it to the query
        if (houseNumberAddition) {
            sql = sql.replace(/huisnummertoevoeging\)\=\'\'/g, `huisnummertoevoeging)='${houseNumberAddition}'`);
        }

        this.db.get(sql, (err, row) => {
            if (err) {
                console.log('SQL: Could not find address: ' + zipCode + ' ' + houseNumber);
            } else {
                callback([row]);
            }
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
}
