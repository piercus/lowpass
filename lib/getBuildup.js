
var splitProgresses = require("./splitProgresses.js");
var EnergyDetectRun = require("./EnergyDetectRun.js");


//util function
var updateBuildUp = function(candidates, max, thres){
  for(var c = 0; c < candidates.length; c++){
    if(candidates[c].value > max*thres){
      return candidates[c];
    }
  }
};

//recursive function

var buildEnergyDetectRun = function(options){
  var tIntervals = options.tIntervals, 
      filename = options.filename, 
      prevBuildUp = options.buildUp, 
      buildUpThres = options.treshold, 
      progressCb = options.progressCb, 
      callback = options.callback,
      duration = options.duration;

  var l = tIntervals.length;
  
  if(l === 0){
    return callback(null, prevBuildUp);
  }

  var tInterval = tIntervals.shift();
  var range = null;

  if(prevBuildUp){
    range = [prevBuildUp.datetime-prevBuildUp.tInterval, prevBuildUp.datetime+prevBuildUp.tInterval];
  }

  var ratio = 100/l;
  progressCbs = splitProgresses(progressCb, [ratio, 100-ratio]);

  var eRun = new EnergyDetectRun({
      tInterval : tInterval,
      filename : filename,
      range : range,
      duration : duration,
      progressCb : progressCbs[0]
    });

  this.buildUpThres = options.buildUpThres || 0.8;

  this.maxEner = 0;
  this.maxEnerIndex = null;
  this.buildUpCandidates = [];
  this.tInterval = tInterval;

  eRun.on("data", function(energy){
   if(energy > this.maxEner){
      this.maxEner = energy;
      this.maxEnerIndex = this.index;
      
      this.buildUpCandidates.push({
        value : energy,
        tInterval : this.tInterval,
        datetime : eRun.index*this.tInterval+(eRun.range ? eRun.range[0] : 0)
      });
    }
  }.bind(this));

  eRun.on("end", function(){

    var buildUp = updateBuildUp(this.buildUpCandidates, this.maxEner, this.buildUpThres);

    buildEnergyDetectRun({
      tIntervals : tIntervals, 
      filename : filename, 
      buildUp : buildUp, 
      threshold : buildUpThres, 
      progressCb : progressCbs[1],
      callback : callback
    });
    
  }.bind(this));

};

module.exports = function(options, callback){
  var tIntervals = options.tIntervals || [1, 0.05];
  var filename = options.filename;
  var progressCb = options.progressCb;

  if(progressCb){
    progressCb(0);
  }

  buildEnergyDetectRun({
      tIntervals : tIntervals, 
      filename : filename, 
      buildUp : null, 
      duration : options.duration, 
      progressCb : progressCb, 
      callback : function(err,o){
        callback(err,o);
      }
  });

};




// the "format" event gets emitted at the end of the WAVE header
