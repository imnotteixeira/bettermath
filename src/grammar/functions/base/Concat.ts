import type { Index } from "parsimmon";
import { Types } from "../../definitions";
import { FunctionType, IFunctionArg } from "../types";

export class ConcatFunction extends FunctionType<string> {
    readonly returnType = Types.STRING;
    constructor(indexInfo: Index, args: IFunctionArg<string | number>[]) {
        super(indexInfo, "CONCAT", args);
    }

    getValue = () => this.args.reduce((acc, arg) => acc + arg.getValue(), "");
}
