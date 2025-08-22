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
    beforeRender(){

    }
}