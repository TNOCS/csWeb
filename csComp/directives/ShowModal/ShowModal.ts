module ShowModal {
    /**
    * Config
    */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;

    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

/**
  * Directive to show a modal dialog, whose html is specified inside the main HTML code.
  * Typical usage: http://plnkr.co/edit/WJBp7A6M3RB1MLERDXSS?p=info
  * angular.module('myWebApp', ['csWeb.showModal'])
  */
    myModule.directive('showModal', [
        '$parse',
        function($parse: ng.IParseService): ng.IDirective {
            return {
                restrict: "A",
                link: function(scope: any, element: any, attrs: any) {
                    //Hide or show the modal
                    scope.showModalDialog = (visible, elem) => {
                        if (!elem)
                            elem = element;
                        var myElem: any = $(elem);

                        if (visible)
                            myElem.appendTo('body').modal("show");
                        else
                            myElem.modal("hide");
                    }

                    //Watch for changes to the modal-visible attribute
                    scope.$watch(attrs.showModal, (newValue, oldValue) => {
                        scope.showModalDialog(newValue, attrs.$$element);
                    });

                    //Update the visible value when the dialog is closed through UI actions (Ok, cancel, etc.)
                    $(element).bind("hide.bs.modal", () => {
                        $parse(attrs.showModal).assign(scope, false);
                        if (!scope.$$phase && !scope.$root.$$phase)
                            scope.$apply();
                    });
                }

            };
        }
    ]);
}
