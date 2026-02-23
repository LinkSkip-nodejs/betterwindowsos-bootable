console.log("process.type:", process.type);
console.log("electronBinding:", typeof process.electronBinding);
console.log("_linkedBinding:", typeof process._linkedBinding);

const Module = require('module');
console.log("builtinModules includes electron:", Module.builtinModules.includes('electron'));
console.log("builtinModules:", Module.builtinModules.filter(m => m.includes('electron')));

process.exit(0);
