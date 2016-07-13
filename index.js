var theme = require("./theme");
var cheerio = require("cheerio")

function handleLinks(page){
    var options = this.options
    var $ = cheerio.load(page.content)
    $('a[href^="http://"], a[href^="https://"]').map(function(i, el){
        var link = $(el)
        var href = link.attr('href')
        var whitelist = ['caelum.com.br', 'casadocodigo.com.br', 'alura.com.br', 'galandra.com.br']
        var follow = whitelist
        .map(function(site){
            return href.indexOf(site) > -1 && href.indexOf('facebook.com') == -1
        })
        .reduce(function(l, bool){
            return l || bool
        })
        if(!follow){
            link.attr('rel', 'nofollow')
        } else {
            var query_string  = href.indexOf('?') > -1 ? '&' : '?'
            query_string += "utm_source=Apostila_HTML&utm_campaign=" + options.bookCode + "&utm_medium=referral"
            if(href.indexOf('#') > -1){
            href = href.replace('#', query_string + '#')
            } else {
            href += query_string
            }
            link.attr('href', href)
        }
        return link
    })

    page.content = $.html()
    
    return page
}

module.exports = {
    hooks: {
        init: function(){
            theme.setOptions.call(this);
        }
        ,'page:after': function(page){
            return handleLinks.call(this, page)
        }
    }
    , ebook: theme.ebook
    , book: theme.book
    , templates: theme.templates
}
