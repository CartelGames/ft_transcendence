import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


//Initiating scene and camera
const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});

//FPS counter top left
const stats = new Stats();
document.body.appendChild(stats.dom);

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
let boardSpeedMalus = 0.5;
let LBoardUpscale = false;
let RBoardUpscale = false;
let boardUpscale = 1;
let randomBallMalus = false;
let powerUpType = "none";
let powerUpLClock = 0;
let powerUpRClock = 0;
let randomMoveClock = 0;
const powerUpLGroup = new THREE.Group();
const powerUpRGroup = new THREE.Group();

function checkPowerUp(){
  //Si il n'y a aucun power up a l'ecran, on lance un random pour voir si on en cree un
  if (powerLUp == false && powerRUp == false && getRandomInt(2) == 1){
    console.log("here");
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
          case "boardSpeedNalus":
            RBoardSpeedMalus = true;
            break;
          case "randomBallMalus":
            ballDirection.y = (getRandomInt(100) - 50) / 15;
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
          case "boardSpeedNalus":
            LBoardSpeedMalus = true;
            break;
          case "randomBallMalus":
            ballDirection.y = (getRandomInt(100) - 50) / 15;
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
  const capsuleR = new THREE.SphereGeometry();
  let powerUpMaterial;
  switch (getRandomInt(4)) {
      case 0:
        console.log("0")
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x76e64a} );
        powerUpType = "boardUpscale";       
        break;
      case 1:
        console.log("1")
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0xe6e6fa} );
        powerUpType = "ballSpeedMalus";
        break;
      case 2:
        console.log("2")
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff50} );
        powerUpType = "boardSpeedMalus";
        break;
      case 3:
        console.log("3")
        powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x6aff00} );
        powerUpType = "randomBallMalus";
        break;
  }
  const modelL = new THREE.Mesh( capsuleL, powerUpMaterial);
  //powerUpMaterial = new THREE.MeshStandardMaterial( {color: 0x000000} );
  const modelR = new THREE.Mesh( capsuleR, powerUpMaterial);
  powerUpLGroup.add(modelL);
  powerUpRGroup.add(modelR);
  let pos = getRandomInt(20) + 1;
  powerUpLGroup.position.set(0,pos,0);
  powerUpRGroup.position.set(0,-pos,0);
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
  //scene.add(ball);
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

// const video = document.getElementById('background-video');
// const videoTexture = new THREE.VideoTexture(video);
// videoTexture.minFilter = THREE.LinearFilter;
// videoTexture.magFilter = THREE.LinearFilter;

const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;

    void main() {
      // Calculate the distance from the center of the screen
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      uv = uv * 2.0 - 1.0;
      float dist = length(uv);

      // Calculate the amplitude of the popping effect based on time
      float amplitude = 0.5 * (1.0 + sin(time));

      // Calculate the color based on the distance and amplitude
      vec3 color = vec3(0.0);
      if (dist < 0.5) {
        float t = 1.0 - smoothstep(0.4, 0.5, dist);
        color = vec3(1.0, 1.0, 1.0) * t * amplitude;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

//Menu setup
const menu = new THREE.Group();
let textMenu;
function startGame() {
  const ttfloader = new TTFLoader();
    ttfloader.load('static/models/fonts/cyberFont.ttf', (json) => {
      const cyberfont = loader.parse(json);
        const geometry = new TextGeometry( 'Start', {
          font: cyberfont,
          size: 3,
          height: 1,
        } );
        const textMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
        textMenu = new THREE.Mesh(geometry, textMaterial);
        textMenu.position.set(-15, 0, 0);
        menu.clear();
        menu.add(textMenu);
        scene.add(menu);
  });
}
startGame();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const zoneGeometry = new THREE.PlaneGeometry(50, 10);
const zoneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0 });
const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
zoneMesh.position.y = 2; // Move the plane slightly behind the other objects
scene.add(zoneMesh);

function onMouseClick(event) {
  // Update the mouse position
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
    scoring();
  }
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

