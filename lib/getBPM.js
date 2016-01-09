var spawn = require('spawn');

var getBPM = function(wavFile, cb){
	spawn("soundstretch", ["-i",wavFile,"-bpm"], cb);	
};