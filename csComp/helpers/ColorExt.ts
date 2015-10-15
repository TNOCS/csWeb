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
            var h = primaryColorHue + Math.floor(val/(max-min) * (secondaryColorHue - primaryColorHue));
            return Utils.hsv2rgb(h, 1, 1);
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
    }
}
