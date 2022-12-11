import { inspect } from "util";
import P from "parsimmon";
import {
    IExpressionType,
    MathOperatorDefinition,
    MathOperatorType,
    INumberType,
    IStringType,
    StringType,
    NumberType,
    IValueType,
} from "./definitions";
import { FunctionType, IFunctionArg } from "./functions/types";
import { FunctionDefinitions, FunctionName } from "./functions";

const _ = P.optWhitespace;
const EQUALS = P.string("=");
const OPEN_PAR = P.string("(");
const CLOSE_PAR = P.string(")");
const COMMA = P.string(",");

const FN_NAME: P.Parser<FunctionName> = P.alt<FunctionName>(
    ...(Object.keys(FunctionDefinitions) as FunctionName[]).map(fn => P.string<FunctionName>(fn)),
);

const Function = P.lazy(() =>
    P.seqObj<FunctionType<any>>(
        ["fn", FN_NAME],
        OPEN_PAR,
        ["indexInfo", P.index],
        ["args", FnArgs],
        CLOSE_PAR,
    ).map<FunctionType<any>>(
        (params: { fn: FunctionName; args: IFunctionArg<any>[]; indexInfo: P.Index }) =>
            FunctionDefinitions[params.fn](params.args, params.indexInfo),
    ),
);

const RestArgs = P.lazy(() =>
    P.seqMap<string, IFunctionArg<any>, IFunctionArg<any>>(
        COMMA.trim(_),
        Expression,
        (_: string, expr: IExpressionType<any>) => expr,
    ).atLeast(1),
);

