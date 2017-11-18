import { X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG, translate } from 'game/BlockFaces';
import { Color } from 'three';

export default class OtherPlayer {

  constructor(game, id, color, x, y, z, pitch, yaw) {
    this.game = game;
    this.id = id;
    this.color = new Color(color);
    this.x = x;
    this.y = y;
    this.z = z;
    this.pitch = pitch;
    this.yaw = yaw;

    this.faces = [];
    this.group = null;
  }

  setup() {
    this.setupFaces();
    this.groupFaces();
    this.game.renderer.scene.add(this.group);
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

    let c = new Color(this.color);
    let hsl = c.getHSL();
    c.setHSL(hsl.h, hsl.s, hsl.l > 0.5 ? hsl.l - 0.5 : hsl.l + 0.5);
    this.faces[Z_NEG] = r.createPlane({
      x: .5,
      y: 0,
      z: 0,

      rotation: {
        y: Math.PI
      },

      color: c
    });
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

    this.group.rotation.order = "YXZ";
    this.group.rotation.y = this.yaw
    this.group.rotation.x = this.pitch;
  }

  updateFaceColors() {
    let faceArray = [X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG];
    for (let face of faceArray) {
      let mesh = this.faces[face];
      if (face == Z_PLUS) {
        let c = new Color(this.color);
        let hsl = c.getHSL();
        c.setHSL(hsl.h, hsl.s, hsl.l > 0.5 ? hsl.l - 0.2 : hsl.l + 0.2);
        mesh.material.color = c;
      } else {
        mesh.material.color = this.color;
      }
    }
  }

  destroy() {
    this.game.renderer.scene.remove(this.group);
  }

  update(delta) {
    this.group.position.x = this.x;
    this.group.position.y = this.y;
    this.group.position.z = this.z;

    this.group.rotation.order = "YXZ";
    this.group.rotation.y = this.yaw
    this.group.rotation.x = this.pitch;
  }

  setColor(color) {
    this.color = new Color(color);
    this.updateFaceColors();
  }

}
