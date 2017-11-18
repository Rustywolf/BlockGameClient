import { X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG, translate } from 'game/BlockFaces';
import { Color } from 'three';

export default class Block {

  constructor(game, map, x, y, z, color) {
    this.game = game;
    this.map = map;
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color;
    this.selected = false;

    this.group = null;
    this.faces = new Array(6);
    this.opaque = true;
    this.collides = true;
  }

  setColor(color) {
    this.color = color;
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
    if (!this.collides) return;

    let to = {
      x: origin.x + delta.x,
      y: origin.y + delta.y,
      z: origin.z + delta.z
    };

    let positiveDeltaX = delta.x >= 0;
    let positiveDeltaY = delta.y >= 0;
    let positiveDeltaZ = delta.z >= 0;

    let prevCollideX = origin.x + (delta.x > 0 ? -1 : 1) * player.hitbox.halfX;
    let prevCollideY = origin.y + (delta.y > 0 ? -1 : 1) * player.hitbox.halfY;
    let prevCollideZ = origin.z + (delta.z > 0 ? -1 : 1) * player.hitbox.halfZ;

    let overlapX = !(prevCollideX < this.x || prevCollideX > this.x + 1);
    let overlapY = !(prevCollideY < this.y || prevCollideY > this.y + 1);
    let overlapZ = !(prevCollideZ < this.z || prevCollideZ > this.z + 1);

    let handleX = false;
    let handleY = false;
    let handleZ = false;

    let face = -1;
    if (overlapX && overlapY && !overlapZ && delta.z != 0) { // Collides in Z direction
      handleZ = true;
    } else if (overlapX && !overlapY && overlapZ && delta.y != 0) { // Collides in Y direction
      handleY = true;
      } else if (!overlapX && overlapY && overlapZ && delta.x != 0) { // Collides in X direction
      handleX = true;
    } else { // Collides diagonally
      let depthX = Math.abs(positiveDeltaX ? this.x - to.x - player.hitbox.halfX : this.x + 1 - to.x + player.hitbox.halfX); //Math.abs(this.x + 0.5 - to.x + (delta.x > 0 ? -1 : 1) * player.hitbox.halfX);
      let depthY = Math.abs(positiveDeltaY ? this.y - to.y - player.hitbox.halfY : this.y + 1 - to.y + player.hitbox.halfY);
      let depthZ = Math.abs(positiveDeltaZ ? this.z - to.z - player.hitbox.halfZ : this.z + 1 - to.z + player.hitbox.halfZ);

      let valueArray = [{
        name: "x",
        face: positiveDeltaX ? X_NEG : X_PLUS,
        depth: depthX,
        handle: () => { handleX = true; }
      }, {
        name: "y",
        face: positiveDeltaY ? Y_NEG : Y_PLUS,
        depth: depthY,
        handle: () => { handleY = true; }
      }, {
        name: "z",
        face: positiveDeltaZ ? Z_NEG : Z_PLUS,
        depth: depthZ,
        handle: () => { handleZ = true; }
      }];

      let sortedArray = [];

      if (!overlapX && !overlapY && overlapZ) { // Colliding in X & Y
        sortedArray = [valueArray[0], valueArray[1]];
      } else if (!overlapX && overlapY && !overlapZ) { // Colliding in X & Z
        sortedArray = [valueArray[0], valueArray[2]];
      } else if (overlapX && !overlapY && !overlapZ) { // Colliding in Y & Z
        sortedArray = [valueArray[1], valueArray[2]];
      } else {
        sortedArray = valueArray;
      }
      //console.log(sortedArray);
      sortedArray.sort((a, b) => a.depth - b.depth);
      let solid = [];
      let handled = false;

      for (let entry of sortedArray) {
        let neighbour = this.map.getBlock(this.x, this.y, this.z, entry.face);

        if (!neighbour || !neighbour.collides) {
          entry.handle();
          handled = true;
          break;
        } else {
          solid.push(entry.handle);
        }
      }

      if (!handled) {
        for (let handler of solid) {
          handler();
        }
      }
    }

    //console.log(handleX + ":" + handleY + ":" + handleZ);

    if (handleX && delta.x != 0) {
      if (positiveDeltaX) {
        face = X_NEG;
      } else {
        face = X_PLUS;
      }

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        delta.x = this.x - origin.x + (delta.x > 0 ? -1 : 1) * player.hitbox.halfX;
        if (!positiveDeltaX) {
          delta.x += 1;
        }
      }
    }

    if (handleY && delta.y != 0) {
      if (positiveDeltaY) {
        face = Y_NEG;
      } else {
        face = Y_PLUS;
      }

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        delta.y = this.y - origin.y + (delta.y > 0 ? -1 : 1) * player.hitbox.halfY;
        if (!positiveDeltaY) {
          delta.y += 1;
        }
      }
    }

    if(handleZ && delta.z != 0) {
      if (positiveDeltaZ) {
        face = Z_NEG;
      } else {
        face = Z_PLUS;
      }

      let neighbour = this.map.getBlock(this.x, this.y, this.z, face);
      if (!neighbour || !neighbour.collides) {
        delta.z = this.z - origin.z + (delta.z > 0 ? -1 : 1) * player.hitbox.halfZ;
        if (!positiveDeltaZ) {
          delta.z += 1;
        }
      }
    }
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
