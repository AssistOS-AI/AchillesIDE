function getTemplate(type, name) {

    if (type === "html") {
        return `<!-- HTML for ${name} -->\n<div class="${name.replace(/[^a-zA-Z0-9]/g, '-')}">\n    \n</div>`;
    }

    if (type === "css") {
        return `/* CSS for ${name} */\n.${name.replace(/[^a-zA-Z0-9]/g, '-')} {\n\n}`;
    }
    if (type === "js") {
        const pascalCaseName = getPascalCaseName(name);
        return `export class ${pascalCaseName} {\n    constructor(element, invalidate) {\n        this.element = element;\n        this.invalidate = invalidate;\n        this.invalidate();\n    }\n\n    beforeRender() {\n\n    }\n\n    afterRender() {\n\n    }\n}`;
    }
    if(type === "inline-html") {
        return `<template>\n    <!-- Your HTML content here -->\n</template>\n\n<style>\n    /* Your CSS content here */\n</style>\n\n<script>\n    /* Your JavaScript content here */\n</script>`;
    }

}

function getPascalCaseName(name) {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('').replace(/[^a-zA-Z0-9]/g, '');
}

export {
    getTemplate,
    getPascalCaseName
}
