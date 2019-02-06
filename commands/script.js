const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const babel = require("@babel/core");
const mkdirp = require("mkdirp");
const uglifyJS = require("uglify-es");
const chokidar = require("chokidar");
const JSO = require("javascript-obfuscator");

var listMangle = {},
	lastMangleCounter = 0;

exports.command = 'script <source> <target> [option]'
exports.describe = 'compact javascript file'
exports.builder = function (yargs) {
	yargs
		.scriptName(require('../package.json').name)
		.usage(`Usage: $0 script <source> <target> [option] `)
		.option("cwd", { default: "", desc: "change current directory for <source> base dir" })
		.option("suffix", { alias: 's', default: '.min', desc: "string to be added as suffix" })
		.option("babel", { alias: 'b', default: false, desc: "using @babel/core" })
		.option("uglify", { alias: 'u', default: false, desc: "using uglify-js" })
		.option("obfuscate", { alias: 'o', default: false, desc: "using javascript obfuscator" })
		.option("watch", { alias: 'w', default: true, desc: "act as watcher. use --no--watch for disabling watcher" })
	return yargs;
}
exports.handler = async function (argv) {
	let watcher = new chokidar.watch(argv.source, {
		ignored: /(^|[\/\\])\../,
		persistent: argv.watch,
		cwd: argv.cwd,
	}).on("all", function (event, filename) {
		let parse = path.parse(filename),
			dest = path.join(argv.target, path.dirname(filename), parse.name + argv.suffix + parse.ext),
			src = path.join(argv.cwd, filename);

		fs.copyFile(src, dest, function () {
			try {
				if (argv.babel) {
					fs.writeFileSync(dest, babel.transformFileSync(dest, {
						"presets": ["@babel/preset-env"],
						"plugins": ["@babel/plugin-proposal-object-rest-spread"]
					}).code);
				}
				if (argv.uglify) {
					if (typeof listMangle[parse.name] == "undefined") {
						listMangle[parse.name] = lastMangleCounter++;
					}
					let count = 10, finalCode = "";
					do {
						finalCode = uglifyJS.minify({ filename: '' + fs.readFileSync(dest, 'utf-8').replace(/ +/g, " ") }).code;
						count--;
					} while (finalCode == "" && count > 0);
					fs.writeFileSync(dest, finalCode);
				}
				if (argv.obfuscate) {
					let count = 10, finalCode = "";
					do {
						finalCode = JSO.obfuscate(fs.readFileSync(dest, 'utf-8').replace(/ +/g, " "), {
							compact: true,
							controlFlowFlattening: true,
							identifierNamesGenerator: 'mangled',
							identifiersPrefix: '_' + parse.name.substr(0, 3) + listMangle[parse.name].toString(36),
						}).getObfuscatedCode();
						count--;
					} while (finalCode == "" && count > 0);
					fs.writeFileSync(dest, finalCode);
				}
			} catch (error) {
				log('can\'t compile ' + filename + '. ' + error.message, "red");
			} finally {
				if (fs.existsSync(dest)) log(`compiling ${event} file from ${src} to ${dest}`, "green");
				else log('can\'t compile ' + filename, "red");
			}
		});

	})
}


function log(...styles) {
	let s = "", c = chalk, dt = new Date();
	styles.forEach((cmd, idx) => {
		if (idx == 0) s = cmd;
		else c = c[cmd];
	});
	console.info(c(dt.getHours() + ':' +
		('0' + (dt.getMinutes() + 1)).slice(-2) + ':' +
		('0' + dt.getSeconds()).slice(-2) + " => " + s));
}