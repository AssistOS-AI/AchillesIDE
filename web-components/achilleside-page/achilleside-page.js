// import sdkModule from "../../../../../../../assistos-sdk/modules/application";

const assistOSSDK = require("assistos")
const applicationModule = require('assistos').loadModule('application', {});

export class AchillesIDEPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.documentId = this.element.getAttribute("data-documentId")

    }



    async beforeRender() {

    }

    async afterRender() {

    }
    async saveProject1 (_target){

        try {
            await assistOS.loadifyFunction(async () => {
                const bookGenerationData = {
                    llm: "ChatGPT",
                    size: 8,
                    documentId: this.documentId
                };

                const formElement = this.element.querySelector("form");
                const formData = await assistOS.UI.extractFormInformation(formElement);
                debugger;
                if (!formData.isValid) {
                    return assistOS.UI.showApplicationError("Invalid form data", "Please fill all the required fields", "error");
                }
                const planData = formData.data;

                const response = await applicationModule.runApplicationFlow(
                    assistOS.space.id,
                    "AchillesIDE", // numele aplicatiei
                    "GenerateApplication", // numele flow ului
                    planData
                );

                const documentId = response.data;
                await assistOS.UI.changeToDynamicPage(
                    `space-application-page`,
                    `${assistOS.space.id}/Space/document-view-page/${documentId}`
                );
            });
        } catch (error) {
            console.error("Error while saving the project:", error);
            alert(`Error: ${error.message || "Unknown error occurred"}`);
        }
        // try {
        //     await sdkModule.runApplicationFlow();
        // } catch (error) {
        //     console.error("Error in runApplicationFlow:", error);
        // }
    }
}
