var stream = require('stream');
var util = require('util');

// node v0.10+ use native Transform, else polyfill
var Transform = stream.Transform ||
  require('readable-stream').Transform;

function EnergyDetector(options) {
  // allow use without new
  if (!(this instanceof EnergyDetector)) {
    return new EnergyDetector(options);
  }

  if(typeof(options.format)!== "object"){
    throw("options.format is a mandatory options for EnergyDetector")
  }

  this.energyWindow = options.energyWindow || 1; //default is 1 second energy window

  this.bitDepth = options.format.bitDepth;
  this.endianness = options.format.endianness;
  this.ratioByte = this.bitDepth/8;
  this.lastChunk = 0; 
  this.sampleRate = options.format.sampleRate;
  this.channels = options.format.channels;

  this.start = options.start;
  this.end = options.end;

  this.nBytesWindow = this.energyWindow*this.sampleRate;

  this.eWindow = new Array(this.nBytesWindow), this.counter = 0, this.sum = 0;

  // init Transform
  Transform.call(this, options);
}

util.inherits(EnergyDetector, Transform);

EnergyDetector.prototype._transform = function (chunk, enc, cb) {
  
  var buf = new Buffer(chunk.length);

  var isBufPushed = false;

  for (var i = 0; i < chunk.length/this.ratioByte/this.channels; i++){
    var signal = [];
    
    /*this.push(chunk);
    return cb();*/

    for(var c = 0; c < this.channels; c++){
      var v = chunk['readInt'+this.bitDepth+this.endianness](this.ratioByte*(i*this.channels+c));
      this.sum += Math.floor(Math.abs(v*v)/this.channels);
    }
    
    this.counter++;

    var index = this.counter%this.nBytesWindow;
        
    if(index === this.nBytesWindow-1){
      var buf = new Buffer(this.ratioByte);
      var v = Math.sqrt(Math.floor(this.sum/this.sampleRate));
      //console.log(v,this.nBytesWindow);
      buf['writeInt'+this.bitDepth+this.endianness](v);
      this.push(buf);
      this.sum = 0;
      //isBufPushed = true;
    }

  } 
/*
  for (var i = 0; i < chunk.length/this.ratioByte; i++){
    this.counter++;
    var index = this.counter%this.nBytesWindow;
    
    var signal = chunk['readInt'+this.bitDepth+this.endianness](this.ratioByte*i);
    this.sum += Math.abs(signal);
    
    if(index === this.nBytesWindow-1){
      var buf = new Buffer(this.ratioByte);
      var v = Math.floor(this.sum/this.sampleRate);
      //console.log(v,this.nBytesWindow);
      buf['writeInt'+this.bitDepth+this.endianness](v);
      this.push(buf);
      this.sum = 0;
      isBufPushed = true;
    }

  } */
  //if(isBufPushed){
    cb();
  //}
};

module.exports = EnergyDetector;