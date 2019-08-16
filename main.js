

let core = new Core();

let prog =
`
    ld      reg2    0x06 ; een comment
    ld      reg1    0x07
    save    reg1    0xf0
    save    reg1    0xf1
>loop
    add     reg0   $0xf1
    save    reg0    0xf0
    sub     reg2    0x01
    jump    reg2   >loop
>end
    jump    reg0   >end
`

let pushpop =
`
    ld      reg0    0xfe
    save    reg0    0xff
    ld      reg0    0xbb
    push    reg0
    ld      reg0    0xcc
    push    reg0
    pop     reg1
    pop     reg2
`

let program = assemble(pushpop);


for (let i = 0; i < program.length; i++) {
    core.state.memory[i] = program[i];
}
