

class Substrate {
    constructor(n) {
        this.cores = [];
        this.connections = {};

        for (let i = 0; i < n ** 4; i++) {
            let coords = indexToCoord4D(i,n,n,n);
            let core = new Core(`${coords.x}*${coords.y}*${coords.z}*${coords.q}`);
            this.cores.push(core);
        }

        for (let i = 0; i < this.cores.length; i++) {
            let coords = indexToCoord4D(i,n,n,n);
            let connections = []
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        for (let q = -1; q <= 1; q += 2) {
                            let index = coordToIndex4D(coords.x + x,coords.y + y, coords.z + z,coords.q + q,n,n,n);
                            if (index >= 0 && index < n ** 4) {
                                connections.push(this.cores[index]);
                            }
                        }
                    }
                }
            }
            this.connections[this.cores[i].name] = connections;
        }
    }
}
