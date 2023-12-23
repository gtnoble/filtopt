import math from 'mathjs';

const reciprocal = (value) => math.divide(1, value)

class Load {
    constructor(impedance) {
        this.impedance = impedance;
    }
    get admittance() {
        return (angularFrequency) => reciprocal(this.impedance(angularFrequency));
    }
    static capacitor(capacitance) {
        return new Load((angularFrequency) => math.complex(0, 1 / (angularFrequency * capacitance)));
    }
    static inductor(inductance) {
        return new Load((angularFrequency) => math.complex(0, angularFrequency * inductance));
    }
    static resistor(resistance) {
        return new Load(() => math.complex(resistance, 0));
    }
    static parallel(...loads) {
        return new Load((angularFrequency) => {
            let evaluatedAdmittance = 0;
            for (const load of loads) {
                evaluatedAdmittance = math.add(evaluatedAdmittance, load.admittance(angularFrequency));
            }
            return reciprocal(evaluatedAdmittance);
        })
    }
    static series(...loads) {
        return new Load((angularFrequency) => {
            let combinedImpedance = 0;
            for (const load of loads) {
                combinedImpedance = math.add(combinedImpedance, load.impedance(angularFrequency));
            }
            return combinedImpedance;
        })
    }
}
