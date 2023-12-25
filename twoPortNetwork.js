import { strict as assert } from 'node:assert';

import * as math from 'mathjs';

import Load from './load.js';

/**
 * Models a passive electrical two port network
 */
export class TwoPortNetwork {
    /**
     * Construct a two-port network from its ABCD matrix
     * @param {math.Matrix} abcdMatrix 
     */
    constructor(abcdMatrix) {
        assert(abcdMatrix);

        this.abcdMatrix = abcdMatrix;
    }

    /**
     * Gets the voltage gain of the network at a given angular frequency
     * @param {math.Complex} angularFrequency - Frequency at which to evaluate the voltage gain
     * @returns {number}
     */
    voltageGain(angularFrequency) {
        assert(angularFrequency >= 0);

        return math.divide(1, this.abcdMatrix(angularFrequency).get([0, 0]));
    }

    /**
     * Creates a two-port network from a series connected load
     * @param {Load} load 
     * @returns {TwoPortNetwork}
     */
    static series(load) {
        assert(load instanceof Load);

        return new TwoPortNetwork((angularFrequency) => math.matrix([[1 , load.impedance(angularFrequency)], [0, 1]]));
    }

    /**
     * Creates a two-port network from a shunt connected load
     * @param {Load} load 
     * @returns {TwoPortNetwork}
     */
    static shunt(load) {
        assert(load instanceof Load);

        return new TwoPortNetwork((angularFrequency) => math.matrix([[1, 0], [load.admittance(angularFrequency), 1]]));
    }

    /**
     * Constructs a two-port network from two loads in an L-section
     * @param {Load} seriesLoad 
     * @param {Load} shuntLoad 
     * @returns {TwoPortNetwork}
     */
    static lSection(seriesLoad, shuntLoad) {
        assert(seriesLoad);
        assert(seriesLoad instanceof Load);
        assert(shuntLoad);
        assert(shuntLoad instanceof Load);

        return TwoPortNetwork.cascade(
            TwoPortNetwork.series(seriesLoad), 
            TwoPortNetwork.shunt(shuntLoad)
        );
    }

    /**
     * Constructs a two-port network corresponding to a Cauer ladder filter stage
     * Each leg of the L-section consists of a capacitor and an inductor in parallel
     * @param {number} seriesParallelInductance - Series leg inductor value 
     * @param {number} seriesParallelCapacitance - Series leg capacitor value
     * @param {number} shuntParallelInductance - Shunt leg inductor value
     * @param {number} shuntParallelCapacitance - Shunt leg capacitor value
     * @returns {TwoPortNetwork}
     */
    static cauerLsection(seriesParallelInductance, seriesParallelCapacitance, shuntParallelInductance, shuntParallelCapacitance) {
        assert(seriesParallelCapacitance >= 0);
        assert(seriesParallelInductance >= 0);
        assert(shuntParallelCapacitance >= 0);
        assert(shuntParallelInductance >= 0);

        const lCParallelLoad = 
            (inductance, capacitance) => Load.parallel(Load.capacitor(capacitance), Load.inductor(inductance))

        return TwoPortNetwork.lSection(
            lCParallelLoad(seriesParallelInductance, seriesParallelCapacitance), 
            lCParallelLoad(shuntParallelInductance, shuntParallelCapacitance)
        );
    }

    /**
     * Constructs a two-port network corresponding to a transformer connected between the ports
     * @param {number} turnsRatio - Turns ratio for the transformer
     * @returns {TwoPortNetwork}
     */
    static transformer(turnsRatio) {
        assert(turnsRatio);
        assert(turnsRatio > 0);

        return new TwoPortNetwork(() => math.matrix([[turnsRatio, 0], [0, 1 / turnsRatio]]));
    }

    /**
     * Constructs an identity two port network, that is, a network that has no effect when inserted in a cascade
     * @returns {TwoPortNetwork}
     */
    static identity() {
        return TwoPortNetwork.transformer(1)
    }

    /**
     * Cascades a series of connected two-port networks to form a new two-port network
     * @param  {...TwoPortNetwork} stages - Stages to cascade together
     * @returns {TwoPortNetwork}
     */
    static cascade(...stages) {
        assert(stages);

        const combineStages = (combinedStages, nextStage) => {
            assert(nextStage);
            assert(nextStage instanceof TwoPortNetwork);

            return new TwoPortNetwork(
            (angularFrequency) => math.multiply(combinedStages.abcdMatrix(angularFrequency), nextStage.abcdMatrix(angularFrequency)))
        }

        return stages.reduce(
            combineStages, 
            TwoPortNetwork.identity()
        );
    }
}

export default TwoPortNetwork
