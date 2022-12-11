import { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export class FactorialFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Factorial", [args[0]], indexInfo);
    }

    getValue = () => this.calculateFactorial(this.args[0].getValue());

    private calculateFactorial = (num: number): number => {
        if (num < 0) return -Infinity;
        if (num === 0) return 1;

        return num * this.calculateFactorial(num - 1);
    };
}