
const NAME_TO_OPCODE = {
    'nop': 0x0,
    'ld': 0x1,
    'add': 0x2,
    'sub': 0x3,
    'jump': 0x4,
    'and': 0x5,
    'or': 0x6,
    'not': 0x7,
    'xor': 0x8,
    'shift': 0x9,
    'rot': 0xa,
    'save': 0xb,
    'push': 0xc,
    'pop': 0xd,
    'write': 0xe,
    'read': 0xf
}

function assemble(program) {

    // remove trailing and leading newlines
    let lines = program.replace(/^\s+|\s+$/g, '').split('\n');

    let symbols = {};
    let instructions = [];

    let counter = 0;
    for (let i = 0; i < lines.length; i++) {
        // remove comments
        lines[i] = lines[i].split(';')[0]

        line = lines[i];

        // check for symbols
        if (line.startsWith('>')) {
            let symbol = line.split('>');
            if (symbol.length <= 1 || !symbol[1]) {
                console.error('ERROR: invalid symbol name at line', i, ':', line);
                return [];
            } else {
                symbol = symbol[1];
                symbols[symbol] = counter;
            }
        } else {
            instructions.push(line);
            counter += 2;
        }
    }

    let assembled = [];

    for (let i = 0; i < instructions.length; i++) {
        let instruction = instructions[i];

        let split = instruction.split(' ').filter(element => element != '');

        let name = split[0];
        if (name == 'nop') {
            assembled.push(0x00);
            assembled.push(0x00);
            continue;
        }
        let reg = parseInt(split[1][3], 10);
        let argument = split[2] || 0;
        let argswitch = 0;

        if (['push', 'pop', 'not'].filter(n => n != name).length == 3 ) {
            if (argument.startsWith('>')) {
                argument = argument.split('>')[1];
                if (argument in symbols) {
                    argument = symbols[argument];
                } else {
                    console.error('ERROR: cannot find symbol', argument);
                    return [];
                }
            } else if (argument.startsWith('$')) {
                argument = parseInt(argument.split('$')[1], 16);
                argswitch = 1;
                if (argument < 8) {
                    console.warn('WARNING: you are trying to access byte', argument, 'in memory. This has been assembled to accessing register', argument, '. Use pointers if you want to access address', argument);
                }
            } else if (argument.startsWith('reg')) {
                argument = parseInt(argument[3]);
                argswitch = 1;
            } else {
                argument = parseInt(argument, 16);
            }
        }

        let opcode = NAME_TO_OPCODE[name];
        if (!opcode) {
            console.error('ERROR: cannot find opcode for name', name);
            return [];
        }

        let ins =
            opcode << 4 |
            argswitch << 3 |
            reg

        assembled.push(ins);
        assembled.push(argument);
    }

    return assembled;
}
