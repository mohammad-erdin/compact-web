<h2>Compact-web</h2>

Compact-web is a cli package. Basic Usage : 

```
compact-web <command>

Commands:
  script <source> <target> [option]  compact javascript file
  style <source> <target> [option]   compact stylesheet file

Options:
  -h, --help     Show help             [boolean]
  -v, --version  Show version number   [boolean]
```

<h3>Commands</h3>  

* script  
* style  


<h4>script</h4>

```  
Usage: compact-web script <source> <target> [option]

Options:
  -h, --help       Show help                                                [boolean]
  --cwd            change current directory for <source> base dir           [default: ""]
  --suffix, -s     string to be added as suffix                             [default: ".min"]
  --babel, -b      using @babel/core                                        [default: false]
  --uglify, -u     using uglify-js                                          [default: false]
  --obfuscate, -o  using javascript obfuscator                              [default: false]
  --watch, -w      act as watcher. use --no--watch for disabling watcher    [default: true]
  -v, --version    Show version number                                      [boolean]
```

<h4>style</h4>

```  
Usage: compact-web style <source> <target> [option]

Options:
  -h, --help         Show help                                              [boolean]
  --cwd              change current directory for <source> base dir         [default: ""]
  --outputstyle, -o  output-style for node-sass
                     [choices: "nested", "compact", "expanded", "compressed      
                                                                            [default: "compressed"]
  --use, -u          array set of PostCSS Plugins to be apllied.
                     Ex: --use autoprefix cssnano
                     Ex: --use autoprefix --use cssnano
                     see https://github.com/postcss/postcss/blob/master/docs/plugins.md#packs
                     WARNING :: if you use any postcss plugins, YOU MUST add that dependencies manually to your project dir.
                     Ex: npm install autoprefix cssnano                     [array]
  --suffix, -s       string to be added as suffix       [default: ""]
  --watch, -w        act as watcher. use --no--watch for disabling watcher  [default: true]
  -v, --version      Show version number                                    [boolean]
```