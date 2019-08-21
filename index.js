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
ae.options.program = path.join('c:/Program Files/Adobe','Adobe After Effects CC 2019');
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
const aeGetKeysForLayer = require('./ae/aeGetKeysForLayer');
const convertToBezier = require('./ae/convertToBezier');
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

function getOptions(){
  var options = {};
	if(program.scaleMult)
	{
		options.scaleMult = program.scaleMult;
	}

  if(program.positionKoefficient)
	{
		options.positionKoefficient = program.positionKoefficient;
	}

  if(program.framerate)
	{
		options.framerate = program.framerate;
	}

  if(program.framed)
	{
		options.framed = program.framed;
	}
  return options;
}

function pp(layerIndex, isFramed){
  var options = getOptions();

	var mycommand = new ae.Command(aeParseFramedLayer);
	var res = ae.executeSync(mycommand, layerIndex, isFramed === 'true', options);
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

function exp(layerIndex){

  var aeCommand = new ae.Command(convertToBezier);

  var res = ae.executeSync(aeCommand);
  console.log('res', res);
}

function serial(layerIndex){
  if(layerIndex === undefined){
    console.log('param layerIndex is needed');
    return;
  }

  var options = getOptions();

  console.log('options', options);

  var aeCommand = new ae.Command(aeGetKeysForLayer);

  var aeJSON = ae.executeSync(aeGetLayersTransform);

  if(!(aeJSON && aeJSON.layers && aeJSON.layers.length)){
    return;
  }
  var layerName = aeJSON.layers[layerIndex].name;

  var res = ae.executeSync(aeCommand, layerIndex, false, options);
  var res = output.serial(res);
  console.log('output', res);
}

function parseUE(filename, layerIndex){
	let toParse = {};
  var options = getOptions();

  var parseFramedLayerCommand = new ae.Command(aeParseFramedLayer);
  var aeJSON = ae.executeSync(aeGetLayersTransform);

  console.log('filename, layerIndex', filename, layerIndex)

  if(layerIndex !== undefined){
    if(aeJSON && aeJSON.layers && aeJSON.layers.length){
      var layerName = aeJSON.layers[layerIndex].name;
    }
    else{
      return;
    }

    filename = filename || layerName || 'default';

    var res = ae.executeSync(parseFramedLayerCommand, layerIndex, true, options);
    toParse[layerIndex] = res;
  	writeFile(filename + '.json', output.ue(toParse));
  }
	else {
    var filename = filename || 'default';
    var filenameJSON = filename + '.json';
    writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

    if(aeJSON && aeJSON.layers && aeJSON.layers.length){
      var layersArr = aeJSON.layers;
      var layersNum =  layersArr.length;
      console.log('layersNum', layersNum);
  		for (let i = 0; i < layersNum; i++) {
  			let layerIndex = layersArr[i].index;
        console.log('layerIndex', layerIndex);
  			var res = ae.executeSync(parseFramedLayerCommand, layerIndex, true, options);
  			toParse[layerIndex] = res;
  		}
    }

    writeFile(filename + '-UE.json', JSON.stringify(toParse, '  ', '  '));
  	writeFile(filename + '-UE.anim', output.ueForEasing(toParse));
	}
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
  .option('-s, --scale-mult [value]', 'scale mult')
  .option('-r, --relative-positions', 'relative positions')
  .option('--framerate', 'framerate')
  .option('-p, --position-coefficient [value]', 'relative positions') // default 1; for old games 1780/1920(0.927083333)
  .option('-f, --framed', 'output frames instead keys info')

program
  .command('parse [filename]')
  .alias('p')
  .description('parse opened ae file to ".anim" file.')
  .action(parse)

program
  .command('parseue [filename] [layerIndex]')
  .alias('pue')
  .description('parseUE opened ae file to ".anim" file.')
  .action(parseUE)

program
  .command('exp')
  .alias('e')
  .description('nothing to see')
  .action(exp)

program
  .command('serial [layerIndex]')
  .alias('s')
  .description('print serial format anim')
  .action(serial)

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
