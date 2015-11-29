module.exports = function (w) {

    console.log(w);

    return {
        files: [
            { pattern: 'bower_components/csWeb-dep.js', instrument: false },
            { pattern: 'bower_components/angularUtils-pagination/dirPagination.js', instrument: false },
            { pattern: 'bower_components/csComp.js', instrument: true },
            { pattern: 'csComp/app.js', instrument: false },
            { pattern: 'bower_components/csTemplates.js', instrument: true },
            { pattern: 'bower_components/angular-mocks/angular-mocks.js', instrument: false },
            { pattern: 'csComp/mock/**/*.js', instrument: true }
        ],

        tests: [
            // 'csComp/mock/**/*.ts',
            'csComp/spec/**/*.ts'
        ],

        debug: true,

        // env: {
        //     type: 'node'
        // },

        compilers: {
            '**/*.ts': w.compilers.typeScript({
                target: 1, // ES5
                module: 1, // CommonJS
                declaration: false,
                noImplicitAny: false,
                removeComments: true,
                noLib: false,
                preserveConstEnums: true,
                suppressImplicitAnyIndexErrors: true
            })
        }//,

        // bootstrap: function (w) {
        //     if (!Function.prototype.bind) {
        //         Function.prototype.bind = function (oThis) {
        //             if (typeof this !== 'function') {
        //                 // closest thing possible to the ECMAScript 5
        //                 // internal IsCallable function
        //                 throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        //             }

        //             var aArgs = Array.prototype.slice.call(arguments, 1),
        //                 fToBind = this,
        //                 fNOP = function () { },
        //                 fBound = function () {
        //                     return fToBind.apply(this instanceof fNOP && oThis
        //                         ? this
        //                         : oThis,
        //                         aArgs.concat(Array.prototype.slice.call(arguments)));
        //                 };

        //             // test this.prototype in case of native functions binding:
        //             if (this.prototype)
        //                 fNOP.prototype = this.prototype;
        //             fBound.prototype = new fNOP();

        //             return fBound;
        //         };
        //     }
        // }
        // TypeScript compiler is on by default with default options,
        // you can configure built-in compiler by passing options to it
        // See interface CompilerOptions in
        // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/types.ts
        //compilers: {
        //  '**/*.ts': w.compilers.typeScript({})
        //}
        

    };
};

            // '../csComp/includes/bower_dep/bower_components/jquery/dist/jquery.min.js',
            // '../csComp/includes/bower_dep/bower_components/bootstrap/dist/js/bootstrap.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular/angular.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-cookies/angular-cookies.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-translate/angular-translate.min.js',
            // '../csComp/includes/bower_dep/bower_components/leaflet/dist/leaflet.js',
            // '../csComp/includes/bower_dep/bower_components/leaflet.locatecontrol/src/L.Control.Locate.js',
            // '../csComp/includes/bower_dep/bower_components/leaflet-ajax/dist/leaflet.ajax.min.js',
            // '../csComp/includes/bower_dep/bower_components/leaflet.markercluster/dist/leaflet.markercluster.js',
            // '../csComp/includes/bower_dep/bower_components/angular-bootstrap/ui-bootstrap.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-sanitize/angular-sanitize.min.js',
            // '../csComp/includes/bower_dep/bower_components/ui-select/dist/select.min.js',
            // '../csComp/includes/bower_dep/bower_components/chroma-js/chroma.min.js',
            // '../csComp/includes/bower_dep/bower_components/d3/d3.min.js',
            // '../csComp/includes/bower_dep/bower_components/d3-tip/index.js',
            // '../csComp/includes/bower_dep/bower_components/crossfilter/crossfilter.min.js',
            // '../csComp/includes/bower_dep/bower_components/async/dist/async.min.js',
            // '../csComp/includes/bower_dep/bower_components/jquery-ui/jquery-ui.min.js',
            // '../csComp/includes/bower_dep/bower_components/underscore/underscore-min.js',
            // '../csComp/includes/bower_dep/bower_components/moment/min/moment.min.js',
            // '../csComp/includes/bower_dep/bower_components/interact/dist/interact.min.js',
            // '../csComp/includes/bower_dep/bower_components/angular-animate/angular-animate.min.js',
            // '../csComp/includes/js/angular-spectrum-colorpicker.min.js',
            // '../csComp/includes/js/angular-moment.min.js',
            // '../csComp/includes/js/d3_bulletChart.js',
            // '../csComp/includes/js/spectrum.min.js',
            // '../csComp/includes/js/dashboard.min.js',
            // '../csComp/includes/js/datetime-picker.js',
            // '../csComp/includes/js/dc.min.js',
            // '../csComp/includes/js/jquery.cookies.min.js',
            // '../csComp/includes/js/jqueryinjectCSS.min.js',
            // '../csComp/includes/js/locationfilter.min.js',
            // '../csComp/includes/js/pnotify.custom.min.js',
            // '../csComp/includes/js/Polyline.encoded.min.js',
            // '../csComp/includes/js/stringformat-1.09.min.min.js',
            // '../csComp/includes/js/stringformat.nl-NL.min.js',
            // '../csComp/includes/js/togeojson.min.js',
            // '../csComp/includes/js/timeline.min.js',
            // '../csComp/includes/js/vega.min.js',
            // '../csComp/includes/js/vega-lite.min.js',
            // '../csComp/includes/js/vega-embed.min.js',
            // '../csComp/includes/js/wizMarkdown.min.js',
            // '../csComp/includes/js/xbbcode.min.js',
