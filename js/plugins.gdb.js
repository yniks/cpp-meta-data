"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTypes = exports.FileInfo = void 0;
const talk_to_gdb_1 = require("talk-to-gdb");
const gdb_parser_extended_1 = require("gdb-parser-extended");
class FileInfo extends talk_to_gdb_1.BasePlugin {
    async init() {
        return ["file-info"];
    }
    async command(command, ...args) {
        var { token: realtoken } = talk_to_gdb_1.getoraddtoken(command);
        var arg = talk_to_gdb_1.parseArg(args);
        var info = {};
        Promise.resolve().then(async () => {
            if ("functions" in arg) {
                var result = await this.target.getResult("-symbol-info-functions");
                info.functions = result.symbols.debug?.filter((file) => !('filename' in arg) || file.fullname == arg.filename).map((file) => ({ filename: file.fullname, defs: file.symbols.filter((s) => "line" in s).map((s) => ({ line: s.line, def: s.description })) })) || [];
            }
            if ("variables" in arg) {
                var result = await this.target.getResult("-symbol-info-variables");
                info.variables = result.symbols.debug?.filter((file) => !('filename' in arg) || file.fullname == arg.filename).map((file) => ({ filename: file.fullname, defs: file.symbols.filter((s) => "line" in s).map((s) => ({ line: s.line, def: s.description })) })) || [];
            }
            if ("types" in arg) {
                var result = await this.target.getResult("-symbol-info-types2");
                info.types = result.types.filter((file) => !('filename' in arg) || file.filename == arg.filename);
            }
            var response = {
                token: realtoken,
                info
            };
            this.finishSuccess(response);
        });
        return realtoken;
    }
}
exports.FileInfo = FileInfo;
class ConsoleTypes extends talk_to_gdb_1.BasePlugin {
    async init() {
        return ["symbol-info-types2"];
    }
    fixtypdef(s) {
        if (s.startsWith("typedef typedef"))
            return '';
        var namei, i = s.length;
        while ((i + 1) && s[i] != " ")
            i--;
        if (!(i + 1))
            return s;
        namei = i;
        i--;
        if (s[i] != ")")
            return s;
        var stack = [")"];
        i--;
        while ((i + 1) && stack.length > 0) {
            if (s[i] == ")")
                stack.push(")");
            else if (s[i] == "(")
                stack.pop();
            i--;
        }
        if (s[i] == ")")
            i--;
        if (!stack.length)
            return `${s.slice(0, i + 1)}${s.slice(namei)}${s.slice(i + 1, namei - 1)})`;
        else
            return s;
    }
    async command(command, ...args) {
        var { token: realtoken } = talk_to_gdb_1.getoraddtoken(command);
        this.target.command(realtoken + "0000000-interpreter-exec console", `info types`)
            .then((realtoken) => this.target.readPattern({ token: realtoken, type: "sequence" }))
            .then(async (sequence) => {
            var types = sequence.messages
                .filter((m) => m.type == "console_stream_output")
                .reduce((prev, curr) => prev + curr.c_line, "");
            var types = gdb_parser_extended_1.GdbParser.consoleParseTypes(types.slice(20));
            var extra = types.map((file) => file.defs.map((type) => type.def)).flat().filter((type) => !type.startsWith("typedef "));
            this.target.command(`${realtoken}111-symbol-info-type`, ...extra);
            var sequence = await this.target.readPattern({ token: realtoken + "111", type: "result_record" });
            for (let file of types) {
                for (let i in file.defs) {
                    if (!file.defs[i].def.startsWith("typedef "))
                        file.defs[i].def = sequence.types[extra.indexOf(file.defs[i].def)];
                    else
                        file.defs[i].def = this.fixtypdef(file.defs[i].def);
                }
            }
            var result = {
                token: realtoken,
                types: types //.map((t: any) => ({ filename: t.File, defs: t.types }))
            };
            this.finishSuccess(result);
        });
        return realtoken;
    }
}
exports.ConsoleTypes = ConsoleTypes;
//# sourceMappingURL=plugins.gdb.js.map