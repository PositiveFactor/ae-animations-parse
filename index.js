
// ae middleware ...
const fs = require('fs');
const path = require('path');
// не стоит вызывать как ae(cmd), лучше ae.executeSync(cmd),
// пусть будет все синхронным тк дебажить это месиво близко к невозможному
const ae = require('after-effects');

const program = require('commander');

ae.options.program = path.join('C:/Program Files/Adobe','Adobe After Effects 2022');
ae.options.errorHandling = true;
ae.options.includes = [
  path.join(__dirname, './node_modules/after-effects/lib/includes/console.jsx'),
  path.join(__dirname, './node_modules/after-effects/lib/includes/es5-shim.jsx'),
  path.join(__dirname, './node_modules/after-effects/lib/includes/get.jsx'),
  path.join(__dirname, './includes/utils.jsx')
];

// ...

const output = require('./outputMethods/outputMethods');

// user ae scripts ...
const aeGetLayers = require('./ae/aeGetLayers');
const aeGetLayersTransform = require('./ae/aeGetLayersTransform');
const aeParseAdvance = require('./ae/aeParseAdvance');
const aeParseFramedLayer = require('./ae/aeParseFramedLayer');
const aeParseTweens = require('./ae/aeParseTweens');
const aeGetKeysForLayer = require('./ae/aeGetKeysForLayer');
const convertToBezier = require('./ae/convertToBezier');
//  ...

function writeFile(filePath, data){
	fs.writeFile(filePath, data, function(err) {
		if(err) {
			return console.log(`error while write "${filePath}":\n${err}`);
		}
		else{
			console.log(`writed "${filePath}"`);
		}
	});
}

function getLen(){
  var func = require('./ae/aeGetSceneLength');
  var len = ae.executeSync(func);
  return len;
}

function exp(layerIndex){
  var aeCommand = new ae.Command(convertToBezier);
  var res = ae.executeSync(aeCommand);
  console.log('res', res);
}

function serial(layerIndex, delay){
  if(layerIndex === undefined){
    console.log('param layerIndex is needed');
    return;
  }

  var aeLayers = ae.executeSync(aeGetLayers);
  if(layerIndex > aeLayers.length || layerIndex <= 0)
  {
    console.log('param layerIndex is wrong. Note: layerindex starts with "1"');
    console.log('layers num: ' + aeLayers.length);
    return;
  }

  var options = getOptions();
  var res = ae.executeSync(new ae.Command(aeParseFramedLayer), layerIndex, options);

  console.log('Initial values:');
  console.log(res.initial);

  var resJSON = output.serial(res, options.props, delay, options.excludeProps, options.z);
  console.log(resJSON);
}

function arrayProp(layerIndex, propName){
  if(layerIndex === undefined){
    console.log('param layerIndex is needed');
    return;
  }

  var options = getOptions();
  var aeLayers = ae.executeSync(aeGetLayers);
  var parseFramedLayerCommand = new ae.Command(aeParseFramedLayer);

  if(layerIndex > aeLayers.length || layerIndex <= 0)
  {
    console.log('param layerIndex is wrong. Note: layerindex starts with "1"');
    console.log('layers num: ' + aeLayers.length);
    return;
  }

  var layerName = aeLayers[layerIndex-1].name;
  var res = ae.executeSync(parseFramedLayerCommand, layerIndex, options);

  var arrayProp = output.arrayProp(res, propName);
  console.log(arrayProp);
}

function tween(layerIndex){
  if(layerIndex === undefined){
    console.log('param layerIndex is needed');
    return;
  }

  console.log('layerIndex', layerIndex);

  var options = getOptions();
  var aeLayers = ae.executeSync(aeGetLayers);

  if(layerIndex > aeLayers.length || layerIndex <= 0)
  {
    console.log('param layerIndex is wrong. Note: layerindex starts with "1"');
    console.log('layers num: ' + aeLayers.length);
    return;
  }

  var layerName = aeLayers[layerIndex-1].name;
  var res = ae.executeSync(new ae.Command(aeGetKeysForLayer), layerIndex, false, options);
  console.log(JSON.stringify(res, null, '\t'));




}

/*
!!bezier test

var aeToBezierCommand = new ae.Command(convertToBezier);
var resBesier = ae.executeSync(aeToBezierCommand, 4, 11);
// console.log(JSON.stringify(resBesier, null, '\t'));
console.log(resBesier)

var bezier = require('./bezier/bezier');
var easing = bezier(resBesier[0], resBesier[1], resBesier[2], resBesier[3]);

var frames = 17;
var oneFrame = 1/30;

var delta = 100 - 0;
// var start

// var resJSON = output.serial(res, options.props);
// console.log(resJSON);
*/

