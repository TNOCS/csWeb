declare namespace Marvelous {
    export interface Model { }
    export function merge(arr1, arr2): number;
    export function model(marvelModel, name, widgetElement): void;
    export function loadModel(marvelModel): Marvelous.Model
    export function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY): Object;
    export function intersect(l1s, l1e, l2s, l2e): Object;
    export function boxPoint(w, h, b, e): number;
}
