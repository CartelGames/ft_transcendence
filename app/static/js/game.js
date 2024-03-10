const scene = new THREE.Scene();
const canvas = document.getElementById("game");
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
});

renderer.setPixelRatio(2);
renderer.setSize(canvas.width, canvas.height, false);
camera.position.z =30;

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

back.position.set(0,0,-10);
ball.position.set(0,0,4);
playerOne.position.set(-35, 0, 4);

playerTwo.position.set(35, 0, 4);


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

const canvasBounds = {
  left: -100,
  right: 100,
  bottom: -20,
  top: 20
};

// canvas.width
// canvas.height
let ballSpeed = 0.1;
let ballDirection = { x: 1, y: 1 };

const keyState = {};

  function onKeyDown(event) {
    keyState[event.keyCode] = true; 

  }

  function onKeyUp(event) {
    keyState[event.keyCode] = false; 
  }

  function update() {

    ball.position.x += ballSpeed * ballDirection.x;
    ball.position.y += ballSpeed * ballDirection.y;
    const ballX = (ball.position.x * camera.zoom) * Math.tan(camera.fov / 2) * camera.aspect;
    const ballY = (ball.position.y * camera.zoom) * Math.tan(camera.fov / 2);
    if (ball.position.x < canvasBounds.left || ball.position.x > canvasBounds.right) {
      ballDirection.x *= -1; // reverse the X direction of the ball
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
      //ballSpeed += 0.05;
    }
  
    // Check for playerTwo collision
    if (ball.position.x < playerTwo.position.x + 1 &&
        ball.position.x > playerTwo.position.x - 1 &&
        ball.position.y < playerTwo.position.y + boardHeight/2 &&
        ball.position.y > playerTwo.position.y - boardHeight/2 && ballDirection.x > 0) {
      ballDirection.x *= -1; // reverse the X direction of the ball
      //ballSpeed += 0.05;
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
  

//pour mettre une image en background (on rajoute le path dans le html)
// const imageUrl = document.getElementById('image-url').value;
// const backgroundTexture = new THREE.TextureLoader().load(imageUrl);
// scene.background = backgroundTexture;


//fonction pour refresh le render et faire bouger le big pink thingy
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}
animate();