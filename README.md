# Cpp Meta Data

This project is a utility tool that provides functionalities related to C++ code analysis and manipulation. It includes features such as obtaining file information, preprocessing C++ code, formatting code, and generating metadata from C++ source files and object files.

## Installation

To install the `cpp-meta-data` package, you can use npm:

bashCopy code

`npm install cpp-meta-data` 

## Usage

### Preprocessing C++ Code

typescriptCopy code

```
import { cpp } from "cpp-meta-data";

const preprocessedCode = await cpp("source.cpp");` 

```
This function preprocesses the given C++ file and returns the preprocessed code as a string.

### Formatting C++ Code

typescriptCopy code

```import { pretty } from "cpp-meta-data";

const formattedCode = await pretty("source.cpp");
```
This function formats the given C++ code using `clang-format` and returns the formatted code as a string.

### Getting File Information

typescriptCopy code

```
import { get_info } from "cpp-meta-data";

const fileInfo = await get_info({ objectfile: { name: "object.o" } }, ["functions", "variables", "types"]);
```
This function retrieves information about functions, variables, and types from the specified object file and returns the information as an object.

### Generating Metadata

typescriptCopy code

```
import { protoize } from "cpp-meta-data";

const metadata = await protoize("source.cpp", "object.o");
``` 

This function generates metadata from the specified source file and object file, including declarations of functions, variables, and types, and returns the metadata as an object.

### Fixing Wrapping

typescriptCopy code

```
import { fixWrapping } from "cpp-meta-data";

const fixedCode = fixWrapping("source.cpp");
```

This function fixes wrapping issues in the provided C++ code and returns the fixed code as a string.

## Dependencies

- execa: "^4.0.3"
- talk-to-gdb: "git+ssh://git@github.com/yniks/talk-to-gdb.git"
- tmp: "^0.2.1"

## Development Dependencies

- @babel/types: "^7.12.1"
- @types/node: "^14.14.0"
- @types/tmp: "^0.2.0"

## License

This project is licensed under the ISC License.