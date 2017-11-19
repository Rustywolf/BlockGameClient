import {Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import Keyboard from 'input/Keyboard';
import Mouse from 'input/Mouse';
import Player from 'game/Player';
import Renderer from 'graphics/Renderer';

import Stats from 'external/Stats';
import ColorPicker from 'external/ColorPicker';

import Map from 'game/Map';

export default class Game {

  constructor(canvas) {
    let self = this;

    this.canvas = canvas;

    this.keyboard = new Keyboard(this);
    this.mouse = new Mouse(this);

    this.map = new Map(this);
    this.player = new Player(this, this.map);
    this.id = -1;

    this.otherPlayers = {};

    this.stats = new Stats();
    this.debugElement = document.getElementById("debug");
  	this.debugElement.appendChild(this.stats.dom);
    this.keyboard.addHandler(187, type => {
      if (type !== "down") return;
      if (self.debugElement.style.visibility == "hidden") {
        self.debugElement.style.visibility = "";
      } else {
        self.debugElement.style.visibility = "hidden";
      }
    });

    this.colorPickerContainer = document.getElementById("color-picker-container");
    this.currentColor = document.getElementById("current-color");
    this.crosshair = document.getElementById("crosshair");

    document.getElementById("color-picker-button").onclick = () => this.canvas.requestPointerLock();

    this.colorPicker = ColorPicker(
      document.getElementById("slide"),
      document.getElementById("picker"),
      (hex) => {
        this.player.setColor(hex);
      }
    );

    this.connectingDiv = document.getElementById("connecting");
    this.connectingDivCount = 0;
    this.connectingDivLoopId = setInterval(() => {
      console.log(this.connectingDivCount);
      this.connectingDivCount++;
      this.connectingDivCount %= 3;
      this.connectingDiv.innerHTML = new Array(this.connectingDivCount + 2).join(".");
    }, 333);

    this.packets = [];
    this.connected = false;
    this.socket = new WebSocket("wss://server.w0lf.me:6745");
    this.socket.onmessage = (msg) => {
      if (msg.type == "message" && typeof msg.data === "string") {
        let packet = JSON.parse(msg.data);
        if (packet.action == "connect") {
          clearInterval(this.connectingDivLoopId);
          this.connectingDiv.style.visibility = "hidden";
          this.crosshair.style.visibility = "initial";

          this.id = packet.id;
          this.player.setColor(packet.color);
          this.player.x = packet.x;
          this.player.y = packet.y;
          this.player.z = packet.z;
          this.player.pitch = packet.pitch;
          this.player.yaw = packet.yaw;

          this.renderer = new Renderer(this);
          this.renderer.init();

          this.map.load(packet.map);

          this.connected = true;
        } else {
          this.packets.push(packet);
        }
      }
    }


  }

  hasFocus() {
    return document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas;
  }

  onPointerLockChange() {
    if (!this.connected) return;

    if (this.hasFocus()) {
      this.colorPickerContainer.style.visibility = "hidden";
      this.crosshair.style.visibility = "initial";

      if (this.connected) {
        this.send({
          action: "color",
          color: this.player.colorBlock
        });
      }
    } else {
      this.colorPickerContainer.style.visibility = "initial";
      this.crosshair.style.visibility = "hidden";
    }
  }

  send(packet) {
    this.socket.send(JSON.stringify(packet));
  }

}
