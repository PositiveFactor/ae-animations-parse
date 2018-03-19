'use strict'

function compareKeyframes(a, b) {
  return a.key - b.key;
}

function _tr2(jsonLayer){
  jsonLayer.keys = Object.keys(jsonLayer.keys)
    .map( function(k){ return {key:k*1, tf:jsonLayer.keys[k]} })
    .sort(compareKeyframes);
  return jsonLayer;
}

function getViewKeyframe(keyframe){
  var seconds = Math.floor(keyframe / 30);
  var frames = keyframe % 30;
  return `${seconds}:${frames}`;
}

// output like createjs animation definition.
function cjs(aeJSON){
  var str = '';
	var layers = aeJSON.layers;
	for (var i=0;i<aeJSON.layers.length;i++){
    var layer = _tr2(aeJSON.layers[i]);
    //var layer = aeJSON.layers[i];
		var name = layer.name;
    var index = layer.index;
		var keys = layer.keys;
		var oldKeys = layer.oldKeys;
		var absKey = 0;
    var prevKey = keys[0].key;

    str += `${index} ${name}\ncreatejs.Tween.get( this._fContainer_cjc, {useTicks:true})\n`;

		for(var j=0;j<keys.length;j++) {
			var isLastKey = j===keys.length-1;
      var ending = isLastKey ? '' : '\n';
      var paramsString = JSON.stringify(keys[j].tf);
      var keyframe = keys[j].key;
      var duration = (keyframe-prevKey);
      var viewKeyframe = `${getViewKeyframe(prevKey)}->${getViewKeyframe(keyframe)} [${duration}*2]`;
      str += `\t.to(${paramsString}, ${duration*2}) //\t${viewKeyframe}${ending}`;
			absKey += duration;
      prevKey = keyframe;
		}
		str += '\n\n';
	}
	str += '\n';

  return str;
}


module.exports.cjs = cjs;
