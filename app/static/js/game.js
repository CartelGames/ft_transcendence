import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


//Initiating scene and camera
let game_id = "";
let playerPos = 0;
const ws = new WebSocket("ws://" + window.location.host + "/ws/game/");
const username = await getPseudo();
ws.onopen = function(event) {
  ws.send(JSON.stringify({
        'message': username.pseudo + ' joined the game'
    }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'game_state'){
    updateGameInput(data.player_pos, data.input_value);
  }
  else if (data.type === 'game_info'){
    resetGame()
  }
  else if (data.type === 'ball' && playerPos == 1){
    ball.position.x = data.ball_posx,
    ball.position.y = data.ball_posy,
    ballDirection.x = data.ball_dirx;
    ballDirection.y = data.ball_diry;
    ballSpeed = data.ball_speed;
  }
  else if (data.type === 'powerupgenerate' && playerPos == 1){
    receivePowerUp(data.poweruptype, data.poweruppos);
  }
  else if (data.type === 'game_start'){
    playerGameStarted();
  }
  else if(data.type === 'pause' && playerPos != data.player){
    togglePause()
  }
  else if (data.type === 'msg') {
    $('#Msg').text('Message: ' + data.message);
}
};

ws.onclose = function(event) {
    console.log("WebSocket closed!");
};

export function reloadGame(set_game_id, p1, p2) {
  game_id = set_game_id;
  updateGameState(p1, p2);
  ws.send(JSON.stringify({
    type: 'game_info',
    game_id: game_id,
    player_id: id
  }));
  // reload la partie avec le game_id
  // fonction appelé via queue.js pour lancer des nouvelles games
}

function updateGameState(p1, p2)
{
  if (username.pseudo === p1)
    playerPos = 0;
  else
    playerPos = 1;
  pseudo = p1;
  pseudo2 = p2;
  printPseudo();
}

function updateGameInput(input_pos, input_value)
{
  if (playerPos === input_pos)
    return;
  if (playerPos === 1)
    playerOne.position.y = input_value;
  else
    playerTwo.position.y = input_value;
<<<<<<< HEAD
  if(isPaused == true && score[0] != 0 && score [1] != 0){
=======
  if(isPaused == true){
>>>>>>> main
    printPseudo();
  }
}

const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});

//FPS counter top left
const stats = new Stats();
document.getElementById("game").appendChild(stats.dom);

let isPaused = true;
//Setting camera position
camera.position.z =30;

//Scores
const scoreGrp = new THREE.Group();
let score = new Array(2);
score[0]=0;
score[1]=0;

//Powerups setup
//Power-up const
let powerUpSpeed = 0.1;
let powerUpLDirection = { x: -1, y: 0};
let powerUpRDirection = { x: 1, y: 0};
let powerLUp = false;
let powerRUp = false;
let LBoardSpeedMalus = false;
let RBoardSpeedMalus = false;
let LBoardUpscale = false;
let RBoardUpscale = false;
let boardUpscale = 1;
let powerUpType = "none";
const powerUpLGroup = new THREE.Group();
const powerUpRGroup = new THREE.Group();

