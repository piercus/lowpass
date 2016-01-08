node-wav
========
This module offers a fast and basic (moving average-based) low pass filter to be used with node-wav.


Installation
------------

Install through npm:

``` bash
$ npm install lowpass
```


Example
-------

Here's how you would use the lowpass filter on a standard PCM WAVE file out of the speakers using 
`node-wav` and `node-speaker`:

``` javascript
var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('lowpass');

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

### LowPass())

The `LowPass` class accepts the data from node-wav  outputs the raw
audio data transformed by the low pass.

it has the following options :
``` javascript

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


