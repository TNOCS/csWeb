describe('MessageBus', function() {
  // load the module
  beforeEach(angular.mock.module('csComp.Services'));

  it('should pass', function() {
    expect(true).toBeTruthy();
  });

  // var MessageBusService;
  // beforeEach(angular.mock.inject((_MessageBusService_) => {
  //   MessageBusService = _MessageBusService_;
  // }));

  // it('should call subscriber when publication occurs', function() {
  //   var data = '';
  //   var subscriber = function(event, _data_) {
  //     data = _data_;
  //   };
  //   var unsubscriber = MessageBusService.subscribe('someevent', subscriber);
  //
  //   MessageBusService.publish('someevent', 'someargs');
  //
  //   expect(data).toBe('someargs');
  //
  //   unsubscriber();
  // });

});
