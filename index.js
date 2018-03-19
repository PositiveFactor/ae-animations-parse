'use strict';

require('./polyfills');

const aeToJSON = require('ae-to-json/after-effects');
const fs = require('fs');
const path = require('path');
const ae = require('after-effects');
ae.options.includes = [
  './node_modules/after-effects/lib/includes/console.jsx',
  './node_modules/after-effects/lib/includes/es5-shim.jsx',
  './node_modules/after-effects/lib/includes/get.jsx'
];

// cli interface dependencies ...
const program = require('commander');
const inquirer = require('inquirer'); // require inquirerjs library
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
const fuzzy = require('fuzzy');
const Promise = require('promise');
// ...

// user scripts ...
const aeGetLayersTransform = require('./ae/aeGetLayersTransform');
const aeGetCoinsDef = require('./ae/aeGetCoinsDef');
const aeGetFallingCoinsDef = require('./ae/aeGetFallingCoinsDef');
const aeGetLayerDef = require('./ae/aeGetLayerDef');
//  ...

const output = require('./outputMethods');

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
  // func = func.bind(this, 'abc', 123);
  var len = ae(func);
  return len;
}

function layerInfo(layerId){
  var func = require('./ae/aeGetLayerInfo');
  var json = ae(func);
}

function parse(filename){
	var aeJSON = ae(aeGetLayersTransform);

	var filename = filename || 'default';
	var filenameJSON = filename + '.json';
	writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

  filename = filename + '.anim';
	writeFile(filename, output.cjs(aeJSON));
}

var layersList = [];

function searchLayers(answers, input) {
  input = input || '';
  return new Promise(function(resolve) {
    setTimeout(function() {
		console.log(layersList);
      var fuzzyResult = fuzzy.filter(input, layersList);
      resolve(fuzzyResult.map(function(el) {
        return el.original;
      }));
    }, _.random(30, 500));
  });
}



const GAME_ASK = {
  type: 'autocomplete',
  name: 'layer',
  message: 'Select layer:',
  source: searchLayers,
  pageSize: 10,
}


function ask(questions, cb){
  inquirer.prompt(questions)
	.then((answers)=>{
    cb(answers);
	});
}

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

function parseCoins(){
	var json = ae(aeGetCoinsDef);

	str = '';
	for (var i=0;i<json.length;i++){
		str += JSON.stringify(json[i]);
		str += ',\n';
	}

	//str += JSON.stringify(json);

	//str = str + '\n';
	var filename = 'coins.anim';
    var data = str;

	writeFile(filename, data);

	return;

    var filename = 'coins.anim';
    var str = '';
    var layers = json;
	//str += '[	//   0    |  1   |   2   |   3   |  4  |  5  |  6  |  7  |   8    |   9    |    10     |     11     |      12      |      13'
	//str += '    // DELAY  | TIME | initX | initY | B1X | B1Y | B2X | B2Y | finalX | finalY | initScale | finalScale | initRotation | targetRotation'

	//str += '    [    0    ,  30  ,  881  ,  556  , 1094, 158 , 1604, 354 ,  1766  ,  1131  ,   0.6     ,   0.6      ,      29      ,      53 		], // 0'

	var TITLES = ["DELAY", "TIME", "initX", "initY", "B1X", "B1Y", "B2X", "B2Y", "finalX", "finalY", "initScale", "finalScale", "initRotation", "targetRotation"];
	var INDEXES = [];
	var W = 20;


	for (var t=0;t<TITLES.length;t++){
		var numFill = W - TITLES[t].length;
		var startFill = Math.floor(numFill/2);
		var endFill = numFill - startFill;
		TITLES[t] = TITLES[t].padStart(startFill);
		TITLES[t] = TITLES[t].padEnd(endFill);

		var index = (t).toString();
		numFill = W - index.length;
		startFill = Math.floor(numFill/2);
		endFill = numFill - startFill;
		index = index.padStart(startFill);
		index = index.padEnd(endFill);
		INDEXES[t] = index;
	}

	str += INDEXES.join('|');
	str += '\n';
	str += TITLES.join('|');
	str += '\n';

	console.log(str);
	return;

	var s = '';
	for (var r=0;r<json.length;r++){
		for (var t=0;t<TITLES.length;t++){
			var index = (t+1).toString();
			numFill = W - index.length;
			startFill = Math.floor(numFill/2);
			endFill = numFill - startFill;
			index = index.padStart(startFill);
			index = index.padEnd(endFill);
			INDEXES[t] = index;
		}
	}

	/*
    for (var i=0;i<json.length;i++){
        var name = json[i].name;
        var keys = json[i].keys;
        var oldKeys = json.layers[i].keys;
        str = str + (i+1) + ' ' + name + '\n';
        //str = str  + "createjs.Tween.get( this._fContainer_cjc, {useTicks:true})\n";



        var absKey = 0;
        for(var j=0;j<keys.length;j++) {
            var isLastKey = j===keys.length-1;
            str = str + '\t .to(' + JSON.stringify(keys[j][0]) + ', ' + keys[j][1]*2 + ')' + '\t// ' + absKey*2 + (isLastKey ? '' : '\n');
            absKey += keys[j][1];
        }
        str = str + '\n\n';
    }
	*/

    str = str + '\n';
    var data = str;

	writeFile(filename, data);
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
.command('coin')
.alias('c')
.description('parse coins bezier paths.')
.action(parseCoins)

program
.command('fallingcoin')
.alias('fc')
.description('parse falling coins.')
.action(parseFallingCoins)


aeGetFallingCoinsDef

program
.command('layerparse')
.description('get keys for concrete layer with procedure animation(wiggle etc.).')
.action(layerParse)

program
.command('layer')
.alias('l')
.description('pass')
.action(layerInfo)

program.parse(process.argv);
