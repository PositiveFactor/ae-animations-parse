function _compareKeyframesFunction(a, b) {
  return a.key - b.key;
}

function translateKeys(jsonLayer){
  jsonLayer.keys = Object.keys(jsonLayer.keys)
    .map( function(k){ return {key:k*1, tf:jsonLayer.keys[k]} })
    .sort(_compareKeyframesFunction);
  return jsonLayer;
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

function getInitPropsParams(initProps, exeptProps){
	var props = {};
	_.forIn(initProps, function(value, key){
		if(exeptProps.indexOf(key) === -1){
			_.extend(props, value)
		}
	})
	return props;
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

module.exports.translateKeys = translateKeys;
module.exports.getGroupString = getGroupString;
module.exports.getInitPropsParams = getInitPropsParams;
module.exports.parseTime = parseTime;
