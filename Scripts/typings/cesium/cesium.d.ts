declare module 'cesium/Promise' {
    export default class Promise<T>
    {
        constructor(doneHandler?: (obj: T) => void, errorHandler?: (obj: any) => void)
        then(result: T);
    }
}
declare module 'cesium/when' {
    import Promise from 'cesium/Promise'
    //import Promise from 'cesium/Promise'
    function when<T>(promise: Promise<T>, succes: (result) => void, fail: (result) => void): void
    export default when;
}
declare module 'cesium/Core/BingMapsApi' {
    export default class BingMapsApi {
        constructor();
        //Members
        static defaultKey: string


        //Methods

    }

}
declare module 'cesium/Core/fromRandomOptions' {
    interface fromRandomOptions {
        red?: number;
        minimumRed?: number;
        maximumRed?: number;
        green?: number;
        minimumGreen?: number;
        maximumGreen?: number;
        blue?: number;
        minimumBlue?: number;
        maximumBlue?: number;
        alpha?: number;
        minimumAlpha?: number;
        maximumAlpha?: number;
    }
    export default fromRandomOptions
}
declare module 'cesium/Core/Color' {
    import Cartesian4 from 'cesium/Core/Cartesian4'
    import fromRandomOptions from 'cesium/Core/fromRandomOptions'
    export default class Color {
        constructor(red?: number, green?: number, blue?: number, alpha?: number);
        //Members
        static ALICEBLUE: Color
        static ANTIQUEWHITE: Color
        static AQUA: Color
        static AQUAMARINE: Color
        static AZURE: Color
        static BEIGE: Color
        static BISQUE: Color
        static BLACK: Color
        static BLANCHEDALMOND: Color
        static BLUE: Color
        static BLUEVIOLET: Color
        static BROWN: Color
        static BURLYWOOD: Color
        static CADETBLUE: Color
        static CHARTREUSE: Color
        static CHOCOLATE: Color
        static CORAL: Color
        static CORNFLOWERBLUE: Color
        static CORNSILK: Color
        static CRIMSON: Color
        static CYAN: Color
        static DARKBLUE: Color
        static DARKCYAN: Color
        static DARKGOLDENROD: Color
        static DARKGRAY: Color
        static DARKGREEN: Color
        static DARKGREY: Color
        static DARKKHAKI: Color
        static DARKMAGENTA: Color
        static DARKOLIVEGREEN: Color
        static DARKORANGE: Color
        static DARKORCHID: Color
        static DARKRED: Color
        static DARKSALMON: Color
        static DARKSEAGREEN: Color
        static DARKSLATEBLUE: Color
        static DARKSLATEGRAY: Color
        static DARKSLATEGREY: Color
        static DARKTURQUOISE: Color
        static DARKVIOLET: Color
        static DEEPPINK: Color
        static DEEPSKYBLUE: Color
        static DIMGRAY: Color
        static DIMGREY: Color
        static DODGERBLUE: Color
        static FIREBRICK: Color
        static FLORALWHITE: Color
        static FORESTGREEN: Color
        static FUSCHIA: Color
        static GAINSBORO: Color
        static GHOSTWHITE: Color
        static GOLD: Color
        static GOLDENROD: Color
        static GRAY: Color
        static GREEN: Color
        static GREENYELLOW: Color
        static GREY: Color
        static HONEYDEW: Color
        static HOTPINK: Color
        static INDIANRED: Color
        static INDIGO: Color
        static IVORY: Color
        static KHAKI: Color
        static LAVENDAR_BLUSH: Color
        static LAVENDER: Color
        static LAWNGREEN: Color
        static LEMONCHIFFON: Color
        static LIGHTBLUE: Color
        static LIGHTCORAL: Color
        static LIGHTCYAN: Color
        static LIGHTGOLDENRODYELLOW: Color
        static LIGHTGRAY: Color
        static LIGHTGREEN: Color
        static LIGHTGREY: Color
        static LIGHTPINK: Color
        static LIGHTSEAGREEN: Color
        static LIGHTSKYBLUE: Color
        static LIGHTSLATEGRAY: Color
        static LIGHTSLATEGREY: Color
        static LIGHTSTEELBLUE: Color
        static LIGHTYELLOW: Color
        static LIME: Color
        static LIMEGREEN: Color
        static LINEN: Color
        static MAGENTA: Color
        static MAROON: Color
        static MEDIUMAQUAMARINE: Color
        static MEDIUMBLUE: Color
        static MEDIUMORCHID: Color
        static MEDIUMPURPLE: Color
        static MEDIUMSEAGREEN: Color
        static MEDIUMSLATEBLUE: Color
        static MEDIUMSPRINGGREEN: Color
        static MEDIUMTURQUOISE: Color
        static MEDIUMVIOLETRED: Color
        static MIDNIGHTBLUE: Color
        static MINTCREAM: Color
        static MISTYROSE: Color
        static MOCCASIN: Color
        static NAVAJOWHITE: Color
        static NAVY: Color
        static OLDLACE: Color
        static OLIVE: Color
        static OLIVEDRAB: Color
        static ORANGE: Color
        static ORANGERED: Color
        static ORCHID: Color
        static packedLength: number
        static PALEGOLDENROD: Color
        static PALEGREEN: Color
        static PALETURQUOISE: Color
        static PALEVIOLETRED: Color
        static PAPAYAWHIP: Color
        static PEACHPUFF: Color
        static PERU: Color
        static PINK: Color
        static PLUM: Color
        static POWDERBLUE: Color
        static PURPLE: Color
        static RED: Color
        static ROSYBROWN: Color
        static ROYALBLUE: Color
        static SADDLEBROWN: Color
        static SALMON: Color
        static SANDYBROWN: Color
        static SEAGREEN: Color
        static SEASHELL: Color
        static SIENNA: Color
        static SILVER: Color
        static SKYBLUE: Color
        static SLATEBLUE: Color
        static SLATEGRAY: Color
        static SLATEGREY: Color
        static SNOW: Color
        static SPRINGGREEN: Color
        static STEELBLUE: Color
        static TAN: Color
        static TEAL: Color
        static THISTLE: Color
        static TOMATO: Color
        static TRANSPARENT: Color
        static TURQUOISE: Color
        static VIOLET: Color
        static WHEAT: Color
        static WHITE: Color
        static WHITESMOKE: Color
        static YELLOW: Color
        static YELLOWGREEN: Color
        alpha: number
        blue: number
        green: number
        red: number


        //Methods
        static byteToFloat(number: number): number
        static clone(color: Color, result?: Color): Color
        static equals(left: Color, right: Color): boolean
        static floatToByte(number: number): number
        static fromAlpha(color: Color, alpha: number, result?: Color): Color
        static fromBytes(red?: number, green?: number, blue?: number, alpha?: number, result?: Color): Color
        static fromCartesian4(cartesian: Cartesian4, result?: Color): Color
        static fromCssColorString(color: string): Color
        static fromHsl(hue?: number, saturation?: number, lightness?: number, alpha?: number): Color
        static fromRandom(options?: fromRandomOptions, result?: Color): Color
        static fromRgba(rgba: number): Color
        static pack(value: Color, array: Array<number>, startingIndex?: number): void
        static unpack(array: Array<number>, startingIndex?: number, result?: Color): Color
        brighten(magnitude: number, result: Color): Color
        clone(result?: Color): Color
        darken(magnitude: number, result: Color): Color
        equals(other: Color): boolean
        equalsEpsilon(other: Color, epsilon?: number): boolean
        toBytes(result?: Array<number>): Array<number>
        toCssColorString(): string
        toRgba(): number
        toString(): string
        withAlpha(alpha: number, result?: Color): Color

    }

}
declare module 'cesium/Core/Cartesian4' {
    import Color from 'cesium/Core/Color'
    export default class Cartesian4 {
        constructor(x?: number, y?: number, z?: number, w?: number);
        //Members
        w: number
        x: number
        y: number
        z: number
        static packedLength: number
        static UNIT_W: Cartesian4
        static UNIT_X: Cartesian4
        static UNIT_Y: Cartesian4
        static UNIT_Z: Cartesian4
        static ZERO: Cartesian4


        //Methods
        clone(result?: Cartesian4): Cartesian4
        equals(right?: Cartesian4): boolean
        equalsEpsilon(right?: Cartesian4, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        toString(): string
        static abs(cartesian: Cartesian4, result: Cartesian4): Cartesian4
        static add(left: Cartesian4, right: Cartesian4, result: Cartesian4): Cartesian4
        static clone(cartesian: Cartesian4, result?: Cartesian4): Cartesian4
        static distance(left: Cartesian4, right: Cartesian4): number
        static distanceSquared(left: Cartesian4, right: Cartesian4): number
        static divideByScalar(cartesian: Cartesian4, scalar: number, result: Cartesian4): Cartesian4
        static dot(left: Cartesian4, right: Cartesian4): number
        static equals(left?: Cartesian4, right?: Cartesian4): boolean
        static equalsEpsilon(left?: Cartesian4, right?: Cartesian4, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        static fromArray(array: Array<number>, startingIndex?: number, result?: Cartesian4): Cartesian4
        static fromColor(color: Color, result?: Cartesian4): Cartesian4
        static fromElements(x: number, y: number, z: number, w: number, result?: Cartesian4): Cartesian4
        static lerp(start: Cartesian4, end: Cartesian4, t: number, result: Cartesian4): Cartesian4
        static magnitude(cartesian: Cartesian4): number
        static magnitudeSquared(cartesian: Cartesian4): number
        static maximumByComponent(first: Cartesian4, second: Cartesian4, result: Cartesian4): Cartesian4
        static maximumComponent(cartesian: Cartesian4): number
        static minimumByComponent(first: Cartesian4, second: Cartesian4, result: Cartesian4): Cartesian4
        static minimumComponent(cartesian: Cartesian4): number
        static mostOrthogonalAxis(cartesian: Cartesian4, result: Cartesian4): Cartesian4
        static multiplyByScalar(cartesian: Cartesian4, scalar: number, result: Cartesian4): Cartesian4
        static multiplyComponents(left: Cartesian4, right: Cartesian4, result: Cartesian4): Cartesian4
        static negate(cartesian: Cartesian4, result: Cartesian4): Cartesian4
        static normalize(cartesian: Cartesian4, result: Cartesian4): Cartesian4
        static pack(value: Cartesian4, array: Array<number>, startingIndex?: number): void
        static subtract(left: Cartesian4, right: Cartesian4, result: Cartesian4): Cartesian4
        static unpack(array: Array<number>, startingIndex?: number, result?: Cartesian4): Cartesian4

    }
}
declare module 'cesium/Core/Cartographic' {
    export default class Cartographic {
        constructor(longitude?: number, latitude?: number, height?: number);
        //Members
        static ZERO: Cartographic
        height: number
        latitude: number
        longitude: number


        //Methods
        static clone(cartographic: Cartographic, result?: Cartographic): Cartographic
        static equals(left?: Cartographic, right?: Cartographic): boolean
        static equalsEpsilon(left?: Cartographic, right?: Cartographic, epsilon?: number): boolean
        static fromDegrees(longitude: number, latitude: number, height?: number, result?: Cartographic): Cartographic
        static fromRadians(longitude: number, latitude: number, height?: number, result?: Cartographic): Cartographic
        clone(result?: Cartographic): Cartographic
        equals(right?: Cartographic): boolean
        equalsEpsilon(right?: Cartographic, epsilon?: number): boolean
        toString(): string

    }

}
declare module 'cesium/Core/Ellipsoid' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class Ellipsoid {
        constructor(x?: number, y?: number, z?: number);
        //Members
        static MOON: Ellipsoid
        static packedLength: number
        static UNIT_SPHERE: Ellipsoid
        static WGS84: Ellipsoid
        maximumRadius: number
        minimumRadius: number
        oneOverRadii: Cartesian3
        oneOverRadiiSquared: Cartesian3
        radii: Cartesian3
        radiiSquared: Cartesian3
        radiiToTheFourth: Cartesian3


