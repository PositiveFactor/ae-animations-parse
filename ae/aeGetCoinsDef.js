function aeGetCoinsDef() {
	var KOEF = 1780/1920;
	var FRAMERATE = 30;
	var TRANSFORM_USEFULL = [1,2,6,10,11];
	var TRANSFORM_PROPERTY_NAMES = {
		"1": {name:["regX", "regY"], mult:KOEF}, 		// 1
		"2": {name:["x", "y"], mult:KOEF},			// 2
		"6": {name:["scaleX", "scaleY"], mult:0.01}, 	// 6
		"10": {name:"rotation"}, 			// 10
		"11": {name:"alpha", mult:0.01},				// 11
	};

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
				var val = (propValue[f]*mult);
				_saveKeyframe(gkeys, key, propName, val);
			}
		}
		else{
			propName = propertyDefinition.name;
			val = (propValue*mult);
			_saveKeyframe(gkeys, key, propName, val);
		}
	};

	function showPropertiesOfGroup(group){
		var num = group.numProperties;
		if(num === 0){
			console.log('groupProperties is empty');
		}
		else{
			for(var i=1; i<=num;i++){
				console.log(group.property(i));
			}
		}
	}

	function getAllKeys(){
        var keys = {};
		//keys[0] = true; // чтобы попадали начальные и конечные задержки
		//keys[6] = true;
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

	var json = {layers:[]};
	var active = app.project.activeItem;
	// console.log(active);
	// console.log(active.numLayers);
	var layers = active.layers;
	var numLayers = active.numLayers;
	var res = [];
	for(var i=1; i<=numLayers;i++){
		var layer = layers[i]; console.log(layer.index, ' ', layer, ' ', layer.name);
		jsonLayer = {
			name:layer.name,
			keys:{},
		};


		var effects = layer['Effects'];
		var colorAdd = false;

		if(effects){
			showPropertiesOfGroup(effects);
			var vc = effects.property('VC Color Vibrance');
			if(vc){
				console.log(effects);
				console.log(vc);
				console.log(vc.property('Color'));
				console.log(vc.property('Color').value);

				var r = vc.property('Color').value[0];
				var g = vc.property('Color').value[1];
				var b = vc.property('Color').value[2];

				var rgb = Math.floor(r*255).toString(16) + Math.floor(g*255).toString(16) + Math.floor(b*255).toString(16);

				color = layer.name.split(' ')[0];


				if(color === 'red' || color === 'green' || color === 'blue'){
					colorAdd = true;
				}

			}

		}

    // console.log('parse transform');

		var transform = layer['Transform'];
			var posProp = transform.property(2);
			var alphaProp = transform.property(11);
			var scaleProp = transform.property(6);
			var rotationProp = transform.property(10);

		var numKeys = posProp.numKeys;
		if(numKeys == 0){
			res.push({layername:layer.name, def:'keyframes are empty'});
			continue;
		}

		var interpolations = {};
		interpolations[KeyframeInterpolationType.LINEAR] = "LINEAR";
		interpolations[KeyframeInterpolationType.BEZIER] = "BEZIER";
		interpolations[KeyframeInterpolationType.HOLD] = "HOLD";

		var inInterpolationType = posProp.keyInInterpolationType(1);
		var outInterpolationType = posProp.keyOutInterpolationType(1);

		// console.log('in ', interpolations[posProp.keyInInterpolationType(1)]);
		// console.log('out ', interpolations[posProp.keyOutInterpolationType(1)]);

		// strange condition
		/*if(inInterpolationType != KeyframeInterpolationType.BEZIER && outInterpolationType != KeyframeInterpolationType.BEZIER){
			continue;
		}*/

		var keyValue1 = posProp.keyValue(1);
		var keyValue2 = posProp.keyValue(2);
		var keyOutSpart1 =  posProp.keyOutSpatialTangent(1);
		var keyInSpart2 =  posProp.keyInSpatialTangent(2);

		var anchor1 =[ keyValue1[0] + keyOutSpart1[0], keyValue1[1] + keyOutSpart1[1]];
		var anchor2 =[ keyValue2[0] + keyInSpart2[0], keyValue2[1] + keyInSpart2[1]];

		// console.log(posProp.keyValue(1));
		// console.log(posProp.keyValue(2));
		// console.log(posProp.keyOutSpatialTangent(1));
		// console.log(posProp.keyInSpatialTangent(2));
		// console.log(posProp.keyOutTemporalEase(1));

		var keyTime1 = posProp.keyTime(1);
		var keyTime2 = posProp.keyTime(2);

		var delay =  Math.round(keyTime1 * FRAMERATE);
		var time = Math.round( (keyTime2 - keyTime1) * FRAMERATE);
		var initX = keyValue1[0]*KOEF;
		var initY = keyValue1[1]*KOEF;
		var B1X = anchor1[0]*KOEF;
		var B1Y = anchor1[1]*KOEF;
		var B2X = anchor2[0]*KOEF;
		var B2Y = anchor2[1]*KOEF;
		var finalX = keyValue2[0]*KOEF;
		var finalY = keyValue2[1]*KOEF;
		var initScale = scaleProp.keyValue(1)[0]*0.01;
		var finalScale = scaleProp.keyValue(2)[0]*0.01;
		var initRotation = rotationProp.keyValue(1);
		var targetRotation = rotationProp.keyValue(2);

		initX = Number(initX.toFixed(3));
		initY = Number(initY.toFixed(3));
		B1X = Number(B1X.toFixed(3));
		B1Y = Number(B1Y.toFixed(3));
		B2X = Number(B2X.toFixed(3));
		B2Y = Number(B2Y.toFixed(3));
		finalX = Number(finalX.toFixed(3));
		finalY = Number(finalY.toFixed(3));
		initScale = Number(initScale.toFixed(3));
		finalScale = Number(finalScale.toFixed(3));

		var output = {
			delay:delay,
			time:time,
			initX:initX,
			initY:initY,
			B1X:B1X,
			B1Y:B1Y,
			B2X:B2X,
			B2Y:B2Y,
			finalX:finalX,
			finalY:finalY,
			initScale:initScale,
			finalScale:finalScale,
			initRotation:initRotation,
			targetRotation:targetRotation,
			layername:layer.name,
			layerindex:layer.index,
			effects: (effects.numProperties > 0)
		}

		// console.log(JSON.stringify(output));


		var arr = [delay, time, initX, initY, B1X, B1Y, B2X, B2Y, finalX, finalY, initScale, finalScale, initRotation, targetRotation, layer.name];
		if(colorAdd){
			output[rgb] = rgb;
		}

		res.push(output);

	};

	return res;
}


module.exports = aeGetCoinsDef;
