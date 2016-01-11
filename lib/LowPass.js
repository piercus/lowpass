var stream = require('stream');
var util = require('util');
var WavTransform = require('./WavTransform.js');

// node v0.10+ use native Transform, else polyfill
var Transform = WavTransform;

function LowPass(options) {
  // allow use without new
  if (!(this instanceof LowPass)) {
    return new LowPass(options);
  }

  // init WavTransform
  Transform.call(this, options);

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

  this.lastChunk = 0; 

  this.movAverageBuf = new Array(this.movAvLength*this.byteDepth);
};

util.inherits(LowPass, Transform);

LowPass.prototype._transform = function (chunk, enc, cb) {
  
  var buf = new Buffer(chunk.length);

  for (var i = 0; i < chunk.length/this.byteDepth; i++){
    var inMob = Math.floor(this.readWavBuf(chunk,i)/this.movAvLength);
    var outMob = this.movAverageBuf.shift() || 0;
    this.movAverageBuf[this.movAvLength-1] = inMob;

    this.writeWavBuf(buf, this.lastChunk+inMob-outMob, i);

    this.lastChunk = (this.lastChunk||0)+inMob-outMob;
  } 

  this.push(buf);

  cb();
  return
};

module.exports = LowPass;