var getBuildup = require('../').getBuildup;


getBuildup({
    tIntervals : [1,0.05],
    filename : "input.mp3"
  }, function(err, buildUp){
    if(err){
      console.error(err);
      throw(err);
    }

    console.log("sucessful buildUp computation :",buildUp);
});

