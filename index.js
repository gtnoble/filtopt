import math from 'mathjs';

const cauerLadder = (...lSections) => {
    let combinedAbcd = math.identity(2)
    for (const lSection of lSections) {
        combinedAbcd = math.multiply(combinedAbcd, lSection(angularFrequency))

    }
}
