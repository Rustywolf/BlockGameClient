import { X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG, translate } from 'game/BlockFaces';
import { Color } from 'three';

export default class Block {

  constructor(game, map, x, y, z, color) {
    this.game = game;
    this.map = map;
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = new Color(color);
    this.selected = false;

    this.group = null;
    this.faces = new Array(6);
    this.opaque = true;
    this.collides = true;
  }

  setColor(color) {
    this.color = new Color(color);
    this.updateFaceColors();
  }

  setSelected(selected) {
    this.selected = selected;
    this.updateFaceColors();
  }

  updateFaceColors() {
    for (let face of this.faces) {
      if (face) {
        face.material.color = new Color(this.color);
        if (this.selected) {
          let hsl = face.material.color.getHSL();
          face.material.color.setHSL(hsl.h, hsl.s, hsl.l > 0.5 ? hsl.l - 0.2 : hsl.l + 0.2);
        }
      }
    }
  }

  getFace(face) {
    if (face < 0 || face >= this.faces.length) return null;
    return this.faces[face];
  }

  samePosition(block) {
    return (this.x === block.x && this.y === block.y && this.z === block.z);
  }

  update(delta) {

  }

  setupFaces() {
    let r = this.game.renderer;

    this.faces[X_PLUS] = r.createPlane({
      x: 1,
      y: 0,
      z: 0.5,

      rotation: {
        y: Math.PI/2
      },

      color: this.color
    });

    this.faces[X_NEG] = r.createPlane({
      x: 0,
      y: 0,
      z: 0.5,

      rotation: {
        y: -Math.PI/2
      },

      color: this.color
    });

    this.faces[Y_PLUS] = r.createPlane({
      x: 0.5,
      y: 0.5,
      z: 0.5,

      rotation: {
        x: - Math.PI / 2
      },

      color: this.color
    });

    this.faces[Y_NEG] = r.createPlane({
      x: 0.5,
      y: -0.5,
      z: 0.5,

      rotation: {
        x: Math.PI / 2
      },

      color: this.color
    });

    this.faces[Z_PLUS] = r.createPlane({
      x: 0.5,
      y: 0,
      z: 1,

      color: this.color
    });

    this.faces[Z_NEG] = r.createPlane({
      x: .5,
      y: 0,
      z: 0,

      rotation: {
        y: Math.PI
      },

      color: this.color
    });
  }

  optimize() {
    let faceArray = [X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG];
    for (let face of faceArray) {
      let mesh = this.getFace(face);
      let block = this.map.getBlock(this.x, this.y, this.z, face);
      let groupContains = this.group.children.indexOf(mesh) !== -1;
      if (block != null && block.opaque) {
        if (groupContains) {
          this.group.remove(mesh);
        }
      } else {
        let facePlane = this.getFace(face);
        facePlane.block = this;
        facePlane.blockFace = face;
        if (!groupContains) {
          this.group.add(mesh);
        }
      }
    }
  }

  collision(player, origin, delta) {
    let ret = {
      x: delta.x,
      y: delta.y,
      z: delta.z
    };

    if (!this.collides) return ret;

    let to = {
      x: (origin.x + delta.x + (delta.x < 0 ? -1 : 1) * player.hitbox.halfX),
      y: (origin.y + delta.y + (delta.y < 0 ? -1 : 1) * player.hitbox.halfY),
      z: (origin.z + delta.z + (delta.z < 0 ? -1 : 1) * player.hitbox.halfZ)
    };

    if ((to.x < this.x || to.x > this.x + 1) &&
        (to.y < this.y || to.y > this.y + 1) &&
        (to.z < this.z || to.z > this.z + 1)) {

      return ret;
    }

    let handleX = false;
    let handleY = false;
    let handleZ = false;

    let destinationX = (delta.x < 0) ? this.x + 1 : this.x;
    let destinationY = (delta.y < 0) ? this.y + 1 : this.y;
    let destinationZ = (delta.z < 0) ? this.z + 1 : this.z;

    let travelledX = destinationX - to.x;
    let travelledY = destinationY - to.y;
    let travelledZ = destinationZ - to.z;

    let magnitude = Math.sqrt(delta.x*delta.x + delta.y*delta.y + delta.z*delta.z);
    if (magnitude === 0) return ret;
    let vector = {
      x: delta.x / magnitude,
      y: delta.y / magnitude,
      z: delta.z / magnitude
    };

    let steps = [];

    if (delta.x != 0) {
      steps.push({
        name: "x",
        handle: () => handleX = true,
        steps: -1 * travelledX / vector.x //flip sign for positive steps required
      });
    }

    if (delta.y != 0) {
      steps.push({
        name: "y",
        handle: () => handleY = true,
        steps: -1 * travelledY / vector.y
      });
    }

    if (delta.z != 0) {
      steps.push({
        name: "z",
        handle: () => handleZ = true,
        steps: -1 * travelledZ / vector.z
      });
    }

    if (steps.length > 0) {
      steps.sort((a, b) => a.steps - b.steps)[0].handle();
    }

    let face = -1;

    if (handleX) {
      face = (delta.x < 0) ? X_PLUS : X_NEG;

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        ret.x = this.x - origin.x + (delta.x > 0 ? -1 : 1) * player.hitbox.halfX;
        if (delta.x < 0) {
          ret.x += 1;
        }
      }
    }

    if (handleY) {
      face = (delta.y < 0) ? Y_PLUS : Y_NEG;

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        ret.y = this.y - origin.y + (delta.y > 0 ? -1 : 1) * player.hitbox.halfY;
        if (delta.y < 0) {
          ret.y += 1;
        }
      }
    }

    if(handleZ) {
      face = (delta.z < 0) ? Z_PLUS : Z_NEG;

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        ret.z = this.z - origin.z + (delta.z > 0 ? -1 : 1) * player.hitbox.halfZ;
        if (delta.z < 0) {
          ret.z += 1;
        }
      }
    }

    return ret;
  }

  groupFaces() {
    this.group = this.group || this.game.renderer.createGroup();
    this.group.children.forEach(child => this.group.remove(child));

    for (let face = 0; face < this.faces.length; face++) {
      if (this.faces[face]) {
        this.group.add(this.faces[face]);
      }
    }

    this.group.position.x = this.x;
    this.group.position.y = this.y;
    this.group.position.z = this.z;
  }

}
