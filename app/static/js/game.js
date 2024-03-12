import { FontLoader, TextGeometry} from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
// import { OrbitControls } from '/three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from '/three/addons/loaders/GLTFLoader.js';
// import { EffectComposer } from '/three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from '/three/addons/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from '/three/addons/postprocessing/UnrealBloomPass.js';
// import { OutputPass } from '/three/addons/postprocessing/OutputPass.js';
// import Stats from '/three/addons/libs/stats.module.js';

const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});
const camHelper = new THREE.CameraHelper( camera );
scene.add(camHelper);
camHelper.update();
camera.position.z =30;


// const lineSegment = camHelper.children[0]; // get the first LineSegment object in the helper
// console.log("linesegmentstart", lineSegment.start);
// const size = lineSegment.start.distanceTo(lineSegment.end);
// console.log('Size of LineSegment:', size);

const mConvert = 0.0002645833;
renderer.setPixelRatio(canvas.width/canvas.height);
renderer.setSize(canvas.width, canvas.height, false);


//the big pink floating thingy
let boardHeight = 10;
const geometry = new THREE.BoxGeometry( 1, boardHeight, 1 );
const background = new THREE.PlaneGeometry(200, 200);
const backgroundMaterial = new THREE.MeshStandardMaterial( {color: 0xffffff, side: THREE.DoubleSide});
const back = new THREE.Mesh(background, backgroundMaterial);
const ballHelp = new THREE.SphereGeometry(1, 32, 16);
const material = new THREE.MeshStandardMaterial( {color: 0x0000ff} ); 
const playerOne = new THREE.Mesh( geometry, material ); 
const playerTwo = new THREE.Mesh( geometry, material );
const ball = new THREE.Mesh( ballHelp, material);
scene.add( playerOne , playerTwo, ball, back);
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

let score = new Array(2);
score[0]=0;
score[1]=0;

//on met de la lumiere
const pointLight = new THREE.PointLight(0xff00ff);
pointLight.position.set(50,0,20);
const ambientLight = new THREE.AmbientLight();
scene.add(pointLight);

// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
//scene.add(lightHelper, gridHelper); //pour voir les lumieres et le grid

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp)



console.log(canvasBounds.left, canvasBounds.right, canvasBounds.top, canvasBounds.bottom);
// canvas.width
// canvas.height
let ballSpeed = 0.2;
let ballDirection = { x: 1, y: 1 };

const keyState = {};

  function onKeyDown(event) {
    keyState[event.keyCode] = true; 

  }

  function onKeyUp(event) {
    keyState[event.keyCode] = false; 
  }

  scoring();
  function update() {

    ball.position.x += ballSpeed * ballDirection.x;
    ball.position.y += ballSpeed * ballDirection.y;
    const ballX = (ball.position.x * camera.zoom) * Math.tan(camera.fov / 2) * camera.aspect;
    const ballY = (ball.position.y * camera.zoom) * Math.tan(camera.fov / 2);
    if (ball.position.x < canvasBounds.left){
      ballSpeed = 0.2;
      ball.position.set(0,0,0);
      ballDirection = {x: -1, y: 1}
      score[0]++;
      scoring();
      console.log(score[0]);
    }
    if (ball.position.x > canvasBounds.right) {
      ballSpeed = 0.2;
      ball.position.set(0,0,0);
      score[1]++; // reverse the X direction of the ball
      scoring();
      console.log(score[1]);
    }
  
    // Check for bottom and top boundary collisions
    if (ball.position.y  < canvasBounds.bottom || ball.position.y  > canvasBounds.top) {
      ballDirection.y *= -1; // reverse the Y direction of the ball
    }
  
    // Check for playerOne collision
    if (ball.position.x < playerOne.position.x + 1 &&
        ball.position.x > playerOne.position.x - 1 &&
        ball.position.y < playerOne.position.y + boardHeight/2 &&
        ball.position.y > playerOne.position.y - boardHeight/2 && ballDirection.x < 0) {
      ballDirection.x *= -1; // reverse the X direction of the ball
      ballSpeed *= 1.1;
    }
  
    // Check for playerTwo collision
    if (ball.position.x < playerTwo.position.x + 1 &&
        ball.position.x > playerTwo.position.x - 1 &&
        ball.position.y < playerTwo.position.y + boardHeight/2 &&
        ball.position.y > playerTwo.position.y - boardHeight/2 && ballDirection.x > 0) {
      ballDirection.x *= -1; // reverse the X direction of the ball
      ballSpeed *= 1.1;
    }


    if (playerOne.position.y + boardHeight /2 > canvasBounds.top) {
      playerOne.position.y = canvasBounds.top - boardHeight/2;
    }
    // Check for right boundary collision
    if (playerOne.position.y - boardHeight/2 < canvasBounds.bottom) {
      playerOne.position.y = canvasBounds.bottom + boardHeight/2;
    }
    if (playerTwo.position.y + boardHeight/2 > canvasBounds.top) {
      playerTwo.position.y = canvasBounds.top - boardHeight/2;
    }
  
    // Check for right boundary collision
    if (playerTwo.position.y - boardHeight/2 < canvasBounds.bottom) {
      playerTwo.position.y = canvasBounds.bottom + boardHeight/2;
    }
  
    // if (keyState[37]){
    //   boardHeight += 0.1;
    //   playerOne.scale.y = boardHeight /5;
    //   playerTwo.scale.y = boardHeight/5;
    // }
    // if (keyState[39])
    // {
    //   boardHeight -= 0.1;
    //   playerOne.scale.y = boardHeight /5;
    //   playerTwo.scale.y = boardHeight/5;
    // }
    pointLight.position.set(ball.position.x,ball.position.y,10);
    if (keyState[87])
      movePong(playerOne, playerOne.position.y + 4);
    if (keyState[83])
      movePong(playerOne, playerOne.position.y - 4);
    if (keyState[38])
      movePong(playerTwo, playerTwo.position.y + 4);
    if (keyState[40])
      movePong(playerTwo, playerTwo.position.y - 4);
      
  }

  function movePong(mesh, targetY) {
    gsap.to(mesh.position, {
      duration: 1, // duration of the animation in seconds
      ease: "power2.out", // easing function to use
      y: targetY, // target y-axis position
    });
  }

  function scoring(){
    const loader = new FontLoader();
        let font_src = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json';
        loader.load( font_src, function ( font ) {
        
          const geometry = new TextGeometry( score[0].toString(), {
            font: font,
            size: 1,
            height: 0,
          } );
          const geometry2 = new TextGeometry( score[1].toString(), {
            font: font,
            size: 1,
            height: 0,
          } );
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(geometry, textMaterial);
        textMesh.position.set(-10, 10, 0);
        const textMesh2 = new THREE.Mesh(geometry2, textMaterial);
        textMesh2.position.set(10, 10, 0);
        scene.remove(textMesh, textMesh2);
        scene.add(textMesh, textMesh2);
        } );
    }
//pour mettre une image en background (on rajoute le path dans le html)
// const imageUrl = document.getElementById('image-url').value;
// const backgroundTexture = new THREE.TextureLoader().load(imageUrl);
// scene.background = backgroundTexture;

//fonction pour refresh le render et faire bouger le big pink thingy
function animate() {
    requestAnimationFrame(animate);
    //console.log("sphere", ball.intersectsObject());
    update();
    renderer.render(scene, camera);
}
animate();