        //Methods
        static clone(ellipsoid: Ellipsoid, result?: Ellipsoid): Ellipsoid
        static fromCartesian3(radii?: Cartesian3): Ellipsoid
        static pack(value: Ellipsoid, array: Array<number>, startingIndex?: number): void
        static unpack(array: Array<number>, startingIndex?: number, result?: Ellipsoid): Ellipsoid
        cartesianArrayToCartographicArray(cartesians: Array<Cartesian3>, result?: Array<Cartographic>): Array<Cartographic>
        cartesianToCartographic(cartesian: Cartesian3, result?: Cartographic): Cartographic
        cartographicArrayToCartesianArray(cartographics: Array<Cartographic>, result?: Array<Cartesian3>): Array<Cartesian3>
        cartographicToCartesian(cartographic: Cartographic, result?: Cartesian3): Cartesian3
        clone(result?: Ellipsoid): Ellipsoid
        equals(right?: Ellipsoid): boolean
        geocentricSurfaceNormal(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        geodeticSurfaceNormal(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        geodeticSurfaceNormalCartographic(cartographic: Cartographic, result?: Cartesian3): Cartesian3
        scaleToGeocentricSurface(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        scaleToGeodeticSurface(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        toString(): string
        transformPositionFromScaledSpace(position: Cartesian3, result?: Cartesian3): Cartesian3
        transformPositionToScaledSpace(position: Cartesian3, result?: Cartesian3): Cartesian3

    }

}
declare module 'cesium/Core/Spherical' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    export default class Spherical {
        constructor(clock?: number, cone?: number, magnitude?: number);
        //Members


        //Methods
        static clone(spherical: Spherical, result?: Spherical): Spherical
        static equals(left: Spherical, right: Spherical): boolean
        static equalsEpsilon(left: Spherical, right: Spherical, epsilon?: number): boolean
        static fromCartesian3(cartesian3: Cartesian3, spherical?: Spherical): Spherical
        static normalize(spherical: Spherical, result?: Spherical): Spherical
        clone(result?: Spherical): Spherical
        equals(other: Spherical): boolean
        equalsEpsilon(other: Spherical, epsilon: number): boolean
        toString(): string

    }

}
declare module 'cesium/Core/Cartesian3' {
    import Cartesian4 from 'cesium/Core/Cartesian4'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Spherical from 'cesium/Core/Spherical'
    export default class Cartesian3 {
        constructor(x?: number, y?: number, z?: number);
        //Members
        x: number
        y: number
        z: number
        static packedLength: number
        static UNIT_X: Cartesian3
        static UNIT_Y: Cartesian3
        static UNIT_Z: Cartesian3
        static ZERO: Cartesian3


        //Methods
        clone(result?: Cartesian3): Cartesian3
        equals(right?: Cartesian3): boolean
        equalsEpsilon(right?: Cartesian3, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        toString(): string
        static abs(cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static add(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3
        static angleBetween(left: Cartesian3, right: Cartesian3): number
        static clone(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        static cross(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3
        static distance(left: Cartesian3, right: Cartesian3): number
        static distanceSquared(left: Cartesian3, right: Cartesian3): number
        static divideByScalar(cartesian: Cartesian3, scalar: number, result: Cartesian3): Cartesian3
        static dot(left: Cartesian3, right: Cartesian3): number
        static equals(left?: Cartesian3, right?: Cartesian3): boolean
        static equalsEpsilon(left?: Cartesian3, right?: Cartesian3, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        static fromArray(array: Array<number>, startingIndex?: number, result?: Cartesian3): Cartesian3
        static fromCartesian4(cartesian: Cartesian4, result?: Cartesian3): Cartesian3
        static fromDegrees(longitude: number, latitude: number, height?: number, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3
        static fromDegreesArray(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>
        static fromDegreesArrayHeights(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>
        static fromElements(x: number, y: number, z: number, result?: Cartesian3): Cartesian3
        static fromRadians(longitude: number, latitude: number, height?: number, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3
        static fromRadiansArray(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>
        static fromRadiansArrayHeights(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>
        static fromSpherical(spherical: Spherical, result?: Cartesian3): Cartesian3
        static lerp(start: Cartesian3, end: Cartesian3, t: number, result: Cartesian3): Cartesian3
        static magnitude(cartesian: Cartesian3): number
        static magnitudeSquared(cartesian: Cartesian3): number
        static maximumByComponent(first: Cartesian3, second: Cartesian3, result: Cartesian3): Cartesian3
        static maximumComponent(cartesian: Cartesian3): number
        static minimumByComponent(first: Cartesian3, second: Cartesian3, result: Cartesian3): Cartesian3
        static minimumComponent(cartesian: Cartesian3): number
        static mostOrthogonalAxis(cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static multiplyByScalar(cartesian: Cartesian3, scalar: number, result: Cartesian3): Cartesian3
        static multiplyComponents(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3
        static negate(cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static normalize(cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static pack(value: Cartesian3, array: Array<number>, startingIndex?: number): void
        static subtract(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3
        static unpack(array: Array<number>, startingIndex?: number, result?: Cartesian3): Cartesian3

    }

}
declare module 'cesium/Core/Interval' {
    export default class Interval {
        constructor(start?: number, stop?: number);
        //Members
        start: number
        stop: number


        //Methods

    }

}
declare module 'cesium/Core/Rectangle' {
    import Cartographic from 'cesium/Core/Cartographic'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    export default class Rectangle {
        constructor(west?: number, south?: number, east?: number, north?: number);
        //Members
        static MAX_VALUE: Rectangle
        static packedLength: number
        east: number
        height: number
        north: number
        south: number
        west: number
        width: number


        //Methods
        static center(rectangle: Rectangle, result?: Cartographic): Cartographic
        static clone(rectangle: Rectangle, result?: Rectangle): Rectangle
        static computeHeight(rectangle: Rectangle): number
        static computeWidth(rectangle: Rectangle): number
        static contains(rectangle: Rectangle, cartographic: Cartographic): boolean
        static equals(left?: Rectangle, right?: Rectangle): boolean
        static fromCartographicArray(cartographics: Array<Cartographic>, result?: Rectangle): Rectangle
        static fromDegrees(west?: number, south?: number, east?: number, north?: number, result?: Rectangle): Rectangle
        static intersection(rectangle: Rectangle, otherRectangle: Rectangle, result?: Rectangle): Rectangle | void
        static northeast(rectangle: Rectangle, result?: Cartographic): Cartographic
        static northwest(rectangle: Rectangle, result?: Cartographic): Cartographic
        static pack(value: Rectangle, array: Array<number>, startingIndex?: number): void
        static southeast(rectangle: Rectangle, result?: Cartographic): Cartographic
        static southwest(rectangle: Rectangle, result?: Cartographic): Cartographic
        static subsample(rectangle: Rectangle, ellipsoid?: Ellipsoid, surfaceHeight?: number, result?: Array<Cartesian3>): Array<Cartesian3>
        static unpack(array: Array<number>, startingIndex?: number, result?: Rectangle): Rectangle
        static validate(rectangle: Rectangle): void
        clone(result?: Rectangle): Rectangle
        equals(other?: Rectangle): boolean
        equalsEpsilon(other?: Rectangle, epsilon?: number): boolean

    }

}
declare module 'cesium/Core/Intersect' {
    export default class Intersect {
        constructor();
        //Members
        static INSIDE: number
        static INTERSECTING: number
        static OUTSIDE: number


        //Methods

    }

}
declare module 'cesium/Core/Plane' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartesian4 from 'cesium/Core/Cartesian4'
    export default class Plane {
        constructor(normal: Cartesian3, distance: number);
        //Members
        static ORIGIN_XY_PLANE: Plane
        static ORIGIN_YZ_PLANE: Plane
        static ORIGIN_ZX_PLANE: Plane
        distance: number
        normal: Cartesian3


        //Methods
        static fromCartesian4(coefficients: Cartesian4, result?: Plane): Plane
        static fromPointNormal(point: Cartesian3, normal: Cartesian3, result?: Plane): Plane
        static getPointDistance(plane: Plane, point: Cartesian3): number

    }

}
declare module 'cesium/Core/Occluder' {
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Rectangle from 'cesium/Core/Rectangle'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    export default class Occluder {
        constructor(occluderBoundingSphere: BoundingSphere, cameraPosition: Cartesian3);
        //Members
        cameraPosition: Cartesian3
        position: Cartesian3
        radius: number


        //Methods
        static computeOccludeePoint(occluderBoundingSphere: BoundingSphere, occludeePosition: Cartesian3, positions: Array<Cartesian3>): Object
        static computeOccludeePointFromRectangle(rectangle: Rectangle, ellipsoid?: Ellipsoid): Object
        static fromBoundingSphere(occluderBoundingSphere: BoundingSphere, cameraPosition: Cartesian3, result?: Occluder): Occluder
        computeVisibility(occludeeBS: BoundingSphere): number
        isBoundingSphereVisible(occludee: BoundingSphere): boolean
        isPointVisible(occludee: Cartesian3): boolean

    }

}
declare module 'cesium/Core/MapProjection' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class MapProjection {
        constructor();
        //Members
        ellipsoid: Ellipsoid


        //Methods
        project(cartographic: Cartographic, result?: Cartesian3): Cartesian3
        unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic

    }

}
declare module 'cesium/Scene/SceneOptions' {
    import MapProjection from 'cesium/Core/MapProjection'
    interface SceneOptions {
        canvas: HTMLCanvasElement;
        contextOptions?: Object;
        creditContainer?: Element;
        mapProjection?: MapProjection;
        orderIndependentTranslucency?: boolean;
        scene3DOnly?: boolean;
    }
    export default SceneOptions;
}
declare module 'cesium/Core/Event' {
    export default class Event {
        constructor();
        //Members
        numberOfListeners: number


        //Methods
        addEventListener(listener: (() => void), scope?: any): any
        raiseEvent(args: any): void
        removeEventListener(listener: (() => void), scope?: any): boolean

    }

}
declare module 'cesium/Core/Credit' {
    export default class Credit {
        constructor(text?: string, imageUrl?: string, link?: string);
        //Members
        imageUrl: string
        link: string
        text: string


        //Methods
        static equals(left: Credit, right: Credit): boolean
        equals(credits: Credit): boolean
        hasImage(): boolean
        hasLink(): boolean

    }

}
declare module 'cesium/Core/DefaultProxy' {
    export default class DefaultProxy {
        constructor(proxy: string);
        //Members


        //Methods
        getURL(resource: string): string

    }

}
declare module 'cesium/Scene/TileDiscardPolicy' {
    export default class TileDiscardPolicy {
        constructor();
        //Members


        //Methods
        isReady(): boolean
        shouldDiscardImage(image: HTMLImageElement): boolean

    }

}
declare module 'cesium/Core/Cartesian2' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartesian4 from 'cesium/Core/Cartesian4'
    export default class Cartesian2 {
        constructor(x?: number, y?: number);
        //Members
        x: number
        y: number
        static packedLength: number
        static UNIT_X: Cartesian2
        static UNIT_Y: Cartesian2
        static ZERO: Cartesian2


        //Methods
        clone(result?: Cartesian2): Cartesian2
        equals(right?: Cartesian2): boolean
        equalsEpsilon(right?: Cartesian2, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        toString(): string
        static abs(cartesian: Cartesian2, result: Cartesian2): Cartesian2
        static add(left: Cartesian2, right: Cartesian2, result: Cartesian2): Cartesian2
        static angleBetween(left: Cartesian2, right: Cartesian2): number
        static clone(cartesian: Cartesian2, result?: Cartesian2): Cartesian2
        static distance(left: Cartesian2, right: Cartesian2): number
        static distanceSquared(left: Cartesian2, right: Cartesian2): number
        static divideByScalar(cartesian: Cartesian2, scalar: number, result: Cartesian2): Cartesian2
        static dot(left: Cartesian2, right: Cartesian2): number
        static equals(left?: Cartesian2, right?: Cartesian2): boolean
        static equalsEpsilon(left?: Cartesian2, right?: Cartesian2, relativeEpsilon?: number, absoluteEpsilon?: number): boolean
        static fromArray(array: Array<number>, startingIndex?: number, result?: Cartesian2): Cartesian2
        static fromCartesian3(cartesian: Cartesian3, result?: Cartesian2): Cartesian2
        static fromCartesian4(cartesian: Cartesian4, result?: Cartesian2): Cartesian2
        static fromElements(x: number, y: number, result?: Cartesian2): Cartesian2
        static lerp(start: Cartesian2, end: Cartesian2, t: number, result: Cartesian2): Cartesian2
        static magnitude(cartesian: Cartesian2): number
        static magnitudeSquared(cartesian: Cartesian2): number
        static maximumByComponent(first: Cartesian2, second: Cartesian2, result: Cartesian2): Cartesian2
        static maximumComponent(cartesian: Cartesian2): number
        static minimumByComponent(first: Cartesian2, second: Cartesian2, result: Cartesian2): Cartesian2
        static minimumComponent(cartesian: Cartesian2): number
        static mostOrthogonalAxis(cartesian: Cartesian2, result: Cartesian2): Cartesian2
        static multiplyByScalar(cartesian: Cartesian2, scalar: number, result: Cartesian2): Cartesian2
        static multiplyComponents(left: Cartesian2, right: Cartesian2, result: Cartesian2): Cartesian2
        static negate(cartesian: Cartesian2, result: Cartesian2): Cartesian2
        static normalize(cartesian: Cartesian2, result: Cartesian2): Cartesian2
        static pack(value: Cartesian2, array: Array<number>, startingIndex?: number): void
        static subtract(left: Cartesian2, right: Cartesian2, result: Cartesian2): Cartesian2
        static unpack(array: Array<number>, startingIndex?: number, result?: Cartesian2): Cartesian2

    }

}
declare module 'cesium/Core/TilingScheme' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import MapProjection from 'cesium/Core/MapProjection'
    import Rectangle from 'cesium/Core/Rectangle'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class TilingScheme {
        constructor();
        //Members
        ellipsoid: Ellipsoid
        projection: MapProjection
        rectangle: Rectangle


        //Methods
        getNumberOfXTilesAtLevel(level: number): number
        getNumberOfYTilesAtLevel(level: number): number
        positionToTileXY(position: Cartographic, level: number, result?: Cartesian2): Cartesian2
        rectangleToNativeRectangle(rectangle: Rectangle, result?: Rectangle): Rectangle
        tileXYToNativeRectangle(x: number, y: number, level: number, result?: any): Rectangle
        tileXYToRectangle(x: number, y: number, level: number, result?: any): Rectangle

    }

}
declare module 'cesium/Scene/ImageryLayerFeatureInfo' {
    import Cartographic from 'cesium/Core/Cartographic'
    export default class ImageryLayerFeatureInfo {
        constructor();
        //Members
        data: Object
        description: string
        name: string
        position: Cartographic


        //Methods
        configureDescriptionFromProperties(properties: any): void
        configureNameFromProperties(properties: any): void

    }

}
declare module 'cesium/Scene/ImageryProvider' {
    import Credit from 'cesium/Core/Credit'
    import Event from 'cesium/Core/Event'
    import DefaultProxy from 'cesium/Core/DefaultProxy'
    import Rectangle from 'cesium/Core/Rectangle'
    import TileDiscardPolicy from 'cesium/Scene/TileDiscardPolicy'
    import TilingScheme from 'cesium/Core/TilingScheme'
    import Promise from 'cesium/Promise'
    import ImageryLayerFeatureInfo from 'cesium/Scene/ImageryLayerFeatureInfo'
    export default class ImageryProvider {
        constructor();
        //Members
        credit: Credit
        defaultAlpha: number
        defaultBrightness: number
        defaultContrast: number
        defaultGamma: number
        defaultHue: number
        defaultSaturation: number
        errorEvent: Event
        hasAlphaChannel: boolean
        maximumLevel: number
        minimumLevel: number
        proxy: DefaultProxy
        ready: boolean
        rectangle: Rectangle
        tileDiscardPolicy: TileDiscardPolicy
        tileHeight: number
        tileWidth: number
        tilingScheme: TilingScheme


        //Methods
        static loadImage(url: string): Promise<HTMLImageElement | HTMLCanvasElement> | void
        getTileCredits(x: number, y: number, level: number): Array<Credit>
        pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<Array<ImageryLayerFeatureInfo>> | void
        requestImage(x: number, y: number, level: number): Promise<HTMLImageElement | HTMLCanvasElement> | void

    }

}
declare module 'cesium/Scene/ImageryLayerOptions' {
    import Rectangle from 'cesium/Core/Rectangle'
    interface ImageryLayerOptions {
        rectangle?: Rectangle;
        alpha?: number | (() => void);
        brightness?: number | (() => void);
        contrast?: number | (() => void);
        hue?: number | (() => void);
        saturation?: number | (() => void);
        gamma?: number | (() => void);
        show?: boolean;
        maximumAnisotropy?: number;
        minimumTerrainLevel?: number;
        maximumTerrainLevel?: number;
    }
    export default ImageryLayerOptions
}
declare module 'cesium/Scene/ImageryLayer' {
    import ImageryProvider from 'cesium/Scene/ImageryProvider'
    import ImageryLayerOptions from 'cesium/Scene/ImageryLayerOptions'
    import Rectangle from 'cesium/Core/Rectangle'
    export default class ImageryLayer {
        constructor(imageryProvider: ImageryProvider, options?: ImageryLayerOptions);
        //Members
        static DEFAULT_BRIGHTNESS: number
        static DEFAULT_CONTRAST: number
        static DEFAULT_GAMMA: number
        static DEFAULT_HUE: number
        static DEFAULT_SATURATION: number
        alpha: number
        brightness: number
        contrast: number
        gamma: number
        hue: number
        imageryProvider: ImageryProvider
        rectangle: Rectangle
        saturation: number
        show: boolean


        //Methods
        destroy(): void
        isBaseLayer(): boolean
        isDestroyed(): boolean

    }

}
declare module 'cesium/Core/Ray' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    export default class Ray {
        constructor(origin?: Cartesian3, direction?: Cartesian3);
        //Members
        direction: Cartesian3
        origin: Cartesian3


        //Methods
        static getPoint(ray: Ray, t: number, result?: Cartesian3): Cartesian3

    }

}
declare module 'cesium/Scene/ImageryLayerCollection' {
    import Event from 'cesium/Core/Event'
    import ImageryLayer from 'cesium/Scene/ImageryLayer'
    import ImageryProvider from 'cesium/Scene/ImageryProvider'
    import ImageryLayerFeatureInfo from 'cesium/Scene/ImageryLayerFeatureInfo'
    import Promise from 'cesium/Promise'
    import Ray from 'cesium/Core/Ray'
    import Scene from 'cesium/Scene/Scene'
    export default class ImageryLayerCollection {
        constructor();
        //Members
        layerAdded: Event
        layerMoved: Event
        layerRemoved: Event
        layerShownOrHidden: Event
        length: number


        //Methods
        add(layer: ImageryLayer, index?: number): void
        addImageryProvider(imageryProvider: ImageryProvider, index?: number): ImageryLayer
        contains(layer: ImageryLayer): boolean
        destroy(): void
        get(index: number): void
        indexOf(layer: ImageryLayer): number
        isDestroyed(): boolean
        lower(layer: ImageryLayer): void
        lowerToBottom(layer: ImageryLayer): void
        pickImageryLayerFeatures(ray: Ray, scene: Scene): Promise<Array<ImageryLayerFeatureInfo>> | void
        raise(layer: ImageryLayer): void
        raiseToTop(layer: ImageryLayer): void
        remove(layer: ImageryLayer, destroy?: boolean): boolean
        removeAll(destroy?: boolean): void

    }

}
declare module 'cesium/Core/Quaternion' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Matrix3 from 'cesium/Core/Matrix3'
    export default class Quaternion {
        constructor(x?: number, y?: number, z?: number, w?: number);
        //Members
        static IDENTITY: Quaternion
        static packedInterpolationLength: number
        static packedLength: number
        static ZERO: Quaternion
        w: number
        x: number
        y: number
        z: number


        //Methods
        static add(left: Quaternion, right: Quaternion, result: Quaternion): Quaternion
        static clone(quaternion: Quaternion, result?: Quaternion): Quaternion
        static computeAngle(quaternion: Quaternion): number
        static computeAxis(quaternion: Quaternion, result: Cartesian3): Cartesian3
        static computeInnerQuadrangle(q0: Quaternion, q1: Quaternion, q2: Quaternion, result: Quaternion): Quaternion
        static conjugate(quaternion: Quaternion, result: Quaternion): Quaternion
        static convertPackedArrayForInterpolation(packedArray: Array<number>, startingIndex?: number, lastIndex?: number, result?: Array<number>): void
        static divideByScalar(quaternion: Quaternion, scalar: number, result: Quaternion): Quaternion
        static dot(left: Quaternion, right: Quaternion): number
        static equals(left?: Quaternion, right?: Quaternion): boolean
        static equalsEpsilon(left?: Quaternion, right?: Quaternion, epsilon?: number): boolean
        static exp(cartesian: Cartesian3, result: Quaternion): Quaternion
        static fastSlerp(start: Quaternion, end: Quaternion, t: number, result: Quaternion): Quaternion
        static fastSquad(q0: Quaternion, q1: Quaternion, s0: Quaternion, s1: Quaternion, t: number, result: Quaternion): Quaternion
        static fromAxisAngle(axis: Cartesian3, angle: number, result?: Quaternion): Quaternion
        static fromHeadingPitchRoll(heading: number, pitch: number, roll: number, result?: Quaternion): Quaternion
        static fromRotationMatrix(matrix: Matrix3, result?: Quaternion): Quaternion
        static inverse(quaternion: Quaternion, result: Quaternion): Quaternion
        static lerp(start: Quaternion, end: Quaternion, t: number, result: Quaternion): Quaternion
        static log(quaternion: Quaternion, result: Cartesian3): Cartesian3
        static magnitude(quaternion: Quaternion): number
        static magnitudeSquared(quaternion: Quaternion): number
        static multiply(left: Quaternion, right: Quaternion, result: Quaternion): Quaternion
        static multiplyByScalar(quaternion: Quaternion, scalar: number, result: Quaternion): Quaternion
        static negate(quaternion: Quaternion, result: Quaternion): Quaternion
        static normalize(quaternion: Quaternion, result: Quaternion): Quaternion
        static pack(value: Quaternion, array: Array<number>, startingIndex?: number): void
        static slerp(start: Quaternion, end: Quaternion, t: number, result: Quaternion): Quaternion
        static squad(q0: Quaternion, q1: Quaternion, s0: Quaternion, s1: Quaternion, t: number, result: Quaternion): Quaternion
        static subtract(left: Quaternion, right: Quaternion, result: Quaternion): Quaternion
        static unpack(array: Array<number>, startingIndex?: number, result?: Quaternion): Quaternion
        static unpackInterpolationResult(array: Array<number>, sourceArray: Array<number>, startingIndex?: number, lastIndex?: number, result?: Quaternion): Quaternion
        clone(result?: Quaternion): Quaternion
        equals(right?: Quaternion): boolean
        equalsEpsilon(right?: Quaternion, epsilon?: number): boolean
        toString(): string

    }

}
declare module 'cesium/Core/Matrix3' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Quaternion from 'cesium/Core/Quaternion'
    export default class Matrix3 {
        constructor(column0Row0?: number, column1Row0?: number, column2Row0?: number, column0Row1?: number, column1Row1?: number, column2Row1?: number, column0Row2?: number, column1Row2?: number, column2Row2?: number);
        //Members
        static COLUMN0ROW0: number
        static COLUMN0ROW1: number
        static COLUMN0ROW2: number
        static COLUMN1ROW0: number
        static COLUMN1ROW1: number
        static COLUMN1ROW2: number
        static COLUMN2ROW0: number
        static COLUMN2ROW1: number
        static COLUMN2ROW2: number
        static IDENTITY: Matrix3
        static packedLength: number
        static ZERO: Matrix3


        //Methods
        clone(result?: Matrix3): Matrix3
        equals(right?: Matrix3): boolean
        equalsEpsilon(right?: Matrix3, epsilon?: number): boolean
        toString(): string
        static abs(matrix: Matrix3, result: Matrix3): Matrix3
        static add(left: Matrix3, right: Matrix3, result: Matrix3): Matrix3
        static clone(matrix: Matrix3, result?: Matrix3): Matrix3
        static computeEigenDecomposition(matrix: Matrix3, result?: any): Object
        static determinant(matrix: Matrix3): number
        static equals(left?: Matrix3, right?: Matrix3): boolean
        static equalsEpsilon(left?: Matrix3, right?: Matrix3, epsilon?: number): boolean
        static fromArray(array: Array<number>, startingIndex?: number, result?: Matrix3): Matrix3
        static fromColumnMajorArray(values: Array<number>, result?: Matrix3): Matrix3
        static fromCrossProduct(the: Cartesian3, result?: Matrix3): Matrix3
        static fromQuaternion(quaternion: Quaternion, result?: Matrix3): Matrix3
        static fromRotationX(angle: number, result?: Matrix3): Matrix3
        static fromRotationY(angle: number, result?: Matrix3): Matrix3
        static fromRotationZ(angle: number, result?: Matrix3): Matrix3
        static fromRowMajorArray(values: Array<number>, result?: Matrix3): Matrix3
        static fromScale(scale: Cartesian3, result?: Matrix3): Matrix3
        static fromUniformScale(scale: number, result?: Matrix3): Matrix3
        static getColumn(matrix: Matrix3, index: number, result: Cartesian3): Cartesian3
        static getElementIndex(row: number, column: number): number
        static getMaximumScale(matrix: Matrix3): number
        static getRow(matrix: Matrix3, index: number, result: Cartesian3): Cartesian3
        static getScale(matrix: Matrix3, result: Cartesian3): Cartesian3
        static inverse(matrix: Matrix3, result: Matrix3): Matrix3
        static multiply(left: Matrix3, right: Matrix3, result: Matrix3): Matrix3
        static multiplyByScalar(matrix: Matrix3, scalar: number, result: Matrix3): Matrix3
        static multiplyByScale(matrix: Matrix3, scale: Cartesian3, result: Matrix3): Matrix3
        static multiplyByVector(matrix: Matrix3, cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static negate(matrix: Matrix3, result: Matrix3): Matrix3
        static pack(value: Matrix3, array: Array<number>, startingIndex?: number): void
        static setColumn(matrix: Matrix3, index: number, cartesian: Cartesian3, result: Matrix3): Matrix3
        static setRow(matrix: Matrix3, index: number, cartesian: Cartesian3, result: Matrix3): Matrix3
        static subtract(left: Matrix3, right: Matrix3, result: Matrix3): Matrix3
        static toArray(matrix: Matrix3, result?: Array<number>): Array<number>
        static transpose(matrix: Matrix3, result: Matrix3): Matrix3
        static unpack(array: Array<number>, startingIndex?: number, result?: Matrix3): Matrix3

    }

}
declare module 'cesium/Core/OrientedBoundingBox' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Matrix3 from 'cesium/Core/Matrix3'
    import Interval from 'cesium/Core/Interval'
    import Rectangle from 'cesium/Core/Rectangle'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Intersect from 'cesium/Core/Intersect'
    import Plane from 'cesium/Core/Plane'
    import Occluder from 'cesium/Core/Occluder'
    export default class OrientedBoundingBox {
        constructor(center?: Cartesian3, halfAxes?: Matrix3);
        //Members
        center: Cartesian3
        halfAxes: Matrix3


        //Methods
        static clone(box: OrientedBoundingBox, result?: OrientedBoundingBox): OrientedBoundingBox
        static computePlaneDistances(box: OrientedBoundingBox, position: Cartesian3, direction: Cartesian3, result?: Interval): Interval
        static distanceSquaredTo(box: OrientedBoundingBox, cartesian: Cartesian3): number
        static equals(left: OrientedBoundingBox, right: OrientedBoundingBox): boolean
        static fromPoints(positions: Array<Cartesian3>, result?: OrientedBoundingBox): OrientedBoundingBox
        static fromRectangle(rectangle: Rectangle, minimumHeight?: number, maximumHeight?: number, ellipsoid?: Ellipsoid, result?: OrientedBoundingBox): OrientedBoundingBox
        static intersectPlane(box: OrientedBoundingBox, plane: Plane): Intersect
        static isOccluded(sphere: OrientedBoundingBox, occluder: Occluder): boolean
        clone(result?: OrientedBoundingBox): OrientedBoundingBox
        computePlaneDistances(position: Cartesian3, direction: Cartesian3, result?: Interval): Interval
        distanceSquaredTo(cartesian: Cartesian3): number
        equals(right?: OrientedBoundingBox): boolean
        intersectPlane(plane: Plane): Intersect
        isOccluded(occluder: Occluder): boolean

    }

}
declare module 'cesium/Core/TerrainMesh' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import OrientedBoundingBox from 'cesium/Core/OrientedBoundingBox'
    export default class TerrainMesh {
        constructor(center: Cartesian3, vertices: Float32Array, indices: Uint16Array | Uint32Array, minimumHeight: number, maximumHeight: number, boundingSphere3D: BoundingSphere, occludeePointInScaledSpace: Cartesian3, vertexStride?: number, orientedBoundingBox?: OrientedBoundingBox);
        //Members
        boundingSphere3D: BoundingSphere
        center: Cartesian3
        indices: Uint16Array | Uint32Array
        maximumHeight: number
        minimumHeight: number
        occludeePointInScaledSpace: Cartesian3
        orientedBoundingBox: OrientedBoundingBox
        stride: number
        vertices: Float32Array


        //Methods

    }

}
declare module 'cesium/Core/TerrainData' {
    import TerrainMesh from 'cesium/Core/TerrainMesh'
    import Promise from 'cesium/Promise'
    import TilingScheme from 'cesium/Core/TilingScheme'
    import Rectangle from 'cesium/Core/Rectangle'
    export default class TerrainData {
        constructor();
        //Members
        waterMask: Uint8Array | HTMLImageElement | HTMLCanvasElement


        //Methods
        createMesh(tilingScheme: TilingScheme, x: number, y: number, level: number): Promise<TerrainMesh> | void
        interpolateHeight(rectangle: Rectangle, longitude: number, latitude: number): number
        isChildAvailable(thisX: number, thisY: number, childX: number, childY: number): boolean
        upsample(tilingScheme: TilingScheme, thisX: number, thisY: number, thisLevel: number, descendantX: number, descendantY: number, descendantLevel: number): Promise<TerrainData> | void
        wasCreatedByUpsampling(): boolean

    }

}
declare module 'cesium/Core/TerrainProvider' {
    import Credit from 'cesium/Core/Credit'
    import Event from 'cesium/Core/Event'
    import TilingScheme from 'cesium/Core/TilingScheme'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import TerrainData from 'cesium/Core/TerrainData'
    import Promise from 'cesium/Promise'
    export default class TerrainProvider {
        constructor();
        //Members
        static heightmapTerrainQuality: number
        credit: Credit
        errorEvent: Event
        hasVertexNormals: boolean
        hasWaterMask: boolean
        ready: boolean
        tilingScheme: TilingScheme


        //Methods
        static getEstimatedLevelZeroGeometricErrorForAHeightmap(ellipsoid: Ellipsoid, tileImageWidth: number, numberOfTilesAtLevelZero: number): number
        static getRegularGridIndices(width: number, height: number): Uint16Array
        getLevelMaximumGeometricError(level: number): number
        getTileDataAvailable(x: number, y: number, level: number): boolean
        requestTileGeometry(x: number, y: number, level: number, throttleRequests?: boolean): Promise<TerrainData> | void

    }

}
declare module 'cesium/Scene/Globe' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Color from 'cesium/Core/Color'
    import ImageryLayerCollection from 'cesium/Scene/ImageryLayerCollection'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import Cartographic from 'cesium/Core/Cartographic'
    import Ray from 'cesium/Core/Ray'
    import Scene from 'cesium/Scene/Scene'
    export default class Globe {
        constructor(ellipsoid?: Ellipsoid);
        //Members
        baseColor: Color
        depthTestAgainstTerrain: boolean
        ellipsoid: Ellipsoid
        enableLighting: boolean
        imageryLayers: ImageryLayerCollection
        lightingFadeInDistance: number
        lightingFadeOutDistance: number
        maximumScreenSpaceError: number
        northPoleColor: Cartesian3
        oceanNormalMapUrl: string
        show: boolean
        showWaterEffect: boolean
        southPoleColor: Cartesian3
        terrainProvider: TerrainProvider
        tileCacheSize: number


        //Methods
        destroy(): void
        getHeight(cartographic: Cartographic): number | void
        isDestroyed(): boolean
        pick(ray: Ray, scene: Scene, result?: Cartesian3): Cartesian3 | void

    }

}
declare module 'cesium/Scene/PrimitiveCollectionOptions' {
    interface PrimitiveCollectionOptions {
        show?: boolean;
        destroyPrimitives?: boolean;
    }
    export default PrimitiveCollectionOptions;
}
declare module 'cesium/Scene/PrimitiveCollection' {
    import PrimitiveCollectionOptions from 'cesium/Scene/PrimitiveCollectionOptions'
    export default class PrimitiveCollection {
        constructor(options?: PrimitiveCollectionOptions);
        //Members
        destroyPrimitives: boolean
        length: number
        show: boolean


        //Methods
        add(primitive: any): Object
        contains(primitive?: any): boolean
        destroy(): void
        get(index: number): Object
        isDestroyed(): boolean
        lower(primitive?: any): void
        lowerToBottom(primitive?: any): void
        raise(primitive?: any): void
        raiseToTop(primitive?: any): void
        remove(primitive?: any): boolean
        removeAll(): void

    }

}
declare module 'cesium/Scene/SceneMode' {
    export default class SceneMode {
        constructor();
        //Members
        static COLUMBUS_VIEW: number
        static MORPHING: number
        static SCENE2D: number
        static SCENE3D: number


        //Methods
        static getMorphTime(value: SceneMode): number

    }

}
declare module 'cesium/Scene/MoonOptions' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    interface MoonOptions {
        show?: boolean;
        textureUrl?: string;
        ellipsoid?: Ellipsoid;
        onlySunLighting?: boolean;
    }
    export default MoonOptions
}
declare module 'cesium/Scene/Moon' {
    import MoonOptions from 'cesium/Scene/MoonOptions'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    export default class Moon {
        constructor(options?: MoonOptions);
        //Members
        ellipsoid: Ellipsoid
        onlySunLighting: boolean
        show: boolean
        textureUrl: string


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Scene/CameraEventType' {
    export default class CameraEventType {
        constructor();
        //Members
        static LEFT_DRAG: number
        static MIDDLE_DRAG: number
        static PINCH: number
        static RIGHT_DRAG: number
        static WHEEL: number


        //Methods

    }

}
declare module 'cesium/Scene/ScreenSpaceCameraController' {
    import Scene from 'cesium/Scene/Scene'
    import CameraEventType from 'cesium/Scene/CameraEventType'
    export default class ScreenSpaceCameraController {
        constructor(scene: Scene);
        //Members
        bounceAnimationTime: number
        enableCollisionDetection: boolean
        enableInputs: boolean
        enableLook: boolean
        enableRotate: boolean
        enableTilt: boolean
        enableTranslate: boolean
        enableZoom: boolean
        inertiaSpin: number
        inertiaTranslate: number
        inertiaZoom: number
        lookEventTypes: CameraEventType | Array<any> | void
        maximumMovementRatio: number
        maximumZoomDistance: number
        minimumCollisionTerrainHeight: number
        minimumPickingTerrainHeight: number
        minimumTrackBallHeight: number
        minimumZoomDistance: number
        rotateEventTypes: CameraEventType | Array<any> | void
        tiltEventTypes: CameraEventType | Array<any> | void
        translateEventTypes: CameraEventType | Array<any> | void
        zoomEventTypes: CameraEventType | Array<any> | void


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Scene/SkyAtmosphere' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    export default class SkyAtmosphere {
        constructor(ellipsoid?: Ellipsoid);
        //Members
        ellipsoid: Ellipsoid
        show: boolean


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Scene/SkyBoxOptions' {
    interface SkyBoxOptions {
        sources?: Object;
        show?: boolean;
    }
    export default SkyBoxOptions

}
declare module 'cesium/Scene/SkyBox' {
    import SkyBoxOptions from 'cesium/Scene/SkyBoxOptions'
    export default class SkyBox {
        constructor(options?: SkyBoxOptions);
        //Members
        show: boolean
        sources: Object


        //Methods
        destroy(): void
        isDestroyed(): boolean
        update(): void

    }

}
declare module 'cesium/Scene/Sun' {
    export default class Sun {
        constructor();
        //Members
        glowFactor: number
        show: boolean


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Scene/Scene' {
    import SceneOptions from 'cesium/Scene/SceneOptions'
    import Color from 'cesium/Core/Color'
    import Camera from 'cesium/Scene/Camera'
    import Globe from 'cesium/Scene/Globe'
    import PrimitiveCollection from 'cesium/Scene/PrimitiveCollection'
    import ImageryLayerCollection from 'cesium/Scene/ImageryLayerCollection'
    import MapProjection from 'cesium/Core/MapProjection'
    import SceneMode from 'cesium/Scene/SceneMode'
    import Moon from 'cesium/Scene/Moon'
    import Event from 'cesium/Core/Event'
    import ScreenSpaceCameraController from 'cesium/Scene/ScreenSpaceCameraController'
    import SkyAtmosphere from 'cesium/Scene/SkyAtmosphere'
    import SkyBox from 'cesium/Scene/SkyBox'
    import Sun from 'cesium/Scene/Sun'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    export default class Scene {
        constructor(options?: SceneOptions);
        //Members
        backgroundColor: Color
        camera: Camera
        canvas: HTMLCanvasElement
        completeMorphOnUserInput: boolean
        debugCommandFilter: (() => void)
        debugFrustumStatistics: Object
        debugShowCommands: boolean
        debugShowDepthFrustum: number
        debugShowFramesPerSecond: boolean
        debugShowFrustums: boolean
        debugShowGlobeDepth: boolean
        drawingBufferHeight: number
        drawingBufferWidth: number
        farToNearRatio: number
        fxaa: boolean
        globe: Globe
        groundPrimitives: PrimitiveCollection
        id: string
        imageryLayers: ImageryLayerCollection
        mapProjection: MapProjection
        maximumAliasedLineWidth: number
        maximumCubeMapSize: number
        mode: SceneMode
        moon: Moon
        morphComplete: Event
        morphStart: Event
        morphTime: number
        orderIndependentTranslucency: boolean
        postRender: Event
        preRender: Event
        primitives: PrimitiveCollection
        renderError: Event
        rethrowRenderErrors: boolean
        scene3DOnly: boolean
        screenSpaceCameraController: ScreenSpaceCameraController
        skyAtmosphere: SkyAtmosphere
        skyBox: SkyBox
        sun: Sun
        sunBloom: boolean
        terrainProvider: TerrainProvider


        //Methods
        completeMorph(): void
        destroy(): void
        drillPick(windowPosition: Cartesian2, limit?: number): Array<Object>
        isDestroyed(): boolean
        morphTo2D(duration?: number): void
        morphTo3D(duration?: number): void
        morphToColumbusView(duration?: number): void
        pick(windowPosition: Cartesian2): Object
        pickPosition(windowPosition: Cartesian2, result?: Cartesian3): Cartesian3

    }

}
declare module 'cesium/Scene/CullingVolume' {
    import Cartesian4 from 'cesium/Core/Cartesian4'
    import Intersect from 'cesium/Core/Intersect'
    export default class CullingVolume {
        constructor(planes: Array<Cartesian4>);
        //Members
        planes: Array<Cartesian4>


        //Methods
        computeVisibility(boundingVolume: any): Intersect

    }

}
declare module 'cesium/Scene/PerspectiveFrustum' {
    import Matrix4 from 'cesium/Core/Matrix4'
    import CullingVolume from 'cesium/Scene/CullingVolume'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    export default class PerspectiveFrustum {
        constructor();
        //Members
        aspectRatio: number
        far: number
        fov: number
        fovy: number
        infiniteProjectionMatrix: Matrix4
        near: number
        projectionMatrix: Matrix4


        //Methods
        clone(result?: PerspectiveFrustum): PerspectiveFrustum
        computeCullingVolume(position: Cartesian3, direction: Cartesian3, up: Cartesian3): CullingVolume
        equals(other?: PerspectiveFrustum): boolean
        getPixelSize(drawingBufferDimensions: Cartesian2, distance?: number, result?: Cartesian2): Cartesian2

    }

}
declare module 'cesium/Core/EasingFunction' {
    export default class EasingFunction {
        constructor();
        //Members
        static BACK_IN: any
        static BACK_IN_OUT: any
        static BACK_OUT: any
        static BOUNCE_IN: any
        static BOUNCE_IN_OUT: any
        static BOUNCE_OUT: any
        static CIRCULAR_IN: any
        static CIRCULAR_IN_OUT: any
        static CIRCULAR_OUT: any
        static CUBIC_IN: any
        static CUBIC_IN_OUT: any
        static CUBIC_OUT: any
        static ELASTIC_IN: any
        static ELASTIC_IN_OUT: any
        static ELASTIC_OUT: any
        static EXPONENTIAL_IN: any
        static EXPONENTIAL_IN_OUT: any
        static EXPONENTIAL_OUT: any
        static LINEAR_NONE: any
        static QUADRACTIC_IN: any
        static QUADRACTIC_IN_OUT: any
        static QUADRACTIC_OUT: any
        static QUARTIC_IN: any
        static QUARTIC_IN_OUT: any
        static QUARTIC_OUT: any
        static QUINTIC_IN: any
        static QUINTIC_IN_OUT: any
        static QUINTIC_OUT: any
        static SINUSOIDAL_IN: any
        static SINUSOIDAL_IN_OUT: any
        static SINUSOIDAL_OUT: any


        //Methods

    }

}
declare module 'cesium/Scene/flyToOptions' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Rectangle from 'cesium/Core/Rectangle'
    import Matrix4 from 'cesium/Core/Matrix4'
    import EasingFunction from 'cesium/Core/EasingFunction'
    interface flyToOptions {
        destination: Cartesian3 | Rectangle;
        orientation?: Object;
        duration?: number;
        complete?: any;
        cancel?: any;
        endTransform?: Matrix4;
        convert?: boolean;
        maximumHeight?: number;
        easingFunction?: EasingFunction | any;
    }
    export default flyToOptions

}
declare module 'cesium/Scene/HeadingPitchRange' {
    export default class HeadingPitchRange {
        constructor(heading?: number, pitch?: number, range?: number);
        //Members
        heading: number
        pitch: number
        range: number


        //Methods
        static clone(hpr: HeadingPitchRange, result?: HeadingPitchRange): HeadingPitchRange

    }

}
declare module 'cesium/Scene/flyToBoundingSphereOptions' {
    import HeadingPitchRange from 'cesium/Scene/HeadingPitchRange'
    import Matrix4 from 'cesium/Core/Matrix4'
    import EasingFunction from 'cesium/Core/EasingFunction'
    interface flyToBoundingSphereOptions {
        duration?: number;
        offset?: HeadingPitchRange;
        complete?: any;
        cancel?: any;
        endTransform?: Matrix4;
        maximumHeight?: number;
        easingFunction?: EasingFunction | any;
    }
    export default flyToBoundingSphereOptions;

}
declare module 'cesium/Scene/setViewOptions' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartographic from 'cesium/Core/Cartographic'
    interface setViewOptions {
        position?: Cartesian3;
        positionCartographic?: Cartographic;
        heading?: number;
        pitch?: number;
        roll?: number;
    }
    export default setViewOptions;
}
declare module 'cesium/Scene/Camera' {
    import Scene from 'cesium/Scene/Scene'
    import Rectangle from 'cesium/Core/Rectangle'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import PerspectiveFrustum from 'cesium/Scene/PerspectiveFrustum'
    import Matrix4 from 'cesium/Core/Matrix4'
    import Event from 'cesium/Core/Event'
    import Cartographic from 'cesium/Core/Cartographic'
    import Cartesian4 from 'cesium/Core/Cartesian4'
    import flyToOptions from 'cesium/Scene/flyToOptions'
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import flyToBoundingSphereOptions from 'cesium/Scene/flyToBoundingSphereOptions'
    import Ray from 'cesium/Core/Ray'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import HeadingPitchRange from 'cesium/Scene/HeadingPitchRange'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import setViewOptions from 'cesium/Scene/setViewOptions'
    export default class Camera {
        constructor(scene: Scene);
        //Members
        static DEFAULT_VIEW_FACTOR: number
        static DEFAULT_VIEW_RECTANGLE: Rectangle
        constrainedAxis: Cartesian3
        defaultLookAmount: number
        defaultMoveAmount: number
        defaultRotateAmount: number
        defaultZoomAmount: number
        direction: Cartesian3
        directionWC: Cartesian3
        frustum: PerspectiveFrustum
        heading: number
        inverseTransform: Matrix4
        inverseViewMatrix: Matrix4
        maximumTranslateFactor: number
        maximumZoomFactor: number
        moveEnd: Event
        moveStart: Event
        pitch: number
        position: Cartesian3
        positionCartographic: Cartographic
        positionWC: Cartesian3
        right: Cartesian3
        rightWC: Cartesian3
        roll: number
        transform: Matrix4
        up: Cartesian3
        upWC: Cartesian3
        viewMatrix: Matrix4


        //Methods
        cameraToWorldCoordinates(cartesian: Cartesian4, result?: Cartesian4): Cartesian4
        cameraToWorldCoordinatesPoint(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        cameraToWorldCoordinatesVector(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        flyTo(options?: flyToOptions): void
        flyToBoundingSphere(boundingSphere: BoundingSphere, options?: flyToBoundingSphereOptions): void
        getMagnitude(): number
        getPickRay(windowPosition: Cartesian2, result?: Ray): Ray
        getRectangleCameraCoordinates(rectangle: Rectangle, result?: Cartesian3): Cartesian3
        look(axis: Cartesian3, angle?: number): void
        lookAt(target: Cartesian3, offset: Cartesian3 | HeadingPitchRange): void
        lookAtTransform(transform: Matrix4, offset?: Cartesian3 | HeadingPitchRange): void
        lookDown(amount?: number): void
        lookLeft(amount?: number): void
        lookRight(amount?: number): void
        lookUp(amount?: number): void
        move(direction: Cartesian3, amount?: number): void
        moveBackward(amount?: number): void
        moveDown(amount?: number): void
        moveForward(amount?: number): void
        moveLeft(amount?: number): void
        moveRight(amount?: number): void
        moveUp(amount?: number): void
        pickEllipsoid(windowPosition: Cartesian2, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3
        rotate(axis: Cartesian3, angle?: number): void
        rotateDown(angle?: number): void
        rotateLeft(angle?: number): void
        rotateRight(angle?: number): void
        rotateUp(angle?: number): void
        setView(options?: setViewOptions): void
        twistLeft(amount?: number): void
        twistRight(amount?: number): void
        viewBoundingSphere(boundingSphere: BoundingSphere, offset?: HeadingPitchRange): void
        viewRectangle(rectangle: Rectangle, ellipsoid?: Ellipsoid): void
        worldToCameraCoordinates(cartesian: Cartesian4, result?: Cartesian4): Cartesian4
        worldToCameraCoordinatesPoint(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        worldToCameraCoordinatesVector(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        zoomIn(amount?: number): void
        zoomOut(amount?: number): void

    }

}
declare module 'cesium/Core/Matrix4' {
    import Camera from 'cesium/Scene/Camera'
    import Matrix3 from 'cesium/Core/Matrix3'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Quaternion from 'cesium/Core/Quaternion'
    import Cartesian4 from 'cesium/Core/Cartesian4'
    export default class Matrix4 {
        constructor(column0Row0?: number, column1Row0?: number, column2Row0?: number, column3Row0?: number, column0Row1?: number, column1Row1?: number, column2Row1?: number, column3Row1?: number, column0Row2?: number, column1Row2?: number, column2Row2?: number, column3Row2?: number, column0Row3?: number, column1Row3?: number, column2Row3?: number, column3Row3?: number);
        //Members
        static COLUMN0ROW0: number
        static COLUMN0ROW1: number
        static COLUMN0ROW2: number
        static COLUMN0ROW3: number
        static COLUMN1ROW0: number
        static COLUMN1ROW1: number
        static COLUMN1ROW2: number
        static COLUMN1ROW3: number
        static COLUMN2ROW0: number
        static COLUMN2ROW1: number
        static COLUMN2ROW2: number
        static COLUMN2ROW3: number
        static COLUMN3ROW0: number
        static COLUMN3ROW1: number
        static COLUMN3ROW2: number
        static COLUMN3ROW3: number
        static IDENTITY: Matrix4
        static packedLength: number
        static ZERO: Matrix4


        //Methods
        clone(result?: Matrix4): Matrix4
        equals(right?: Matrix4): boolean
        equalsEpsilon(right?: Matrix4, epsilon?: number): boolean
        toString(): string
        static abs(matrix: Matrix4, result: Matrix4): Matrix4
        static add(left: Matrix4, right: Matrix4, result: Matrix4): Matrix4
        static clone(matrix: Matrix4, result?: Matrix4): Matrix4
        static computeInfinitePerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number, result: Matrix4): Matrix4
        static computeOrthographicOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number, result: Matrix4): Matrix4
        static computePerspectiveFieldOfView(fovY: number, aspectRatio: number, near: number, far: number, result: Matrix4): Matrix4
        static computePerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number, result: Matrix4): Matrix4
        static computeViewportTransformation(viewport?: any, nearDepthRange?: number, farDepthRange?: number, result?: Matrix4): Matrix4
        static equals(left?: Matrix4, right?: Matrix4): boolean
        static equalsEpsilon(left?: Matrix4, right?: Matrix4, epsilon?: number): boolean
        static fromArray(array: Array<number>, startingIndex?: number, result?: Matrix4): Matrix4
        static fromCamera(camera: Camera, result?: Matrix4): Matrix4
        static fromColumnMajorArray(values: Array<number>, result?: Matrix4): Matrix4
        static fromRotationTranslation(rotation: Matrix3, translation?: Cartesian3, result?: Matrix4): Matrix4
        static fromRowMajorArray(values: Array<number>, result?: Matrix4): Matrix4
        static fromScale(scale: Cartesian3, result?: Matrix4): Matrix4
        static fromTranslation(translation: Cartesian3, result?: Matrix4): Matrix4
        static fromTranslationQuaternionRotationScale(translation: Cartesian3, rotation: Quaternion, scale: Cartesian3, result?: Matrix4): Matrix4
        static fromUniformScale(scale: number, result?: Matrix4): Matrix4
        static getColumn(matrix: Matrix4, index: number, result: Cartesian4): Cartesian4
        static getElementIndex(row: number, column: number): number
        static getMaximumScale(matrix: Matrix4): number
        static getRotation(matrix: Matrix4, result: Matrix3): Matrix3
        static getRow(matrix: Matrix4, index: number, result: Cartesian4): Cartesian4
        static getScale(matrix: Matrix4, result: Cartesian3): Cartesian3
        static getTranslation(matrix: Matrix4, result: Cartesian3): Cartesian3
        static inverse(matrix: Matrix4, result: Matrix4): Matrix4
        static inverseTransformation(matrix: Matrix4, result: Matrix4): Matrix4
        static multiply(left: Matrix4, right: Matrix4, result: Matrix4): Matrix4
        static multiplyByMatrix3(matrix: Matrix4, rotation: Matrix3, result: Matrix4): Matrix4
        static multiplyByPoint(matrix: Matrix4, cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static multiplyByPointAsVector(matrix: Matrix4, cartesian: Cartesian3, result: Cartesian3): Cartesian3
        static multiplyByScalar(matrix: Matrix4, scalar: number, result: Matrix4): Matrix4
        static multiplyByScale(matrix: Matrix4, scale: Cartesian3, result: Matrix4): Matrix4
        static multiplyByTranslation(matrix: Matrix4, translation: Cartesian3, result: Matrix4): Matrix4
        static multiplyByUniformScale(matrix: Matrix4, scale: number, result: Matrix4): Matrix4
        static multiplyByVector(matrix: Matrix4, cartesian: Cartesian4, result: Cartesian4): Cartesian4
        static multiplyTransformation(left: Matrix4, right: Matrix4, result: Matrix4): Matrix4
        static negate(matrix: Matrix4, result: Matrix4): Matrix4
        static pack(value: Matrix4, array: Array<number>, startingIndex?: number): void
        static setColumn(matrix: Matrix4, index: number, cartesian: Cartesian4, result: Matrix4): Matrix4
        static setRow(matrix: Matrix4, index: number, cartesian: Cartesian4, result: Matrix4): Matrix4
        static setTranslation(matrix: Matrix4, translation: Cartesian3, result: Cartesian4): Matrix4
        static subtract(left: Matrix4, right: Matrix4, result: Matrix4): Matrix4
        static toArray(matrix: Matrix4, result?: Array<number>): Array<number>
        static transpose(matrix: Matrix4, result: Matrix4): Matrix4
        static unpack(array: Array<number>, startingIndex?: number, result?: Matrix4): Matrix4

    }

}
declare module 'cesium/Core/BoundingSphere' {
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Interval from 'cesium/Core/Interval'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Rectangle from 'cesium/Core/Rectangle'
    import Intersect from 'cesium/Core/Intersect'
    import Plane from 'cesium/Core/Plane'
    import Occluder from 'cesium/Core/Occluder'
    import Matrix4 from 'cesium/Core/Matrix4'
    export default class BoundingSphere {
        constructor(center?: Cartesian3, radius?: number);
        //Members
        static packedLength: number
        center: Cartesian3
        radius: number


        //Methods
        static clone(sphere: BoundingSphere, result?: BoundingSphere): BoundingSphere
        static computePlaneDistances(sphere: BoundingSphere, position: Cartesian3, direction: Cartesian3, result?: Interval): Interval
        static distanceSquaredTo(sphere: BoundingSphere, cartesian: Cartesian3): number
        static equals(left?: BoundingSphere, right?: BoundingSphere): boolean
        static expand(sphere: BoundingSphere, point: Cartesian3, result?: BoundingSphere): BoundingSphere
        static fromBoundingSpheres(boundingSpheres: Array<BoundingSphere>, result?: BoundingSphere): BoundingSphere
        static fromCornerPoints(corner?: Cartesian3, oppositeCorner?: Cartesian3, result?: BoundingSphere): BoundingSphere
        static fromEllipsoid(ellipsoid: Ellipsoid, result?: BoundingSphere): BoundingSphere
        static fromPoints(positions: Array<Cartesian3>, result?: BoundingSphere): BoundingSphere
        static fromRectangle2D(rectangle: Rectangle, projection?: any, result?: BoundingSphere): BoundingSphere
        static fromRectangle3D(rectangle: Rectangle, ellipsoid?: Ellipsoid, surfaceHeight?: number, result?: BoundingSphere): BoundingSphere
        static fromRectangleWithHeights2D(rectangle: Rectangle, projection?: any, minimumHeight?: number, maximumHeight?: number, result?: BoundingSphere): BoundingSphere
        static fromVertices(positions: Array<number>, center?: Cartesian3, stride?: number, result?: BoundingSphere): BoundingSphere
        static intersectPlane(sphere: BoundingSphere, plane: Plane): Intersect
        static isOccluded(sphere: BoundingSphere, occluder: Occluder): boolean
        static pack(value: BoundingSphere, array: Array<number>, startingIndex?: number): void
        static projectTo2D(sphere: BoundingSphere, projection?: any, result?: BoundingSphere): BoundingSphere
        static transform(sphere: BoundingSphere, transform: Matrix4, result?: BoundingSphere): BoundingSphere
        static transformWithoutScale(sphere: BoundingSphere, transform: Matrix4, result?: BoundingSphere): BoundingSphere
        static union(left: BoundingSphere, right: BoundingSphere, result?: BoundingSphere): BoundingSphere
        static unpack(array: Array<number>, startingIndex?: number, result?: BoundingSphere): BoundingSphere
        clone(result?: BoundingSphere): BoundingSphere
        computePlaneDistances(position: Cartesian3, direction: Cartesian3, result?: Interval): Interval
        distanceSquaredTo(cartesian: Cartesian3): number
        equals(right?: BoundingSphere): boolean
        intersectPlane(plane: Plane): Intersect
        isOccluded(occluder: Occluder): boolean

    }

}
declare module 'cesium/Core/CesiumMath' {
    export default class CesiumMath {
        constructor();
        //Members
        static DEGREES_PER_RADIAN: number
        static EPSILON1: number
        static EPSILON2: number
        static EPSILON3: number
        static EPSILON4: number
        static EPSILON5: number
        static EPSILON6: number
        static EPSILON7: number
        static EPSILON8: number
        static EPSILON9: number
        static EPSILON10: number
        static EPSILON11: number
        static EPSILON12: number
        static EPSILON13: number
        static EPSILON14: number
        static EPSILON15: number
        static EPSILON16: number
        static EPSILON17: number
        static EPSILON18: number
        static EPSILON19: number
        static EPSILON20: number
        static GRAVITATIONALPARAMETER: number
        static LUNAR_RADIUS: number
        static ONE_OVER_PI: number
        static ONE_OVER_TWO_PI: number
        static PI: number
        static PI_OVER_FOUR: number
        static PI_OVER_SIX: number
        static PI_OVER_THREE: number
        static PI_OVER_TWO: number
        static RADIANS_PER_ARCSECOND: number
        static RADIANS_PER_DEGREE: number
        static SIXTY_FOUR_KILOBYTES: number
        static SOLAR_RADIUS: number
        static THREE_PI_OVER_TWO: number
        static TWO_PI: number


        //Methods
        static acosClamped(value: number): number
        static asinClamped(value: number): number
        static chordLength(angle: number, radius: number): number
        static clamp(value: number, min: number, max: number): number
        static convertLongitudeRange(angle: number): number
        static cosh(value: number): number
        static equalsEpsilon(left: number, right: number, relativeEpsilon: number, absoluteEpsilon?: number): boolean
        static factorial(n: number): number
        static fromSNorm(value: number): number
        static incrementWrap(n?: number, maximumValue?: number, minimumValue?: number): number
        static isPowerOfTwo(n: number): boolean
        static lerp(p: number, q: number, time: number): number
        static mod(m: number, n: number): number
        static negativePiToPi(angle: number): number
        static nextPowerOfTwo(n: number): number
        static nextRandomNumber(): number
        static setRandomNumberSeed(seed: number): void
        static sign(value: number): number
        static signNotZero(value: number): number
        static sinh(value: number): number
        static toDegrees(radians: number): number
        static toRadians(degrees: number): number
        static toSNorm(value: number): number
        static zeroToTwoPi(angle: number): number

    }

}
declare module 'cesium/Core/CesiumTerrainProviderOptions' {
    import DefaultProxy from 'cesium/Core/DefaultProxy'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Credit from 'cesium/Core/Credit'
    interface CesiumTerrainProviderOptions {
        url: string;
        proxy?: DefaultProxy;
        requestVertexNormals?: boolean;
        requestWaterMask?: boolean;
        ellipsoid?: Ellipsoid;
        credit?: Credit | string;
    }
    export default CesiumTerrainProviderOptions;

}
declare module 'cesium/Core/GeographicTilingSchemeOptions' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Rectangle from 'cesium/Core/Rectangle'
    interface GeographicTilingSchemeOptions {
        ellipsoid?: Ellipsoid;
        rectangle?: Rectangle;
        numberOfLevelZeroTilesX?: number;
        numberOfLevelZeroTilesY?: number;
    }
    export default GeographicTilingSchemeOptions;

}
declare module 'cesium/Core/GeographicTilingScheme' {
    import GeographicTilingSchemeOptions from 'cesium/Core/GeographicTilingSchemeOptions'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import MapProjection from 'cesium/Core/MapProjection'
    import Rectangle from 'cesium/Core/Rectangle'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class GeographicTilingScheme {
        constructor(options?: GeographicTilingSchemeOptions);
        //Members
        ellipsoid: Ellipsoid
        projection: MapProjection
        rectangle: Rectangle


        //Methods
        getNumberOfXTilesAtLevel(level: number): number
        getNumberOfYTilesAtLevel(level: number): number
        positionToTileXY(position: Cartographic, level: number, result?: Cartesian2): Cartesian2
        rectangleToNativeRectangle(rectangle: Rectangle, result?: Rectangle): Rectangle
        tileXYToNativeRectangle(x: number, y: number, level: number, result?: any): Rectangle
        tileXYToRectangle(x: number, y: number, level: number, result?: any): Rectangle

    }

}
declare module 'cesium/Core/CesiumTerrainProvider' {
    import CesiumTerrainProviderOptions from 'cesium/Core/CesiumTerrainProviderOptions'
    import Credit from 'cesium/Core/Credit'
    import Event from 'cesium/Core/Event'
    import GeographicTilingScheme from 'cesium/Core/GeographicTilingScheme'
    import TerrainData from 'cesium/Core/TerrainData'
    import Promise from 'cesium/Promise'
    export default class CesiumTerrainProvider {
        constructor(options?: CesiumTerrainProviderOptions);
        //Members
        credit: Credit
        errorEvent: Event
        hasVertexNormals: boolean
        hasWaterMask: boolean
        ready: boolean
        requestVertexNormals: boolean
        requestWaterMask: boolean
        tilingScheme: GeographicTilingScheme


        //Methods
        getLevelMaximumGeometricError(level: number): number
        getTileDataAvailable(x: number, y: number, level: number): boolean
        requestTileGeometry(x: number, y: number, level: number, throttleRequests?: boolean): Promise<TerrainData> | void

    }

}
declare module 'cesium/Core/TimeStandard' {
    export default class TimeStandard {
        constructor();
        //Members
        static TAI: any
        static UTC: any


        //Methods

    }

}
declare module 'cesium/Core/LeapSecond' {
    import JulianDate from 'cesium/Core/JulianDate'
    export default class LeapSecond {
        constructor(date?: JulianDate, offset?: number);
        //Members
        julianDate: JulianDate
        offset: number


        //Methods

    }

}
declare module 'cesium/Core/GregorianDate' {
    export default class GregorianDate {
        constructor();
        //Members
        day: number
        hour: number
        isLeapSecond: boolean
        millisecond: number
        minute: number
        month: number
        second: number
        year: number


        //Methods

    }

}
declare module 'cesium/Core/JulianDate' {
    import TimeStandard from 'cesium/Core/TimeStandard'
    import LeapSecond from 'cesium/Core/LeapSecond'
    import GregorianDate from 'cesium/Core/GregorianDate'
    export default class JulianDate {
        constructor(julianDayNumber: number, secondsOfDay: number, timeStandard?: TimeStandard);
        //Members
        static leapSeconds: Array<LeapSecond>
        dayNumber: number
        secondsOfDay: number


        //Methods
        static addDays(julianDate: JulianDate, days: number, result: JulianDate): JulianDate
        static addHours(julianDate: JulianDate, hours: number, result: JulianDate): JulianDate
        static addMinutes(julianDate: JulianDate, minutes: number, result: JulianDate): JulianDate
        static addSeconds(julianDate: JulianDate, seconds: number, result: JulianDate): JulianDate
        static clone(julianDate: JulianDate, result?: JulianDate): JulianDate
        static compare(left: JulianDate, right: JulianDate): number
        static computeTaiMinusUtc(julianDate: JulianDate): number
        static daysDifference(left: JulianDate, right: JulianDate): number
        static equals(left?: JulianDate, right?: JulianDate): boolean
        static equalsEpsilon(left?: JulianDate, right?: JulianDate, epsilon?: number): boolean
        static fromDate(date: Date, result?: JulianDate): JulianDate
        static fromIso8601(iso8601String: string, result?: JulianDate): JulianDate
        static greaterThan(left: JulianDate, right: JulianDate): boolean
        static greaterThanOrEquals(left: JulianDate, right: JulianDate): boolean
        static lessThan(left: JulianDate, right: JulianDate): boolean
        static lessThanOrEquals(left: JulianDate, right: JulianDate): boolean
        static now(result?: JulianDate): JulianDate
        static secondsDifference(left: JulianDate, right: JulianDate): number
        static toDate(julianDate: JulianDate): Date
        static toGregorianDate(julianDate: JulianDate, result?: GregorianDate): GregorianDate
        static toIso8601(julianDate: JulianDate, precision?: number): string
        static totalDays(julianDate: JulianDate): number
        clone(result?: JulianDate): JulianDate
        equals(right?: JulianDate): boolean
        equalsEpsilon(right?: JulianDate, epsilon?: number): boolean
        toString(): string

    }

}
declare module 'cesium/Core/ClockStep' {
    export default class ClockStep {
        constructor();
        //Members
        static SYSTEM_CLOCK: number
        static SYSTEM_CLOCK_MULTIPLIER: number
        static TICK_DEPENDENT: number


        //Methods

    }

}
declare module 'cesium/Core/ClockRange' {
    export default class ClockRange {
        constructor();
        //Members
        static CLAMPED: number
        static LOOP_STOP: number
        static UNBOUNDED: number


        //Methods

    }

}
declare module 'cesium/Core/ClockOptions' {
    import JulianDate from 'cesium/Core/JulianDate'
    import ClockStep from 'cesium/Core/ClockStep'
    import ClockRange from 'cesium/Core/ClockRange'
    interface ClockOptions {
        startTime?: JulianDate;
        stopTime?: JulianDate;
        currentTime?: JulianDate;
        multiplier?: number;
        clockStep?: ClockStep;
        clockRange?: ClockRange;
        canAnimate?: boolean;
        shouldAnimate?: boolean;
    }
    export default ClockOptions;

}
declare module 'cesium/Core/Clock' {
    import ClockOptions from 'cesium/Core/ClockOptions'
    import ClockRange from 'cesium/Core/ClockRange'
    import ClockStep from 'cesium/Core/ClockStep'
    import JulianDate from 'cesium/Core/JulianDate'
    import Event from 'cesium/Core/Event'
    export default class Clock {
        constructor(options?: ClockOptions);
        //Members
        canAnimate: boolean
        clockRange: ClockRange
        clockStep: ClockStep
        currentTime: JulianDate
        multiplier: number
        onTick: Event
        shouldAnimate: boolean
        startTime: JulianDate
        stopTime: JulianDate


        //Methods
        tick(): JulianDate

    }

}
declare module 'cesium/Core/defaultValue' {
    function defaultValue<T>(a, b: T): T;
    export default defaultValue;
}
declare module 'cesium/Core/DeveloperError' {
    export default class DeveloperError {
        constructor(message?: string);
        //Members
        message: string
        name: string
        stack: string


        //Methods

    }

}
declare module 'cesium/Core/ExtrapolationType' {
    export default class ExtrapolationType {
        constructor();
        //Members
        static EXTRAPOLATE: number
        static HOLD: number
        static NONE: number


        //Methods

    }

}
declare module 'cesium/Core/InterpolationAlgorithm' {
    export default class InterpolationAlgorithm {
        constructor();
        //Members
        static type: string


        //Methods
        static getRequiredDataPoints(degree: number): number
        static interpolate(x: number, xTable: Array<number>, yTable: Array<number>, yStride: number, inputOrder: number, outputOrder: number, result?: Array<number>): Array<number>
        static interpolateOrderZero(x: number, xTable: Array<number>, yTable: Array<number>, yStride: number, result?: Array<number>): Array<number>

    }

}
declare module 'cesium/Core/isArray' {
    function isArray(value: any): boolean;
    export default isArray;
}
declare module 'cesium/Core/ReferenceFrame' {
    export default class ReferenceFrame {
        constructor();
        //Members
        static FIXED: number
        static INERTIAL: number


        //Methods

    }

}
declare module 'cesium/Core/requestAnimationFrame' {
    function requestAnimationFrame(callback: any): void;
    export default requestAnimationFrame;
}
declare module 'cesium/Core/ScreenSpaceEventHandler' {
    export default class ScreenSpaceEventHandler {
        constructor(element?: HTMLCanvasElement);
        //Members


        //Methods
        destroy(): void
        getInputAction(type: number, modifier?: number): void
        isDestroyed(): boolean
        removeInputAction(type: number, modifier?: number): void
        setInputAction(action: (() => void), type: number, modifier?: number): void

    }

}
declare module 'cesium/Core/ScreenSpaceEventType' {
    export default class ScreenSpaceEventType {
        constructor();
        //Members
        static LEFT_CLICK: number
        static LEFT_DOUBLE_CLICK: number
        static LEFT_DOWN: number
        static LEFT_UP: number
        static MIDDLE_CLICK: number
        static MIDDLE_DOUBLE_CLICK: number
        static MIDDLE_DOWN: number
        static MIDDLE_UP: number
        static MOUSE_MOVE: number
        static PINCH_END: number
        static PINCH_MOVE: number
        static PINCH_START: number
        static RIGHT_CLICK: number
        static RIGHT_DOUBLE_CLICK: number
        static RIGHT_DOWN: number
        static RIGHT_UP: number
        static WHEEL: number


        //Methods

    }

}
declare module 'cesium/Core/TimeIntervalOptions' {
    import JulianDate from 'cesium/Core/JulianDate'
    interface TimeIntervalOptions {
        start?: JulianDate;
        stop?: JulianDate;
        isStartIncluded?: boolean;
        isStopIncluded?: boolean;
        data?: Object;
    }
    export default TimeIntervalOptions;

}
declare module 'cesium/Core/fromIso8601Options' {
    interface fromIso8601Options {
        iso8601: string;
        isStartIncluded?: boolean;
        isStopIncluded?: boolean;
        data?: Object;
    }
    export default fromIso8601Options;
}
declare module 'cesium/Core/TimeInterval' {
    import TimeIntervalOptions from 'cesium/Core/TimeIntervalOptions'
    import JulianDate from 'cesium/Core/JulianDate'
    import fromIso8601Options from 'cesium/Core/fromIso8601Options'
    export default class TimeInterval {
        constructor(options?: TimeIntervalOptions);
        //Members
        static EMPTY: TimeInterval
        data: Object
        isEmpty: boolean
        isStartIncluded: boolean
        isStopIncluded: boolean
        start: JulianDate
        stop: JulianDate


        //Methods
        static clone(timeInterval?: TimeInterval, result?: TimeInterval): TimeInterval
        static contains(timeInterval: TimeInterval, julianDate: JulianDate): boolean
        static equals(left?: TimeInterval, right?: TimeInterval, dataComparer?: any): boolean
        static equalsEpsilon(left?: TimeInterval, right?: TimeInterval, epsilon?: number, dataComparer?: any): boolean
        static fromIso8601(options?: fromIso8601Options, result?: TimeInterval): TimeInterval
        static intersect(left: TimeInterval, right?: TimeInterval, result?: TimeInterval, mergeCallback?: any): TimeInterval
        static toIso8601(timeInterval: TimeInterval, precision?: number): string
        clone(result?: TimeInterval): TimeInterval
        equals(right?: TimeInterval, dataComparer?: any): boolean
        equalsEpsilon(right?: TimeInterval, epsilon?: number, dataComparer?: any): boolean
        toString(): string
    }

}
declare module 'cesium/Core/findIntervalOptions' {
    import JulianDate from 'cesium/Core/JulianDate'
    interface findIntervalOptions {
        start?: JulianDate;
        stop?: JulianDate;
        isStartIncluded?: boolean;
        isStopIncluded?: boolean;
    }
    export default findIntervalOptions;

}
declare module 'cesium/Core/TimeIntervalCollection' {
    import TimeInterval from 'cesium/Core/TimeInterval'
    import Event from 'cesium/Core/Event'
    import JulianDate from 'cesium/Core/JulianDate'
    import findIntervalOptions from 'cesium/Core/findIntervalOptions'
    export default class TimeIntervalCollection {
        constructor(intervals?: Array<TimeInterval>);
        //Members
        changedEvent: Event
        isEmpty: boolean
        isStartIncluded: boolean
        isStopIncluded: boolean
        length: number
        start: JulianDate
        stop: JulianDate


        //Methods
        addInterval(interval: TimeInterval, dataComparer?: any): void
        contains(julianDate: JulianDate): boolean
        equals(right?: TimeIntervalCollection, dataComparer?: any): boolean
        findDataForIntervalContainingDate(date: JulianDate): Object
        findInterval(options?: findIntervalOptions): TimeInterval
        findIntervalContainingDate(date: JulianDate): TimeInterval | void
        get(index: number): TimeInterval
        indexOf(date: JulianDate): number
        intersect(other: TimeIntervalCollection, dataComparer?: any, mergeCallback?: any): TimeIntervalCollection
        removeAll(): void
        removeInterval(interval: TimeInterval): void

    }

}
declare module 'cesium/Core/Transforms' {
    import Matrix3 from 'cesium/Core/Matrix3'
    import JulianDate from 'cesium/Core/JulianDate'
    import Matrix4 from 'cesium/Core/Matrix4'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Quaternion from 'cesium/Core/Quaternion'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Promise from 'cesium/Promise'
    import TimeInterval from 'cesium/Core/TimeInterval'
    export default class Transforms {
        constructor();
        //Members


        //Methods
        static computeFixedToIcrfMatrix(date: JulianDate, result?: Matrix3): Matrix3
        static computeIcrfToFixedMatrix(date: JulianDate, result?: Matrix3): Matrix3
        static computeTemeToPseudoFixedMatrix(date: JulianDate, result?: Matrix3): Matrix3
        static eastNorthUpToFixedFrame(origin: Cartesian3, ellipsoid?: Ellipsoid, result?: Matrix4): Matrix4
        static headingPitchRollQuaternion(origin: Cartesian3, heading: number, pitch: number, roll: number, ellipsoid?: Ellipsoid, result?: Quaternion): Quaternion
        static headingPitchRollToFixedFrame(origin: Cartesian3, heading: number, pitch: number, roll: number, ellipsoid?: Ellipsoid, result?: Matrix4): Matrix4
        static northEastDownToFixedFrame(origin: Cartesian3, ellipsoid?: Ellipsoid, result?: Matrix4): Matrix4
        static northUpEastToFixedFrame(origin: Cartesian3, ellipsoid?: Ellipsoid, result?: Matrix4): Matrix4
        static pointToWindowCoordinates(modelViewProjectionMatrix: Matrix4, viewportTransformation: Matrix4, point: Cartesian3, result?: Cartesian2): Cartesian2
        static preloadIcrfFixed(timeInterval: TimeInterval): Promise<void>

    }

}
declare module 'cesium/Core/WebMercatorProjection' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class WebMercatorProjection {
        constructor(ellipsoid?: Ellipsoid);
        //Members
        static MaximumLatitude: number
        ellipsoid: Ellipsoid


        //Methods
        static geodeticLatitudeToMercatorAngle(latitude: number): number
        static mercatorAngleToGeodeticLatitude(mercatorAngle: number): number
        project(cartographic: Cartographic, result?: Cartesian3): Cartesian3
        unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic

    }

}
declare module 'cesium/Core/WebMercatorTilingSchemeOptions' {
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    interface WebMercatorTilingSchemeOptions {
        ellipsoid?: Ellipsoid;
        numberOfLevelZeroTilesX?: number;
        numberOfLevelZeroTilesY?: number;
        rectangleSouthwestInMeters?: Cartesian2;
        rectangleNortheastInMeters?: Cartesian2;
    }
    export default WebMercatorTilingSchemeOptions;

}
declare module 'cesium/Core/WebMercatorTilingScheme' {
    import WebMercatorTilingSchemeOptions from 'cesium/Core/WebMercatorTilingSchemeOptions'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import MapProjection from 'cesium/Core/MapProjection'
    import Rectangle from 'cesium/Core/Rectangle'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Cartographic from 'cesium/Core/Cartographic'
    export default class WebMercatorTilingScheme {
        constructor(options?: WebMercatorTilingSchemeOptions);
        //Members
        ellipsoid: Ellipsoid
        projection: MapProjection
        rectangle: Rectangle


        //Methods
        getNumberOfXTilesAtLevel(level: number): number
        getNumberOfYTilesAtLevel(level: number): number
        positionToTileXY(position: Cartographic, level: number, result?: Cartesian2): Cartesian2
        rectangleToNativeRectangle(rectangle: Rectangle, result?: Rectangle): Rectangle
        tileXYToNativeRectangle(x: number, y: number, level: number, result?: any): Rectangle
        tileXYToRectangle(x: number, y: number, level: number, result?: any): Rectangle

    }

}
declare module 'cesium/DataSources/Property' {
    import Event from 'cesium/Core/Event'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class Property {
        constructor();
        //Members
        definitionChanged: Event
        isConstant: boolean


        //Methods
        equals(other?: Property | string): boolean
        getValue(time: JulianDate, result?: any): Object

    }

}
declare module 'cesium/DataSources/BillboardGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    interface BillboardGraphicsOptions {
        image?: Property | string;
        show?: Property | string;
        scale?: Property | string;
        horizontalOrigin?: Property | string;
        verticalOrigin?: Property | string;
        eyeOffset?: Property | string;
        pixelOffset?: Property | string;
        rotation?: Property | string;
        alignedAxis?: Property | string;
        width?: Property | string;
        height?: Property | string;
        color?: Property | string;
        scaleByDistance?: Property | string;
        translucencyByDistance?: Property | string;
        pixelOffsetScaleByDistance?: Property | string;
        imageSubRegion?: Property | string;
        sizeInMeters?: Property | string;
    }
    export default BillboardGraphicsOptions;
}
declare module 'cesium/DataSources/BillboardGraphics' {
    import BillboardGraphicsOptions from 'cesium/DataSources/BillboardGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    export default class BillboardGraphics {
        constructor(options?: BillboardGraphicsOptions);
        //Members
        alignedAxis: Property | string
        color: Property | string
        definitionChanged: Event
        eyeOffset: Property | string
        height: Property | string
        horizontalOrigin: Property | string
        image: Property | string
        imageSubRegion: Property | string
        pixelOffset: Property | string
        pixelOffsetScaleByDistance: Property | string
        rotation: Property | string
        scale: Property | string
        scaleByDistance: Property | string
        show: Property | string
        sizeInMeters: Property | string
        translucencyByDistance: Property | string
        verticalOrigin: Property | string
        width: Property | string


        //Methods
        clone(result?: BillboardGraphics): BillboardGraphics
        merge(source: BillboardGraphics): void

    }

}
declare module 'cesium/DataSources/MaterialProperty' {
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class MaterialProperty {
        constructor();
        //Members
        definitionChanged: Event
        isConstant: boolean


        //Methods
        equals(other?: Property | string): boolean
        getType(time: JulianDate): string
        getValue(time: JulianDate, result?: any): Object

    }

}
declare module 'cesium/DataSources/BoxGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface BoxGraphicsOptions {
        dimensions?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
    }
    export default BoxGraphicsOptions;
}
declare module 'cesium/DataSources/BoxGraphics' {
    import BoxGraphicsOptions from 'cesium/DataSources/BoxGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class BoxGraphics {
        constructor(options?: BoxGraphicsOptions);
        //Members
        definitionChanged: Event
        dimensions: Property | string
        fill: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        show: Property | string


        //Methods
        clone(result?: BoxGraphics): BoxGraphics
        merge(source: BoxGraphics): void

    }

}
declare module 'cesium/DataSources/CorridorGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface CorridorGraphicsOptions {
        positions?: Property | string;
        width?: Property | string;
        cornerType?: Property | string;
        height?: Property | string;
        extrudedHeight?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        granularity?: Property | string;
    }
    export default CorridorGraphicsOptions;
}
declare module 'cesium/DataSources/CorridorGraphics' {
    import CorridorGraphicsOptions from 'cesium/DataSources/CorridorGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class CorridorGraphics {
        constructor(options?: CorridorGraphicsOptions);
        //Members
        cornerType: Property | string
        definitionChanged: Event
        extrudedHeight: Property | string
        fill: Property | string
        granularity: Property | string
        height: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        positions: Property | string
        show: Property | string
        width: Property | string


        //Methods
        clone(result?: CorridorGraphics): CorridorGraphics
        merge(source: CorridorGraphics): void

    }

}
declare module 'cesium/DataSources/DataSourceClock' {
    import ClockRange from 'cesium/Core/ClockRange'
    import ClockStep from 'cesium/Core/ClockStep'
    import JulianDate from 'cesium/Core/JulianDate'
    import Event from 'cesium/Core/Event'
    import Clock from 'cesium/Core/Clock'
    export default class DataSourceClock {
        constructor();
        //Members
        clockRange: ClockRange
        clockStep: ClockStep
        currentTime: JulianDate
        definitionChanged: Event
        multiplier: number
        startTime: JulianDate
        stopTime: JulianDate


        //Methods
        clone(result?: DataSourceClock): DataSourceClock
        equals(other: DataSourceClock): boolean
        getValue(): Clock
        merge(source: DataSourceClock): void

    }

}
declare module 'cesium/DataSources/PositionProperty' {
    import Event from 'cesium/Core/Event'
    import ReferenceFrame from 'cesium/Core/ReferenceFrame'
    import Property from 'cesium/DataSources/Property'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class PositionProperty {
        constructor();
        //Members
        definitionChanged: Event
        isConstant: boolean
        referenceFrame: ReferenceFrame


        //Methods
        equals(other?: Property | string): boolean
        getValue(time: JulianDate, result?: Cartesian3): Cartesian3
        getValueInReferenceFrame(time: JulianDate, referenceFrame: ReferenceFrame, result?: Cartesian3): Cartesian3

    }

}
declare module 'cesium/DataSources/CylinderGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface CylinderGraphicsOptions {
        length?: Property | string;
        topRadius?: Property | string;
        bottomRadius?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        numberOfVerticalLines?: Property | string;
        slices?: Property | string;
    }
    export default CylinderGraphicsOptions;
}
declare module 'cesium/DataSources/CylinderGraphics' {
    import CylinderGraphicsOptions from 'cesium/DataSources/CylinderGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class CylinderGraphics {
        constructor(options?: CylinderGraphicsOptions);
        //Members
        bottomRadius: Property | string
        definitionChanged: Event
        fill: Property | string
        length: Property | string
        material: MaterialProperty
        numberOfVerticalLines: Property | string
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        show: Property | string
        slices: Property | string
        topRadius: Property | string


