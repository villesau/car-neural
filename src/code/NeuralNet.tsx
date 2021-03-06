import {pretrainedLayerSizes, pretrainedWeights} from "./Constants";

function sigmoid(value: number) {
  return 1 / (1 + Math.pow(Math.E, -value))
}

export class NeuralNet {
  weights: number[][]
  layerValues: number[][]
  layerSizes: number[]

  constructor(layerSizes: number[]) {
    // console.log('NeuralNet constructor')

    this.weights = []
    this.layerValues = []
    this.layerSizes = layerSizes

    // this.layerSizes = pretrainedLayerSizes

    for (let i = 0; i < layerSizes.length; i++) {
      this.layerValues.push(new Array(layerSizes[i]))
    }

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const newWeightLayer = new Array((layerSizes[i] + 1) * (layerSizes[i + 1] + 0))

      for (let j = 0; j < newWeightLayer.length; j++) {
        newWeightLayer[j] = Math.random() * 2 - 1 // -1 - 1
        // newWeightLayer[j] = Math.random() * 20 - 10 // -10 - 10
      }

      this.weights.push(newWeightLayer)
    }

    // this.weights = pretrainedWeights
    //
    // console.log('weihts', this.weights)
    // console.log('layerValues', this.layerValues)
  }

  cloneMutated(oldNet: NeuralNet) {
    const newNeuralNet = new NeuralNet(this.layerSizes)

    for (let weightLayerIndex = 0; weightLayerIndex < this.weights.length; weightLayerIndex++) {
      const thisWeightLayer = this.weights[weightLayerIndex]
      const oldWeightLayer = oldNet.weights[weightLayerIndex]
      const newWeightLayer = newNeuralNet.weights[weightLayerIndex]

      for (let weightCellIndex = 0; weightCellIndex < thisWeightLayer.length; weightCellIndex++) {
        let newWeight = thisWeightLayer[weightCellIndex]
        const oldWeight = oldWeightLayer[weightCellIndex]
        const diff = newWeight - oldWeight;
        if (Math.random() < 0.25) {
          newWeight += ((Math.random() - 0.5) * 0.1) + (diff * 10)
        }
        newWeightLayer[weightCellIndex] = newWeight
      }
    }

    return newNeuralNet
  }

  setFirstLayer(values: number[]) {
    if (values.length !== this.layerValues[0].length) {
      throw new Error('Invalid input size')
    }
    for (let i = 0; i < values.length; i++) {
      this.layerValues[0][i] = values[i]
    }
  }

  forwardPropagate() {
    for (let toLayerIndex = 1; toLayerIndex < this.layerSizes.length; toLayerIndex++) {
      const fromLayerIndex = toLayerIndex - 1
      const weightArray = this.weights[fromLayerIndex]

      // console.log('step')
      // console.log(fromLayerIndex, toLayerIndex)

      const fromSize = this.layerSizes[fromLayerIndex]
      const toSize = this.layerSizes[toLayerIndex]

      // console.log(fromSize, toSize)

      for (let toCellIndex = 0; toCellIndex < toSize; toCellIndex++) {
        this.layerValues[toLayerIndex][toCellIndex] = 0;

        // console.log('1', this.layerValues[toLayerIndex])

        for (let fromCellIndex = 0; fromCellIndex < fromSize; fromCellIndex++) {
          const fromInputValue = this.layerValues[fromLayerIndex][fromCellIndex]

          const weight = weightArray[(fromSize + 1) * toCellIndex + fromCellIndex]
          this.layerValues[toLayerIndex][toCellIndex] += weight * fromInputValue
        }

        // console.log('2', this.layerValues[toLayerIndex])

        // Bias
        const weight = weightArray[(fromSize + 1) * toCellIndex + fromSize - 1]
        // console.log('weight', weight)
        if (weight === undefined) {
          debugger
        }
        this.layerValues[toLayerIndex][toCellIndex] += weight * 1

        // console.log('3', this.layerValues[toLayerIndex])

        this.layerValues[toLayerIndex][toCellIndex] = sigmoid(this.layerValues[toLayerIndex][toCellIndex]);
      }

      // console.log('4', this.layerValues[toLayerIndex])
    }
    // throw Error('JOU')
  }

  getLastLayer() {
    const lastLayerValues = this.layerValues[this.layerValues.length - 1]
    // console.log('returning values', lastLayerValues)
    return lastLayerValues
  }
}