function parseUE(filename, layerIndex){
	var toParse = {};
  var options = getOptions();

  var parseFramedLayerCommand = new ae.Command(aeParseFramedLayer);
  var aeJSON = ae.executeSync(aeGetLayersTransform);

  var filename = filename || 'default';
  var filenameJSON = filename + '.json';
  writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

  if(aeJSON && aeJSON.layers && aeJSON.layers.length){
    var layersArr = aeJSON.layers;
    var layersNum =  layersArr.length;
    console.log('layersNum', layersNum);
		for (var i = 0; i < layersNum; i++) {
			let layerIndex = layersArr[i].index;
      console.log('layerIndex', layerIndex);
			var res = ae.executeSync(parseFramedLayerCommand, layerIndex, true, options);
			toParse[layerIndex] = res;
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
}

function getComposition(){
  var aeLayers = ae.executeSync(aeGetLayers); // [{index, name}, {index, name}, ...]
  // console.log('aeLayers', aeLayers);

  // var aeJSON = ae.executeSync(aeGetLayersTransform);
  // var cwd = process.argv;
  var cwd = __dirname;
  var parseFramedLayerCommand = new ae.Command(aeParseFramedLayer);
  //
  // var filename = 'default';
	// var filenameJSON = path.join(cwd, filename + '.json');
	// writeFile(filenameJSON, JSON.stringify(aeLayers, null, '  '));
  // var layerIndex = 7;
  // var res = ae.executeSync(parseFramedLayerCommand, layerIndex);
  // console.log('res', res);
  // var resJSON = output.serial(res);
  // console.log('resJSON', resJSON);

  var out = '';

  aeLayers.forEach(function(item){
    out += item.index + ' ' + item.name + '\n';

    var res = ae.executeSync(parseFramedLayerCommand, item.index);
    out += JSON.stringify(res.initial, null, '  ') + '\n';

    // var resJSON = output.bigserial(res);
    // out += resJSON + '\n\n';
  })


  var filename = 'default';
	var filenameJSON = path.join(cwd, filename + '.json');
	writeFile(filenameJSON, out);


}

function getOptions(){
  var options = {};
    if(program.scaleMult) {
        options.scaleMult = program.scaleMult;
    }

  if(program.positionKoefficient) {
        options.positionKoefficient = program.positionKoefficient;
    }

  if(program.framerate) {
        options.framerate = program.framerate;
    }

  if(program.framed) {
        options.framed = program.framed;
    }

  if(program.props) {
        options.props = program.props.split(',').map(function(item){
      return item.trim();
    });
    }
  else{
    options.props = [];
  }

  if(program.excludeProps) {
        options.excludeProps = program.excludeProps.split(',').map(function(item){
      return item.trim();
    });
    }
  else{
    options.excludeProps = [];
  }

  if(program.uncomp) {
        options.uncomp = program.uncomp;
    }

  if(program.full) {
        options.full = program.full;
    }

  return options;
}

program
.version('0.0.3')
.option('-s, --scale-mult [value]', 'scale mult')
.option('-r, --relative-positions', 'relative positions')
.option('--framerate', 'framerate')
.option('-p, --position-coefficient [value]', 'relative positions') // default 1; for old games 1780/1920(0.927083333)
.option('-f, --framed', 'output frames instead keys info')
.option('--props [value]', 'output only chosen props. Props separate by comma.')
.option('--exclude-props [value]', 'ignore props in input. Props separate by comma. ex: "x,y,sx,sy" ')
.option('-u, --uncomp', 'uncomputed values. Values will be not computed if has expression')
.option('--full', 'output frames for full layer without ranges compute')


program
.command('parseue [filename] [layerIndex]')
.alias('pue')
.description('parseUE opened ae file to ".anim" file.')
.action(parseUE)

program
.command('exp [layerIndex]')
.alias('e')
.description('nothing to see here, simple api for experimental staff')
.action(exp)

program
.command('comp')
.alias('c')
.description('json composition')
.action(getComposition)

program
.command('serial [layerIndex] [delay]')
.alias('s')
.description('print serial format anim')
.action(serial)

program
.command('prop [layerIndex] [prop]')
.description('print one prop as array')
.action(arrayProp)

program
.command('tween [layerIndex]')
.alias('t')
.description('print tween sequence anim for TimeLine class')
.action(tween)

program
.command('parse2 [filename]')
.alias('p')
.description('parse opened ae file to ".anim" file. EXPERIMENTAL')
.action(parse2)

program
.command('len')
.description('get scene len in seconds.')
.action(getLen)

program.parse(process.argv);