function checkPowerUp(){
  //Si il n'y a aucun power up a l'ecran, on lance un random pour voir si on en cree un
  if (powerLUp == false && powerRUp == false && getRandomInt(2) == 1 && playerPos == 0){
    powerLUp = true;
    powerRUp = true;
    createPowerUp();
  }
  //Mouvement et collision du power up de gauuche
  else{
    if (powerLUp == true){
      powerUpLGroup.position.x += powerUpLDirection.x * powerUpSpeed;
      if (powerUpLGroup.position.x < playerOne.position.x + 1 &&
          powerUpLGroup.position.x > playerOne.position.x - 1 &&
          powerUpLGroup.position.y < playerOne.position.y + (boardHeight/2 * (boardUpscale + LBoardUpscale)) &&
          powerUpLGroup.position.y > playerOne.position.y - (boardHeight/2 * (boardUpscale + LBoardUpscale))) {
        scene.remove(powerUpLGroup);
        powerLUp = false;
        switch (powerUpType){
          case "boardUpscale":
            LBoardUpscale = true;
            break;
          case "ballSpeedMalus":
            ballSpeed *= 1.5;
            break;
          case "boardSpeedMalus":
            RBoardSpeedMalus = true;
            break;
          case "randomBallMalus":
            if(playerPos == 0){
              ballDirection.y = (getRandomInt(100) - 50) / 15;
              ws.send(JSON.stringify({
                type: 'ball',
                ball_posx: ball.position.x,
                ball_posy: ball.position.y,
                ball_dirx: ballDirection.x,
                ball_diry: ballDirection.y,
                ball_speed: ballSpeed
            }));}
            break;
        }
      }
      if (powerUpLGroup.position.x < canvasBounds.left){
        scene.remove(powerUpLGroup);
        powerLUp = false;
      }
    }
    //Mouvement et collision du power up de droite
    if (powerRUp == true)
    {
      powerUpRGroup.position.x += powerUpRDirection.x * powerUpSpeed;
      if (powerUpRGroup.position.x < playerTwo.position.x + 1 &&
          powerUpRGroup.position.x > playerTwo.position.x - 1 &&
          powerUpRGroup.position.y < playerTwo.position.y + (boardHeight/2 * (boardUpscale + RBoardUpscale)) &&
          powerUpRGroup.position.y > playerTwo.position.y - (boardHeight/2 * (boardUpscale + RBoardUpscale))) {
        scene.remove(powerUpRGroup);
        powerRUp = false;
        switch (powerUpType){
          case "boardUpscale":
            RBoardUpscale = true;           
            break;
          case "ballSpeedMalus":
            ballSpeed *= 1.5;
            break;
          case "boardSpeedMalus":
            LBoardSpeedMalus = true;
            break;
          case "randomBallMalus":
            if(playerPos == 0){
              ballDirection.y = (getRandomInt(100) - 50) / 15;
              ws.send(JSON.stringify({
                type: 'ball',
                ball_posx: ball.position.x,
                ball_posy: ball.position.y,
                ball_dirx: ballDirection.x,
                ball_diry: ballDirection.y,
                ball_speed: ballSpeed
            }));}
            break;
        }
      }
      if (powerUpRGroup.position.x > canvasBounds.right){
        scene.remove(powerUpRGroup);
        powerRUp = false;
      }
    }
  }
  playerOne.scale.y = 1 + LBoardUpscale;
  playerTwo.scale.y = 1 + RBoardUpscale;
}

function createPowerUp(){
  const capsuleL = new THREE.SphereGeometry();
  let powerUpMaterial;
  switch (getRandomInt(4)) {
      case 0:
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x76e64a} );
        powerUpType = "boardUpscale";       
        break;
      case 1:
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0xe6e6fa} );
        powerUpType = "ballSpeedMalus";
        break;
      case 2:
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff50} );
        powerUpType = "boardSpeedMalus";
        break;
      case 3:
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x6aff00} );
        powerUpType = "randomBallMalus";
        break;
  }
  const modelL = new THREE.Mesh( capsuleL, powerUpMaterial);
  const modelR = new THREE.Mesh( capsuleL, powerUpMaterial);
  powerUpLGroup.add(modelL);
  powerUpRGroup.add(modelR);
  let pos = getRandomInt(20) + 1;
  powerUpLGroup.position.set(0,pos,0);
  powerUpRGroup.position.set(0,-pos,0);
  ws.send(JSON.stringify({
    type: 'powerupgenerate',
    poweruptype: powerUpType,
    poweruppos: pos,
  }));
  scene.add(powerUpLGroup);
  scene.add(powerUpRGroup);
}

