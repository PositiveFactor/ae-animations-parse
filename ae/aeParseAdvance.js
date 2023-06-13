function aeGetLayersTransform() {

	var BLENDS = {
		"5220":"ADD",
		"5244":"ALPHA_ADD",
		"5219":"CLASSIC_COLOR_BURN",
		"5225":"CLASSIC_COLOR_DODGE",
		"5234":"CLASSIC_DIFFERENCE",
		"5238":"COLOR",
		"5218":"COLOR_BURN",
		"5224":"COLOR_DODGE",
		"5214":"DANCING_DISSOLVE",
		"5215":"DARKEN",
		"5247":"DARKER_COLOR",
		"5233":"DIFFERENCE",
		"5213":"DISSOLVE",
		"5249":"DIVIDE",
		"5235":"EXCLUSION",
		"5228":"HARD_LIGHT",
		"5232":"HARD_MIX",
		"5236":"HUE",
		"5221":"LIGHTEN",
		"5246":"LIGHTER_COLOR",
		"5217":"LINEAR_BURN",
		"5223":"LINEAR_DODGE",
		"5229":"LINEAR_LIGHT",
		"5245":"LUMINESCENT_PREMUL",
		"5239":"LUMINOSITY",
		"5216":"MULTIPLY",
		"5212":"NORMAL",
		"5226":"OVERLAY",
		"5231":"PIN_LIGHT",
		"5237":"SATURATION",
		"5222":"SCREEN",
		"5242":"SILHOUETE_ALPHA",
		"5243":"SILHOUETTE_LUMA",
		"5227":"SOFT_LIGHT",
		"5240":"STENCIL_ALPHA",
		"5241":"STENCIL_LUMA",
		"5248":"SUBTRACT",
		"5230":"VIVID_LIGHT"
	}

	var LAYER_KEYS = [
		"==",
		"active", "activeAtTime",
		"addProperty", "addToMotionGraphicsTemplate",
		"canAddProperty", "canAddToMotionGraphicsTemplate", "canSetCollapseTransformation", "canSetEnabled", "canSetTimeRemapEnabled",
		"adjustmentLayer", "applyPreset",
		"audioActive", "audioActiveAtTime", "audioEnabled", "hasAudio",
		"autoOrient",
		"blendingMode",
		"calculateTransformFromPoints",
		"collapseTransformation",
		"comment",
		"compPointToSource",
		"containingComp",
		"copyToComp",
		"duplicate",
		"effectsActive",
		"elided",
		"enabled",
		"environmentLayer",
		"frameBlending",
		"frameBlendingType",
		"getRenderGUID",
		"guideLayer",
		"hasTrackMatte", "trackMatteType",
		"hasVideo",
		"height", "width",
		"inPoint",
		"index",
		"isEffect", "isMask", "isModified", "isNameFromSource", "isNameSet", "isTrackMatte",
		"label",
		"lightType",
		"locked",
		"matchName", "motionBlur",
		"moveAfter", "moveBefore", "moveTo", "moveToBeginning", "moveToEnd",
		"name",
		"nullLayer",
		"numProperties",
		"openInViewer",
		"outPoint",
		"parent",
		"parentProperty",
		"preserveTransparency",
		"property", "propertyDepth", "propertyGroup", "propertyType",
		"quality", "remove", "replaceSource", "samplingQuality",
		"selected", "selectedProperties", "setParentWithJump", "shy", "solo",
		"source", "sourcePointToComp", "sourceRectAtTime",
		"startTime", "stretch",
		"threeDLayer", "threeDPerChar",
		"time", "timeRemapEnabled",
		"Effects", "Transform" // groups
	];


	var INTERPOLATIONS = {};
		INTERPOLATIONS[KeyframeInterpolationType.LINEAR] = "LINEAR";
		INTERPOLATIONS[KeyframeInterpolationType.BEZIER] = "BEZIER";
		INTERPOLATIONS[KeyframeInterpolationType.HOLD] = "HOLD";

	var KOEF = 1//;1780/1920;
	var FRAMERATE = 30;
	var TRANSFORM_USEFULL_KEYS = [1,2,6,10,11];
	var TRANSFORM_PROPERTY_NAMES = {
		"1": {alias:'reg', name:["regX", "regY"], mult:KOEF}, 		// 1
		"2": {alias:'position', name:["x", "y"], mult:KOEF},			// 2
		"6": {alias:'scale', name:["scaleX", "scaleY"], mult:0.01}, 	// 6
		"10": {alias:'rotation', name:"rotation"}, 			// 10
		"11": {alias:'alpha', name:"alpha", mult:0.01},				// 11
	};

	var json = {layers:[]};
	var activeItem = app.project.activeItem;
	var layers = activeItem.layers;
	var numLayers = activeItem.numLayers;

	function getAllKeysForTransform(transform){
		var keys = {'0':true};
		var sceneLen = activeItem.workAreaDuration;
		keys[sceneLen] = true;
		for (var b=0;b<TRANSFORM_USEFULL_KEYS.length;b++){
			var propId = TRANSFORM_USEFULL_KEYS[b];
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

	function getKeysForProp(transform, propId){
		// var sceneLen = activeItem.workAreaDuration;
		var prop = transform.property(propId);

		var propId = TRANSFORM_USEFULL_KEYS[b];
		var prop = transform.property(propId);

		if(prop.numKeys){
			for (var j=1; j<=prop.numKeys;j++){
				var key = prop.keyTime(j);
				if(!keys.hasOwnProperty(key)){
					keys[key] = true;
				}
			}
		}

		return Object.keys(keys).sort();
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

	function parseValue(propId, propValue){
		var result = {}

		var propertyDefinition = TRANSFORM_PROPERTY_NAMES[propId];
		var mult = propertyDefinition.mult || 1;
		var isDifferentProp = propertyDefinition.name instanceof Array; // like scale (X,Y,Z)
		if(isDifferentProp){
			var propValues = propertyDefinition.name;
			for (var f=0;f<propValues.length;f++){
				var propName = propValues[f];
				var val = utils.cropValue(propValue[f]*mult); // Math.round((propValue[f]*mult)*100) / 100;
				result[propName] = val;
			}
		}
		else{
			propName = propertyDefinition.name;
			val = utils.cropValue(propValue*mult); //  Math.round((propValue*mult)*100) / 100;
			result[propName] = val;
		}
		return result;
	}

	function getEffects(layer){
		var effectsProp = layer['Effects'];
		var effects = [];
		if(effectsProp){
			for (var i=1, len=effectsProp.numProperties; i<=len; i++){
				var pr = effectsProp.property(i);
				effects.push(pr.name);
			}
		};
		return effects;
	}

	function getLayerDefNew(layer){
		var jsonLayer = {
			name: layer.name,
			index: layer.index,
			blendMode:BLENDS[layer.blendingMode],
			effects:getEffects(layer),
			initProps:{},
			keys: {},
		};

		var transform = layer['Transform'];
		var sceneLen = activeItem.workAreaDuration;

		for (var d=0;d<TRANSFORM_USEFULL_KEYS.length;d++){
			var propId = TRANSFORM_USEFULL_KEYS[d];
			var prop = transform.property(propId);
			var propName = prop.name;
			var propAlias = TRANSFORM_PROPERTY_NAMES[propId].alias;

			// fill init params
			rawValue = prop.valueAtTime(0, true);
			parsedValue = parseValue(propId, rawValue);
			jsonLayer.initProps[propAlias] = parsedValue;
			//

			if(prop.numKeys){ // если для пропа есть ключевые кадры
				var keyArr = [];
				for (var j=1; j<=prop.numKeys;j++){
					var keyTime = prop.keyTime(j);
					// console.log(propAlias, keyTime);

					// встречаются аномальные ключи с отрицательным временем.
					// даже знать не хочу почему, они нахер не нужны
					if(keyTime < 0){
						continue;
					}

					var interpInType = prop.keyInInterpolationType(j)
					var interpOutType = prop.keyOutInterpolationType(j)

					var interpIn = {};
					var interpOut = {};

					if(interpInType === KeyframeInterpolationType.BEZIER){
						var ease = prop.keyInTemporalEase(j)
						interpIn.speed = utils.cropValue(ease[0].speed);
						interpIn.influence = utils.cropValue(ease[0].influence);
					}

					if(interpOutType === KeyframeInterpolationType.BEZIER){
						var ease = prop.keyOutTemporalEase(j)
						interpOut.speed = utils.cropValue(ease[0].speed);
						interpOut.influence = utils.cropValue(ease[0].influence);
					}

					var parsedTime = parseTime(keyTime);
					var rawValue = prop.valueAtTime(keyTime, true);
					var parsedValue = parseValue(propId, rawValue);
					var keyString = String(parsedTime.seconds)  + ':' + String(parsedTime.frames);
					keyArr.push({
						key:parsedTime.fullframes,
						keyStr:keyString,
						value:parsedValue,
						interpolation:{
							'in': interpIn,
							'out': interpOut,
						}
					});
				}
				jsonLayer.keys[propAlias] = keyArr;
			}
		};

		// visible ..
		var visibleOnTime = parseTime(layer.startTime);
		var visibleOffTime = parseTime(layer.outPoint);
		jsonLayer.keys['visible'] = [
			{
				key: visibleOnTime.fullframes < 0 ? 0 : visibleOnTime.fullframes,
				keyStr: visibleOnTime.fullframes < 0 ? '0:00' : visibleOnTime.str,
				value: {
					visible: 1,
				}
			},
			{
				key: visibleOffTime.fullframes < 0 ? 0 : visibleOffTime.fullframes,
				keyStr: visibleOffTime.fullframes < 0 ? '0:00' : visibleOffTime.str,
				value: {
					visible: 0,
				}
			},
		];
		// .. visible

		return jsonLayer;
	}

	function inspectPropsOfObject(obj, prefix){
		for (var i=1, len=obj.numProperties; i<=len; i++){
			var pr = obj.property(i);
			console.log(prefix, ' ', pr.name);
		}
	}

	function inspect(obj, notDeep){
		console.log('---------------- inspect ..')
		console.log('inspect ', obj)

		var keys = Object.keys(obj);

		keys.forEach(function(key){
			if(key === 'lightType' ||
				key === 'moveTo' ||
				key === 'maxValue' ||
				key === 'minValue' ||
				key === 'separationDimension' ||
				key === 'separationLeader'
				){
				return;
			}
			if(notDeep){
				console.log(key);
			}
			else{
				// console.log(key);
				console.log(key, ' ', obj[key]);
			}

		})
		console.log('.. inspect ---------------- ')
	}

	function inspectLayer(layer){
		var source = layer.source;

		console.log('***************************** ')
		console.log('layer.name ', layer.name)
		console.log('layer.label ', layer.label)
		console.log('layer.source ', source)
		console.log('layer.source.file ', source.file)
		console.log('layer.source.selected ', source.selected)
		console.log('layer.source.time ', source.time)

		var sourceKeys = Object.keys(source)

		var usedIn = source.usedIn;
		console.log('usedIn ', usedIn);
		console.log('usedIn ', usedIn.layers);


		// console.log('layer.source 2 ', sourceKeys)

		// layer.source.openInViewer(); // бесполезно но забавно
		// usefull id, label, file, width, height, usedIn

		// FootageItem props
		// comment,duration,dynamicLinkGUID,file,footageMissing,frameDuration,frameRate,getRenderGUID,
		// hasAudio,hasVideo,height,id,label,mainSource,name,openInViewer,parentFolder,pixelAspect,proxySource,remove,
		// replace,replaceWithPlaceholder,replaceWithSequence,replaceWithSolid,selected,setProxy,setProxyToNone,
		// setProxyWithPlaceholder,setProxyWithSequence,setProxyWithSolid,time,typeName,useProxy,usedIn,width
	}

	// layer index and other arrays starts from 1
	for(var i=1; i<=numLayers;i++){
		var layer = layers[i];
		console.log(i, ' ', layer, ' ', layer.name);


		var jsonLayer = getLayerDefNew(layer);
		json.layers.push(jsonLayer);
	}

	return json;
}


module.exports = aeGetLayersTransform;
