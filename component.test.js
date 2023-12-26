import { test } from 'tap';

import { ComponentValue } from './component.js';

test("ComponentValue", (t) => {
    t.test('Test ComponentValue - Initialization', (t) => {
        const initialValue = 2.7;
        const maxValue = 10.0;
        const minValue = 1.0;

        const component = ComponentValue.initializeComponent(initialValue, maxValue, minValue);

        t.equal(component.value, initialValue);
        t.ok(component.feasibleValues.includes(initialValue));

        t.end();
    });

    t.test('Test ComponentValue - Update', (t) => {
        const initialValue = 2.7;
        const maxValue = 10.0;
        const minValue = 1.0;

        const component = ComponentValue.initializeComponent(initialValue, maxValue, minValue);

        const updatedComponent = component.update();

        t.not(updatedComponent, component);
        t.ok(updatedComponent.feasibleValues.includes(updatedComponent.value));

        t.end();
    });

    t.test('Test ComponentValue - Nearest Neighbor Index', (t) => {
        const value = 2.5;
        const neighbors = [2.2, 2.7, 3.3];

        const nearestNeighborIndex = ComponentValue.nearestNeighborIndex(value, neighbors);

        t.equal(nearestNeighborIndex, 1); // Index of 2.7 in neighbors array

        t.end();
    });

    t.test('Test ComponentValue - Feasible Preferred Values', (t) => {
        const minValue = 1.0;
        const maxValue = 10.0;

        const feasibleValues = ComponentValue.feasiblePreferredValues(minValue, maxValue);

        t.ok(feasibleValues.length > 0);
        t.ok(feasibleValues.every(value => value >= minValue && value <= maxValue));
        t.ok(feasibleValues.every(value => ComponentValue.nearestNeighborIndex(value, feasibleValues) !== -1));

        t.end();
    });
    t.end();
})
