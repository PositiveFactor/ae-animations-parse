const output = require('./../outputMethods/outputCoinsMethods');

function parseFallingCoins(){
	var json = ae(aeGetFallingCoinsDef);
	var str = '';
	for (var i=0;i<json.length;i++){
		str += JSON.stringify(json[i]);
		str += ',\n';
	}

	var filename = 'falling_coins.anim';
    var data = str;
	writeFile(filename, data);
}

function parseCoins(filename){
	var aeJSON = ae(aeGetCoinsDef);
  var fnameJSON = `coins_def/${filename}.json`;
  var fname = `coins_def/${filename}.anim`;

  writeFile(fnameJSON, JSON.stringify(aeJSON, null, '  '));
	writeFile(fname, output.coinsTrail(aeJSON));
}

function initCli(program){
  program
    .command('coins [filename]')
    .alias('c')
    .description('parse coins bezier paths.')
    .action(parseCoins)

  program
    .command('fallingcoin')
    .alias('fc')
    .description('parse falling coins.')
    .action(parseFallingCoins)
}

module.exports.initCli = initCli;
