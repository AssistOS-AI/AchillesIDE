const codeManager = assistOS.loadModule("codemanager");
export class AchillesIdeCommitModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.appName = decodeURIComponent(urlParts[urlParts.length - 1]);
        this.invalidate();
    }

    async beforeRender() {
        let status = await codeManager.getAppRepoStatus(assistOS.space.id, this.appName);
        this.hasChanges = status.added.length > 0 || status.modified.length > 0 || status.deleted.length > 0;

        if (this.hasChanges) {
            let addedSection = status.added.length > 0 ? `
                <div class="changes-section">
                    <div class="changes-header">Added</div>
                    <ul class="changes-list added">
                        ${status.added.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>` : '';

            let modifiedSection = status.modified.length > 0 ? `
                <div class="changes-section">
                    <div class="changes-header">Modified</div>
                    <ul class="changes-list modified">
                        ${status.modified.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>` : '';

            let deletedSection = status.deleted.length > 0 ? `
                <div class="changes-section">
                    <div class="changes-header">Deleted</div>
                    <ul class="changes-list deleted">
                        ${status.deleted.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>` : '';

            this.changesSummary = addedSection + modifiedSection + deletedSection;
        } else {
            this.changesSummary = `<div class="no-changes">Nothing to commit.</div>`;
        }
    }

    afterRender() {
        if (!this.hasChanges) {
            this.element.querySelector('#commit-message').disabled = true;
            this.element.querySelector('[data-local-action="commitAndPush"]').disabled = true;
        }
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async commitAndPush(_target) {
        const commitMessage = this.element.querySelector('#commit-message').value;
        if (!commitMessage.trim()) {
            assistOS.showToast("Commit message is required.", "error");
            return;
        }
        try {
            await codeManager.commitAndPush(assistOS.space.id, this.appName, commitMessage);
        } catch (e) {
            console.error(e);
            assistOS.showToast(`Failed to commit and push changes. ${e.message}`, "error");
            return;
        }
        assistOS.showToast("Changes committed and pushed successfully!", "success");
        this.closeModal(_target);
    }
}