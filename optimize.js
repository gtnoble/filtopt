import integrateAdaptiveSimpson from 'integrate-adaptive-simpson';

import TwoPortNetwork from './twoPortNetwork';

const E24_VALUES = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

class ComponentValue {
    constructor(feasibleValues, valueIndex) {
        this.feasibleValues = feasibleValues;
        this.valueIndex = valueIndex;
    }

    get value() {
        return this.feasibleValues[this.valueIndex];
    }

    update() {
        return new ComponentValue(this.feasibleValues, this._nextIndex());
    }

    _nextIndex() {
        if (this.valueIndex == 0)
            return 1;
        if (this.valueIndex == this.feasibleValues.length - 1)
            return this.feasibleValues.length - 2;
        return this.valueIndex + (Math.random() > 0.5 ? 1 : -1);
    }

    static nearestPreferredValueIndex(value, preferredValues) {
        const upperValueIndex = this.feasibleValues.findIndex((feasibleValue) => value <= feasibleValue);
        const lowerValueIndex = upperValueIndex - 1;
        const lowerValue = E24_VALUES[lowerValueIndex];
        const upperValue = E24_VALUES[upperValueIndex];

        return Math.abs(value - upperValue) <= Math.abs(value - lowerValue) ? upperValueIndex : lowerValueIndex;
    }

    static feasiblePreferredValues(minValue, maxValue) {
        const minSeries = Math.floor(Math.log10(minValue));
        const maxSeries = math.ceil(Math.log10(maxValue));
        let values = [];
        for (let orderOfMagnitude = minSeries; orderOfMagnitude <= maxSeries; orderOfMagnitude++) {
            for (const eValue of E24_VALUES) {
                candidateValue = eValue * Math.pow(10, orderOfMagnitude);
                if (candidateValue >= minValue && candidateValue <= maxValue)
                    values.push(candidateValue);
            }
        }
        return values.sort((a, b) => a - b);
    }

    static initializeComponent(initialValue, maxValue, minValue, allowZero, allowInfinite) {
        const feasibleValues = ComponentValue.feasibleValues(minValue, maxValue);
        if (allowZero)
            feasibleValues.unshift(0);
        if (allowInfinite)
            feasibleValues.push(Infinity);

        const valueIndex = ComponentValue.nearestPreferredValueIndex(initialValue, feasibleValues);

        return new ComponentValue(feasibleValues, valueIndex);
    }
}


class FilterStage {
    constructor(seriesInductance, seriesCapacitance, shuntInductance, shuntCapacitance) {
        this.seriesInductance = seriesInductance;
        this.seriesCapacitance = seriesCapacitance;
        this.shuntInductance = shuntInductance;
        this.shuntCapacitance = shuntCapacitance;
    }

    update() {
        return new FilterStage(
            this.seriesInductance.update(), 
            this.seriesCapacitance.update(), 
            this.shuntInductance.update(), 
            this.shuntCapacitance.update());
    }

    get network() {
        return TwoPortNetwork.cauerLsection(
            this.seriesInductance.value, 
            this.seriesCapacitance.value, 
            this.shuntInductance.value, 
            this.shuntCapacitance.value
        );
    }
}

class Filter {
    constructor(inputLoad, outputLoad, stages) {
        this.inputLoad = inputLoad;
        this.outputLoad = outputLoad;
        this.stages = stages;
    }

    update() {
        return new Filter(this.stages.map((stage) => stage.update()));
    }

    get network() {
        return TwoPortNetwork.cascade(TwoPortNetwork.series(this.inputLoad), ...this.stages.map((stage) => stage.network), TwoPortNetwork.shunt(this.outputLoad));
    }

}

function optimizeFilter(initialFilter, objectiveFunction, iterations) {
    let filter = initialFilter;
    let objectiveValue = objectiveFunction(initialFilter);
    for (let i = 0; i < iterations; i++) {
        const candidateFilter = filter.update();
        candidateObjectiveValue = objectiveFunction(candidateFilter);
        if (Math.random() <= Math.exp(- (candidateObjectiveValue - objectiveValue) / temperature)) {
            filter = candidateFilter;
            objectiveValue = candidateObjectiveValue
        }
    }
    return filter
}

function gainFlatness(network, startFrequency, endFrequency, tol, maxIter) {
    meanGain = integrateAdaptiveSimpson(
        (angularFrequency) => network.voltageGain(angularFrequency).abs(), 
        startFrequency / (2 * Math.PI), 
        endFrequency / (2 * Math.PI), 
        tol, 
        maxIter
    ) / (endFrequency - startFrequency);
    gainVariance = integrateAdaptiveSimpson(
        (angularFrequency) => Math.pow(network.voltageGain(angularFrequency).abs() - meanGain, 2), 
        startFrequency / (2 * Math.PI), 
        endFrequency / (2 * Math.PI), 
        tol, 
        maxIter
    ) / (endFrequency - startFrequency);
    return Math.sqrt(gainVariance);
}

