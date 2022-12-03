import { inspect } from "util";
import * as P from "parsimmon";
import type {
    ExpressionType,
    IFunction,
    IFunctionArg,
    MathOperation,
    MathOperatorDefinition,
    MathOperatorType,
    NumberType,
    StringType,
    ValueType,
} from "./function/definitions";

const _ = P.optWhitespace;
const EQUALS = P.string("=");
const OPEN_PAR = P.string("(");
const CLOSE_PAR = P.string(")");
const COMMA = P.string(",");

const FN_NAME = P.alt(P.string("SUM"), P.string("SUB"), P.string("CONCAT"));

const Function = P.lazy(() =>
    P.seqObj<IFunction>(["fn", FN_NAME], OPEN_PAR, ["args", FnArgs], CLOSE_PAR).map<IFunction>(
        (params: { fn: string; args: IFunctionArg[] }) => ({ type: "function", ...params }),
    ),
);

const RestArgs = P.lazy(() =>
    P.seqMap<string, IFunctionArg, IFunctionArg>(
        COMMA.trim(_),
        Expression,
        (_: string, expr: ExpressionType) => expr,
    ).atLeast(1),
);

const FnArgs = P.lazy(() =>
    P.alt<IFunctionArg[]>(
        P.seq<IFunctionArg, IFunctionArg[]>(
            Expression, // first arg
            RestArgs, // subsequent args
        ).map(([firstArg, restArgs]) => [firstArg, ...restArgs]),
        Expression.map(exp => [exp]), // always return an array of args, even though there's only 1
    ),
);

// Operators should allow whitespace around them, but not require it. This
// helper combines multiple operators together with names.
//
// Example: operators({Add: "+", Sub: "-"})
//
// Gives back an operator that parses either + or - surrounded by optional
// whitespace, and gives back the word "Add" or "Sub" instead of the character.
function mathOperators(ops: Record<string, string>): P.Parser<MathOperation> {
    let keys = Object.keys(ops).sort();
    let ps = keys.map(k => P.string(ops[k]).trim(_).result(k));
    return P.alt.apply(null, ps);
}

// Takes a parser for the prefix operator, and a parser for the base thing being
// parsed, and parses as many occurrences as possible of the prefix operator.
// Note that the parser is created using `P.lazy` because it's recursive. It's
// valid for there to be zero occurrences of the prefix operator.
const PREFIX: MathOperatorType = (operatorsParser, nextParser) => {
    const parser: P.Parser<ExpressionType> = P.lazy(() => {
        return P.seq<MathOperation, ExpressionType>(operatorsParser, parser)
            .map<IFunction>(([op, exp]: [MathOperation, ExpressionType]) => ({
                type: "function",
                fn: op,
                args: [exp],
            }))
            .or<ExpressionType>(nextParser);
    });
    return parser;
};

// Ideally this function would be just like `PREFIX` but reordered like
// `P.seq(parser, operatorsParser).or(nextParser)`, but that doesn't work. The
// reason for that is that Parsimmon will get stuck in infinite recursion, since
// the very first rule. Inside `parser` is to match parser again. Alternatively,
// you might think to try `nextParser.or(P.seq(parser, operatorsParser))`, but
// that won't work either because in a call to `.or` (aka `P.alt`), Parsimmon
// takes the first possible match, even if subsequent matches are longer, so the
// parser will never actually look far enough ahead to see the postfix
// operators.
const POSTFIX: MathOperatorType = (operatorsParser, nextParser) => {
    // Because we can't use recursion like stated above, we just match a flat list
    // of as many occurrences of the postfix operator as possible, then use
    // `.reduce` to manually nest the list.
    //
    // Example:
    //
    // INPUT  :: "4!!!"
    // PARSE  :: [4, "factorial", "factorial", "factorial"]
    // REDUCE :: ["factorial", ["factorial", ["factorial", 4]]]
    return P.seqMap<ExpressionType, MathOperation[], ExpressionType>(
        nextParser,
        operatorsParser.many(),
        (x, suffixes) =>
            suffixes.reduceRight<ExpressionType>(
                (acc: ExpressionType, currentSuffix: MathOperation) => ({
                    type: "function",
                    fn: currentSuffix,
                    args: [acc],
                }),
                x,
            ),
    );
};

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// right. (e.g. 1^2^3 is 1^(2^3) not (1^2)^3)
const BINARY_RIGHT: MathOperatorType = (operatorsParser, nextParser) => {
    let parser: P.Parser<ExpressionType> = P.lazy(() =>
        nextParser.chain<ExpressionType>(next =>
            P.seq<MathOperation, ExpressionType, ExpressionType>(
                operatorsParser,
                P.of(next),
                parser,
            )
                .map<ExpressionType>(
                    ([operator, leftExp, rightExp]: [
                        MathOperation,
                        ExpressionType,
                        ExpressionType,
                    ]) => ({
                        type: "function",
                        fn: operator,
                        args: [leftExp, rightExp],
                    }),
                )
                .or<ExpressionType>(P.of(next)),
        ),
    );
    return parser;
};

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// left. (e.g. 1-2-3 is (1-2)-3 not 1-(2-3))
const BINARY_LEFT: MathOperatorType = (operatorsParser, nextParser) => {
    // We run into a similar problem as with the `POSTFIX` parser above where we
    // can't recurse in the direction we want, so we have to resort to parsing an
    // entire list of operator chunks and then using `.reduce` to manually nest
    // them again.
    //
    // Example:
    //
    // INPUT  :: "1+2+3"
    // PARSE  :: [1, ["+", 2], ["+", 3]]
    // REDUCE :: ["+", ["+", 1, 2], 3]
    return P.seqMap<ExpressionType, [MathOperation, ExpressionType][], ExpressionType>(
        nextParser,
        P.seq<MathOperation, ExpressionType>(operatorsParser, nextParser).many(),
        (first, rest) => {
            return rest.reduce<ExpressionType>(
                (acc: ExpressionType, ch: [MathOperation, ExpressionType]) => {
                    let [op, another] = ch;
                    return {
                        type: "function",
                        fn: op,
                        args: [acc, another],
                    };
                },
                first,
            );
        },
    );
};

// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
const interpretEscapes = (str: string) => {
    let escapes: Record<string, string> = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        '\"': '"',
    };
    return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/g, (_, escape) => {
        let type = escape.charAt(0);
        let hex = escape.slice(1);
        if (type === "u") {
            return String.fromCharCode(parseInt(hex, 16));
        }
        if (escapes.hasOwnProperty(type)) {
            return escapes[type];
        }

        return type;
    });
};

const QuotedString: P.Parser<StringType> = P.regexp(/"((?:\\.|.)*?)"/, 1)
    .map(interpretEscapes)
    .map<StringType>(str => ({ type: "string", value: str }))
    .desc("string");

const Word: P.Parser<StringType> = P.regexp(/\w+/)
    .map<StringType>(str => ({ type: "string", value: str }))
    .desc("string");

const RawString: P.Parser<StringType> = P.regexp(/^(?!=).+$/)
    .map<StringType>(str => ({ type: "string", value: str }))
    .desc("string");

const Num: P.Parser<NumberType> = P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)
    .notFollowedBy(Word)
    .map<NumberType>(str => ({ type: "number", value: Number(str) }))
    .desc("number");

const ExpressionValue = P.alt<ValueType>(Num, QuotedString);
const ImmediateValue = P.alt<ValueType>(Num.notFollowedBy(RawString), RawString);

// A basic unit is any parenthesized expression, a number, or a quoted string.
const Unit: P.Parser<ExpressionType> = P.lazy(() =>
    OPEN_PAR.then(Expression).skip(CLOSE_PAR).or(Function).or(ExpressionValue),
);

// Operators in order by precedence.
// Order of elements in the array matters here!
const table: MathOperatorDefinition[] = [
    { type: PREFIX, ops: mathOperators({ Negate: "-" }) },
    { type: POSTFIX, ops: mathOperators({ Factorial: "!" }) },
    { type: BINARY_RIGHT, ops: mathOperators({ Exponentiate: "^" }) },
    { type: BINARY_LEFT, ops: mathOperators({ Multiply: "*", Divide: "/" }) },
    { type: BINARY_LEFT, ops: mathOperators({ Add: "+", Subtract: "-" }) },
];

// Start off with Unit as the base parser for numbers and thread that through the
// entire table of operator parsers.
const tableParser: P.Parser<ExpressionType> = table.reduce<P.Parser<ExpressionType>>(
    (acc, level) => level.type(level.ops, acc),
    Unit,
);

const Expression: P.Parser<ExpressionType> = tableParser.trim(_);

const grammar: P.Parser<ExpressionType> = P.seq(EQUALS, Expression)
    .map(([_, exp]) => exp)
    .or(ImmediateValue);

// let ast = grammar.parse("=3s4")
// let ast = grammar.parse("=-1+2*SUM(3,a3+3a, a)")
// let ast = grammar.parse("=1*2+SUM(SUM(1,2), SUB(2,1))")
// let ast = grammar.parse("=SUM(SUB(1,2))")
// let ast = grammar.parse("=1+2")
// let ast = grammar.parse("=--(1!)+-(2*-SUM(3,2))")
// console.log(inspect(ast, {showHidden: true, depth: 12, colors: true}));

// const gds = ast as P.Success<["=", RecursiveExpression]>
// console.log((gds.value[1] as BaseType).type)

export default grammar;

// TODO
// * Generalize functions definition, as well as .exec in order to compute their values
// * function args validation
// * AST traversal (also processing when there is no starting '=' (directly having a string or number - no expression))
