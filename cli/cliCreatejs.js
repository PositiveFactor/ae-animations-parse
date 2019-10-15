const output = require('./../outputMethods/outputCjsMethods');

function initCli(program){
  program
    .command('mult [filename]')
    .alias('p')
    .description('create ".anim" file from ".json". EXPERIMENTAL')
    .action(getMultDef)

  program
    .command('parse [filename]')
    .alias('p')
    .description('parse opened ae file to ".anim" file.')
    .action(parse)

  program
    .command('pp [layerIndex] [isFramed]')
    .description('parse opened ae file to ".anim" file.')
    .action(pp)
}

function getMultDef(filename){
	var file = fs.readFileSync(path.join('parsed', filename + '.json'));

	var json = JSON.parse(file);

	filename = filename + '.anim';
	writeFile(filename, output.cjsAdv(json));
}

function parse(filename){
	var aeJSON = ae.executeSync(aeGetLayersTransform);

	var filename = filename || 'default';
	var filenameJSON = filename + '.json';
	writeFile(filenameJSON, JSON.stringify(aeJSON, null, '  '));

	filename = filename + '.anim';
	writeFile(filename, output.cjs(aeJSON));
}

function pp(layerIndex, isFramed){
  var options = getOptions();

	var mycommand = new ae.Command(aeParseFramedLayer);
	var res = ae.executeSync(mycommand, layerIndex, isFramed === 'true', options);
	console.log(output.cjsLayer(res));
}


module.exports.initCli = initCli;
