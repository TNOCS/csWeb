// Type definitions for L.Control.Sidebar.js 0.6.4
// Project: https://github.com/Turbo87/leaflet-sidebar/
// Definitions by: Erik Vullings <https://github.com/erikvullings>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Added to the leaflet.d.ts file
//declare module L {
//    export class control {
//        static sidebar(elementId: string, options?: SidebarOptions): L.Control;  // For the sidebar
//    }
//}

declare module L {
    export interface SidebarOptions {
        position   : string; // Allowable values: right, left
        closeButton: boolean;
        autoPan    : boolean;
    }

    export interface SidebarControl extends L.Control {
        toggle()   : void;
        show()     : void;
        hide()     : void;
        isVisible(): boolean;
    }
}