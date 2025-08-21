import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");
const webAssistantModule = assistOS.loadModule("webassistant");
export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.appPages = [
            {name: "WebSkel Components", component: "achilles-ide-component-edit", scriptName:"WebSkelVibe"},
            {name: "Persisto", component: "achilles-ide-persisto", scriptName:"PersistoVibe"},
            {name: "Backend Plugins", component: "achilles-ide-backend-plugins", scriptName:"BackendPluginVibe"},
            {name: "Document Plugins", component: "achilles-ide-doc-plugins", scriptName: "DocumentPluginVibe"}
        ];
        this.invalidate();
    }

    async beforeRender() {
        let apps = await codeManager.getApps(assistOS.space.id);
        this.appsList = "";
        for(let appName of apps){
            this.appsList += `<div class="app-item" data-local-action="openAppEditor ${appName}">${appName}</div>`;
        }
        this.pagesList = "";
        for (const page of this.appPages) {
            this.pagesList += `<div class="context-item" data-local-action="openEditPage ${page.component}">${page.name}</div>`;
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
        this.element.querySelector(".new-application-section").style.display = "none";
        this.element.querySelector(".context-section").style.display = "block";
        for(let appPage of this.appPages){
            let chatId = this.getChatId(appName, appPage.component);
            await chatModule.createChat(assistOS.space.id, assistOS.user.email, chatId, appPage.scriptName, ["User", webAssistant.agentName]);
            appPage.chatId = chatId;
        }
    }
    openAppEditor(target, appName){
        this.appName = appName;
        let sectionHeader = this.element.querySelector(".app-name");
        sectionHeader.innerHTML = appName;
        this.element.querySelector(".new-application-section").style.display = "none";
        this.element.querySelector(".context-section").style.display = "block";
    }
    async openEditPage(target, pageName){
        await manager.navigateInternal("achilles-ide-chat-page", `achilles-ide-chat-page/${encodeURIComponent(this.appName)}/${pageName}`);
    }
}
  
