import type { Index } from "parsimmon";
import { Types } from "../../definitions";
import { FunctionType, IFunctionArg } from "../types";

export class DivideFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Divide", args);
    }

    getValue = () => this.args[0].getValue() / this.args[1].getValue();
}