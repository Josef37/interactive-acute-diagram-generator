import { all, create } from "mathjs";
import _ from "lodash";
import {
  joinPoints,
  intersectPlanes,
  joinLines,
  pointInPlane,
  intersectPlaneLine,
} from "./geometry-utils";

export const math = create(all);

const { vertices, directions } = init(6);
const planes = getPlanes(vertices, directions);
const edges = getEdges(vertices, planes);
plotPolyhedron(vertices, directions, edges);

function init(n) {
  const vertices = Array(n)
    .fill()
    .map((_value, index) => [
      Math.cos((index * 2 * Math.PI) / n),
      Math.sin((index * 2 * Math.PI) / n),
      0,
    ]);
  const directions = vertices
    .slice(0, -1)
    .map((vertex) =>
      math
        .rotate(
          math.multiply(vertex.slice(0, 2), -0.2),
          Math.PI * math.random(-0.1, 0.1)
        )
        .concat([0])
    );
  return { vertices, directions };
}

function getPlanes(vertices, directions) {
  const basePlane = { normal: [0, 0, -1], point: [0, 0, 0] };
  const startingPoint = [
    math.mean(math.column(vertices, 0)),
    math.mean(math.column(vertices, 1)),
    1,
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
      heading: math.subtract(vertices[i + 1], vertices[i]),
    });
    planes.unshift(plane);
  }
  return planes;
}

function getEdges(vertices, planes) {
  const queue = vertices.slice();
  const visited = vertices.slice();
  const edges = [];

  while (queue.length > 0) {
    const vertex = queue.shift();
    const neighbors = getNeighbors(vertex, planes);
    for (const neighbor of neighbors) {
      edges.push([vertex, neighbor]);
      if (
        visited.some((visitedVertex) =>
          _.every(math.equal(visitedVertex, neighbor))
        )
      ) {
        continue;
      }
      queue.push(neighbor);
      visited.push(neighbor);
    }
  }

  return edges;
}

function getNeighbors(vertex, planes) {
  const [containingPlanes, otherPlanes] = _.partition(planes, (plane) =>
    pointInPlane(vertex, plane)
  );

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
        (point) => 0 < math.dot(ray.heading, math.subtract(point, vertex))
      );
    const closestIntersection = _.minBy(intersections, (point) =>
      math.distance(point, vertex)
    );
    closestIntersection && neighbors.push(closestIntersection);
  }

  return neighbors;
}

function plotPolyhedron(vertices, directions, edges) {
  const vertices2d = math.evaluate("vertices[:,1:2]", { vertices });
  const directions2d = math.evaluate("directions[:,1:2]", {
    directions: directions.filter((d) => d !== undefined),
  });

  var board = JXG.JSXGraph.initBoard("box", {
    boundingbox: [-1.5, 1.5, 1.5, -1.5],
    axis: false,
  });

  vertices2d.forEach((vertex) =>
    board.create("point", vertex, { withLabel: false })
  );
  directions2d.forEach((dir, i) => {
    const vertex = vertices2d[i];
    board.create("arrow", [vertex, math.add(vertex, dir)]);
  });
  edges.forEach(([p1, p2]) =>
    board.create("line", [p1.slice(0, 2), p2.slice(0, 2)], {
      straightFirst: false,
      straightLast: false,
    })
  );
}
