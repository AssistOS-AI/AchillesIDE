import {getTemplate} from "../../utils/code-templates-utils.js";
import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const BLANK = "blank-comp";
export class AchillesIdeComponentEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[3];
        this.componentOldName = urlParts[5];
        this.isNewComponent = !this.componentOldName; // Track if this is a new component
        this.invalidate();
    }
    async beforeRender() {
        this.existingComponents = await codeManager.listComponentsForApp(assistOS.space.id, this.appName);
        let component = {};
        if(this.componentOldName){
            component = await codeManager.getComponent(assistOS.space.id, this.appName, this.componentOldName);
        }
        this.componentOldName = this.componentOldName || BLANK;
        this.state = {
            componentName: this.componentOldName,
            activeTab: "html",
            html: component.html || getTemplate("html", BLANK),
            css: component.css || getTemplate("css", BLANK),
            js: component.js || getTemplate("js", BLANK),
        };
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
        <div class="name-edit-container">
            <input class="title-input" type="text" value="${this.state.componentName}"/>
            <span class="error-message" style="display: none;">Invalid web component name (must contain hyphen, lowercase, no spaces)</span>
        </div>`;
        const input = this.element.querySelector('.title-input');
        input?.focus();
        input?.addEventListener('input', this.validateComponentName.bind(this));
        input?.addEventListener('keydown', this.saveName.bind(this));
        input?.addEventListener('blur', this.saveName.bind(this));
    }

    validateComponentName(event) {
        const input = event.target;
        const errorMessage = this.element.querySelector('.error-message');
        const newName = input.value;
        
        // Check if name is valid web component format
        const isValidFormat = this.isValidWebComponentName(newName);
        
        // Check if name already exists (but allow keeping the current name)
        const nameExists = this.existingComponents.includes(newName) && newName !== this.componentOldName;
        
        if (!isValidFormat) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Invalid web component name (must contain hyphen, lowercase, no spaces)';
            errorMessage.style.display = 'block';
        } else if (nameExists) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Component name already exists';
            errorMessage.style.display = 'block';
        } else {
            input.classList.remove('invalid');
            errorMessage.style.display = 'none';
        }
    }

    isValidWebComponentName(name) {
        // Custom element names must:
        // - Contain a hyphen
        // - Start with a lowercase letter
        // - Only contain lowercase letters, numbers, hyphens
        // - Not be a reserved name
        const reservedNames = ['annotation-xml', 'color-profile', 'font-face', 'font-face-src', 
                              'font-face-uri', 'font-face-format', 'font-face-name', 'missing-glyph'];
        
        if (!name || reservedNames.includes(name)) return false;
        
        const validPattern = /^[a-z]([a-z0-9-])*(-[a-z0-9]+)+$/;
        return validPattern.test(name);
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            const newName = event.target.value;
            
            // Check if name is valid format
            const isValidFormat = this.isValidWebComponentName(newName);
            // Check if name already exists (but allow keeping the current name)
            const nameExists = this.existingComponents.includes(newName) && newName !== this.componentOldName;
            
            // Only save if the name is valid and doesn't exist
            if (!isValidFormat || nameExists) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return;
                }
                // On blur, revert to original name if invalid or exists
                if (event.type === 'blur') {
                    event.target.value = this.state.componentName;
                    this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.componentName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
                }
                return;
            }
            
            // Update child achilles-ide-code-edit components with new file name
            const codeEditElements = this.element.querySelectorAll('achilles-ide-code-edit');
            codeEditElements.forEach(element => {
                element.webSkelPresenter.saveName(event);
            });
            this.state.componentName = newName;
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
        let renamed;
        // Only set renamed if this is an existing component being renamed
        // Don't set it for new components - they don't exist yet to be renamed
        if(!this.isNewComponent && this.componentOldName !== this.state.componentName){
            renamed = this.state.componentName;
        }
        await codeManager.saveComponent(assistOS.space.id, this.appName, this.componentOldName, htmlContent, cssContent, jsContent, renamed);
        await assistOS.showToast("Component saved!", "success");
        this.isNewComponent = false;
    }

    async navigateBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`)
    }
    
}
