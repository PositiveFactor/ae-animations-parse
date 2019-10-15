'use strict'

var _ = require('lodash')
var JSON5 = require('json5-utils')
var commonMethods = require('./outputCommonMethods');
var utils = require('./../utils');

const FRAMERATE = 30;

var DEFAULTS = {
  rotation:0,
  alpha:1,
  regX:0, regY:0,
  x:0, y:0,
  scaleX:1, scaleY:1,
}

function getViewKeyframe(keyframe){
  var seconds = Math.floor(keyframe / FRAMERATE);
  var frames = keyframe % FRAMERATE;
  return `${seconds}:${frames}`;
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

function getUETweenString (delay, duration, paramName, init, final) {
	let setterMethod = '';
	let getterMethod = '';

	let takeInitFromGetter = isNaN(init);
	switch(paramName){
		case 'alpha':
			setterMethod = 'i_setAlpha';
			getterMethod = 'i_getAlpha()';
		break;
		case 'rotation':
			setterMethod = 'i_setRotation';
			getterMethod = 'i_getRotation() / 180 * Math.PI';
			if(!takeInitFromGetter){
				init = (init / 180) * Math.PI;
			}
			final = (final / 180) * Math.PI;
		break;
		case 'x':
			setterMethod = 'i_setX';
			getterMethod = 'i_getX()';
		break;
		case 'y':
			setterMethod = 'i_setY';
			getterMethod = 'i_getY()';
		break;
		case 'scaleX':
			setterMethod = 'i_setScaleX';
			getterMethod = 'i_getScaleX()';
		break;
		case 'scaleY':
			setterMethod = 'i_setScaleY';
			getterMethod = 'i_getScaleY()';
		break;
		default:
			return `UNSUPPORTED PARAM NAME ${paramName}, input: ${delay}, ${duration}, ${init}, ${final}`;
	}

	init = takeInitFromGetter ? `l_udo.${getterMethod}` : init;

	if(delay == 0 && duration == 0){
		return `l_udo.${setterMethod}(${final});`;
	}

	return `l_ga.i_createNewTween(${delay} / 30, l_udo.${setterMethod}.i_toObjectMethod(this), ${duration} / 30, GAnimation.i_PACS, false, ${init}, ${final});`;
}

function ueLayer(layerDef){
	var str = '\n';

	var layer = commonMethods.translateKeys(layerDef);
	var name = layer.name;
	var index = layer.index;
	var keys = layer.keys;
	var prevKey = keys[0].key;
	var clearedParams = clearUnusedParams(keys);

	str += `${index} ${name}\n\n\nvar l_ga = new GAnimation(this.i_getStage().i_getFrameEnteringTimer());\n`;

	// for beautyful output
	var stringParts = [];
	var maxBaseLength = 0;

	var prevWait = false;

	let delay = 0;//in frames, 30 FPS-based
	let prevValues = {
	}

	for(var j=0;j<keys.length;j++) {
		var ending = (j===keys.length-1) ? '' : '\n';
		var paramsString = getFormatedParams(clearedParams[j]);

		var keyframe = keys[j].key;
		var duration = (keyframe-prevKey);

		var viewKeyframe = ` // ${prevKey}-${keyframe}\t(${getViewKeyframe(prevKey)}->${getViewKeyframe(keyframe)})`;

		var isWait = paramsString === '{}';
		var viewBase = '';
		if(isWait){
			prevWait = true;
			// viewBase = `\t.wait(${duration*2})`;
		}
		else{
			if(prevWait){
				viewBase = '\t // --- // --- \n';
				prevWait = false;
			}
			else{
				// viewKeyframe = ''
			}

			let regs = {};

			for(let k in clearedParams[j]){
				if(k == 'regX' || k == 'regY'){
					regs[k] = clearedParams[j][k];
				}else{
					str += getUETweenString(delay, duration, k, prevValues[k], clearedParams[j][k]) + '\n';
					prevValues[k] = clearedParams[j][k];
				}
			}
			if(duration == 0 && delay == 0 && !isNaN(regs.regX) && !isNaN(regs.regY)){
				str += `l_udo.i_setLocalBoundsXY(${regs.regX}, ${regs.regY});\n`;
			}

			str += '\t// ---- sequence end ----' + '\n';
			delay += duration;

			var valuePartView = `\t.to(${paramsString}, ${duration*2})`;
			viewBase += valuePartView;

			stringParts.push([viewBase, viewKeyframe]);
			maxBaseLength = Math.max(valuePartView.length, maxBaseLength);

		}

		prevKey = keyframe;
	}

	stringParts = stringParts.map(function(it){
	  return `${it[0].padEnd(maxBaseLength)}${it[1]}`;
	});
	// str += stringParts.join('\n') + '\nreturn l_ga;\n\n\n';
	str += '\nreturn l_ga;\n\n\n';

  return str;
}

function ueForEasing(sceneJSON){
  // console.log('sceneJSON', sceneJSON);
  var keys = Object.keys(sceneJSON);
  console.log('keys', keys)
	var str = '';
	var layers = sceneJSON;
	for (var i=0, len = layers.length; i<len; i++){
		str += ueLayer(layers[i]);
	}
	str += '\n';
  return str;
}

function fillPropsUE(keyProps){
  var frame = {};
  if(keyProps.hasOwnProperty('x')){
    frame.x = keyProps.x;
  }
  if(keyProps.hasOwnProperty('y')){
    frame.y = keyProps.y;
  }
  if(keyProps.hasOwnProperty('scaleX')){
    frame.sx = keyProps.scaleX;
  }
  if(keyProps.hasOwnProperty('scaleY')){
    frame.sy = keyProps.scaleY;
  }
  if(keyProps.hasOwnProperty('rotation')){
    var val = (keyProps.rotation / 180) * Math.PI;
    frame.r = Math.floor((val)*1000) / 1000;
  }
  if(keyProps.hasOwnProperty('alpha')){
    frame.a = keyProps.alpha;
  }
  /*if(keyProps.hasOwnProperty('f')){
    frame.f = keyProps.f;
  }*/
  return frame;
}

function getInitPropsParams(initProps, exeptProps){
	var props = {};
	_.forIn(initProps, function(value, key){
		if(exeptProps.indexOf(key) === -1){
			_.extend(props, value)
		}
	})
	return props;
}

//update for UE
function ue(sceneJSON){
	let result = {};
	for(let k in sceneJSON){
		let item = sceneJSON[k];
		let name = item.name.split(' ').join('_') + '_' + item.index;
		let innerRes = {'samples' : []};
		for(let i in item.keys){
			let frame = fillPropsUE(item.keys[i]);
			innerRes.samples.push(frame);
		}
		result[name] = innerRes;
	}
	return JSON.stringify(result, null, '\t');
}

function serial(layerObj){
  var resArr = [];
  for(let i in layerObj.keys){
    let frame = fillPropsUE(layerObj.keys[i]);
    resArr.push(frame);
  }

  return utils.shrinkArrToString(resArr);
}


module.exports.ue = ue;
module.exports.ueForEasing = ueForEasing;
module.exports.ueLayer = ueLayer;
module.exports.serial = serial;
