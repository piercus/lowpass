var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('../').LowPass;

var file = fs.createReadStream('input.mp3');
var lame = require('lame');

var speaker, lowpass;

// start reading the MP3 file from the input
var decoder = new lame.Decoder();

// we have to wait for the "format" event before we can start encoding
decoder.on('format', onFormat);

// and start transferring the data
file.pipe(decoder);

function onFormat (format) {
  speaker = new Speaker(format);

  lowPass = new LowPass({
  	format : format
  });

  // write the decoded MP3 into the lowpass filter then the speaker
  decoder.pipe(lowPass).pipe(speaker);
};