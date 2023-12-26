import { strict as assert } from 'node:assert';

import Complex from 'complex.js';

const reciprocal = (value) => Complex.ONE.div(value)

/**
 * Calculates the impedance of the load at a given frequency
 * @callback Impedance
 * @param {number} angularFrequency - Complex angular frequency at which to calculate the impedance value
 * @returns {Complex} - Impedance value at a given frequency
 */

/**
 * @callback Admittance
 * @param {number} angularFrequency - Complex angular frequency at which to calculate the admittance value
 * @returns {Complex} - Admittance value at a given frequency
 */

/**
 * Models a passive electrical load
 */
export class Load {
    /**
     * Constructs a passive electrical load
     * @param {Impedance} impedance 
     */
    constructor(impedance) {
        assert(impedance);
        assert(impedance instanceof Function)

        this.getImpedance = impedance;
    }

    impedance(angularFrequency) {
        assert(angularFrequency >= 0);

        return this.getImpedance(angularFrequency)
    }

    /**
     * Gets the admittance of the load
     * @returns {Admittance}
     */
    admittance(angularFrequency) {
        assert(angularFrequency >= 0);

        return reciprocal(this.getImpedance(angularFrequency));
    }

    /**
     * Creates a capacitive load
     * @param {number} capacitance - Load capacitance
     * @returns {Load}
     */
    static capacitor(capacitance) {
        assert(capacitance >= 0);

        return new Load(
            (angularFrequency) => 
                reciprocal(Complex.I.mul(angularFrequency).mul(capacitance)));
    }

    /**
     * Creates an inductive load
     * @param {number} inductance - Load inductance
     * @returns {Load}
     */
    static inductor(inductance) {
        assert(inductance >= 0);

        return new Load((angularFrequency) => Complex.I.mul(angularFrequency).mul(inductance));
    }

    /**
     * Creates a resistive load
     * @param {number} resistance - Load resistance
     * @returns {Load}
     */
    static resistor(resistance) {
        assert(resistance >= 0);

        return new Load(() => new Complex(resistance, 0));
    }

    /**
     * Creates a new load by combining two loads in parallel
     * @param  {...Load} loads - Loads to combine in parallel
     * @returns {Load}
     */
    static parallel(...loads) {
        assert(loads);

        return new Load((angularFrequency) => {
            let evaluatedAdmittance = Complex.ZERO;
            for (const load of loads) {
                assert(load instanceof Load)
                evaluatedAdmittance = evaluatedAdmittance.add(load.admittance(angularFrequency));
            }
            return reciprocal(evaluatedAdmittance);
        })
    }

    /**
     * Creates a new load by combining two loads in series
     * @param  {...Load} loads - Loads to combine in series
     * @returns {Load}
     */
    static series(...loads) {
        assert(loads)

        return new Load((angularFrequency) => {
            let combinedImpedance = Complex.ZERO;
            for (const load of loads) {
                assert(load instanceof Load);
                combinedImpedance = combinedImpedance.add(load.impedance(angularFrequency));
            }
            return combinedImpedance;
        })
    }
}

export default Load
