/*global objects*/
// utils - ./uncludes/utils.jsx

function aeGetLayersTransform(layerIndex, options) {

	var scaleMult = (options && options.scaleMult) || 1;
	var positionCoefficient = (options && options.positionKoefficient) || 1;
	var framerate = (options && options.framerate) || 30;
	var props = (options && options.props) || [];
	var isFullLayer = (options && options.full) || false;

	var isComputedValues = true;
	if(options && options.uncomp){
		isComputedValues = false;
	}

  var globalKeys = {};
	var json = {layers:[]};
	var active = app.project.activeItem;
	var layers = active.layers;
	var numLayers = active.numLayers;

	var TRANSFORM_USEFULL = [1, 2, 6, 10, 11];
	var positionParams = ["x", "y"];
	if(options && options.z){
		positionParams.push("z");
	}

	var TRANSFORM_PROPERTY_NAMES = {
		"1": {name:["regX", "regY"], mult:positionCoefficient}, 		// 1
		"2": {name:positionParams, mult:positionCoefficient},			// 2
		"6": {name:["scaleX", "scaleY"], mult:0.01*scaleMult}, 	// 6
		"10": {name:"rotation"}, 			// 10
		"11": {name:"alpha", mult:0.01},				// 11
	};

  var FRAMERATE = framerate; // active.frameRate;

	function getSceneLength(){
	  return active.workAreaDuration;
	}

	function _saveKeyframe(gkeys, key, propName, val, notCreateNestedObject){
		val = !utils.isInt(val) ? Number(val.toFixed(3)) : val;
		if(notCreateNestedObject) {
			gkeys[propName] = val;
		}
		else {
			gkeys[key][propName] = val;
		}
	}

	function addKey(gkeys, key, propId, propValue, notCreateNestedObject){
		key = Math.round(key * FRAMERATE);
		if(!gkeys.hasOwnProperty(key) && !notCreateNestedObject){
			gkeys[key] = {};
		}

		var propertyDefinition = TRANSFORM_PROPERTY_NAMES[propId];
		var mult = propertyDefinition.mult || 1;
		var isDifferentProp = propertyDefinition.name instanceof Array;
		var propertyNames = isDifferentProp ? propertyDefinition.name : [propertyDefinition.name];
		propValue = isDifferentProp ? propValue : [propValue];

		for (var f=0;f<propertyNames.length;f++){
			var propName = propertyNames[f];
			var val = utils.cropValue(propValue[f]*mult);
			_saveKeyframe(gkeys, key, propName, val, notCreateNestedObject);
		}
	};

	function getAllTimeFrames(inPointFrame, outPointFrame){
    var keys_arr = [];
		var sceneLen = getSceneLength() * FRAMERATE;
		inPointFrame = inPointFrame ? inPointFrame : 0;
		outPointFrame = outPointFrame ? outPointFrame : sceneLen;

		for (var index=inPointFrame; index <= outPointFrame; index++){
      keys_arr.push({frameIndex:index, frameTime:index/FRAMERATE});
		}
    return keys_arr;
	}

	function getAllKeysForTransform(transform){
		var keys = {'0':true};
		var sceneLen = getSceneLength();
		keys[sceneLen] = true;
		for (var b=0;b<TRANSFORM_USEFULL.length;b++){
			var propId = TRANSFORM_USEFULL[b];
			var prop = transform.property(propId);

			if(prop.numKeys){
				for (var j=1; j<=prop.numKeys;j++){
					var key = prop.keyTime(j);
					if(!keys.hasOwnProperty(key)){
						keys[key] = true;
					}
				}
			}
		}

		console.log('getAllKeysForTransform Object.keys(keys).sort()');
		console.log(Object.keys(keys).sort());
		return Object.keys(keys).sort();
	}

	function getFirstLastKeyframeRange(transform){

		var minKeyFrame = null;
		var maxKeyFrame = null;

		for (var b=0;b<TRANSFORM_USEFULL.length;b++){
			var propId = TRANSFORM_USEFULL[b];
			var prop = transform.property(propId);

			if(prop.numKeys){
				for (var j=1; j<=prop.numKeys;j++){
					var key = prop.keyTime(j);

					if(minKeyFrame === null || key < minKeyFrame){
						minKeyFrame = key;
					}

					if(maxKeyFrame === null || key > maxKeyFrame){
						maxKeyFrame = key;
					}
				}
			}
		}

		return {
			minTime:minKeyFrame,
			minFrame:Math.round(minKeyFrame * FRAMERATE),
			maxTime:maxKeyFrame,
			maxFrame:Math.round(maxKeyFrame * FRAMERATE)
		};
	}

	function getPropValue(prop, keyTime){
			var isPreExpression = !isComputedValues;
			return prop.valueAtTime(keyTime, isPreExpression);
	}

	function getLayerDefFramed(layer, options){
		var jsonLayer = {
			name:layer.name,
			index: layer.index,
			initial:{},
			keys:{},
		};

		var effects = layer['Effects'];
		var transform = layer['Transform'];
		// getAllKeysForTransform(transform);
		jsonLayer.effectsExist = !!effects;

		var oneFrameTime = 1/FRAMERATE;
		var inPointFrame =  layer.inPoint/oneFrameTime;
		var outPointFrame =  layer.outPoint/oneFrameTime;

		console.log('layer.inPoint  : ', layer.inPoint/oneFrameTime);
		console.log('layer.outPoint : ', layer.outPoint/oneFrameTime);

		var range = getFirstLastKeyframeRange(transform);

		console.log('range.minFrame : ', range.minFrame, ' (time ', range.minTime, ')');
		console.log('range.maxFrame : ', range.maxFrame, ' (time ', range.maxTime, ')');

		if(isFullLayer){
			var startPointFrame = Math.min(range.minFrame, inPointFrame);
			var endPointFrame = Math.max(range.maxFrame, outPointFrame);
		}
		else{
			startPointFrame = Math.max(range.minFrame, inPointFrame);
			endPointFrame = Math.min(range.maxFrame, outPointFrame);
		}

		console.log('total startPointFrame : ', startPointFrame);
		console.log('total endPointFrame   : ', endPointFrame);

		// все временные метки кадров
		var allKeys = getAllTimeFrames(startPointFrame, endPointFrame);

		var prevKey = null;
		for (var r=0; r<allKeys.length; r++) {
			var frameIndex = allKeys[r].frameIndex;
			var frameTime = allKeys[r].frameTime;

			jsonLayer.keys[Math.round(frameIndex)] = {};

			for (var d=0; d<TRANSFORM_USEFULL.length; d++){
				var propId = TRANSFORM_USEFULL[d];
				var prop = transform.property(propId);

				if(r === 0) {
					var val = getPropValue(prop, frameTime);
					addKey(jsonLayer.initial, frameTime, propId, val, true);
				}
				if(prop.numKeys || prop.expression){
					var val = getPropValue(prop, frameTime);
					if(prevKey !== null){
						var prevVal = getPropValue(prop, prevKey);
					}

					addKey(jsonLayer.keys, frameTime, propId, val);
				}
				else{
					// console.log('exp');
				}
			};
			prevKey = frameTime;
		}

		return jsonLayer;
	}

	var layer = layers[layerIndex];
	var jsonLayer = getLayerDefFramed(layer, options, isComputedValues)
	return jsonLayer;
}


module.exports = aeGetLayersTransform;
