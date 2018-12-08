#!/usr/bin/env node
const [, , ...args] = process.argv;
const argv = require("minimist")(args);
const chokidar = require("chokidar");
const chalk = require("chalk");
const babel = require("@babel/core");
const path = require("path");
const uglifyJS = require("uglify-es");
const fs = require("fs");
const JSO = require("javascript-obfuscator");
const mkdirp = require("mkdirp");
const nodesass = require("node-sass");

var listMangle = {},
    lastMangleCounter = 0;

if (argv["src-dir"] && argv["out-dir"]) {
    let log = function (...styles) {
        let s = "", c = chalk, dt = new Date();
        // dt = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        styles.forEach((cmd, idx) => {
            if (idx == 0) s = cmd;
            else c = c[cmd];
        });
        console.info(c(dt.getHours() + ':' +
            ('0' + (dt.getMinutes() + 1)).slice(-2) + ':' +
            ('0' + dt.getSeconds()).slice(-2) + " => " + s));

    }, watcher = chokidar
        .watch("**/*." + argv._[0], {
            ignored: /(^|[\/\\])\../,
            cwd: argv["src-dir"],
            dest: argv["out-dir"],
            suffix: argv.append ? "." + argv.append : ""
        }).on("all", function (event, filename) {

            let opt = this.options,
                src = path.join(opt.cwd, filename),
                parse = path.parse(filename),
                dest = path.join(
                    opt.dest,
                    path.dirname(filename),
                    parse.name + opt.suffix + parse.ext
                ),
                code = fs.readFileSync(src, "utf-8");

            if (fs.existsSync(dest)) fs.unlinkSync(dest);

            if (parse.ext == '.js' && argv.babel) {
                code = babel.transformSync(code, {
                    "presets": ["@babel/preset-env"],
                    "plugins": ["@babel/plugin-proposal-object-rest-spread"]
                }).code;
            }

            if (parse.ext == '.js' && argv.uglifyjs) {
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

            if (parse.ext == '.js' && argv.obfuscatejs) {
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

            if (parse.ext == '.scss') {
                let count = 10, finalCode = "";
                while (finalCode == "" && count > 0) {
                    finalCode = nodesass.renderSync({
                        data: code,
                        outputStyle: argv["output-style"]
                    }).css.toString();
                    count--;
                }
                code = finalCode;
                dest = path.join(
                    opt.dest,
                    path.dirname(filename),
                    parse.name + opt.suffix + ".css"
                );
            }

            mkdirp.sync(path.dirname(dest));
            fs.writeFileSync(dest, code, function (err) {
                if (err) log(filename + ' ' + err.toString(), "red");
            });
            if (fs.existsSync(dest)) log(`compiling ${event} file from ${src} to ${dest}`, "green");
            else log('can\'t compile ' + filename, "red");
        }).on('ready', () => {
            if (argv["nowatch"]) watcher.close();
        });
} else {
    throw "Error : compact-web need 'src-dir' 'out-dir' arguments";
}
