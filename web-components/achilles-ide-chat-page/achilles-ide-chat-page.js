export class AchillesIdeChatPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.currentPage = urlParts[urlParts.length - 1];
        this.appName = urlParts[urlParts.length - 2];
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