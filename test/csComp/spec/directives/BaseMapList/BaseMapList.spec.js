/// <reference path=”../../Scripts/typings/jasmine/jasmine.d.ts”>

'use strict';

describe('baseMapList', function() {

  // load the module
  beforeEach(module('csWebApp'));
  beforeEach(module('BaseMapList'));

  it('Should not fail', function() {
    expect(1 == 1).toBeTruthy();
  });

  // var rootScopeFake;
  // var compiledHtml;
  //
  // debugger
  //
  // describe('BaseMapList unit tests.', function() {
  //
  //
  // 	beforeEach(function() {
  //     inject(function($rootScope, $compile) {
  //       var html = "<base-map-list></base-map-list>";
  //
  //   		rootScopeFake = $rootScope.$new();
  //       compiledHtml = $compile(html)(rootScopeFake);
  //       rootScopeFake.$digest();
  //     })
  //   });
  //
  //   describe('initial state', function() {
  //     it('should have leftpanel-header', function() {
  //       expect(compiledHtml.html()).toContain('leftpanel-header');
  //     });
  //   });
  // });
});
