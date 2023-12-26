import * as math from 'mathjs';
import { test } from 'tap';

import Load from './load.js';
import TwoPortNetwork from './twoPortNetwork.js';

test('Test TwoPortNetwork - Series Connection', (t) => {
    const load = Load.resistor(50);
    const seriesNetwork = TwoPortNetwork.series(load);

    const angularFrequency = 2;
    const voltageGain = seriesNetwork.voltageGain(angularFrequency);

    t.equal(voltageGain.re, 1);
    t.equal(voltageGain.im, 0);

    t.end();
});

test('Test TwoPortNetwork - Shunt Connection', (t) => {
    const load = Load.capacitor(0.01);
    const shuntNetwork = TwoPortNetwork.shunt(load);

    const angularFrequency = 4;
    const voltageGain = shuntNetwork.voltageGain(angularFrequency);

    // Replace with your expected result
    t.equal(voltageGain.re, 1);
    t.equal(voltageGain.im, 0);

    t.end();
});

test('Test TwoPortNetwork - L Section', (t) => {
    const seriesLoad = Load.resistor(1);
    const shuntLoad = Load.capacitor(1);
    const lSectionNetwork = TwoPortNetwork.lSection(seriesLoad, shuntLoad);

    const angularFrequency = 1;
    const voltageGain = lSectionNetwork.voltageGain(angularFrequency);
    const expectedVoltageGain = math.divide(
        1, 
        math.add(1, math.multiply(math.i, angularFrequency)));

    t.equal(voltageGain.re,  expectedVoltageGain.re);
    t.equal(voltageGain.im, expectedVoltageGain.im);

    t.end();
});

test('Test TwoPortNetwork - Identity', (t) => {
    const identityNetwork = TwoPortNetwork.identity();

    const voltageGain = identityNetwork.voltageGain(69);
    t.equal(voltageGain.re, 1);
    t.equal(voltageGain.im, 0);

    t.end();
});

test('Test TwoPortNetwork - Transformer', (t) => {
    const identityNetwork = TwoPortNetwork.transformer(2);

    const voltageGain = identityNetwork.voltageGain(69);
    t.equal(voltageGain.re, 0.5);
    t.equal(voltageGain.im, 0);

    t.end();
});