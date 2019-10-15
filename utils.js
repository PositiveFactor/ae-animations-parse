function shrinkArrToString(arr){
  var strs = [];
  strs.push('[');
  var len = arr.length;
  arr.forEach(function(item, index){
    var endStr = index < len-1 ? ',' : '';
    strs.push(`\t${JSON.stringify(item).replace(/,/gm, ', ')}${endStr}`);
  })
  strs.push(']');

  return strs.join('\n');
}

module.exports.shrinkArrToString = shrinkArrToString;