        //Methods
        clone(result?: CylinderGraphics): CylinderGraphics
        merge(source: CylinderGraphics): void

    }

}
declare module 'cesium/DataSources/EllipseGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface EllipseGraphicsOptions {
        semiMajorAxis?: Property | string;
        semiMinorAxis?: Property | string;
        height?: Property | string;
        extrudedHeight?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        numberOfVerticalLines?: Property | string;
        rotation?: Property | string;
        stRotation?: Property | string;
        granularity?: Property | string;
    }
    export default EllipseGraphicsOptions;
}
declare module 'cesium/DataSources/EllipseGraphics' {
    import EllipseGraphicsOptions from 'cesium/DataSources/EllipseGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class EllipseGraphics {
        constructor(options?: EllipseGraphicsOptions);
        //Members
        definitionChanged: Event
        extrudedHeight: Property | string
        fill: Property | string
        granularity: Property | string
        height: Property | string
        material: MaterialProperty
        numberOfVerticalLines: Property | string
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        rotation: Property | string
        semiMajorAxis: Property | string
        semiMinorAxis: Property | string
        show: Property | string
        stRotation: Property | string


        //Methods
        clone(result?: EllipseGraphics): EllipseGraphics
        merge(source: EllipseGraphics): void

    }

}
declare module 'cesium/DataSources/EllipsoidGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface EllipsoidGraphicsOptions {
        radii?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        subdivisions?: Property | string;
        stackPartitions?: Property | string;
        slicePartitions?: Property | string;
    }
    export default EllipsoidGraphicsOptions;
}
declare module 'cesium/DataSources/EllipsoidGraphics' {
    import EllipsoidGraphicsOptions from 'cesium/DataSources/EllipsoidGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class EllipsoidGraphics {
        constructor(options?: EllipsoidGraphicsOptions);
        //Members
        definitionChanged: Event
        fill: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        radii: Property | string
        show: Property | string
        slicePartitions: Property | string
        stackPartitions: Property | string
        subdivisions: Property | string


