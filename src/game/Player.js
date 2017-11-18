import { VK_SHIFT, VK_SPACE, VK_W, VK_A, VK_S, VK_D } from 'input/Keys';
import { MOVE, LEFT_BUTTON, MIDDLE_BUTTON, RIGHT_BUTTON } from 'input/MouseActions';
import { translate } from 'game/BlockFaces';
import { Raycaster, Color } from 'three';

export default class Player {

  constructor(game, map) {
    this.game = game;
    this.map = map;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.speed = 5;
    this.pitch = 0;
    this.yaw = 0;
    this.rotSpeed = Math.PI / 800;

    this.yVelocity = 0;
    this.gravity = 9.8;
    this.terminal = -this.gravity * 4;
    this.hasJump = true;
    this.jumpVelocity = this.gravity / 2;

    this.spectator = true;

    this.placeBlock = false;
    this.breakBlock = false;
    this.cloneBlock = false;
    this.colorBlock = new Color(0xffffff);

    this.debug = {
      x: document.getElementById('xCoord'),
      y: document.getElementById('yCoord'),
      z: document.getElementById('zCoord'),
      pitch: document.getElementById('pitch'),
      yaw: document.getElementById('yaw'),
    };

    this.hitbox = {
      x: .5,
      y: .5,
      z: .5,
      halfX: .25,
      halfY: .25,
      halfZ: .25,
    };

    this.raycaster = new Raycaster(undefined, undefined, 0, 6);
    this.arrow = null;
    this.lookingAt = null;
    this.lookingAtFace = null;

    this.init();
  }

  init() {
    this.game.mouse.addHandler(MOVE, e => {
      if (this.game.hasFocus()) {
        this.yaw -= e.movementX * this.rotSpeed;
        this.pitch -= e.movementY * this.rotSpeed;
        if (this.pitch < -Math.PI/2) {
          this.pitch = -Math.PI/2;
        } else if (this.pitch > Math.PI/2) {
          this.pitch = Math.PI/2;
        }
      }
    });

    this.game.mouse.addHandler(LEFT_BUTTON, (action, e) => {
      if (action == "up" && this.game.hasFocus()) {
        this.breakBlock = true;
      }
    });

    this.game.mouse.addHandler(RIGHT_BUTTON, (action, e) => {
      if (action == "up" && this.game.hasFocus()) {
        this.placeBlock = true;
      }
    });

    this.game.mouse.addHandler(MIDDLE_BUTTON, (action, e) => {
      if (action == "up" && this.game.hasFocus()) {
        this.cloneBlock = true;
      }
    });

    this.game.keyboard.addHandler(189, type => {
      if (type !== "down" || !this.game.hasFocus()) return;
      this.spectator = !this.spectator;
      this.yVelocity = 0;
    });
  }

  setColor(color) {
    this.game.currentColor.style.backgroundColor = (typeof color === "object") ? color.getStyle() : color;
    this.colorBlock = new Color(color);
  }

