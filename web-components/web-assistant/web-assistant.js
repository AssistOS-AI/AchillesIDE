const getChatIframeURL = (spaceId) => {
    return `http://localhost:8080/chat-iframe?space=${spaceId}`
}
export class WebAssistant {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.page = "settings";
        this.invalidate();
    }
    pages = {
        "settings":"web-assistant-settings",
        "scripts":"chat-scripts-page"
    };
    async beforeRender(){
        let webComponent = this.pages[this.page];
        this.currentPage = `<${webComponent} data-presenter="${webComponent}"><${webComponent}/>`;

    }
    launchIframe(){
        window.open(getChatIframeURL(assistOS.space.id), '_blank')
    }
    async openPage(button, pageName){
        this.page = pageName;
        this.invalidate();
    }
    async afterRender(){
    }

}