        //Methods
        clone(result?: EllipsoidGraphics): EllipsoidGraphics
        merge(source: EllipsoidGraphics): void

    }

}
declare module 'cesium/DataSources/LabelGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    interface LabelGraphicsOptions {
        text?: Property | string;
        font?: Property | string;
        style?: Property | string;
        fillColor?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        show?: Property | string;
        scale?: Property | string;
        horizontalOrigin?: Property | string;
        verticalOrigin?: Property | string;
        eyeOffset?: Property | string;
        pixelOffset?: Property | string;
        translucencyByDistance?: Property | string;
        pixelOffsetScaleByDistance?: Property | string;
    }
    export default LabelGraphicsOptions;
}
declare module 'cesium/DataSources/LabelGraphics' {
    import LabelGraphicsOptions from 'cesium/DataSources/LabelGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    export default class LabelGraphics {
        constructor(options?: LabelGraphicsOptions);
        //Members
        definitionChanged: Event
        eyeOffset: Property | string
        fillColor: Property | string
        font: Property | string
        horizontalOrigin: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        pixelOffset: Property | string
        pixelOffsetScaleByDistance: Property | string
        scale: Property | string
        show: Property | string
        style: Property | string
        text: Property | string
        translucencyByDistance: Property | string
        verticalOrigin: Property | string


