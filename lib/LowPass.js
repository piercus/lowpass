var stream = require('stream');
var util = require('util');

// node v0.10+ use native Transform, else polyfill
var Transform = stream.Transform ||
  require('readable-stream').Transform;

function LowPass(options) {
  // allow use without new
  if (!(this instanceof LowPass)) {
    return new LowPass(options);
  }

  if(typeof(options.format)!== "object"){
    throw("options.format is a mandatory options for LowPass")
  }

  if(options.movAvLength && options.cutoffFreq){
    throw("options.movAvLength && options.cutoffFreq cannot be set simultanously")
  }


  if(options.cutoffFreq){
    if(typeof(options.cutoffFreq) !== "number") {
      throw("options.cutoffFreq must be a number")
    }
    var normFreq = options.cutoffFreq/options.format.sampleRate;
    
    // http://dsp.stackexchange.com/questions/9966/what-is-the-cut-off-frequency-of-a-moving-average-filter
    this.movAvLength = Math.floor(Math.sqrt(0.196196+normFreq*normFreq)/normFreq);
  } else {
    this.movAvLength = options.movAvLength || 128;
  }

  this.bitDepth = options.format.bitDepth;
  this.endianness = options.format.endianness;
  this.ratioByte = this.bitDepth/8;
  this.lastChunk = 0; 

  this.movAverageBuf = new Array(this.movAvLength*this.ratioByte);

  // init Transform
  Transform.call(this, options);
}

util.inherits(LowPass, Transform);

LowPass.prototype._transform = function (chunk, enc, cb) {
  
  var buf = new Buffer(chunk.length);

  for (var i = 0; i < chunk.length/this.ratioByte; i++){
    var inMob = Math.floor(chunk['readInt'+this.bitDepth+this.endianness](this.ratioByte*i)/this.movAvLength);

    var outMob = this.movAverageBuf.shift();

    this.movAverageBuf[this.movAvLength-1] = inMob;

    //console.log(this.lastChunk,inMob,outMob, inMob+outMob, 0+inMob-outMob);

    buf['writeInt'+this.bitDepth+this.endianness](this.lastChunk+inMob-outMob, this.ratioByte*i);

    this.lastChunk = (this.lastChunk||0)+inMob-outMob;
  } 

  //this.offset = this.offset + this.ratioByte*i;
  
  this.push(buf);

  cb();
  return
};

module.exports = LowPass;