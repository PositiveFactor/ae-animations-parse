if (typeof consts != 'object') {
	$.global.consts = (function(){

		return {
			INTERPOLATIONS: (function() {
        var obj = {};
        obj[KeyframeInterpolationType.LINEAR] = "LINEAR";
        obj[KeyframeInterpolationType.BEZIER] = "BEZIER";
        obj[KeyframeInterpolationType.HOLD] = "HOLD";
				return obj;
			})(),
			TRANSFORM_USEFULL: [1, 2, 6, 10, 11]
			}
		};
	})();
}


// var TRANSFORM_USEFULL = [1, 2, 6, 10, 11];

/*
var TRANSFORM_PROPERTY_NAMES = {
  "1": {alias: 'reg', name:["regX", "regY"], mult:positionCoefficient}, 	// 1
  "2": {alias: 'position', name:["x", "y"], mult:positionCoefficient},					// 2
  "6": {alias: 'scale', name:["scaleX", "scaleY"], mult:0.01*scaleMult}, 		// 6
  "10": {alias: 'rotation', name:"rotation"}, 																	// 10
  "11": {alias: 'alpha', name:"alpha", mult:0.01},													// 11
};
*/


/*
var INTERPOLATIONS = {};
INTERPOLATIONS[KeyframeInterpolationType.LINEAR] = "LINEAR";
INTERPOLATIONS[KeyframeInterpolationType.BEZIER] = "BEZIER";
INTERPOLATIONS[KeyframeInterpolationType.HOLD] = "HOLD";
*/

/*var DEFAULTS = {
  rotation:0,
  alpha:1,
  regX:0, regY:0,
  x:0, y:0,
  scaleX:1, scaleY:1,
}*/
