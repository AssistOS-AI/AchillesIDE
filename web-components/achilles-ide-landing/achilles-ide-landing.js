import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager", {});

export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.appPages = [
            {name: "WebSkel Components", component: "achilles-ide-web-components"},
            {name: "Persisto", component: "achilles-ide-persisto"},
            {name: "Backend Plugins", component: "achilles-ide-backend-plugins"},
            {name: "Document Plugins", component: "achilles-ide-doc-plugins"}
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
            this.pagesList += `<div class="context-item" data-local-action="openComponentPage ${page.component}">${page.name}</div>`;
        }
    }

    async afterRender() {

    }

    async newApplication() {
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

    }
    openAppEditor(target, appName){
        this.appName = appName;
        let sectionHeader = this.element.querySelector(".app-name");
        sectionHeader.innerHTML = appName;
        this.element.querySelector(".new-application-section").style.display = "none";
        this.element.querySelector(".context-section").style.display = "block";
    }
    async openComponentPage(target, pageName){
        await manager.navigateInternal(pageName, `${pageName}/${encodeURIComponent(this.appName)}`);
    }
    async openEditor(target) {
        let context = JSON.parse(decodeURIComponent(target.getAttribute("data-context")));
        context.appName = this.appName;
        context = encodeURIComponent(JSON.stringify(context))
        const editorType = target.getAttribute("data-editor-type");
        if (editorType !== "WebSkel Component") {
            await manager.navigateInternal("achilles-ide-code-edit", "achilles-ide-code-edit", {context});
        } else {
            await manager.navigateInternal("achilles-ide-component-edit", "achilles-ide-component-edit", {context});
        }
    }
}
  
