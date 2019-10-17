function aeGetLayersTransform(layerIndex, isFramed, options) {

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

	var params = [];
	if(options && options.props){
		params = options.props;
	}

	var FRAMERATE = framerate;
	var TRANSFORM_USEFULL = [1, 2, 6, 10, 11];
	var TRANSFORM_PROPERTY_DEFINITION = {
		"1": {alias:'reg', name:["regX", "regY"], mult:positionCoefficient}, 		// 1
		"2": {alias:'pos', name:["x", "y"], mult:positionCoefficient},			// 2
		"6": {alias:"scale", name:["scaleX", "scaleY"], mult:0.01*scaleMult}, 	// 6
		"10": {alias:"rotation", name:"rotation"}, 			// 10
		"11": {alias:"alpha", name:"alpha", mult:0.01},				// 11
	};

	var globalKeys = {};
	var json = {layers:[]};
	var active = app.project.activeItem;
	var layers = active.layers;
	var numLayers = active.numLayers;

	function cropValue(val){
		return Math.round((val)*1000) / 1000;
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
		// gkeys[key]['f'] = "" + key  + ' - ' + Math.floor(key / 30) + ':' + Math.floor(key % 30);
	}

	function addKey(gkeys, key, propId, propValue){
		key = Math.round(key * FRAMERATE);
		if(!gkeys.hasOwnProperty(key)){
			gkeys[key] = {};
		}

		var propertyDefinition = TRANSFORM_PROPERTY_DEFINITION[propId];
		var mult = propertyDefinition.mult || 1;
		var isDifferentProp = propertyDefinition.name instanceof Array;
		var propertyNames = isDifferentProp ? propertyDefinition.name : [propertyDefinition.name];
		propValue = isDifferentProp ? propValue : [propValue];

		for (var f=0;f<propertyNames.length;f++){
			var propName = propertyNames[f];
			var val = cropValue(propValue[f]*mult);
			_saveKeyframe(gkeys, key, propName, val);
		}
	};

	function getAllFrames(transform, inPointFrame, outPointFrame, onlyKeyframes){
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

	function getLayerProps(transform){
		var props = {};
		for (var i=0;i<TRANSFORM_USEFULL.length;i++){
			var propId = TRANSFORM_USEFULL[i];
			var aeProp = transform.property(propId);
			var definition = TRANSFORM_PROPERTY_DEFINITION[propId];

			var prop = {};
			// aeProp.numKeys
			if(aeProp.numKeys){
				prop.keys = [];
				for (var j=1; j<=aeProp.numKeys;j++){
					var keyTime = aeProp.keyTime(j);
					var oneFrameTime = 1/FRAMERATE;
					var key = {
						toString: function(){return ''+this.keyFrame + '|' + this.value},
						toJSON: function(){return ''+this.keyFrame + '|' + this.value},
						keyTime: keyTime,
						keyFrame: keyTime/oneFrameTime,
						value: aeProp.keyValue(j),
						
					};
					;
					prop.keys.push(key);
					/*if(!keys.hasOwnProperty(key)){
						keys[key] = true;
					}*/
				}
			}

			props[definition.alias] = prop;
		}
		return props;
	}

	function getKeysForProp(transform){
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
		var oneFrameTime = 1/FRAMERATE;

		return {
			minTime:minKeyFrame,
			minFrame:Math.round(minKeyFrame * FRAMERATE),
			maxTime:maxKeyFrame,
			maxFrame:Math.round(maxKeyFrame * FRAMERATE)
		};
	}

	function getLayerDef(layer){
		console.log(layer);
		var jsonLayer = {
			name:layer.name,
			index: layer.index,
			keys:{},
		};
		var transform = layer['Transform'];

		var allKeys = getAllKeysForTransform(transform);

		var props = getLayerProps(transform);
		return props;

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
	}

	var layer = layers[layerIndex];
	var jsonLayer = getLayerDef(layer, options);
	return jsonLayer;
}


module.exports = aeGetLayersTransform;
