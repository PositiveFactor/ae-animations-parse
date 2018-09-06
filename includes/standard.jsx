

$.global.isInt(n){
	return Number(n) === n && n % 1 === 0;
}

$.global.isFloat(n){
	return Number(n) === n && n % 1 !== 0;
}

$.global.cropValue(val){
	return Math.floor((val)*100) / 100;
}
	
$.global.parseTime(rawTime){
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
	
$.global.getEffects(layer){
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