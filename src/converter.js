// This function takes a node.js Buffer byte stream as input,
// converts it to an array of 32-bit integers and
// outputs the array or an ASCII string translation of it.
// Input types and output types control the respective formats.
// The function argument is an object that supplies the input,
// controls the interpetations of the input and output and
// returns the output to the caller.
// ````
// io:         the function argument
// io.typeIn:  the input data type,
//             controls the interpretation of the byte stream
// io.bufIn:   a node.js buffer of 8-bit bytes
// io.typeOut: the output data type,
//             controls the form of the output.
// io.bufOut:  the output data,
//             an array of 32-bit integers or a string
// io.chars:   integer array of character codes,
//             may be input or output, depending on types
//````
//  /* io prototype */
//  var io = {
//      typeIn: "",  /* type of data in the input byte stream, if any */
//      bufIn: null, /* input byte stream, must be node.js Buffer, if any */
//      typeOut: "", /* type of data in the output byte stream, if any */
//      bufOut: null,/* output byte stream, a node.js Buffer, if any */
//      chars: []    /* integer array of character codes */
//                   /* may be input or output, depending on typeIn & typeOut */
//  }

//
// The input types and their meaning:<br />
// (For Unicode formats, see the [Unicode Encoding Forms](http://www.unicode.org/versions/Unicode9.0.0/ch03.pdf#G7404).)
//````
// [base64:]UTF8:    see D92 and D95
// [base64:]UTF16:   see D91
// [base64:]UTF16BE: see D91 and D96-98
// [base64:]UTF16LE: see D91 and D96-98
// [base64:]UTF32:   see D90
// [base64:]UTF32BE: see D90 and D99-101
// [base64:]UTF32LE: see D90 and D99-101
// [base64:]UINT7:    7-bit integers, ASCII
// [base64:]UINT8:    8-bit integers, binary or Latin-1
// [base64:]UINT16:   16-bit integers, big endian byte order
// [base64:]UINT16BE: 16-bit integers, big endian byte order
// [base64:]UINT16LE: 16-bit integers, little endian byte order
// [base64:]UINT32:   32-bit integers, big endian byte order
// [base64:]UINT32BE: 32-bit integers, big endian byte order
// [base64:]UINT32LE: 32-bit integers, little endian byte order
// [base64:]ESCAPED:  7-bit ASCII, escaped non-ASCII characters
//````
//
// The optional `base64:` prefix means that
// the input will be interpreted as a [base64](https://en.wikipedia.org/wiki/Base64)
// version of the format. For example:
//
// * `base64:UTF8` means that the input is a base64 encoding of a UTF-8 byte stream.<br />
// * `base64:UINT32LE` means that the input is a base64 encoding of a little endian, 32-bit integer stream.
//
// Escaping is a format used by `apg.html` as a means of providing input of non-printing ASCII characters
// in an HTML `textarea` to the generated parser.
// (In fact, this module is the result that grew from the original
// simple need to translate from an arbitrary integer character code array
// to an `ESCAPED` format of printing, ASCII characters, suitable for use in an HTML page.)
//
// The JavaScript string escaping rules are used except that
// the escape character is the grave accent (\`).
// The backslash (\\) was rejected because of annoying conflicts with
// the JavaScript string escape character.
// Other special characters
// were rejected because they required the shift key.
// The escaped encoding rules are:
//````
// ``         literal grave accent (`)
// `xhh       8-bit integer
// `uhhhh     16-bit integer
// `u{h...h}  h...h, 1-8 hex digits
// h          hexadecimal digit, 0-9, a-f, or A-F
//````
// Reference: [UTF-16 converter](https://r12a.github.io/apps/conversion/)
//
// Note that the `"STRING"` type refers to JavaScript strings.
// While JavaScript strings seem to usually be UTF-16 encoded characters
// (see these [notes](https://mathiasbynens.be/notes/javascript-encoding))
//`apg-conv` relies on the node.js Buffer to interpret them.
//
// Notes:
//
// * String means JavaScript string
// * Buffer means node.js Buffer object
//
// Regarding `encode(type, data)`:
//
// * if type is "STRING", data must be a String
// * if type is prefixed with "BASE64:", data may be a String or Buffer
// * for all other types, data must be a Buffer
//
// Regarding `decode(type, chars)`
//
// * chars is an array of 32-bit integers
// * if type is `"STRING"` a String is returned
// * otherwise, a Buffer is returned
//   (Use Buffer.toString([encoding]) with the appropriate encoding if a String output is desired.)
//
"use strict;"
var _this = this;
var trans = require('./transformers.js');

