import { X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG, translate } from 'game/BlockFaces';
import Block from 'game/Block';

export default class Map {

  constructor(game) {
    this.game = game;
    this.width = 1;
    this.depth = 1;
    this.height = 0;

    this.blocks = [[[]]];
  }

  setSize(width, depth, height) {
    this.width = width;
    this.depth = depth;
    this.height = height;
    
    this.blocks = new Array(width);
    for (let x = 0; x < width; x++) {
      this.blocks[x] = new Array(depth);
      for (let z = 0; z < depth; z++) {
        this.blocks[x][z] = new Array(height);
      }
    }
  }

  generate() {
    this.group = this.game.renderer.createGroup();

    let floors = [0x280e02, 0x3a1301, 0x421602, 0x511a01, 0x329333];

    for (let x = 0; x < this.blocks.length; x++) {
      for (let z = 0; z < this.blocks[x].length; z++) {
        let height = (this.blocks[x][z].length < 5) ? this.blocks[x][z].length : 5;
        for (let y = height - 1; y >= 0; y--) {
          this.blocks[x][z][y] = new Block(this.game, this, x, y, z, floors[y]);
        }
      }
    }

    for (let x = 0; x < this.blocks.length; x++) {
      for (let z = 0; z < this.blocks[x].length; z++) {
        let height = (this.blocks[x][z].length < 5) ? this.blocks[x][z].length : 5;
        for (let y = height - 1; y >= 0; y--) {
          let block = this.blocks[x][z][y];
          block.setupFaces();
          block.groupFaces();
          block.optimize();

          this.group.add(block.group);
        }
      }
    }

    this.game.renderer.scene.add(this.group);

    this.game.player.y = 6;
    this.game.player.x = this.width / 2;
    this.game.player.z = this.depth / 2;
  }

  load(map) {
    this.group = this.game.renderer.createGroup();

    if (map.length <= 0 || map[0].length <= 0 || map[0][0].length <= 0) return;
    console.log("test");
    this.setSize(map.length, map[0].length, map[0][0].length);

    for (let x = 0; x < map.length; x++) {
      for (let z = 0; z < map[x].length; z++) {
        for (let y = 0; y < map[x][z].length; y++) {
          if (map[x][z][y]) {
            this.blocks[x][z][y] = new Block(this.game, this, x, y, z, map[x][z][y]);
          }
        }
      }
    }

    for (let x = 0; x < this.blocks.length; x++) {
      for (let z = 0; z < this.blocks[x].length; z++) {
        for (let y = 0; y < this.blocks[x][z].length; y++) {
          let block = this.blocks[x][z][y];
          if (block) {
            block.setupFaces();
            block.groupFaces();
            block.optimize();

            this.group.add(block.group);
          }
        }
      }
    }

    this.game.renderer.scene.add(this.group);
  }

  withinBounds(x, y, z) {
    if (x < 0 || x >= this.blocks.length || !this.blocks[x] ||
        z < 0 || z >= this.blocks[x].length || !this.blocks[x][z] ||
        y < 0 || y >= this.blocks[x][z].length) {
      return false;
    } else {
      return true;
    }
  }

  getBlock(x, y, z, face) {
    if (face) {
      let translated = translate(x, y, z, face);
      x = translated.x;
      y = translated.y;
      z = translated.z;
    }

    return this.withinBounds(x, y, z) ? this.blocks[x][z][y] : null;
  }

  setBlock(x, y, z, face, color) {
    if (color === undefined) {
      color = face;
      face = undefined;
    }

    let block = this.getBlock(x, y, z, face);
    let faceArray = [X_PLUS, X_NEG, Y_PLUS, Y_NEG, Z_PLUS, Z_NEG];

    if (block) {
      if (color == null) {
        this.blocks[block.x][block.z][block.y] = null;
        this.group.remove(block.group);
        for (let face of faceArray) {
          let neighbour = this.getBlock(block.x, block.y, block.z, face);
          if (neighbour) {
            neighbour.optimize();
          }
        }
      } else {
        block.setColor(color);
      }
    } else if (color) {
      let translated = translate(x, y, z, face);
      x = translated.x;
      y = translated.y;
      z = translated.z;

      if (this.withinBounds(x, y, z)) {
        block = this.blocks[x][z][y] = new Block(this.game, this, x, y, z, color);
        block.setupFaces();
        block.groupFaces();
        block.optimize();

        this.group.add(block.group);

        for (let face of faceArray) {
          let neighbour = this.getBlock(block.x, block.y, block.z, face);
          if (neighbour) {
            neighbour.optimize();
          }
        }
      }
    }
  }

  collision(player, origin, delta) {
    let nx = origin.x + delta.x;
    let ny = origin.y + delta.y;
    let nz = origin.z + delta.z;

    let testing = [];
    for (let x = Math.floor(nx - player.hitbox.halfX); x <= Math.floor(nx + player.hitbox.halfX); x++) {
      for (let z = Math.floor(nz - player.hitbox.halfZ); z <= Math.floor(nz + player.hitbox.halfZ); z++) {
        for (let y = Math.floor(ny - player.hitbox.halfY); y <= Math.floor(ny + player.hitbox.halfY); y++) {
          testing.push(this.getBlock(x, y, z));
        }
      }
    }

    testing = testing.filter((block, idx) => {
      if (!block) return false;

      for (let i = 0; i < idx; i++) {
        let prevBlock = testing[i];
        if (!prevBlock) {
          continue;
        }

        if (prevBlock.x === block.x && prevBlock.z === block.z && prevBlock.y === block.y) {
          return false;
        }
      }

      return true;
    });

    for (let block of testing) {
      block.collision(player, origin, delta);
    }
  }

}
