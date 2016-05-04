#!/usr/bin/env node

"use strict"
let exec = require('promised-exec')
let minimist = require('minimist')
let path = require('path')
let bs = require('browser-sync').create()
let initServer = require('bluebird').promisify(bs.init)
let watch = require('glob-watcher')

buildApostila()
	.then(apostila => apostila.type === 'html' && initServer({server: apostila.path}))
	.then(() => {
		watch('**/*.{html,css,js}', (event)=>{
			bs.notify(`Buildando apostila`, 5000)
			return buildApostila().then(apostila => apostila.type === 'html' && bs.reload())
		})
	})

function buildApostila(){
	let options = minimist(process.argv.slice(2), {
	   string: ['apostila','type']
		,default: {
			type: 'html'
		}
	});

	return 	exec('npm install -g ./')
						.then(()=>{
							console.log(`[watch] init ${options.type} build`)
							return exec(`cd ${options.apostila}/ && tubaina2 --native --${options.type}`)
						})
						.then((out)=>{
							console.log(out)
							console.log(`[watch] finished ${options.type} build`)
							return {code: path.basename(options.apostila), path: path.join(options.apostila, '.build/_book'), type: options.type}
						})
}
