var getBuildup = require('../').getBuildup;
var getAudioDuration = require('../').getAudioDuration;

var filename = "input.mp3";

var ProgressBar = require('progress');

var bar = new ProgressBar(':bar :percent', { total: 100 });

var lastProgress = 0;

getAudioDuration(filename,function(err, duration){

    if(err){
      throw(err);
    }

    getBuildup({
        tIntervals : [1,0.05],
        filename : "input.mp3",
        duration : duration,
        progressCb : function(p){
          var diff = Math.floor(p-lastProgress);
          if(diff > 0){
            bar.tick(diff);
            lastProgress = p;
          }
        }
      }, function(err, buildUp){
        if(err){
          throw(err);
        }

        console.log("sucessful buildUp computation :",buildUp);
    });

});


