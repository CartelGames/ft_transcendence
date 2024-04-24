import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';


const ws = new WebSocket("wss://" + window.location.host + "/wss/game/");

ws.onopen = function(event) {
    console.log("WebSocket for Tron connected !"); 
};

//SETUP
let game_id = "";
let playerPos = 0;
let isPaused = 1;
let ttfloader = new TTFLoader();
const scoreGrp = new THREE.Group();
const clock = new THREE.Clock();
let loader = new FontLoader();
const username = await getPseudo();
let id = (await getPseudo()).id;
let pseudo, pseudo2;
let ended = false;
let play = false;

const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});
camera.position.set(0, -20, 5) //initial camera position, once game starts, make it travel to final position using gsap
camera.lookAt(0, 10, 1);
//const controls = new OrbitControls( camera, renderer.domElement );
//controls.update();
//camera.position.z = 50; //camera final position

renderer.setPixelRatio(canvas.width/canvas.height);
renderer.setSize(canvas.width, canvas.height, false);

//Setting bounds with camera position in mind
const mConvert = 0.0002645833;
const canvasBounds = {
  left: -((canvas.width/2) * mConvert) * (50 * 9.3),
  right: ((canvas.width/2) * mConvert)* (50 * 9.3),
  bottom: -((canvas.height/2) * mConvert)* 50 * 9.3,
  top: ((canvas.height/2) * mConvert)* 50 * 9.3
};

const pointlight = new THREE.PointLight(0xffffff);
const ambientlight = new THREE.AmbientLight(0xffffff);
scene.add(pointlight);//, ambientlight
pointlight.position.set(0, 0, 10);


let vertex; 
let fragment;
async function fetchingfragShader(){
  return fetch('static/js/shaders/fragmenttwo.glsl').then((response) => response.text()).then((text) => {fragment = text;});
}
await fetchingfragShader();
async function fetchingvertShader(){
  return fetch('static/js/shaders/vertex.glsl').then((response) => response.text()).then((text) => {vertex = text;});
}
await fetchingvertShader();

const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2(180,120) },
    cameraPosition: {value: camera.position},
  },
  vertexShader: vertex,
  fragmentShader: fragment
});

const background = new THREE.PlaneGeometry(180, 120);
const texture = new THREE.TextureLoader().load('static/images/tron1.jpg'); 
const texturewall = new THREE.TextureLoader().load('static/images/outrun.jpg');
const wallNMat = new THREE.MeshBasicMaterial( {map: texturewall});
const backmat = new THREE.MeshStandardMaterial( { map:texture } );
const back = new THREE.Mesh(background, backmat);
scene.add(back);

//Walls for 3D scene
function walls(){
  const wallMat = new THREE.MeshStandardMaterial( { color: 0x000000 } );
  const wallNS = new THREE.BoxGeometry(canvas.width/5, 1, 110);
  const wallEW = new THREE.BoxGeometry(1, canvas.height/5, 100);
  const wallNorth = new THREE.Mesh(wallNS, wallNMat);
  const wallSouth = new THREE.Mesh(wallNS, wallNMat);
  const wallEast = new THREE.Mesh(wallEW, wallNMat);
  const wallWest = new THREE.Mesh(wallEW, wallNMat);
  scene.add(wallNorth, wallSouth, wallEast, wallWest);//
  wallNorth.position.y = canvasBounds.top;
  wallSouth.position.y = canvasBounds.bottom;
  wallEast.position.x = canvasBounds.right;
  wallWest.position.x = canvasBounds.left;
  wallNorth.position.z += 14;
  wallEast.position.z += 15;
  wallWest.position.z += 15;
  wallSouth.position.z += 15;
  wallEast.rotateX(1.57);
  wallWest.rotateX(1.57);
  wallSouth.rotateY(Math.PI);
}
walls();

const menu = new THREE.Group();
let textMenu;
startGame();

function startGame() {
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
        textMenu.geometry.center();
        textMenu.position.set(0, 10, 3);
        textMenu.rotateX(1.57);
        menu.clear();
        menu.add(textMenu);
        scene.add(menu);
  });
}