function receivePowerUp(poweruptype, poweruppos)
{
  const capsuleL = new THREE.SphereGeometry();
  let powerUpMaterial;
  switch (poweruptype){
    case "boardUpscale":
      powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x76e64a} );
      powerUpType = "boardUpscale";       
      break;
    case "ballSpeedMalus":
      powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0xe6e6fa} );
      powerUpType = "ballSpeedMalus";
      break;
    case "boardSpeedMalus":
      powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff50} );
      powerUpType = "boardSpeedMalus";
      break;
    case "randomBallMalus":
      powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x6aff00} );
      powerUpType = "randomBallMalus";
      break;
  }
  const modelL = new THREE.Mesh( capsuleL, powerUpMaterial);
  const modelR = new THREE.Mesh( capsuleL, powerUpMaterial);
  powerUpLGroup.add(modelL);
  powerUpRGroup.add(modelR);
  powerUpLGroup.position.set(0,poweruppos,0);
  powerUpRGroup.position.set(0,-poweruppos,0);
  powerLUp = true;
  powerRUp = true;
  scene.add(powerUpLGroup);
  scene.add(powerUpRGroup);  
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
let clock;
const params = {
  threshold: 0,
  strength: 1,
  radius: 0,
  exposure: 1
};
 

const loader = new FontLoader();
const ttfloader = new TTFLoader();
const ball = new THREE.Group();
clock = new THREE.Clock();

new GLTFLoader().load( '/static/models/gltf/ball.glb', function ( gltf ) {

  const model = gltf.scene;
  ball.add( model );
} );

const mConvert = 0.0002645833;
renderer.setPixelRatio(canvas.width/canvas.height);
renderer.setSize(canvas.width, canvas.height, false);

const playerOne = new THREE.Group();
const playerTwo = new THREE.Group();
new GLTFLoader().load( '/static/models/gltf/hoverboard.glb', function ( gltf ) {

  const model = gltf.scene;
  model.scale.set(0.02, 0.02, 0.02);
  model.rotation.set(Math.PI /2, 0,Math.PI /2);
  
  playerTwo.add(model);

} );
new GLTFLoader().load( '/static/models/gltf/hoverboard.glb', function ( gltf ) {

  const model = gltf.scene;
  model.scale.set(0.02, 0.02, 0.02);
  model.position.x -= 4;
  model.rotation.set(Math.PI /2, 0,-Math.PI /2);
  
  playerOne.add(model);

} );

let vertex; 
let fragment;
async function fetchingfragShader(){
  return fetch('static/js/shaders/fragment.glsl').then((response) => response.text()).then((text) => {fragment = text;});
}
await fetchingfragShader();
async function fetchingvertShader(){
  return fetch('static/js/shaders/vertex.glsl').then((response) => response.text()).then((text) => {vertex = text;});
}
await fetchingvertShader();

const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: vertex,
  fragmentShader: fragment
});

//Menu setup
const menu = new THREE.Group();
let textMenu;
startGame();

function startGame() {
  var HideDiv = document.getElementById('LeaveQueue')
  HideDiv.style.display = 'none';
  score[0] = 0;
  score[1] = 0;
  powerUpSpeed = 0.1;
  powerUpLDirection = { x: -1, y: 0};
  powerUpRDirection = { x: 1, y: 0};
  powerLUp = false;
  powerRUp = false;
  LBoardSpeedMalus = false;
  RBoardSpeedMalus = false;
  LBoardUpscale = false;
  RBoardUpscale = false;
  boardUpscale = 1;
  powerUpType = "none";
  const ttfloader = new TTFLoader();
    ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
      const cyberfont = loader.parse(json);
        const geometry = new TextGeometry( 'Start', {
          font: cyberfont,
          size: 3,
          height: 1,
        } );
        const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
        textMenu = new THREE.Mesh(geometry, textMaterial);
        textMenu.position.set(-15, 0, 0);
        menu.clear();
        menu.add(textMenu);
        scene.add(menu);
  });
}

<<<<<<< HEAD
=======

>>>>>>> main
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const zoneGeometry = new THREE.PlaneGeometry(50, 10);
const zoneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0 });
const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
zoneMesh.position.y = 2; // Move the plane slightly behind the other objects
scene.add(zoneMesh);

