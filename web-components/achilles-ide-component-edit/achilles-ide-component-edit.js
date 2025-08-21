import {getTemplate} from "../../utils/code-templates-utils.js";

export class AchillesIdeComponentEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        this.state = {
            editorContent: "",
            loading: true,
            fileName: "blank_",
            activeTab: "html",
            html: "",
            css: "",
            js: "",
            isEditingName: false
        };
        this.invalidate();
    }

    renderWebSkelEditor() {
        this.itemList = ""; // No sidebar
        this.pageTitle = `<span>${this.state.fileName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" data-local-action="editName">`;
        this.state.html = getTemplate("html", this.state.fileName);
        this.state.css = getTemplate("css", this.state.fileName);
        this.state.js = getTemplate("js", this.state.fileName);
        this.state.editorContent = this.state.html;
        let htmlContext = JSON.parse(JSON.stringify(this.context));
        let cssContext = JSON.parse(JSON.stringify(this.context));
        let jsContext = JSON.parse(JSON.stringify(this.context));
        htmlContext.fileType = "html";
        cssContext.fileType = "css";
        jsContext.fileType = "js";
        htmlContext = encodeURIComponent(JSON.stringify(htmlContext));
        cssContext = encodeURIComponent(JSON.stringify(cssContext));
        jsContext = encodeURIComponent(JSON.stringify(jsContext));
        this.editor = `
            <div class="tabs-header">
                <div class="tabs-list">
                    <div class="tab tab-html active" data-local-action="changeTab html">HTML</div>
                    <div class="tab tab-css" data-local-action="changeTab css">CSS</div>
                    <div class="tab tab-js" data-local-action="changeTab js">JS</div>
                </div>
            </div>
            <div class="tab-content">
            <achilles-ide-code-edit class="editor-content tab-html active" data-presenter="achilles-ide-code-edit" data-context="${htmlContext}" data-editor-content="${encodeURIComponent(this.state.html)}"></achilles-ide-code-edit>
            <achilles-ide-code-edit class="editor-content tab-css" data-presenter="achilles-ide-code-edit" data-context="${cssContext}" data-editor-content="${encodeURIComponent(this.state.css)}"></achilles-ide-code-edit>
            <achilles-ide-code-edit class="editor-content tab-js" data-presenter="achilles-ide-code-edit" data-context="${jsContext}" data-editor-content="${encodeURIComponent(this.state.js)}"></achilles-ide-code-edit>
            </div>
            <div class="component-editor-footer">
                <button class="general-button" data-local-action="saveComponent">Save Component</button>
            </div>
        `;
    }

    changeTab(event, tabName) {
        if (this.state.activeTab === tabName) return;
        this.state.activeTab = tabName;
        this.element.querySelector(`.tab.active`).classList.remove('active');
        this.element.querySelector(`.tabs-list .tab-${tabName}`).classList.add('active');
        this.element.querySelector(`.editor-content.active`).classList.remove('active');
        this.element.querySelector(`.tab-content .tab-${tabName}`).classList.add('active');
    }

    editName() {
        this.element.querySelector('.page-header .left-header').innerHTML = `<input class="title-input" type="text" value="${this.state.fileName}"/>`;

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
            this.state.fileName = event.target.value;
            this.element.querySelector('.page-header .left-header').innerHTML = `<span>${this.state.fileName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" data-local-action="editName">`;

        }

    }

    async saveComponent() {
        const codeEditElements = this.element.querySelectorAll('achilles-ide-code-edit');
        for (let i = 0; i < codeEditElements.length; i++) {
            await codeEditElements[i].webSkelPresenter.saveCode();
        }
    }

    async beforeRender() {
        this.renderWebSkelEditor();
        this.state.editorContent = this.state.html;
        this.state.loading = false;
    }

    async afterRender() {
    }
}
