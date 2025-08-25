import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const BLANK = "BackendPlugin";

export class AchillesIdeBackendPluginEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[3];
        this.backendPluginOldName = urlParts[5];
        this.isNewBackendPlugin = !this.backendPluginOldName;
        this.invalidate();
    }

    async beforeRender() {
        this.existingBackendPlugins = await codeManager.listBackendPluginsForApp(assistOS.space.id, this.appName);
        let backendPlugin;
        if(this.backendPluginOldName){
            backendPlugin = await codeManager.getBackendPlugin(assistOS.space.id, this.appName, this.backendPluginOldName);
        }
        this.backendPluginOldName = this.backendPluginOldName || BLANK;
        this.state = {
            backendPluginName: this.backendPluginOldName,
            content: backendPlugin || this.getDefaultBackendPluginTemplate()
        };
    }

    getDefaultBackendPluginTemplate() {
        return `// Backend Plugin: ${this.state?.backendPluginName || 'new-backend-plugin'}
async function NewPlugin() {
    let self = {};
    self.newFunction = async function(){
        //your code here
    }
    return self;
}
let singletonInstance;
module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await NewPlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return [];
    }
};`;
    }

    async afterRender() {
        let context = JSON.parse(JSON.stringify(this.context));
        context.fileType = "js"; // Backend plugins are JavaScript
        context = encodeURIComponent(JSON.stringify(context));
        
        await assistOS.UI.createElement("achilles-ide-code-edit", ".editor-content", {
            context: context,
            content: this.state.content,
            type: "js"
        });
    }

    editName() {
        this.element.querySelector('.page-header .left-header').innerHTML = `
        <button class="back-button" data-local-action="navigateBack">← Back</button>
        <div class="name-edit-container">
            <input class="title-input" type="text" value="${this.state.backendPluginName}"/>
            <span class="error-message" style="display: none;">Invalid backend plugin name</span>
        </div>`;
        const input = this.element.querySelector('.title-input');
        input?.focus();
        input?.addEventListener('input', this.validateBackendPluginName.bind(this));
        input?.addEventListener('keydown', this.saveName.bind(this));
        input?.addEventListener('blur', this.saveName.bind(this));
    }

    validateBackendPluginName(event) {
        const input = event.target;
        const errorMessage = this.element.querySelector('.error-message');
        const newName = input.value;
        
        // Check if name is valid (follows JavaScript naming conventions)
        const isValidFormat = this.isValidBackendPluginName(newName);
        
        // Check if name already exists (but allow keeping the current name)
        const nameExists = this.existingBackendPlugins?.includes(newName) && newName !== this.backendPluginOldName;
        
        if (!isValidFormat) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Invalid backend plugin name (must be PascalCase)';
            errorMessage.style.display = 'block';
        } else if (nameExists) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Backend plugin name already exists';
            errorMessage.style.display = 'block';
        } else {
            input.classList.remove('invalid');
            errorMessage.style.display = 'none';
        }
    }

    isValidBackendPluginName(name) {
        // Plugin names should follow PascalCase naming convention
        if (!name || name.trim() === '') return false;
        // Allow PascalCase
        const validPattern = /^[A-Z][a-zA-Z0-9]*$/;
        return validPattern.test(name);
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            const newName = event.target.value;
            
            // Check if name is valid format
            const isValidFormat = this.isValidBackendPluginName(newName);
            // Check if name already exists (but allow keeping the current name)
            const nameExists = this.existingBackendPlugins?.includes(newName) && newName !== this.backendPluginOldName;
            
            // Only save if the name is valid and doesn't exist
            if (!isValidFormat || nameExists) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return;
                }
                // On blur, revert to original name if invalid or exists
                if (event.type === 'blur') {
                    event.target.value = this.state.backendPluginName;
                    this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.backendPluginName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
                }
                return;
            }
            
            this.state.backendPluginName = newName;
            this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.backendPluginName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
        }
    }

    async saveBackendPlugin() {
        const codeEditor = this.element.querySelector('achilles-ide-code-edit');
        const content = codeEditor.webSkelPresenter.getCode();
        
        let renamed;
        // Only set renamed if this is an existing backend plugin being renamed
        if(!this.isNewBackendPlugin && this.backendPluginOldName !== this.state.backendPluginName){
            renamed = this.state.backendPluginName;
        }
        
        await codeManager.saveBackendPlugin(assistOS.space.id, this.appName, this.backendPluginOldName, content, renamed);
        await assistOS.showToast("Backend Plugin saved!", "success");
        this.isNewBackendPlugin = false;
    }

    async navigateBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`)
    }
}