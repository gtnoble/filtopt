import { strict as assert } from 'node:assert';

import { Filter } from './filter.js';
import TwoPortNetwork from './twoPortNetwork.js';

/**
 * @callback ObjectiveFunction
 * @param {TwoPortNetwork} filter - Network to evaluate fitness of
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
export function optimizeFilter(initialFilter, objectiveFunction, initialTemperature, coolingRate, iterations) {
    assert(initialFilter);
    assert(objectiveFunction);
    assert(initialTemperature);
    assert(coolingRate);
    assert(iterations);

    let filter = initialFilter;
    let temperature = initialTemperature;
    let objectiveValue = objectiveFunction(filter.network);
    for (let i = 0; i < iterations; i++) {
        const candidateFilter = filter.update();
        const candidateObjectiveValue = objectiveFunction(candidateFilter.network);
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
export function makeMatchingNetworkObjective(minFrequency, maxFrequency, maxGainDeviation, nTestSamples = 20) {
    assert(minFrequency);
    assert(maxFrequency);
    assert(maxGainDeviation);

    const maxAngularFrequency = maxFrequency * 2 * Math.PI;
    const minAngularFrequency = minFrequency * 2 * Math.PI;
    const angularFrequencyRange = (maxAngularFrequency - minAngularFrequency)

    return (network) => {
        assert(network instanceof TwoPortNetwork)
        
        let currentMinGain
        let currentMaxGain
        let gainSum = 0
        for (
            let angularFrequency = minAngularFrequency; 
            angularFrequency < maxAngularFrequency; 
            angularFrequency += angularFrequencyRange / nTestSamples
        ) {
            const sample = network.voltageGain(angularFrequency).abs();
            if (currentMinGain === undefined || sample < currentMinGain) 
                currentMinGain = sample;
            if (currentMaxGain === undefined || sample > currentMaxGain)
                currentMaxGain = sample;
            gainSum += sample
        }

        const meanGain = gainSum / nTestSamples;
        const gainDeviation = 10 * Math.log10(currentMaxGain) - 10 * Math.log10(currentMinGain);


        if (gainDeviation > maxGainDeviation)
            return Infinity;

        const meanGainDb = 10 * Math.log10(meanGain)
        console.log(`${meanGainDb} ${gainDeviation}`)

        return -10 * Math.log10(meanGain);
    }
}