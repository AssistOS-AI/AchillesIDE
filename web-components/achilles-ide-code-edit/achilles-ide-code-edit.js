const CodeManager = assistOS.loadModule("codemanager", {});

export class AchillesIdeCodeEdit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.context = JSON.parse(decodeURIComponent(this.element.getAttribute("data-context")));

        this.state = {
            editorContent: this.element.getAttribute("data-editor-content") ? decodeURIComponent(this.element.getAttribute("data-editor-content")) : "",
            loading: false,
            fileType: this.context.fileType || "js"
        };
        // The component is now "dumb" and doesn't fetch its own code.
        // The parent component will be responsible for providing the content.
        // For demonstration, we start with a blank template.
        this.invalidate(async () => {
            await this.initializeEditorState();
        });
    }

    async initializeEditorState() {

        this.state.fileName = `${this.context.fileName}`;

        try {
            this.state.editorContent = await CodeManager.getCode(assistOS.space.id, this.state.fileName);
        } catch (e) {
            console.info(`No file found for context "${this.context.fileName}". Starting with a blank template.`);
        }
        this.state.editorContent = this.state.editorContent || `// Blank template for ${this.context.fileName}\n\nexport class ${this.context.fileName.replace(/\s/g, '')} {\n    constructor() {\n        console.log("Hello from ${this.context.fileName}");\n    }\n}\n`;

        this.state.loading = false;

    }

    beforeRender() {
        this.renderSingleFileEditor();
    }

    setFileName() {
        if (this.context.singleFile) {
            this.element.querySelector('.page-header .left-header').innerHTML = `<span> Editing: ${this.state.fileName}.${this.state.fileType}</span> <img class="edit-icon" src="./wallet/assets/icons/edit.svg" data-local-action="editName">`;
        }
    }

    renderSingleFileEditor() {
        this.itemList = "";
        let footer = this.context.singleFile ? `<div class="editor-footer">
                    <button class="general-button" data-local-action="saveCode">Save</button>
            </div>` : "";
        this.editor = `
            <div class="editor-wrapper">
                <textarea class="code-input" file-type="${this.state.fileType}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
                <pre class="code-output" aria-hidden="true"><code class="language-${this.state.fileType}"></code></pre>
            </div>
            ${footer}
        `;
    }

    afterRender() {
        this.setFileName();
        this.textarea = this.element.querySelector('.code-input');
        this.codeBlock = this.element.querySelector('.code-output code');

        // Bind the syncHighlight method to maintain 'this' context
        this.syncHighlight = this.syncHighlight.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        if (this.textarea) {
            this.textarea.value = this.state.editorContent || "";
            this.codeBlock.innerHTML = this.highlight(this.state.editorContent, this.state.fileType);

            this.textarea.addEventListener('input', this.syncHighlight);
            this.textarea.addEventListener('scroll', () => this.syncScroll(this.textarea, this.codeBlock.parentElement));
            this.textarea.addEventListener('keydown', this.handleKeyDown);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            this.textarea.value = this.textarea.value.substring(0, start) + '  ' + this.textarea.value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
            this.syncHighlight();
        }
    }

    syncHighlight() {
        if (!this.textarea || !this.codeBlock) return;
        const code = this.textarea.value;
        this.state.editorContent = code;
        this.codeBlock.innerHTML = this.highlight(code, this.state.fileType);
        this.syncScroll(this.textarea, this.codeBlock.parentElement);
    }

    highlight(text, type) {
        if (!text) return '';

        // Basic HTML escaping
        const escapeHTML = str => str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        let result = escapeHTML(text);

        if (type === 'js') {
            // JavaScript highlighting
            result = this.highlightJavaScript(result);
        } else if (type === 'html') {
            // HTML highlighting
            result = this.highlightHTML(result);
        } else if (type === 'css') {
            // CSS highlighting
            result = this.highlightCSS(result);
        }

        return result;
    }

    highlightJavaScript(code) {
        // This more robust approach tokenizes the code to avoid incorrect highlighting within strings or comments.
        const parts = [];
        let lastIndex = 0;

        // Regex to find strings (handling escaped quotes) or comments.
        const regex = /([`"'])(?:\\.|(?!\1).)*?\1|(\/\*[\s\S]*?\*\/|\/\/.*)/g;

        code.replace(regex, (match, stringDelimiter, comment, offset) => {
            // Push the segment of code before the current match.
            if (offset > lastIndex) {
                parts.push(code.substring(lastIndex, offset));
            }

            // Push the highlighted string or comment.
            if (stringDelimiter) { // It's a string
                parts.push(`<span class="string">${match}</span>`);
            } else { // It's a comment
                parts.push(`<span class="comment">${match}</span>`);
            }

            // Update the last index to the end of the current match.
            lastIndex = offset + match.length;
        });

        // Push any remaining code after the last match.
        if (lastIndex < code.length) {
            parts.push(code.substring(lastIndex));
        }

        // Define keywords and regex for numbers.
        const keywords = [
            'const', 'let', 'var', 'function', 'export', 'class', 'constructor',
            'async', 'await', 'try', 'catch', 'if', 'else', 'return', 'new', 'this',
            'import', 'from', 'of', 'for', 'while', 'do', 'switch', 'case', 'break',
            'continue', 'delete', 'in', 'instanceof', 'typeof', 'void', 'with',
            'true', 'false', 'null', 'undefined', 'document', 'window', 'console', 'log'
        ];
        const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
        const numberRegex = /\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;

        // Process only the parts that are not already highlighted (i.e., not strings or comments).
        const finalParts = parts.map(part => {
            if (part.startsWith('<span')) {
                return part;
            }
            return part
                .replace(keywordRegex, '<span class="keyword">$1</span>')
                .replace(numberRegex, '<span class="number">$1</span>');
        });

        return finalParts.join('');
    }

    highlightHTML(code) {
        // Handle HTML comments first
        let result = code.replace(/&lt;!--[\s\S]*?--&gt;/g,
            match => `<span class="comment">${match}</span>`);

        // Handle DOCTYPE
        result = result.replace(/&lt;!DOCTYPE[^>]+&gt;/g,
            match => `<span class="doctype">${match}</span>`);

        // Handle closing tags, e.g., </div>
        result = result.replace(/&lt;\/([a-zA-Z][a-zA-Z0-9-]*?)&gt;/g,
            `&lt;/<span class="tag">$1</span>&gt;`);

        // Handle opening tags and their attributes, e.g., <div class="test">
        result = result.replace(/&lt;([a-zA-Z][a-zA-Z0-9-]*)(.*?)&gt;/g,
            (match, tagName, attrs) => {
                let highlighted = `&lt;<span class="tag">${tagName}</span>`;

                if (attrs) {
                    // Handle attributes and their values
                    // Note: This handles attributes with double quotes, as escapeHTML turns " into &quot;
                    highlighted += attrs.replace(/(\s+)([a-zA-Z0-9-]+)(=)(&quot;)(.*?)(&quot;)/g,
                        (attrMatch, space, attrName, equals, quoteStart, value, quoteEnd) =>
                            `${space}<span class="attribute">${attrName}</span>${equals}${quoteStart}<span class="attribute-value">${value}</span>${quoteEnd}`
                    );
                }

                return highlighted + '&gt;';
            });
        return result;
    }

    highlightCSS(code) {
        // Handle selectors
        let result = code.replace(/([\w-]+)(?=\s*\{)/g,
            match => `<span class="selector">${match}</span>`);

        // Handle properties
        result = result.replace(/([\w-]+)(?=\s*:)/g,
            match => `<span class="property">${match}</span>`);

        // Handle values
        result = result.replace(/:\s*([^;\{\}!]+)(?=;|\s*\{|!important)/g,
            (match, value) => `: <span class="value">${value.trim()}</span>`);

        // Handle important flag
        result = result.replace(/!important/g,
            match => `<span class="keyword">${match}</span>`);

        // Handle comments
        result = result.replace(/\/\*[\s\S]*?\*\//g,
            match => `<span class="comment">${match}</span>`);

        // Handle numbers and units
        result = result.replace(/(\d+)(px|em|rem|%|s|ms|vh|vw|vmin|vmax|cm|mm|in|pt|pc|ex|ch|fr|deg|rad|grad|turn)/g,
            (match, num, unit) => `<span class="number">${num}</span><span class="unit">${unit}</span>`);

        // Handle colors
        result = result.replace(/(#([0-9a-fA-F]{3,6})|(rgb|hsl)a?\([^)]*\))/g,
            match => `<span class="string">${match}</span>`);

        return result;
    }

    syncScroll(source, target) {
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
    }

    editName() {
        this.element.querySelector('.page-header .left-header').innerHTML = `<input class="title-input" type="text" value="${this.state.fileName}"/>`;

        this.element.querySelector('.title-input')?.focus();
        this.element.querySelector('.title-input')?.addEventListener('keydown', this.saveName.bind(this));
        this.element.querySelector('.title-input')?.addEventListener('blur', this.saveName.bind(this));
    }

    async saveName(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            const newName = event.target.value;

            if (newName && newName !== this.state.fileName) {
                const oldName = this.state.fileName;
                const oldPascalCaseName = oldName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');

                this.state.fileName = newName;
                const newPascalCaseName = newName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
                if (this.state.fileType === "js") {
                    this.textarea.value = this.textarea.value.replaceAll(oldPascalCaseName, newPascalCaseName);
                } else {
                    this.textarea.value = this.textarea.value.replaceAll(oldName, newName);
                }
                this.syncHighlight();
            }
            //this.setFileName();
            this.invalidate();
        }
    }

    async saveCode() {
        if (!this.state.fileName) return;
        const filePath = this.context.singleFile ? `${this.state.fileName}.${this.state.fileType}` : `${this.state.fileName}/${this.state.fileName}.${this.state.fileType}`;
        await CodeManager.saveCode(assistOS.space.id, filePath, this.state.editorContent);
        assistOS.showToast("Code saved successfully!", "success");
    }
}
