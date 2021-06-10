import { TalktoGdb } from "talk-to-gdb";
import { FileInfo, ConsoleTypes } from "./plugins.gdb"
import execa from "execa"
var wrapCounter = 0
const gdb = new TalktoGdb
var initialized = false

export async function cpp(file: string) {
    var e = await execa("cpp", ["-dD", file])
    return (e).stdout
}
export async function pretty(code: string) {
    var e = execa("clang-format")
    await e.stdin?.write(code)
    await e.stdin?.end();
    return (await e).stdout
}
export async function get_info(source: { objectfile: { name: string } }, fields: Array<"functions" | "variables" | "types"> = ["functions", "variables", "types"]) {
    if (!initialized) {
        await gdb.loadPlugins([FileInfo, ConsoleTypes])
        initialized = true
    }

    await gdb.changeFile(source.objectfile.name)
    var response = await gdb.getResult("-file-info", ...fields)
    return response
}
export async function protoize(sourcefile: string, objectfile: string) {
    var s = await cpp(sourcefile)
    var li = s.split("\n").map(l => l.startsWith("# ") ? l.match(/^# (\d+) "([^"]*)" ?(\d+)? ?(\d+)? ?(\d+)?/) : l).map((li: any) => (typeof li != "string") ? ({ ln: li[1], filename: li[2] }) : li)
    var record = false
    var code: Array<string | string[]> = []
    var slots: any = {}
    var reg = new RegExp(sourcefile)
    for (let i of li) {
        if (typeof i == 'string') { if (record) code.push(i); else code.push("") }
        else if (reg.test(i.filename)) {
            record = false;
            // code.push('')
            slots[i.ln] = code.length;
        }
        else record = true
    }
    code.push("")
    var { info } = await get_info({ objectfile: { name: objectfile } }, ["types", "functions", "variables"])
    // var all = [...info.functions, ...info.variables, ...info.types].filter((def: any) => def.filename == sourcefile).map((defs: any) => defs.defs).flat().sort((a, b) => Number(a.line) - Number(b.line))
    var slts = Object.keys(slots).map(i => Number(i))
    var cs = slts.shift();
    if (!cs) {
        throw "no slot present , probably, object file is not compiled form given sourcefile"
    }
    var ns = slts.shift()

    for (let each in info) {
        info[each] = info[each].filter((def: any) => def.filename == sourcefile).map((defs: any) => defs.defs).flat().sort((a: any, b: any) => Number(a.line) - Number(b.line))
        for (let def of info[each]) {
            if (ns && Number(def.line) >= ns) {
                cs = ns
                ns = slts.shift()
            }
            code[slots[cs] + ((Number(def.line) - cs))] = (each == 'types' ? "" : "extern ") + def.def + ";"
        }
    }
    var result = { code: code.join("\n"), info }
    return result
}
export function fixWrapping(s: string) {
    var stack: string[] = [];
    var statements: string[] = [];
    var finishedtill = 0;
    var lastCurlClosedAt = -1;
    var braces = "(){}[]";
    for (var i = 0; i < s.length; i++) {
        if (stack.length == 0) {
            if (s[i] == '/' && s[i + 1] == '*') {
                var def = ''
                while (!(s[i] == '*' && s[i + 1] == '/')) def += s[i++];
                def += '*/'
                i += 1;
                statements.push(def.trim())
                finishedtill = i + 1;
            }
            else if (s[i] == '/' && s[i + 1] == '/') {
                var def = ''
                while (s[i] != '\n') def += s[i++];
                statements.push(def.trim())
                finishedtill = i + 1;
            }
            else if (s[i] == '#') {
                var def = ''
                while (s[i] != '\n')
                    def += s[i++];
                statements.push(def.trim())
                finishedtill = i + 1;
            }
            else if (s[i] == ';') {
                statements.push(s.slice(finishedtill, i + 1).trim());
                finishedtill = i + 1
            }
            else if (s[i] == "{" && finishedtill < lastCurlClosedAt + 1) {
                statements.push(s.slice(finishedtill, lastCurlClosedAt + 1).trim());
                finishedtill = lastCurlClosedAt + 1;
            }
        }
        var matchedAt = braces.indexOf(s[i]);
        if (matchedAt == -1) continue;
        else if (matchedAt % 2 == 0) {//means open braces
            stack.push(s[i])
        }
        else if (stack.length > 0) {
            var pairsym = braces.indexOf(stack.pop() as string);
            if (matchedAt - pairsym !== 1) throw "bracket mismatch at " + i;
            else if (s[i] == "}" && stack.length == 0) lastCurlClosedAt = i;
        } else throw "inconsitancy in bracket pairs at " + i

    }
    statements.push(s.slice(finishedtill, i).trim());
    var result: string[] = []
    var pack = (i: number, t: string) => `int __method__${i}() {\n${t} ; return 0;}; static int __variable__${i} = __method__${i}();`
    for (var i = 0; i < statements.length; i++) {
        if (statements[i].search(/^if/) > -1) {//if
            if (statements[i + 1]?.search(/^else/) > -1) {
                result.push(statements[i])
            }
            else {
                result.push(pack(wrapCounter++, statements[i]))
            }
        } else if (statements[i].search(/^else/) > -1) {
            if (statements[i + 1]?.search(/^else/) > -1) {
                result.push(result.pop() + statements[i])
            }
            else {
                result.push(pack(wrapCounter++, result.pop() + statements[i]))
            }
        }
        else if (statements[i].search(/^try/) > -1) {//try-catch
            if (statements[i + 1]?.search(/^catch/) > -1) {
                result.push(statements[i])
            }
            else {
                result.push(pack(wrapCounter++, statements[i]))
            }
        } else if (statements[i].search(/^catch/) > -1) {
            if (statements[i + 1]?.search(/^catch/) > -1) {
                result.push(result.pop() + statements[i])
            }
            else {
                var t = result.pop()
                if (t && t.startsWith('try'))
                    result.push(pack(wrapCounter++, t + statements[i]))
                else result.push(t + statements[i])
            }
        }
        else if (statements[i].search(/^for[ ]?\(/) > -1 || statements[i].search(/^while[ ]?\(/) > -1 || statements[i].search(/do[ ]?\{/) > -1) {
            result.push(pack(wrapCounter++, statements[i]))
        }
        else result.push(statements[i])

    }
    return result
}