function startAnimation(){
  gsap.to(camera.position, {
    duration: 2, // Duration of the transition (in seconds)
    x: 0, // Final x position
    y: 0, // Final y position
    z: 50, // Final z position
    ease: 'power2.out', // Easing function
    onUpdate: () => {
      // Update the camera target during the transition
      camera.lookAt(0, 0, 0);
    },
    onComplete: () => {
      isPaused = !isPaused;
    }
  });
  gsap.to(bikeOne.position, {
      duration: 2, // Duration of the transition (in seconds)
      x: -35, // Final x position
      y: 0, // Final y position
      z: 0, // Final z position
      ease: 'power2.out' // Easing function
  });
    // Use gsap.to() to transition the bike two position
  gsap.to(bikeTwo.position, {
      duration: 2, // Duration of the transition (in seconds)
      x: 35, // Final x position
      y: 0, // Final y position
      z: 0, // Final z position
      ease: 'power2.out' // Easing function
  });
  rotateBikesAnimation(bikeOne, bikeTwo);  
}

function rotateBikesAnimation(bike1, bike2){
  gsap.to(bike1.rotation, {
    duration: 2,
    z: Math.PI,
    ease: 'power2.out',
  });
  gsap.to(bike2.rotation, {
    duration: 2,
    z: Math.PI*2,
    ease: 'power2.out',
  });
}


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const zoneGeometry = new THREE.PlaneGeometry(50, 10);
const zoneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0 });
const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
zoneMesh.position.y = 11; // Move the plane slightly behind the start text
zoneMesh.rotateX(1.57);
scene.add(zoneMesh);

function playerGameStarted(event) {
  startAnimation();
  scene.remove(zoneMesh);
  scene.remove(scoreGrp);
  // Hide the "Start Game" button
  menu.remove(textMenu);
  /*if (isPaused) {
    // Start the game
    isPaused = !isPaused;
    scene.remove(zoneMesh, scoreGrp);
    // Hide the "Start Game" button
    menu.remove(textMenu);
  }*/
}

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
    ws.send(JSON.stringify({
      type: 'game_start',
      game_id: game_id
    }));
    /*// Start the game
    startAnimation();
    scene.remove(zoneMesh);
    scene.remove(scoreGrp);
    // Hide the "Start Game" button
    menu.remove(textMenu);*/
  }
}
document.addEventListener('mousedown', onMouseClick);

//SETUP DONE

//Player objects setup
const bikeSpeed = 0.60; // if you want to up this speed, update the distance check in checkCollisions
let bikeOneDir = {x: 1, y:0};
let bikeTwoDir = {x:-1, y:0};
let bikeOne = new THREE.Group(); //player1
let bikeTwo = new THREE.Group(); //player2
//when a player connects, create a bike

new GLTFLoader().load( '/static/models/gltf/tronbike.glb', function ( gltf ) {

  const model = gltf.scene;
   model.scale.set(20, 20, 20);
   model.rotation.set(Math.PI /2, Math.PI /2, 0);
  
  bikeOne.add(model);
} );
new GLTFLoader().load( '/static/models/gltf/tronbike.glb', function ( gltf ) {

  const model = gltf.scene;
   model.scale.set(20, 20, 20);
   model.rotation.set(Math.PI /2, Math.PI /2, 0);
  
  bikeTwo.add(model);
  bikeTwo.rotateZ(-Math.PI); //pour garder la meme orientation de model pour les animations
} );



function createPlayer(){
    const bike = new THREE.CapsuleGeometry(1,0.5,4,8);
    const material = new THREE.MeshStandardMaterial( {color: 0xffffff, transparent:true, opacity: 0.0});
    const collisionMeshOne = new THREE.Mesh(bike, material);
    const collisionMeshTwo = new THREE.Mesh(bike, material);
    collisionMeshOne.position.set(-1.5,0,1);
    collisionMeshOne.rotateZ(1.57);
    collisionMeshOne.name = 'collisionCapsule';
    bikeOne.add(collisionMeshOne);
    bikeOne.name = 'bikeOne';
    bikeTwo.name = 'bikeTwo';
    //bikeOne = new THREE.Mesh(bike, material);
    scene.add(bikeOne);
    bikeOne.position.set(-10, -10, 0);
    bikeOne.rotateZ(1.57);
    collisionMeshTwo.position.set(-1.5,0,1);
    collisionMeshTwo.rotateZ(1.57);
    collisionMeshTwo.name = 'collisionCapsule';
    bikeTwo.add(collisionMeshTwo);
    //bikeTwo = new THREE.Mesh(bike, material);
    scene.add(bikeTwo);
    bikeTwo.position.set(10, -10, 0);
    bikeTwo.rotateZ(-1.57);
}
createPlayer();

