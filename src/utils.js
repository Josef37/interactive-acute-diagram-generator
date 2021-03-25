import { math } from ".";
import _ from "lodash";

export const isEqualAbsTol = (x) => (y) => {
  const epsilon = 1e-12;
  return _.every(math.smaller(math.abs(math.subtract(x, y)), epsilon));
};
