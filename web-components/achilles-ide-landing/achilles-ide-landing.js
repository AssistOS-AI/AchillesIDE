import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");
const webAssistantModule = assistOS.loadModule("webassistant");
export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        let apps = await codeManager.getApps(assistOS.space.id);
        this.appsList = "";
        for(let appName of apps){
            this.appsList += `<div class="app-item" data-local-action="openAppEditor ${appName}">${appName}</div>`;
        }
    }

    async afterRender() {
    }
    getChatId(appName, pageName){
        return  appName + `_${pageName}` + "_Chat";
    }
    async newApplication() {
        let webAssistant = await webAssistantModule.getWebAssistant(assistOS.space.id);
        const appName = this.element.querySelector("#applicationName").value;
        if (!appName) {
            assistOS.showToast("App name is required", "error", 3000);
            return
        }
        this.appName = appName;
        await codeManager.createApp(assistOS.space.id, appName);
        assistOS.showToast("App created!", "success");
        this.appPages = [
            {component: "achilles-ide-component-edit", scriptName:"WebSkelVibe"},
            {component: "achilles-ide-persisto", scriptName:"PersistoVibe"},
            {component: "achilles-ide-backend-plugin-edit", scriptName:"BackendPluginVibe"},
            {component: "achilles-ide-document-plugin-edit", scriptName: "DocumentPluginVibe"}
        ];
        for(let appPage of this.appPages){
            let chatId = this.getChatId(appName, appPage.component);
            await chatModule.createChat(assistOS.space.id, assistOS.user.email, chatId, appPage.scriptName, ["User", webAssistant.agentName]);
            appPage.chatId = chatId;
        }
        await this.openAppEditor(null, appName);
    }
    async openAppEditor(target, appName){
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(appName)}`);
    }
}
