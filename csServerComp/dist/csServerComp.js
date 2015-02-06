var CsServerComp;
(function (CsServerComp) {
    var Greeter = (function () {
        function Greeter() {
        }
        Greeter.prototype.sayHello = function () {
            return "Hello";
        };
        return Greeter;
    })();
    CsServerComp.Greeter = Greeter;
})(CsServerComp || (CsServerComp = {}));
