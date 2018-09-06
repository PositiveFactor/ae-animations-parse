

function getFramedLayer(layerNum) {	
	console.log('layerNum:', layerNum);
	
	var KOEF = 1780/1920;
	var FRAMERATE = 30;
	var TRANSFORM_USEFULL_KEYS = [1,2,6,10,11];
	var TRANSFORM_PROPERTY_NAMES = {
		"1": {alias:'reg', name:["regX", "regY"], mult:KOEF}, 		// 1
		"2": {alias:'position', name:["x", "y"], mult:KOEF},			// 2
		"6": {alias:'scale', name:["scaleX", "scaleY"], mult:0.01}, 	// 6
		"10": {alias:'rotation', name:"rotation"}, 			// 10
		"11": {alias:'alpha', name:"alpha", mult:0.01},				// 11
	};
	
	
	return layerNum;
}

module.exports = getFramedLayer;


