import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const BLANK = "ChatScript";

export class AchillesIdeChatScriptEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = {};
        let urlParts = window.location.hash.split("/");
        this.appName = urlParts[3];
        this.chatScriptOldName = urlParts[5];
        this.isNewChatScript = !this.chatScriptOldName;
        this.invalidate();
    }

    async beforeRender() {
        this.existingChatScripts = await codeManager.listChatScriptsForApp(assistOS.space.id, this.appName);
        let chatScript;
        if(this.chatScriptOldName){
            chatScript = await codeManager.getChatScript(assistOS.space.id, this.appName, this.chatScriptOldName);
        }
        this.chatScriptOldName = this.chatScriptOldName || BLANK;
        this.state = {
            chatScriptName: this.chatScriptOldName,
            content: chatScript || this.getDefaultChatScriptTemplate()
        };
    }

    getDefaultChatScriptTemplate() {
        return `@name :="DefaultScript"
@description := "DefaultScript"
@role := "guest"

@history new Table from message timestamp role
@context new Table from message timestamp role
@currentUser := $arg1
@agentName := $arg2
@assistant new ChatAIAgent $agentName
@user new ChatUserAgent $currentUser
@chat new Chat $history $context $user $assistant
@UIContext := ""

context.upsert system [ assistant.getSystemPrompt ] "" system
@newReply macro reply ~history ~context ~chat ~assistant
    @res history.upsert $reply
    context.upsert $res
    chat.notify $res
    return $res
end`;
    }

    async afterRender() {
        let context = JSON.parse(JSON.stringify(this.context));
        context.fileType = "js"; // Chat scripts are JavaScript
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
            <input class="title-input" type="text" value="${this.state.chatScriptName}"/>
            <span class="error-message" style="display: none;">Invalid chat script name</span>
        </div>`;
        const input = this.element.querySelector('.title-input');
        input?.focus();
        input?.addEventListener('input', this.validateChatScriptName.bind(this));
        input?.addEventListener('keydown', this.saveName.bind(this));
        input?.addEventListener('blur', this.saveName.bind(this));
    }

    validateChatScriptName(event) {
        const input = event.target;
        const errorMessage = this.element.querySelector('.error-message');
        const newName = input.value;
        
        // Check if name is valid (follows JavaScript naming conventions)
        const isValidFormat = this.isValidChatScriptName(newName);
        
        // Check if name already exists (but allow keeping the current name)
        const nameExists = this.existingChatScripts?.includes(newName) && newName !== this.chatScriptOldName;
        
        if (!isValidFormat) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Invalid chat script name (must be PascalCase)';
            errorMessage.style.display = 'block';
        } else if (nameExists) {
            input.classList.add('invalid');
            errorMessage.textContent = 'Chat script name already exists';
            errorMessage.style.display = 'block';
        } else {
            input.classList.remove('invalid');
            errorMessage.style.display = 'none';
        }
    }

    isValidChatScriptName(name) {
        // Script names should follow PascalCase naming convention
        if (!name || name.trim() === '') return false;
        // Allow PascalCase
        const validPattern = /^[A-Z][a-zA-Z0-9]*$/;
        return validPattern.test(name);
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            const newName = event.target.value;
            
            // Check if name is valid format
            const isValidFormat = this.isValidChatScriptName(newName);
            // Check if name already exists (but allow keeping the current name)
            const nameExists = this.existingChatScripts?.includes(newName) && newName !== this.chatScriptOldName;
            
            // Only save if the name is valid and doesn't exist
            if (!isValidFormat || nameExists) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return;
                }
                // On blur, revert to original name if invalid or exists
                if (event.type === 'blur') {
                    event.target.value = this.state.chatScriptName;
                    this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.chatScriptName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
                }
                return;
            }
            
            this.state.chatScriptName = newName;
            this.element.querySelector('.page-header .left-header').innerHTML = `<button class="back-button" data-local-action="navigateBack">← Back</button><span>${this.state.chatScriptName}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" alt="Edit" data-local-action="editName">`;
        }
    }

    async saveChatScript() {
        const codeEditor = this.element.querySelector('achilles-ide-code-edit');
        const content = codeEditor.webSkelPresenter.getCode();
        
        let renamed;
        // Only set renamed if this is an existing chat script being renamed
        if(!this.isNewChatScript && this.chatScriptOldName !== this.state.chatScriptName){
            renamed = this.state.chatScriptName;
        }
        
        await codeManager.saveChatScript(assistOS.space.id, this.appName, this.chatScriptOldName, content, renamed);
        await assistOS.showToast("Chat Script saved!", "success");
        this.isNewChatScript = false;
    }

    async navigateBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`)
    }
}