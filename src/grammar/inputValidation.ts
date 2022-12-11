import { Index } from "parsimmon";

export abstract class ValidationResult {
    abstract readonly success: boolean;
}

export class Success extends ValidationResult {
    success = true;
}

export type ValidationError = {
    index: Index;
    message: string;
};
export class Failure extends ValidationResult {
    success = false;

    errors: ValidationError[];

    constructor(errors: ValidationError[]) {
        super();
        this.errors = errors;
    }
}