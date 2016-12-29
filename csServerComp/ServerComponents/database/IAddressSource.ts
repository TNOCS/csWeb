import IBagOptions = require('../database/IBagOptions');
import ConfigurationService = require('../configuration/ConfigurationService');
import express = require('express');

export interface IAddressSource {
    init(): void;
    searchAddress(query: string, limit: number, callback: (searchResults) => void): void;
    searchGemeente(query: string, limit: number, callback: (searchResults) => void): void;
    lookupBagArea(bounds: string, isArea: boolean, callback: Function);
    lookupBagBuurt(bounds: string, isArea: boolean, callback: Function);
    lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: Function);
}