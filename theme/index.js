var fs = require("fs");
var path = require("path");

var style = {
    "pdf": "pdf.css",
    "epub": "reader.css",
    "mobi": "reader.css"
};

module.exports = {
    ebook : function () {
        var extension = obtainExtension(this.options);
        return {
            assets: "./theme/ebook",
            css: [
                "ebook.css",
                style[extension],
                "hljs.css"
            ]
        };
    },
    book : {
        assets: "./theme/book",
        css: [
            "book.css",
            "base.css",
            "barra.css",
            "navigation.css",
            "comunidade.css",
            "sumario.css",
            "tubaina.css",
            "hljs.css"
        ]
    },
    templates: {
        "ebook:sumary": "./theme/ebook/templates/gitbook/summary.html",
        "site:page": "./theme/book/templates/gitbook/page.html",
        "site:langs": "./theme/book/templates/gitbook/langs.html",
        "site:glossary": "./theme/book/templates/gitbook/glossary.html"
    },
    setOptions: setOptions
};

function obtainExtension(options) {
    var extension = options.extension || path.extname(options.output).replace(".", "");
    return extension || "pdf";
}

function setOptions(){
    this.options.maxLineLength = 80;
    this.options.pluginsConfig["caelum-tema"]["sigla_curso"] = this.options.pluginsConfig["caelum-tema"]["sigla_curso"] || this.options.bookCode
    pdfOptions.call(this);
}

function pdfOptions(){
    this.options.pdf.customSize = "210x280";

    this.options.pdf.fontSize =  "12";

    this.options.pdf.margin.top =  "56";
    this.options.pdf.margin.bottom =  "56";
    this.options.pdf.margin.left =  "56";
    this.options.pdf.margin.right =  "56";

    this.options.pdf.introTemplate = path.join(__dirname, "./ebook/templates/pdf/intro.tpl.html");

    this.options.pdf.tocTemplate = path.join(__dirname, "./ebook/templates/pdf/toc.tpl.html");

    this.options.pdf.headerFooterTemplate = path.join(__dirname, "./ebook/templates/pdf/cabecalho-rodape.tpl.html");

    this.options.pdf.summary = {
        headerTemplate: "<p id='ebook-header' style='border-bottom: 1px solid black; margin-top: 36pt;'><span class='odd_page'><span>Caelum</span><span style='float:right'>Sumário</span></span><span class='even_page'><span>Sumário</span><span style='float:right'>Caelum</span></span></p>",
        footerTemplate: null
    };
}