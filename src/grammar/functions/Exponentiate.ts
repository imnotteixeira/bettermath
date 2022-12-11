import type { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export class ExponentiateFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Exponentiate", [args[0], args[1]], indexInfo);
    }

    getValue = () => Math.pow(this.args[0].getValue(), this.args[1].getValue());
}