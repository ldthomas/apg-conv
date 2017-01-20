module.exports = {
    help: function(){
      str  = "Usage:\n";
      str += "apg-conv [options]\n";
      str += "(--src      | -s) <path>, the file to convert, default stdin\n";
      str += "(--src-type | -st) type, the source file type, default UTF-8\n";
      str += "(--dst      | -d) <path>, the converted file, default stdout\n";
      str += "(--dst-type | -dt) type, the converted file type, default UTF-8\n";
      str += "(--err      | -e) <path>, the error reporting file, default stderr\n";
      str += "\n";
      str += "Files are byte streams of the following types:\n";
      str += "UTF-8\n";
      str += "UTF-16\n";
      str += "UTF-16BE\n";
      str += "UTF-16LE\n";
      str += "UTF-32\n";
      str += "UTF-32BE\n";
      str += "UTF-32LE\n";
      str += "UINT7\n";
      str += "ASCII    (alias for UINT7)\n";
      str += "UINT8\n";
      str += "BINARY   (alias for UINT8)\n";
      str += "UINT16   (alias for UINT16BE)\n";
      str += "UINT16BE\n";
      str += "UINT16LE\n";
      str += "UINT32   (alias for UINT32BE\n";
      str += "UINT32BE\n";
      str += "UINT32LE\n";
      str += "ESCAPED\n";
      str += "\n";
      str += "Type notes:\n";
      str += "- The type names are case insensitive.\n";
      str += "- Source types may be prefixed with BASE64:.\n";
      str += "  The input will be treated as base64 encoded.\n";
      str += "  It will be stripped of white space and control characters (\\t, \\r, \\n),\n";
      str += "  then base 64 decoded as an initial step.\n";
      str += "- Destination types may have a :BASE64 suffix.\n";
      str += "  The output will be base64 encoded as a final step.\n";
      str += "- Destination types my be prefixed with CRLF:.\n";
      str += "  This will cause a line ending transformation prior to decoding.\n";
      str += "  CRLF(\\r\\n), CR(\\r) or LF(\\n) will be interpreted as line ends and transformed to CRLF.\n";
      str += "  CRLF will be added to the end if the last line end is missing.\n";
      str += "- Destination types my be prefixed with LF:.\n";
      str += "  This will cause a line ending transformation prior to decoding.\n";
      str += "  CRLF(\\r\\n), CR(\\r) or LF(\\n) will be interpreted as line ends and transformed to LF.\n";
      str += "  LF will be added to the end if the last line end is missing.\n";
      str += "- UTF type input data may have an optional Byte Order Mark (BOM)\n";
      str += "  - [Unicode Standard](http://www.unicode.org/versions/Unicode9.0.0/ch03.pdf#G7404).\n";
      str += "- UTF output data will not have a BOM.\n";
      str += "- UTF-16 defaults to UTF-16BE if there is no BOM.\n";
      str += "- UTF-32 defaults to UTF-32BE if there is no BOM.\n";
      str += "- An exeption is thrown if a BOM is present and doesn't match the data type.\n";
      str += "- ASCII is an alias for UINT7, 7-bit unsigned integers.\n";
      str += "- BINARY is an alias for UINT8, 8-bit unsigned integers.\n";
      str += "- UINT16 is an alias for UINT16BE, big-endian, 16-bit unsigned integers.\n";
      str += "- UINT32 is an alias for UINT32BE, big-endian, 32-bit unsigned integers.\n";
      str += "- The ESCAPED format is described [elsewhere]().\n";
      return str;
    },
    version: function(){
      return "apg-conv: version 1.0.0: Copyright (c) 2017 Lowell D. Thomas, all rights reserved";
    }
}