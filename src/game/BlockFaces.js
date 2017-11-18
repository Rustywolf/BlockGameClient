module.exports = {
  X_PLUS: 1,
  X_NEG: 2,
  Y_PLUS: 3,
  Y_NEG: 4,
  Z_PLUS: 5,
  Z_NEG: 6,
};

module.exports.translate = (x, y, z, type) => {
  switch (type) {
    case module.exports.X_PLUS:
      return {x: x + 1, y: y, z: z};

    case module.exports.X_NEG:
      return {x: x - 1, y: y, z: z};

    case module.exports.Y_PLUS:
      return {x: x, y: y + 1, z: z};

    case module.exports.Y_NEG:
      return {x: x, y: y - 1, z: z};

    case module.exports.Z_PLUS:
      return {x: x, y: y, z: z + 1};

    case module.exports.Z_NEG:
      return {x: x, y: y, z: z - 1};
  }

  return {x: x, y: y, z: z};
};
