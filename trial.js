import { plot } from 'nodeplotlib';

import {
  Capacitor,
  ComponentValue,
  Inductor,
  VariableComponentValue,
} from './component.js';
import {
  Filter,
  SeriesFilterStage,
  ShuntFilterStage,
} from './filter.js';
import Load from './load.js';
import {
  makeMatchingNetworkObjective,
  optimizeFilter,
} from './optimize.js';
import TwoPortNetwork from './twoPortNetwork.js';

const knownGoodNetwork = TwoPortNetwork.cascade(
    TwoPortNetwork.series(Load.resistor(50)), 
    TwoPortNetwork.series(Load.inductor(3E-9)), 
    TwoPortNetwork.shunt(
      Load.parallel(
        Load.capacitor(2E-12),
        Load.resistor(660E3)
      )
    )
)

const initialComponentValue = (min, max) => ComponentValue.randomizeComponent(min, max, true, true);
    const initialStages = [
      new SeriesFilterStage(
        new Inductor(VariableComponentValue.initializeComponent(3E-9, 100E-9, 1E-9, true, true))),
      new ShuntFilterStage(
        new Capacitor(VariableComponentValue.initializeComponent(1E-12, 1E-9, 1E-12, true, false)))
    ];
    const inputLoad = Load.resistor(50);
    const outputLoad = 
      Load.parallel(
        Load.capacitor(2E-12),
        Load.resistor(660E3)
      )
    const initialFilter = new Filter(inputLoad, outputLoad, initialStages);
    const objectiveFunction = makeMatchingNetworkObjective(100E6, 1E9, 1, 10);
    const optimizedFilter = optimizeFilter(initialFilter, objectiveFunction, 100, 0.001, 10000);
    
    console.log(optimizedFilter.toString())

plotNetworks([initialFilter.network, knownGoodNetwork, optimizedFilter.network], 0, 10E9, 100)

function plotNetworks(networks, minFrequency, maxFrequency, npoints) {
    const networkPlots = networks.map((network) => {
    const xpoints = [];
    const ypoints = [];
    for (let i = minFrequency; i < maxFrequency; i += (maxFrequency - minFrequency) / npoints) {
        xpoints.push(i);
        ypoints.push(network.voltageGain(2 * Math.PI * i).abs());
    }

    return {x: xpoints, y: ypoints, type: 'scatter', layout: {

        xaxis: {
      
          type: 'log',
      
          autorange: true
      
        },
      
        yaxis: {
      
          type: 'log',
      
          autorange: true
      
        }
      
      }};
    });

    plot(networkPlots);

}