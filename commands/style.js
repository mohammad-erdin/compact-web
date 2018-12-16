const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const mkdirp = require("mkdirp");
const postcss = require('postcss');
const chokidar = require("chokidar");
const nodesass = require('node-sass');
const exists = require("package-exists");

// var listMangle = {},
// 	lastMangleCounter = 0;

exports.command = 'style <source> <target> [option]'
exports.describe = 'compact stylesheet file'
exports.builder = function (yargs) {
	yargs
		.scriptName(require('../package.json').name)
		.wrap(120)
		.usage(`Usage: $0 style <source> <target> [option] `)
		.option("cwd", { default: "", desc: "change current directory for <source> base dir" })
		.option("outputstyle", {
			alias: 'o',
			default: "compressed",
			desc: "output-style for node-sass",
			choices: ['nested', 'compact', 'expanded', 'compressed']
		})
		.option("use", {
			alias: 'u',
			array: true,
			desc: "array set of PostCSS Plugins to be apllied. \n" +
				"Ex: --use autoprefix cssnano\n " +
				"Ex: --use autoprefix --use cssnano\n " +
				"see https://github.com/postcss/postcss/blob/master/docs/plugins.md#packs\n" +
				"WARNING :: if you use any postcss plugins, YOU MUST add that dependencies manually to your project dir.\n" +
				"Ex: npm install autoprefix cssnano\n "
		})
		.option("suffix", { alias: 's', default: '', desc: "string to be added as suffix" })
		.option("watch", { alias: 'w', default: true, desc: "act as watcher. use --no--watch for disabling watcher" })
	return yargs;
}
exports.handler = async function (argv) {

	//if using --use, check if that package is exists 
	let plugins = [];
	if (argv.use && argv.use.length) {

		argv.use.forEach(pl => {
			plugins.push(require(pl));
			if (!exists.npmexists(pl))
				throw `Package ${pl} doesn't exists. Please add them manually 'npm install ${pl}' or yarn add ${pl}`;

		});
	}


	let watcher = new chokidar.watch(argv.source, {
		ignored: /(^|[\/\\])\../,
		cwd: argv.cwd,
	}).on("all", function (event, filename) {
		if (filename.startsWith("_"))
			return false;

		let parse = path.parse(filename),
			dest = path.join(argv.target, path.dirname(filename), parse.name + argv.suffix + ".css"),
			src = path.join(argv.cwd, filename);

		mkdirp.sync(path.dirname(dest));
		if (fs.existsSync(dest))
			fs.unlinkSync(dest);

		let count = 10, finalCode = "";
		while (finalCode == "" && count > 0) {
			finalCode = nodesass.renderSync({
				file: src,
				dest: dest,
				includePaths: [argv.cwd],
				indentType: "space",
				indentWidth: 2,
				linefeed: "lf",
				outputStyle: argv.outputstyle
			}).css.toString();
			count--;
		}

		if (finalCode.length > 0 && plugins.length) {
			postcss(plugins)
				.process(finalCode, {
					from: dest,
					to: dest
				})
				.then(result => {
					fs.writeFileSync(dest, result.css, function (err) {
						if (err) log(filename + ' ' + err.toString(), "red");
					});
					if (fs.existsSync(dest)) log(`compiling ${event} file from ${src} to ${dest}`, "green");
					else log('can\'t compile ' + filename, "red");

					//TODO: add option to enable .map
					// if (result.map) {
					// 	fs.writeFile('dest/app.css.map', result.map, () => true)
					// }
				})
		} else {
			fs.writeFileSync(dest, finalCode, function (err) {
				if (err) log(filename + ' ' + err.toString(), "red");
			});
			if (fs.existsSync(dest)) log(`compiling ${event} file from ${src} to ${dest}`, "green");
			else log('can\'t compile ' + filename, "red");
		}

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