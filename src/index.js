import { all, create } from "mathjs";
import { getPlanes, getEdges } from "./polyhedron-calc";

export const math = create(all);

const board = JXG.JSXGraph.initBoard("box", {
  boundingbox: [-1.5, 1.5, 1.5, -1.5],
  axis: false,
});

const numberOfPoints = 6;
const {
  initialVertexCoordinates,
  initialDirectionCoordinates,
} = getInitialCoordinates(numberOfPoints);

let { vertices, directionVertices, edgeObjects } = setupBoardElements();

vertices
  .concat(directionVertices)
  .forEach((vertex) => vertex.on("drag", () => updateEdges()));

updateEdges();

function getInitialCoordinates(n) {
  const initialVertexCoordinates = Array(n)
    .fill()
    .map((_value, index) => [
      Math.cos((index * 2 * Math.PI) / n),
      Math.sin((index * 2 * Math.PI) / n),
      0,
    ]);
  const initialDirectionCoordinates = initialVertexCoordinates
    .slice(0, -1)
    .map((vertex) => math.multiply(vertex, -0.2));
  return { initialVertexCoordinates, initialDirectionCoordinates };
}

function setupBoardElements() {
  const vertices = initialVertexCoordinates.map((vertex) =>
    board.create("point", vertex.slice(0, 2), { withLabel: false })
  );
  const directionVertices = initialDirectionCoordinates.map((_d, i) =>
    board.create(
      "point",
      math
        .add(initialVertexCoordinates[i], initialDirectionCoordinates[i])
        .slice(0, 2),
      { withLabel: false }
    )
  );
  const arrows = directionVertices.map((_v, i) => {
    board.create("arrow", [vertices[i], directionVertices[i]]);
  });
  let edgeObjects = [];
  return { vertices, directionVertices, edgeObjects };
}

function updateEdges() {
  const { vertexCoordinates3d, directionCoordinates3d } = getCoordinates();

  const planes = getPlanes(vertexCoordinates3d, directionCoordinates3d);
  const edges = getEdges(vertexCoordinates3d, planes);

  updateEdgeObjects(edges);
}

function getCoordinates() {
  const vertexCoordinates3d = vertices.map((v) => [v.X(), v.Y(), 0]);
  const directionCoordinates3d = directionVertices.map((d, i) =>
    math.subtract([d.X(), d.Y(), 0], vertexCoordinates3d[i])
  );
  return { vertexCoordinates3d, directionCoordinates3d };
}

function updateEdgeObjects(edges) {
  // We have to remove the points created with the edge, too.
  board.removeObject(
    edgeObjects.flatMap((edge) => [edge.point1, edge.point2, edge])
  );

  edgeObjects = edges.map(([p1, p2]) =>
    board.create("line", [p1.slice(0, 2), p2.slice(0, 2)], {
      straightFirst: false,
      straightLast: false,
      fixed: true,
    })
  );
}
