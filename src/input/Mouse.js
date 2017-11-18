import * as Actions from 'input/MouseActions';

export default class Mouse {

  constructor(game) {
    this.game = game;

    this.handlers = {};
    this.handlers[Actions.MOVE] = [];

    this.eventToActionMap = [
      Actions.LEFT_BUTTON, Actions.MIDDLE_BUTTON, Actions.RIGHT_BUTTON
    ];

    this.buttonsDown = {};

    this.init();
  }

  init() {
    let self = this;

    this.game.canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    this.game.canvas.requestPointerLock();
    this.game.canvas.onclick = () => self.game.canvas.requestPointerLock();

    if ("onpointerlockchange" in document) {
      document.addEventListener('pointerlockchange', this.game.onPointerLockChange.bind(this.game), false);
    } else if ("onmozpointerlockchange" in document) {
      document.addEventListener('mozpointerlockchange', this.game.onPointerLockChange.bind(this.game), false);
    }

    document.addEventListener("mousemove", e => {
      if (document.pointerLockElement == self.game.canvas || document.mozPointerLockElement == self.game.canvas) {
        for (let handler of self.handlers[Actions.MOVE]) {
          handler(e);
        }
      }
    });

    document.addEventListener("mousedown", e => {
      let action = self.eventToActionMap[e.button];
      if (!action) return;

      self.validateAction(action);
      for (let handler of self.handlers[action]) {
        handler("down", e);
      }

      self.buttonsDown[action] = true;
    });

    document.addEventListener("mouseup", e => {
      let action = self.eventToActionMap[e.button];
      if (!action) return;

      self.validateAction(action);
      for (let handler of self.handlers[action]) {
        handler("up", e);
      }

      self.buttonsDown[action] = false;
    });
  }

  validateAction(action) {
    if (!this.handlers[action]) {
      this.handlers[action] = [];
    }
  }

  addHandler(action, handler) {
    this.validateAction(action);
    this.handlers[action].push(handler);
  }

  removeHandler(action, handler) {
    this.validateAction(action);
    if (this.handlers[action].indexOf(handler) != -1) {
      this.handlers.splice(this.handlers.indexOf(handler), 1);
    }
  }

  actionHeld(action) {
    return this.buttonsDown[action] || false;
  }

  leftHeld() {
    return this.actionHeld(Actions.LEFT_BUTTON);
  }

  middleHeld() {
    return this.actionHeld(Actions.MIDDLE_BUTTON);
  }

  rightHeld() {
    return this.actionHeld(Actions.RIGHT_BUTTON);
  }

}