//Light settings
const pointLight = new THREE.PointLight(0xffffff);
const pointLight2 = new THREE.PointLight(0xff00ff);
pointLight2.position.set(0,0,10);
scene.add(pointLight, pointLight2);


//Event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp)
window.addEventListener('keydown', function (event) {
  if (event.key === 'p') {
    togglePause();
  }
});

//Speed and starting direction settings
let ballSpeed = 0.5;
let ballDirection = { x: 1, y: 1 };

//Making sure two players can play
const keyState = {};

function onKeyDown(event) {
  keyState[event.keyCode] = true; 

}

function onKeyUp(event) {
  keyState[event.keyCode] = false; 
}

//Ball data and timer for AI
let currentPos = ball.position;
let currentDir = ballDirection;
let predictedNextDir = "none";
let predictedNextPos = "none";
let predictedFinalPos = "none";
let timer = 0;
let isBotPlaying = true;

function predictNextDir(currentPos, currentDir) {
  let delta_x = currentDir.x * ballSpeed;
  let delta_y = currentDir.y * ballSpeed;
  let predictedPosition = $.extend( true, {}, currentPos);
  let predictedDir = $.extend( true, {}, currentDir);
  predictedPosition.x += delta_x;
  predictedPosition.y += delta_y;

  // Mirror la direction y si la coordonnée verticale de la position sort de la map
  if (predictedPosition.y > canvasBounds.top || predictedPosition.y < canvasBounds.bottom)
    predictedDir.y *= -1;

  // Mirror la direction x si la coordonnée horizontale de la position passe derrière la raquette adverse
  if (predictedPosition.x < playerOne.position.x)
    predictedDir.x *= -1;

  return predictedDir;
}

function predictNextPos(currentPos, currentDir) {
  let delta_x = currentDir.x * ballSpeed;
  let delta_y = currentDir.y * ballSpeed;
  let predictedPosition = $.extend( true, {}, currentPos);
  predictedPosition.x += delta_x;
  predictedPosition.y += delta_y;

  // Mirror la composante y si la coordonnée verticale de la position sort de la map
  if (predictedPosition.y > canvasBounds.top)
    predictedPosition.y = canvasBounds.top - (predictedPosition.y - canvasBounds.top);
  else if (predictedPosition.y < canvasBounds.bottom)
    predictedPosition.y = canvasBounds.bottom - (predictedPosition.y - canvasBounds.bottom);

  // Mirror la composante x si la coordonnée horizontale de la position passe derrière la raquette adverse
  if (predictedPosition.x < playerOne.position.x)
    predictedPosition.x = playerOne.position.x - (predictedPosition.x - playerOne.position.x);

  // Corriger la position prédite si elle passe derrière la board de l'IA

  if (predictedPosition.x > playerTwo.position.x + 1)
  {
    let slope = (predictedPosition.y - currentPos.y) / (predictedPosition.x - currentPos.x);
    predictedPosition.x = playerTwo.position.x - 1;
    predictedPosition.y = currentPos.y + slope * (predictedPosition.x - currentPos.y);
  }

  return predictedPosition;
}