        //Methods
        clone(result?: LabelGraphics): LabelGraphics
        merge(source: LabelGraphics): void

    }

}
declare module 'cesium/DataSources/ModelGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    interface ModelGraphicsOptions {
        uri?: Property | string;
        show?: Property | string;
        scale?: Property | string;
        minimumPixelSize?: Property | string;
    }
    export default ModelGraphicsOptions;
}
declare module 'cesium/DataSources/ModelGraphics' {
    import ModelGraphicsOptions from 'cesium/DataSources/ModelGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    export default class ModelGraphics {
        constructor(options?: ModelGraphicsOptions);
        //Members
        definitionChanged: Event
        minimumPixelSize: Property | string
        scale: Property | string
        show: Property | string
        uri: Property | string


        //Methods
        clone(result?: ModelGraphics): ModelGraphics
        merge(source: ModelGraphics): void

    }

}
declare module 'cesium/DataSources/PathGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface PathGraphicsOptions {
        leadTime?: Property | string;
        trailTime?: Property | string;
        show?: Property | string;
        width?: Property | string;
        material?: MaterialProperty;
        resolution?: Property | string;
    }
    export default PathGraphicsOptions;
}
declare module 'cesium/DataSources/PathGraphics' {
    import PathGraphicsOptions from 'cesium/DataSources/PathGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class PathGraphics {
        constructor(options?: PathGraphicsOptions);
        //Members
        definitionChanged: Event
        leadTime: Property | string
        material: MaterialProperty
        resolution: Property | string
        show: Property | string
        trailTime: Property | string
        width: Property | string


        //Methods
        clone(result?: PathGraphics): PathGraphics
        merge(source: PathGraphics): void

    }

}
declare module 'cesium/DataSources/PointGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    interface PointGraphicsOptions {
        color?: Property | string;
        pixelSize?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        show?: Property | string;
        scaleByDistance?: Property | string;
        translucencyByDistance?: Property | string;
    }

    export default PointGraphicsOptions;
}
declare module 'cesium/DataSources/PointGraphics' {
    import PointGraphicsOptions from 'cesium/DataSources/PointGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    export default class PointGraphics {
        constructor(options?: PointGraphicsOptions);
        //Members
        color: Property | string
        definitionChanged: Event
        outlineColor: Property | string
        outlineWidth: Property | string
        pixelSize: Property | string
        scaleByDistance: Property | string
        show: Property | string
        translucencyByDistance: Property | string


        //Methods
        clone(result?: PointGraphics): PointGraphics
        merge(source: PointGraphics): void

    }

}
declare module 'cesium/DataSources/PolygonGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface PolygonGraphicsOptions {
        hierarchy?: Property | string;
        height?: Property | string;
        extrudedHeight?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        stRotation?: Property | string;
        granularity?: Property | string;
        perPositionHeight?: Property | string;
    }
    export default PolygonGraphicsOptions;
}
declare module 'cesium/DataSources/PolygonGraphics' {
    import PolygonGraphicsOptions from 'cesium/DataSources/PolygonGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class PolygonGraphics {
        constructor(options?: PolygonGraphicsOptions);
        //Members
        definitionChanged: Event
        extrudedHeight: Property | string
        fill: Property | string
        granularity: Property | string
        height: Property | string
        hierarchy: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        perPositionHeight: Property | string
        show: Property | string
        stRotation: Property | string


