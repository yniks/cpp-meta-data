export interface Arg_Options_requirenments {
    variables: boolean
    functions: boolean
    types: boolean
    macros: "all" | "fileOnly"
}
export interface Arg_responseType {
    headerfile: boolean,
    tree: boolean
}
export type input = { objectfile: string } | { sourcefile: string } | ({ objectfile: string, sourcefile: string })
export interface tree_reponse { tree: any }
export interface headerfile_reponse { headerfile: string }
export type response = tree_reponse | headerfile_reponse | (tree_reponse & headerfile_reponse)