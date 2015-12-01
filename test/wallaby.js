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

        debug: false,

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