function playerGameStarted(event) {
  if (isPaused) {
    // Start the game
<<<<<<< HEAD
    document.removeEventListener('mousedown', onMouseClick);
=======
>>>>>>> main
    isPaused = !isPaused;
    scene.remove(zoneMesh);
    scene.add(ball);
    // Hide the "Start Game" button
    menu.remove(textMenu);
    scoring();
  }
}

function onMouseClick(event) {
<<<<<<< HEAD
  ws.send(JSON.stringify({
    type: 'game_start',
    game_id: game_id
  }));
=======
  /*// Update the mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Get the list of intersecting objects
  const intersects = raycaster.intersectObject(zoneMesh);

  // Check if the "Start Game" button was clicked
  if (intersects.length > 0 && isPaused) {
    // Start the game
    isPaused = !isPaused;
    scene.remove(zoneMesh);
    scene.add(ball);
    // Hide the "Start Game" button
    menu.remove(textMenu);
    scoring();*/
    ws.send(JSON.stringify({
      type: 'game_start',
      game_id: game_id
    }));
  //}
>>>>>>> main
}

document.addEventListener('mousedown', onMouseClick);

//Setup two players + background
let boardHeight = 10;
const geometry = new THREE.BoxGeometry( 1, boardHeight, 1 );
const background = new THREE.PlaneGeometry(144, 81);

//const backgroundMaterial = new THREE.MeshStandardMaterial( {map: videoTexture});
const back = new THREE.Mesh(background, shaderMaterial);
const material = new THREE.MeshStandardMaterial( {color: 0x0000ff} ); 
scene.add( playerOne , playerTwo, back);
const canvasBounds = {
  left: -((canvas.width/2) * mConvert) * (camera.position.z * 9.3),
  right: ((canvas.width/2) * mConvert)* (camera.position.z * 9.3),
  bottom: -((canvas.height/2) * mConvert)* camera.position.z * 9.3,
  top: ((canvas.height/2) * mConvert)* camera.position.z * 9.3
};

back.position.set(0,0,-10);
ball.position.set(0,0,0);
playerOne.position.set(canvasBounds.left + 2, 0, 0);
playerTwo.position.set(canvasBounds.right - 2, 0, 0);

let time = 0;

//Light settings
const pointLight = new THREE.PointLight(0xffffff);
const pointLight2 = new THREE.PointLight(0xff00ff);
pointLight2.position.set(0,0,10);
scene.add(pointLight, pointLight2);


//Event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp)
let id = (await getPseudo()).id;
window.addEventListener('keydown', function (event) {
  if (event.key === 'p') {
    togglePause();
    ws.send(JSON.stringify({
      type: 'pause',
      player: playerPos,
    }));
  }
});

//Speed and starting direction settings
let ballSpeed = 0.2;
let ballDirection = { x: 1, y: 1 };

//Making sure two players can play
const keyState = {};

function onKeyDown(event) {
  keyState[event.keyCode] = true; 

}

function onKeyUp(event) {
  keyState[event.keyCode] = false; 
}

