'use strict';

const output = require('./outputMethods');
require('./polyfills');

// ae middleware ...
const aeToJSON = require('ae-to-json/after-effects');
const fs = require('fs');
const path = require('path');
const ae = require('after-effects');
ae.options.includes = [
  './node_modules/after-effects/lib/includes/console.jsx',
  './node_modules/after-effects/lib/includes/es5-shim.jsx',
  './node_modules/after-effects/lib/includes/get.jsx'
];
// ...

// cli interface dependencies ...
const program = require('commander');
const Promise = require('promise');
// ...

// user ae scripts ...
const aeGetLayersTransform = require('./ae/aeGetLayersTransform');
const aeGetCoinsDef = require('./ae/aeGetCoinsDef');
const aeGetFallingCoinsDef = require('./ae/aeGetFallingCoinsDef');
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

function parse(filename){
	var aeJSON = ae(aeGetLayersTransform);

	var filename = filename || 'default';
	var filenameJSON = filename + '.json';
	writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

  filename = filename + '.anim';
	writeFile(filename, output.cjs(aeJSON));
}

// fucking magic. nothing to see here
function layerParse(){
	var vals = [0, 0,7, 0, 0,
	12,2,3, 0,
		0,30,0, 0,
		10,0,0,29,
		0,0,0
	]

	var keys = [5,13,16, 19, 43,
	49,55,58,64,
				89, 98, 110, 122,
				129, 134, 147, 154,
				167, 174, 180
	]
	var prevKey = 0;
	for (var g=0; g<keys.length;g++){
		var dur = keys[g]*1-prevKey;
		var val = vals[g];
		prevKey = keys[g]*1;
		console.log('[{"alpha":' + (val*0.01) + '},' + dur*2 + '],');
	}

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

program
.command('layerparse')
.description('get keys for concrete layer with procedure animation(wiggle etc.).')
.action(layerParse)

program.parse(process.argv);
