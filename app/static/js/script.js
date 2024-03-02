const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#MyCanvas'),
});

renderer.setPixelRatio( window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 30;

const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
const material = new THREE.MeshStandardMaterial( { color: 0xb43f23 } );
const torusKnot = new THREE.Mesh( geometry, material );
scene.add( torusKnot );

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5,5,5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(lightHelper, gridHelper);
const cameraInitialPosition = new THREE.Vector3(0, 0, 30);
camera.position.copy(cameraInitialPosition);
const cameraMovementSpeed = 0.1;
const mouseSensitivity = 0.002;
let mousePosition = new THREE.Vector2();
let mousePreviousPosition = new THREE.Vector2();
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('keydown', onKeyDown);
function onMouseMove(event) {
    mousePosition.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
  
    if (mousePreviousPosition.distanceTo(mousePosition) > 0) {
      const delta = mousePosition.clone().sub(mousePreviousPosition);
      camera.rotation.y -= delta.x * mouseSensitivity;
      camera.rotation.x -= delta.y * mouseSensitivity;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
  
    mousePreviousPosition.copy(mousePosition);
  }
  
  function onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        camera.position.z -= cameraMovementSpeed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        camera.position.z += cameraMovementSpeed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        camera.position.x -= cameraMovementSpeed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        camera.position.x += cameraMovementSpeed;
        break;
    }
  }
  
function animate() {
    requestAnimationFrame(animate);

    // torusKnot.rotation.x += 0.01;
    // torusKnot.rotation.y += 0.005;
    // torusKnot.rotation.z += 0.01;

    renderer.render(scene, camera);

}
animate();
