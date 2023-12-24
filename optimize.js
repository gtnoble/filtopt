import { strict as assert } from 'node:assert';

import integrateAdaptiveSimpson from 'integrate-adaptive-simpson';

import TwoPortNetwork from './twoPortNetwork.js';

/**
 * E24 Preferred values for electronic components
 */
const E24_VALUES = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

/**
 * Manages the values of electronic components during filter optimization
 */
class ComponentValue {
    /**
     * Makes a component value
     * @param {Array<number>} feasibleValues - An array of "E series" preferred numbers
     * @param {number} valueIndex - The index in the feasibleValues array corresponding to the component value
     */
    constructor(feasibleValues, valueIndex) {
        assert(feasibleValues);
        assert(feasibleValues instanceof Array);
        assert(valueIndex >= 0);

        this.feasibleValues = feasibleValues;
        this.valueIndex = valueIndex;
    }

    /**
     * Returns the evaluated component value
     * @returns {number}
     */
    get value() {
        return this.feasibleValues[this.valueIndex];
    }

    /**
     * Creates a new component value from a randomly selected neighboring value
     * @returns {ComponentValue}
     */
    update() {
        return new ComponentValue(this.feasibleValues, this._nextIndex());
    }

    /**
     * Generates an index corresponding to the updated component value
     * @returns {number}
     */
    _nextIndex() {
        if (this.valueIndex == 0)
            return 1;
        if (this.valueIndex == this.feasibleValues.length - 1)
            return this.feasibleValues.length - 2;
        return this.valueIndex + (Math.random() > 0.5 ? 1 : -1);
    }

    /**
     * Finds the index of the nearest neighbor to a value 
     * @param {number} value - Initial raw component value
     * @param {Array<number} neighbors - An array of neighboring numbers 
     * @returns {number} - Index corresponding to the nearest neighbor amongst the preferred values
     */
    static nearestNeighborIndex(value, neighbors) {
        assert(value);
        assert(neighbors);
        assert(neighbors instanceof Array);

        const upperValueIndex = neighbors.findIndex((feasibleValue) => value <= feasibleValue);
        if (upperValueIndex === 0)
            return upperValueIndex

        const lowerValueIndex = upperValueIndex - 1;
        const lowerValue = neighbors[lowerValueIndex];
        const upperValue = neighbors[upperValueIndex];

        return Math.abs(value - upperValue) <= Math.abs(value - lowerValue) ? upperValueIndex : lowerValueIndex;
    }

    /**
     * Returns a list of "E Series" preferred component value numbers between the min and max values
     * @param {number} minValue 
     * @param {number} maxValue 
     * @returns {Array<number>}
     */
    static feasiblePreferredValues(minValue, maxValue) {
        assert(minValue);
        assert(maxValue);

        const minSeries = Math.floor(Math.log10(minValue));
        const maxSeries = Math.ceil(Math.log10(maxValue));
        let values = [];
        for (let orderOfMagnitude = minSeries; orderOfMagnitude <= maxSeries; orderOfMagnitude++) {
            for (const eValue of E24_VALUES) {
                const candidateValue = eValue * Math.pow(10, orderOfMagnitude);
                if (candidateValue >= minValue && candidateValue <= maxValue)
                    values.push(candidateValue);
            }
        }
        return values.sort((a, b) => a - b);
    }

    /**
     * Initializes a component
     * @param {number} initialValue - Initial component value number
     * @param {number} maxValue - Max feasible component value number
     * @param {number} minValue - Min feasible component value number
     * @param {boolean} allowZero - Is zero a possible component value number?
     * @param {boolean} allowInfinite - Can a component have an infinite value?
     * @returns {ComponentValue}
     */
    static initializeComponent(initialValue, maxValue, minValue, allowZero = false, allowInfinite = false) {
        assert(initialValue);
        assert(maxValue);
        assert(minValue);

        const feasibleValues = ComponentValue.feasiblePreferredValues(minValue, maxValue);
        if (allowZero)
            feasibleValues.unshift(0);
        if (allowInfinite)
            feasibleValues.push(Infinity);

        const valueIndex = ComponentValue.nearestNeighborIndex(initialValue, feasibleValues);

        return new ComponentValue(feasibleValues, valueIndex);
    }
}

/**
 * Models a filter stage when optimizing a ladder filter
 */
class FilterStage {
    /**
     * Constructs a ladder filter stage
     * @param {ComponentValue} seriesInductance
     * @param {ComponentValue} seriesCapacitance 
     * @param {ComponentValue} shuntInductance 
     * @param {ComponentValue} shuntCapacitance 
     */
    constructor(seriesInductance, seriesCapacitance, shuntInductance, shuntCapacitance) {
        assert(seriesInductance instanceof ComponentValue);
        assert(seriesCapacitance instanceof ComponentValue);
        assert(shuntInductance instanceof ComponentValue);
        assert(shuntCapacitance instanceof ComponentValue);

        this.seriesInductance = seriesInductance;
        this.seriesCapacitance = seriesCapacitance;
        this.shuntInductance = shuntInductance;
        this.shuntCapacitance = shuntCapacitance;
    }