        //Methods
        clone(result?: PolygonGraphics): PolygonGraphics
        merge(source: PolygonGraphics): void

    }

}
declare module 'cesium/DataSources/PolylineGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface PolylineGraphicsOptions {
        positions?: Property | string;
        followSurface?: Property | string;
        width?: Property | string;
        show?: Property | string;
        material?: MaterialProperty;
        granularity?: Property | string;
    }
    export default PolylineGraphicsOptions;

}
declare module 'cesium/DataSources/PolylineGraphics' {
    import PolylineGraphicsOptions from 'cesium/DataSources/PolylineGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class PolylineGraphics {
        constructor(options?: PolylineGraphicsOptions);
        //Members
        definitionChanged: Event
        followSurface: Property | string
        granularity: Property | string
        material: MaterialProperty
        positions: Property | string
        show: Property | string
        width: Property | string


        //Methods
        clone(result?: PolylineGraphics): PolylineGraphics
        merge(source: PolylineGraphics): void

    }

}
declare module 'cesium/DataSources/PolylineVolumeGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface PolylineVolumeGraphicsOptions {
        positions?: Property | string;
        shape?: Property | string;
        cornerType?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        granularity?: Property | string;
    }
    export default PolylineVolumeGraphicsOptions;

}
declare module 'cesium/DataSources/PolylineVolumeGraphics' {
    import PolylineVolumeGraphicsOptions from 'cesium/DataSources/PolylineVolumeGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class PolylineVolumeGraphics {
        constructor(options?: PolylineVolumeGraphicsOptions);
        //Members
        cornerType: Property | string
        definitionChanged: Event
        fill: Property | string
        granularity: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        positions: Property | string
        shape: Property | string
        show: Property | string


        //Methods
        clone(result?: PolylineVolumeGraphics): PolylineVolumeGraphics
        merge(source: PolylineVolumeGraphics): void

    }

}
declare module 'cesium/DataSources/RectangleGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface RectangleGraphicsOptions {
        coordinates?: Property | string;
        height?: Property | string;
        extrudedHeight?: Property | string;
        closeTop?: Property | string;
        closeBottom?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        rotation?: Property | string;
        stRotation?: Property | string;
        granularity?: Property | string;
    }
    export default RectangleGraphicsOptions;
}
declare module 'cesium/DataSources/RectangleGraphics' {
    import RectangleGraphicsOptions from 'cesium/DataSources/RectangleGraphicsOptions'
    import Property from 'cesium/DataSources/Property'
    import Event from 'cesium/Core/Event'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class RectangleGraphics {
        constructor(options?: RectangleGraphicsOptions);
        //Members
        closeBottom: Property | string
        closeTop: Property | string
        coordinates: Property | string
        definitionChanged: Event
        extrudedHeight: Property | string
        fill: Property | string
        granularity: Property | string
        height: Property | string
        material: MaterialProperty
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        rotation: Property | string
        show: Property | string
        stRotation: Property | string


        //Methods
        clone(result?: RectangleGraphics): RectangleGraphics
        merge(source: RectangleGraphics): void

    }

}
declare module 'cesium/DataSources/WallGraphicsOptions' {
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    interface WallGraphicsOptions {
        positions?: Property | string;
        maximumHeights?: Property | string;
        minimumHeights?: Property | string;
        show?: Property | string;
        fill?: Property | string;
        material?: MaterialProperty;
        outline?: Property | string;
        outlineColor?: Property | string;
        outlineWidth?: Property | string;
        granularity?: Property | string;
    }
    export default WallGraphicsOptions;
}
declare module 'cesium/DataSources/WallGraphics' {
    import WallGraphicsOptions from 'cesium/DataSources/WallGraphicsOptions'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    export default class WallGraphics {
        constructor(options?: WallGraphicsOptions);
        //Members
        definitionChanged: Event
        fill: Property | string
        granularity: Property | string
        material: MaterialProperty
        maximumHeights: Property | string
        minimumHeights: Property | string
        outline: Property | string
        outlineColor: Property | string
        outlineWidth: Property | string
        positions: Property | string
        show: Property | string


        //Methods
        clone(result?: WallGraphics): WallGraphics
        merge(source: WallGraphics): void

    }

}
declare module 'cesium/DataSources/EntityOptions' {
    import Property from 'cesium/DataSources/Property'
    import PositionProperty from 'cesium/DataSources/PositionProperty'
    import Entity from 'cesium/DataSources/Entity'
    import BillboardGraphics from 'cesium/DataSources/BillboardGraphics'
    import BoxGraphics from 'cesium/DataSources/BoxGraphics'
    import CorridorGraphics from 'cesium/DataSources/CorridorGraphics'
    import CylinderGraphics from 'cesium/DataSources/CylinderGraphics'
    import EllipseGraphics from 'cesium/DataSources/EllipseGraphics'
    import EllipsoidGraphics from 'cesium/DataSources/EllipsoidGraphics'
    import LabelGraphics from 'cesium/DataSources/LabelGraphics'
    import ModelGraphics from 'cesium/DataSources/ModelGraphics'
    import PathGraphics from 'cesium/DataSources/PathGraphics'
    import PointGraphics from 'cesium/DataSources/PointGraphics'
    import PolygonGraphics from 'cesium/DataSources/PolygonGraphics'
    import PolylineGraphics from 'cesium/DataSources/PolylineGraphics'
    import PolylineVolumeGraphics from 'cesium/DataSources/PolylineVolumeGraphics'
    import RectangleGraphics from 'cesium/DataSources/RectangleGraphics'
    import WallGraphics from 'cesium/DataSources/WallGraphics'
    interface EntityOptions {
        id?: string;
        name?: string;
        show?: boolean;
        description?: Property | string;
        position?: PositionProperty;
        orientation?: Property | string;
        viewFrom?: Property | string;
        parent?: Entity;
        billboard?: BillboardGraphics;
        box?: BoxGraphics;
        corridor?: CorridorGraphics;
        cylinder?: CylinderGraphics;
        ellipse?: EllipseGraphics;
        ellipsoid?: EllipsoidGraphics;
        label?: LabelGraphics;
        model?: ModelGraphics;
        path?: PathGraphics;
        point?: PointGraphics;
        polygon?: PolygonGraphics;
        polyline?: PolylineGraphics;
        polylineVolume?: PolylineVolumeGraphics;
        rectangle?: RectangleGraphics;
        wall?: WallGraphics;
    }
    export default EntityOptions;
}
declare module 'cesium/DataSources/Entity' {
    import EntityOptions from 'cesium/DataSources/EntityOptions'
    import TimeIntervalCollection from 'cesium/Core/TimeIntervalCollection'
    import BillboardGraphics from 'cesium/DataSources/BillboardGraphics'
    import BoxGraphics from 'cesium/DataSources/BoxGraphics'
    import CorridorGraphics from 'cesium/DataSources/CorridorGraphics'
    import CylinderGraphics from 'cesium/DataSources/CylinderGraphics'
    import Event from 'cesium/Core/Event'
    import Property from 'cesium/DataSources/Property'
    import EllipseGraphics from 'cesium/DataSources/EllipseGraphics'
    import EllipsoidGraphics from 'cesium/DataSources/EllipsoidGraphics'
    import LabelGraphics from 'cesium/DataSources/LabelGraphics'
    import ModelGraphics from 'cesium/DataSources/ModelGraphics'
    import PathGraphics from 'cesium/DataSources/PathGraphics'
    import PointGraphics from 'cesium/DataSources/PointGraphics'
    import PolygonGraphics from 'cesium/DataSources/PolygonGraphics'
    import PolylineGraphics from 'cesium/DataSources/PolylineGraphics'
    import PolylineVolumeGraphics from 'cesium/DataSources/PolylineVolumeGraphics'
    import PositionProperty from 'cesium/DataSources/PositionProperty'
    import RectangleGraphics from 'cesium/DataSources/RectangleGraphics'
    import WallGraphics from 'cesium/DataSources/WallGraphics'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class Entity {
        constructor(options?: EntityOptions);
        //Members
        availability: TimeIntervalCollection
        billboard: BillboardGraphics
        box: BoxGraphics
        corridor: CorridorGraphics
        cylinder: CylinderGraphics
        definitionChanged: Event
        description: Property | string
        ellipse: EllipseGraphics
        ellipsoid: EllipsoidGraphics
        id: string
        isShowing: boolean
        label: LabelGraphics
        model: ModelGraphics
        name: string
        orientation: Property | string
        parent: Entity
        path: PathGraphics
        point: PointGraphics
        polygon: PolygonGraphics
        polyline: PolylineGraphics
        polylineVolume: PolylineVolumeGraphics
        position: PositionProperty
        propertyNames: Event
        rectangle: RectangleGraphics
        show: boolean
        viewFrom: Property | string
        wall: WallGraphics


        //Methods
        addProperty(propertyName: string): void
        isAvailable(time: JulianDate): boolean
        merge(source: Entity): void
        removeProperty(propertyName: string): void

    }

}
declare module 'cesium/DataSources/EntityCollection' {
    import Event from 'cesium/Core/Event'
    import Entity from 'cesium/DataSources/Entity'
    import TimeInterval from 'cesium/Core/TimeInterval'
    export default class EntityCollection {
        constructor();
        //Members
        collectionChanged: Event
        id: string
        values: Array<Entity>


        //Methods
        static collectionChangedEventCallback(collection: EntityCollection, added: Array<Entity>, removed: Array<Entity>, changed: Array<Entity>): void
        add(entity: Entity): Entity
        computeAvailability(): TimeInterval
        contains(entity: Entity): boolean
        getById(id: any): Entity
        getOrCreateEntity(id: any): Entity
        remove(entity: Entity): boolean
        removeAll(): void
        removeById(id: any): boolean
        resumeEvents(): void
        suspendEvents(): void

    }

}
declare module 'cesium/DataSources/CustomDataSource' {
    import Event from 'cesium/Core/Event'
    import DataSourceClock from 'cesium/DataSources/DataSourceClock'
    import EntityCollection from 'cesium/DataSources/EntityCollection'
    export default class CustomDataSource {
        constructor(name?: string);
        //Members
        changedEvent: Event
        clock: DataSourceClock
        entities: EntityCollection
        errorEvent: Event
        isLoading: boolean
        loadingEvent: Event
        name: string


        //Methods

    }

}
declare module 'cesium/DataSources/DataSource' {
    import Event from 'cesium/Core/Event'
    import DataSourceClock from 'cesium/DataSources/DataSourceClock'
    import EntityCollection from 'cesium/DataSources/EntityCollection'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class DataSource {
        constructor();
        //Members
        changedEvent: Event
        clock: DataSourceClock
        entities: EntityCollection
        errorEvent: Event
        isLoading: boolean
        loadingEvent: Event
        name: string


        //Methods
        update(time: JulianDate): boolean

    }

}
declare module 'cesium/DataSources/loadOptions' {
    interface loadOptions {
        sourceUri?: string;
    }
    export default loadOptions;
}
declare module 'cesium/DataSources/processOptions' {
    interface processOptions {
        sourceUri?: string;
    }
    export default processOptions;
}
declare module 'cesium/DataSources/CzmlDataSource' {
    import DataSource from 'cesium/DataSources/DataSource'
    import Event from 'cesium/Core/Event'
    import DataSourceClock from 'cesium/DataSources/DataSourceClock'
    import EntityCollection from 'cesium/DataSources/EntityCollection'
    import Promise from 'cesium/Promise'
    import loadOptions from 'cesium/DataSources/loadOptions'
    import TimeInterval from 'cesium/Core/TimeInterval'
    import processOptions from 'cesium/DataSources/processOptions'
    export default class CzmlDataSource extends DataSource {
        constructor(name?: string);
        //Members
        static updaters: Array<any>
        changedEvent: Event
        clock: DataSourceClock
        entities: EntityCollection
        errorEvent: Event
        isLoading: boolean
        loadingEvent: Event
        name: string


        //Methods
        static load(data: string | any, options?: loadOptions): Promise<CzmlDataSource>
        static processMaterialPacketData(object: any, propertyName: string, packetData: any, interval: TimeInterval, sourceUri: string, entityCollection: EntityCollection): void
        static processPacketData(type: (() => void), object: any, propertyName: string, packetData: any, interval: TimeInterval, sourceUri: string, entityCollection: EntityCollection): void
        static processPositionPacketData(object: any, propertyName: string, packetData: any, interval: TimeInterval, sourceUri: string, entityCollection: EntityCollection): void
        load(czml: string | any, options?: loadOptions): Promise<CzmlDataSource>
        process(czml: string | any, options?: processOptions): Promise<CzmlDataSource>

    }

}
declare module 'cesium/DataSources/DataSourceCollection' {
    import Event from 'cesium/Core/Event'
    import DataSource from 'cesium/DataSources/DataSource'
    import Promise from 'cesium/Promise'
    export default class DataSourceCollection {
        constructor();
        //Members
        dataSourceAdded: Event
        dataSourceRemoved: Event
        length: number


        //Methods
        add(dataSource: DataSource | Promise<DataSource>): Promise<DataSource>
        contains(dataSource: DataSource): boolean
        destroy(): void
        get(index: number): void
        indexOf(dataSource: DataSource): number
        isDestroyed(): boolean
        remove(dataSource: DataSource, destroy?: boolean): boolean
        removeAll(destroy?: boolean): void

    }

}
declare module 'cesium/DataSources/DataSourceDisplayOptions' {
    import Scene from 'cesium/Scene/Scene'
    import DataSourceCollection from 'cesium/DataSources/DataSourceCollection'
    interface DataSourceDisplayOptions {
        scene: Scene;
        dataSourceCollection: DataSourceCollection;
        visualizersCallback?: any;
    }
    export default DataSourceDisplayOptions;
}
declare module 'cesium/DataSources/DataSourceDisplay' {
    import DataSourceDisplayOptions from 'cesium/DataSources/DataSourceDisplayOptions'
    import DataSourceCollection from 'cesium/DataSources/DataSourceCollection'
    import CustomDataSource from 'cesium/DataSources/CustomDataSource'
    import Scene from 'cesium/Scene/Scene'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class DataSourceDisplay {
        constructor(options?: DataSourceDisplayOptions);
        //Members
        static defaultVisualizersCallback: any
        dataSources: DataSourceCollection
        defaultDataSource: CustomDataSource
        scene: Scene


        //Methods
        destroy(): void
        isDestroyed(): boolean
        update(time: JulianDate): boolean
    }

}
declare module 'cesium/DataSources/EntityView' {
    import Entity from 'cesium/DataSources/Entity'
    import Scene from 'cesium/Scene/Scene'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class EntityView {
        constructor(entity: Entity, scene: Scene, ellipsoid?: Ellipsoid, boundingSphere?: BoundingSphere);
        //Members
        static defaultOffset3D: Cartesian3
        boundingSphere: Entity
        ellipsoid: Ellipsoid
        entity: Entity
        scene: Scene


        //Methods
        update(time: JulianDate): void

    }

}
declare module 'cesium/DataSources/setInterpolationOptionsOptions' {
    import InterpolationAlgorithm from 'cesium/Core/InterpolationAlgorithm'
    interface setInterpolationOptionsOptions {
        interpolationAlgorithm?: InterpolationAlgorithm;
        interpolationDegree?: number;
    }
    export default setInterpolationOptionsOptions;
}
declare module 'cesium/DataSources/SampledPositionProperty' {
    import ReferenceFrame from 'cesium/Core/ReferenceFrame'
    import ExtrapolationType from 'cesium/Core/ExtrapolationType'
    import Event from 'cesium/Core/Event'
    import InterpolationAlgorithm from 'cesium/Core/InterpolationAlgorithm'
    import JulianDate from 'cesium/Core/JulianDate'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Property from 'cesium/DataSources/Property'
    import setInterpolationOptionsOptions from 'cesium/DataSources/setInterpolationOptionsOptions'
    export default class SampledPositionProperty {
        constructor(referenceFrame?: ReferenceFrame, numberOfDerivatives?: number);
        //Members
        backwardExtrapolationDuration: number
        backwardExtrapolationType: ExtrapolationType
        definitionChanged: Event
        forwardExtrapolationDuration: number
        forwardExtrapolationType: ExtrapolationType
        interpolationAlgorithm: InterpolationAlgorithm
        interpolationDegree: number
        isConstant: boolean
        numberOfDerivatives: boolean
        referenceFrame: ReferenceFrame


        //Methods
        addSample(time: JulianDate, position: Cartesian3, derivatives?: Array<Cartesian3>): void
        addSamples(times: Array<JulianDate>, positions: Array<Cartesian3>, derivatives?: Array<Array<any>>): void
        addSamplesPackedArray(packedSamples: Array<number>, epoch?: JulianDate): void
        equals(other?: Property | string): boolean
        getValue(time: JulianDate, result?: Cartesian3): Cartesian3
        getValueInReferenceFrame(time: JulianDate, referenceFrame: ReferenceFrame, result?: Cartesian3): Cartesian3
        setInterpolationOptions(options?: setInterpolationOptionsOptions): void

    }

}
declare module 'cesium/DataSources/TimeIntervalCollectionProperty' {
    import Event from 'cesium/Core/Event'
    import TimeIntervalCollection from 'cesium/Core/TimeIntervalCollection'
    import Property from 'cesium/DataSources/Property'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class TimeIntervalCollectionProperty extends Property {
        constructor();
        //Members
        definitionChanged: Event
        intervals: TimeIntervalCollection
        isConstant: boolean


        //Methods
        equals(other?: Property | string): boolean
        getValue(time: JulianDate, result?: any): Object

    }

}
declare module 'cesium/DataSources/VelocityOrientationProperty' {
    import Property from 'cesium/DataSources/Property'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Event from 'cesium/Core/Event'
    import Quaternion from 'cesium/Core/Quaternion'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class VelocityOrientationProperty extends Property {
        constructor(position?: Property | string, ellipsoid?: Ellipsoid);
        //Members
        definitionChanged: Event
        ellipsoid: Property | string
        isConstant: boolean
        position: Property | string


        //Methods
        equals(other?: Property | string): boolean
        getValue(time?: JulianDate, result?: Quaternion): Quaternion

    }

}
declare module 'cesium/Scene/FrameRateMonitorOptions' {
    import Scene from 'cesium/Scene/Scene'
    interface FrameRateMonitorOptions {
        scene: Scene;
        samplingWindow?: number;
        quietPeriod?: number;
        warmupPeriod?: number;
        minimumFrameRateDuringWarmup?: number;
        minimumFrameRateAfterWarmup?: number;
    }
    export default FrameRateMonitorOptions;
}
declare module 'cesium/Scene/FrameRateMonitor' {
    import FrameRateMonitorOptions from 'cesium/Scene/FrameRateMonitorOptions'
    import Event from 'cesium/Core/Event'
    import Scene from 'cesium/Scene/Scene'
    export default class FrameRateMonitor {
        constructor(options?: FrameRateMonitorOptions);
        //Members
        static defaultSettings: Object
        lastFramesPerSecond: number
        lowFrameRate: Event
        minimumFrameRateAfterWarmup: number
        minimumFrameRateDuringWarmup: number
        nominalFrameRate: Event
        quietPeriod: number
        samplingWindow: number
        scene: Scene
        warmupPeriod: number


        //Methods
        static fromScene(scene: Scene): FrameRateMonitor
        destroy(): void
        isDestroyed(): boolean
        pause(): void
        unpause(): void

    }

}
declare module 'cesium/Scene/ModelOptions' {
    import Matrix4 from 'cesium/Core/Matrix4'
    interface ModelOptions {
        gltf?: Object | ArrayBuffer | Uint8Array;
        basePath?: string;
        show?: boolean;
        modelMatrix?: Matrix4;
        scale?: number;
        minimumPixelSize?: number;
        id?: Object;
        allowPicking?: boolean;
        asynchronous?: boolean;
        debugShowBoundingVolume?: boolean;
        debugWireframe?: boolean;
    }
    export default ModelOptions;
}
declare module 'cesium/Scene/ModelAnimationLoop' {
    export default class ModelAnimationLoop {
        constructor();
        //Members
        static MIRRORED_REPEAT: number
        static NONE: number
        static REPEAT: number


