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
  this.range = options.range;

  this.duration = options.duration || (this.range ? this.range[1]-this.range[0] : null);

  //console.log(this.duration);

  if(options.progressCb){
    if(this.duration){
      this.progressCb = options.progressCb;
    } else {
      console.log(options);
      throw(new Error("cannot use progressCb without duration"));
    }
  }

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
  }

  this.lowpass
    .pipe(this.ener)
    .on("data", this.onData.bind(this))
    .on("end", this.onEnd.bind(this));
};

TrackingRun.prototype.onData = function(chunk){
  this.index++;

  var energy = chunk['readInt'+this.ener.bitDepth+this.ener.endianness](0);

  this.tick();

  if(energy > this.maxEner){
    this.maxEner = energy;
    this.maxEnerIndex = this.index;
    
    this.buildUpCandidates.push({
      value : energy,
      tInterval : this.tInterval,
      datetime : this.index*this.tInterval+(this.range ? this.range[0] : 0)
    });
  }
};

TrackingRun.prototype.tick = function(){
  if(this.progressCb){
    this.progressCb((this.index*this.tInterval)/this.duration*100);
  }

};

TrackingRun.prototype.onEnd = function(){
  var buildUp = updateBuildUp(this.buildUpCandidates, this.maxEner, this.buildUpThres);
  this.callback(null, buildUp);
};


TrackingRun.prototype.onError = function(){

};


//recursive function

var buildTrackingRun = function(options){
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

  new TrackingRun({
      tInterval : tInterval,
      filename : filename,
      range : range,
      duration : duration,
      progressCb : progressCbs[0],
      callback : function(err, buildUp){
        
        if(err){
          return cb(err)
        }

        buildTrackingRun({
          tIntervals : tIntervals, 
          filename : filename, 
          buildUp : buildUp, 
          threshold : buildUpThres, 
          callback : callback,
          progressCb : progressCbs[1]
        });
      }
  });

};

module.exports = function(options, callback){
  var tIntervals = options.tIntervals || [1, 0.05];
  var filename = options.filename;
  var progressCb = options.progressCb;

  if(progressCb){
    progressCb(0);
  }

  buildTrackingRun({
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
