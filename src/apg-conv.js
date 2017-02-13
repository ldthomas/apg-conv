// This module is the main function for command line usage.
// It reads a source file and writes a destination file, converting the source format to the destination format.
// The files are all treated as byte streams.
// `stdin` and `stdout` are the default input and output streams.
//
// Execute `apg-conv -h` to see the usage (reproduced in the [README](./README.html) file).

module.exports = function(){
  "use strict;"
  var SRC_FILEL  = "--src";
  var SRC_FILES  = "-s";
  var SRC_TYPEL  = "--src-type";
  var SRC_TYPES  = "-st";
  var DST_FILEL = "--dst";
  var DST_FILES = "-d";
  var DST_TYPEL = "--dst-type";
  var DST_TYPES = "-dt";
  var ERR_FILEL = "--err";
  var ERR_FILES = "-e";
  var HELPL    = "--help";
  var HELPS    = "-h";
  var VERSIONL = "--version";
  var VERSIONS = "-v";
  var srcType   = "UTF8";
  var dstType  = "UTF8";
  var srcFile   = "";
  var dstFile  = "";
  var errFile  = "";
  var fs = require("fs");
  var help = require("./help.js");
  var convert = (require("./converter.js")).convert;
  var srcStream = process.stdin;
  var dstStream = process.stdout;
  var errStream = process.stderr;
  var srcBuf, dstBuf, chunkBuf;
  try{
    /* get the input arguments */
    for(var i = 2; i < process.argv.length; i += 2){
      var key = process.argv[i].toLowerCase(); 
      if(key === HELPL || key === HELPS){
        console.log(help.help());
        return;
      }
      if(key === VERSIONL || key === VERSIONS){
        console.log(help.version());
        return;
      }
      var i1 = i + 1;
      if(i1 >= process.argv.length){
        throw new TypeError("no matching value for option: " + key);
      }
      var value = process.argv[i1];
      switch(key){
      case SRC_FILEL:
      case SRC_FILES:
        srcFile = value;
        break;
      case SRC_TYPEL:
      case SRC_TYPES:
        srcType = value;
        break;
      case DST_FILEL:
      case DST_FILES:
        dstFile = value;
        break;
      case DST_TYPEL:
      case DST_TYPES:
        dstType = value;
        break;
      case ERR_FILEL:
      case ERR_FILES:
        errFile = value;
        break;
      default:
        throw new TypeError("unrecognized option: " + key);
        break;
      }
    }
    
    /* disable STRING type, allowed by converter, but not here */
    if(srcType.toUpperCase() === "STRING"){
      throw new Error("Input type may not be STRING.");
    }
    if(dstType.toUpperCase() === "STRING"){
      throw new Error("Output type may not be STRING.");
    }
    
    /* create file streams, if necessary */
    if(srcFile){
      srcStream = fs.createReadStream(srcFile, {flags: "r"});
    }
    if(dstFile){
      dstStream = fs.createWriteStream(dstFile, {flags: "w"});
    }
    if(errFile){
      errStream = fs.createWriteStream(errFile, {flags: "w"});
    }
    
    /* read the input data */
    srcBuf = Buffer.alloc(0);
    srcStream.on('data', function(chunkBuf) {
      srcBuf = Buffer.concat([srcBuf, chunkBuf]);
    });    

    srcStream.on('end', function() {
      try{
        /* translate the data */
        dstBuf = convert(srcType, srcBuf, dstType);
        
        /* write the translated the data */
        dstStream.write(dstBuf);
        if(dstFile){
          dstStream.end();
        }
      }catch(e){
        errStream.write("EXCEPTION: on srcStream end: " + e.message + "\n");
      }
    });
    srcStream.on('error', function(e) {
      errStream.write("srcStream error: " + e.message + "\n");
    });
    dstStream.on("error", function(e){
      errStream.write("dstStream error: " + e.message + "\n");
    });
  }catch(e){
    errStream.write("EXCEPTION: " + e.message + "\n");
    errStream.write(help.help());
  }
  if(errFile){
    errStream.end();
  }
}