pseudo = username.pseudo;
pseudo2 = username.pseudo;
async function printPseudo(){
  if (pseudo.length > 8)
    pseudo = pseudo.substr(0,7) + '.';
  if (pseudo2.length > 8)
    pseudo2 = pseudo2.substr(0,7) + '.';
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
      const geometry = new TextGeometry( pseudo2, {
        font: cyberfont,
        size: 2,
        height: 1,
      } );
      const geometry2 = new TextGeometry( pseudo, {
        font: cyberfont,
        size: 2,
        height: 1,
      } );
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
      const textMesh = new THREE.Mesh(geometry, textMaterial);
      textMesh.geometry.center();
      textMesh.position.set(25, 15, 10);
      textMesh.rotateX(1.57);
      const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
      textMesh2.geometry.center();
      textMesh2.position.set(-25, 15, 10);
      textMesh2.rotateX(1.57);
      scoreGrp.clear();
      scoreGrp.add(textMesh, textMesh2);
      scene.add(scoreGrp);
  });
}
printPseudo();

function rotateBikesGame(bike, key, x, y) {
  let targetRotation = 0;

  if (key === 'up') {
    targetRotation = -Math.PI / 2; // North (90 degrees)
  } else if (key === 'down') {
    targetRotation = Math.PI / 2; // South (270 degrees)
  } else if (key === 'left') {
    targetRotation = 0; // West (0 degrees) inverted bcs plane is weird
  } else if (key === 'right') 
    targetRotation = Math.PI; // East (180 degrees) inverted bcs plane is weird

  // Add the difference between the target rotation and the current rotation to the current rotation value
  let rotationDifference = targetRotation - bike.rotation.z;
  if (rotationDifference > Math.PI) {
    rotationDifference -= Math.PI * 2;
  } else if (rotationDifference < -Math.PI) {
    rotationDifference += Math.PI * 2;
  }
  gsap.to(bike.rotation, {
    duration: 0.5,
    z: bike.rotation.z + rotationDifference,
    ease: 'power2.out',
  });
  sending(x, y, bike.rotation.z + rotationDifference);
}

//movements (cant go backwards into your own trail, as thats cheating)
window.addEventListener('keydown', function (event) {
  if (!play || ended)
    return;
  if (event.key === 'p')
    togglePause();
  if (playerPos === 0) {
    if (event.key === 'w' || event.key === 'ArrowUp')
      if (bikeOneDir.y != -1){
        rotateBikesGame(bikeOne, 'up', 0, 1);
        bikeOneDir = {x:0, y:1};
      }
    if (event.key === 's' || event.key === 'ArrowDown')
      if (bikeOneDir.y != 1){
        rotateBikesGame(bikeOne, 'down', 0, -1);
        bikeOneDir = {x:0, y:-1};
      }
    if (event.key === 'a' || event.key === 'ArrowLeft')
      if (bikeOneDir.x != 1){
        rotateBikesGame(bikeOne, 'left', -1, 0);
        bikeOneDir = {x:-1, y:0};
      }
    if (event.key === 'd' || event.key === 'ArrowRight')
      if (bikeOneDir.x != -1){
        rotateBikesGame(bikeOne, 'right', 1, 0);
        bikeOneDir = {x:1, y:0};
      }
  }
  else {
    if (event.key === 'w' || event.key === 'ArrowUp')
      if (bikeTwoDir.y != -1){
        rotateBikesGame(bikeTwo, 'up', 0, 1);
        bikeTwoDir = {x:0, y:1};
      }
    if (event.key === 's' || event.key === 'ArrowDown')
      if (bikeTwoDir.y != 1){
        rotateBikesGame(bikeTwo, 'down', 0, -1);
        bikeTwoDir = {x:0, y:-1};
      }
    if (event.key === 'a' || event.key === 'ArrowLeft')
      if (bikeTwoDir.x != 1){
        rotateBikesGame(bikeTwo, 'left', -1, 0);
        bikeTwoDir = {x:-1, y:0};
      }
    if (event.key === 'd' || event.key === 'ArrowRight')
      if (bikeTwoDir.x != -1){
        rotateBikesGame(bikeTwo, 'right', 1, 0);
        bikeTwoDir = {x:1, y:0};
      }
  }
});

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
const positionsOne = [];
const positionsTwo = [];
const bufferOne = [];
const bufferTwo = [];

