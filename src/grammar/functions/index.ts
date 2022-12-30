import type { Index } from "parsimmon";
import { FunctionType, IFunctionArg } from "./types";

export type FunctionBuilder<T> = (indexInfo: Index, args: IFunctionArg<T>[]) => FunctionType<T>

export class FunctionRegistry {
    readonly registry: Map<string, FunctionBuilder<any>> = new Map();

    constructor() {}

    register(name: string, builder: FunctionBuilder<any>) {
        if(this.registry.has(name)) throw new Error(`A function with name ${name} is already registered.`)

        this.registry.set(name, builder)
    }

    registerBulk(functions: Record<string, FunctionBuilder<any>>) {
        Object.entries(functions).forEach(([name, builder]) => this.register(name, builder))
    }

    get(name: string) {
        return this.registry.get(name)
    }

    listRegisteredFunctions() {
        return [ ...this.registry.keys() ];
    }
    
}
