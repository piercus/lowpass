var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('../').LowPass;

var file = fs.createReadStream('input.wav');
var reader = new wav.Reader();

var speaker, lowpass;

// the "format" event gets emitted at the end of the WAVE header
reader.on('format', function (format) {
  speaker = new Speaker(format);
  lowPass = new LowPass({
  	format : format
  });

  reader.pipe(lowPass);
  lowPass.pipe(speaker);
});

file.pipe(reader);