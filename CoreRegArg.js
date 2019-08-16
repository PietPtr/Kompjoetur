/*


0: nop
1: ld  arg into reg
2: add reg and arg
3: sub reg and arg
4: jmp to arg if reg != 0
5: and reg and arg
6: or  reg and arg
7: not reg
8: xor reg and arg
9: shift left reg with arg&0x0f and shift right with arg&0xf0
a: rot left reg with arg&0x0f and rot right with arg&0xf0
b: save reg to arg
c: push reg to stack
d: pop reg to stack
e: write to outbus queue
f: read from outbus queue
*/

const INS_NAMES = [
    'NOP',
    'LD',
    'ADD',
    'SUB',
    'JMP',
    'AND',
    'OR',
    'NOT',
    'XOR',
    'SHIFT',
    'ROT',
    'SAVE',
    'PUSH',
    'POP',
    'WRITE',
    'READ'
]


class Core {
    constructor() {
        this.MEM_SIZE = 256;

        this.state = {
            memory: new Array(this.MEM_SIZE).fill(0x00),
            registers: new Array(8).fill(0x00),
            pc: 0
        }

        this.out = [];
        this.in = [];
    }

    step() {
        let argument = this.state.memory[this.state.pc + 1];

        let instruction = this.state.memory[this.state.pc];
        let opcode = instruction >> 4 & 0b1111;
        let argswitch = instruction >> 3 & 1;
        let register = instruction & 0b111;
        let argv = argswitch ? this.state.memory[argument] : argument;
        let regv = this.state.registers[register];

        let increment = true;

        switch (opcode) {
            case 0x0:
                break;
            case 0x1:
                this.state.registers[register] = argv;
                break;
            case 0x2:
                this.state.registers[register] = (regv + argv) & 0xff;
                break;hallo
            case 0x3:
                this.state.registers[register] = (regv - argv) & 0xff;
                break;
            case 0x4:
                this.state.pc = regv != 0 ? argv : this.state.pc;
                increment = regv == 0;
                break;
            case 0x5:
                this.state.registers[register] = regv & argv;
                break;
            case 0x6:
                this.state.registers[register] = regv | argv;
                break;
            case 0x7:
                this.state.registers[register] = (~regv) & 0xff;
                break;
            case 0x8:
                this.state.registers[register] = regv ^ argv;
                break;
            case 0x9:
                let intermediate = regv >> (argv & 0x0f);
                this.state.registers[register] = intermediate << (argv & 0xf0);
                break;
            case 0xa:
                // rotate
                break;
            case 0xb:
                this.state.memory[argv] = regv;
                break;
            case 0xc:
                this.state.memory[this.state.memory[0xff]] = regv;
                this.state.memory[0xff]--;
                break;
            case 0xd:
                this.state.memory[0xff]++;
                this.state.registers[register] = this.state.memory[this.state.memory[0xff]];
                break;
            case 0xe:
                this.out.push(regv);
                break;
            case 0xf:
                this.state.registers[register] = this.in.pop() || 0;
                break;
            default:

        }

        console.log(this.state.pc, instruction.toString(16), INS_NAMES[opcode], regv, argv)

        printBytes(this.state.registers);
        printBytes(this.state.memory.slice(0xf0));

        if (increment) {
            this.state.pc = (this.state.pc + 2) % this.MEM_SIZE;
        }
    }

    step_n(amount) {
        for (let i = 0; i < amount; i++) {
            this.step();
        }
    }
}



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
    console.log(program)

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
        let argument = split[2];
        let argswitch = 0;

        if (!(name in ['push', 'pop'])) {
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
