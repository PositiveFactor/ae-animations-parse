function aeGetLayerDef(){
	var active = app.project.activeItem; 
	var layers = active.layers;
	var numLayers = active.numLayers;
	var ret = [];

	for(var i=1; i<=numLayers;i++){
		var layer = layers[i]; 
		ret.push(layer.name);
		console.log(i, ' ', layer.name);
		//var transform = layer['Transform'];
	}
	return ret;
}

module.exports = aeGetLayerDef;