import { strict as assert } from 'node:assert';

import { Component } from './component.js';
import Load from './load.js';
import TwoPortNetwork from './twoPortNetwork.js';

/**
 * Models a filter stage when optimizing a ladder filter
 */
export class FilterStage {
    /**
     * Constructs a ladder filter stage
     * @param {Array<Component>} components 
     * @param {function(Load): TwoPortNetwork} makeNetwork
     * @param {function(Array<Component>): FilterStage} updateStage
     */
    constructor(components, makeNetwork, updateStage) {
        assert(components instanceof Array);
        this.components = components;
        assert(makeNetwork instanceof Function);
        this.makeNetwork = makeNetwork;
        assert(updateStage instanceof Function);
        this.updateStage = updateStage;
    }

    /**
     * Creates a randomly selected "neighbor" filter stage
     * @returns {FilterStage}
     */
    update() {
        return this.updateStage(this.components.map((component) => component.update()));
    }

    /**
     * Gets the two-port network corresponding to this filter
     */
    get network() {
        return this.makeNetwork(
            Load.parallel(
                ...(this.components.map((component) => component.load())))
            );
    }

    toString() {
        return this.components.map((component) => component.toString()).join(", ");
    }
}

export class SeriesFilterStage extends FilterStage {
    constructor(...components) {
        const updateStage = (updatedComponents) => new SeriesFilterStage(...updatedComponents);
        const makeNetwork = TwoPortNetwork.series;
        super(components, makeNetwork, updateStage);
    }
}

export class ShuntFilterStage extends FilterStage {
    constructor(...components) {
        const updateStage = (updatedComponents) => new ShuntFilterStage(...updatedComponents);
        const makeNetwork = TwoPortNetwork.shunt
        super(components, makeNetwork, updateStage);
    }
}

/**
 * Models a ladder filter during optimization
 */
export class Filter {
    /**
     * Constructs a ladder filter
     * @param {Load} inputLoad 
     * @param {Load} outputLoad 
     * @param {Array<FilterStage>} stages 
     */
    constructor(inputLoad, outputLoad, stages) {
        assert(inputLoad instanceof Load);
        assert(outputLoad instanceof Load);
        assert(stages instanceof Array);

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

    toString() {
        return this.stages.map((stage) => stage.toString()).join("\n")
    }
}