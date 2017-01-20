// Usage:
// 
// apg-conv [options]
//
// options:
// * `(--src      | -s) <path>`, the file to convert, default stdin
// * `(--src-type | -st) type`, the source file type, default UTF-8
// * `(--dst      | -d) <path>`, the converted file, default stdout
// * `(--dst-type | -dt) type`, the converted file type, default UTF-8
// * `(--err      | -e) <path>`, the error reporting file, default stderr
// 
// Files are byte streams of the following types:
// * `UTF-8`
// * `UTF-16`
// * `UTF-16BE`
// * `UTF-16LE`
// * `UTF-32`
// * `UTF-32BE`
// * `UTF-32LE`
// * `UINT7`
// * `ASCII`
// * `UINT8`
// * `BINARY`
// * `UINT16`
// * `UINT16BE`
// * `UINT16LE`
// * `UINT32`
// * `UINT32BE`
// * `UINT32LE`
// * `ESCAPED`
// 
// Type notes:
// * The type names are case insensitive.
// * Source types may be prefixed with `BASE64:`.
// The input will be treated as base64 encoded.
// It will be stripped of white space and control characters (`\t, \r, \n`),
// then base 64 decoded as an initial step.
// * Destination types may have a `:BASE64` suffix.
// The output will be base64 encoded as a final step.
// * Destination types my be prefixed with `CRLF:`.
// This will cause a line ending transformation prior to decoding.
// `CRLF(\r\n), CR(\r) or LF(\n)` will be interpreted as line ends and transformed to `CRLF`.
// `CRLF` will be added to the end if the last line end is missing.
// * Destination types my be prefixed with `LF:`.
// This will cause a line ending transformation prior to decoding.
// `CRLF(\r\n), CR(\r) or LF(\n)` will be interpreted as line ends and transformed to `LF`.
// `LF` will be added to the end if the last line end is missing.
// * UTF type input data may have an optional Byte Order Mark (BOM) - [Unicode Standard](http://www.unicode.org/versions/Unicode9.0.0/ch03.pdf#G7404).
// * UTF output data will not have a BOM.
// * `UTF-16` defaults to `UTF-16BE` if there is no BOM.
// * `UTF-32` defaults to `UTF-32BE` if there is no BOM.
// * An exeption is thrown if a BOM is present and doesn't match the data type.
// * `ASCII` is an alias for `UINT7`, 7-bit unsigned integers.
// * `BINARY` is an alias for `UINT8`, 8-bit unsigned integers.
// * `UINT16` is an alias for `UINT16BE`, big-endian, 16-bit unsigned integers.
// * `UINT32` is an alias for `UINT32BE`, big-endian, 32-bit unsigned integers.
// * The `ESCAPED` format is described [elsewhere](). 
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
  debugger;
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