scoring();
function updated() {
  checkPowerUp();
  ball.rotateOnAxis(new THREE.Vector3(0,1,0), 0.05);
  ball.rotateOnAxis(new THREE.Vector3(0,0,1), 0.05);
  ball.position.x += ballSpeed * ballDirection.x;
  ball.position.y += ballSpeed * ballDirection.y;
  //Player2 gets a point
  if (ball.position.x < canvasBounds.left){
    ballSpeed = 0.2;
    ball.position.set(0,0,0);
    ballDirection = {x: -1, y: 1}
    score[1]++;
    if (score[1] == 2)
      rWin();
    else
      scoring();
  }
  //Player1 gets a point
  if (ball.position.x > canvasBounds.right) {
    ballSpeed = 0.2;
    ball.position.set(0,0,0);
    score[0]++;
    if (score[0] == 2)
      lWin();
    else
      scoring();
  }

  // Check for bottom and top boundary collisions
  if (ball.position.y  < canvasBounds.bottom || ball.position.y  > canvasBounds.top) {
    ballDirection.y *= -1; // reverse the Y direction of the ball
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }

  // Check for playerOne collision
  if (ball.position.x < playerOne.position.x + 1 &&
      ball.position.x > playerOne.position.x - 1 &&
      ball.position.y < playerOne.position.y + (boardHeight/2 * (boardUpscale + LBoardUpscale)) &&
      ball.position.y > playerOne.position.y - (boardHeight/2 * (boardUpscale + LBoardUpscale)) && ballDirection.x < 0) {
    ballDirection.x *= -1; // reverse the X direction of the ball
    ballSpeed *= 1.1;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }

  // Check for playerTwo collision
  if (ball.position.x < playerTwo.position.x + 1 &&
      ball.position.x > playerTwo.position.x - 1 &&
      ball.position.y < playerTwo.position.y + (boardHeight/2 * (boardUpscale + RBoardUpscale)) &&
      ball.position.y > playerTwo.position.y - (boardHeight/2 * (boardUpscale + RBoardUpscale)) && ballDirection.x > 0) {
    ballDirection.x *= -1; // reverse the X direction of the ball
    ballSpeed *= 1.1;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }

  //Check for top boundary collision for players
  if (playerOne.position.y + boardHeight /2 > canvasBounds.top) {
    playerOne.position.y = canvasBounds.top - boardHeight/2;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }
  // Check for bottom boundary collision for players
  if (playerOne.position.y - boardHeight/2 < canvasBounds.bottom) {
    playerOne.position.y = canvasBounds.bottom + boardHeight/2;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }
  if (playerTwo.position.y + boardHeight/2 > canvasBounds.top) {
    playerTwo.position.y = canvasBounds.top - boardHeight/2;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }
  if (playerTwo.position.y - boardHeight/2 < canvasBounds.bottom) {
    playerTwo.position.y = canvasBounds.bottom + boardHeight/2;
    if(playerPos == 0){
      ws.send(JSON.stringify({
        type: 'ball',
        ball_posx: ball.position.x,
        ball_posy: ball.position.y,
        ball_dirx: ballDirection.x,
        ball_diry: ballDirection.y,
        ball_speed: ballSpeed
    }));}
  }

  //To make the light follow the ball
  pointLight.position.set(ball.position.x,ball.position.y,10);

  //Moves the boards
  if (playerPos === 0) {
    if (keyState[87])
      movePong(playerOne, playerOne.position.y + (4 - LBoardSpeedMalus));
    if (keyState[83])
      movePong(playerOne, playerOne.position.y - (4 - LBoardSpeedMalus));
    if (keyState[38])
      movePong(playerOne, playerOne.position.y + (4 - LBoardSpeedMalus));
    if (keyState[40])
      movePong(playerOne, playerOne.position.y - (4 - LBoardSpeedMalus));
      ws.send(JSON.stringify({
        type: 'input',
        player_pos: playerPos,
        input_value: playerOne.position.y
      }));
  }
  else {
    if (keyState[87])
      movePong(playerTwo, playerTwo.position.y + (4 - RBoardSpeedMalus));
    if (keyState[83])
      movePong(playerTwo, playerTwo.position.y - (4 - RBoardSpeedMalus));
    if (keyState[38])
      movePong(playerTwo, playerTwo.position.y + (4 - RBoardSpeedMalus));
    if (keyState[40])
      movePong(playerTwo, playerTwo.position.y - (4 - RBoardSpeedMalus));
    ws.send(JSON.stringify({
      type: 'input',
      player_pos: playerPos,
      input_value: playerTwo.position.y
    }));
  }
}

//Moves smoothly
function movePong(mesh, targetY) {
  gsap.to(mesh.position, {
    duration: 1, // duration of the animation in seconds
    ease: "power2.out", // easing function to use
    y: targetY, // target y-axis position
  });
  let playerPos;
  if(mesh === playerOne)
    playerPos = 0;
  else
    playerPos = 1;
}

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    // Pause the animation loop
    cancelAnimationFrame(renderer.setAnimationLoop(null));
  } else {
    // Resume the animation loop
    renderer.setAnimationLoop(null);
  }
}