        //Methods

    }

}
declare module 'cesium/Scene/ModelAnimation' {
    import ModelAnimationLoop from 'cesium/Scene/ModelAnimationLoop'
    import Event from 'cesium/Core/Event'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class ModelAnimation {
        constructor();
        //Members
        delay: number
        loop: ModelAnimationLoop
        name: string
        removeOnStop: boolean
        reverse: boolean
        speedup: number
        start: Event
        startTime: JulianDate
        stop: Event
        stopTime: JulianDate
        update: Event


        //Methods

    }

}
declare module 'cesium/Scene/addOptions' {
    import JulianDate from 'cesium/Core/JulianDate'
    import ModelAnimationLoop from 'cesium/Scene/ModelAnimationLoop'
    interface addOptions {
        name: string;
        startTime?: JulianDate;
        delay?: number;
        stopTime?: JulianDate;
        removeOnStop?: boolean;
        speedup?: number;
        reverse?: boolean;
        loop?: ModelAnimationLoop;
    }
    export default addOptions;
}
declare module 'cesium/Scene/addAllOptions' {
    import JulianDate from 'cesium/Core/JulianDate'
    import ModelAnimationLoop from 'cesium/Scene/ModelAnimationLoop'
    interface addAllOptions {
        startTime?: JulianDate;
        delay?: number;
        stopTime?: JulianDate;
        removeOnStop?: boolean;
        speedup?: number;
        reverse?: boolean;
        loop?: ModelAnimationLoop;
    }
    export default addAllOptions;
}
declare module 'cesium/Scene/ModelAnimationCollection' {
    import Event from 'cesium/Core/Event'
    import ModelAnimation from 'cesium/Scene/ModelAnimation'
    import addOptions from 'cesium/Scene/addOptions'
    import addAllOptions from 'cesium/Scene/addAllOptions'
    export default class ModelAnimationCollection {
        constructor();
        //Members
        animationAdded: Event
        animationRemoved: Event
        length: number


        //Methods
        add(options?: addOptions): ModelAnimation
        addAll(options?: addAllOptions): Array<ModelAnimation>
        contains(animation: ModelAnimation): boolean
        get(index: number): ModelAnimation
        remove(animation: ModelAnimation): boolean
        removeAll(): void

    }

}
declare module 'cesium/Scene/fromGltfOptions' {
    import Matrix4 from 'cesium/Core/Matrix4'
    interface fromGltfOptions {
        url: string;
        headers?: Object;
        show?: boolean;
        modelMatrix?: Matrix4;
        scale?: number;
        minimumPixelSize?: number;
        allowPicking?: boolean;
        asynchronous?: boolean;
        debugShowBoundingVolume?: boolean;
        debugWireframe?: boolean;
    }
    export default fromGltfOptions;
}
declare module 'cesium/Scene/ModelMaterial' {
    export default class ModelMaterial {
        constructor();
        //Members
        id: string
        name: string


        //Methods
        getValue(name: string): Object
        setValue(name: string, value?: any): void

    }

}
declare module 'cesium/Scene/ModelMesh' {
    import ModelMaterial from 'cesium/Scene/ModelMaterial'
    export default class ModelMesh {
        constructor();
        //Members
        id: string
        materials: Array<ModelMaterial>
        name: string


        //Methods

    }

}
declare module 'cesium/Scene/ModelNode' {
    import Matrix4 from 'cesium/Core/Matrix4'
    export default class ModelNode {
        constructor();
        //Members
        id: string
        matrix: Matrix4
        name: string
        show: boolean


        //Methods

    }

}
declare module 'cesium/Scene/Model' {
    import ModelOptions from 'cesium/Scene/ModelOptions'
    import ModelAnimationCollection from 'cesium/Scene/ModelAnimationCollection'
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import Matrix4 from 'cesium/Core/Matrix4'
    import Promise from 'cesium/Promise'
    import fromGltfOptions from 'cesium/Scene/fromGltfOptions'
    import ModelMaterial from 'cesium/Scene/ModelMaterial'
    import ModelMesh from 'cesium/Scene/ModelMesh'
    import ModelNode from 'cesium/Scene/ModelNode'
    export default class Model {
        constructor(options?: ModelOptions);
        //Members
        activeAnimations: ModelAnimationCollection
        allowPicking: boolean
        asynchronous: boolean
        basePath: string
        boundingSphere: BoundingSphere
        debugShowBoundingVolume: boolean
        debugWireframe: boolean
        gltf: Object
        id: Object
        minimumPixelSize: number
        modelMatrix: Matrix4
        ready: boolean
        readyPromise: Promise<Model>
        scale: number
        show: boolean


        //Methods
        static fromGltf(options?: fromGltfOptions): Model
        destroy(): void
        getMaterial(name: string): ModelMaterial
        getMesh(name: string): ModelMesh
        getNode(name: string): ModelNode
        isDestroyed(): boolean
        update(): void

    }

}
declare module 'cesium/Scene/WebMapTileServiceImageryProviderOptions' {
    import TilingScheme from 'cesium/Core/TilingScheme'
    import Rectangle from 'cesium/Core/Rectangle'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Credit from 'cesium/Core/Credit'
    interface WebMapTileServiceImageryProviderOptions {
        url: string;
        format?: string;
        layer: string;
        style: string;
        tileMatrixSetID: string;
        tileMatrixLabels?: Array<any>;
        tileWidth?: number;
        tileHeight?: number;
        tilingScheme?: TilingScheme;
        proxy?: Object;
        rectangle?: Rectangle;
        minimumLevel?: number;
        maximumLevel?: number;
        ellipsoid?: Ellipsoid;
        credit?: Credit | string;
        subdomains?: string | Array<string>;
    }
    export default WebMapTileServiceImageryProviderOptions;
}
declare module 'cesium/Scene/WebMapTileServiceImageryProvider' {
    import WebMapTileServiceImageryProviderOptions from 'cesium/Scene/WebMapTileServiceImageryProviderOptions'
    import Credit from 'cesium/Core/Credit'
    import Event from 'cesium/Core/Event'
    import DefaultProxy from 'cesium/Core/DefaultProxy'
    import Rectangle from 'cesium/Core/Rectangle'
    import TileDiscardPolicy from 'cesium/Scene/TileDiscardPolicy'
    import TilingScheme from 'cesium/Core/TilingScheme'
    import ImageryLayerFeatureInfo from 'cesium/Scene/ImageryLayerFeatureInfo'
    import Promise from 'cesium/Promise'
    export default class WebMapTileServiceImageryProvider {
        constructor(options?: WebMapTileServiceImageryProviderOptions);
        //Members
        credit: Credit
        errorEvent: Event
        format: string
        hasAlphaChannel: boolean
        maximumLevel: number
        minimumLevel: number
        proxy: DefaultProxy
        ready: boolean
        rectangle: Rectangle
        tileDiscardPolicy: TileDiscardPolicy
        tileHeight: number
        tileWidth: number
        tilingScheme: TilingScheme
        url: string


        //Methods
        getTileCredits(x: number, y: number, level: number): Array<Credit>
        pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<Array<ImageryLayerFeatureInfo>> | void
        requestImage(x: number, y: number, level: number): Promise<HTMLImageElement | HTMLCanvasElement> | void

    }

}
declare module 'cesium/Widgets/ClockViewModel' {
    import Clock from 'cesium/Core/Clock'
    import ClockRange from 'cesium/Core/ClockRange'
    import ClockStep from 'cesium/Core/ClockStep'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class ClockViewModel {
        constructor(clock?: Clock);
        //Members
        canAnimate: boolean
        clock: Clock
        clockRange: ClockRange
        clockStep: ClockStep
        currentTime: JulianDate
        multiplier: number
        shouldAnimate: boolean
        startTime: JulianDate
        stopTime: JulianDate
        systemTime: JulianDate


        //Methods
        destroy(): void
        isDestroyed(): boolean
        synchronize(): void

    }

}
declare module 'cesium/Widgets/Command' {
    import Event from 'cesium/Core/Event'
    export default class Command {
        constructor();
        //Members
        afterExecute: Event
        beforeExecute: Event
        canExecute: boolean


        //Methods

    }

}
declare module 'cesium/Widgets/ToggleButtonViewModelOptions' {
    interface ToggleButtonViewModelOptions {
        toggled?: boolean;
        tooltip?: string;
    }
    export default ToggleButtonViewModelOptions;
}
declare module 'cesium/Widgets/ToggleButtonViewModel' {
    import Command from 'cesium/Widgets/Command'
    import ToggleButtonViewModelOptions from 'cesium/Widgets/ToggleButtonViewModelOptions'
    export default class ToggleButtonViewModel {
        constructor(command: Command, options?: ToggleButtonViewModelOptions);
        //Members
        command: Command
        toggled: boolean
        tooltip: string


        //Methods

    }

}
declare module 'cesium/Widgets/Animation/AnimationViewModel' {
    import ClockViewModel from 'cesium/Widgets/ClockViewModel'
    import Command from 'cesium/Widgets/Command'
    import ToggleButtonViewModel from 'cesium/Widgets/ToggleButtonViewModel'
    export default class AnimationViewModel {
        constructor(clockViewModel: ClockViewModel);
        //Members
        static defaultDateFormatter: any
        static defaultTicks: Array<number>
        static defaultTimeFormatter: any
        clockViewModel: ClockViewModel
        dateFormatter: any
        dateLabel: string
        faster: Command
        multiplierLabel: string
        pauseViewModel: ToggleButtonViewModel
        playForwardViewModel: ToggleButtonViewModel
        playRealtimeViewModel: ToggleButtonViewModel
        playReverseViewModel: ToggleButtonViewModel
        shuttleRingAngle: number
        shuttleRingDragging: boolean
        slower: Command
        snapToTicks: boolean
        timeFormatter: any
        timeLabel: string


        //Methods
        getShuttleRingTicks(): Array<number>
        setShuttleRingTicks(positiveTicks: Array<number>): void

    }

}
declare module 'cesium/Widgets/Animation/Animation' {
    import AnimationViewModel from 'cesium/Widgets/Animation/AnimationViewModel'
    export default class Animation {
        constructor(container: Element | string, viewModel: AnimationViewModel);
        //Members
        container: Element
        viewModel: AnimationViewModel


        //Methods
        applyThemeChanges(): void
        destroy(): void
        isDestroyed(): boolean
        resize(): void

    }

}
declare module 'cesium/Widgets/BaseLayerPicker/ProviderViewModelOptions' {
    import Command from 'cesium/Widgets/Command'
    interface ProviderViewModelOptions {
        name: string;
        tooltip: string;
        iconUrl: string;
        creationFunction: any | Command;
    }
    export default ProviderViewModelOptions;
}
declare module 'cesium/Widgets/BaseLayerPicker/ProviderViewModel' {
    import ProviderViewModelOptions from 'cesium/Widgets/BaseLayerPicker/ProviderViewModelOptions'
    import Command from 'cesium/Widgets/Command'
    export default class ProviderViewModel {
        constructor(options: ProviderViewModelOptions);
        //Members
        creationCommand: Command
        iconUrl: string
        name: string
        tooltip: string


        //Methods

    }

}
declare module 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerOptions' {
    import Globe from 'cesium/Scene/Globe'
    import ProviderViewModel from 'cesium/Widgets/BaseLayerPicker/ProviderViewModel'
    interface BaseLayerPickerOptions {
        globe: Globe;
        imageryProviderViewModels?: Array<ProviderViewModel>;
        selectedImageryProviderViewModel?: ProviderViewModel;
        terrainProviderViewModels?: Array<ProviderViewModel>;
        selectedTerrainProviderViewModel?: ProviderViewModel;
    }
    export default BaseLayerPickerOptions;
}
declare module 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerViewModelOptions' {
    import Globe from 'cesium/Scene/Globe'
    import ProviderViewModel from 'cesium/Widgets/BaseLayerPicker/ProviderViewModel'
    interface BaseLayerPickerViewModelOptions {
        globe: Globe;
        imageryProviderViewModels?: Array<ProviderViewModel>;
        selectedImageryProviderViewModel?: ProviderViewModel;
        terrainProviderViewModels?: Array<ProviderViewModel>;
        selectedTerrainProviderViewModel?: ProviderViewModel;
    }
    export default BaseLayerPickerViewModelOptions;
}
declare module 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerViewModel' {
    import BaseLayerPickerViewModelOptions from 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerViewModelOptions'
    import Globe from 'cesium/Scene/Globe'
    import ProviderViewModel from 'cesium/Widgets/BaseLayerPicker/ProviderViewModel'
    import Command from 'cesium/Widgets/Command'
    export default class BaseLayerPickerViewModel {
        constructor(options?: BaseLayerPickerViewModelOptions);
        //Members
        buttonImageUrl: string
        buttonTooltip: string
        dropDownVisible: boolean
        globe: Globe
        imageryProviderViewModels: Array<ProviderViewModel>
        selectedImagery: ProviderViewModel
        selectedTerrain: ProviderViewModel
        terrainProviderViewModels: Array<ProviderViewModel>
        toggleDropDown: Command


        //Methods

    }

}
declare module 'cesium/Widgets/BaseLayerPicker/BaseLayerPicker' {
    import BaseLayerPickerOptions from 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerOptions'
    import BaseLayerPickerViewModel from 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerViewModel'
    export default class BaseLayerPicker {
        constructor(container: Element | string, options?: BaseLayerPickerOptions);
        //Members
        container: Element
        viewModel: BaseLayerPickerViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/CesiumWidget/CesiumWidgetOptions' {
    import Clock from 'cesium/Core/Clock'
    import ImageryProvider from 'cesium/Scene/ImageryProvider'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import SkyBox from 'cesium/Scene/SkyBox'
    import SkyAtmosphere from 'cesium/Scene/SkyAtmosphere'
    import SceneMode from 'cesium/Scene/SceneMode'
    import MapProjection from 'cesium/Core/MapProjection'
    import Globe from 'cesium/Scene/Globe'
    interface CesiumWidgetOptions {
        clock?: Clock;
        imageryProvider?: ImageryProvider;
        terrainProvider?: TerrainProvider;
        skyBox?: SkyBox;
        skyAtmosphere?: SkyAtmosphere;
        sceneMode?: SceneMode;
        scene3DOnly?: boolean;
        orderIndependentTranslucency?: boolean;
        mapProjection?: MapProjection;
        globe?: Globe;
        useDefaultRenderLoop?: boolean;
        targetFrameRate?: number;
        showRenderLoopErrors?: boolean;
        contextOptions?: Object;
        creditContainer?: Element | string;
    }
    export default CesiumWidgetOptions;
}
declare module 'cesium/Widgets/CesiumWidget/CesiumWidget' {
    import CesiumWidgetOptions from 'cesium/Widgets/CesiumWidget/CesiumWidgetOptions'
    import Camera from 'cesium/Scene/Camera'
    import Clock from 'cesium/Core/Clock'
    import ImageryLayerCollection from 'cesium/Scene/ImageryLayerCollection'
    import Scene from 'cesium/Scene/Scene'
    import ScreenSpaceEventHandler from 'cesium/Core/ScreenSpaceEventHandler'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    export default class CesiumWidget {
        constructor(container: Element | string, options?: CesiumWidgetOptions);
        //Members
        camera: Camera
        canvas: HTMLCanvasElement
        clock: Clock
        container: Element
        creditContainer: Element
        imageryLayers: ImageryLayerCollection
        resolutionScale: number
        scene: Scene
        screenSpaceEventHandler: ScreenSpaceEventHandler
        targetFrameRate: number
        terrainProvider: TerrainProvider
        useDefaultRenderLoop: boolean


        //Methods
        destroy(): void
        isDestroyed(): boolean
        render(): void
        resize(): void
        showErrorPanel(title: string, message: string, error?: string): void

    }

}
declare module 'cesium/Widgets/FullscreenButton/FullscreenButtonViewModel' {
    import Command from 'cesium/Widgets/Command'
    export default class FullscreenButtonViewModel {
        constructor(fullscreenElement?: Element | string);
        //Members
        command: Command
        fullscreenElement: Element
        isFullscreen: boolean
        isFullscreenEnabled: boolean
        tooltip: string


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/FullscreenButton/FullscreenButton' {
    import FullscreenButtonViewModel from 'cesium/Widgets/FullscreenButton/FullscreenButtonViewModel'
    export default class FullscreenButton {
        constructor(container: Element | string, fullscreenElement?: Element | string);
        //Members
        container: Element
        viewModel: FullscreenButtonViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/Geocoder/GeocoderOptions' {
    import Scene from 'cesium/Scene/Scene'
    interface GeocoderOptions {
        container: Element | string;
        scene: Scene;
        url?: string;
        key?: string;
        flightDuration?: number;
    }
    export default GeocoderOptions;
}
declare module 'cesium/Widgets/Geocoder/GeocoderViewModelOptions' {
    import Scene from 'cesium/Scene/Scene'
    interface GeocoderViewModelOptions {
        scene: Scene;
        url?: string;
        key?: string;
        flightDuration?: number;
    }
    export default GeocoderViewModelOptions;
}
declare module 'cesium/Widgets/Geocoder/GeocoderViewModel' {
    import GeocoderViewModelOptions from 'cesium/Widgets/Geocoder/GeocoderViewModelOptions'
    import Event from 'cesium/Core/Event'
    import Scene from 'cesium/Scene/Scene'
    import Command from 'cesium/Widgets/Command'
    export default class GeocoderViewModel {
        constructor(options?: GeocoderViewModelOptions);
        //Members
        complete: Event
        flightDuration: number | void
        isSearchInProgress: boolean
        key: string
        scene: Scene
        search: Command
        searchText: string
        url: string


        //Methods

    }

}
declare module 'cesium/Widgets/Geocoder/Geocoder' {
    import GeocoderOptions from 'cesium/Widgets/Geocoder/GeocoderOptions'
    import GeocoderViewModel from 'cesium/Widgets/Geocoder/GeocoderViewModel'
    export default class Geocoder {
        constructor(options?: GeocoderOptions);
        //Members
        container: Element
        viewModel: GeocoderViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/HomeButton/HomeButtonViewModel' {
    import Scene from 'cesium/Scene/Scene'
    import Command from 'cesium/Widgets/Command'
    export default class HomeButtonViewModel {
        constructor(scene: Scene, duration?: number);
        //Members
        command: Command
        duration: number | void
        scene: Scene
        tooltip: string


        //Methods

    }

}
declare module 'cesium/Widgets/HomeButton/HomeButton' {
    import Scene from 'cesium/Scene/Scene'
    import HomeButtonViewModel from 'cesium/Widgets/HomeButton/HomeButtonViewModel'
    export default class HomeButton {
        constructor(container: Element | string, scene: Scene, duration?: number);
        //Members
        container: Element
        viewModel: HomeButtonViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/InfoBox/InfoBoxViewModel' {
    import Event from 'cesium/Core/Event'
    export default class InfoBoxViewModel {
        constructor();
        //Members
        cameraClicked: Event
        cameraIconPath: string
        closeClicked: Event
        description: string
        enableCamera: boolean
        isCameraTracking: boolean
        maxHeight: number
        showInfo: boolean
        titleText: string


        //Methods
        maxHeightOffset(offset: number): string

    }

}
declare module 'cesium/Widgets/InfoBox/InfoBox' {
    import InfoBoxViewModel from 'cesium/Widgets/InfoBox/InfoBoxViewModel'
    export default class InfoBox {
        constructor(container: Element | string);
        //Members
        container: Element
        frame: HTMLIFrameElement
        viewModel: InfoBoxViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/NavigationHelpButton/NavigationHelpButtonOptions' {
    interface NavigationHelpButtonOptions {
        container: Element | string;
        instructionsInitiallyVisible?: boolean;
    }
    export default NavigationHelpButtonOptions;
}
declare module 'cesium/Widgets/NavigationHelpButton/NavigationHelpButtonViewModel' {
    import Command from 'cesium/Widgets/Command'
    export default class NavigationHelpButtonViewModel {
        constructor();
        //Members
        command: Command
        showClick: Command
        showInstructions: boolean
        showTouch: Command
        tooltip: string


