import { plot } from 'nodeplotlib';

import Load from './load.js';
import {
  ComponentValue,
  Filter,
  FilterStage,
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
    const makeFilterStage = () => new FilterStage(initialComponentValue(1E-8, 1E-9), initialComponentValue(0, 0), initialComponentValue(1E9, 1E8), initialComponentValue(10E-9, 1E-12));
    const initialStages = [makeFilterStage()];
    const inputLoad = Load.resistor(50);
    const outputLoad = Load.parallel(Load.resistor(680E3), Load.capacitor(3E-9));
    const initialFilter = new Filter(inputLoad, outputLoad, initialStages);
    const objectiveFunction = makeMatchingNetworkObjective(100E6, 1E9, 100, 10);
    const optimizedFilter = optimizeFilter(initialFilter, objectiveFunction, 100E6, 0.00001, 100000);
    
    
    const optimizedNetwork = optimizedFilter.network
    console.log(optimizedFilter.stages[0].toString())

//plotNetworks([knownGoodNetwork, optimizedNetwork], 0, 10E9, 100)

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