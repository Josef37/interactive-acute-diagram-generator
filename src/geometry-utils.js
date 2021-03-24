import { math } from "./index";

export function intersectPlanes(plane1, plane2) {
  const parser = math.parser();
  parser.set("P1", plane1.point);
  parser.set("N1", plane1.normal);
  parser.set("P2", plane2.point);
  parser.set("N2", plane2.normal);

  parser.evaluate("H = cross(N1, N2)");
  parser.evaluate("H = H / norm(H)");
  parser.evaluate(
    "P = dot(P2-P1, N2) / dot(cross(N1, H), N2) * cross(N1, H) + P1"
  );

  return {
    point: parser.get("P"),
    heading: parser.get("H")
  };
}

export function intersectPlaneLine(plane, line) {
  const parser = math.parser();
  parser.set("Pp", plane.point);
  parser.set("N", plane.normal);
  parser.set("Pl", line.point);
  parser.set("H", line.heading);

  parser.evaluate("lambda = dot(Pp-Pl,N) / dot(H,N)");
  parser.evaluate("P = Pl + lambda * H");

  return parser.get("P");
}

export function joinLines(line1, line2) {
  const parser = math.parser();
  parser.set("P1", line1.point);
  parser.set("H1", line1.heading);
  parser.set("P2", line2.point);
  parser.set("H2", line2.heading);

  parser.evaluate("N = cross(H1, H2)");
  parser.evaluate("N = N / norm(N)");

  return {
    point: parser.get("P1"),
    normal: parser.get("N")
  };
}

export function joinPoints(point1, point2, point3) {
  const line1 = {
    point: point1,
    heading: math.subtract(point2, point1)
  };
  const line2 = {
    point: point1,
    heading: math.subtract(point3, point1)
  };

  return joinLines(line1, line2);
}

export function slack(point, plane) {
  return math.dot(math.subtract(plane.point, point), plane.normal);
}

export function pointInPlane(point, plane) {
  return math.equal(0, slack(point, plane));
}

export function pointInHalfspace(point, plane) {
  return math.largerEq(slack(point, plane), 0);
}
