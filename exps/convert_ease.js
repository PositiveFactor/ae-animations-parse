// Hi, did you get somewhere with this? Are you still looking?
// I'm on the same track you are.
// I got the answer for one dimensional properties, but I can't figure out how to extend it to multi dimensional ones.
// I started here but as far as I know, they made some mistakes.
// https://forums.adobe.com/thread/1361143
//
// This is what I got so far. It's a script, not an expression but should be the same. It works with properties like rotation, but not with position, or anchor point.
// For multidimensional properties I think the speed should be decomposed into each axis, but I'm not sure how.

key = {};
lastKey = {};
key.time = property.keyTime(2);
lastKey.time = property.keyTime(1);
key.value = property.keyValue(2);
lastKey.value = property.keyValue(1);
key.easeIn = {
	influence : property.keyInTemporalEase(2)[0].influence,
	speed : property.keyInTemporalEase(2)[0].speed
}
lastKey.easeOut = {
	influence : property.keyOutTemporalEase(1)[0].influence,
	speed : property.keyOutTemporalEase(1)[0].speed
}
duration = key.time - lastKey.time;
diff = key.value - lastKey.value;
averageSpeed = diff/duration;
bezierIn = {};
bezierOut = {};
bezierIn.x = 1 - key.easeIn.influence / 100;
bezierIn.y = 1 - (key.easeIn.speed / averageSpeed) * (key.easeIn.influence / 100);
bezierOut.x = lastKey.easeOut.influence / 100;
bezierOut.y = (lastKey.easeOut.speed / averageSpeed) * bezierOut.x;

///
//
// I'm really not sure about the mathematics, but I think something like this will work for conversion from speed to value graph.

var key, lastKey; // your keyframe objects
var duration = key.time - lastKey.time;
// only works for onedimensional properties, eg. rotation. maybe you have to use phytagoras for position, anchorpoint
var diff = Math.abs(key.value - lastKey.value);
var averageSpeed = diff / duration;

var bezierIn = {};
bezierIn.x = 1 - key.easeIn.influence / 100;
bezierIn.y = 1 - key.easeIn.speed / averageSpeed * bezierIn.x;

var bezierOut = {};
bezierOut.x = lastKey.easeOut.influence / 100;
bezierOut.y = lastKey.easeOut.speed / averageSpeed * bezierOut.x;

// now you should have the relative position (0-1) of the two bezier handels for the value graph.



// I found a script that converts the influence and speed of keyframes into cubic-bezier points here: 
// https://forums.adobe.com/thread/1471138
// It's really helped me out a lot for translating motion curves to web and app developers.
// -Manny
function getCubicbeziers(){
    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;
    var selectedProperties = app.project.activeItem.selectedProperties;
    if (selectedLayers == 0){
    alert("Please Select at least one Layer");
    }
    else if(selectedLayers !=0){
        for (var i = 0; i &lt; selectedLayers.length; i++){
            for (var f in selectedProperties){
                var currentProperty = selectedProperties[f];
                if (currentProperty.numKeys > 1){
                    for(var i = 1; i &lt; currentProperty.numKeys; i++){
                        var t1 = currentProperty.keyTime(i);
                        var t2 = currentProperty.keyTime(i+1);
                        var val1 = currentProperty.keyValue(i);
                        var val2 = currentProperty.keyValue(i+1);
                        var delta_t = t2-t1;
                        var delta = val2-val1;
                        avSpeed = Math.abs(val2-val1)/(t2-t1);

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
    x1 = currentProperty.keyOutTemporalEase(i)[0].influence /100;
    y1 = (-x1)*currentProperty.keyOutTemporalEase(i)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2-t1)) ;
    x2 = currentProperty.keyInTemporalEase(i+1)[0].influence /100;
    y2 = 1+x2*(currentProperty.keyInTemporalEase(i+1)[0].speed / ((currentProperty.maxValue-currentProperty.minValue)/(t2-t1)));
    x2 = 1-x2;
}
alert("keyframe: " + i +" Cubic-bezier["+x1+", "+y1 +", "+x2+", "+y2 +"]")


}
            }
        }
        }
    }


}
getCubicbeziers();
