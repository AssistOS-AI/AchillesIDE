import {ClientService} from "./services/ClientService.js";
//import manifest from "./manifest.json"
class Manager {
    constructor() {
        this.appName = "AchillesIDE";
        this.services = new Map();
        this.services.set('ClientService', new ClientService());
    }
    async navigateInternal(pageName, url, objectData) {
        await assistOS.UI.changeToDynamicPage(pageName, `${assistOS.space.id}/${this.appName}/${url}`, objectData)
    }
}
export default new Manager();