let pseudo = username.pseudo;
let pseudo2 = username.pseudo;
async function printPseudo(){
  console.log(pseudo2);
  if (pseudo.length > 8)
    pseudo = pseudo.substr(0,7) + '.';
  if (pseudo2.length > 8)
    pseudo2 = pseudo2.substr(0,7) + '.';
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( pseudo, {
        font: cyberfont,
        size: 2,
        height: 1,
      } );
      const geometry2 = new TextGeometry( pseudo2, {
        font: cyberfont,
        size: 2,
        height: 1,
      } );
      //var center = new THREE.Vector3();
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.geometry.center();
      textMesh.position.set(canvasBounds.left + 20, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.geometry.center();
      textMesh2.position.set(canvasBounds.right - 20, 15, -2);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
  });
}
//I AM CON, SCOREGRP NOT GOOD, TO FIX LATER
printPseudo();

function scoring(){
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( score[0].toString(), {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const geometry2 = new TextGeometry( score[1].toString(), {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-25, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(20, 15, -2);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
  });
}

function rWin(){ 
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( "LOSE", {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const geometry2 = new TextGeometry( "WIN", {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      let winText = pseudo2 + " WIN"
      console.log(winText)
      const geometry3 = new TextGeometry( winText, {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-30, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(10, 15, -2);
      const textMesh3 = new THREE.Mesh(geometry3, textMaterial);
      textMesh3.geometry.center();
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2, textMesh3);
      scene.add(scoreGrp);
      //WE ADD THE SCORE TO PLAYERTWO LOGS
      resetGame();
      togglePause();
  });
}

function lWin(){
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( "WIN", {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const geometry2 = new TextGeometry( "LOSE", {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      let winText = pseudo + " WIN"
      console.log(winText)
      const geometry3 = new TextGeometry(winText, {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-30, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(10, 15, -2);
      const textMesh3 = new THREE.Mesh(geometry3, textMaterial);
      textMesh3.geometry.center();
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2, textMesh3);
      scene.add(scoreGrp);
      resetGame();
      togglePause();
  });
}

let winner;
async function sendGameInfo(scene, score1, score2){
  if (score1 == 2){
    winner = 'player1';
  }
  if (score2 == 2){
    winner = 'player2';
  }

  const user = await getPseudo();
  const data = {
    type: 'newGame',
    player1: user.id,
    pseudo_p1: user.pseudo,
    winner: winner,
  } 
  $.ajax({
    type: 'POST',
    url: '/newGame/',
    headers: { 'X-CSRFToken': token },
    data: data,
    success: function (data) {
      console.log(data.errors);
        if (data.success) {
            console.log('new game created');
        }
        token = data.csrf_token;
    },
    error: function (error) {
        console.log('Erreur lors de la creation d\'une partie.');
    }
  });
}

async function resetGame(){
  await sendGameInfo(scene, score[0], score[1]);
  scene.remove(ball);
  score[0] = 0;
  score[1] = 0;
  powerLUp = false;
  powerRUp = false;
  powerUpSpeed = 0.1;
  powerUpLDirection = { x: -1, y: 0};
  powerUpRDirection = { x: 1, y: 0};
  powerLUp = false;
  powerRUp = false;
  LBoardSpeedMalus = false;
  RBoardSpeedMalus = false;
  LBoardUpscale = false;
  RBoardUpscale = false;
  boardUpscale = 1;
  powerUpType = "none";
  powerUpLGroup.clear;
  powerUpRGroup.clear;
  playerOne.position.set(canvasBounds.left + 2, 0, 0);
  playerTwo.position.set(canvasBounds.right - 2, 0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused){
      updated();
    }
    shaderMaterial.uniforms.time.value += 0.005;
		stats.update();
    renderer.render(scene, camera);
    shaderMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);

}
animate();