function predictFinalPos(predictedNextPos, predictedNextDir) {
  let predictedFinalPos = $.extend( true, {}, predictedNextPos);
  let predictedFinalDir = $.extend( true, {}, predictedNextDir);

  while (predictedFinalPos.x < playerTwo.position.x - 1)
  {
    predictedFinalPos = predictNextPos(predictedNextPos, predictedNextDir);
    predictedFinalDir = predictNextDir(predictedNextPos, predictedNextDir)
    predictedNextPos = $.extend( true, {}, predictedFinalPos);
    predictedNextDir = $.extend( true, {}, predictedFinalDir);
  }

  return predictedFinalPos;
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
    ballSpeed = 0.5;
    ball.position.set(0,0,0);
    ballDirection = {x: -1, y: 1}
    score[1]++;
    if (score[1] == 10)
      rWin();
    else
      scoring();
  }
  //Player1 gets a point
  if (ball.position.x > canvasBounds.right) {
    ballSpeed = 0.5;
    ball.position.set(0,0,0);
    score[0]++;
    if (score[0] == 10)
      lWin();
    else
      scoring();
  }

  // Check for bottom and top boundary collisions
  if (ball.position.y  < canvasBounds.bottom || ball.position.y  > canvasBounds.top) {
    ballDirection.y *= -1; // reverse the Y direction of the ball
  }

  // Check for playerOne collision
  if (ball.position.x < playerOne.position.x + 1 &&
      ball.position.x > playerOne.position.x - 1 &&
      ball.position.y < playerOne.position.y + (boardHeight/2 * (boardUpscale + LBoardUpscale)) &&
      ball.position.y > playerOne.position.y - (boardHeight/2 * (boardUpscale + LBoardUpscale)) && ballDirection.x < 0) {
    ballDirection.x *= -1; // reverse the X direction of the ball
    ballSpeed *= 1.1;
  }

  // Check for playerTwo collision
  if (ball.position.x < playerTwo.position.x + 1 &&
      ball.position.x > playerTwo.position.x - 1 &&
      ball.position.y < playerTwo.position.y + (boardHeight/2 * (boardUpscale + RBoardUpscale)) &&
      ball.position.y > playerTwo.position.y - (boardHeight/2 * (boardUpscale + RBoardUpscale)) && ballDirection.x > 0) {
    ballDirection.x *= -1; // reverse the X direction of the ball
    ballSpeed *= 1.1;
    if (isBotPlaying == true)
    {
      predictedNextPos = "none";
      predictedNextDir = "none";
      predictedFinalPos = "none";
      currentPos = "none";
      currentDir = "none";
    }
  }

  //Check for top boundary collision for players
  if (playerOne.position.y + boardHeight /2 > canvasBounds.top) {
    playerOne.position.y = canvasBounds.top - boardHeight/2;
  }
  // Check for bottom boundary collision for players
  if (playerOne.position.y - boardHeight/2 < canvasBounds.bottom) {
    playerOne.position.y = canvasBounds.bottom + boardHeight/2;
  }
  if (playerTwo.position.y + boardHeight/2 > canvasBounds.top) {
    playerTwo.position.y = canvasBounds.top - boardHeight/2;
  }
  if (playerTwo.position.y - boardHeight/2 < canvasBounds.bottom) {
    playerTwo.position.y = canvasBounds.bottom + boardHeight/2;
  }

  //To make the light follow the ball
  pointLight.position.set(ball.position.x,ball.position.y,10);

  // AI PART - Commented conditions are potentiel nerfs.
  // -----------------------------------------------------------------------------
  if (isBotPlaying == true)
  {
    if (timer % 30 == 0) // would timer % current fps count be more precise?
    {
      currentPos = $.extend( true, {}, ball.position);
      currentDir = $.extend( true, {}, ballDirection);

      // Si aucune prédiction n'est faite ou que la prédiction précédente est fausse, faire une prédiction
      if (predictedFinalPos == "none" || predictedNextPos == "none"
      || Math.trunc(predictedNextPos.x) != Math.trunc(currentPos.x)
      || Math.trunc(predictedNextPos.y) != Math.trunc(currentPos.y))
      {
        console.log("predict");
        predictedNextPos = predictNextPos(currentPos, currentDir);
        predictedNextDir = predictNextDir(currentPos, currentDir)
        predictedFinalPos = predictFinalPos(predictedNextPos, predictedNextDir);
      }
    }

    if (powerRUp == true && (currentDir.x < 0 || (currentDir.x > 0 && currentPos.x <= 0)) && powerUpRGroup.position.x > playerTwo.position.x - canvasBounds.right / 6) // Si la balle s'éloigne et qu'un powerup s'approche, aller récup le powerup
    {
      if (playerTwo.position.y + (boardHeight * playerTwo.scale.y * 0.5) / 2 < powerUpRGroup.position.y)
        // keyState[38] pour que le j2 aille vers le haut
      keyState[38] = true;
      else if (playerTwo.position.y - (boardHeight * playerTwo.scale.y * 0.5) / 2 > powerUpRGroup.position.y)
        // keyState[40] pour que le j2 aille vers le bas
      keyState[40] = true;
    }
    else if (currentDir.x < 0 || currentPos.x <= 0) // Si la balle s'éloigne et qu'il n'y a pas de powerup, retourner au centre
    {
      if (playerTwo.position.y + (boardHeight * playerTwo.scale.y * 0.5) / 2 < 0)
        keyState[38] = true;
      else if (playerTwo.position.y - (boardHeight * playerTwo.scale.y * 0.5) / 2 > 0)
        keyState[40] = true;
    }
    else // Si la balle se rapproche, aller vers sa destination
    {
      if (predictedFinalPos != "none")
      {
        if (playerTwo.position.y + (boardHeight * playerTwo.scale.y * 0.5) / 2 < predictedFinalPos.y)
          keyState[38] = true;
        else if (playerTwo.position.y - (boardHeight * playerTwo.scale.y * 0.5) / 2 > predictedFinalPos.y)
          keyState[40] = true;
      }
      else
      {
        if (playerTwo.position.y + (boardHeight * playerTwo.scale.y * 0.5) / 2 < currentPos.y)
          keyState[38] = true;
        else if (playerTwo.position.y - (boardHeight * playerTwo.scale.y * 0.5) / 2 > currentPos.y)
          keyState[40] = true;
      }
    }
    timer++;
  }
  // -----------------------------------------------------------------------------

  //Moves the boards
  if (keyState[87])
    movePong(playerOne, playerOne.position.y + (4 - LBoardSpeedMalus));
  if (keyState[83])
    movePong(playerOne, playerOne.position.y - (4 - LBoardSpeedMalus));
  if (keyState[38])
    movePong(playerTwo, playerTwo.position.y + (4 - RBoardSpeedMalus));
  if (keyState[40])
    movePong(playerTwo, playerTwo.position.y - (4 - RBoardSpeedMalus));

  if (isBotPlaying == true)
  {
    keyState[38] = false;
    keyState[40] = false;
  }
}

