export interface IFunction {
    fn: string,
    args: IFunctionArg[]
}

type Value = string | number;

export type IFunctionArg = Value[]; 