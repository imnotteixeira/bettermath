import { ValueResolvingResult } from "../../definitions"

export const resolveValuesOnlyNumbers = <T>(values: ValueResolvingResult<T>[]) => {

    const anyError = values.find(val => val.isError)
    
    if (anyError) {
        throw anyError.getError()
    }

    const resolvedValues = values.map(result => result.get())
    if (resolvedValues.some(val => !Number.isFinite(val))) {
        throw new Error("Arguments must be numbers.")
    }

    return resolvedValues
}