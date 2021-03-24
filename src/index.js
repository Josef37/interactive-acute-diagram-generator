import { all, create } from "mathjs";
import _ from "lodash";
import {
  joinPoints,
  intersectPlanes,
  joinLines,
  pointInPlane,
  intersectPlaneLine
} from "./geometry-utils";

export const math = create(all);

const { vertices, directions } = init(6);
const planes = getPlanes(vertices, directions);
const intersectionVertices = getIntersections(vertices, planes);
plotPolyhedron(vertices, directions, intersectionVertices);

function init(n) {
  const vertices = Array(n)
    .fill()
    .map((_value, index) => [
      Math.cos((index * 2 * Math.PI) / n) - 0.1,
      Math.sin((index * 2 * Math.PI) / n) + 0.1,
      0
    ]);
  const directions = vertices
    .slice(0, -1)
    .map((vertex) => math.dotMultiply(vertex, [-0.2, -0.6, 1]));
  return { vertices, directions };
}

function getPlanes(vertices, directions) {
  const basePlane = { normal: [0, 0, -1], point: [0, 0, 0] };
  const startingPoint = [
    math.mean(math.column(vertices, 0)),
    math.mean(math.column(vertices, 1)),
    1
  ];
  const startingPlane = joinPoints(
    startingPoint,
    vertices[vertices.length - 1],
    vertices[0]
  );
  const planes = [startingPlane, basePlane];

  for (let i = 0; i < vertices.length - 1; i++) {
    const normalPlane = joinPoints(
      vertices[i],
      math.add(vertices[i], directions[i]),
      math.add(vertices[i], [0, 0, 1])
    );
    const lineIntersection = intersectPlanes(normalPlane, planes[0]);
    const plane = joinLines(lineIntersection, {
      point: vertices[i],
      heading: math.subtract(vertices[i + 1], vertices[i])
    });
    planes.unshift(plane);
  }
  return planes;
}

function getIntersections(vertices, planes) {
  console.log("Here");
  const queue = vertices;
  const visited = vertices;

  while (queue.length > 0) {
    const vertex = queue.shift();
    const neighbors = getNeighbors(vertex, planes);
    for (const neighbor of neighbors) {
      if (visited.some((v) => math.equal(v, neighbor))) {
        continue;
      }
      queue.push(neighbor);
      visited.push(neighbor);
    }
  }

  return visited;
}

function getNeighbors(vertex, planes) {
  const containingPlanes = planes.filter((plane) =>
    pointInPlane(vertex, plane)
  );
  const otherPlanes = _.without(planes, containingPlanes);

  const rays = [];
  for (let i = 0; i < containingPlanes.length; i++) {
    for (let j = i + 1; j < containingPlanes.length; j++) {
      const line = intersectPlanes(containingPlanes[i], containingPlanes[j]);
      const otherPlanes = containingPlanes.filter(
        (_p, index) => ![i, j].includes(index)
      );
      const dotProducts = otherPlanes.map((plane) =>
        math.dot(plane.normal, line.heading)
      );
      if (dotProducts.every((d) => d < 0)) {
        rays.push(line);
      } else if (dotProducts.every((d) => d > 0)) {
        rays.push({ ...line, heading: math.multiply(-1, line.heading) });
      }
    }
  }

  const neighbors = [];
  for (const ray of rays) {
    const intersections = otherPlanes
      .map((plane) => intersectPlaneLine(plane, ray))
      .filter(
        (point) => 0 < math.dot(ray.heading, math.subtract(point, ray.point))
      );
    const closestIntersection = _.minBy(intersections, (point) =>
      math.distance(point, ray.point)
    );
    neighbors.push(closestIntersection);
  }
  return neighbors;
}

function plotPolyhedron(vertices, directions, intersectionVertices) {
  const vertices2d = math.evaluate("vertices[0:end,0:2]", { vertices });
  const directions2d = math.evaluate("directions[0:end,0:2]", {
    directions: directions.filter((d) => d !== undefined)
  });

  var board = JXG.JSXGraph.initBoard("box", {
    boundingbox: [-1.5, 1.5, 1.5, -1.5],
    axis: false
  });

  vertices2d.forEach((vertex) =>
    board.create("point", vertex, { withLabel: false })
  );
  directions2d.forEach((dir, i) => {
    const vertex = vertices2d[i];
    board.create("arrow", [vertex, math.add(vertex, dir)]);
  });
  vertices2d.forEach((_vertex, i) =>
    board.create(
      "line",
      [vertices2d[i], vertices2d[(i + 1) % vertices2d.length]],
      {
        straightFirst: false,
        straightLast: false
      }
    )
  );
  intersectionVertices.forEach((vertex) =>
    board.create("point", vertex, { face: "x", withLabel: false })
  );
}
