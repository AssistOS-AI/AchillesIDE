const codeManager = assistOS.loadModule("codemanager");

export class ChatScriptsPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.chatScripts = await codeManager.listChatScripts(assistOS.space.id);
        this.scriptRows = this.chatScripts.map(script => `
            <tr>
                <td class="main-cell">
                    <span style="font-weight: 500;">${script.scriptName}</span>
                </td>
                <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${script.appName}
                </td>
                <td class="actions-button">
                    <img class="pointer" src="./wallet/assets/icons/edit-document.svg" data-local-action="editChatScript ${script.appName} ${script.scriptName}" alt="edit">
                    <img class="pointer" src="./wallet/assets/icons/trash-can.svg" data-local-action="deleteChatScript ${script.appName} ${script.scriptName}" alt="delete">
                </td>
            </tr>
        `).join('');
    }

    async afterRender() {

    }

    async openAddChatScriptsModal() {
        const refreshComponent = await assistOS.UI.showModal("add-edit-chat-script", true);
        if (refreshComponent) {
            this.invalidate();
        }
    }

    async editChatScript(event, appName, scriptName) {
        const refreshComponent = await assistOS.UI.showModal("add-edit-chat-script", {
            "app-name": encodeURIComponent(appName),
            "script-name": encodeURIComponent(scriptName)
        }, true);
        if (refreshComponent) {
            this.invalidate();
        }
    }

    async deleteChatScript(event, appName, scriptName) {
        let message = `Are you sure you want to delete the chat script ${scriptName}? This action cannot be undone.`;

       let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
       if(confirmation){
            try {
                await codeManager.deleteChatScript(assistOS.space.id, appName, scriptName);
                assistOS.showToast("Script deleted successfully!", "success");
                this.invalidate();
            } catch (error) {
                console.error("Error deleting chat script:", error);
                assistOS.showToast("Error deleting chat script:", "error");
            }
       }
    }
}