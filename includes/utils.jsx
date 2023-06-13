
if (typeof utils != 'object') {
	$.global.utils = (function(){

		return {
			isInt: function(n) {
					return Number(n) === n && n % 1 === 0;
			},
			isFloat: function(n) {
				return Number(n) === n && n % 1 !== 0;
			},
      // crop decimal values
      cropValue: function(n) {
				return Math.floor((n)*1000) / 1000;
			},
      parseTime: function(rawTime) {
        var fullframes = Math.floor(rawTime*FRAMERATE);
    		var seconds = Math.floor(fullframes / FRAMERATE);
    		var frames = Math.floor(fullframes % FRAMERATE);
    		return {
    			seconds:seconds,
    			frames:frames,
    			fullframes:fullframes,
    			str: String(seconds)  + ':' + String(frames)
    		}
      },
      getEffects: function(layer) {
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
		};
	})();
}
