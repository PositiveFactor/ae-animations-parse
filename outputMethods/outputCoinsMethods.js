// legacy, useless

function coinsTrail(aeJSON){
  var str = '';
	for (var i=0;i<aeJSON.length;i++){
    var out = aeJSON[i];
    if(out.def){
      str += `${out.layername} ${out.def},\n`;
    }
    else{



      var sp = out.layername.split(' ');
      var color = sp[0];

      if(color === 'green'){
        color = 'brown';
      }

      if(color === 'red'){
        color = 'green';
      }

      if(out.effects === true && color === 'blue'){
        color = 'red';
      }

      str += `[ ${out.delay}, ${out.time}, ${out.initX}, ${out.initY}, `;
  		str += `${out.B1X}, ${out.B1Y}, ${out.B2X}, ${out.B2Y}, `;
  		str += `${out.finalX}, ${out.finalY}, ${out.initScale}, ${out.finalScale}, `;
  		str += `${out.initRotation}, ${out.targetRotation}, ${out.finalScale}, ${out.finalScale}, "${color}" ], // ${out.layerindex} ${color}\n`;
    }
	}
  return str;
}

// legacy
function coinsTrail2(){
	//str += '[	//   0    |  1   |   2   |   3   |  4  |  5  |  6  |  7  |   8    |   9    |    10     |     11     |      12      |      13'
	//str += '    // DELAY  | TIME | initX | initY | B1X | B1Y | B2X | B2Y | finalX | finalY | initScale | finalScale | initRotation | targetRotation'

	//str += '    [    0    ,  30  ,  881  ,  556  , 1094, 158 , 1604, 354 ,  1766  ,  1131  ,   0.6     ,   0.6      ,      29      ,      53 		], // 0'

	var TITLES = ["DELAY", "TIME", "initX", "initY", "B1X", "B1Y", "B2X", "B2Y", "finalX", "finalY", "initScale", "finalScale", "initRotation", "targetRotation"];
	var INDEXES = [];
	var W = 20;


	for (var t=0;t<TITLES.length;t++){
		var numFill = W - TITLES[t].length;
		var startFill = Math.floor(numFill/2);
		var endFill = numFill - startFill;
		TITLES[t] = TITLES[t].padStart(startFill);
		TITLES[t] = TITLES[t].padEnd(endFill);

		var index = (t).toString();
		numFill = W - index.length;
		startFill = Math.floor(numFill/2);
		endFill = numFill - startFill;
		index = index.padStart(startFill);
		index = index.padEnd(endFill);
		INDEXES[t] = index;
	}

	str += INDEXES.join('|');
	str += '\n';
	str += TITLES.join('|');
	str += '\n';

	console.log(str);
	return;

	var s = '';
	for (var r=0;r<json.length;r++){
		for (var t=0;t<TITLES.length;t++){
			var index = (t+1).toString();
			numFill = W - index.length;
			startFill = Math.floor(numFill/2);
			endFill = numFill - startFill;
			index = index.padStart(startFill);
			index = index.padEnd(endFill);
			INDEXES[t] = index;
		}
	}

    str = str + '\n';
    return str;
}

module.exports.coinsTrail = coinsTrail;
module.exports.coinsTrail2 = coinsTrail2;
