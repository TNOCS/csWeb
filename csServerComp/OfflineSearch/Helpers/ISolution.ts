import IProjectLocation = require('./IProjectLocation');
interface ISolution {
    title: string;
    projects: IProjectLocation[];
}
export = ISolution;
