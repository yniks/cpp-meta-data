import { Arg_Options_requirenments, Arg_responseType, input, response, tree_reponse } from "./types";
import { TalktoGdb } from "talk-to-gdb"
import tmp from "tmp"
import execa from "execa";
const gdb = new TalktoGdb
var initialized = false
var basefile: tmp.FileResult
export async function get_meta(source: { sourcefile: string, objectfile: string }) {
    if (!initialized) {
        basefile = tmp.fileSync()
        await execa.command(`echo "" | cpp -dM - >${basefile.name}`, { shell: true })
        await gdb.loadPlugins()
        initialized = true
    }
    var tree: any = {}
    async function getVariables() {
        if ("variables" in tree) return tree.variables
        if ("objectfile" in source) {

            await gdb.changeFile(source.objectfile)
            var result = await gdb.getResult("-symbol-info-variables")
            return tree.variables = result.symbols.debug.map((file: any) => file.symbols.filter((s: any) => "line" in s).map((s: any) => s.description)).flat()//.messages.map((t: any) => t.name)
        }
        else return []
    }
    async function getFunctions() {
        if ("functions" in tree) return tree.functions
        if ("objectfile" in source) {

            await gdb.changeFile(source.objectfile)
            var result = await gdb.getResult("-symbol-info-functions")
            return tree.functions = result.symbols.debug.map((file: any) => file.symbols.filter((s: any) => "line" in s).map((s: any) => s.description)).flat()//.messages.map((t: any) => t.name)
        }
        else return []
    }
    async function getTypes() {
        if ("types" in tree) return tree.types
        if ("objectfile" in source) {

            await gdb.changeFile(source.objectfile)
            var result = await gdb.getResult("-symbol-info-types")
            var types = result.symbols.debug.map((file: any) => file.symbols.filter((s: any) => "line" in s).map((s: any) => s.name)).flat()//.messages.map((t: any) => t.name)
            return tree.types = (await gdb.getResult("-symbol-info-type", ...types)).types
        }
        else return []
    }
    async function getMacros() {
        if ("macros" in tree) return tree.macros
        if ("sourcefile" in source) {
            var result = await execa.command(` cpp -dM ${source.sourcefile} | diff - ${basefile.name} |cat -`, { shell: true })
            return tree.macros = result.stdout.split("\n").filter(s => s.search("#") > -1).map(s => "#" + s.split("#")[1])
        }
        else return []
    }
    async function makeHeader() {
        var header = ""
        header += (await getMacros()).join("\n") + '\n';
        header += (await getTypes()).join("\n") + '\n';
        header += (await getVariables()).map((s: string) => `extern ${s}`).join("\n") + '\n';
        header += (await getFunctions()).map((s: string) => `extern ${s}`).join("\n") + '\n';
        return header
    }
    return {
        getMacros,
        getTypes,
        getVariables,
        getFunctions,
        makeHeader
    }
}
/**
 * router:3500/4500, 1200 refund
//  * onu:2000
 * cable:450
 * gst:650+18%
 */