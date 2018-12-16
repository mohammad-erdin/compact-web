#!/usr/bin/env node
var path = require('path')
var argv = require('yargs')
    .scriptName("")
    .commandDir('commands')
    .demandCommand()
    .wrap(90)
    .help('h')
    .alias('h', 'help')
    .coerce('target', path.resolve)
    .alias('v', 'version')

if (argv.getCommandInstance().getCommands().indexOf(argv.argv._[0]) < 0) {
    argv.showHelp();
}