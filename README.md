
<h2> To compile `.scss` => `.css` </h2>

`compact-web scss [OPTION] `

options :  
`--output-style` : set the output-style. ex : compressed  
`--nowatch` : add this option if act as one time running (nowatch).
`--src-dir [DIR]` : set the source directory to be watched.  
`--out-dir [DIR]` : set the output destination directory.  

example :  
    1. `compact-web scss --output-style compressed --nowatch --src-dir ./src/css --out-dir ./resources/css`  
    2. `compact-web scss --output-style="compressed" --src-dir="./src/css" --out-dir="./resources/css"`  


<h2> To compile `.js` </h2>  

`compact-web js [OPTION] `

options :  
`--babel` : enable babel compiling. Transform from es6 -> es5).  
`--uglifyjs` : enable uglifyjs compiling. uglify & minify.  
`--obfuscatejs` : enable obfuscatejs compiling. Encrypt the javascript file with JS-Obfuscator.  
`--nowatch` : add this option if act as one time running (nowatch).  
`--src-dir [DIR]` : set the source directory to be watched.  
`--out-dir [DIR]` : set the output destination directory.  

example :  
    1. `compact-web js --babel --uglifyjs --obfuscatejs --src-dir .\src\js --out-dir .\resources\js`  
    2. `compact-web js --babel --uglifyjs --obfuscatejs --src-dir .\src\js --out-dir .\resources\js --nowatch"`  
    2. `compact-web js --babel --src-dir .\src\js --out-dir .\resources\js --nowatch"`  