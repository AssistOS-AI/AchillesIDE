const applicationModule = assistOS.loadModule("application");
const codeManager = assistOS.loadModule("codemanager");
export class AchillesIdeChatPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.currentPage = urlParts[4];
        this.appName = urlParts[3];
        this.spaceId = assistOS.space.id;
        this.userEmail = assistOS.user.email;
        this.chatId = this.getChatId(this.appName, this.currentPage);
        this.invalidate();
    }
    getChatId(appName, pageName){
        return appName + `_${pageName}` + "_Chat";
    }
    handleReply(reply){
        try {
            let takeActionMessage = JSON.parse(reply.message);
            let currentPagePresenter = this.element.querySelector(this.currentPage).webSkelPresenter;
            //called without async
            if(takeActionMessage.action){
                if(currentPagePresenter.takeWebAssistantAction){
                    currentPagePresenter.takeWebAssistantAction(takeActionMessage.action);
                }
            }
            return reply;
        } catch (e) {
            //do nothing
            return reply;
        }
    }
    async getChatUIContext(){
        let currentPagePresenter = this.element.querySelector(this.currentPage).webSkelPresenter;
        let chatUIContext = "";
        if(currentPagePresenter.getUIContext){
            chatUIContext = currentPagePresenter.getUIContext();
        }
        let appManifest = await applicationModule.getApplicationManifest(assistOS.space.id, this.appName);
        let currentTheme = await codeManager.getTheme(assistOS.space.id, this.appName, appManifest.theme);
        chatUIContext = chatUIContext + `
        Current application is named: ${this.appName},
        current theme is: ${currentTheme}, you must use these styles
        `;
        return chatUIContext;
    }
    beforeRender(){

    }
}