

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

let newreg =
`
    ld      reg0    0x05
    ld      reg1    0x06
    add     reg0    reg1
`

let accesslow =
`
    ld      reg0    0x04
    save    reg0    0xaa
    ld      reg1    0xbb
    save    reg0   $0xaa
`

let add =
`
(main
    (define a 0)
    (define b 0)
    (while (!= b 6) (
        (define b (+ b 1))
        (define a (+ a 7))
    ))
)
`
/*
(if (!= a b) (
    (define c 204)
) (
    (define c 187)
))



*/
//(define b (+ 5 6)) (define c b) (+ b (+ a 2)) )

let program =
    assemble(
    compile(
    parse(
    tokenize(
        add))));


for (let i = 0; i < program.length; i++) {
    core.state.memory[i] = program[i];
}
