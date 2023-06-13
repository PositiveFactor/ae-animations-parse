function aeGetKeysForLayer(layerIndex, isFramed, options) {

	var scaleMult = 1;
	if(options && options.scaleMult){
		scaleMult = options.scaleMult;
	}

	var positionCoefficient = 1;
	if(options && options.positionKoefficient){
		positionCoefficient = options.positionKoefficient;
	}

	var framerate = 30;
	if(options && options.framerate){
		framerate = options.framerate;
	}
	var FRAMERATE = framerate;

	var TRANSFORM_USEFULL = [1, 2, 6, 10, 11];
	var TRANSFORM_PROPERTY_NAMES = {
		"1": {alias: 'reg', name:["regX", "regY"], mult:positionCoefficient}, 	// 1
		"2": {alias: 'position', name:["x", "y"], mult:positionCoefficient},					// 2
		"6": {alias: 'scale', name:["scaleX", "scaleY"], mult:0.01*scaleMult}, 		// 6
		"10": {alias: 'rotation', name:"rotation"}, 																	// 10
		"11": {alias: 'alpha', name:"alpha", mult:0.01},													// 11
	};

	var INTERPOLATIONS = {};
	INTERPOLATIONS[KeyframeInterpolationType.LINEAR] = "LINEAR";
	INTERPOLATIONS[KeyframeInterpolationType.BEZIER] = "BEZIER";
	INTERPOLATIONS[KeyframeInterpolationType.HOLD] = "HOLD";

	function getSceneLength(){
	  return active.workAreaDuration;
	}

	function getAllFrames(transform, inPointFrame, outPointFrame){
		var keys = {};
		var sceneLen = getSceneLength() * FRAMERATE;
		inPointFrame = inPointFrame ? inPointFrame : 0;
		outPointFrame = outPointFrame ? outPointFrame : sceneLen;

		for (var b=inPointFrame; b <= outPointFrame; b++){
			keys[b/FRAMERATE] = true;
		}
		return Object.keys(keys).sort();
	}

	function getAllKeysForTransform(transform){
		var keys = {};

		for (var b=0; b < TRANSFORM_USEFULL.length; b++){
			var propId = TRANSFORM_USEFULL[b];
			var prop = transform.property(propId);
			var propertyDefinition = TRANSFORM_PROPERTY_NAMES[propId];

			if(prop.numKeys){
				var propSerial = [];
				var alias = propertyDefinition['alias'];
				keys[alias] = propSerial;

				// all keyframes for current prop;
				for (var keyframeIndex=1; keyframeIndex<=prop.numKeys; keyframeIndex++){
					var key = Math.round(prop.keyTime(keyframeIndex) * FRAMERATE);
					var keyFrameDef = {
						key: key,
						aeKey: Math.floor(key / FRAMERATE) + ':' + Math.floor(key % FRAMERATE),
						interp: INTERPOLATIONS[prop.keyInInterpolationType(keyframeIndex)]
					}

					var propValue = prop.keyValue(keyframeIndex);
					var mult = propertyDefinition.mult || 1;
					var isDifferentProp = propertyDefinition.name instanceof Array;
					var propertyNames = isDifferentProp ? propertyDefinition.name : [propertyDefinition.name];

					var identic = true;
					for (var f=0;f<propertyNames.length;f++){
						var propName = propertyNames[f];
						var val = utils.cropValue(propValue[f]*mult);
						keyFrameDef[propName] = val;
					}

					propSerial.push(keyFrameDef);
				}
			}
		}

		return keys;
	}

	function getLayerDef(layer){
		var jsonLayer = {
			name:layer.name,
			index: layer.index,
			tweens: {},
			keys:{},
		};

		var effects = layer['Effects'];
		jsonLayer.effectsExist = !!effects;

		var transform = layer['Transform'];


		var allKeys = getAllKeysForTransform(transform);
		// console.log('allKeys ', allKeys);
		jsonLayer.tweens = allKeys;
		return jsonLayer;

		/*var prevKey = null;
		for (var r=0;r<allKeys.length;r++){
			var key = allKeys[r];
			jsonLayer.keys[Math.round(key * FRAMERATE)] = {};

			for (var d=0;d<TRANSFORM_USEFULL.length;d++){
				var propId = TRANSFORM_USEFULL[d];
				var prop = transform.property(propId);
				var val = prop.valueAtTime(key, true);
				//addKey(globalKeys, 0, propId, prop.valueAtTime(0, true));
				if(prevKey !== null){
					var prevVal = prop.valueAtTime(prevKey, true);
				}

				addKey(jsonLayer.keys, key, propId, val);
			};
			prevKey = key;
		}

		return jsonLayer;

		var keysArr = [];
		var oldKeys = [];


		var strKeys = Object.keys(jsonLayer.keys);
		var keys = strKeys.map(parseInt);
		keys = keys.sort();

		var prevKey = 0;
		for (var g=0; g<keys.length;g++){
			keysArr.push([
				jsonLayer.keys[keys[g]],
				keys[g]*1-prevKey,
			]);
			prevKey = keys[g]*1;
		}

		jsonLayer.keys = keysArr;
		jsonLayer.oldKeys = oldKeys;

		return jsonLayer;*/
	}

	function getLayerDefFramed(layer){
		console.log(layer);
		var jsonLayer = {
			name:layer.name,
			index: layer.index,
			keys:{},
		};

		var effects = layer['Effects'];
		var transform = layer['Transform'];
		jsonLayer.effectsExist = !!effects;

		var oneFrameTime = 1/30;
		var inPointFrame =  layer.inPoint/oneFrameTime;
		var outPointFrame =  layer.outPoint/oneFrameTime;

		console.log(r, ' layer.inPoint ', layer.inPoint/oneFrameTime);
		console.log(r, ' layer.outPoint ', layer.outPoint/oneFrameTime);

		// var allKeys = getAllKeysForTransform(transform);
		var allKeys = getAllFrames(transform, inPointFrame, outPointFrame);

		var prevKey = null;
		for (var r=0; r<allKeys.length; r++) {
			var key = allKeys[r];
			jsonLayer.keys[Math.round(key * FRAMERATE)] = {};

			for (var d=0; d<TRANSFORM_USEFULL.length; d++){
				var propId = TRANSFORM_USEFULL[d];
				var prop = transform.property(propId);
				// console.log('prop.expression', prop.expression);
				if(prop.numKeys || prop.expression){
					var val = prop.valueAtTime(key, true);
					if(prevKey !== null){
						var prevVal = prop.valueAtTime(prevKey, true);
					}

					addKey(jsonLayer.keys, key, propId, val);
				}
			};
			prevKey = key;
		}

		return jsonLayer;

		var keysArr = [];
		var oldKeys = [];


		var strKeys = Object.keys(jsonLayer.keys);
		var keys = strKeys.map(parseInt);
		keys = keys.sort();

		var prevKey = 0;
		for (var g=0; g<keys.length;g++){
			keysArr.push([
				jsonLayer.keys[keys[g]],
				keys[g]*1-prevKey,
			]);
			prevKey = keys[g]*1;
		}

		jsonLayer.keys = keysArr;
		jsonLayer.oldKeys = oldKeys;

		return jsonLayer;
	}

	var globalKeys = {};
	var json = {layers:[]};
	var aeActive = app.project.activeItem;
	var aeLayers = aeActive.layers;
	var aeNumLayers = aeActive.numLayers;

	var layer = aeLayers[layerIndex];

	var jsonLayer = isFramed
		? getLayerDefFramed(layer)
		: getLayerDef(layer);

	return jsonLayer;
}


module.exports = aeGetKeysForLayer;
