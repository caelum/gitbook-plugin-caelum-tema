let pluginPath = 'theme'
module.exports = {
    scripts: `**/*.js`
    ,templates: {
        pdf: `${pluginPath}/ebook/templates/**/*.html`
        ,mobi: `${pluginPath}/ebook/templates/**/*.html`
        ,epub: `${pluginPath}/ebook/templates/**/*.html`
        ,html: `${pluginPath}/book/templates/**/*.html`
    }
    ,staticAssets: {
        pdf: `${pluginPath}/ebook/**/*.{css|js|svg|jpg|png}`
        ,mobi: `${pluginPath}/ebook/**/*.{css|js|svg|jpg|png}`
        ,epub: `${pluginPath}/ebook/**/*.{css|js|svg|jpg|png}`
        ,html: `${pluginPath}/book/**/*.{css|js|svg|jpg|png}`
    }
}