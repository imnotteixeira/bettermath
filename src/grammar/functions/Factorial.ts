import { Index } from "parsimmon";
import { Types } from "../definitions";
import { FunctionType, IFunctionArg } from "./types";

export class FactorialFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Factorial", [args[0]]);
    }

    getValue = () => this.calculateFactorial(this.args[0].getValue());

    private calculateFactorial = (num: number): number => {
        if (num < 0) return -Infinity;
        if (num === 0) return 1;

        return num * this.calculateFactorial(num - 1);
    };
}