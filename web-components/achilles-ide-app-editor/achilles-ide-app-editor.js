import manager from "../../manager.js"

const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");

export class AchillesIdeAppEditor {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        
        // Extract app name from URL or receive via data attribute
        let urlParts = window.location.hash.split("/");
        this.appName = decodeURIComponent(urlParts[urlParts.length - 1]);
        
        this.sections = {
            webskel: {
                name: "WebSkel Components",
                editPage: "achilles-ide-component-edit",
                listFn: "listComponentsForApp",
                scriptName: "WebSkelVibe",
                items: []
            },
            backend: {
                name: "Backend Plugins",
                editPage: "achilles-ide-backend-plugin-edit",
                listFn: "listBackendPluginsForApp",
                scriptName: "BackendPluginVibe",
                items: []
            },
            document: {
                name: "Document Plugins",
                editPage: "achilles-ide-document-plugin-edit",
                scriptName: "DocumentPluginVibe",
                items: []
            }
        };
        
        // Set default active section
        this.activeSection = 'webskel';
        
        this.invalidate();
    }

    async beforeRender() {
        this.appTitle = this.appName;
        
        // Load items for each section
        await this.loadSectionItems();
        
        // Render items HTML for each section
        this.webSkelItems = this.renderItemsList(this.sections.webskel.items, "webskel");
        this.backendPluginItems = this.renderItemsList(this.sections.backend.items, "backend");
        this.documentPluginItems = this.renderItemsList(this.sections.document.items, "document");
        
        // Set active classes for menu and content
        this.webSkelActive = this.activeSection === 'webskel' ? 'active' : '';
        this.backendActive = this.activeSection === 'backend' ? 'active' : '';
        this.documentActive = this.activeSection === 'document' ? 'active' : '';
        
        // Set display classes for content sections
        this.webSkelDisplay = this.activeSection === 'webskel' ? 'active' : '';
        this.backendDisplay = this.activeSection === 'backend' ? 'active' : '';
        this.documentDisplay = this.activeSection === 'document' ? 'active' : '';
    }

    async afterRender() {
        // No need for collapsed state handling with new layout
    }

    async loadSectionItems() {
        for (const [sectionKey, section] of Object.entries(this.sections)) {
            if (typeof codeManager[section.listFn] === 'function') {
                try {
                    const items = await codeManager[section.listFn](assistOS.space.id, this.appName);
                    section.items = Array.isArray(items) ? items : [];
                } catch (error) {
                    console.error(`Error loading ${section.name}:`, error);
                    section.items = [];
                }
            } else if (section.listFn) {
                console.warn(`Function ${section.listFn} not found in codeManager`);
                section.items = [];
            }
        }
    }

    renderItemsList(items, sectionType) {
        if (!items || items.length === 0) {
            return `
                <div class="empty-state">
                    <img src="./wallet/assets/icons/empty.svg" alt="empty">
                    <p>No items yet</p>
                </div>
            `;
        }
        
        return items.map(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            return `
                <div class="item-card" data-local-action="openItem ${sectionType} ${itemName}">
                    <span class="item-name">${itemName}</span>
                    <div class="item-actions">
                        <button class="action-button" data-local-action="editItem ${sectionType} ${itemName}">
                            <img src="./wallet/assets/icons/edit.svg" alt="edit">
                        </button>
                        <button class="action-button" data-local-action="deleteItem ${sectionType} ${itemName}">
                            <img src="./wallet/assets/icons/delete.svg" alt="delete">
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    selectSection(target, sectionKey) {
        // Update active section
        this.activeSection = sectionKey;
        
        // Update menu items
        this.element.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeMenuItem = this.element.querySelector(`.menu-item[data-local-action="selectSection ${sectionKey}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
        
        // Update content sections
        this.element.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = this.element.querySelector(`.content-section[data-section="${sectionKey}"]`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    async openItem(target, sectionType, itemName) {
        const section = this.sections[sectionType];
        if (!section) return;
        
        const url = `achilles-ide-chat-page/${encodeURIComponent(this.appName)}/${section.editPage}/${encodeURIComponent(itemName)}`;
        await manager.navigateInternal("achilles-ide-chat-page", url);
    }

    async editItem(target, sectionType, itemName) {
        // Prevent event bubbling to openItem
        if (target && target.stopPropagation) {
            target.stopPropagation();
        }
        
        await this.openItem(null, sectionType, itemName);
    }

    async deleteItem(target, sectionType, itemName) {
        const section = this.sections[sectionType];
        if (!section) return;
        
        const confirmed = await assistOS.UI.showModal("confirm-action-modal", {
            message: `Are you sure you want to delete ${itemName}?`,
        }, true);
        
        if (confirmed) {
            try {
                // Call appropriate delete function based on section type
                if (sectionType === 'webskel') {
                    await codeManager.deleteComponent(assistOS.space.id, this.appName, itemName);
                } else if (sectionType === 'backend') {
                    await codeManager.deleteBackendPlugin(assistOS.space.id, this.appName, itemName);
                } else if (sectionType === 'document') {
                    await codeManager.deleteDocumentPlugin(assistOS.space.id, this.appName, itemName);
                }
                assistOS.showToast(`${itemName} deleted successfully`, "success");
                
                // Reload section items
                await this.loadSectionItems();
                this.invalidate();
            } catch (error) {
                console.error(`Error deleting ${itemName}:`, error);
                assistOS.showToast(`Failed to delete ${itemName}`, "error");
            }
        }
    }

    async addItem(target, sectionType) {
        const section = this.sections[sectionType];
        if (!section) return;
        
        const url = `achilles-ide-chat-page/${encodeURIComponent(this.appName)}/${section.editPage}`;
        await manager.navigateInternal("achilles-ide-chat-page", url);
    }

    async goBack() {
        await manager.navigateInternal("achilles-ide-landing", "achilles-ide-landing");
    }

    async openCommitModal() {
        await assistOS.UI.showModal("achilles-ide-commit-modal", { appName: this.appName });
    }
}