import manager from "../../manager.js"
export class AchillesIdeLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {

  
    }


    async afterRender() {

    }
    async openEditor(){
        await manager.navigateInternal("achilles-ide-code-edit", "achilles-ide-code-edit")
    }
}
  
