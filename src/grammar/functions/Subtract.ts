import type { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export class SubtractFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Subtract", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() - this.args[1].getValue();
}