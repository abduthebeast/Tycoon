// ==== Basic Setup ====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ==== Lights ====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// ==== Ground ====
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ==== Player ====
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
scene.add(player);

// ==== Camera follows player ====
camera.position.set(0, 5, 10);

// ==== Movement ====
let keys = {};
document.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// ==== Money / Floors ====
let money = 0;
let floors = 1;
const floorHeight = 5;

// UI
const ui = document.createElement("div");
ui.style.position = "absolute";
ui.style.top = "10px";
ui.style.left = "10px";
ui.style.padding = "10px";
ui.style.background = "rgba(0,0,0,0.5)";
ui.style.color = "white";
ui.innerHTML = `💰 Money: ${money} <br> 🏢 Floors: ${floors}`;
document.body.appendChild(ui);

// ==== Buy Pad ====
const padGeo = new THREE.CircleGeometry(2, 32);
const padMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const buyPad = new THREE.Mesh(padGeo, padMat);
buyPad.rotation.x = -Math.PI / 2;
buyPad.position.set(5, 0.01, 5);
scene.add(buyPad);

let canBuy = true;

// ==== Animate Loop ====
function animate() {
  requestAnimationFrame(animate);

  // Player movement
  let speed = 0.1;
  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // Camera follows player
  camera.position.lerp(
    new THREE.Vector3(player.position.x, player.position.y + 5, player.position.z + 10),
    0.1
  );
  camera.lookAt(player.position);

  // Check buy pad
  const dist = player.position.distanceTo(buyPad.position);
  if (dist < 2.5 && canBuy && money >= 10) {
    canBuy = false;
    money -= 10;
    floors++;

    // Add a new floor
    const floorGeo = new THREE.BoxGeometry(20, 0.5, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const newFloor = new THREE.Mesh(floorGeo, floorMat);
    newFloor.position.set(0, floorHeight * (floors - 1), 0);
    scene.add(newFloor);

    // Update UI
    ui.innerHTML = `💰 Money: ${money} <br> 🏢 Floors: ${floors}`;

    // Move pad up
    buyPad.position.y = floorHeight * (floors - 1) + 0.01;

    setTimeout(() => (canBuy = true), 1000); // cooldown
  }

  // Render
  renderer.render(scene, camera);
}

animate();

// ==== Add Money Automatically ====
setInterval(() => {
  money++;
  ui.innerHTML = `💰 Money: ${money} <br> 🏢 Floors: ${floors}`;
}, 1000);
