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
		cwd: argv.cwd,
	}).on("all", function (event, filename) {
		let parse = path.parse(filename),
			dest = path.join(argv.target, path.dirname(filename), parse.name + argv.suffix + parse.ext),
			src = path.join(argv.cwd, filename),
			code = fs.readFileSync(src, "utf-8");

		try {
			mkdirp.sync(path.dirname(dest));
			if (fs.existsSync(dest))
				fs.unlinkSync(dest);

			if (argv.babel) {
				code = babel.transformSync(code, {
					"presets": ["@babel/preset-env"],
					"plugins": ["@babel/plugin-proposal-object-rest-spread"]
				}).code;
			}
			if (argv.uglify) {
				if (typeof listMangle[parse.name] == "undefined") {
					listMangle[parse.name] = lastMangleCounter++;
				}
				let count = 10, finalCode = "";
				while (finalCode == "" && count > 0) {
					finalCode = uglifyJS.minify({ filename: code }).code;
					count--;
				}
				code = finalCode;
			}

			if (argv.obfuscate) {
				let count = 10, finalCode = "";
				while (finalCode == "" && count > 0) {
					finalCode = JSO.obfuscate(code, {
						compact: true,
						controlFlowFlattening: true,
						identifierNamesGenerator: 'mangled',
						identifiersPrefix: '_' + listMangle[parse.name].toString(36),
					}).getObfuscatedCode();
					count--;
				}
				code = finalCode;
			}
			fs.writeFileSync(dest, code, function (err) {
				if (err) log(filename + ' ' + err.toString(), "red");
			});
		} catch (error) {
			log('can\'t compile ' + filename + '. ' + error.message, "red");
		}
		if (fs.existsSync(dest)) log(`compiling ${event} file from ${src} to ${dest}`, "green");
		else log('can\'t compile ' + filename, "red");

	}).on("ready", () => {
		if (!argv.watch) watcher.close();
	});
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