const util = require("util")
const P = require("parsimmon")

const _ = P.optWhitespace
const EQUALS = P.string("=")
const OPEN_PAR = P.string("(")
const CLOSE_PAR = P.string(")")
const COMMA = P.string(",")

const FN_NAME = P.alt(
    P.string("SUM"),
    P.string("SUB")
)

const Function = P.lazy(() => 
    P.seqObj(
        ["fn", FN_NAME],
        OPEN_PAR,
        ["args", FnArgs], 
        CLOSE_PAR
    )
);

const RestArgs = P.lazy(() => 
    P.seqMap(
        COMMA.trim(_),
        Expression,
        (comma, expr) => expr
    ).atLeast(1)
);

const FnArgs = P.lazy(() =>
    P.alt(
        P.seq(
            Expression, // first args
            RestArgs // subsequent args
        ).map(([firstArg, restArgs]) => ([firstArg, ...restArgs])),
        Expression
    )
);

// Operators should allow whitespace around them, but not require it. This
// helper combines multiple operators together with names.
//
// Example: operators({Add: "+", Sub: "-"})
//
// Gives back an operator that parses either + or - surrounded by optional
// whitespace, and gives back the word "Add" or "Sub" instead of the character.
function operators(ops) {
    let keys = Object.keys(ops).sort();
    let ps = keys.map(k =>
        P.string(ops[k])
            .trim(_)
            .result(k)
    );
    return P.alt.apply(null, ps);
  }
  
// Takes a parser for the prefix operator, and a parser for the base thing being
// parsed, and parses as many occurrences as possible of the prefix operator.
// Note that the parser is created using `P.lazy` because it's recursive. It's
// valid for there to be zero occurrences of the prefix operator.
function PREFIX(operatorsParser, nextParser) {
    let parser = P.lazy(() => {
        return P.seq(operatorsParser, parser).or(nextParser);
    });
    return parser;
}
  
// Ideally this function would be just like `PREFIX` but reordered like
// `P.seq(parser, operatorsParser).or(nextParser)`, but that doesn't work. The
// reason for that is that Parsimmon will get stuck in infinite recursion, since
// the very first rule. Inside `parser` is to match parser again. Alternatively,
// you might think to try `nextParser.or(P.seq(parser, operatorsParser))`, but
// that won't work either because in a call to `.or` (aka `P.alt`), Parsimmon
// takes the first possible match, even if subsequent matches are longer, so the
// parser will never actually look far enough ahead to see the postfix
// operators.
function POSTFIX(operatorsParser, nextParser) {
    // Because we can't use recursion like stated above, we just match a flat list
    // of as many occurrences of the postfix operator as possible, then use
    // `.reduce` to manually nest the list.
    //
    // Example:
    //
    // INPUT  :: "4!!!"
    // PARSE  :: [4, "factorial", "factorial", "factorial"]
    // REDUCE :: ["factorial", ["factorial", ["factorial", 4]]]
    return P.seqMap(nextParser, operatorsParser.many(), (x, suffixes) =>
        suffixes.reduce((acc, x) => [x, acc], x)
    );
}
  
// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// right. (e.g. 1^2^3 is 1^(2^3) not (1^2)^3)
function BINARY_RIGHT(operatorsParser, nextParser) {
    let parser = P.lazy(() =>
        nextParser.chain(next =>
            P.seq(operatorsParser, P.of(next), parser).or(P.of(next))
        )
    );
    return parser;
}
  
// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// left. (e.g. 1-2-3 is (1-2)-3 not 1-(2-3))
function BINARY_LEFT(operatorsParser, nextParser) {
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
    return P.seqMap(
        nextParser,
        P.seq(operatorsParser, nextParser).many(),
        (first, rest) => {
            return rest.reduce((acc, ch) => {
            let [op, another] = ch;
            return [op, acc, another];
            }, first);
        }
    );
}

const String = P.regexp(/\w+/)
    .map(str => ["String", str])
    .desc("string");

const Num = P.regexp(/[0-9]+/)
    .notFollowedBy(String)
    .map(str => ["Number", Number(str)])
    .desc("number");

const Value = P.alt(Num, String);

// A basic unit is any parenthesized expression or a number.
const Unit = P.lazy(() => 
    OPEN_PAR.then(Expression).skip(CLOSE_PAR)
    .or(Function)
    .or(Value)
)

// Now we can describe the operators in order by precedence. You just need to
// re-order the table.
const table = [
    { type: PREFIX, ops: operators({ Negate: "-" }) },
    { type: POSTFIX, ops: operators({ Factorial: "!" }) },
    { type: BINARY_RIGHT, ops: operators({ Exponentiate: "^" }) },
    { type: BINARY_LEFT, ops: operators({ Multiply: "*", Divide: "/" }) },
    { type: BINARY_LEFT, ops: operators({ Add: "+", Subtract: "-" }) }
  ];
  
// Start off with Unit as the base parser for numbers and thread that through the
// entire table of operator parsers.
const tableParser = table.reduce(
    (acc, level) => level.type(level.ops, acc),
    Unit
);

const Expression = tableParser.trim(_)

const grammar = P.seq(EQUALS, Expression)
    .or(Value)

// let ast = grammar.parse("3")
// let ast = grammar.parse("=1+2*SUM(3,a3+3a, a)")
let ast = grammar.parse("=-1+2*SUM(3,a3+3a, a)")
// let ast = grammar.parse("=1*2+SUM(SUM(1,2), SUB(2,1))")
console.log(util.inspect(ast, {showHidden: true, depth: 8, colors: true}));

// TODO 
// * AST traversal (also processing when there is no starting '=' (directly having a string or number - no expression))
// * Generalize functions definition, as well as .exec in order to compute their values
// * function args validation
