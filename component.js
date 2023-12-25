import { strict as assert } from 'node:assert';

import Load from './load.js';

/**
 * E24 Preferred values for electronic components
 */
const E24_VALUES = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

export class ComponentValue {
    constructor(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    update() {
        return new ComponentValue(this.value);
    }
}

/**
 * Manages the values of electronic components during filter optimization
 */
export class VariableComponentValue extends ComponentValue {
    /**
     * Makes a component value
     * @param {Array<number>} feasibleValues - An array of "E series" preferred numbers
     * @param {number} valueIndex - The index in the feasibleValues array corresponding to the component value
     */
    constructor(feasibleValues, valueIndex) {
        assert(feasibleValues);
        assert(feasibleValues instanceof Array);
        assert(valueIndex >= 0);
        super();

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
     * @returns {VariableComponentValue}
     */
    update() {
        return new VariableComponentValue(this.feasibleValues, this._nextIndex());
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
        assert(minValue > 0);
        assert(maxValue >= minValue);

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
     * @returns {VariableComponentValue}
     */
    static initializeComponent(initialValue, maxValue, minValue, allowZero = false, allowInfinite = false) {
        assert(initialValue >= 0);
        assert(minValue > 0)
        assert(maxValue >= minValue);

        const feasibleValues = VariableComponentValue.feasiblePreferredValues(minValue, maxValue);
        if (allowZero)
            feasibleValues.unshift(0);
        if (allowInfinite)
            feasibleValues.push(Infinity);

        const valueIndex = VariableComponentValue.nearestNeighborIndex(initialValue, feasibleValues);

        return new VariableComponentValue(feasibleValues, valueIndex);
    }

    static randomizeComponent(maxValue, minValue, allowZero = false, allowInfinite = false) {
        return VariableComponentValue.initializeComponent(
            Math.random() * (maxValue - minValue) + minValue, 
            maxValue, 
            minValue, 
            allowZero, 
            allowInfinite
        );
    }
}

/**
 * Models an individual passive electronic component
 */
export class Component {
    /**
     * Constructs an electronic component
     * @param {string} componentName - The name of the component type, e.g. "capacitor", "inductor", etc.
     * @param {ComponentValue} componentValue - The value of the component
     * @param {function(*): Load} makeLoad - Takes the component value and creates the corresponding load
     */
    constructor(componentName, componentValue, makeLoad){
        this.componentName = componentName;
        assert(componentValue instanceof ComponentValue);
        this.componentValue = componentValue;
        assert(makeLoad instanceof Function);
        this.makeLoad = makeLoad;
    }

    load() {
        return this.makeLoad(this.componentValue.value);
    }

    update() {
        return new Component(this.componentName, this.componentValue.update(), this.makeLoad);
    }

    toString() {
        return `${this.componentName}: ${this.componentValue.value}`;
    }
}

export class Capacitor extends Component {
    constructor(capacitance) {
        super('capacitor', capacitance, Load.capacitor);
    }
}

export class Inductor extends Component {
    constructor(inductance) {
        super('inductor', inductance, Load.inductor);
    }
}

