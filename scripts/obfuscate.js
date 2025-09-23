// // scripts/obfuscate.js
// const JavaScriptObfuscator = require('javascript-obfuscator');
// const fs = require('fs');
// const path = require('path');

// const buildDir = './dist'; // or ./build for CRA

// function obfuscateFiles(dir) {
//   fs.readdirSync(dir).forEach(file => {
//     const filePath = path.join(dir, file);
//     if (fs.statSync(filePath).isDirectory()) {
//       obfuscateFiles(filePath);
//     } else if (file.endsWith('.js') && !file.includes('.min.')) {
//       const code = fs.readFileSync(filePath, 'utf8');
//       const obfuscated = JavaScriptObfuscator.obfuscate(code, {
//         compact: true,
//         controlFlowFlattening: true,
//         deadCodeInjection: true,
//         stringArray: true,
//         stringArrayEncoding: ['base64'],
//         transformObjectKeys: true,
//         unicodeEscapeSequence: false
//       });
//       fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
//     }
//   });
// }

// obfuscateFiles(buildDir);