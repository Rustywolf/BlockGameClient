import Game from 'Game.js';

document.addEventListener("DOMContentLoaded", e => {
  let canvas = document.getElementById("canvas");
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  try {
    if (!canvas.getContext('webgl')) {
      alert("WebGL not supported in this browser!");
    } else {
      let game = new Game(canvas);
    }
  } catch (e) {
    console.log(e);
  }
});
