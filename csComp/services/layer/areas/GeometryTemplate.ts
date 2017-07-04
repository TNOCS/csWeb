module csComp.Services {

    export interface IGeometryTemplate {
        /* name of the template (e.g. buurten_2016) */
        name: string;
        /* key of the identifying feature property (e.g. BU_CODE) */
        key: string;
    }


    export class GeometryTemplateStore {

        readonly TEMPLATE_URL = 'api/layers';
        private templateList: _.Dictionary < ProjectLayer > = {};

        constructor(public $http: ng.IHttpService) {

        }

        /* Make sure the geometry is loaded. Calls back true if ok, false if the geometry could not be loaded */
        public loadGeometry(name: string, cb: Function): void {
            if (!name) {
                cb(null);
                return;
            }
            if (this.templateList.hasOwnProperty(name)) {
                cb(true);
                return;
            }
            let template = this.getTemplateFromServer(name, (data) => {
                if (!data) {
                    cb(null);
                    return;
                }
                this.templateList[name] = data;
                cb(true);
            });
        }

        public getTemplate(name: string): ProjectLayer {
            return this.templateList[name];
        }

        private getTemplateFromServer(name: string, cb: Function) {
            this.$http.get(`${this.TEMPLATE_URL}/${name}`.toLowerCase())
                .then((res: {
                    data: ProjectLayer
                }) => {
                    cb(res.data);
                })
                .catch((msg) => {
                    console.warn(`Could not load ${name} from server`);
                });
        }
    }
}
