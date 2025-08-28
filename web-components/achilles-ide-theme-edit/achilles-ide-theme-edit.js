import { themeContract } from './theme-contract.js';
import { defaultTheme } from './default-theme.js';
import manager from "../../manager.js";
const codeManager = assistOS.loadModule("codemanager");

export class AchillesIdeThemeEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.appName = decodeURIComponent(urlParts[3]);
        this.themeName = decodeURIComponent(urlParts[5] || "");
        this.isNewTheme = !this.themeName;
        this.spaceId = assistOS.space.id;
        this.theme = {};
        this.activeTab = 'variables';
        this.invalidate();
    }

    async beforeRender() {
        this.existingThemeNames = await codeManager.listThemesForApp(this.spaceId, this.appName);
        if (this.isNewTheme) {
            await this.handleAddRender();
        } else {
            await this.handleEditRender();
        }
        this.themeNameValue = this.theme.name || "";
    }

    async handleAddRender() {
        this.theme = JSON.parse(JSON.stringify(defaultTheme));
        this.theme.name = ""; // Start with an empty name for new themes
    }

    async handleEditRender() {
        const cssContent = await codeManager.getTheme(this.spaceId, this.appName, this.themeName);
        this.parseThemeCSS(cssContent);
    }

    parseThemeCSS(css) {
        this.theme = JSON.parse(JSON.stringify(defaultTheme)); // Start with defaults

        // Parse theme name
        const nameMatch = css.match(/\/\*\s*Theme Name:\s*(.*?)\s*\*\//);
        if (nameMatch && nameMatch[1]) {
            this.theme.name = nameMatch[1];
        } else {
            this.theme.name = this.themeName; // Fallback to filename
        }

        // Parse variables
        const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
        if (rootMatch && rootMatch[1]) {
            const varBlock = rootMatch[1];
            const varMatches = varBlock.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
            for (const match of varMatches) {
                const key = match[1];
                const value = match[2].trim();

                // Find which category this key belongs to
                for (const [category, variables] of Object.entries(themeContract)) {
                    if (variables[key]) {
                        if (!this.theme.variables[category.toLowerCase()]) {
                            this.theme.variables[category.toLowerCase()] = {};
                        }
                        this.theme.variables[category.toLowerCase()][key] = value;
                        break;
                    }
                }
            }
        }

        // Parse custom CSS
        const customCSSMatch = css.match(/\/\*\s*Custom CSS\s*\*\/([\s\S]*)/);
        if (customCSSMatch && customCSSMatch[1]) {
            this.theme.customCSS = customCSSMatch[1].trim();
        } else if (rootMatch) {
            const rootEndIndex = rootMatch.index + rootMatch[0].length;
            this.theme.customCSS = css.substring(rootEndIndex).trim();
        } else {
            this.theme.customCSS = css.trim();
        }
    }

    async afterRender() {
        this.renderThemeVarControls();
        this.element.querySelector('#custom-css').value = this.theme.customCSS || '';
        const themeNameInput = this.element.querySelector('#theme-name');

        const validationMessageElement = this.element.querySelector('.error-message');

        themeNameInput.addEventListener('input', () => {
            const validation = this.validateName(themeNameInput.value);
            if (!validation.isValid) {
                themeNameInput.classList.add('invalid');
                validationMessageElement.textContent = validation.message;
                validationMessageElement.style.display = 'block';
            } else {
                themeNameInput.classList.remove('invalid');
                validationMessageElement.style.display = 'none';
            }
        });

        this.renderPreview();
        this.selectTab(null, this.activeTab);
    }

    selectTab(targetElement, tabId) {
        this.activeTab = tabId;
        this.element.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
        this.element.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.dataset.tabContent === tabId));

        const styleElement = this.element.querySelector('#preview-style');
        if (tabId === 'preview') {
            this.updatePreviewStyles();
        } else {
            if (styleElement) {
                styleElement.textContent = '';
            }
        }
    }

    renderThemeVarControls() {
        const container = this.element.querySelector('.theme-vars-container');
        container.innerHTML = '';

        for (const [category, variables] of Object.entries(themeContract)) {
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'theme-category-header';
            categoryHeader.textContent = category;
            container.appendChild(categoryHeader);

            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'theme-category-container';
            container.appendChild(categoryContainer);

            for (const [key, config] of Object.entries(variables)) {
                const value = this.theme.variables[category.toLowerCase()]?.[key] || '';
                const wrapper = document.createElement('div');
                wrapper.className = 'theme-var-item';

                const label = document.createElement('label');
                label.className = 'theme-var-label';
                label.textContent = config.label;
                label.title = key;
                wrapper.appendChild(label);

                const input = document.createElement('input');
                input.type = config.type === 'color' ? 'color' : 'text';
                input.name = `${category.toLowerCase()}.${key}`;
                input.value = value;
                input.className = 'form-input';
                wrapper.appendChild(input);

                categoryContainer.appendChild(wrapper);
            }
        }
    }

    validateName(name) {
        if (!name || name.trim() === "") {
            return { isValid: false, message: "Theme name is required." };
        }
        if (!this.isNewTheme && name === this.themeName) {
            return { isValid: true };
        }
        if (this.existingThemeNames.includes(name)) {
            return { isValid: false, message: "This theme name already exists." };
        }
        return { isValid: true };
    }

    renderPreview() {
        const previewContainer = this.element.querySelector('.preview-container');
        previewContainer.innerHTML = `
            <style id="preview-style"></style>
            <div class="preview-content">
                <div class="preview-section">
                    <h1 style="font-family: var(--font-family-heading); font-size: var(--font-size-h1); color: var(--text-primary);">Heading 1 (font-family-heading, font-size-h1, text-primary)</h1>
                    <h2 style="font-family: var(--font-family-heading); font-size: var(--font-size-h2); color: var(--text-primary);">Heading 2 (font-size-h2)</h2>
                    <h3 style="font-family: var(--font-family-heading); font-size: var(--font-size-h3); color: var(--text-secondary);">Heading 3 (font-size-h3, text-secondary)</h3>
                    <p style="font-family: var(--font-family-base); font-size: var(--font-size-base); line-height: var(--line-height-base); color: var(--text-primary);">
                        This is a paragraph using the base font styles (font-family-base, font-size-base, line-height-base). It demonstrates the primary text color.
                    </p>
                </div>

                <div class="preview-section">
                    <div class="button-showcase">
                        <button class="preview-btn primary" style="background-color: var(--primary); color: var(--text-on-primary); padding: var(--padding-base); border-radius: var(--border-radius-base);">Primary Button (primary, text-on-primary, padding-base, border-radius-base)</button>
                        <button class="preview-btn accent" style="background-color: var(--accent); color: var(--text-on-accent); padding: var(--padding-sm); border-radius: var(--border-radius-sm);">Accent Button (accent, text-on-accent, padding-sm, border-radius-sm)</button>
                        <button class="preview-btn disabled" style="background-color: var(--disabled-bg); color: var(--disabled-text); padding: var(--padding-lg); border-radius: var(--border-radius-lg);">Disabled (disabled-bg, disabled-text, padding-lg, border-radius-lg)</button>
                    </div>
                </div>

                <div class="preview-section">
                    <div class="card-showcase">
                        <div class="preview-card" style="background: var(--background-secondary); box-shadow: var(--shadow-sm); border: var(--border-width-base) solid var(--border);">
                            <p>Card with small shadow (shadow-sm, background-secondary, border)</p>
                        </div>
                        <div class="preview-card" style="background: var(--background-secondary); box-shadow: var(--shadow-md);">
                            <p>Card with medium shadow (shadow-md)</p>
                        </div>
                        <div class="preview-card" style="background: var(--background-secondary); box-shadow: var(--shadow-lg);">
                            <p>Card with large shadow (shadow-lg)</p>
                        </div>
                    </div>
                </div>

                <div class="preview-section">
                    <div class="alert-showcase">
                        <div class="preview-alert" style="background-color: var(--success); color: var(--text-on-primary);">Success (success)</div>
                        <div class="preview-alert" style="background-color: var(--warning); color: var(--text-on-primary);">Warning (warning)</div>
                        <div class="preview-alert" style="background-color: var(--danger); color: var(--text-on-primary);">Danger (danger)</div>
                        <div class="preview-alert" style="background-color: var(--info); color: var(--text-on-primary);">Info (info)</div>
                    </div>
                </div>
                
                <div class="preview-section">
                    <input type="text" class="preview-input" style="border: var(--border-width-base) solid var(--border-input);" placeholder="Input field (border-input)">
                </div>
            </div>
        `;
    }

    updatePreviewStyles() {
        const styleElement = this.element.querySelector('#preview-style');
        if (!styleElement) return;

        let cssString = ':root {\n';
        const themeInputs = this.element.querySelectorAll('.theme-vars-container [name]');
        themeInputs.forEach(input => {
            const value = input.value;
            if (value) {
                const key = input.name.split('.')[1];
                cssString += `    --${key}: ${value};\n`;
            }
        });
        cssString += '}\n\n';

        const customCSS = this.element.querySelector('#custom-css').value;
        if (customCSS) {
            cssString += customCSS;
        }
        styleElement.textContent = cssString;
    }

    async goBack() {
        await manager.navigateInternal("achilles-ide-app-editor", `achilles-ide-app-editor/${encodeURIComponent(this.appName)}`);
    }

    async saveTheme() {
        const themeNameInput = this.element.querySelector('#theme-name');
        const themeName = themeNameInput.value.trim();

        const nameValidation = this.validateName(themeName);
        if (!nameValidation.isValid) {
            assistOS.showToast(nameValidation.message, "error");
            return;
        }

        let cssString = `/* Theme Name: ${themeName} */\n\n:root {\n`;

        const themeInputs = this.element.querySelectorAll('.theme-vars-container [name]');
        const formVariables = {};
        themeInputs.forEach(input => {
            formVariables[input.name] = input.value;
        });

        for (const [category, variables] of Object.entries(themeContract)) {
            cssString += `    /* ${category} */\n`;
            for (const [key, config] of Object.entries(variables)) {
                const formKey = `${category.toLowerCase()}.${key}`;
                const value = formVariables[formKey];
                if (value) {
                    cssString += `    --${key}: ${value};\n`;
                }
            }
            cssString += '\n';
        }
        cssString = cssString.slice(0, -1); // remove last newline
        cssString += '}\n\n';

        const customCSS = this.element.querySelector('#custom-css').value;
        if (customCSS) {
            cssString += `/* Custom CSS */\n${customCSS}\n`;
        }

        try {
            if (this.isNewTheme) {
                await codeManager.saveTheme(this.spaceId, this.appName, themeName, cssString);
            } else {
                await codeManager.saveTheme(this.spaceId, this.appName, this.themeName, cssString, themeName);
            }
            assistOS.showToast("Theme saved successfully!", "success");
            await this.goBack();
        } catch (e) {
            assistOS.showToast(`Error saving theme: ${e.message}`, "error");
            console.error(e);
        }
    }
}