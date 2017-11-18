import * as Keys from 'input/Keys'

export default class Keyboard {

  constructor(game) {
    this.game = game;
    this.handlers = {};
    this.pressed = {};

    this.init();
  }

  init() {
    let self = this;

    document.addEventListener("keydown", e => {
      if (self.handlers[e.keyCode]) {
        e.preventDefault();
        for (let handler of self.handlers[e.keyCode]) {
          handler("down", e);
        }
      }
    });

    document.addEventListener("keyup", e => {
      if (self.handlers[e.keyCode]) {
        e.preventDefault();
        for (let handler of self.handlers[e.keyCode]) {
          handler("up", e);
        }
      }
    });

    for (let key in Keys) {
      let keyCode = Keys[key];
      this.addHandler(keyCode, name => {
        if (name == "down") {
          self.pressed[keyCode] = true;
        } else if (name == "up") {
          self.pressed[keyCode] = false;
        }
      });
    }
  }

  validateKeyCode(keyCode) {
    if (!this.handlers[keyCode]) {
      this.handlers[keyCode] = [];
    }
  }

  addHandler(keyCode, handler) {
    this.validateKeyCode(keyCode);
    this.handlers[keyCode].push(handler);
  }

  removeHandler(keyCode, handler) {
    this.validateKeyCode(keyCode);

    if (this.handlers[keyCode].indexOf(handler) != -1) {
      this.handlers[keyCode].splice(this.handlers[keyCode].indexOf(handler), 1);
    }
  }

  keyHeld(key) {
    return this.pressed[key] || false;
  }

  leftHeld() {
    return this.keyHeld(Keys.VK_LEFT);
  }

  upHeld() {
    return this.keyHeld(Keys.VK_UP);
  }

  rightHeld() {
    return this.keyHeld(Keys.VK_RIGHT);
  }

  downHeld() {
    return this.keyHeld(Keys.VK_DOWN);
  }

  spaceHeld() {
    return this.keyHeld(Keys.VK_SPACE);
  }

}
