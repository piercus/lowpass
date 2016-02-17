var probe = require('node-ffprobe');
var LowPass = require("./LowPass.js");
var EnergyDetectRun = require("./EnergyDetectRun.js");

var getEnergy  = function(options, cb){
	var eRun = new EnergyDetectRun({
		filename : options.filename,
		progressCb : options.progressCb,
		range : options.range,
		duration : options.duration,
		tInterval : options.tInterval,
		movAvLength : options.movAvLength
	});

	var energies = [];

	eRun.on("data",function(e){
		energies.push(e);
	});

	eRun.on("error",function(e){
		console.log("error", e);
	});

	eRun.on("end",function(e){
		cb(null, energies);
	});
};

module.exports = getEnergy;