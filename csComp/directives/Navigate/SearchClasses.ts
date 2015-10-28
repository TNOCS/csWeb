module Search {

    export class NavigateSteps{

    }

    export class NavigateState{
        state : any;
    }

    export interface INavigateProvider {
      title: string;
      url:   string;
    }
}
