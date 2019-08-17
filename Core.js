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
e: write reg to queue to connection arg
f: read from connection arg to reg

arg is:
    if argswitch bit = 0: immediate value
    if argswitch bit = 1:
        if arg < 8:
            register number arg
        else:
            address arg
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
    constructor(name) {
        this.MEM_SIZE = 256;
        this.name = name;

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
        let argv = argument;
        if (argswitch == 1) {
            if (argument < 8) {
                argv = this.state.registers[argument];
            } else {
                argv = this.state.memory[argument];
            }
        }
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
                this.state.memory[0xff] = (this.state.memory[0xff] - 1) & 0xff;
                break;
            case 0xd:
                this.state.memory[0xff] = (this.state.memory[0xff] + 1) & 0xff;
                this.state.registers[register] = this.state.memory[this.state.memory[0xff]];
                break;
            case 0xe:
                this.out.push(regv);
                break;
            case 0xf:
                this.state.registers[register] = this.in.pop() || 0;
                break;
            default:
                break;
        }

        // console.log(this.state.pc, hex(instruction), INS_NAMES[opcode], hex(regv), hex(argv))
        //
        // printBytes(this.state.registers);
        // printBytes(this.state.memory.slice(0xf0));

        if (increment) {
            this.state.pc = (this.state.pc + 2) % this.MEM_SIZE;
        }
    }

    step_n(amount) {
        for (let i = 0; i < amount; i++) {
            this.step();
        }
    }

    step_show(n=1, memoryElement, registerElement, pcElement, varMapElement, varMap) {
        let memstr = byteMatrixToString(this.state.memory, 16);
        let pc = (this.state.pc) * 3;
        let ustart = pc + 7 + Math.floor(this.state.pc / 16) * 7;
        let uend = pc + 12 + Math.floor(this.state.pc / 16) * 7;
        memstr = memstr.slice(0, ustart) + '<u>' + memstr.slice(ustart, uend) + '</u>' + memstr.slice(uend);
        memoryElement.innerHTML = memstr;
        registerElement.innerHTML = bytesToString(this.state.registers);
        pcElement.innerHTML = hex(this.state.pc);
        varMapElement.innerHTML = Object.keys(varMap).map(variable => {
            let addr = varMap[variable]
            return `${variable}@${hex(addr)}: ${core.state.memory[addr]}`;
        }).join('\n');

        this.step_n(n);
    }

    dump() {
        console.log("PC:", hex(this.state.pc))
        console.log("Registers:")
        printBytes(this.state.registers);
        console.log("Memory:");
        printBytes(this.state.memory);
    }
}
