import type { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export class ConcatFunction extends FunctionType<string> {
    constructor(args: IFunctionArg<string | number>[], indexInfo: Index) {
        super("CONCAT", args, indexInfo);
    }

    getValue = () => this.args.reduce((acc, arg) => acc + arg.getValue(), "");
}
