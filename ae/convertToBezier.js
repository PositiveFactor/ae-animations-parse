// I found a script that converts the influence and speed of keyframes into cubic-bezier points here:
// https://forums.adobe.com/thread/1471138
// It's really helped me out a lot for translating motion curves to web and app developers.
// -Manny
//
//
//
// https://gist.github.com/roelvanhintum/13e106fe757724d86cf37a195d03f43d

/*BezierEasing.css = {
    "ease":        BezierEasing(0.25, 0.1, 0.25, 1.0),
    "linear":      BezierEasing(0.00, 0.0, 1.00, 1.0),
    "ease-in":     BezierEasing(0.42, 0.0, 1.00, 1.0),
    "ease-out":    BezierEasing(0.00, 0.0, 0.58, 1.0),
    "ease-in-out": BezierEasing(0.42, 0.0, 0.58, 1.0)
  };
*/

// keyframe: 1 Cubic-bezier[0.16666666667, 0.16666666667, 0.83333333333, 0.83333333333]

function getCubicbeziers(layerIndex, propId){
  var curItem = app.project.activeItem;
  var selectedLayers = curItem.selectedLayers;
  var selectedProperties = app.project.activeItem.selectedProperties;

  var active = app.project.activeItem;
	var layers = active.layers;
  var layer = layers[layerIndex];

    var transform = layer['Transform'];
    var currentProperty = transform.property(propId);
    console.log('currentProperty.name ', currentProperty.name);
    console.log('currentProperty.numKeys ', currentProperty.numKeys);
    if (currentProperty.numKeys > 1){

      for(var i = 1; i < currentProperty.numKeys; i++){
        var wait = false;
        var t1 = currentProperty.keyTime(i);
        var t2 = currentProperty.keyTime(i+1);
        var val1 = currentProperty.keyValue(i);
        var val2 = currentProperty.keyValue(i+1);
        var delta_t = t2-t1;
        var delta = val2-val1;
        avSpeed = Math.abs(val2-val1)/(t2-t1);
        /*console.log('val1: ', val1);
        console.log('val2: ', val2);
        console.log('t2: ', t2);
        console.log('t1: ', t1);
        console.log('delta_t: ', delta_t);
        console.log('delta: ', delta);
        console.log('avSpeed: ', avSpeed);*/

        if (val1<val2){//, this should reproduce your website:
          x1 = currentProperty.keyOutTemporalEase(i)[0].influence / 100;
          y1 = x1*currentProperty.keyOutTemporalEase(i)[0].speed / avSpeed;

          x2 = 1-currentProperty.keyInTemporalEase(i+1)[0].influence / 100;
          y2 = 1-(1-x2)*(currentProperty.keyInTemporalEase(i+1)[0].speed / avSpeed);
        }
        if (val2<val1){//, to get a curve starting from point [0,1] going to point [1,0], it would be:
          x1 = currentProperty.keyOutTemporalEase(i)[0].influence / 100;
          y1 = (-x1)*currentProperty.keyOutTemporalEase(i)[0].speed / avSpeed;

          x2 = currentProperty.keyInTemporalEase(i+1)[0].influence / 100;
          y2 = 1+x2*(currentProperty.keyInTemporalEase(i+1)[0].speed / avSpeed);
          x2 = 1-x2;
        }
        if (val1==val2){
          var wait = true;
          x1 = currentProperty.keyOutTemporalEase(i)[0].influence / 100;
          y1 = (-x1) * currentProperty.keyOutTemporalEase(i)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2 - t1));
          x2 = currentProperty.keyInTemporalEase(i + 1)[0].influence / 100;
          y2 = 1 + x2 * (currentProperty.keyInTemporalEase(i + 1)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2 - t1)));
          x2 = 1 - x2;

        }
        if(wait){
          console.log("wait: " + delta_t);
        }
        else{
          console.log("keyframe: " + i +" Cubic-bezier[" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + "]");
          return [Number(x1), Number(y1), Number(x2), Number(y2)];
        }

      }
    }
    else{
      console.log('something wrong');
    }

return {};
}

module.exports = getCubicbeziers;
