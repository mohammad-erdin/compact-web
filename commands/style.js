const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const mkdirp = require("mkdirp");
const postcss = require('postcss');
const nodesass = require('node-sass');
const exists = require("package-exists");
const Gaze = require('gaze');
const grapher = require('sass-graph');



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
	let plugins = [],
		listGaze = [];
	if (argv.use && argv.use.length) {
		argv.use.forEach(pl => {
			plugins.push(require(pl));
			if (!exists.npmexists(pl))
				throw `Package ${pl} doesn't exists. Please add them manually 'npm install ${pl}' or yarn add ${pl}`;

		});
	}

	let lookDir = path.join(argv.cwd, argv.source);
	let registerFile = function (files) {
		listGaze.forEach(g => { g.close(); });
		files.forEach(file => {
			let filename = path.relative(argv.cwd, file),
				parse = path.parse(filename),
				dest = path.join(argv.target, path.dirname(filename), parse.name + argv.suffix + ".css"),
				src = path.join(argv.cwd, filename);
			if (parse.name.startsWith("_")) {
				return false;
			} else {
				var graph = grapher.parseFile(src, {
					loadPaths: [path.join(path.resolve(argv.cwd), path.dirname(filename))],
					extensions: ['scss', 'sass', 'css'],
					follow: false,
				});

				var gaze = new Gaze();
				gaze.add(Object.keys(graph.index));
				gaze.on('all', function (event, file) {
					let me = this;
					nodesass.render({
						errorBell: false,
						follow: false,
						indentedSyntax: false,
						omitSourceMapUrl: false,
						quiet: false,
						recursive: true,
						sourceMapEmbed: false,
						sourceMapContents: false,
						sourceComments: false,
						outputStyle: argv.outputstyle,
						includePath: [path.join(path.resolve(argv.cwd), path.dirname(filename))],
						indentType: 'space',
						indentWidth: 2,
						linefeed: 'lf',
						precision: 5,
						file: src
					}, function (error, result) {
						if (!error) {
							mkdirp.sync(path.dirname(dest));
							
							fs.writeFile(dest, result.css, function (err, fd) {
								if (!err) {
									postcss(plugins)
									.process(result.css, {
										from: dest,
										to: dest
									})
									.then(result => {
										fs.writeFileSync(dest, result.css, function (err) {
											if (err) log(filename + ' ' + err.toString(), "red");
										});
										destInfo = path.join(
											path.relative(process.cwd(), argv.target),
											path.dirname(filename), parse.name + argv.suffix + ".css");
										log(`compiling ${event} file from ${src} to ${destInfo}`, "green");
									})
								} else {
									log(err, "red");
								}
							});
						} else {
							log(error.message, "red");
							setTimeout(function () {
								log('Retrying to save...', "yellow");
								me.emit('added', file);
							}, 50)
						}
					});
				})
				var watched = gaze.watched();
				watched = watched[Object.keys(watched)[0]][0];
				gaze.emit('added', watched);
				listGaze.push(gaze);
			}
		});

	}
	Gaze(lookDir, function (err, watcher) {
		this.on('added', function (filepath) {
			var watched = this.watched();
			watched = watched[Object.keys(watched)[0]];
			registerFile(watched);
		});
		this.on('deleted', function (filepath) {
			var watched = this.watched();
			watched = watched[Object.keys(watched)[0]];
			registerFile(watched);
		});
		var watched = this.watched();
		watched = watched[Object.keys(watched)[0]];
		registerFile(watched);
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