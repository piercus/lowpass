var probe = require('node-ffprobe');

var getAudioDuration  = function(track, cb){
	probe(track, function(err, probeData) {
    	if(err){
    		return cb(err);
    	} else if(probeData.format.duration) {
    		return cb(null, probeData.format.duration)
    	} else {
    		return cb(new Error("no duration found"));
    	}

	});
};

module.exports = getAudioDuration;