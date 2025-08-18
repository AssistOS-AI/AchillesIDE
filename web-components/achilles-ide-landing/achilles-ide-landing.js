import manager from "../../manager.js"

export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.contexts = [
            {contextData: {fileName: "CodeEdit", fileType: "js", singleFile: true}},
            {contextData: {fileName: "WebSkel Component", singleFile: false}},
            {contextData: {fileName: "Chat Widgets Creator", fileType: "js", singleFile: true}},
            {contextData: {fileName: "Persisto", fileType: "js", singleFile: true}},
            {contextData: {fileName: "Backend Plugins", fileType: "js", singleFile: true}},
            {contextData: {fileName: "Client Services", fileType: "js", singleFile: true}},
            {contextData: {fileName: "Document Plugins", fileType: "js", singleFile: true}}
        ];
        this.invalidate();
    }

    async beforeRender() {
        this.contextList = "";
        for (const context of this.contexts) {
            this.contextList += `<div class="context-item" data-context="${encodeURIComponent(JSON.stringify(context.contextData))}" data-local-action="openEditor">${context.contextData.fileName}</div>`;
        }
    }


    async afterRender() {

    }

    async openEditor(target) {
        const context = JSON.parse(decodeURIComponent(target.getAttribute("data-context")));
        if (context.fileName !== "WebSkel Component") {
            await manager.navigateInternal("achilles-ide-code-edit", "achilles-ide-code-edit", {context: target.getAttribute("data-context")});
        } else {
            await manager.navigateInternal("achilles-ide-component-edit", "achilles-ide-component-edit", {context: target.getAttribute("data-context")});

        }
    }
}
  
