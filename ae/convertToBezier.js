// I found a script that converts the influence and speed of keyframes into cubic-bezier points here:
// https://forums.adobe.com/thread/1471138
// It's really helped me out a lot for translating motion curves to web and app developers.
// -Manny
function getCubicbeziers(){
  var curItem = app.project.activeItem;
  var selectedLayers = curItem.selectedLayers;
  var selectedProperties = app.project.activeItem.selectedProperties;

  if (selectedLayers == 0){
    console.log("Please Select at least one Layer");
  }
  else if(selectedLayers !=0){
    for (var i = 0; i < selectedLayers.length; i++){
      for (var f in selectedProperties){
        var currentProperty = selectedProperties[f];
        console.log('currentProperty.name ', currentProperty.name);
        if (currentProperty.numKeys > 1){

          for(var i = 1; i < currentProperty.numKeys; i++){
            var wait = false;
            var t1 = currentProperty.keyTime(i);
            var t2 = currentProperty.keyTime(i+1);
            var val1 = currentProperty.keyValue(i)[0];
            var val2 = currentProperty.keyValue(i+1)[0];
            var delta_t = t2-t1;
            var delta = val2-val1;
            avSpeed = Math.abs(val2-val1)/(t2-t1);
            /*console.log('val1: ', val1);
            console.log('val2: ', val2);
            console.log('t2: ', t2);
            console.log('t1: ', t1);*/
            /*console.log('delta_t: ', delta_t);
            console.log('delta: ', delta);
            console.log('avSpeed: ', avSpeed);*/

            if (val1<val2){//, this should reproduce your website:
              x1 = currentProperty.keyOutTemporalEase(i)[0].influence /100;
              y1 = x1*currentProperty.keyOutTemporalEase(i)[0].speed / avSpeed;
              x2 = 1-currentProperty.keyInTemporalEase(i+1)[0].influence /100;
              y2 = 1-(1-x2)*(currentProperty.keyInTemporalEase(i+1)[0].speed / avSpeed);
            }
            if (val2<val1){//, to get a curve starting from point [0,1] going to point [1,0], it would be:
              x1 = currentProperty.keyOutTemporalEase(i)[0].influence /100;
              y1 = (-x1)*currentProperty.keyOutTemporalEase(i)[0].speed / avSpeed;
              x2 = currentProperty.keyInTemporalEase(i+1)[0].influence /100;
              y2 = 1+x2*(currentProperty.keyInTemporalEase(i+1)[0].speed / avSpeed);
              x2 = 1-x2;
            }
            if (val1==val2){
              var wait = true;
              // x1 = currentProperty.keyOutTemporalEase(i)[0].influence /100;
              // y1 = (-x1)*currentProperty.keyOutTemporalEase(i)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2-t1)) ;
              // x2 = currentProperty.keyInTemporalEase(i+1)[0].influence /100;
              // y2 = 1+x2*(currentProperty.keyInTemporalEase(i+1)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2-t1)));
              // x2 = 1-x2;

            }
            if(wait){
              console.log("wait: " + delta_t);
            }
            else{
              console.log("keyframe: " + i +" Cubic-bezier[" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + "]");
            }

          }
        }
        else{
          console.log('something wrong');
        }
      }
    }
  }

return {};
}

module.exports = getCubicbeziers;
