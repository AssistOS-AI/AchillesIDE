import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const BLANK = "blank-document-plugin";

export class AchillesIdeDocumentPluginEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[3];
        this.documentPluginOldName = urlParts[5];
        this.isNewDocumentPlugin = !this.documentPluginOldName;
        this.invalidate();
    }

    async beforeRender() {
        this.existingDocumentPlugins = await codeManager.listDocumentPluginsForApp(assistOS.space.id, this.appName);
        let documentPlugin = {};
        if(this.documentPluginOldName){
            documentPlugin = await codeManager.getDocumentPlugin(assistOS.space.id, this.appName, this.documentPluginOldName);
        }
        this.documentPluginOldName = this.documentPluginOldName || BLANK;
        this.state = {
            documentPluginName: this.documentPluginOldName,
            content: documentPlugin.content || ""
        };
    }

    async afterRender() {
        let context = JSON.parse(JSON.stringify(this.context));
        context.fileType = "markdown"; // Documents are typically markdown
        context = encodeURIComponent(JSON.stringify(context));
        
        await assistOS.UI.createElement("achilles-ide-code-edit", ".editor-content", {
            context: context,
            content: this.state.content,
            type: "markdown"
        });
    }

    editName() {
        this.element.querySelector('.page-header .left-header').innerHTML = `
        <button class="back-button" data-local-action="navigateBack">← Back</button>
        <div class="name-edit-container">
            <input class="title-input" type="text" value="${this.state.documentPluginName}"/>
            <span class="error-message" style="display: none;">Invalid document plugin name</span>
        </div>`;
        const input = this.element.querySelector('.title-input');
        input?.focus();
        input?.addEventListener('input', this.validateDocumentPluginName.bind(this));
        input?.addEventListener('keydown', this.saveName.bind(this));
        input?.addEventListener('blur', this.saveName.bind(this));
    }

    validateDocumentPluginName(event) {
        const input = event.target;
        const errorMessage = this.element.querySelector('.error-message');
        const newName = input.value;
        
        // Check if name is valid (not empty, no special characters)
        const isValidFormat = this.isValidDocumentPluginName(newName);
        
        // Check if name already exists (but allow keeping the current name)
        const nameExists = this.existingDocumentPlugins?.includes(newName) && newName !== this.documentPluginOldName;
        
        if (!isValidFormat) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Invalid document plugin name (no special characters allowed)';
            errorMessage.style.display = 'block';
        } else if (nameExists) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Document plugin name already exists';
            errorMessage.style.display = 'block';
        } else {
            input.classList.remove('invalid');
            errorMessage.style.display = 'none';
        }
    }

    isValidDocumentPluginName(name) {
        // Document names should be alphanumeric with hyphens, underscores, and dots
        if (!name || name.trim() === '') return false;
        const validPattern = /^[a-zA-Z0-9._-]+$/;
        return validPattern.test(name);
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            const newName = event.target.value;
            
            // Check if name is valid format
            const isValidFormat = this.isValidDocumentPluginName(newName);
            // Check if name already exists (but allow keeping the current name)
            const nameExists = this.existingDocumentPlugins?.includes(newName) && newName !== this.documentPluginOldName;
            
            // Only save if the name is valid and doesn't exist
            if (!isValidFormat || nameExists) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return;
                }
                // On blur, revert to original name if invalid or exists
                if (event.type === 'blur') {
                    event.target.value = this.state.documentPluginName;
                    this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.documentPluginName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
                }
                return;
            }
            
            this.state.documentPluginName = newName;
            this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.documentPluginName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
        }
    }

    async saveDocumentPlugin() {
        const codeEditor = this.element.querySelector('achilles-ide-code-edit');
        const content = codeEditor.webSkelPresenter.getCode();
        
        let renamed;
        // Only set renamed if this is an existing document plugin being renamed
        if(!this.isNewDocumentPlugin && this.documentPluginOldName !== this.state.documentPluginName){
            renamed = this.state.documentPluginName;
        }
        
        await codeManager.saveDocumentPlugin(assistOS.space.id, this.appName, this.documentPluginOldName, content, renamed);
        await assistOS.showToast("Document Plugin saved!", "success");
        this.isNewDocumentPlugin = false;
    }

    async navigateBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`)
    }
}