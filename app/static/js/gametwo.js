import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'


//SETUP
let game_id = "";
let playerPos = 0;
let isPaused = 0;
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
//camera.position.set(0, 0, 1) //initial camera position, once game starts, make it travel to final position using gsap
//camera.lookAt(0, 1, 1);
const controls = new OrbitControls( camera, renderer.domElement );
controls.update();
camera.position.z = 50; //camera final position

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

//shader code, subject to change
let vertex; 
let fragment;
async function fetchingfragShader(){
  return fetch('static/js/shaders/fragmenttwo.glsl').then((response) => response.text()).then((text) => {fragment = text;});
}
await fetchingfragShader();
async function fetchingvertShader(){
  return fetch('static/js/shaders/vertextwo.glsl').then((response) => response.text()).then((text) => {vertex = text;});
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
//SETUP DONE

//Player objects setup
const bikeSpeed = 0.1;
let bikeOneDir = {x: 1, y:0};
let bikeTwoDir = {x:-1, y:0};
let bikeOne; //player1
let bikeTwo; //player2
//when a player connects, create a bike
function createPlayer(){
    const bike = new THREE.CapsuleGeometry(1,1,4,8);
    const material = new THREE.MeshStandardMaterial( {color: 0xffffff});
    bikeOne = new THREE.Mesh(bike, material);
    scene.add(bikeOne);
    bikeOne.position.set(-35, 0, 1);
    bikeOne.rotateX(1.57);
    bikeTwo = new THREE.Mesh(bike, material);
    scene.add(bikeTwo);
    bikeTwo.position.set(35, 0, 1);
    bikeTwo.rotateX(1.57);
}
createPlayer();

//movements (cant go backwards into your own trail, as thats cheating)
window.addEventListener('keydown', function (event) {
  if (event.key === 'p')
    togglePause();
  if (event.key === 'w')
    if (bikeOneDir.y != -1)
      bikeOneDir = {x:0, y:1};
  if (event.key === 's')
    if (bikeOneDir.y != 1)
      bikeOneDir = {x:0, y:-1};
  if (event.key === 'a')
    if (bikeOneDir.x != 1)
      bikeOneDir = {x:-1, y:0};
  if (event.key === 'd')
    if (bikeOneDir.x != -1)
      bikeOneDir = {x:1, y:0};


  if (event.key === 'ArrowUp')
    if (bikeTwoDir.y != -1)
      bikeTwoDir = {x:0, y:1};
  if (event.key === 'ArrowDown')
    if (bikeTwoDir.y != 1)
      bikeTwoDir = {x:0, y:-1};
  if (event.key === 'ArrowLeft')
    if (bikeTwoDir.x != 1)
      bikeTwoDir = {x:-1, y:0};
  if (event.key === 'ArrowRight')
    if (bikeTwoDir.x != -1)
      bikeTwoDir = {x:1, y:0};
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

function updated(){
  bikeOne.position.x += bikeOneDir.x * bikeSpeed;
  bikeTwo.position.x += bikeTwoDir.x * bikeSpeed;
  bikeOne.position.y += bikeOneDir.y * bikeSpeed;
  bikeTwo.position.y += bikeTwoDir.y * bikeSpeed;
  
  const newPosOne = new THREE.Vector3(bikeOne.position.x, bikeOne.position.y, bikeOne.position.z);
  const newPosTwo = new THREE.Vector3(bikeTwo.position.x, bikeTwo.position.y, bikeTwo.position.z);

  if (!positionsOne.length || !positionsOne[positionsOne.length - 1].equals(newPosOne)) {
    positionsOne.push(newPosOne);
  }
  if (!positionsTwo.length || !positionsTwo[positionsTwo.length - 1].equals(newPosTwo)) {
    positionsTwo.push(newPosTwo);
  }

  trails();

  const playerOneCollided = checkCollision(bikeOne, trailTwo);
  const playerTwoCollided = checkCollision(bikeTwo, trailOne);
  if (playerOneCollided){
    console.log("playerone collided");
    isPaused = 1;
  }
  if (playerTwoCollided)
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

    const materialOne = new THREE.MeshStandardMaterial({color: 0xff00ff});
    const materialTwo = new THREE.MeshStandardMaterial({color: 0xffff00});

    trailOne = new THREE.Mesh(geometry, materialOne);
    trailTwo = new THREE.Mesh(geometry2, materialTwo);

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
    shaderMaterial.uniforms.time.value += 0.005;
    renderer.render(scene, camera);
    controls.update();
    shaderMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
}
animate();