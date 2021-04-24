# apg-conv

> _**deprecated** Use the updated version [**apg-js**](https://github.com/ldthomas/apg-js)._

**apg-conv** is a command line data conversion tool.
It is powered by [**apg-conv-api**](https://github.com/ldthomas/apg-conv-api),
an API with both high- and low-level access to all of the format conversion tools.

The features and design have been specifically built as an aid to [**apg.html**](https://github.com/ldthomas/apg-js2), a web-page-based [**APG**](https://github.com/ldthomas/apg-js2) parser generator and tester. It is not meant to compete with more complete tools like [iconv](https://www.npmjs.com/package/iconv) and [iconv-lite](https://www.npmjs.com/package/iconv-lite). Nonetheless, for the encodings that it supports, it provides an alternate choice.

The original purpose of **apg-conv** was a means of getting arbitrary, 32-bit integer character codes in and out of an HTML `<textarea>`. The [ABNF](https://tools.ietf.org/html/rfc5234) syntax that defines the phrases that **APG** parses is capable of defining character codes of arbitrary-sized integers. However, with a web-page-based application, input and output is essentially constrained to the ASCII text of `<textarea>` and `<input>` HTML tags. (The [HTML5 File and Directory API](https://wicg.github.io/entries-api/) is not standardized and not considered here.) The encoding and decoding formats and methods neccesary to implement this eventually led to this application.

#### v1.1.0 Release Notes

There are no feature or usage changes from v1.0.0.
However, **apg-conv** now has a dependency on [**apg-conv-api**](https://github.com/ldthomas/apg-conv-api).
**apg-conv** has been split into two parts. First is **apg-conv**, which is now just an I/O shell for converting files.
Second, all of the data conversion functionality is now in **apg-conv-api**
in the form of an API which a) does not use the node.js "fs" module and b) gives a developer better access to all functions.
The "fs" module is incompatible with some development frameworks.

## Installation

```
npm install -g apg-conv
apg-conv -h *(displays the help screen)*
```

## Documentation:

The documentation is in the code in [`docco`](https://jashkenas.github.io/docco/) format.
To generate the documentation, from the package directory:

```
npm install -g docco
./docco-gen
```

View `docs/index.html` in any web browser to get started.

## Usage

```
Usage:
apg-conv [options]
(--help     | -h) display this help screen
(--version  | -v) display version number
(--src      | -s) <path>, the file to convert, default stdin
(--src-type | -st) type, the source file type, default UTF8
(--dst      | -d) <path>, the converted file, default stdout
(--dst-type | -dt) type, the converted file type, default UTF8
(--err      | -e) <path>, the error reporting file, default stderr

type - the byte stream encoding: may be one of:
UTF8
UTF16
UTF16BE
UTF16LE
UTF32
UTF32BE
UTF32LE
UINT7
ASCII    (alias for UINT7)
UINT8
BINARY   (alias for UINT8)
UINT16   (alias for UINT16BE)
UINT16BE
UINT16LE
UINT32   (alias for UINT32BE)
UINT32BE
UINT32LE
ESCAPED

Type notes:
- The type names are case insensitive.
- Source types may be prefixed with BASE64:.
  The input will be treated as base64 encoded.
  It will be stripped of white space and control characters (\t, \r, \n),
  then base 64 decoded as an initial step.
- Destination types may have a :BASE64 suffix.
  The output will be base 64 encoded as a final step.
- Destination types my be prefixed with CRLF:.
  This will cause a line ending transformation prior to decoding.
  CRLF(\r\n), CR(\r) or LF(\n) will be interpreted as line ends and transformed to CRLF.
  CRLF will be added to the end if the last line end is missing.
- Destination types my be prefixed with LF:.
  This will cause a line ending transformation prior to decoding.
  CRLF(\r\n), CR(\r) or LF(\n) will be interpreted as line ends and transformed to LF.
  LF will be added to the end if the last line end is missing.
- UTF type input data may have an optional Byte Order Mark (BOM)(*)
- UTF output data will not have a BOM.
- UTF16 defaults to UTF16BE if there is no BOM.
- UTF32 defaults to UTF32BE if there is no BOM.
- An exception is thrown if a BOM is present and doesn't match the specified data type.
- ASCII is an alias for UINT7, 7-bit unsigned integers.
- BINARY is an alias for UINT8, 8-bit unsigned integers.
- UINT16 is an alias for UINT16BE, big-endian, 16-bit unsigned integers.
- UINT32 is an alias for UINT32BE, big-endian, 32-bit unsigned integers.
- The ESCAPED format is identical to JavaScript string escaping except that
  the grave accent (`) is used instead of the backslash (\).
  e.g \xHH -> `xHH, \uHHHH -> `uHHHH, \u{HHHHHH} -> `u{HHHHHH}.
  Its design and use is specifically for apg.html(**)

Examples:

apg-conv -s <inpath> -d <outpath> -st BINARY -dt UTF8
  Convert a binary (Latin 1 or UINT8) file to UTF8.
  That is, any characters > 0x7f will get two-byte, UTF8 encoding.

apg-conv -s <inpath> -d <outpath> -st ASCII -dt CRLF:ASCII
  Convert all line ends(CRLF, LF or CR) of the ASCII file to CRLF(\r\n),
  including the last even if missing in the input file.

apg-conv -s <inpath> -d <outpath> -st BASE64:UTF8 -dt UTF32
  Perform an initial base 64 decoding of the input file,
  then convert it from UTF8 to UTF32(BE) encoding.

apg-conv -s <inpath> -d <outpath> -st UTF8 -dt UTF32LE:BASE64
  The input file is converted from UTF8 to UTF32LE and base 64 encoded as a final step.

apg-conv -s <inpath> -d <outpath> -st BASE64:UTF8 -dt LF:UTF16:BASE64
  The input file is base 64 decoded. All line ends(CRLF, LF or CR) are converted to LF(\n),
  then converted to wide characters (UTF16) and finally base64 encoded.
```

(\*) See the [Unicode standard](http://www.unicode.org/versions/Unicode9.0.0/ch03.pdf) (3.10 Unicode Encoding Schemes) for Byte Order Marks.<br />
(\*\*) [apg.html](https://github.com/ldthomas/apg-html)
