import math from 'mathjs';

class TwoPortNetwork {
    constructor(abcdMatrix) {
        this.abcdMatrix = abcdMatrix;
    }
    voltageGain(angularFrequency) {
        return indexMatrix(abcdMatrix(angularFrequency), 1, 1);
    }
    static series(load) {
        return new TwoPortNetwork((angularFrequency) => math.matrix([[1 , load.impedance(angularFrequency)], [0, 1]]));
    }
    static shunt(load) {
        return new TwoPortNetwork((angularFrequency) => math.matrix([[1, 0], load.admittance(angularFrequency)]));
    }
    static lSection(seriesLoad, shuntLoad) {
        return TwoPortNetwork.cascade(
            TwoPortNetwork.series(seriesLoad), 
            TwoPortNetwork.shunt(shuntLoad)
        );
    }
    static cauerLsection(seriesParallelInductance, seriesParallelCapacitance, shuntParallelInductance, shuntParallelCapacitance) {
        const lCParallelLoad = 
            (inductance, capacitance) => Load.parallel(Load.capacitor(capacitance), Load.inductor(inductance))

        return TwoPortNetwork.lSection(
            lCParallelLoad(seriesParallelInductance, seriesParallelCapacitance), 
            lCParallelLoad(shuntParallelInductance, shuntParallelCapacitance)
        );
    }
    static transformer(turnsRatio) {
        return new TwoPortNetwork(() => math.matrix([1 / turnsRatio, 0], [0, turnsRatio]));
    }
    static identity() {
        return TwoPortNetwork.transformer(1)
    }
    static cascade(...stages) {
        return stages.reduce(
            (combinedStages, nextStage) => new TwoPortNetwork(
                (angularFrequency) => math.multiply(combinedStages.abcdMatrix(angularFrequency), nextStage.abcdMatrix(angularFrequency))
            ), 
            TwoPortNetwork.identity()
        );
    }
}

export default TwoPortNetwork
