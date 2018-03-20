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
		var keys = layer.keys;
		var oldKeys = layer.oldKeys;
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
      var viewBase = `\t.to(${paramsString}, ${duration*2})`;

      stringParts.push([viewBase, viewKeyframe]);
      maxBaseLength = Math.max(viewBase.length, maxBaseLength);
      prevKey = keyframe;
		}

    stringParts = stringParts.map(function(it){
      return `${it[0].padEnd(maxBaseLength)}${it[1]}`;
    });
    console.log(stringParts);
		str += stringParts.join('\n') + '\n\n';
	}
	str += '\n';

  return str;
}


module.exports.cjs = cjs;
