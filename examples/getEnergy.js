var getEnergy = require('../').getEnergy;
var getAudioDuration = require('../').getAudioDuration;

var filename = "input.mp3";

var ProgressBar = require('progress');
var bar = new ProgressBar(':bar :percent', { total: 100 });
var lastProgress = 0;
getAudioDuration(filename,function(err, duration){

    if(err){
      throw(err);
    }

    getEnergy({
        filename : filename,
        duration : 78-25,
        movAvLength : 256,
        range : [25, 78],//only work on 25s to 78s on the song
        tInterval : 0.89,//0.89 s per window
        progressCb : function(p){
          var diff = Math.floor(p-lastProgress);
          if(diff > 0){
            bar.tick(diff);
            lastProgress = p;
          }
        }
      },function(err, energies){

        if(err){
          throw(err);
        }

        console.log(energies);

    });
});

