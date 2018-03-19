function aeGetLayersTransform() {
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
	
	function getAllKeys(){
		var keys = {'0':true};
		keys[6] = true;
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
	
	var globalKeys = {};
	var json = {layers:[]};
	var active = app.project.activeItem; 
	//console.log(active);
	//console.log(active.numLayers);
	var layers = active.layers;
	var numLayers = active.numLayers;

	for(var i=1; i<=numLayers;i++){
		var layer = layers[i]; console.log(i, ' ', layer, ' ', layer.name);
		jsonLayer = {
			name:layer.name,
			keys:{},
		};
		var transform = layer['Transform'];
		
		var allKeys = getAllKeys();
		/*console.log(
			allKeys.map(function(val){
				return Math.round(val * FRAMERATE);
			})
		);*/
		
		var prevKey = null;
		for (var r=0;r<allKeys.length;r++){
			var key = allKeys[r];
			jsonLayer.keys[Math.round(key * FRAMERATE)] = {};
			//globalKeys[Math.round(key * FRAMERATE)] = {};
			//console.log('current ', Math.round(key * FRAMERATE));
			
			for (var d=0;d<TRANSFORM_USEFULL.length;d++){
				var propId = TRANSFORM_USEFULL[d];
				var prop = transform.property(propId);
				var val = prop.valueAtTime(key, true);
				//addKey(globalKeys, 0, propId, prop.valueAtTime(0, true));
				if(prevKey !== null){
					var prevVal = prop.valueAtTime(prevKey, true);
				}
				
				//console.log(prevVal, ' ', val, ' ', JSON.stringify(prevVal) == JSON.stringify(val));
				
				//if(prevKey == null || JSON.stringify(prevVal) !== JSON.stringify(val)){
					addKey(jsonLayer.keys, key, propId, val);
				//}
				
			};
			
			prevKey = key;
		};

		var ret = [];
		var keys = Object.keys(jsonLayer.keys);
		var oldKeys = Object.keys(jsonLayer.keys);
		
		/*keys = keys.forEach(function(val){
			return val*1;
		});*/
		for (var k=0; k<keys.length;k++){
			keys[k] = parseInt(keys[k]);
		}
		
		//console.log(keys);
		//keys = keys.sort();
		console.log(keys);
		var prevKey = 0;
		for (var g=0; g<keys.length;g++){
			ret.push([
				jsonLayer.keys[keys[g]], 
				keys[g]*1-prevKey,
			]);
			prevKey = keys[g]*1;
		}
		
		jsonLayer.keys = ret;
		jsonLayer.oldKeys = oldKeys;
		json.layers.push(jsonLayer);
	}


	//var jstr = JSON.stringify(ret, true, ' ');
	return json;
	//return jstr;
}


module.exports = aeGetLayersTransform;