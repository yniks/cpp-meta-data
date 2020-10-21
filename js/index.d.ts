export declare function cpp(file: string): Promise<string>;
export declare function pretty(code: string): Promise<string>;
export declare function get_info(source: {
    objectfile: {
        name: string;
    };
}, fields?: Array<"functions" | "variables" | "types">): Promise<any>;
export declare function protoize(sourcefile: string, objectfile: string): Promise<{
    code: string;
    info: any;
}>;
export declare function fixWrapping(s: string): string[];
//# sourceMappingURL=index.d.ts.map