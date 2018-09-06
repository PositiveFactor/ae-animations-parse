'use strict';

const output = require('./outputMethods');
require('./polyfills');

// ae middleware ...
const fs = require('fs');
const path = require('path');
const ae = require('after-effects');
ae.options.includes = [
  './node_modules/after-effects/lib/includes/console.jsx',
  './node_modules/after-effects/lib/includes/es5-shim.jsx',
  './node_modules/after-effects/lib/includes/get.jsx',
  // './includes/standard.jsx'
];
ae.options.program = path.join('c:/Program Files/Adobe','Adobe After Effects CC 2018');
ae.options.errorHandling = true;
// ...

// cli interface dependencies ...
const program = require('commander');
const Promise = require('promise');
// ...

// user ae scripts ...
const aeGetLayersTransform = require('./ae/aeGetLayersTransform');
const aeParseAdvance = require('./ae/aeParseAdvance');
const aeGetCoinsDef = require('./ae/aeGetCoinsDef');
const aeGetFallingCoinsDef = require('./ae/aeGetFallingCoinsDef');
const aeParseFramedLayer = require('./ae/aeParseFramedLayer');
//  ...

const baseFolder = 'parsed';

function writeFile(filename, data){
  var filepath = path.join(baseFolder, filename);
	fs.writeFile(filepath, data, function(err) {
		if(err) {
			return console.log(`error while write "${filepath}":\n${err}`);
		}
		else{
			console.log(`writed "${filepath}"`);
		}
	});
}

function getLen(){
  var func = require('./ae/aeGetSceneLength');
  var len = ae(func);
  return len;
}

function pp(layerIndex, isFramed){
	var mycommand = new ae.Command(aeParseFramedLayer);
	var res = ae.executeSync(mycommand, layerIndex, isFramed === 'true');
	console.log(output.cjsLayer(res));
}

function parse(filename){
	var aeJSON = ae.executeSync(aeGetLayersTransform);

	var filename = filename || 'default';
	var filenameJSON = filename + '.json';
	writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

	filename = filename + '.anim';
	writeFile(filename, output.cjs(aeJSON));
}

function parse2(filename){
	var aeJSON = ae.executeSync(aeParseAdvance);

	var filename = filename || 'default';
	var filenameJSON = filename + '.json';
	writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

	// filename = filename + '.anim';
	// writeFile(filename, output.cjs(aeJSON));
}

function getMultDef(filename){
	var file = fs.readFileSync(path.join('parsed', filename + '.json'));
	
	var json = JSON.parse(file);
	
	filename = filename + '.anim';
	writeFile(filename, output.cjsAdv(json));
}

function parseFallingCoins(){
	var json = ae(aeGetFallingCoinsDef);
	var str = '';
	for (var i=0;i<json.length;i++){
		str += JSON.stringify(json[i]);
		str += ',\n';
	}

	var filename = 'falling_coins.anim';
    var data = str;
	writeFile(filename, data);
}

function parseCoins(filename){
	var aeJSON = ae(aeGetCoinsDef);
  var fnameJSON = `coins_def/${filename}.json`;
  var fname = `coins_def/${filename}.anim`;

  writeFile(fnameJSON, JSON.stringify(aeJSON, null, '  '));
	writeFile(fname, output.coinsTrail(aeJSON));
}


program
  .version('0.0.1')

program
  .command('parse [filename]')
  .alias('p')
  .description('parse opened ae file to ".anim" file.')
  .action(parse)
  
program
  .command('pp [layerIndex] [isFramed]')
  .description('parse opened ae file to ".anim" file.')
  .action(pp)
  
program
  .command('parse2 [filename]')
  .alias('p')
  .description('parse opened ae file to ".anim" file. EXPERIMENTAL')
  .action(parse2)

program
  .command('mult [filename]')
  .alias('p')
  .description('create ".anim" file from ".json". EXPERIMENTAL')
  .action(getMultDef)  

program
  .command('len')
  .description('get scene len in seconds.')
  .action(getLen)

program
.command('coins [filename]')
.alias('c')
.description('parse coins bezier paths.')
.action(parseCoins)

program
.command('fallingcoin')
.alias('fc')
.description('parse falling coins.')
.action(parseFallingCoins)

program.parse(process.argv);