function updated(){
  bikeOne.position.x += bikeOneDir.x * bikeSpeed;
  bikeTwo.position.x += bikeTwoDir.x * bikeSpeed;
  bikeOne.position.y += bikeOneDir.y * bikeSpeed;
  bikeTwo.position.y += bikeTwoDir.y * bikeSpeed;
  
  const newPosOne = new THREE.Vector3(bikeOne.position.x, bikeOne.position.y, bikeOne.position.z);
  const newPosTwo = new THREE.Vector3(bikeTwo.position.x, bikeTwo.position.y, bikeTwo.position.z);
  const currentTime = Date.now();
  bufferOne.push(currentTime);
  bufferTwo.push(currentTime);
  if ((!positionsOne.length || !positionsOne[positionsOne.length - 1].equals(newPosOne))) {
    positionsOne.push(newPosOne);
  }
  if ((!positionsTwo.length || !positionsTwo[positionsTwo.length - 1].equals(newPosTwo))) {
    positionsTwo.push(newPosTwo);
  }
  trails();

  const playerOneCollided = checkCollision(bikeOne, trailTwo);
  const playerTwoCollided = checkCollision(bikeTwo, trailOne);
  const playerOneSuicided = checkCollision(bikeOne, trailOne);
  const playerTwoSuicided = checkCollision(bikeTwo, trailTwo);
  if (playerOneCollided || playerOneSuicided){
    //console.log("playerone collided");
    isPaused = 1;
    ended = true;
    if (playerPos == 0) {
      ws.send(JSON.stringify({
        type: 'game_ended',
        game_id: game_id,
        score1: 0,
        score2: 1,
      }));
    }
    winAnimation(bikeTwo);
  }
  if (playerTwoCollided || playerTwoSuicided)
  {
    //console.log("playetwo collided");
    isPaused = 1;
    ended = true;
    if (playerPos == 0) {
      ws.send(JSON.stringify({
        type: 'game_ended',
        game_id: game_id,
        score1: 1,
        score2: 0,
      }));
    }
    winAnimation(bikeOne);
  }
}

function winAnimation(player){
  gsap.to(camera.position, {
    duration: 1,
    x: player.position.x,
    y: player.position.y - 5,
    z: player.position.z + 5,
    ease: 'power2.out',
  });
  camera.lookAt(0, 50, 5);
  printWinMsg(player);
}

function printWinMsg(player){
  let name;
  if (player == bikeTwo)
    name = pseudo2;
  else
    name = pseudo; //why l'inverse hmm. probablement un bug au dessus dans les pseudo=username.pseudo;
  ttfloader.load('static/css/fonts/cyberFont.ttf', (json) => {
    const cyberfont = loader.parse(json);
    let winText = name + " WINS"
    //console.log(winText)
    const geometry3 = new TextGeometry(winText, {
      font: cyberfont,
      size: 0.5,
      height: 0.5,
    } );
    var BackButt = document.getElementById('BackMenu')
    BackButt.style.display = 'block';
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0x921B92 });
    const textMesh3 = new THREE.Mesh(geometry3, textMaterial);
    textMesh3.geometry.center();
    textMesh3.rotateX(1);
    textMesh3.position.set(player.position.x, player.position.y + 1, player.position.z + 3);
    scoreGrp.clear();
    scoreGrp.add(textMesh3);
    scene.add(scoreGrp);
  });
}

function updateGameState(p1, p2){
  if (username.pseudo === p1)
    playerPos = 0;
  else
    playerPos = 1;
  pseudo = p1;
  pseudo2 = p2;
}

//neon effect
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.25, 0.5);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);


//trail code
const trailMaterial1 = new THREE.MeshStandardMaterial({
  color: 0x00ffff, // Neon blue color
  emissive: 0x00ffff, // Neon blue emissive color
  emissiveIntensity: 1.0, // Emissive intensity
  roughness: 0.5, // Roughness
  metalness: 0.0, // Metalness
  transparent: true, // Enable transparency
  opacity: 0.5, // Opacity
});
const trailMaterial2 = new THREE.MeshStandardMaterial({
  color: 0xff00ff, // Neon purple color
  emissive: 0xff00ff, // Neon purple emissive color
  emissiveIntensity: 1.0, // Emissive intensity
  roughness: 0.5, // Roughness
  metalness: 0, // Metalness
  transparent: true, // Enable transparency
  opacity: 0.5, // Opacity
});
let trailOne; //player1 trail
let trailTwo; //player2 trail

