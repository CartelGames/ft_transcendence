import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';



//SETUP
let game_id = "";
let playerPos = 0;
let isPaused = 1;
let ttfloader;
const clock = new THREE.Clock();
let loader = new FontLoader();
const username = await getPseudo();
let id = (await getPseudo()).id;
let pseudo, pseudo2;
function sending(input)
{
    ws.send(JSON.stringify({
        type: 'input',
        input: input,
    }));
}

const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});
camera.position.set(0, -20, 2) //initial camera position, once game starts, make it travel to final position using gsap
camera.lookAt(0, 0, 5);
const controls = new OrbitControls( camera, renderer.domElement );
controls.update();
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
const background = new THREE.PlaneGeometry(144, 81);
const texture = new THREE.TextureLoader().load('static/images/tron.jpg' ); 
const backmat = new THREE.MeshBasicMaterial( { map:texture } );
const back = new THREE.Mesh(background, backmat);
scene.add(back);

//Walls for 3D scene
function walls(){
  const wallMat = new THREE.MeshStandardMaterial( { color: 0x808080 } );
  const wallNS = new THREE.BoxGeometry(canvas.width, 1, 30);
  const wallEW = new THREE.BoxGeometry(1, canvas.height, 30);
  const wallNorth = new THREE.Mesh(wallNS, wallMat);
  const wallSouth = new THREE.Mesh(wallNS, wallMat);
  const wallEast = new THREE.Mesh(wallEW, wallMat);
  const wallWest = new THREE.Mesh(wallEW, wallMat);
  scene.add(wallNorth, wallSouth, wallEast, wallWest);//
  wallNorth.position.y = canvasBounds.top;
  wallSouth.position.y = canvasBounds.bottom;
  wallEast.position.x = canvasBounds.right;
  wallWest.position.x = canvasBounds.left;
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
zoneMesh.position.y = canvasBounds.top - 2;
zoneMesh.position.z += 3; // Move the plane slightly behind the other objects
zoneMesh.rotateX(1.57);
scene.add(zoneMesh);

function playerGameStarted(event) {
  if (isPaused) {
    // Start the game
    isPaused = !isPaused;
    scene.remove(zoneMesh);
    // Hide the "Start Game" button
    menu.remove(textMenu);
  }
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
    // Start the game
    startAnimation();
    scene.remove(zoneMesh);
    // Hide the "Start Game" button
    menu.remove(textMenu);
  }
}
document.addEventListener('mousedown', onMouseClick);

//SETUP DONE

//Player objects setup
const bikeSpeed = 0.1;
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
    const bike = new THREE.CapsuleGeometry(1,1,4,8);
    const material = new THREE.MeshStandardMaterial( {color: 0xffffff});
    //bikeOne = new THREE.Mesh(bike, material);
    scene.add(bikeOne);
    bikeOne.position.set(-10, -10, 0);
    bikeOne.rotateZ(1.57);
    //bikeTwo = new THREE.Mesh(bike, material);
    scene.add(bikeTwo);
    bikeTwo.position.set(10, -10, 0);
    bikeTwo.rotateZ(-1.57);
}
createPlayer();


function rotateBikesGame(bike, key) {
  let targetRotation = 0;

  if (key === 'up') {
    targetRotation = -Math.PI / 2; // North (90 degrees)
  } else if (key === 'down') {
    targetRotation = Math.PI / 2; // South (270 degrees)
  } else if (key === 'left') {
    targetRotation = 0; // East (0 degrees) inverted for player one
  } else if (key === 'right') 
    targetRotation = Math.PI; // West (180 degrees) inverted for player one

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
}

