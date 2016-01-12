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

  var multiplier = this.sampleRate*this.channels*this.byteDepth;

  // buffer the first 8 bytes written
  this._skipBytes(this.startSec*multiplier, function(chunk){
    this._passthrough((this.endSec-this.startSec)*multiplier,function(){
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