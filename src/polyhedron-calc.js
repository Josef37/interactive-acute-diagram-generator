import _ from "lodash";
import {
  joinPoints,
  intersectPlanes,
  joinLines,
  pointInPlane,
  intersectPlaneLine,
} from "./geometry-utils";
import { math } from "./index";
import { isEqualAbsTol } from "./utils";

export function getPlanes(vertices, directions) {
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
    const baseLine = {
      point: vertices[i],
      heading: math.subtract(vertices[i + 1], vertices[i]),
    };
    const plane = joinLines(lineIntersection, baseLine);
    planes.unshift(plane);
  }
  return planes;
}

export function getEdges(vertices, planes) {
  const queue = vertices.slice();
  const visited = vertices.slice();
  const edges = [];

  while (queue.length > 0) {
    const vertex = queue.shift();
    const neighbors = getNeighbors(vertex, planes);
    for (const neighbor of neighbors) {
      edges.push([vertex, neighbor]);
      if (visited.some(isEqualAbsTol(neighbor))) {
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
