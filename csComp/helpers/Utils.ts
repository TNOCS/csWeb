module csComp {
    export enum FileType {
        Js, Css
    }

    export class Utils {
        static loadedFiles: string[] = [];

        static twoDigitStr(v: Number) {
            var s: string;
            s = v.toString();
            if (s.length === 1) {
                s = '0' + s;
            }
            return (s)
        };


        /**
        * Load a JavaScript or CSS file dynamically by adding it to the end of the HEAD section in your document.
        * See also: http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
        */
        static loadJsCssfile(filename: string, filetype: FileType, callback?: (evt: Event) => void) {
            if (Utils.loadedFiles.indexOf(filename) > 0) return;
            Utils.loadedFiles.push(filename);
            switch (filetype) {
                case FileType.Js:
                    var fileRef = document.createElement('script')
                    fileRef.setAttribute("type", "text/javascript")
                    fileRef.setAttribute("src", filename)
                    if (callback) {
                        fileRef.onload = (evt: Event) => {
                            callback(evt);
                        }
                    }
                    document.getElementsByTagName("head")[0].appendChild(fileRef)
                    break;
                case FileType.Css:
                    var linkRef = document.createElement("link")
                    linkRef.setAttribute("rel", "stylesheet")
                    linkRef.setAttribute("type", "text/css")
                    linkRef.setAttribute("href", filename)
                    if (callback) {
                        linkRef.onload = (evt: Event) => {
                            callback(evt);
                        }
                    }
                    document.getElementsByTagName("head")[0].appendChild(linkRef)
                    break;
            }
        }
    }
}