    /**
     * Creates a randomly selected "neighbor" filter stage
     * @returns {FilterStage}
     */
    update() {
        return new FilterStage(
            this.seriesInductance.update(), 
            this.seriesCapacitance.update(), 
            this.shuntInductance.update(), 
            this.shuntCapacitance.update());
    }

    /**
     * Gets the two-port network corresponding to this filter
     */
    get network() {
        return TwoPortNetwork.cauerLsection(
            this.seriesInductance.value, 
            this.seriesCapacitance.value, 
            this.shuntInductance.value, 
            this.shuntCapacitance.value
        );
    }

    toString() {
        return `seriesInductance: ${this.seriesInductance.value}\nseriesCapacitance: ${this.seriesCapacitance.value}\nshuntInductance: ${this.shuntInductance.value}\nshuntCapacitance: ${this.shuntCapacitance.value}`
    }
}

/**
 * Models a ladder filter during optimization
 */
class Filter {
    /**
     * Constructs a ladder filter
     * @param {TwoPortNetwork} inputLoad 
     * @param {TwoPortNetwork} outputLoad 
     * @param {Array<FilterStage>} stages 
     */
    constructor(inputLoad, outputLoad, stages) {
        assert(inputLoad);
        assert(outputLoad);
        assert(stages);

        this.inputLoad = inputLoad;
        this.outputLoad = outputLoad;
        this.stages = stages;
    }

    /**
     * Creates a randomly selected "neighbor" ladder filter
     * @returns {Filter}
     */
    update() {
        const updatedStages = this.stages.map(
            (stage) => {
                assert(stage instanceof FilterStage);
                return stage.update();
            }
        );
        return new Filter(this.inputLoad, this.outputLoad, updatedStages);
    }

    /**
     * Gets the two-port network corresponding to the filter and its input and output loads
     * @returns {TwoPortNetwork}
     */
    get network() {
        const stageNetworks = this.stages.map(
            (stage) => {
                assert(stage instanceof FilterStage);
                return stage.network;
            }
        )
        return TwoPortNetwork.cascade(TwoPortNetwork.series(this.inputLoad), ...stageNetworks, TwoPortNetwork.shunt(this.outputLoad));
    }
}

/**
 * @callback ObjectiveFunction
 * @param {Filter} filter - Filter to evaluate fitness of
 * @returns {number}
 */

/**
 * Optimizes a filter according to an objective function using simulated annealing
 * @param {Filter} initialFilter - Initial filter before optimization
 * @param {ObjectiveFunction} objectiveFunction - Objective function to minimize
 * @param {number} initialTemperature - Initial optimization "temperature"
 * @param {number} coolingRate - Optmization "temperature" cooling rate
 * @param {number} iterations - Number of iterations to perform
 * @returns {Filter}
 */
function optimizeFilter(initialFilter, objectiveFunction, initialTemperature, coolingRate, iterations) {
    assert(initialFilter);
    assert(objectiveFunction);
    assert(initialTemperature);
    assert(coolingRate);
    assert(iterations);

    let filter = initialFilter;
    let temperature = initialTemperature;
    let objectiveValue = objectiveFunction(initialFilter);
    for (let i = 0; i < iterations; i++) {
        const candidateFilter = filter.update();
        const candidateObjectiveValue = objectiveFunction(candidateFilter);
        if (Math.random() <= Math.pow(2, - (candidateObjectiveValue - objectiveValue) / temperature)) {
            filter = candidateFilter;
            objectiveValue = candidateObjectiveValue;
        }
        temperature = temperature - temperature * coolingRate;
    }
    return filter
}

/**
 * Objective function for optimizing an impedance matching filter
 * @param {number} minFrequency 
 * @param {number} maxFrequency 
 * @param {number} maxGainDeviation 
 * @returns {number}
 */
function makeMatchingNetworkObjective(minFrequency, maxFrequency, maxGainDeviation, integrationTolerance = 0.01, maxIter = 20) {
    assert(minFrequency);
    assert(maxFrequency);
    assert(maxGainDeviation);

    const maxGainVariance = Math.pow(maxGainDeviation * 2, 2);

    return (filter) => {
        assert(filter)

        const network = filter.network
        const meanGain = integrateAdaptiveSimpson(
            (angularFrequency) => network.voltageGain(angularFrequency).abs(), 
            minFrequency / (2 * Math.PI), 
            maxFrequency / (2 * Math.PI), 
            integrationTolerance, 
            maxIter
        ) / (maxFrequency - minFrequency);

        const gainVariance = integrateAdaptiveSimpson(
            (angularFrequency) => Math.pow(network.voltageGain(angularFrequency).abs() - meanGain, 2), 
            minFrequency / (2 * Math.PI), 
            maxFrequency / (2 * Math.PI), 
            integrationTolerance, 
            maxIter
        ) / (maxFrequency - minFrequency);

        if (gainVariance > maxGainVariance)
            return Infinity;

        return -meanGain;
    }
}

export {
  ComponentValue,
  Filter,
  FilterStage,
  makeMatchingNetworkObjective,
  optimizeFilter,
};