/* types */
var UTF8     = "UTF8";
var UTF16    = "UTF16";
var UTF16BE  = "UTF16BE";
var UTF16LE  = "UTF16LE";
var UTF32    = "UTF32";
var UTF32BE  = "UTF32BE";
var UTF32LE  = "UTF32LE";
var UINT7    = "UINT7";
var ASCII    = "ASCII";
var BINARY   = "BINARY";
var UINT8    = "UINT8";
var UINT16   = "UINT16";
var UINT16LE = "UINT16LE";
var UINT16BE = "UINT16BE";
var UINT32   = "UINT32";
var UINT32LE = "UINT32LE";
var UINT32BE = "UINT32BE";
var ESCAPED  = "ESCAPED";
var STRING   = "STRING";

/* private functions */
var bom8 = function(src) {
  src.type = UTF8;
  var buf = src.data;
  src.bom = 0;
  if(buf.length >= 3){
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      src.bom = 3;
    }
  }
}
var bom16 = function(src) {
  var buf = src.data;
  src.bom = 0;
  switch (src.type) {
  case UTF16:
    src.type = UTF16BE;
    if(buf.length >= 2){
      if (buf[0] === 0xFE && buf[1] === 0xFF) {
        src.bom = 2;
      }else if (buf[0] === 0xFF && buf[1] === 0xFE) {
        src.type = UTF16LE;
        src.bom = 2;
      }
    }
    break;
  case UTF16BE:
    src.type = UTF16BE;
    if(buf.length >= 2){
      if (buf[0] === 0xFE && buf[1] === 0xFF) {
        src.bom = 2;
      }else if (buf[0] === 0xFF && buf[1] === 0xFE) {
        throw new TypeError('src type: "' + UTF16BE + '" specified but BOM is for "' + UTF16LE + '"');
      }
    }
    break;
  case UTF16LE:
    src.type = UTF16LE;
    if(buf.length >= 0){
      if (buf[0] === 0xFE && buf[1] === 0xFF) {
        throw new TypeError('src type: "' + UTF16LE + '" specified but BOM is for "' + UTF16BE + '"');
      }else if (buf[0] === 0xFF && buf[1] === 0xFE) {
        src.bom = 2;
      }
    }
    break;
  default:
    throw new TypeError('UTF16 BOM: src type "' + src.type + '" unrecognized');
    break;
  }
}
var bom32 = function(src) {
  var buf = src.data;
  src.bom = 0;
  switch (src.type) {
  case UTF32:
    src.type = UTF32BE;
    if(buf.length >= 4){
      if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0xFE && buf[3] === 0xFF) {
        src.bom = 4;
      }
      if (buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0 && buf[3] === 0) {
        src.type = UTF32LE;
        src.bom = 4;
      }
    }
    break;
  case UTF32BE:
    src.type = UTF32BE;
    if(buf.length >= 4){
      if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0xFE && buf[3] === 0xFF) {
        src.bom = 4;
      }
      if (buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0 && buf[3] === 0) {
        throw new TypeError('src type: ' + UTF32BE + ' specified but BOM is for ' + UTF32LE + '"');
      }
    }
    break;
  case UTF32LE:
    src.type = UTF32LE;
    if(buf.length >= 4){
      if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0xFE && buf[3] === 0xFF) {
        throw new Error('src type: "' + UTF32LE + '" specified but BOM is for "' + UTF32BE + '"');
      }
      if (buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0 && buf[3] === 0) {
        src.bom = 4;
      }
    }
    break;
  default:
    throw new TypeError('UTF32 BOM: src type "' + src.type + '" unrecognized');
    break;
  }
}
var validateSrc = function(type, data){
  function getType(type){
    var ret = {
        type: "",
        base64: false
    }
    var rx = /^(base64:)?([a-zA-Z0-9]+)$/i;
    var result = rx.exec(type);
    if (result) {
      if (result[2]) {
        ret.type = result[2].toUpperCase();
      }
      if (result[1]) {
        ret.base64 = true;
      }
    }
    return ret;
  }
  if (typeof(type) !== "string" || type === "") {
    throw new TypeError('type: "' + type + '" not recognized');
  }
  var ret = getType(type.toUpperCase());
  if(ret.base64){
    /* handle base 64 */
    if(ret.type === STRING){
      throw new TypeError('type: "' + type + ' "base64:" prefix not allowed with type '+STRING);
    }
    if(Buffer.isBuffer(data)){
      ret.data = trans.base64.decode(data);
    }else if(typeof(data) === "string"){
      var buf = Buffer.from(data, "ascii");
      ret.data = trans.base64.decode(buf);
    }else{
      throw new TypeError('type: "' + type + ' unrecognized data type: typeof(data): ' + typeof(data));
    }
  }else{
    ret.data = data;
  }
  switch (ret.type) {
  case UTF8:
    bom8(ret);
    break;
  case UTF16:
  case UTF16BE:
  case UTF16LE:
    bom16(ret);
    break;
  case UTF32:
  case UTF32BE:
  case UTF32LE:
    bom32(ret);
    break;
  case UINT16:
    ret.type = UINT16BE;
    break;
  case UINT32:
    ret.type = UINT32BE;
    break;
  case ASCII:
    ret.type = UINT7;
    break;
  case BINARY:
    ret.type = UINT8;
    break;
  case UINT7:
  case UINT8:
  case UINT16LE:
  case UINT16BE:
  case UINT32LE:
  case UINT32BE:
  case STRING:
  case ESCAPED:
    break;
  default:
    throw new TypeError('type: "' + type + '" not recognized');
    break;
  }
  if(ret.type === STRING){
    if(typeof(ret.data) !== "string"){
      throw new TypeError('type: "' + type + '" but data is not a string');
    }
  }else{
    if(!Buffer.isBuffer(ret.data)){
      throw new TypeError('type: "' + type + '" but data is not a Buffer');
    }
  }
  return ret;
}
var validateDst = function(type, chars){
  function getType(type){
    var fix, rem;
    var ret = {
        crlf: false,
        lf: false,
        base64: false,
        type: ""
    }
    /*prefix, if any */
    while(true){
      rem = type;
      fix = type.slice(0, 5);
      if(fix === "CRLF:"){
        ret.crlf = true;
        rem = type.slice(5);
        break;
      }
      fix = type.slice(0, 3);
      if(fix === "LF:"){
        ret.lf = true;
        rem = type.slice(3);
        break;
      }
      break;
    }
    /*suffix, if any */
    fix = rem.split(":");
    if(fix.length === 1){
      ret.type = fix[0];
      
    }else if(fix.length === 2 && fix[1] === "BASE64"){
      ret.base64 = true;
      ret.type = fix[0];
    }
    return ret;
  }
  if(!Array.isArray(chars)){
    throw new TypeError('dst chars: not array: "' + typeof(chars));
  }
  if (typeof(type) !== "string") {
    throw new TypeError('dst type: not string: "' + typeof(type));
  }
  ret = getType(type.toUpperCase());
  switch (ret.type) {
  case UTF8:
  case UTF16BE:
  case UTF16LE:
  case UTF32BE:
  case UTF32LE:
  case UINT7:
  case UINT8:
  case UINT16LE:
  case UINT16BE:
  case UINT32LE:
  case UINT32BE:
  case ESCAPED:
    break;
  case STRING:
    if(ret.base64){
      throw new TypeError('":base64" suffix not allowed with type '+STRING);
    }
    break;
  case ASCII:
    ret.type = UINT7;
    break;
  case BINARY:
    ret.type = UINT8;
    break;
  case UTF16:
    ret.type = UTF16BE;
    break;
  case UTF32:
    ret.type = UTF32BE;
    break;
  case UINT16:
    ret.type = UINT16BE;
    break;
  case UINT32:
    ret.type = UINT32BE;
    break;
  default:
    throw new TypeError('dst type unrecognized: "' + type + '" : must have form [crlf:|lf:]type[:base64]');
    break;
  }
  return ret;
}
/* converts an integer (character) array to encoded byte stream */
var encode = function(type, chars){
  switch(type){
  case UTF8:
    return trans.utf8.encode(chars);
  case UTF16BE:
    return trans.utf16be.encode(chars);
  case UTF16LE:
    return trans.utf16le.encode(chars);
  case UTF32BE:
    return trans.utf32be.encode(chars);
  case UTF32LE:
    return trans.utf32le.encode(chars);
  case UINT7:
    return trans.uint7.encode(chars);
  case UINT8:
    return trans.uint8.encode(chars);
  case UINT16BE:
    return trans.uint16be.encode(chars);
  case UINT16LE:
    return trans.uint16le.encode(chars);
  case UINT32BE:
    return trans.uint32be.encode(chars);
  case UINT32LE:
    return trans.uint32le.encode(chars);
  case STRING:
    return trans.string.encode(chars);
  case ESCAPED:
    return trans.escaped.encode(chars);
  default:
    throw new Error('encode type "'+type+'" not recognized')
  }
}
/* converts a byte stream to an integer (character) array */
var decode = function(src){
  switch(src.type){
  case UTF8:
    return trans.utf8.decode(src);
  case UTF16LE:
    return trans.utf16le.decode(src);
  case UTF16BE:
    return trans.utf16be.decode(src);
  case UTF32BE:
    return trans.utf32be.decode(src);
  case UTF32LE:
    return trans.utf32le.decode(src);
  case UINT7:
    return trans.uint7.decode(src.data);
  case UINT8:
    return trans.uint8.decode(src.data);
  case UINT16BE:
    return trans.uint16be.decode(src.data);
  case UINT16LE:
    return trans.uint16le.decode(src.data);
  case UINT32BE:
    return trans.uint32be.decode(src.data);
  case UINT32LE:
    return trans.uint32le.decode(src.data);
  case STRING:
    return trans.string.decode(src.data);
  case ESCAPED:
    return trans.escaped.decode(src.data);
  default:
    throw new Error('decode type "'+src.type+'" not recognized')
  }
}


/* converts byte stream of "type" to character (integer) array */
exports.decode = function(type, data) {
  var src = validateSrc(type, data);
  return decode(src);
}
/* converts character (integer) array to byte stream of "type" */
exports.encode = function(type, chars) {
  var c, buf;
  var dst = validateDst(type, chars);
  if(dst.crlf){
    /* prefix with CRLF line end conversion, don't contaminate caller's chars array */
    c = trans.lineEnds.crlf(chars);
    buf = encode(dst.type, c);
  }else if(dst.lf){
    /* prefix with LF line end conversion, don't contaminate caller's chars array */
    c = trans.lineEnds.lf(chars);
    buf = encode(dst.type, c);
  }else{
    buf = encode(dst.type, chars);
  }
  if(dst.base64){
    /* post base 64 encoding */
    buf = trans.base64.encode(buf);
  }
  return buf;
}
/* converts data of type srcType, to byte stream of type dstType */
exports.convert = function(srcType, srcData, dstType) {
  return _this.encode(dstType, _this.decode(srcType, srcData));
}