function trails(){

  if (trailOne) scene.remove(trailOne);
  if (trailTwo) scene.remove(trailTwo);

  const cleanPositionsOne = positionsOne.filter(p => p !== undefined);
  const cleanPositionsTwo = positionsTwo.filter(p => p !== undefined);
  if (cleanPositionsOne.length > 1 && cleanPositionsTwo.length > 1) { 
    const curve = new THREE.CatmullRomCurve3(cleanPositionsOne.map(p => new THREE.Vector3(p.x, p.y, p.z)));
    const curve2 = new THREE.CatmullRomCurve3(cleanPositionsTwo.map(p => new THREE.Vector3(p.x, p.y, p.z)));

    const geometry = new THREE.TubeGeometry(curve, cleanPositionsOne.length * 3, 0.5, 8, false);
    const geometry2 = new THREE.TubeGeometry(curve2, cleanPositionsTwo.length * 3, 0.5, 8, false);
    geometry.name = 'trailOne';
    geometry2.name = 'trailTwo';
    trailOne = new THREE.Mesh(geometry, trailMaterial1);
    trailTwo = new THREE.Mesh(geometry2, trailMaterial2);
    
    scene.add(trailOne, trailTwo);
  }
}

function checkCollision(player, trail){
  let posXY;
  if (!trail) return false;
  let positions;
  if (trail.geometry.name === 'trailOne')
    positions = positionsOne;
  else 
    positions = positionsTwo;
  if (player.name === 'bikeOne')
    posXY = new THREE.Vector2(player.position.x + (bikeOneDir.x * 1.6), player.position.y + (bikeOneDir.y * 1.6));
  else
    posXY = new THREE.Vector2(player.position.x + (bikeTwoDir.x * 1.6), player.position.y + (bikeTwoDir.y * 1.6));
  for (let i = 0; i < positions.length; i++){
    const x = positions[i].x;
    const y = positions[i].y;
    const distance = posXY.distanceTo(new THREE.Vector2(x,y));

    if (distance < 1.5)
      return true; // if speed goes up, this goes up too or the check wont work
  }
  if (player.position.x < canvasBounds.left || player.position.x > canvasBounds.right ||
      player.position.y < canvasBounds.bottom || player.position.y > canvasBounds.top) {
    return true;
  }
  return false;
}


//GAME DONE

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'msg') {
    $('#Msg').text('Message: ' + data.message);
  }
  else if (data.type === 'game_start'){
    playerGameStarted();
  }
  else if (data.type === 'game_info'){
    play = data.play;
  }
  else if (data.type === 'game_send_tron') {
      if (data.player_pos === playerPos)
        return ;
      if (data.player_pos === 0) {
        gsap.to(bikeOne.rotation, {
          duration: 0.5,
          z: data.move,
          ease: 'power2.out',
        });
        bikeOneDir.x = data.rotationX;
        bikeOneDir.y = data.rotationY;
        // bikeOne.rotation.z = data.move;
      }
      else {
        gsap.to(bikeTwo.rotation, {
          duration: 0.5,
          z: data.move,
          ease: 'power2.out',
        });
        bikeTwoDir.x = data.rotationX;
        bikeTwoDir.y = data.rotationY;
        // bikeTwo.rotation.z = data.move;
      }
  }
};

function sending(rotationX, rotationY, move)
{
  ws.send(JSON.stringify({
    type: 'input_tron',
    game_id: game_id,
    player_pos: playerPos,
    rotationX: rotationX,
    rotationY: rotationY,
    move: move,
  }));
}

ws.onclose = function(event) {
    console.log("WebSocket closed!");
};

export function reloadGame(set_game_id, p1, p2) {
  game_id = set_game_id;
  updateGameState(p1, p2);
  setTimeout(function () {
    ws.send(JSON.stringify({
      type: 'game_info',
      game_id: game_id,
      player_id: id
    }));
  }, 250);
  // reload la partie avec le game_id
  // fonction appelé via queue.js pour lancer des nouvelles games
}

// const stats = new Stats();
// document.getElementById("game").appendChild(stats.dom);

function animate() {
  setTimeout( function() { requestAnimationFrame( animate ); }, 1000 / 30 );
    if (!isPaused){
      updated();
    }
    //stats.update();
    composer.render();
    shaderMaterial.uniforms.time.value += 0.005;
    shaderMaterial.uniforms.cameraPosition.value.copy(camera.position);
    //renderer.render(scene, camera);
    shaderMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    //controls.update();
}
animate();


//FIX SUICIDE PUIS PLAYER NAMES ET WIN MSG PUIS C'EST GG