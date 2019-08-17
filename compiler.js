
function tokenize(program) {
    return program.trim().replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').split(' ').filter(token => {
        return token != "" && token != '\n'
    }).map(token => token.trim());
}

function parse(tokens) {
    // console.log(tokens)
    if (tokens.length == 0) {
        throw "Unexpected EOF";
    }

    token = tokens.shift();
    if (token == '(') {
        let expressions = [];
        while (tokens[0] != ')') {
            expressions.push(parse(tokens));
        }
        tokens.shift();
        return expressions;
    } else if (token == ')') {
        throw "Unexpected ')'"
    } else {
        return atom(token)
    }
}

function atom(token) {
    let number = parseInt(token);
    if (!isNaN(number)) {
        return number;
    } else { // token is not a number, return symbol
        return token;
    }
}

function compile(ast, returnVarMap=false) {
    if (ast[0] == 'main') {
        let instructions =
            `ld reg0 0xfe\n` +
            `save reg0 0xff\n`;
        let environment = {};
        for (let tree of ast.slice(1)) {
            let statement = compileStatement(tree, environment);
            instructions += statement;
        }

        instructions += (
            `ld reg5 0xaf\n` +
            `>end\n` +
            `jump reg5 >end\n`
        )

        let memAddr = (instructions.split('\n').filter(ins => !ins.startsWith('>')).length - 1) * 2;
        let memMarkers = [];
        for (let instr of instructions.split('\n')) {
            let argument = instr.split(' ').filter(e => e != ' ')[2]
            if (argument && (argument.startsWith("PNT_") || argument.startsWith("VAR_"))) {
                memMarkers.push(argument);
            }
        }

        let varMap = {};
        for (let variable of memMarkers) {
            let variableName = variable.slice(4);
            if (!(variableName in varMap)) {
                varMap[variableName] = memAddr;
                memAddr++;
            }
        }

        for (let variable of memMarkers) {
            if (variable.startsWith('VAR_')) {
                let re = new RegExp(variable, "g");
                instructions = instructions.replace(re, hex(varMap[variable.slice(4)]));
            } else if (variable.startsWith('PNT_')) {
                let re = new RegExp(variable, "g");
                instructions = instructions.replace(re, '$' + hex(varMap[variable.slice(4)]));
            }
        }

        if (returnVarMap) {
            return {
                instructions: instructions,
                varMap: varMap
            }
        }

        return instructions;

    } else {
        throw 'Invalid AST'
    }
}

function compileBlock(ast, env) {
    let instructions = '';
    for (let statement of ast) {
        instructions += compileStatement(statement);
    }
    return instructions;
}

function compileStatement(ast, env) {
    switch (ast[0]) {
        case 'define':
            let value = compileExpression(ast[2]);
            return (
                value +
                `save reg0 VAR_${ast[1]}\n`
            );
        case 'if':
            let compExpr = compileExpression(ast[1]);
            let trueBlock = compileBlock(ast[2]);
            let falseBlock = compileBlock(ast[3]);
            let ifId = randomId();
            return (
                compExpr +
                `jump reg0 >false${ifId}\n` +
                trueBlock +
                `ld reg6 0x01\n` +
                `jump reg6 >endif${ifId}\n` +
                `>false${ifId}\n` +
                falseBlock +
                `>endif${ifId}\n`
            );
        case 'while':
            let whileCompExpr = compileExpression(ast[1]);
            let whileBlock = compileBlock(ast[2]);
            let whileId = randomId();
            return (
                `ld reg6 0x01\n` +
                `jump reg6 >whilecond${whileId}\n` +
                `>startwhile${whileId}\n` +
                whileBlock +
                `>whilecond${whileId}\n` +
                whileCompExpr +
                `jump reg0 >startwhile${whileId}\n`
            );
        default:
            throw "Unknown statement: " + ast[0];
    }
}

function compileExpression(ast, env) {
    if (typeof ast == 'number') {
        return `ld reg0 0x${ast.toString(16).padStart(2, '0')}\n`;
    } else if (typeof ast == 'string') {
        return `ld reg0 PNT_${ast}\n`
    } else {
        return funcs[ast[0]](ast)
    }
}

const funcs = {
    '+': (ast) => {
        let left = compileExpression(ast[1]);
        let right = compileExpression(ast[2]);
        return (
            `${left}` +
            `push reg0\n` +
            `${right}` +
            `pop reg1\n` +
            `add reg0 reg1\n`
        );
    },
    '-': (ast) => {
        let left = compileExpression(ast[1]);
        let right = compileExpression(ast[2]);
        return (
            `${right}` +
            `push reg0\n` +
            `${left}` +
            `pop reg1\n` +
            `sub reg0 reg1\n`
        );
    },
    '*': (ast) => {
        let left = compileExpression(ast[1]);
        let right = compileExpression(ast[2]);
        let id = randomId();
        return (
            `${right}` +
            `push reg0\n` +
            `${left}` +
            `pop reg1\n` +
            `sub reg1 0x01\n` +
            `ld reg2 reg0` +
            `ld reg6 0x01\n` +
            `jump reg6 >end${id}\n` +
            `>start${id}\n` +
            `add reg0 reg2\n` +
            `sub reg1 0x01\n` +
            `>end${id}\n` +
            `jump reg1 >start${id}\n`
        );
    },
    '==': (ast) => {
        return funcs['-'](ast);
    },
    '!=': (ast) => {
        let left = compileExpression(ast[1]);
        let right = compileExpression(ast[2]);
        let id = randomId();
        return (
            `${right}` +
            `push reg0\n` +
            `${left}` +
            `pop reg1\n` +
            `sub reg0 reg1\n` +
            `jump reg0 >cmpneq${id}\n` +
            `ld reg0 0x00\n` +
            `ld reg6 0x01\n` +
            `jump reg6 >end${id}\n` +
            `>cmpneq${id}\n` +
            `ld reg0 0x01\n` +
            `>end${id}\n`
        );
    }
}
