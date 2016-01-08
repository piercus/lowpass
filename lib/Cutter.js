var Parser = require('stream-parser');
var inherits = require('util').inherits;
var Transform = require('stream').Transform;

// create a Transform stream subclass
function Cutter(options) {
  // allow use without new
  if (!(this instanceof Cutter)) {
    return new Cutter(options);
  }

  if(typeof(options.format)!== "object"){
    throw("options.format is a mandatory options for Cutter")
  }

  this.start = options.start;
  this.end = options.end;

  this.bitDepth = options.format.bitDepth;
  this.sampleRate = options.format.sampleRate;
  this.channels = options.format.channels;
  this.endianness = options.format.endianness;
  this.ratioByte = this.bitDepth/8;

  var multiplier = this.sampleRate*this.channels*this.ratioByte;

  console.log(this.start*multiplier, this.start, multiplier)

  // buffer the first 8 bytes written
  this._skipBytes(this.start*multiplier, function(chunk){
    this._passthrough((this.end-this.start)*multiplier,function(chunk, enc, cb){
      this._skipBytes(Infinity);
    })
  });
}
inherits(Cutter , Transform);

// mixin stream-parser into MyParser's `prototype`
Parser(Cutter.prototype);

module.exports = Cutter;