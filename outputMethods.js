'use strict'

var JSON5 = require('json5-utils')

function compareKeyframes(a, b) {
  return a.key - b.key;
}

function _tr2(jsonLayer){
  jsonLayer.keys = Object.keys(jsonLayer.keys)
    .map( function(k){ return {key:k*1, tf:jsonLayer.keys[k]} })
    .sort(compareKeyframes);
  return jsonLayer;
}

function getViewKeyframe(keyframe){
  var seconds = Math.floor(keyframe / 30);
  var frames = keyframe % 30;
  return `${seconds}:${frames}`;
}

var DEFAULTS = {
  rotation:0,
  alpha:1,
  regX:0, regY:0,
  x:0, y:0,
  scaleX:1, scaleY:1,
}

function clearUnusedParams(keys){
  var temp = JSON.parse(JSON.stringify(DEFAULTS));
  var paramNames = Object.keys(DEFAULTS);
  var unused = [];
  var used = [];
  var ret = [];

  var prevTf = JSON.parse(JSON.stringify(DEFAULTS));
  for(var j=0;j<keys.length;j++) {
    var newKey = {};
    var tf = keys[j].tf;
    for(var p=0;p<paramNames.length;p++) {
      var param = paramNames[p];
      if(tf[param] === DEFAULTS[param]){
        used.push(param);
      }
      if(tf[param] !== prevTf[param]){
        newKey[param] = tf[param];
      }
    }
    ret.push(newKey);
    prevTf = tf;
  }
  return ret;
}

function getFormatedParams(params){
  return JSON5.stringify(params, '', '');
}

// output like createjs animation definition.
function cjs(aeJSON){
  var str = '';
	var layers = aeJSON.layers;
	for (var i=0;i<aeJSON.layers.length;i++){
    var layer = _tr2(aeJSON.layers[i]);
		var name = layer.name;
    var index = layer.index;
    var effectsExist = layer.effectsExist;
		var keys = layer.keys;
		var oldKeys = layer.oldKeys;
    var prevKey = keys[0].key;
    var clearedParams = clearUnusedParams(keys);

    str += effectsExist ? 'layer exists effects\n' : '';
    str += `${index} ${name}\ncreatejs.Tween.get( this._fContainer_cjc, {useTicks:true})\n`;

    // for beautyful output
    var stringParts = [];
    var maxBaseLength = 0;
		for(var j=0;j<keys.length;j++) {
      var ending = (j===keys.length-1) ? '' : '\n';
      var paramsString = getFormatedParams(clearedParams[j]);
      var keyframe = keys[j].key;
      var duration = (keyframe-prevKey);

      var viewKeyframe = ` // ${prevKey}-${keyframe}\t(${getViewKeyframe(prevKey)}->${getViewKeyframe(keyframe)})`;
      var viewBase = paramsString === '{}' ? `\t.wait(${duration*2})` : `\t.to(${paramsString}, ${duration*2})`;

      stringParts.push([viewBase, viewKeyframe]);
      maxBaseLength = Math.max(viewBase.length, maxBaseLength);
      prevKey = keyframe;
		}

    stringParts = stringParts.map(function(it){
      return `${it[0].padEnd(maxBaseLength)}${it[1]}`;
    });
		str += stringParts.join('\n') + '\n\n';
	}
	str += '\n';

  return str;
}

function coinsTrail(aeJSON){
  var str = '';
	for (var i=0;i<aeJSON.length;i++){
    var out = aeJSON[i];
    if(out.def){
      str += `${out.layername} ${out.def},\n`;
    }
    else{



      var sp = out.layername.split(' ');
      var color = sp[0];

      if(color === 'green'){
        color = 'brown';
      }

      if(color === 'red'){
        color = 'green';
      }

      if(out.effects === true && color === 'blue'){
        color = 'red';
      }

      str += `[ ${out.delay}, ${out.time}, ${out.initX}, ${out.initY}, `;
  		str += `${out.B1X}, ${out.B1Y}, ${out.B2X}, ${out.B2Y}, `;
  		str += `${out.finalX}, ${out.finalY}, ${out.initScale}, ${out.finalScale}, `;
  		str += `${out.initRotation}, ${out.targetRotation}, ${out.finalScale}, ${out.finalScale}, "${color}" ], // ${out.layerindex} ${color}\n`;
    }
	}
  return str;
}

function coinsTrail2(){
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

    str = str + '\n';
    return str;
}


module.exports.cjs = cjs;
module.exports.coinsTrail = coinsTrail;
module.exports.coinsTrail2 = coinsTrail2;
