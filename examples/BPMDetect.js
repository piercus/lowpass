var getBPM = require("../").getBPM;

getBPM("input.mp3", function(err,o){
	if(err){
		console.log("error ",err);
		return
	}
	console.log("BPM is",o);
})