"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_meta = void 0;
const talk_to_gdb_1 = require("talk-to-gdb");
const tmp_1 = __importDefault(require("tmp"));
const execa_1 = __importDefault(require("execa"));
const gdb = new talk_to_gdb_1.TalktoGdb;
var initialized = false;
var basefile;
exports.default = { get_meta };
async function get_meta(source) {
    if (!initialized) {
        basefile = tmp_1.default.fileSync();
        await execa_1.default.command(`echo "" | cpp -dM - >${basefile.name}`, { shell: true });
        await gdb.loadPlugins();
        initialized = true;
    }
    var tree = {};
    async function getVariables() {
        if ("variables" in tree)
            return tree.variables;
        if ("objectfile" in source) {
            await gdb.changeFile(source.objectfile.name);
            var result = await gdb.getResult("-symbol-info-variables");
            return tree.variables = result.symbols.debug?.map((file) => file.symbols.filter((s) => "line" in s).map((s) => s.description)).flat() || [];
        }
        else
            return [];
    }
    async function getFunctions() {
        if ("functions" in tree)
            return tree.functions;
        if ("objectfile" in source) {
            await gdb.changeFile(source.objectfile.name);
            var result = await gdb.getResult("-symbol-info-functions");
            return tree.functions = result.symbols.debug?.map((file) => file.symbols.filter((s) => "line" in s).map((s) => s.description)).flat() || [];
        }
        else
            return [];
    }
    async function getTypes() {
        if ("types" in tree)
            return tree.types;
        if ("objectfile" in source) {
            await gdb.changeFile(source.objectfile.name);
            var result = await gdb.getResult("-symbol-info-types");
            var types = result.symbols.debug?.map((file) => file.symbols.filter((s) => "line" in s).map((s) => s.name)).flat() || [];
            return tree.types = (await gdb.getResult("-symbol-info-type", ...types)).types;
        }
        else
            return [];
    }
    async function getMacros() {
        if ("macros" in tree)
            return tree.macros;
        if ("sourcefiles" in source) {
            var result = "";
            for (let sourcefile of source.sourcefiles) {
                result += (await execa_1.default.command(` cpp -dM ${sourcefile.name} | diff - ${basefile.name} |cat -`, { shell: true })).stdout + '\n';
            }
            return tree.macros = result.split("\n").filter(s => s.search("#") > -1).map(s => "#" + s.split("#")[1]);
        }
        else
            return [];
    }
    async function makeHeader() {
        var header = "";
        header += (await getMacros()).join("\n") + '\n';
        header += (await getTypes()).join("\n") + '\n';
        header += (await getVariables()).map((s) => `extern ${s}`).join("\n") + '\n';
        header += (await getFunctions()).map((s) => `extern ${s}`).join("\n") + '\n';
        return header;
    }
    return {
        getMacros,
        getTypes,
        getVariables,
        getFunctions,
        makeHeader
    };
}
exports.get_meta = get_meta;
/**
 * router:3500/4500, 1200 refund
//  * onu:2000
 * cable:450
 * gst:650+18%
 */ 
//# sourceMappingURL=index.js.map