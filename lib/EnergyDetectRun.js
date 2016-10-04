var LowPass = require("./LowPass.js");
var Wav2energy = require("./Wav2energy.js");
var Cutter = require("./Cutter.js");
var fs = require("fs");
var path = require("path")
var wav = require("wav");
var lame = require("lame");
var util= require("util");
var Writable = require('stream').Writable;
//util function
var EnergyDetectRun = function(options){
  this.tInterval = options.tInterval;
  this.range = options.range;

  this.movAvLength = options.movAvLength || 256;

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

  // init Writable Stream
  Writable.call(this, options);

  this.fileStream = fs.createReadStream(options.filename);
  this.fileSizeInBytes = fs.statSync(options.filename)["size"];

  if(path.extname(options.filename) === ".wav"){
    this.extension = "wav";
    this.decoder = wav.Reader();
    this.fileStream.pipe(this.decoder);
  } else if(path.extname(options.filename) === ".mp3"){
    this.extension = "mp3";
    this.decoder = lame.Decoder();
    this.fileStream.pipe(this.decoder);
  } else {
    throw(options.filename+ " extension must be mp3 or Wav");
  }

  this.index = 0;

  this.decoder.on("format", this.onFormat.bind(this));
};

util.inherits(EnergyDetectRun, Writable);

EnergyDetectRun.prototype.onFormat = function(format){

  this.ener = new Wav2energy({
      format : format,
      energyWindow : this.tInterval
  });

  this.lowpass = new LowPass({
    format : format,
    movAvLength : this.movAvLength
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

EnergyDetectRun.prototype.onData = function(chunk){
  this.tick();
  this.index++;
  var energy = chunk['readInt'+this.ener.bitDepth+this.ener.endianness](0);

  this.emit("data", energy);

/*


  */
};

EnergyDetectRun.prototype.tick = function(){
  if(this.progressCb){
    this.progressCb((this.index*this.tInterval)/this.duration*100);
  }

};

EnergyDetectRun.prototype.onEnd = function(){
  this.emit("end");
//  var buildUp = updateBuildUp(this.buildUpCandidates, this.maxEner, this.buildUpThres);
//  this.callback(null, buildUp);
};


EnergyDetectRun.prototype.onError = function(){
  this.emit("error");
};

module.exports = EnergyDetectRun;
