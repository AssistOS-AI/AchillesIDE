import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");
const webAssistantModule = assistOS.loadModule("webassistant");
const applicationModule = assistOS.loadModule("application");
export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.activeTab = "applications";
        this.invalidate();
    }

    async beforeRender() {
        this.applicationsTabActive = this.activeTab === 'applications' ? 'active' : '';
        this.webAssistantTabActive = this.activeTab === 'web-assistant' ? 'active' : '';
        this.applicationsContentActive = this.activeTab === 'applications' ? 'active' : '';
        this.webAssistantContentActive = this.activeTab === 'web-assistant' ? 'active' : '';

        let apps = await codeManager.getApps(assistOS.space.id);
        this.appsList = "";
        for(let appName of apps){
            this.appsList += `
                <div class="app-item">
                    <span class="app-name" data-local-action="openAppEditor ${appName}">${appName}</span>
                    <img class="delete-icon" src="./wallet/assets/icons/trash-can.svg" alt="Delete" data-local-action="deleteApplication ${appName}">
                </div>
            `;
        }
    }

    async afterRender() {
        const infoIcon = this.element.querySelector('.info-icon');
        infoIcon?.addEventListener('mouseenter', () => {
            this.showTooltip("This will create a public repository inside the AssistOS-apps GitHub organization. Please ensure your GitHub token is set in the settings.");
        });
        infoIcon?.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    selectTab(target, tabId) {
        this.activeTab = tabId;
        this.invalidate();
    }
    getChatId(appName, pageName){
        return  appName + `_${pageName}` + "_Chat";
    }
    async newApplication() {
        assistOS.UI.showLoading();
        let webAssistant = await webAssistantModule.getWebAssistant(assistOS.space.id);
        const appName = this.element.querySelector("#applicationName").value;
        if (!appName.trim()) {
            assistOS.showToast("Application name is required", "error");
            assistOS.UI.hideLoading();
            return
        }
        this.appName = appName;
        try {
            await codeManager.createApp(assistOS.space.id, appName);
        } catch (e) {
            assistOS.UI.hideLoading();
            console.error(e);
            await assistOS.showToast(`Failed to create app ${e.message}`, "error");
            return;
        }
        assistOS.space.applications = await applicationModule.getApplications(assistOS.space.id);
        let sidebar = document.querySelector("left-sidebar");
        sidebar.webSkelPresenter.invalidate();
        await assistOS.UI.reinit(`/spaces/webSkel-config`);
        assistOS.showToast("App created!", "success");
        this.appPages = [
            {component: "achilles-ide-component-edit", scriptName:"WebSkelVibe"},
            {component: "achilles-ide-theme-edit", scriptName:"ThemeVibe"},
            {component: "achilles-ide-backend-plugin-edit", scriptName:"BackendPluginVibe"},
            {component: "achilles-ide-document-plugin-edit", scriptName: "DocumentPluginVibe"}
        ];
        for(let appPage of this.appPages){
            let chatId = this.getChatId(appName, appPage.component);
            await chatModule.createChat(assistOS.space.id, assistOS.user.email, chatId, appPage.scriptName, ["User", webAssistant.agentName]);
            appPage.chatId = chatId;
        }
        assistOS.UI.hideLoading();
        await this.openAppEditor(null, appName);
    }
    async openAppEditor(target, appName){
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(appName)}`);
    }

    async deleteApplication(target, appName) {
        const confirmation = await assistOS.UI.showModal(
            "confirm-action-modal",
            {
                message: `Are you sure you want to delete the application ${appName}? This will also delete the GitHub repository. This action cannot be undone.`,
            }, true);

        if (confirmation) {
            try {
                await codeManager.deleteApp(assistOS.space.id, appName);
                assistOS.space.applications = assistOS.space.applications.filter(app => app.name !== appName);
                let sidebar = document.querySelector("left-sidebar");
                sidebar.webSkelPresenter.invalidate();
                assistOS.showToast("Application deleted successfully!", "success");
                this.invalidate();
            } catch (e) {
                console.error(e);
                assistOS.showToast(`Failed to delete app: ${e.message}`, "error");
            }
        }
    }

    showTooltip(message) {
        const buttonContainer = this.element.querySelector('.button-container');
        if (!buttonContainer) {
            console.error("Button container for tooltip not found!");
            return;
        }
        // Ensure no other tooltips are open
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-message';
        tooltip.textContent = message;
        buttonContainer.appendChild(tooltip);

        // Animate in
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
    }

    hideTooltip() {
        const tooltip = this.element.querySelector('.tooltip-message');
        if (tooltip) {
            tooltip.classList.remove('show');
            tooltip.addEventListener('transitionend', () => tooltip.remove(), { once: true });
        }
    }
}
