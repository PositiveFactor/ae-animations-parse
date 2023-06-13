'use strict'

var _ = require('lodash')
var JSON5 = require('json5')
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

/*
  есть мысль встроить в --props еще возможность менять значение
  Типа если написать вместо "x":
  "x0" - (первый фрейм берется за точку отсчета и остальные считаются относительно него)
  "x*1.1" - (все значения параметра множатся на 1.1)
  Возникает проблема, когда в слое не одна анимация(например intro, idle, outro), не всегда
  есть необходимость для всех анимаций обнулять начало или что-то еще.
  Гарантированно отделить програмно одну анимацию от другой не получится(можно конечно, но оно не стоит таких усилий).
*/
function fillPropsUE(keyProps, filter, zeroX, zeroY, zeroZ, needZ){
  var frame = {};
  // console.log("keyProps");
  // console.log(keyProps);

  zeroX = zeroX === undefined ? 0 : zeroX;
  zeroY = zeroY === undefined ? 0 : zeroY;
  zeroZ = zeroZ === undefined ? 0 : zeroZ;

  /*var propsFromKey = Object.keys(keyProps);
  var actualProps = [];
  propsFromKey.forEach((key)=>{
    if(key.startsWith('!')){

    }
    actualProps
  })*/

  var testFunction = function(propName, shortPropName){
    var res =   keyProps.hasOwnProperty(propName) &&
                (/*!filter || */filter.length === 0 || filter.indexOf(shortPropName) >= 0)

    // console.log('filter', filter, res)
    return res;
  }

  if(testFunction('x', 'x')) { frame.x = cropValue(keyProps.x - zeroX); }
  if(testFunction('y', 'y')) { frame.y = cropValue(keyProps.y - zeroY); }
  // if(needZ){
    // if(testFunction('z', 'z')) { frame.z = cropValue(keyProps.z - zeroZ); }
  // }
  if(testFunction('scaleX', 'sx')) { frame.sx = keyProps.scaleX; }
  if(testFunction('scaleY', 'sy')) { frame.sy = keyProps.scaleY; }
  if(testFunction('alpha', 'a')) { frame.a = keyProps.alpha; }
  if(testFunction('rotation', 'r')) {
    var val = (keyProps.rotation / 180) * Math.PI;
    frame.r = Math.floor((val)*1000) / 1000;
  }
//   console.log('frame')
//   console.log(frame)
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

function cropValue(val){
  return Math.round((val)*1000) / 1000;
}

function isEqual(frame1, frame2) {
  var frame1Keys = Object.keys(frame1);
  var frame2Keys = Object.keys(frame2);

  if(frame1Keys.length !== frame2Keys.length) {
    return false;
  }

  for (var i = 0; i < frame1Keys.length; i++) {
    var compareKey = frame1Keys[i];
    if(frame1Keys[compareKey] === frame2Keys[compareKey])
    {

    }
  }
}

function serial(layerObj, filter, needZ){
  var resArr = [];

  var RELATIVE_POSITION = false;
  for(let i in layerObj.keys){
    if(zeroX === undefined && RELATIVE_POSITION){
      // var zeroX = 960;
      // var zeroY = 540; // относительно центра
      var zeroX = layerObj.keys[i].x;
      var zeroY = layerObj.keys[i].y; // относительно положения в первом кадре
    }
    else if(!RELATIVE_POSITION){
      var zeroX = 0;
      var zeroY = 0;
    }

    let frame = fillPropsUE(layerObj.keys[i], filter, zeroX, zeroY, needZ);
    // console.log(i, frame);
    resArr.push(frame);
  }

  return utils.shrinkArrToString(resArr);
}

function arrayProp(layerObj, propName){
  var resArr = [];
  for(let i in layerObj.keys) {
    let key = layerObj.keys[i];
    // console.log(i, key);
    if(key.hasOwnProperty(propName)){
      resArr.push(key[propName]);
    }
    // console.log(i, key);

  }
  return JSON.stringify(resArr).replace(/,/gm, ', ');
}

function bigserial(layerObj, filter, needZ){
  var resArr = [];

  var RELATIVE_POSITION = false;
  for(let i in layerObj.keys){
    if(zeroX === undefined && RELATIVE_POSITION){
      // var zeroX = 960;
      // var zeroY = 540; // относительно центра
      var zeroX = layerObj.keys[i].x;
      var zeroY = layerObj.keys[i].y; // относительно положения в первом кадре
    }
    else if(!RELATIVE_POSITION){
      var zeroX = 0;
      var zeroY = 0;
    }

    let frame = fillPropsUE(layerObj.keys[i], filter, zeroX, zeroY, needZ);
    // console.log(i, frame);
    resArr.push(frame);
  }

  return utils.shrinkArrToString(resArr);
}


module.exports.ue = ue;
module.exports.ueForEasing = ueForEasing;
module.exports.ueLayer = ueLayer;
module.exports.serial = serial;
module.exports.bigserial = bigserial;
module.exports.arrayProp = arrayProp;
