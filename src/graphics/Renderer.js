import * as THREE from 'three';
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import OtherPlayer from 'game/OtherPlayer';

export default class Renderer {

  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.webgl = new WebGLRenderer({ canvas: game.canvas, antialias: false });
    this.webgl.setSize(window.innerWidth, window.innerHeight);
    this.webgl.setClearColor(0x25c6f7, 1);
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.light = new THREE.DirectionalLight(0xffffff, 0.2);
    this.light.castShadow = true;
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.fog = new THREE.Fog(0x25c6f7, 30, 80);
    this.scene.add(this.light);
    this.scene.add(this.ambientLight);
    this.scene.fog = this.fog;

    this.planeGeometry = new THREE.PlaneGeometry(1, 1);

    this.lastUpdate = Date.now();
    this.frame = 0;
  }

  init() {
    requestAnimationFrame(this.render.bind(this));
  }

  createPlane(options) {
    let width = options.width || 1;
    let height = options.height || 1;
    let geometry = options.geometry || (width == 1 && height == 1) ? this.planeGeometry : new THREE.PlaneGeometry(width, height);
    options.materialOptions = options.materialOptions || {};
    let material = options.material || new THREE.MeshLambertMaterial({
      ...options.materialOptions,
      color: new THREE.Color(options.color !== undefined ? options.color : 0xffffff),
      side: options.side || THREE.DoubleSide,
      map: options.texture || null
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = options.x || 0;
    mesh.position.y = options.y || 0;
    mesh.position.z = options.z || 0;
    let rotation = options.rotation || {};
    mesh.rotation.x = rotation.x || 0;
    mesh.rotation.y = rotation.y || 0;
    mesh.rotation.z = rotation.z || 0;

    return mesh;
  }

  createSprite(options) {
    options.materialOptions = options.materialOptions || {};
    let material = options.material || new THREE.SpriteMaterial({
      ...options.materialOptions,
      color: new THREE.Color(options.color !== undefined ? options.color : 0xffffff),
      side: options.side || THREE.DoubleSide,
      map: options.texture || null
    });
    let sprite = new THREE.Sprite(material);
    sprite.position.x = options.x || 0;
    sprite.position.y = options.y || 0;
    sprite.position.z = options.z || 0;
    let rotation = options.rotation || {};
    sprite.rotation.x = rotation.x || 0;
    sprite.rotation.y = rotation.y || 0;
    sprite.rotation.z = rotation.z || 0;
    let scale = options.scale || {};
    sprite.scale.x = scale.x || 1;
    sprite.scale.y = scale.y || 1;
    sprite.scale.z = scale.z || 1;

    return sprite;
  }

  createGroup() {
    return new THREE.Group();
  }

  updateCameraPosition(observer) {
    this.camera.position.x = observer.x;
    this.camera.position.y = observer.y;
    this.camera.position.z = observer.z;

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = observer.yaw;
    this.camera.rotation.x = observer.pitch;
  }

  render() {
    let now = Date.now();
    let delta = (now - this.lastUpdate)/1000;
    this.lastUpdate = now;

    requestAnimationFrame(this.render.bind(this));

    if (delta > .250) {
      // Unlikely to be frame lag -- skip frame to prevent weird physics
      // Look into better solution for this in the future
      return;
    }

    this.frame++;
    //console.log(this.frame);

    if (this.game.stats) this.game.stats.begin();

    for (let packet of this.game.packets) {
      switch (packet.action) {
        case "join":
          if (packet.id == this.game.id) break;
          this.game.otherPlayers[packet.id] = new OtherPlayer(this.game, packet.id, packet.color, packet.x, packet.y, packet.z, packet.pitch, packet.yaw);
          this.game.otherPlayers[packet.id].setup();
          break;

        case "leave":
          if (packet.id == this.game.id) break;
          if (this.game.otherPlayers[packet.id]) {
            this.game.otherPlayers[packet.id].destroy();
            delete this.game.otherPlayers[packet.id];
          }
          break;

        case "move":
          if (packet.id == this.game.id) {
            // ignore
          } else if (this.game.otherPlayers[packet.id]) {
            this.game.otherPlayers[packet.id].x = packet.x;
            this.game.otherPlayers[packet.id].y = packet.y;
            this.game.otherPlayers[packet.id].z = packet.z;
            this.game.otherPlayers[packet.id].pitch = packet.pitch;
            this.game.otherPlayers[packet.id].yaw = packet.yaw;
          }
          break;

        case "color":
          if (packet.id == this.game.id) {
            //this.game.player.setColor(packet.color);
          } else {
            this.game.otherPlayers[packet.id] && this.game.otherPlayers[packet.id].setColor(packet.color);
          }
          break;

        case "place":
        case "break":
          this.game.map.setBlock(packet.x, packet.y, packet.z, packet.color);
          break;
      }
    }

    this.game.packets = [];

    for (let key in this.game.otherPlayers) {
      this.game.otherPlayers[key].update(delta);
    }

    this.game.player.update(delta);

  	this.webgl.render(this.scene, this.camera);
    if (this.game.stats) this.game.stats.end();
  }

}
