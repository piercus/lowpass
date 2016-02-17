var Parser = require('stream-parser');
var inherits = require('util').inherits;
var Transform = require('./WavTransform.js');

// create a Transform stream subclass
function Cutter(options) {
  // allow use without new
  if (!(this instanceof Cutter)) {
    return new Cutter(options);
  }

  Transform.call(this, options);

  this.startSec = options.startSec;
  this.endSec = options.endSec;

  var multiplier = this.channels*this.byteDepth;

  // buffer the first 8 bytes written
  this._skipBytes(Math.floor(this.startSec*this.sampleRate)*multiplier, function(chunk){
    this._passthrough(Math.floor((this.endSec-this.startSec)*this.sampleRate)*multiplier,function(){
     // that.end();
      this._skipBytes(Infinity);
      this.emit("endCut");
    })
  });
}
inherits(Cutter , Transform);

// mixin stream-parser into MyParser's `prototype`
Parser(Cutter.prototype);

module.exports = Cutter;