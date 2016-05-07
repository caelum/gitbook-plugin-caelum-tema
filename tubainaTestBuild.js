"use strict"
const path = require('path')
const exec = require('promised-exec')

module.exports = {
	apostilaPath: undefined
	,type: undefined
	,build(){
		let courseCode
		let themeSrc
		try {
			courseCode = path.basename(this.apostilaPath)
			themeSrc = path.join(
				'./theme'
				,{
					'html': 'book'
					,'pdf': 'ebook'
					,'epub': 'ebook'
					,'mobi': 'ebook'
				}[this.type]
			)
		} catch(e) {
			return Promise.reject("O tipo de apostila não existe")
		}

		return exec('npm install -g ./')
        		.then(out => console.log(out))
        		.then(()=>{
        			console.log(`[watch][STARTED] ${this.type} build`)
        			return exec(`cd ${this.apostilaPath}/ && tubaina2 --native --${this.type}`)
        		})
        		.then(out => console.log(out))
        		.then(()=>{
		        	console.log(`[watch][FINISHED] ${this.type} build`)
		        	return {
			        	src: {
				        	path: themeSrc
				        	,templatesPath: path.join(themeSrc, "templates/**/*.html")
				        	,stylesPath: path.join(themeSrc, "**/*.css")
			        	}
			        	,buildPath: path.join(this.apostilaPath, '.build/_book')
		        	}
        		})
	}
}
