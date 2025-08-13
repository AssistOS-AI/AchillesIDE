const LLM_SUPPORT_PAGE = "achilles-ide-landing";

export class RoutingService {
    constructor() {
        if (RoutingService.instance) {
            return RoutingService.instance;
        } else {
            RoutingService.instance = this;
            return this;
        }
    }

    async navigateToLocation(locationArray = [], appName) {
        if (locationArray.length === 0 || locationArray[0] === LLM_SUPPORT_PAGE) {
            const pageUrl = `${assistOS.space.id}/${appName}/${LLM_SUPPORT_PAGE}`;
            await assistOS.UI.changeToDynamicPage(LLM_SUPPORT_PAGE, pageUrl);
            return;
        }
        if (locationArray[locationArray.length - 1] !== LLM_SUPPORT_PAGE) {
            console.error(`Invalid URL: URL must end with ${LLM_SUPPORT_PAGE}`);
            return;
        }
        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = `${assistOS.space.id}/${appName}/${locationArray.join("/")}`;
        await assistOS.UI.changeToDynamicPage(webComponentName, pageUrl);
    }

    static navigateInternal(subpageName, presenterParams) {
        const composePresenterParams = (presenterParams) => {
            let presenterParamsString = "";
            Object.keys(presenterParams).forEach((key) => {
                presenterParamsString += ` data-${key}='${presenterParams[key]}'`;
            });
            return presenterParamsString;
        }
        const appContainer = document.querySelector("#app-container")
        appContainer.innerHTML = `<${subpageName} data-presenter="${subpageName}" ${composePresenterParams(presenterParams)}></${subpageName}>`;
    }
}
