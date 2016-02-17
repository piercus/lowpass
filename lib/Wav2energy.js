var stream = require('stream');
var util = require('util');

// node v0.10+ use native Transform, else polyfill
var Transform = require("./WavTransform.js");

function Wav2energy(options) {
  // allow use without new
  if (!(this instanceof Wav2energy)) {
    return new Wav2energy(options);
  }

  // init Transform
  Transform.call(this, options);

  this.energyWindow = options.energyWindow || 1; //default is 1 second energy window
  this.nBytesWindow = Math.floor(this.energyWindow*this.sampleRate);
  this.eWindow = new Array(this.nBytesWindow);
  this.counter = 0; 
  this.sum = 0;

}

util.inherits(Wav2energy, Transform);

Wav2energy.prototype._transform = function (chunk, enc, cb) {
  
  var buf = new Buffer(chunk.length);

  var isBufPushed = false;

  for (var i = 0; i < chunk.length/this.byteDepth/this.channels; i++){
    var signal = [];
    
    /*this.push(chunk);
    return cb();*/

    for(var c = 0; c < this.channels; c++){
      var v = chunk['readInt'+this.bitDepth+this.endianness](this.byteDepth*(i*this.channels+c));
      this.sum += Math.floor(Math.abs(v*v)/this.channels);
    }
    
    this.counter++;

    var index = this.counter%this.nBytesWindow;
        
    if(index === this.nBytesWindow-1){
      var buf = new Buffer(this.byteDepth);
      var v = Math.sqrt(Math.floor(this.sum/this.sampleRate));
      buf['writeInt'+this.bitDepth+this.endianness](v);
      this.push(buf);
      this.sum = 0;
    }

  } 
  cb();
};

module.exports = Wav2energy;