import { plot } from 'nodeplotlib';

import Load from './load.js';
import {
  ComponentValue,
  Filter,
  FilterStage,
  makeMatchingNetworkObjective,
  optimizeFilter,
} from './optimize.js';

const initialComponentValue = ComponentValue.initializeComponent(100E-9, 1E-3, 1E-9, true, true);
    const makeFilterStage = () => new FilterStage(initialComponentValue, initialComponentValue, initialComponentValue, initialComponentValue);
    const initialStages = [makeFilterStage()];
    const inputLoad = Load.resistor(50);
    const outputLoad = Load.parallel(Load.resistor(680E3), Load.capacitor(3E-9));
    const initialFilter = new Filter(inputLoad, outputLoad, initialStages);
    const objectiveFunction = makeMatchingNetworkObjective(100E6, 1E9, 0.1);
    const optimizedFilter = optimizeFilter(initialFilter, objectiveFunction, 10E6, 0.01, 1000);
    
    const xpoints = [];
    const ypoints = [];
    const optimizedNetwork = optimizedFilter.network

    for (let i = 20E6; i < 1E9; i += 10E6) {
        xpoints.push(i);
        ypoints.push(optimizedNetwork.voltageGain(2 * Math.PI * i).abs());
    }

    const data =  {x: xpoints, y: ypoints, type: 'scatter', layout: {

        xaxis: {
      
          type: 'log',
      
          autorange: true
      
        },
      
        yaxis: {
      
          type: 'log',
      
          autorange: true
      
        }
      
      }};

    console.log(optimizedFilter.stages[0].toString())
    plot(data);