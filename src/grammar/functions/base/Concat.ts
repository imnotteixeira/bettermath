import type { Index } from "parsimmon";
import { IBaseType, Types, ValueResolvingResult } from "../../definitions";
import { FunctionType, IFunctionArg } from "../types";

export class ConcatFunction extends FunctionType<string> {
    readonly returnType = Types.STRING;
    constructor(indexInfo: Index, args: (IFunctionArg<string> | IFunctionArg<number>)[]) {
        super(indexInfo, "CONCAT", args);
    }

    getValue = (dependencyValueMap: Map<string, IBaseType<any> | undefined>) => {
        try {
            return ValueResolvingResult.success(
                this.args.reduce((acc, arg) => acc + arg.getValue(dependencyValueMap).getOrElse(""), "")
            )
        } catch (e) {
            return ValueResolvingResult.error<string>(e as Error)
        }
    }
}
