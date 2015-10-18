module ColorExt {
    /** Color utility class */
    export class Utils {

        /**
         * HSV to RGB color conversion.
         *
         * HSV:
         * 		Hue (the actual color between 0 and 360 degrees),
         *   	Saturation between 0 (grey) and 100 (full color),
         *   	Value of Brightness between 0 (black) and 100 white.
         */
        public static hsv2rgb(h, s, v) {
            // adapted from http://schinckel.net/2012/01/10/hsv-to-rgb-in-javascript/
            var rgb, i, data = [];
            if (s === 0) {
                rgb = [v, v, v];
            } else {
                h = h / 60;
                i = Math.floor(h);
                data = [v * (1 - s), v * (1 - s * (h - i)), v * (1 - s * (1 - (h - i)))];
                switch (i) {
                    case 0:
                        rgb = [v, data[2], data[0]];
                        break;
                    case 1:
                        rgb = [data[1], v, data[0]];
                        break;
                    case 2:
                        rgb = [data[0], v, data[2]];
                        break;
                    case 3:
                        rgb = [data[0], data[1], v];
                        break;
                    case 4:
                        rgb = [data[2], data[0], v];
                        break;
                    default:
                        rgb = [v, data[0], data[1]];
                        break;
                }
            }
            return '#' + rgb.map(function(x) {
                return ("0" + Math.round(x * 255).toString(16)).slice(-2);
            }).join('');
        }

        public static toColor(val: number, min: number, max: number, primaryColorHue: number, secondaryColorHue) {
            var h = primaryColorHue + Math.floor(val / (max - min) * (secondaryColorHue - primaryColorHue));
            return Utils.hsv2rgb(h, 1, 1);
        }

        /**
         * Calculate the hue value from a hexadecimal RGB string. Return a value between 0 and 360 degrees
         * equation from: en.wikipedia.org/wiki/Hue#Computing_hue_from_RGB
         */
        public static rgbToHue(rgb: string): number {
            if (!rgb) return;
            if (rgb[0] === '#') rgb = rgb.substr(1);
            if (rgb.length !== 6) {
                console.log("Wrong rgb format: " + rgb);
                return;
            }
            var r = parseInt(rgb.substring(0, 2), 16) / 255;
            var g = parseInt(rgb.substring(2, 4), 16) / 255;
            var b = parseInt(rgb.substring(4, 6), 16) / 255;
            var h = Math.atan2(Math.sqrt(3) * (g - b), 2 * (r - g - b));
            while (h < 0) {h+=(2*Math.PI)};
            while (h >= (2*Math.PI)) {h-=(2*Math.PI)};
            h = (h*180/Math.PI);
            return h;
        }

        /**
         * Convert an R, G and B combination to hexadecimal string (with preceding #)
         * @param  number[] rgb array
         * @return string  hex string
         */
        public static rgbToHex(rgb): string {
            return '#' + rgb.map(function(x) {
                return ("0" + x.toString(16)).slice(-2);
            }).join('');
        }

        public static colorNameToHex(color) {
            var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4","indianred":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"};
            if (typeof colors[color.toLowerCase()] != 'undefined' && colors.hasOwnProperty(color.toLowerCase())) {
                return colors[color.toLowerCase()];
            } else {
                return "#000000";
            }
        }

    }
}
