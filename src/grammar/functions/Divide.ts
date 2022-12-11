import type { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export class DivideFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Divide", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() / this.args[1].getValue();
}