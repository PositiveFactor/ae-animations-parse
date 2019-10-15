var _ = require('lodash')
var JSON5 = require('json5-utils')
var commonMethods = require('./outputCommonMethods');

function getFormatedParams(params){
  return JSON5.stringify(params, '', '').replace(/,/gm, ', ');
}

// output like createjs animation definition.
function cjs(sceneJSON){
	var str = '';
	var layers = sceneJSON.layers;
	for (var i=0, len = layers.length; i<len; i++){
		str += cjsLayer(layers[i]);
	}
	str += '\n';
  return str;
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
		var layer = commonMethods.translateKeys(layers[i]);
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

function cjsLayer(layerDef){
	var str = '\n';

	var layer = commonMethods.translateKeys(layerDef);
	var name = layer.name;
	var index = layer.index;
	var keys = layer.keys;
	var prevKey = keys[0].key;
	var clearedParams = clearUnusedParams(keys);

	str += `${index} ${name}\ncreatejs.Tween.get( this._fContainer_cjc, {useTicks:true})\n`;

	// for beautyful output
	var stringParts = [];
	var maxBaseLength = 0;

	var prevWait = false;

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
	str += stringParts.join('\n') + '\n\n\n';

  return str;
}

function getKeys(keys){
	var json = {'keys': []}

	_.forIn(keys, function(keyGroup, key){
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
	})
	return json;
}

module.exports.cjs = cjs;
module.exports.cjsAdv = cjsAdv;
module.exports.cjsLayer = cjsLayer;
