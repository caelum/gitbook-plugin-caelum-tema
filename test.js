#!/usr/bin/env node
"use strict"

let args = require('minimist')(process.argv.slice(2), {
   string: ['apostila','type']
	,default: {
		type: 'pdf'
	}
})

let tubainaBuilder = require('./tubainaTestBuild')
tubainaBuilder.apostilaPath = args.apostila
tubainaBuilder.type = args.type

const bs = require('browser-sync').create()
const promisify = require('bluebird').promisify
tubainaBuilder.build()
	.then(apostila => {
		return promisify(bs.init)({
			       server: [apostila.buildPath, apostila.src.path]
			       ,rewriteRules: [{
	             match: /gitbook\/plugins\/gitbook-plugin-caelum-tema\/(.*\.css)/g,
	             replace: "$1"
		         }]
		       })
		       .then(() => apostila)
	})
	.then(apostila => {
		let watch = require('glob-watcher')
		watch(apostila.src.templatesPath, ()=>{
			bs.notify(`Rebuildando apostila`, 20000)
			return tubainaBuilder.build().then(bs.reload)
		})
		watch(apostila.src.stylesPath).on('change', path => bs.reload(path))
	})
	.catch(e => console.error(e))
