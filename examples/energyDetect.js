var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');
var LowPass = require('../lib/LowPass');
var Cutter = require('../lib/Cutter');
var EnergyDetector = require('../lib/EnergyDetector');
var lame = require('lame');

var file = fs.createReadStream('input.mp3');

var reader = new lame.Decoder();
var reader2 = new lame.Decoder();

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
    format : format
   // energyWindow : 0.01
  });

  lowpass = new LowPass({
    format : format,
    movAvLength : 256
  });

  speaker = new Speaker(format);
  
  reader.pipe(lowpass).pipe(ener1);

  var song = [], energy;
  var maxEner = 0, buildUpThres = 0.7, buildUp, buildUpCandidates = [], index = 0;

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

    var dWin = 0.05;

    ener2 = new EnergyDetector({
        format : format,
        energyWindow : dWin
    });

    lowpass2 = new LowPass({
      format : format,
      movAvLength : 256
    });

    var cutter2 = new Cutter({
      format : format,
      startSec : buildUp.index-2,
      endSec : buildUp.index+2
    });

    var file2 = fs.createReadStream('input.mp3');

    file2.pipe(reader2).pipe(cutter2).pipe(lowpass2).pipe(ener2);

    var buildUpCandidates2 = [], index=0, maxEner2 = 0;

    ener2.on('data',function(chunk){
        index++;
        var energy = chunk['readInt'+ener2.bitDepth+ener2.endianness](0);
        //console.log("data", index, energy);
        if(energy > maxEner2){
          maxEner2 = energy;
          maxEnerIndex = index;

          console.log("energy",energy, index*dWin+buildUp.index-2);
          
          buildUpCandidates2.push({
            value : energy,
            index : index*dWin+buildUp.index-2
          });
        }
    });

    ener2.on('end',function(chunk){
        console.log('end2', maxEner, maxEner2);
        var buildUp = updateBuildUp(buildUpCandidates2, maxEner2, buildUpThres);
        console.log(buildUp);
    });    
  });

});

file.pipe(reader);