var LowPass = require("./LowPass.js");
var Wav2energy = require("./Wav2energy.js");
var Cutter = require("./Cutter.js");
var splitProgresses = require("./splitProgresses.js");

var wav = require("wav");
var lame = require("lame");
var fs = require("fs");

//util function
var updateBuildUp = function(candidates, max, thres){
  for(var c = 0; c < candidates.length; c++){
    if(candidates[c].value > max*thres){
      return candidates[c];
    }
  }
};

//util function
var TrackingRun = function(options){
  this.callback = options.callback;
  this.tInterval = options.tInterval;

  this.fileStream = fs.createReadStream(options.filename);
  this.fileSizeInBytes = fs.statSync(options.filename)["size"];

  if(options.filename.split(".")[1] === "wav"){
    this.extension = "wav";
    this.decoder = wav.Reader();
  } else if(options.filename.split(".")[1] === "mp3"){
    this.extension = "mp3";
    this.decoder = lame.Decoder();
    this.fileStream.pipe(this.decoder);
  }

  this.buildUpThres = options.buildUpThres || 0.8;

  this.maxEner = 0;
  this.maxEnerIndex = null;

  this.range = options.range;

  this.index = 0;
    
  this.buildUpCandidates = [];

  this.decoder.on("format", this.onFormat.bind(this));
};


TrackingRun.prototype.onFormat = function(format){

  this.ener = new Wav2energy({
      format : format,
      energyWindow : this.tInterval
  });

  this.lowpass = new LowPass({
    format : format,
    movAvLength : 256
  });

  if(this.range){

    this.cutter = new Cutter({
      format : format,
      startSec : this.range[0],
      endSec : this.range[1]
    });

    this.decoder
      .pipe(this.cutter)
      .pipe(this.lowpass)
  } else {
    this.decoder
      .pipe(this.lowpass);

    this.range = [0,Infinity];
  }

  this.lowpass
    .pipe(this.ener)
    .on("data", this.onData.bind(this))
    .on("end", this.onEnd.bind(this));
};

TrackingRun.prototype.onData = function(chunk){
  this.index++;

  var energy = chunk['readInt'+this.ener.bitDepth+this.ener.endianness](0);
  
  if(energy > this.maxEner){
    this.maxEner = energy;
    this.maxEnerIndex = this.index;
    
    this.buildUpCandidates.push({
      value : energy,
      tInterval : this.tInterval,
      datetime : this.index*this.tInterval+this.range[0]
    });
  }
};

TrackingRun.prototype.onEnd = function(){
  var buildUp = updateBuildUp(this.buildUpCandidates, this.maxEner, this.buildUpThres);
  this.callback(null, buildUp);
};


TrackingRun.prototype.onError = function(){

};


//recursive function

var buildTrackingRun = function(tIntervals, filename, prevBuildUp, buildUpThres, progressFn, callback){

  var l = tIntervals.length;
  
  if(l === 0){
    return callback(null, prevBuildUp);
  }

  var tInterval = tIntervals.shift();
  var range = null;

  if(prevBuildUp){
    range = [prevBuildUp.datetime-prevBuildUp.tInterval, prevBuildUp.datetime+prevBuildUp.tInterval];
  }

  //var ratio = 100/l;
  //progressFns = splitProgresses(progressFn, [ratio, 100-ratio]);

  new TrackingRun({
      tInterval : tInterval,
      filename : filename,
      range : range,
      //progressFn : progressFns[0]
      callback : function(err, buildUp){
        
        if(err){
          return cb(err)
        }

        buildTrackingRun(tIntervals, filename, buildUp, buildUpThres, null, callback)
      }
  });

};

module.exports = function(options, callback){
  var tIntervals = options.tIntervals || [1, 0.05];
  var filename = options.filename;
  var progressFn = options.progressFn;
  if(progressFn){
    progressFn(0);
  }

  buildTrackingRun(tIntervals, filename, null, null, progressFn, function(err,o){
    if(progressFn){
      progressFn(100);
    }
    callback(err,o);

  });

};




// the "format" event gets emitted at the end of the WAVE header
