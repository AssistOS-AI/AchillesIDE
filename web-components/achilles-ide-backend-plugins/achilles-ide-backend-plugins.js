const codeManager = assistOS.loadModule("codemanager");

export class AchillesIdeBackendPlugins {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[urlParts.length - 2];
        this.invalidate();
    }
    beforeRender(){
        this.plugins = codeManager.listBackendPluginsForApp(assistOS.space.id, this.appName);
    }
}