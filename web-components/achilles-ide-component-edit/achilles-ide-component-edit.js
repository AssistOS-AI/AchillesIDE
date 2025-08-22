import {getTemplate} from "../../utils/code-templates-utils.js";
import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
export class AchillesIdeComponentEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[3];
        this.componentName = urlParts[5];
        this.invalidate();
    }
    async beforeRender() {
        let component = {};
        if(this.componentName){
            component = await codeManager.getComponent(assistOS.space.id, this.appName, this.componentName);
        }
        this.state = {
            componentName: this.componentName || "blank_",
            activeTab: "html",
            html: component.html || getTemplate("html", this.state.componentName),
            css: component.css || getTemplate("css", this.state.componentName),
            js: component.js || getTemplate("js", this.state.componentName),
        };
        this.componentName = this.state.componentName;
    }

    async afterRender() {
        let htmlContext = JSON.parse(JSON.stringify(this.context));
        let cssContext = JSON.parse(JSON.stringify(this.context));
        let jsContext = JSON.parse(JSON.stringify(this.context));
        htmlContext.fileType = "html";
        cssContext.fileType = "css";
        jsContext.fileType = "js";
        htmlContext = encodeURIComponent(JSON.stringify(htmlContext));
        cssContext = encodeURIComponent(JSON.stringify(cssContext));
        jsContext = encodeURIComponent(JSON.stringify(jsContext));
        await assistOS.UI.createElement("achilles-ide-code-edit", ".tab-content", {
            context: htmlContext,
            content: this.state.html,
            type: "html"
        });
        let htmlEditor = this.element.querySelector("achilles-ide-code-edit");
        htmlEditor.classList.add("active");
        await assistOS.UI.createElement("achilles-ide-code-edit", ".tab-content", {
            context: cssContext,
            content: this.state.css,
            type: "css"
        });

        await assistOS.UI.createElement("achilles-ide-code-edit", ".tab-content", {
            context: jsContext,
            content: this.state.js,
            type: "js"
        });
    }

    changeTab(event, tabName) {
        if (this.state.activeTab === tabName) return;
        this.state.activeTab = tabName;
        this.element.querySelector(`.tab.active`).classList.remove('active');
        this.element.querySelector(`.tabs-list .${tabName}`).classList.add('active');
        this.element.querySelector(`achilles-ide-code-edit.active`).classList.remove('active');
        this.element.querySelector(`.tab-content achilles-ide-code-edit.${tabName}`).classList.add('active');
    }

    editName() {
        this.element.querySelector('.page-header .left-header').innerHTML = `
        <button class="back-button" data-local-action="navigateBack">← Back</button>
        <input class="title-input" type="text" value="${this.state.componentName}"/>`;
        this.element.querySelector('.title-input')?.focus();
        this.element.querySelector('.title-input')?.addEventListener('keydown', this.saveName.bind(this));
        this.element.querySelector('.title-input')?.addEventListener('blur', this.saveName.bind(this));
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            // Update child achilles-ide-code-edit components with new file name
            const codeEditElements = this.element.querySelectorAll('achilles-ide-code-edit');
            codeEditElements.forEach(element => {
                element.webSkelPresenter.saveName(event);
            });
            this.state.componentName = event.target.value;
            this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.componentName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
        }

    }

    async saveComponent() {
        const html = this.element.querySelector('achilles-ide-code-edit.html-editor');
        const css = this.element.querySelector('achilles-ide-code-edit.css-editor');
        const js = this.element.querySelector('achilles-ide-code-edit.js-editor');
        const htmlContent = html.webSkelPresenter.getCode();
        const cssContent = css.webSkelPresenter.getCode();
        const jsContent = js.webSkelPresenter.getCode();
        await codeManager.saveComponent(assistOS.space.id, this.appName, this.state.componentName, htmlContent, cssContent, jsContent);
        await assistOS.showToast("Component saved!", "success");
    }

    async navigateBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`)
    }
    
}