//movements (cant go backwards into your own trail, as thats cheating)
//TO DO, FAIRE LES MOVEMENTS DANS LE BON SENS AVEC GSAP ET FAIRE LES NEONS TRAILS ET UN BACKGROUDN NEON STYLAX
window.addEventListener('keydown', function (event) {
  if (event.key === 'p')
    togglePause();
  if (event.key === 'w')
    if (bikeOneDir.y != -1){
      rotateBikesGame(bikeOne, 'up');
      bikeOneDir = {x:0, y:1};
    }
  if (event.key === 's')
    if (bikeOneDir.y != 1){
      rotateBikesGame(bikeOne, 'down');
      bikeOneDir = {x:0, y:-1};
    }
  if (event.key === 'a')
    if (bikeOneDir.x != 1){
      rotateBikesGame(bikeOne, 'left');
      bikeOneDir = {x:-1, y:0};
    }
  if (event.key === 'd')
    if (bikeOneDir.x != -1){
      rotateBikesGame(bikeOne, 'right');
      bikeOneDir = {x:1, y:0};
    }


  if (event.key === 'ArrowUp')
    if (bikeTwoDir.y != -1){
      rotateBikesGame(bikeTwo, 'up');
      bikeTwoDir = {x:0, y:1};
    }
  if (event.key === 'ArrowDown')
    if (bikeTwoDir.y != 1){
      rotateBikesGame(bikeTwo, 'down');
      bikeTwoDir = {x:0, y:-1};
    }
  if (event.key === 'ArrowLeft')
    if (bikeTwoDir.x != 1){
      rotateBikesGame(bikeTwo, 'left');
      bikeTwoDir = {x:-1, y:0};
    }
  if (event.key === 'ArrowRight')
    if (bikeTwoDir.x != -1){
      rotateBikesGame(bikeTwo, 'right');
      bikeTwoDir = {x:1, y:0};
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
const traildelta = 1;
let trailTimer = 0;
let prevBikeOnePosition = bikeOne.position.clone();
let prevBikeTwoPosition = bikeTwo.position.clone();
function updated(){
  const delta = clock.getDelta();
  trailTimer += delta;
  bikeOne.position.x += bikeOneDir.x * bikeSpeed;
  bikeTwo.position.x += bikeTwoDir.x * bikeSpeed;
  bikeOne.position.y += bikeOneDir.y * bikeSpeed;
  bikeTwo.position.y += bikeTwoDir.y * bikeSpeed;
  
  const newPosOne = new THREE.Vector3(bikeOne.position.x, bikeOne.position.y, bikeOne.position.z);
  const newPosTwo = new THREE.Vector3(bikeTwo.position.x, bikeTwo.position.y, bikeTwo.position.z);

  //if (trailTimer > traildelta){
    if (!positionsOne.length || !positionsOne[positionsOne.length - 1].equals(newPosOne)) {
      positionsOne.push(newPosOne);
    }
    if (!positionsTwo.length || !positionsTwo[positionsTwo.length - 1].equals(newPosTwo)) {
      positionsTwo.push(newPosTwo);
    }
  //}

  //if (trailTimer > traildelta)
    trails();

  const playerOneCollided = checkCollision(bikeOne, trailTwo);
  const playerTwoCollided = checkCollision(bikeTwo, trailOne);
  //const playerOneSuicided = checkCollision(bikeOne, trailOne);
  //const playerTwoSuicided = checkCollision(bikeTwo, trailTwo);|| playerOneSuicided|| playerTwoSuicided
  if (playerOneCollided ){
    console.log("playerone collided");
    isPaused = 1;
  }
  if (playerTwoCollided )
  {
    console.log("playetwo collided");
    isPaused = 1;
  }
}

function updateGameState(p1, p2){
  console.log(p1, p2);
  if (username.pseudo === p1)
    playerPos = 0;
  else
    playerPos = 1;
  pseudo = p1;
  pseudo2 = p2;
}

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.5;
bloomPass.radius = 1.0;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

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
  color: 0xffff00, // Neon blue color
  emissive: 0xffff00, // Neon blue emissive color
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

    const geometry = new THREE.TubeGeometry(curve, 64, 1, 8, false);
    const geometry2 = new THREE.TubeGeometry(curve2, 64, 1, 8, false);

    const materialOne = new THREE.MeshStandardMaterial({color: 0xffffff});

    const materialTwo = new THREE.MeshStandardMaterial({color: 0xffffff});

    trailOne = new THREE.Mesh(geometry, trailMaterial1);
    trailTwo = new THREE.Mesh(geometry2, trailMaterial2);

    scene.add(trailOne, trailTwo);
  }
}

//Player objects setup done

//GAME CODE

//trailOne and trailTwo stay behind bikes and grows over time

//inputs to maneuver inside the square map

//if trailOne intersects with bikeTwo => bikeOne wins etc...
function checkCollision(player, trail){
  if (!trail) return false;

  const points = trail.geometry.attributes.position.array;

  // Check the distance between the player and each point on the trail
  for (let i = 0; i < points.length; i += 3) {
    const x = points[i];
    const y = points[i + 1];
    const z = points[i + 2];

    const distance = player.position.distanceTo(new THREE.Vector3(x, y, z));

    if (distance < 1) return true; // 1 is the radius of the trail
  }
  if (player.position.x < canvasBounds.left || player.position.x > canvasBounds.right ||
      player.position.y < canvasBounds.bottom || player.position.y > canvasBounds.top) {
    return true;
  }
  return false;
}

//GAME DONE
const ws = new WebSocket("ws://" + window.location.host + "/ws/gametwo/");

ws.onopen = function(event) {
    console.log("Coucou la zone"); 
    
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log(data)
  if (data.type === 'message'){
    console.log('pouet');
  }
};

ws.onclose = function(event) {
    console.log("WebSocket closed!");
};

export function reloadGame2(set_game_id, p1, p2) {
  game_id = set_game_id;
  console.log("id de la game : " + game_id);
  updateGameState(p1, p2);
  ws.send(JSON.stringify({
    type: 'game_info',
    game_id: game_id,
    player_id: id
  }));
  // reload la partie avec le game_id
  // fonction appelé via queue.js pour lancer des nouvelles games
}

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused){
      updated();
    }
    composer.render();
    renderer.render(scene, camera);
    //controls.update();
}
animate();