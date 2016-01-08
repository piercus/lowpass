var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('../lib/LowPass');
var Cutter = require('../lib/Cutter');
var EnergyDetector = require('../lib/EnergyDetector');

var file = fs.createReadStream('input.wav');
var reader = new wav.Reader();

var speaker, lowpass, ener;


var updateBuildUp = function(candidates, max, thres){
  for(var c = 0; c < candidates.length; c++){
    if(candidates[c].value > max*thres){
      return candidates[c];
    }
  }
};


// the "format" event gets emitted at the end of the WAVE header
reader.on('format', function (format) {
  ener1 = new EnergyDetector({
    format : format,
    energyWindow : 0.01
  });

  var cutter = new Cutter({
    format : format,
    start : 60,
    end : 64
  });


  lowpass = new LowPass({
    format : format,
    movAvLength : 256
  });

  speaker = new Speaker(format);
  
  reader.pipe(cutter);

  cutter.pipe(lowpass);
  
  lowpass.pipe(ener1);

  var song = [], energy;
  var maxEner = 0, buildUpThres = 0.5, buildUp, buildUpCandidates = [], index = 0;

  var startDate = new Date();


  ener1.on('data',function(chunk){
    index++;
    var energy = chunk['readInt'+ener1.bitDepth+ener1.endianness](0);
    
    if(energy > maxEner){
      maxEner = energy;
      maxEnerIndex = index;

      console.log(energy, index);
      
      buildUpCandidates.push({
        value : energy,
        index : index
      });
    }

  });


  ener1.on('end',function(){
    console.log('end');
      var buildUp = updateBuildUp(buildUpCandidates, maxEner, buildUpThres);
      console.log(buildUp);
  /*
      ener2 = new EnergyDetector({
          format : format,
          energyWindow : 0.01,
          start : buildUp.index-2,
          end : buildUp.index+2
      });

      lowpass.pipe(ener2);

      file.pipe(reader);

      var buildUpCandidates2 = [], index=0, maxEner = 0;

      ener2.on('data',function(chunk){
          index++;
          var energy = chunk['readInt'+ener2.bitDepth+ener2.endianness](0);
          
          if(energy > maxEner){
            maxEner = energy;
            maxEnerIndex = index;

            console.log(energy, index*0.01+buildUp.index-2);
            
            buildUpCandidates2.push({
              value : energy,
              index : index*0.01+buildUp.index-2
            });
          }

      });*/
  });

});

file.pipe(reader);