//Moves smoothly
function movePong(mesh, targetY) {
  gsap.to(mesh.position, {
    duration: 1, // duration of the animation in seconds
    ease: "power2.out", // easing function to use
    y: targetY, // target y-axis position
  });
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


async function printPseudo(){
  const pseudo = await getPseudo();
  ttfloader.load('static/models/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( pseudo, {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const geometry2 = new TextGeometry( pseudo, {
        font: cyberfont,
        size: 3,
        height: 1,
      } );
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-25, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(20, 15, -2);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
  });
}
//I AM CON, SCOREGRP NOT GOOD, TO FIX LATER
printPseudo();

function scoring(){
  ttfloader.load('static/models/fonts/cyberFont.ttf', (json) => {
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
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
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
  ttfloader.load('static/models/fonts/cyberFont.ttf', (json) => {
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
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-30, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(10, 15, -2);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
      //WE ADD THE SCORE TO PLAYERTWO LOGS
      resetGame();
  });
}

function lWin(){
  ttfloader.load('static/models/fonts/cyberFont.ttf', (json) => {
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
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.position.set(-30, 15, -2);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.position.set(10, 15, -2);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
      //WE ADD THE SCORE TO PLAYERONE LOGS
      resetGame();
  });
}

function resetGame(){
  isPaused = true;
  scene.remove(ball);
  score[0] = 0;
  score[1] = 0;
  startGame();
  playerOne.position.set(canvasBounds.left + 2, 0, 0);
  playerTwo.position.set(canvasBounds.right - 2, 0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused){
      updated();
    }
    shaderMaterial.uniforms.time.value += 0.01;
    //videoTexture.needsUpdate = true;
    //Uncomment to get fps counter
		stats.update();
    renderer.render(scene, camera);
    shaderMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);

}
//video.play();
animate();