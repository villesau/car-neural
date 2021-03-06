import {Camera, Vector} from "./Vector";
import {NeuralNet} from "./NeuralNet";
import {Line} from "./Line";
import {carSeeLinesPerSide, carStartPos} from "./Constants";
import {drawLine} from "./Misc";

export class Car {
  position: Vector
  angle: number
  speed: number
  neuralNet: NeuralNet
  oldNet: NeuralNet
  alive: boolean
  diedOnFrame: undefined | number
  firstIteration: number
  closestBorderIndex: number

  topLeft: Vector
  topRight: Vector
  bottomLeft: Vector
  bottomRight: Vector

  constructor(neuralNet: NeuralNet, currentIteration: number, oldNet?: NeuralNet) {
    this.position = new Vector(carStartPos.x, carStartPos.y)
    this.angle = 0
    this.speed = 0
    this.neuralNet = neuralNet
    this.oldNet = oldNet || neuralNet
    this.alive = true
    this.diedOnFrame = undefined
    this.firstIteration = currentIteration
    this.closestBorderIndex = 0

    this.topLeft = new Vector(0, 0)
    this.topRight = new Vector(0, 0)
    this.bottomLeft = new Vector(0, 0)
    this.bottomRight = new Vector(0, 0)
    this.updateCornerPositions()
  }

  updateCornerPositions() {
    const [topLeft, topRight, bottomLeft, bottomRight] = this.corners()
    this.topLeft = topLeft
    this.topRight = topRight
    this.bottomLeft = bottomLeft
    this.bottomRight = bottomRight
  }

  doStep() {
    const directionVector = new Vector(0, -1)
      .rotate(this.angle)
      .multiply(this.speed)

    this.position = this.position.add(directionVector)

    this.updateCornerPositions()
  }

  mutateNew(currentIteration: number, newStartAngle: number) {
    const newNeuralNet = this.neuralNet.cloneMutated(this.oldNet)
    const newCar = new Car(newNeuralNet, currentIteration, this.neuralNet)
    newCar.angle = newStartAngle
    return newCar
  }

  getDistance() {
    return this.position.add(new Vector(0, 10000).multiply(-1)).abs()
  }

  corners() {
    const topLeft = new Vector(-5, -10).rotate(this.angle).add(this.position)
    const topRight = new Vector(5, -10).rotate(this.angle).add(this.position)
    const bottomLeft = new Vector(-5, 10).rotate(this.angle).add(this.position)
    const bottomRight = new Vector(5, 10).rotate(this.angle).add(this.position)

    return [topLeft, topRight, bottomLeft, bottomRight]
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, currentIteration: number) {
    // const [topLeft, topRight, bottomLeft, bottomRight] = this.corners()

    // const correctedCamera = camera.multiply(-1).add(new Vector(500, 500))

    // const color = this.alive ? 'black' : 'red'
    const colorValue = Math.round((1 - Math.min(currentIteration - this.firstIteration, 10) / 10) * 255)
    const fillColor = `rgb(${colorValue}, ${colorValue}, ${colorValue})`
    const borderColor = this.alive ? 'black' : 'red'

    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1
    ctx.fillStyle = fillColor
    ctx.beginPath()
    ctx.lineTo(camera.cameraCorrect(this.topLeft).x, camera.cameraCorrect(this.topLeft).y)
    ctx.lineTo(camera.cameraCorrect(this.topRight).x, camera.cameraCorrect(this.topRight).y)
    ctx.lineTo(camera.cameraCorrect(this.bottomRight).x, camera.cameraCorrect(this.bottomRight).y)
    ctx.lineTo(camera.cameraCorrect(this.bottomLeft).x, camera.cameraCorrect(this.bottomLeft).y)
    ctx.closePath()
    ctx.fill();
    ctx.stroke();
  }

  checkCollision(line: Line) {
    return [
      new Line(this.topLeft, this.topRight),
      new Line(this.topRight, this.bottomRight),
      new Line(this.bottomRight, this.bottomLeft),
      new Line(this.bottomLeft, this.topLeft),
    ].some((otherLine) => {
      return line.intersects(otherLine)
    })
  }

  see(ctx: CanvasRenderingContext2D, camera: Camera, borders: Line[], maxDistance: number, draw: boolean = true): number[] {
    let distances: number[] = new Array(carSeeLinesPerSide * 2)

    // Find closest borders
    const distancesToBorders = borders.map(border => this.position.add(border.p1.multiply(-1)).abs())
    const minIndex = distancesToBorders.indexOf(Math.min(...distancesToBorders))
    this.closestBorderIndex = minIndex

    for (let angleIndex = 0; angleIndex < carSeeLinesPerSide * 2; angleIndex += 1) {
      distances[angleIndex] = maxDistance

      const angle = this.angle + Math.PI * (angleIndex + 0.5 - carSeeLinesPerSide) / carSeeLinesPerSide / 2.0

      const lineStartPoint = this.position
      const lineEndPoint = this.position.add(new Vector(0, -1).rotate(angle).multiply(maxDistance))
      const viewLine = new Line(lineStartPoint, lineEndPoint)

      if (draw) {
        drawLine(
          ctx,
          camera.cameraCorrect(lineStartPoint),
          camera.cameraCorrect(lineEndPoint),
          'lightgrey'
        )
      }

      for (
        let i = Math.max(0, this.closestBorderIndex - 5);
        i < Math.min(borders.length, this.closestBorderIndex + 25);
        i++
      ) {

        const intersects = borders[i].intersects(viewLine)
        if (intersects) {
          const intersectionPoint = borders[i].intersectionPoint(viewLine)
          if (intersectionPoint === undefined) {
            continue
          }

          const distance = intersectionPoint.add(this.position.multiply(-1)).abs()
          if (distances[angleIndex]! > distance) {
            distances[angleIndex] = distance
          }

          const drawPoint = camera.cameraCorrect(intersectionPoint)

          if (draw) {
            ctx.beginPath()
            ctx.strokeStyle = 'red'
            ctx.arc(drawPoint.x, drawPoint.y, 5, 0, 2 * Math.PI)
            ctx.stroke()
          }
        }
      }
    }

    return distances
  }
}
