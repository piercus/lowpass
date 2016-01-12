lowpass
========
Simple nodejs Audio manipulation library, based on [node-wav]

This module offers basics nodejs manipuji
* **LowPass** : fast and basic (moving average-based) low pass filter 
* **Cutter** : Basic Stream to handle mp3 streams
* **Wav2energy** : Transform 
* **getBPM** : [soundstretch] wrapper for nodejs
* **getBuildUp** : Build-up detection (when music energy is more than a defined threshold)

Combined with [node-lame] it can also manage mp3 files.

Installation
------------

Install through npm:

``` bash
$ npm install lowpass
```

Example
-------

Here's how you would use the lowpass filter on a standard PCM WAVE file out of the speakers using 
[node-wav] and [node-speaker] :

``` javascript
var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('lowpass').LowPass;

var file = fs.createReadStream('input1.wav');
var reader = new wav.Reader();

var speaker, lowpass;

// the "format" event gets emitted at the end of the WAVE header
reader.on('format', function (format) {
  speaker = new Speaker(format);
  lowPass = new LowPass({format : format});

  // the lowpass is piped between file reader and speaker
  reader.pipe(lowPass);
  lowPass.pipe(speaker);
});

// pipe the WAVE file to the Reader instance
file.pipe(reader);
```

Same example with mp3 file and the [node-lame] package

``` javascript
var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('lowpass').LowPass;

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
```


### LowPass()

The `LowPass` class accepts the data from node-wav  outputs the raw
audio data transformed by the low pass.

it has the following options :
``` javascript
var LowPass = require('lowpass').LowPass;

//First form
new LowPass({
	format : format, //format from node-wav, mandatory option
	movAvLength : 128 // moving average window
});

//Second Form
new LowPass({
	format : format, //format from node-wav, mandatory option
	movAvLength : 152 // Hz
});

```
By default the cut-off correspond to a 128 length moving average window. For a 44100 sampleRate, it is equivalent to 152Hz low pass filter.

### getBPM()

The `getBPM` function call [soundstretch] utility to get the BPM of a song.

``` javascript
var getBPM = require('lowpass').getBPM;

getBPM("input.wav", function(err, bpm){
	console.log("BPM is ", bpm);
});

```
Be carefull, [soundstretch] must be installed in your system.

### Other tools

See [examples]

Thanks
--------

Thanks to [TooTallNate] for the published libraries

[node-lame]: https://github.com/TooTallNate/node-lame
[node-wav]: https://github.com/TooTallNate/node-wav
[node-speaker]: https://github.com/TooTallNate/node-speaker
[examples]: https://github.com/piercus/lowpass/tree/master/examples
[TooTallNate]: https://github.com/TooTallNate
[soundstretch]: http://www.surina.net/soundtouch/soundstretch.html
