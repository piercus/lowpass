var spawn = require('child_process').spawn;

var fs = require('fs');
var lame = require('lame');
var wav = require('wav');
var filename = process.argv[2];

var getBPM = function(file, cb){
  var extension = file.split(".")[1]
  if(extension === "wav"){

    return getWavBPM(file, cb);

  } else if(extension === "mp3"){

    return getMp3BPM(file, cb);

  }
};

var getMp3BPM = function(mp3File, cb){

  var wavfile = mp3File.replace("mp3","wav");

  var output = fs.createWriteStream(wavfile);
  var input = fs.createReadStream(mp3File);
  // start reading the MP3 file from the input
  var decoder = new lame.Decoder();

  // we have to wait for the "format" event before we can start encoding
  decoder.on('format', onFormat);

  // and start transferring the data
  input.pipe(decoder);

  function onFormat (format) {
    // write the decoded MP3 data into a WAV file
    var writer = new wav.Writer(format);
    decoder.pipe(writer).pipe(output);

    output.on("finish", function(){
      getWavBPM(wavfile, cb);
    });

    output.on("error", function(err){
      cb(err)
    });
  }

};

var getWavBPM = function(wavFile, cb){
  var opts = [wavFile,"-bpm"];
  //console.log(opts);

  var cmd = spawn("soundstretch", opts);  

  var cmdCall = "soundstretch "+opts.join(" ");
  
  var out = "", bpm;
  var reg = new RegExp(/.*Detected BPM rate ([0-9]+\.[0-9]+).*/);

  cmd.stderr.on('data', (data) => {
    out+=data.toString();

    if(reg.test(out)){
      //console.log("in reg out");
      var parsed;
      out.replace(reg, function(match, back1) { parsed = back1; });
      bpm = parseFloat(parsed);
    }

  });

  cmd.on('close', (code) => {
    if(bpm){
      cb(null, bpm); 
    } else {
      console.log(`stderr: ${out}`);
       cb(new Error(`child process exited with code ${code} and bpm not found\n ---- \noutput is : \n{out}\n\n ---- \ncommand is :{cmdCall}\n ----`));
    }

  });
};

module.exports = getBPM;