  update(delta) {
    let keyboard = this.game.keyboard;
    let dx = 0;
    let dy = 0;
    let dz = 0;
    if (keyboard.keyHeld(VK_W)) {
      dx -= Math.sin(this.yaw) * this.speed * delta;
      dz -= Math.cos(this.yaw) * this.speed * delta;
    } else if (keyboard.keyHeld(VK_S)) {
      dx += Math.sin(this.yaw) * this.speed * delta;
      dz += Math.cos(this.yaw) * this.speed * delta;
    }

    if (keyboard.keyHeld(VK_A)) {
      dx -= Math.cos(this.yaw) * this.speed * delta;
      dz += Math.sin(this.yaw) * this.speed * delta;
    } else if (keyboard.keyHeld(VK_D)) {
      dx += Math.cos(this.yaw) * this.speed * delta;
      dz -= Math.sin(this.yaw) * this.speed * delta;
    }

    if (this.spectator) {
      if (keyboard.keyHeld(VK_SPACE)) {
        dy += this.speed * delta;
      } else if (keyboard.keyHeld(VK_SHIFT)) {
        dy -= this.speed * delta;
      }
    } else {
      this.yVelocity -= this.gravity * delta;

      if (keyboard.keyHeld(VK_SPACE) && this.hasJump) {
        this.yVelocity = this.jumpVelocity;
        this.hasJump = false;
      }

      if (this.yVelocity < this.terminal) {
        this.yVelocity = this.terminal;
      }

      dy += this.yVelocity * delta;
    }

    let origin = {x: this.x, y: this.y, z: this.z};
    let deltaMovement = {x: dx, y: dy, z: dz};

    /*if (!this.spectator)*/ this.game.map.collision(this, origin, deltaMovement);
    this.x += deltaMovement.x;
    this.y += deltaMovement.y;
    this.z += deltaMovement.z;

    this.game.send({
      action: "move",
      x: this.x,
      y: this.y,
      z: this.z,
      pitch: this.pitch,
      yaw: this.yaw
    })

    if (deltaMovement.y != dy) {
      this.yVelocity = 0;
      if (deltaMovement.y > dy) {
        this.hasJump = true;
      }
    } else {
      this.hasJump = false;
    }

    if (this.y < -100) {
      this.y = (this.y < 0) ? 100 : -100;
      this.x = this.map.width / 2;
      this.z = this.map.depth / 2;
    } else if (Math.abs(this.x) > 100) {
      this.x = this.x < 0 ? 100 : -100;
    } else if (this.y > 100) {
      this.y = -100;
    } else if (Math.abs(this.z) > 100) {
      this.z = this.z < 0 ? 100 : -100;
    }

    this.game.renderer.updateCameraPosition(this);

    let camera = this.game.renderer.camera;
    this.raycaster.set(camera.getWorldPosition(), camera.getWorldDirection());

    let rayCollisions = this.raycaster.intersectObjects(this.map.group.children, true);
    if (rayCollisions[0]) {
      let rayBlock = rayCollisions[0].object.block;
      let rayFace = rayCollisions[0].object.blockFace;
      if (this.lookingAt) {
        if(!this.lookingAt.samePosition(rayBlock)) {
          this.lookingAt.setSelected(false);
          rayBlock.setSelected(true);
          this.lookingAt = rayBlock;
          this.lookingAtFace = rayFace;
        } else {
          this.lookingAtFace = rayFace;
        }
      } else {
        rayBlock.setSelected(true);
        this.lookingAt = rayBlock;
        this.lookingAtFace = rayFace;
      }
    } else {
      if (this.lookingAt) {
        this.lookingAt.setSelected(false);
      }

      this.lookingAt = null;
      this.lookingAtFace = null;
    }

    if (this.cloneBlock) {
      if (this.lookingAt) {
        this.setColor(this.lookingAt.color);
        this.game.send({
          action: "color",
          color: this.lookingAt.color.getHex()
        });
      }

      this.cloneBlock = false;
    } else if (this.breakBlock) {
      if (this.lookingAt) {
        this.game.send({
          action: "break",
          x: this.lookingAt.x,
          y: this.lookingAt.y,
          z: this.lookingAt.z
        });
        //this.map.setBlock(this.lookingAt.x, this.lookingAt.y, this.lookingAt.z, null);
      }

      this.breakBlock = false;
    } else if (this.placeBlock) {
      if (this.lookingAt) {
        if (this.lookingAt) {
          let translated = translate(this.lookingAt.x, this.lookingAt.y, this.lookingAt.z, this.lookingAtFace);
          this.game.send({
            action: "place",
            x: translated.x,
            y: translated.y,
            z: translated.z
          });
          //this.map.setBlock(this.lookingAt.x, this.lookingAt.y, this.lookingAt.z, this.lookingAtFace, this.colorBlock);
        }
      }

      this.placeBlock = false;
    }

    this.debug.x.textContent = this.x;
    this.debug.y.textContent = this.y;
    this.debug.z.textContent = this.z;
    this.debug.yaw.textContent = (this.yaw < 0) ? 360 - (Math.abs((this.yaw * 180) / Math.PI) % 360) : ((this.yaw * 180) / Math.PI) % 360;
    this.debug.pitch.textContent = (this.pitch < 0) ? 360 - (Math.abs((this.pitch * 180) / Math.PI) % 360) : ((this.pitch * 180) / Math.PI) % 360;
  }

}
