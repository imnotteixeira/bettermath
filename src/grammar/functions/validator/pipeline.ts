import type P from "parsimmon"
import { ValidationError } from ".";
import { IFunctionArg } from "../types";
import argLengthValidator from "./argLengthValidator";
import argTypeValidator, { ArgTypeDefinition } from "./argTypeValidator";

type PipelineValidatorResult = undefined | ValidationError[]

export type PipelineValidator = (validators: ArgValidator[]) => ({ validate: () => PipelineValidatorResult })

export const validationPipeline = (fnName: string, args: IFunctionArg<any>[], indexInfo: P.Index): PipelineValidator => (validators: ArgValidator[]) => {
    
    const validate = () => {
        for (const validator of validators) {
            let nextCalled = false;
            let errors: ValidationError[] = [];
            validator(fnName, args, indexInfo, (validationErrors?: ValidationError[]) => {
                nextCalled = true
                if(validationErrors) {
                    errors = validationErrors;
                }
            })
            if(!nextCalled) throw new Error("Validator function must call next(errors?)")
            if(errors.length) return errors;
        }
        return undefined;
    }
    
    return { validate }
}

export type ArgValidator = (fnName: string, args: IFunctionArg<any>[], indexInfo: P.Index, next: (_?: ValidationError[]) => void) => void

export type FunctionValidatorBuilder<T extends any[]> = (...args: T) => ArgValidator;

export const CommonValidators = {
    ARG_LENGTH: (length: number) => argLengthValidator(length),
    ARG_TYPES: (...argTypes: ArgTypeDefinition[]) => argTypeValidator(...argTypes)
}