        //Methods

    }

}
declare module 'cesium/Widgets/NavigationHelpButton/NavigationHelpButton' {
    import NavigationHelpButtonOptions from 'cesium/Widgets/NavigationHelpButton/NavigationHelpButtonOptions'
    import NavigationHelpButtonViewModel from 'cesium/Widgets/NavigationHelpButton/NavigationHelpButtonViewModel'
    export default class NavigationHelpButton {
        constructor(options?: NavigationHelpButtonOptions);
        //Members
        container: Element
        viewModel: NavigationHelpButtonViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/SceneModePicker/SceneModePickerViewModel' {
    import Scene from 'cesium/Scene/Scene'
    import Command from 'cesium/Widgets/Command'
    import SceneMode from 'cesium/Scene/SceneMode'
    export default class SceneModePickerViewModel {
        constructor(scene: Scene, duration?: number);
        //Members
        dropDownVisible: boolean
        duration: number
        morphTo2D: Command
        morphTo3D: Command
        morphToColumbusView: Command
        scene: Scene
        sceneMode: SceneMode
        selectedTooltip: string
        toggleDropDown: Command
        tooltip2D: string
        tooltip3D: string
        tooltipColumbusView: string


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/SceneModePicker/SceneModePicker' {
    import Scene from 'cesium/Scene/Scene'
    import SceneModePickerViewModel from 'cesium/Widgets/SceneModePicker/SceneModePickerViewModel'
    export default class SceneModePicker {
        constructor(container: Element | string, scene: Scene, duration?: number);
        //Members
        container: Element
        viewModel: SceneModePickerViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/SelectionIndicator/SelectionIndicatorViewModel' {
    import Scene from 'cesium/Scene/Scene'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    export default class SelectionIndicatorViewModel {
        constructor(scene: Scene, selectionIndicatorElement: Element, container: Element);
        //Members
        computeScreenSpacePosition: any
        container: Element
        isVisible: boolean
        position: Cartesian3
        scene: Scene
        selectionIndicatorElement: Element
        showSelection: boolean


        //Methods
        animateAppear(): void
        animateDepart(): void
        update(): void

    }

}
declare module 'cesium/Widgets/SelectionIndicator/SelectionIndicator' {
    import Scene from 'cesium/Scene/Scene'
    import SelectionIndicatorViewModel from 'cesium/Widgets/SelectionIndicator/SelectionIndicatorViewModel'
    export default class SelectionIndicator {
        constructor(container: Element | string, scene: Scene);
        //Members
        container: Element
        viewModel: SelectionIndicatorViewModel


        //Methods
        destroy(): void
        isDestroyed(): boolean

    }

}
declare module 'cesium/Widgets/Timeline/Timeline' {
    import Clock from 'cesium/Core/Clock'
    import JulianDate from 'cesium/Core/JulianDate'
    export default class Timeline {
        constructor(container: Element, clock: Clock);
        //Members
        container: Element


        //Methods
        destroy(): void
        isDestroyed(): boolean
        resize(): void
        zoomTo(startTime: JulianDate, stopTime: JulianDate): void

    }

}
declare module 'cesium/Widgets/Viewer/ViewerOptions' {
    import Clock from 'cesium/Core/Clock'
    import ProviderViewModel from 'cesium/Widgets/BaseLayerPicker/ProviderViewModel'
    import ImageryProvider from 'cesium/Scene/ImageryProvider'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import SkyBox from 'cesium/Scene/SkyBox'
    import SkyAtmosphere from 'cesium/Scene/SkyAtmosphere'
    import SceneMode from 'cesium/Scene/SceneMode'
    import MapProjection from 'cesium/Core/MapProjection'
    import Globe from 'cesium/Scene/Globe'
    import DataSourceCollection from 'cesium/DataSources/DataSourceCollection'
    interface ViewerOptions {
        animation?: boolean;
        baseLayerPicker?: boolean;
        fullscreenButton?: boolean;
        geocoder?: boolean;
        homeButton?: boolean;
        infoBox?: boolean;
        sceneModePicker?: boolean;
        selectionIndicator?: boolean;
        timeline?: boolean;
        navigationHelpButton?: boolean;
        navigationInstructionsInitiallyVisible?: boolean;
        scene3DOnly?: boolean;
        clock?: Clock;
        selectedImageryProviderViewModel?: ProviderViewModel;
        imageryProviderViewModels?: Array<ProviderViewModel>;
        selectedTerrainProviderViewModel?: ProviderViewModel;
        terrainProviderViewModels?: Array<ProviderViewModel>;
        imageryProvider?: ImageryProvider;
        terrainProvider?: TerrainProvider;
        skyBox?: SkyBox;
        skyAtmosphere?: SkyAtmosphere;
        fullscreenElement?: Element | string;
        useDefaultRenderLoop?: boolean;
        targetFrameRate?: number;
        showRenderLoopErrors?: boolean;
        automaticallyTrackDataSourceClocks?: boolean;
        contextOptions?: Object;
        sceneMode?: SceneMode;
        mapProjection?: MapProjection;
        globe?: Globe;
        orderIndependentTranslucency?: boolean;
        creditContainer?: Element | string;
        dataSources?: DataSourceCollection;
    }
    export default ViewerOptions;
}
declare module 'cesium/Widgets/Viewer/flyToOptions' {
    import HeadingPitchRange from 'cesium/Scene/HeadingPitchRange'
    interface flyToOptions {
        duration?: number;
        maximumHeight?: number;
        offset?: HeadingPitchRange;
    }
    export default flyToOptions;
}
declare module 'cesium/Widgets/Viewer/Viewer' {
    import ViewerOptions from 'cesium/Widgets/Viewer/ViewerOptions'
    import Animation from 'cesium/Widgets/Animation/Animation'
    import BaseLayerPicker from 'cesium/Widgets/BaseLayerPicker/BaseLayerPicker'
    import Camera from 'cesium/Scene/Camera'
    import CesiumWidget from 'cesium/Widgets/CesiumWidget/CesiumWidget'
    import Clock from 'cesium/Core/Clock'
    import DataSourceDisplay from 'cesium/DataSources/DataSourceDisplay'
    import DataSourceCollection from 'cesium/DataSources/DataSourceCollection'
    import EntityCollection from 'cesium/DataSources/EntityCollection'
    import FullscreenButton from 'cesium/Widgets/FullscreenButton/FullscreenButton'
    import Geocoder from 'cesium/Widgets/Geocoder/Geocoder'
    import HomeButton from 'cesium/Widgets/HomeButton/HomeButton'
    import ImageryLayerCollection from 'cesium/Scene/ImageryLayerCollection'
    import InfoBox from 'cesium/Widgets/InfoBox/InfoBox'
    import NavigationHelpButton from 'cesium/Widgets/NavigationHelpButton/NavigationHelpButton'
    import Scene from 'cesium/Scene/Scene'
    import SceneModePicker from 'cesium/Widgets/SceneModePicker/SceneModePicker'
    import ScreenSpaceEventHandler from 'cesium/Core/ScreenSpaceEventHandler'
    import Entity from 'cesium/DataSources/Entity'
    import SelectionIndicator from 'cesium/Widgets/SelectionIndicator/SelectionIndicator'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import Timeline from 'cesium/Widgets/Timeline/Timeline'
    import Promise from 'cesium/Promise'
    import DataSource from 'cesium/DataSources/DataSource'
    import flyToOptions from 'cesium/Widgets/Viewer/flyToOptions'
    import HeadingPitchRange from 'cesium/Scene/HeadingPitchRange'
    export default class Viewer {
        constructor(container: Element | string, options?: ViewerOptions);
        //Members
        allowDataSourcesToSuspendAnimation: boolean
        animation: Animation
        baseLayerPicker: BaseLayerPicker
        bottomContainer: Element
        camera: Camera
        canvas: HTMLCanvasElement
        cesiumLogo: Element
        cesiumWidget: CesiumWidget
        clock: Clock
        container: Element
        dataSourceDisplay: DataSourceDisplay
        dataSources: DataSourceCollection
        entities: EntityCollection
        fullscreenButton: FullscreenButton
        geocoder: Geocoder
        homeButton: HomeButton
        imageryLayers: ImageryLayerCollection
        infoBox: InfoBox
        navigationHelpButton: NavigationHelpButton
        resolutionScale: number
        scene: Scene
        sceneModePicker: SceneModePicker
        screenSpaceEventHandler: ScreenSpaceEventHandler
        selectedEntity: Entity
        selectionIndicator: SelectionIndicator
        targetFrameRate: number
        terrainProvider: TerrainProvider
        timeline: Timeline
        trackedEntity: Entity
        useDefaultRenderLoop: boolean


        //Methods
        destroy(): void
        extend(mixin: any, options?: any): void
        flyTo(target: Entity | Array<Entity> | EntityCollection | DataSource | Promise<Entity | Array<Entity> | EntityCollection | DataSource>, options?: flyToOptions): Promise<boolean>
        forceResize(): void
        isDestroyed(): boolean
        render(): void
        resize(): void
        zoomTo(target: Entity | Array<Entity> | EntityCollection | DataSource | Promise<Entity | Array<Entity> | EntityCollection | DataSource>, offset?: HeadingPitchRange): Promise<boolean>

    }

}
declare module 'cesium/Widgets/Viewer/viewerCesiumInspectorMixin' {
    import Viewer from 'cesium/Widgets/Viewer/Viewer'
    function viewerCesiumInspectorMixin(viewer: Viewer): void;
    export default viewerCesiumInspectorMixin;
}
declare module 'cesium/Cesium' {
    import Promise from 'cesium/Promise'
    import when from 'cesium/when'
    import BingMapsApi from 'cesium/Core/BingMapsApi'
    import BoundingSphere from 'cesium/Core/BoundingSphere'
    import Cartesian2 from 'cesium/Core/Cartesian2'
    import Cartesian3 from 'cesium/Core/Cartesian3'
    import Cartesian4 from 'cesium/Core/Cartesian4'
    import Cartographic from 'cesium/Core/Cartographic'
    import Math from 'cesium/Core/CesiumMath'
    import CesiumTerrainProvider from 'cesium/Core/CesiumTerrainProvider'
    import Clock from 'cesium/Core/Clock'
    import ClockRange from 'cesium/Core/ClockRange'
    import ClockStep from 'cesium/Core/ClockStep'
    import Color from 'cesium/Core/Color'
    import Credit from 'cesium/Core/Credit'
    import DefaultProxy from 'cesium/Core/DefaultProxy'
    import defaultValue from 'cesium/Core/defaultValue'
    import DeveloperError from 'cesium/Core/DeveloperError'
    import EasingFunction from 'cesium/Core/EasingFunction'
    import Ellipsoid from 'cesium/Core/Ellipsoid'
    import Event from 'cesium/Core/Event'
    import ExtrapolationType from 'cesium/Core/ExtrapolationType'
    import GeographicTilingScheme from 'cesium/Core/GeographicTilingScheme'
    import GregorianDate from 'cesium/Core/GregorianDate'
    import InterpolationAlgorithm from 'cesium/Core/InterpolationAlgorithm'
    import Intersect from 'cesium/Core/Intersect'
    import Interval from 'cesium/Core/Interval'
    import isArray from 'cesium/Core/isArray'
    import JulianDate from 'cesium/Core/JulianDate'
    import LeapSecond from 'cesium/Core/LeapSecond'
    import MapProjection from 'cesium/Core/MapProjection'
    import Matrix3 from 'cesium/Core/Matrix3'
    import Matrix4 from 'cesium/Core/Matrix4'
    import Occluder from 'cesium/Core/Occluder'
    import OrientedBoundingBox from 'cesium/Core/OrientedBoundingBox'
    import Plane from 'cesium/Core/Plane'
    import Quaternion from 'cesium/Core/Quaternion'
    import Ray from 'cesium/Core/Ray'
    import Rectangle from 'cesium/Core/Rectangle'
    import ReferenceFrame from 'cesium/Core/ReferenceFrame'
    import requestAnimationFrame from 'cesium/Core/requestAnimationFrame'
    import ScreenSpaceEventHandler from 'cesium/Core/ScreenSpaceEventHandler'
    import ScreenSpaceEventType from 'cesium/Core/ScreenSpaceEventType'
    import Spherical from 'cesium/Core/Spherical'
    import TerrainData from 'cesium/Core/TerrainData'
    import TerrainMesh from 'cesium/Core/TerrainMesh'
    import TerrainProvider from 'cesium/Core/TerrainProvider'
    import TilingScheme from 'cesium/Core/TilingScheme'
    import TimeInterval from 'cesium/Core/TimeInterval'
    import TimeIntervalCollection from 'cesium/Core/TimeIntervalCollection'
    import TimeStandard from 'cesium/Core/TimeStandard'
    import Transforms from 'cesium/Core/Transforms'
    import WebMercatorProjection from 'cesium/Core/WebMercatorProjection'
    import WebMercatorTilingScheme from 'cesium/Core/WebMercatorTilingScheme'
    import BillboardGraphics from 'cesium/DataSources/BillboardGraphics'
    import BoxGraphics from 'cesium/DataSources/BoxGraphics'
    import CorridorGraphics from 'cesium/DataSources/CorridorGraphics'
    import CustomDataSource from 'cesium/DataSources/CustomDataSource'
    import CylinderGraphics from 'cesium/DataSources/CylinderGraphics'
    import CzmlDataSource from 'cesium/DataSources/CzmlDataSource'
    import DataSource from 'cesium/DataSources/DataSource'
    import DataSourceClock from 'cesium/DataSources/DataSourceClock'
    import DataSourceCollection from 'cesium/DataSources/DataSourceCollection'
    import DataSourceDisplay from 'cesium/DataSources/DataSourceDisplay'
    import EllipseGraphics from 'cesium/DataSources/EllipseGraphics'
    import EllipsoidGraphics from 'cesium/DataSources/EllipsoidGraphics'
    import Entity from 'cesium/DataSources/Entity'
    import EntityCollection from 'cesium/DataSources/EntityCollection'
    import EntityView from 'cesium/DataSources/EntityView'
    import LabelGraphics from 'cesium/DataSources/LabelGraphics'
    import MaterialProperty from 'cesium/DataSources/MaterialProperty'
    import ModelGraphics from 'cesium/DataSources/ModelGraphics'
    import PathGraphics from 'cesium/DataSources/PathGraphics'
    import PointGraphics from 'cesium/DataSources/PointGraphics'
    import PolygonGraphics from 'cesium/DataSources/PolygonGraphics'
    import PolylineGraphics from 'cesium/DataSources/PolylineGraphics'
    import PolylineVolumeGraphics from 'cesium/DataSources/PolylineVolumeGraphics'
    import PositionProperty from 'cesium/DataSources/PositionProperty'
    import Property from 'cesium/DataSources/Property'
    import RectangleGraphics from 'cesium/DataSources/RectangleGraphics'
    import SampledPositionProperty from 'cesium/DataSources/SampledPositionProperty'
    import TimeIntervalCollectionProperty from 'cesium/DataSources/TimeIntervalCollectionProperty'
    import VelocityOrientationProperty from 'cesium/DataSources/VelocityOrientationProperty'
    import WallGraphics from 'cesium/DataSources/WallGraphics'
    import Camera from 'cesium/Scene/Camera'
    import CameraEventType from 'cesium/Scene/CameraEventType'
    import CullingVolume from 'cesium/Scene/CullingVolume'
    import FrameRateMonitor from 'cesium/Scene/FrameRateMonitor'
    import Globe from 'cesium/Scene/Globe'
    import HeadingPitchRange from 'cesium/Scene/HeadingPitchRange'
    import ImageryLayer from 'cesium/Scene/ImageryLayer'
    import ImageryLayerCollection from 'cesium/Scene/ImageryLayerCollection'
    import ImageryLayerFeatureInfo from 'cesium/Scene/ImageryLayerFeatureInfo'
    import ImageryProvider from 'cesium/Scene/ImageryProvider'
    import Model from 'cesium/Scene/Model'
    import ModelAnimation from 'cesium/Scene/ModelAnimation'
    import ModelAnimationCollection from 'cesium/Scene/ModelAnimationCollection'
    import ModelAnimationLoop from 'cesium/Scene/ModelAnimationLoop'
    import ModelMaterial from 'cesium/Scene/ModelMaterial'
    import ModelMesh from 'cesium/Scene/ModelMesh'
    import ModelNode from 'cesium/Scene/ModelNode'
    import Moon from 'cesium/Scene/Moon'
    import PerspectiveFrustum from 'cesium/Scene/PerspectiveFrustum'
    import PrimitiveCollection from 'cesium/Scene/PrimitiveCollection'
    import Scene from 'cesium/Scene/Scene'
    import SceneMode from 'cesium/Scene/SceneMode'
    import ScreenSpaceCameraController from 'cesium/Scene/ScreenSpaceCameraController'
    import SkyAtmosphere from 'cesium/Scene/SkyAtmosphere'
    import SkyBox from 'cesium/Scene/SkyBox'
    import Sun from 'cesium/Scene/Sun'
    import TileDiscardPolicy from 'cesium/Scene/TileDiscardPolicy'
    import WebMapTileServiceImageryProvider from 'cesium/Scene/WebMapTileServiceImageryProvider'
    import ClockViewModel from 'cesium/Widgets/ClockViewModel'
    import Command from 'cesium/Widgets/Command'
    import ToggleButtonViewModel from 'cesium/Widgets/ToggleButtonViewModel'
    import Animation from 'cesium/Widgets/Animation/Animation'
    import AnimationViewModel from 'cesium/Widgets/Animation/AnimationViewModel'
    import BaseLayerPicker from 'cesium/Widgets/BaseLayerPicker/BaseLayerPicker'
    import BaseLayerPickerViewModel from 'cesium/Widgets/BaseLayerPicker/BaseLayerPickerViewModel'
    import ProviderViewModel from 'cesium/Widgets/BaseLayerPicker/ProviderViewModel'
    import CesiumWidget from 'cesium/Widgets/CesiumWidget/CesiumWidget'
    import FullscreenButton from 'cesium/Widgets/FullscreenButton/FullscreenButton'
    import FullscreenButtonViewModel from 'cesium/Widgets/FullscreenButton/FullscreenButtonViewModel'
    import Geocoder from 'cesium/Widgets/Geocoder/Geocoder'
    import GeocoderViewModel from 'cesium/Widgets/Geocoder/GeocoderViewModel'
    import HomeButton from 'cesium/Widgets/HomeButton/HomeButton'
    import HomeButtonViewModel from 'cesium/Widgets/HomeButton/HomeButtonViewModel'
    import InfoBox from 'cesium/Widgets/InfoBox/InfoBox'
    import InfoBoxViewModel from 'cesium/Widgets/InfoBox/InfoBoxViewModel'
    import NavigationHelpButton from 'cesium/Widgets/NavigationHelpButton/NavigationHelpButton'
    import NavigationHelpButtonViewModel from 'cesium/Widgets/NavigationHelpButton/NavigationHelpButtonViewModel'
    import SceneModePicker from 'cesium/Widgets/SceneModePicker/SceneModePicker'
    import SceneModePickerViewModel from 'cesium/Widgets/SceneModePicker/SceneModePickerViewModel'
    import SelectionIndicator from 'cesium/Widgets/SelectionIndicator/SelectionIndicator'
    import SelectionIndicatorViewModel from 'cesium/Widgets/SelectionIndicator/SelectionIndicatorViewModel'
    import Timeline from 'cesium/Widgets/Timeline/Timeline'
    import Viewer from 'cesium/Widgets/Viewer/Viewer'
    import viewerCesiumInspectorMixin from 'cesium/Widgets/Viewer/viewerCesiumInspectorMixin'
}
// declare module 'cesium' {
//     import * as Cesium from 'cesium/Cesium'
//     export = Cesium;
// }
declare module 'cesium' {
    //export * from 'cesium/Cesium';
    import * as MyCesium from 'cesium/Cesium';
	export default MyCesium;
}
declare var Cesium: any;