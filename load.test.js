import { test } from 'tap';

import Load from './load.js';

test('Test Capacitor Impedance', (t) => {
    const capacitance = 1;
    const capacitorLoad = Load.capacitor(capacitance);

    const angularFrequency = 1; 
    const impedance = capacitorLoad.impedance(angularFrequency);

    t.equal(impedance.re, 0);
    t.equal(impedance.im, -1); 

    t.end();
});

test('Test Inductor Admittance', (t) => {
    const inductance = 1;
    const inductorLoad = Load.inductor(inductance);

    const angularFrequency = 1; // Replace with your test value
    const admittance = inductorLoad.admittance(angularFrequency);

    t.equal(admittance.re, 0);
    t.equal(admittance.im, -1); // Replace with the expected imaginary part

    t.end();
});

test('Test Series Combination', (t) => {
    const resistance = 1;
    const resistiveLoad = Load.resistor(resistance);

    const seriesResistance = Load.series(resistiveLoad, resistiveLoad);
    const impedance = seriesResistance.impedance(69);

    t.equal(impedance.re, 2);
    t.equal(impedance.im, 0);

    t.end();
});

test('Test Parallel Combination', (t) => {
    const resistance = 1;
    const resistiveLoad = Load.resistor(resistance);

    const parallelResistance = Load.parallel(resistiveLoad, resistiveLoad);
    const impedance = parallelResistance.impedance(69);

    t.equal(impedance.re, 0.5);
    t.equal(impedance.im, 0);

    t.end();
});