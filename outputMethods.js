'use strict'

var _ = require('lodash')
var JSON5 = require('json5-utils')

const FRAMERATE = 30;

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
  var seconds = Math.floor(keyframe / FRAMERATE);
  var frames = keyframe % FRAMERATE;
  return `${seconds}:${frames}`;
}

function parseTime(rawTime){
	var fullframes = Math.floor(rawTime*FRAMERATE);			
	var seconds = Math.floor(fullframes / FRAMERATE);
	var frames = Math.floor(fullframes % FRAMERATE);
	return {
		seconds:seconds, 
		frames:frames, 
		fullframes:fullframes, 
		str: String(seconds)  + ':' + String(frames)
	}
}

var DEFAULTS = {
  rotation:0,
  alpha:1,
  regX:0, regY:0,
  x:0, y:0,
  scaleX:1, scaleY:1,
}

function clearUnusedParams(keys) {
		
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
function cjs(sceneJSON){
	console.log(sceneJSON);
	
	var str = '';
	var layers = sceneJSON.layers;
	
	for (var i=0, len = layers.length; i<len; i++){
		var layer = _tr2(layers[i]);
		var name = layer.name;
		var index = layer.index;
		var keys = layer.keys;
		var prevKey = keys[0].key;
		var clearedParams = clearUnusedParams(keys);
		
		

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


function getInitPropsParams(initProps, exeptProps){
	// console.log(initProps)
	var props = {};
	
	_.forIn(initProps, function(value, key){
		// console.log(value)
		if(exeptProps.indexOf(key) === -1){
			_.extend(props, value)
		}
	})
	
	return props;
}

function parseKeysGroup(group, groupName){
	
}

function getKeys(keys){
	var json = {'keys': []}
	
	_.forIn(keys, function(keyGroup, key){
		console.log(key)
		
		var prevKeyTime = 0;
		keyGroup.forEach(function(keyFrame){
			var keyFrameValue = keyFrame.value;
			var interp = keyFrame.interpolation;
			var keyTime = keyFrame.key;
			var keyTimeStr = keyFrame.keyStr;
			
			var interpType = '';
			if(interp){
				interpType = interp['in'].influence ? ', createjs.Ease.sineOut' : '';
			}
			
			// json.keys.push([JSON5.stringify(keyFrameValue, '', ''), keyTime - prevKeyTime])
			json.keys.push(`to(${JSON5.stringify(keyFrameValue, '', ' ')}, ${keyTime - prevKeyTime}${interpType}) // ${keyTime} ${keyTimeStr}`)
		})
		
		// parseKeysGroup(value, key)
	})
	
	return json;
}

function getGroupString(group, groupName){
	var str = '';
	var json = {
		positions: [], regX: 0, regY: 0,
		keys:[],
	};
	var layers = group.layers
	var firstLayer = layers[0].layer
	var name = group.name
	var index = group.index
	
	json.regX = firstLayer.initProps.reg.regX;
	json.regY = firstLayer.initProps.reg.regY;
	if(firstLayer.blendMode === 'SCREEN' | 'ADD' | 'LIGHTEN'){
		json.compositeOperation = 'lighter';
	}
	
	for (var i=0, len=layers.length; i<len; i++){
		var layer = layers[i]
		// console.log(layer);
		json.positions.push(getInitPropsParams(layer.layer.initProps, ['reg']));
		
		var keys = layer.layer.keys;
		var cjsKeys = getKeys(keys)
		json.keys.push(cjsKeys);
	}
	
	return JSON.stringify(json, null, '  ');
}

// output like createjs animation definition.
function cjsAdv(sceneJSON){
	var str = ''
	var layers = sceneJSON.layers
	
	var groups = {}
	for (var j=0, len=layers.length; j<len; j++){
		var layer = layers[j]
		var name = layer.name
		var index = layer.index
		
		if(!groups[name]){
			groups[name] = {
				layers:[]
			}
		}
		groups[name].layers.push({index:index, name:name, layer:layer})
	}
	
	// console.log(groups)
	
	_.forIn(groups, function(value, key){
		str += getGroupString(groups[key], key)
	})
	
	return str;
	
	for (var i=0, len=layers.length; i<len; i++){
		
		
		
		continue;
		var layer = _tr2(layers[i]);
		var name = layer.name;
		var index = layer.index;
		var effectsExist = layer.effectsExist;
		var keys = layer.keys;
		var prevKey = keys[0].key;
		var clearedParams = clearUnusedParams(keys);

		str += effectsExist ? 'WARNING! layer exists effects\n' : '';
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

// legacy
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
module.exports.cjsAdv = cjsAdv;
module.exports.coinsTrail = coinsTrail;
module.exports.coinsTrail2 = coinsTrail2;
