import manager from "../../manager.js"

const CodeManager = assistOS.loadModule("codemanager", {});

export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.contexts = [
            {contextData: {folder: "Code Edit", fileName: "CodeEdit", fileType: "js", singleFile: true}},
            {contextData: {folder: "WebSkel Components", fileName: "WebSkel Component", singleFile: false}},
            {contextData: {folder: "Chat Widgets", fileName: "Chat Widgets Creator", fileType: "js", singleFile: true}},
            {contextData: {folder: "Persisto", fileName: "Persisto", fileType: "js", singleFile: true}},
            {contextData: {folder: "Backend Plugins", fileName: "Backend Plugins", fileType: "js", singleFile: true}},
            {contextData: {folder: "Document Plugins", fileName: "Document Plugins", fileType: "js", singleFile: true}}
        ];
        this.invalidate();
    }

    async beforeRender() {
        this.contextList = "";
        for (const context of this.contexts) {
            this.contextList += `<div class="context-item" data-context="${encodeURIComponent(JSON.stringify(context.contextData))}" data-local-action="openEditor" data-editor-type="${context.contextData.fileName}">${context.contextData.fileName}</div>`;
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
        await CodeManager.newApp(assistOS.space.id, appName);
        assistOS.showToast("App created!", "success");
        this.element.querySelector(".new-application-section").style.display = "none";
        this.element.querySelector(".context-section").style.display = "block";

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
  
