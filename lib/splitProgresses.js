module.exports = function(cb, weights) {
  var start =0, end = weights[0], fns = [];
  for(var i = 0; i < weights.length; i++){

    (function(s,e){

        fns.push((function(localProg) {
            return cb(Math.round(localProg*(e-s)/100+s))
        }))

    })(start, end);
    start = end;
    end += weights[i];
  }

  return fns;
  
};