const FnArgs = P.lazy(() =>
    P.alt<IFunctionArg<any>[]>(
        P.seq<IFunctionArg<any>, IFunctionArg<any>[]>(
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
function mathOperators(ops: Partial<Record<FunctionName, string>>): P.Parser<FunctionName> {
    let keys = (Object.keys(ops) as FunctionName[]).sort();
    let ps = keys.map(k => P.string(ops[k]!).trim(_).result(k));
    return P.alt.apply(null, ps);
}

// Takes a parser for the prefix operator, and a parser for the base thing being
// parsed, and parses as many occurrences as possible of the prefix operator.
// Note that the parser is created using `P.lazy` because it's recursive. It's
// valid for there to be zero occurrences of the prefix operator.
const PREFIX: MathOperatorType = (operatorsParser, nextParser) => {
    const parser: P.Parser<IExpressionType<any>> = P.lazy(() => {
        return (
            P.seqMap<FunctionName, IExpressionType<any>, P.Index, IExpressionType<any>>(
                operatorsParser,
                parser,
                P.index,
                (op: FunctionName, exp: IExpressionType<any>, index: P.Index) =>
                    FunctionDefinitions[op]([exp], index),
            )
                // .map<IFunction<any>>(([op, exp, index]: [FunctionName, IExpressionType<any>, ]) =>
                //     FunctionDefinitions[op]([exp]),
                // )
                .or<IExpressionType<any>>(nextParser)
        );
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
    return P.seqMap<IExpressionType<any>, FunctionName[], P.Index, IExpressionType<any>>(
        nextParser,
        operatorsParser.many(),
        P.index,
        (x, suffixes, index) =>
            suffixes.reduceRight<IExpressionType<any>>(
                (acc: IExpressionType<any>, currentSuffix: FunctionName) =>
                    FunctionDefinitions[currentSuffix]([acc], index),
                x,
            ),
    );
};

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// right. (e.g. 1^2^3 is 1^(2^3) not (1^2)^3)
const BINARY_RIGHT: MathOperatorType = (operatorsParser, nextParser) => {
    let parser: P.Parser<IExpressionType<any>> = P.lazy(() =>
        nextParser.chain<IExpressionType<any>>(next =>
            P.seqMap<
                FunctionName,
                IExpressionType<any>,
                IExpressionType<any>,
                P.Index,
                IExpressionType<any>
            >(
                operatorsParser,
                P.of(next),
                parser,
                P.index,
                (
                    operator: FunctionName,
                    leftExp: IExpressionType<any>,
                    rightExp: IExpressionType<any>,
                    index: P.Index,
                ) => FunctionDefinitions[operator]([leftExp, rightExp], index),
            ).or<IExpressionType<any>>(P.of(next)),
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
    return P.seqMap<
        IExpressionType<any>,
        [FunctionName, IExpressionType<any>][],
        P.Index,
        IExpressionType<any>
    >(
        nextParser,
        P.seq<FunctionName, IExpressionType<any>>(operatorsParser, nextParser).many(),
        P.index,
        (first, rest, index) => {
            return rest.reduce<IExpressionType<any>>(
                (acc: IExpressionType<any>, ch: [FunctionName, IExpressionType<any>]) => {
                    let [op, another] = ch;
                    return FunctionDefinitions[op]([acc, another], index);
                },
                first,
            );
        },
    );
};

// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
const interpretEscapes = (str: string) => {
    const escapes: Record<string, string> = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        '"': '"',
    };
    return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/g, (_, escape) => {
        const type = escape.charAt(0);
        const hex = escape.slice(1);
        if (type === "u") {
            return String.fromCharCode(parseInt(hex, 16));
        }
        if (escapes.hasOwnProperty(type)) {
            return escapes[type];
        }

        return type;
    });
};

const QuotedString: P.Parser<IStringType> = P.regexp(/"((?:\\.|.)*?)"/, 1)
    .map(interpretEscapes)
    .map<StringType>(str => new StringType(str))
    .desc("string");

const Word: P.Parser<IStringType> = P.regexp(/\w+/)
    .map<StringType>(str => new StringType(str))
    .desc("string");

const RawString: P.Parser<IStringType> = P.regexp(/^(?!=).+$/)
    .map<StringType>(str => new StringType(str))
    .desc("string");

const Num: P.Parser<INumberType> = P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)
    .notFollowedBy(Word)
    .map<INumberType>(str => new NumberType(str))
    .desc("number");

const ExpressionValue = P.alt<IValueType<number> | IValueType<string>>(Num, QuotedString);
const ImmediateValue = P.alt<IValueType<number> | IValueType<string>>(
    Num.notFollowedBy(RawString),
    RawString,
);

// A basic unit is any parenthesized expression, a number, or a quoted string.
const Unit: P.Parser<IExpressionType<any>> = P.lazy(() =>
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
const tableParser: P.Parser<IExpressionType<any>> = table.reduce<P.Parser<IExpressionType<any>>>(
    (acc, level) => level.type(level.ops, acc),
    Unit,
);

const Expression: P.Parser<IExpressionType<any>> = tableParser.trim(_);

const grammar: P.Parser<IExpressionType<any>> = P.seq(EQUALS, Expression)
    .map(([_, exp]) => exp)
    .or(ImmediateValue);


const INPUT = '=5+"2"'
// let ast = grammar.parse('=5*2*-(3-3)');
let ast = grammar.parse(INPUT);
// let ast = grammar.parse("=-1+2*SUM(3,a3+3a, a)")
// let ast = grammar.parse("=1*2+SUM(SUM(1,2), SUB(2,1))")
// let ast = grammar.parse("=SUM(SUB(1,2))")
// let ast = grammar.parse("=1+2")
// let ast = grammar.parse("=--(1!)+-(2*-SUM(3,2))")
console.log(inspect(ast, { showHidden: true, depth: 12, colors: true }));


// validate works on node level
//     - each node validates itself by checking its direct children types (only applies to functions -numbers and strings are valid by default)
//     - need to have a map from fnName to its return type so that validation can use that without computing values
//     -have a validate function that receives the AST and validates all nodes
//     - store the components index on the input string (Expression -> index on string) so that validation can point to correct place

console.log(
    inspect((ast as P.Success<IExpressionType<any>>).value.validate(), {
        showHidden: true,
        depth: 12,
        colors: true,
    }),
);

console.log("INITIAL INPUT:", INPUT)

export default grammar;

// TODO
//  function args validation for other functions
//  input validation tests
