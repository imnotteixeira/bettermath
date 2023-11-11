import type P from "parsimmon"
import type { Index } from "parsimmon";
import { IExpressionType, Types } from "../../definitions"
import { IFunction } from "../types";

export type { PipelineValidator, ArgValidator } from "./pipeline" 
export { CommonValidators } from "./pipeline" 

export type ValidationResult = typeof Success | ISyntaxFailure | ISemanticFailure

const Success = {
    success: true
} as const;

export const makeSuccess = () => Success;

export type ValidationError = {
    index: Index;
    message: string;
};

export interface ISemanticFailure {
    success: false;
    errors: ValidationError[];
}

export const makeSemanticFailure = (errors: ValidationError[]): ISemanticFailure => ({
    success: false,
    errors
})

export interface ISyntaxFailure {
    success: false;
    error: P.Failure;
}

export const makeSyntaticFailure = (error: P.Failure): ISyntaxFailure => ({
    success: false,
    error
})

export const validate = (ast: P.Result<IExpressionType<any>>): ValidationResult => {
    if(!ast.status) return makeSyntaticFailure(ast)
    
    const validationResult = ast.value.validate();

    const validationErrors: ValidationError[] = []

    if(!validationResult.success) {
        validationErrors.push(...(validationResult as ISemanticFailure).errors)
    }
    
    if(ast.value.type === Types.FUNCTION) {
        const argValidationErrors: ISemanticFailure[] = (ast as P.Success<IFunction<any>>).value.args
            .map(arg => arg.validate())
            .filter(argValidationResult => !argValidationResult.success) as ISemanticFailure[]
        
        if(argValidationErrors.length) {
            validationErrors.push(...argValidationErrors.flatMap(semanticError => semanticError.errors))
        }
    }

    if(validationErrors.length) return makeSemanticFailure(validationErrors)
    return makeSuccess()

}
