import { all, create } from "mathjs";
import { getPlanes, getEdges } from "./polyhedron-calc";

export const math = create(all);

const board = JXG.JSXGraph.initBoard("box", {
  boundingbox: [-1.5, 1.5, 1.5, -1.5],
  axis: false,
});

// Setup coordinates
const n = 6;
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

// Setup board elements
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

const buildEdges = () => {
  const vertexCoordinates3d = vertices.map((vertex) => [
    vertex.X(),
    vertex.Y(),
    0,
  ]);
  const directionCoordinates3d = directionVertices.map((dir, i) =>
    math.subtract([dir.X(), dir.Y(), 0], vertexCoordinates3d[i])
  );

  const planes = getPlanes(vertexCoordinates3d, directionCoordinates3d);
  const edges = getEdges(vertexCoordinates3d, planes);

  console.log(edgeObjects);
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
};

vertices
  .concat(directionVertices)
  .forEach((vertex) => vertex.on("drag", () => buildEdges()));
buildEdges();
