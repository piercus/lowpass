var stream = require('stream');
var util = require('util');

// node v0.10+ use native Transform, else polyfill
var Transform = stream.Transform ||
  require('readable-stream').Transform;

function WavTransform(options) {
  // allow use without new
  if (!(this instanceof WavTransform)) {
    return new WavTransform(options);
  }

  if(typeof(options.format)!== "object"){
    throw("options.format is a mandatory options for LowPass")
  }

  if(options.format.endianness){
    if(options.format.endianness !== "LE" && options.format.endianness !== "BE"){
      throw("options.format.endianness must be 'LE' or 'GE'")
    }
    if(options.format.bitDepth == 8){
      this.endianness = "";
    } else {
      this.endianness = options.format.endianness;
    }
  } else {
    this.endianness = "LE";
  }

  if(options.format.bitDepth !== 8 && options.format.bitDepth !== 16 && options.format.bitDepth !== 32){
    throw("options.format.bitDepth must be 8 or 16 or 32")
  }

  this.bitDepth = options.format.bitDepth;
  this.byteDepth = this.bitDepth/8;
  this.channels = options.format.channels;
  this.sampleRate = options.format.sampleRate;
  // init Transform
  Transform.call(this, options);

};


util.inherits(WavTransform, Transform);

WavTransform.prototype.readWavBuf = function(chunk, offset){
  return chunk['readInt'+this.bitDepth+this.endianness](this.byteDepth*offset);
};

WavTransform.prototype.writeWavBuf = function(buffer, chunk, offset){
  return buffer['writeInt'+this.bitDepth+this.endianness](chunk, this.byteDepth*offset);
};

module.exports = WavTransform;
