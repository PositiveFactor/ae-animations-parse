// {
//   "1": "layer1name",
//   "2": "layer2name",
//   "3": "layer3name",
//   ...
// }

function aeGetLayers() {
	var layers = [];
	var active = app.project.activeItem;
	var sceneLayers = active.layers;
	var numLayers = active.numLayers;

	for(var i=1; i<=numLayers;i++){
		var layer = sceneLayers[i];
		layers.push({index:i, name:layer.name});
	}

	return layers;
}

module.exports = aeGetLayers;
