import { TalktoGdb } from "talk-to-gdb";
import tmp from "tmp";
import execa from "execa";
const gdb = new TalktoGdb
var initialized = false
var basefile: tmp.FileResult
export default { get_meta }
export async function get_meta(source: { sourcefiles: ({ name: string })[], objectfile: { name: string } }) {
    if (!initialized) {
        basefile = tmp.fileSync()
        await execa.command(`echo "" | cpp -x c++ -dM - | sort - >${basefile.name}`, { shell: true })
        await gdb.loadPlugins()
        initialized = true
    }
    var tree: any = {}
    async function getVariables() {
        if ("variables" in tree) return tree.variables
        if ("objectfile" in source) {

            await gdb.changeFile(source.objectfile.name)
            var result = await gdb.getResult("-symbol-info-variables")
            return tree.variables = result.symbols.debug?.map((file: any) => file.symbols.filter((s: any) => "line" in s).map((s: any) => s.description)).flat() || []
        }
        else return []
    }
    async function getFunctions() {
        if ("functions" in tree) return tree.functions
        if ("objectfile" in source) {

            await gdb.changeFile(source.objectfile.name)
            var result = await gdb.getResult("-symbol-info-functions")
            return tree.functions = result.symbols.debug?.map((file: any) => file.symbols.filter((s: any) => "line" in s).map((s: any) => s.description)).flat() || []
        }
        else return []
    }
    async function getTypes() {
        if ("types" in tree) return tree.types
        if ("objectfile" in source) {
            await gdb.changeFile(source.objectfile.name)
            var result = await gdb.getResult("-symbol-info-types2")
            return tree.types = result.types
        }
        else return []
    }
    async function getMacros() {
        if ("macros" in tree) return tree.macros
        if ("sourcefiles" in source) {
            var result = ""
            for (let sourcefile of source.sourcefiles) {
                result += (await execa.command(`cpp -x c++ -dM ${sourcefile.name} | comm -1 -3 <( sort ${basefile.name} ) <( sort - )`, { shell: "bash" })).stdout;
            }
            return tree.macros = result//.split("\n").filter(s => s.search("#") > -1).map(s => "#" + s.split("#")[1])
        }
        else return []
    }
    async function makeHeader() {
        var header = ""
        header += (await getMacros()).join(";\n") + ';\n';
        header += (await getTypes()).join(";\n") + ';\n';
        header += (await getVariables()).map((s: string) => `extern ${s}`).join(";\n") + ';\n';
        header += (await getFunctions()).map((s: string) => `extern ${s}`).join(";\n") + ';\n';
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