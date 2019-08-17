


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

const memElement = document.getElementById('memdisplay');
const registerElement = document.getElementById('registerdisplay');
const pcElement = document.getElementById('pc');
const speedometer = document.getElementById('speedometer');
const programElement = document.getElementById('program');
const assemblyElement = document.getElementById('assembly');
const errorElement = document.getElementById('error');
const varMapElement = document.getElementById('varmap');

let core = null;
let varMap = null;

function setup(program) {
    clearTimeout(timer);

    core = new Core();

    let tokens = tokenize(program);
    let ast = parse(tokens);
    let compileResult = compile(ast, true);
    let assembly = compileResult.instructions;
    let code = assemble(assembly);
    varMap = compileResult.varMap;

    for (let i = 0; i < code.length; i++) {
        core.state.memory[i] = code[i];
    }

    programElement.innerHTML = program;
    assemblyElement.innerHTML = prettier(assembly);

    update();
}

function update() {
    core.step_show(1, memElement, registerElement, pcElement, varMapElement, varMap);

    timer = setTimeout(update, speed);
}

function setSpeed(value) {
    let newSpeed = Math.round(2 ** parseFloat(value));
    speedometer.innerHTML = newSpeed + ' ms/step';
    speed = newSpeed;
}

function compileTextarea() {
    try {
        setup(programElement.value);
        error.innerHTML = '';
    } catch (e) {
        error.innerHTML = e
    }
}


let speed = 10;
let timer = null;

setSpeed(speed);
setup(add);
