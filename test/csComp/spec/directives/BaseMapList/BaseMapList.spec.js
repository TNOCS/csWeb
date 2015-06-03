/// <reference path=”../../Scripts/typings/jasmine/jasmine.d.ts”>

'use strict';

describe('baseMapList', function() {
  // load the module
  beforeEach(module('baseMapList'));

  var rootScopeFake;
  var compiledHtml;

  describe('baseMapList unit tests.', () => {
	beforeEach(function() {
    inject(function($rootScope, $window, $compile) {
      var html = "<base-map-list></base-map-list>";

  		rootScopeFake = $rootScope.$new();
      compiledHtml = $compile(html)(rootScopeFake);
      rootScopeFake.$digest();
    })
  });

  describe('initial state', function() {
    it('should have a onrails icon', function() {
      expect(compiledHtml.html()).toContain('leftpanel-header');
    });
  });
});
