function aeGetLayersTransform(layerIndex, isFramed, options) {
	
	var scaleMult = 1;
	if(options && options.scaleMult){
		scaleMult = options.scaleMult;
	}	
	
	var KOEF = 1780/1920;
	var FRAMERATE = 30;
	var TRANSFORM_USEFULL = [1,2,6,10,11];
	var TRANSFORM_PROPERTY_NAMES = {
		"1": {name:["regX", "regY"], mult:KOEF}, 		// 1
		"2": {name:["x", "y"], mult:KOEF},			// 2
		"6": {name:["scaleX", "scaleY"], mult:0.01*scaleMult}, 	// 6
		"10": {name:"rotation"}, 			// 10
		"11": {name:"alpha", mult:0.01},				// 11
	};

	var globalKeys = {};
	var json = {layers:[]};
	var active = app.project.activeItem;
	var layers = active.layers;
	var numLayers = active.numLayers;
	
	function cropValue(val){
		return Math.floor((val)*1000) / 1000;
	}

	function getSceneLength(){
	  return active.workAreaDuration;
	}

	function isInt(n){
		return Number(n) === n && n % 1 === 0;
	}

	function isFloat(n){
		return Number(n) === n && n % 1 !== 0;
	}

	function _saveKeyframe(gkeys, key, propName, val){
		if(!isInt(val)){
			val = Number(val.toFixed(3));
		}
		gkeys[key][propName] = val;
	}

	function addKey(gkeys, key, propId, propValue){
		key = Math.round(key * FRAMERATE);
		//console.log('add ', key, ' ', propId, ' ', propValue);
		if(!gkeys.hasOwnProperty(key)){
			gkeys[key] = {};
		}

		var propertyDefinition = TRANSFORM_PROPERTY_NAMES[propId];
		var mult = propertyDefinition.mult || 1;
		var isDifferentProp = propertyDefinition.name instanceof Array;
		if(isDifferentProp){
			var propValues = propertyDefinition.name;
			for (var f=0;f<propValues.length;f++){
				var propName = propValues[f];
				var val = cropValue(propValue[f]*mult);
				_saveKeyframe(gkeys, key, propName, val);
			}
		}
		else{
			propName = propertyDefinition.name;
			val = cropValue(propValue*mult);
			_saveKeyframe(gkeys, key, propName, val);
		}
	};
	
	function getAllFrames(transform){
		var keys = {};
		var sceneLen = getSceneLength() * FRAMERATE;
		for (var b=0; b < sceneLen; b++){
			keys[b/FRAMERATE] = true;
		}
		return Object.keys(keys).sort();
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
		return Object.keys(keys).sort();
	}

	function getLayerDef(layer){
		console.log(layer);
		var jsonLayer = {
			name:layer.name,
			index: layer.index,
			keys:{},
		};
		var effects = layer['Effects'];
		var transform = layer['Transform'];
		jsonLayer.effectsExist = !!effects;
		
		var allKeys = getAllKeysForTransform(transform);

		var prevKey = null;
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

		return jsonLayer;
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
		
		// var allKeys = getAllKeysForTransform(transform);
		var allKeys = getAllFrames(transform);

		var prevKey = null;
		for (var r=0;r<allKeys.length;r++){
			var key = allKeys[r];
			jsonLayer.keys[Math.round(key * FRAMERATE)] = {};

			for (var d=0;d<TRANSFORM_USEFULL.length;d++){
				var propId = TRANSFORM_USEFULL[d];
				var prop = transform.property(propId);
				var val = prop.valueAtTime(key, true);
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

		return jsonLayer;
	}

	var layer = layers[layerIndex];
	var jsonLayer = isFramed 
		? getLayerDefFramed(layer) 
		: getLayerDef(layer);
			
	return jsonLayer;
}


module.exports = aeGetLayersTransform;
