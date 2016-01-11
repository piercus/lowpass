var getBPM = require("../").getBPM;

getBPM("input.mp3", function(err,o){
	console.log(err,o);
})