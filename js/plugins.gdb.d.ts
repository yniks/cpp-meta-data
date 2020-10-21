import { BasePlugin } from "talk-to-gdb";
export declare class FileInfo extends BasePlugin {
    init(): Promise<string[]>;
    command(command: "file-info", ...args: string[]): Promise<string>;
}
export declare class ConsoleTypes extends BasePlugin {
    init(): Promise<string[]>;
    fixtypdef(s: string): string;
    command(command: "symbol-info-types2", ...args: string[]): Promise<string>;
}
//# sourceMappingURL=plugins.gdb.d.ts.map