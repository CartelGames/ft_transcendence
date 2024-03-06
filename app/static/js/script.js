// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({
//     canvas: document.querySelector('#MyCanvas'),
// });
// const canvas = document.getElementById("MyCanvas");
// renderer.setPixelRatio( window.devicePixelRatio);
// renderer.setSize(canvas.width, canvas.height, false);
// camera.position.z = 30;

// //the big pink floating thingy
// const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
// const material = new THREE.MeshStandardMaterial( { color: 0xFF0099 } );
// const torusKnot = new THREE.Mesh( geometry, material );
// scene.add( torusKnot );

// //on met de la lumiere
// const pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(5,5,5);
// const ambientLight = new THREE.AmbientLight(0xffffff);
// scene.add(pointLight, ambientLight);
// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// //scene.add(lightHelper, gridHelper); //pour voir les lumieres et le grid

// //Pour pouvoir bouger la cam avec les keys ou la souris (la souris c'est pour un effet cool)
// const cameraInitialPosition = new THREE.Vector3(0, 0, 30);
// camera.position.copy(cameraInitialPosition);
// const cameraMovementSpeed = 0.1;
// const mouseSensitivity = 0.002;
// let mousePosition = new THREE.Vector2();
// let mousePreviousPosition = new THREE.Vector2();
// document.addEventListener('mousemove', onMouseMove);
// document.addEventListener('keydown', onKeyDown);
// function onMouseMove(event) {
//     mousePosition.set(
//       (event.clientX / window.innerWidth) * 2 - 1,
//       -(event.clientY / window.innerHeight) * 2 + 1
//     );
  
//     if (mousePreviousPosition.distanceTo(mousePosition) > 0) {
//       const delta = mousePosition.clone().sub(mousePreviousPosition);
//       camera.rotation.y -= delta.x * mouseSensitivity;
//       camera.rotation.x -= delta.y * mouseSensitivity;
//       camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
//     }
  
//     mousePreviousPosition.copy(mousePosition);
//   }
  
//   function onKeyDown(event) {
//     switch (event.code) {
//       case 'KeyW':
//       case 'ArrowUp':
//         camera.position.z -= cameraMovementSpeed;
//         break;
//       case 'KeyS':
//       case 'ArrowDown':
//         camera.position.z += cameraMovementSpeed;
//         break;
//       case 'KeyA':
//       case 'ArrowLeft':
//         camera.position.x -= cameraMovementSpeed;
//         break;
//       case 'KeyD':
//       case 'ArrowRight':
//         camera.position.x += cameraMovementSpeed;
//         break;
//     }
//   }


// //on rajoute les ptites etoiles blanches
// function addStar(){
//     const geometry = new THREE.SphereGeometry(0.25, 24, 24);
//     const material = new THREE.MeshStandardMaterial({color: 0xffffff});
//     const star = new THREE.Mesh(geometry, material);
//     const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
//     star.position.set(x,y,z);
//     scene.add(star);
// }
// Array(200).fill().forEach(addStar);

// //pour mettre une image en background (on rajoute le path dans le html)
// const imageUrl = document.getElementById('image-url').value;
// const backgroundTexture = new THREE.TextureLoader().load(imageUrl);
// scene.background = backgroundTexture;


// window.onresize = function () {

//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();

//     renderer.setSize( window.innerWidth, window.innerHeight );

// };
// //pour l'effet quand on scroll
// function moveCamera() {
//     const t = document.body.getBoundingClientRect().top;
  
//     camera.position.z = t * -0.01;
//     camera.position.x = t * -0.0002;
//     camera.rotation.y = t * -0.0002;
//   }
  
//   document.body.onscroll = moveCamera;
//   moveCamera();


// //fonction pour refresh le render et faire bouger le big pink thingy
// function animate() {
//     requestAnimationFrame(animate);

//     torusKnot.rotation.x += 0.005;
//     torusKnot.rotation.y += 0.0005;
//     torusKnot.rotation.z += 0.005;

//     renderer.render(scene, camera);

// }
// animate();
var upHist = false;

function showDiv(divId) {
    var divs = document.querySelectorAll('.block');
    divs.forEach(function (div) {
        div.style.display = 'none';
    });

    var selectedDiv = document.getElementById(divId);
    if (selectedDiv) {
        selectedDiv.style.display = 'block';

        if (!upHist) {
			var stateObj = { divId: divId };
			var url = window.location.href.split('#')[0] + '#' + divId;
			history.pushState(stateObj, null, url);
            checkURL();
		}
		else
			upHist = false;
    }
}

function sendForm(id, event) {
    var form = document.getElementById(id);
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var errorForm = form.querySelector('.error-form');
            if (response.success) {
                if (errorForm)
                    errorForm.innerHTML = response.errors;
                if (response.goto) {
                    setTimeout(function () {
                        window.location.href = response.goto;
                        location.reload(true);
                        if (errorForm)
                            errorForm.innerHTML = "";
                    }, 2000);
                }
                else if (window.location.hash === "#profil")
                    loadProfileData();
            } else {
                if (errorForm)
                    errorForm.innerHTML = response.errors;
            }
        }
    };
    xhr.send(formData);
    event.preventDefault();
}

function loadProfileData() {
    $.ajax({
        type: 'GET',
        data: { data: 'profil' },
        success: function (data) {
            $('#username').text('Username: ' + data.username);
            $('#email').text('Email: ' + data.email);
            $('#img').attr('src', data.img);
            console.log('User: ' + data.username + ' Email: ' + data.email + ' IMG: ' + data.img);
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des données du profil.');
        }
    });
}

function checkURL() {
    if (window.location.hash === "#profil")
        loadProfileData();
}

window.addEventListener('hashchange', function () {
	var divId = location.hash.slice(1) || 'index';
	upHist = true;
	console.log("Call hashchange : " + divId);
    showDiv(divId);
});

document.addEventListener('DOMContentLoaded', function () {
    var defaultDivId = location.hash.slice(1) || 'index';
	console.log("First call : " + defaultDivId);
    showDiv(defaultDivId);
});

document.getElementById('profil-img').addEventListener('change', function (event) {
    sendForm('profilImg', event)
});
