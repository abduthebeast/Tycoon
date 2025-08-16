// =====================
// Basic Setup
// =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaadfff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =====================
// Lighting
// =====================
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(10, 20, 10);
scene.add(dir);

// =====================
// Player Setup
// =====================
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 1, 0);
scene.add(player);

// =====================
// Ground / Tycoon Base
// =====================
const groundGeo = new THREE.BoxGeometry(50, 1, 50);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228833 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.set(0, -0.5, 0);
scene.add(ground);

// Tycoon platform (floor 1)
const baseGeo = new THREE.BoxGeometry(20, 1, 20);
const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const base = new THREE.Mesh(baseGeo, baseMat);
base.position.set(0, 0, 0);
scene.add(base);

// =====================
// Controls
// =====================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let yaw = 0;
let pitch = 0;
let isMouseDown = false;
document.addEventListener("mousedown", () => isMouseDown = true);
document.addEventListener("mouseup", () => isMouseDown = false);
document.addEventListener("mousemove", e => {
    if (isMouseDown) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, pitch));
    }
});

// =====================
// Tycoon Game State
// =====================
let money = 0;
let droppers = [];
let buttons = [];
let floors = 1;

// UI
const moneyUI = document.createElement("div");
moneyUI.style.position = "absolute";
moneyUI.style.top = "10px";
moneyUI.style.left = "10px";
moneyUI.style.padding = "10px";
moneyUI.style.background = "rgba(0,0,0,0.5)";
moneyUI.style.color = "#fff";
moneyUI.style.fontSize = "20px";
moneyUI.innerText = "Money: $0";
document.body.appendChild(moneyUI);

// =====================
// Conveyor & Dropper System
// =====================
function createDropper(x, z) {
    const dropperGeo = new THREE.BoxGeometry(2, 2, 2);
    const dropperMat = new THREE.MeshStandardMaterial({ color: 0x4444ff });
    const dropper = new THREE.Mesh(dropperGeo, dropperMat);
    dropper.position.set(x, 1, z);
    scene.add(dropper);

    return {
        mesh: dropper,
        cooldown: 0
    };
}

let conveyorGeo = new THREE.BoxGeometry(8, 0.5, 2);
let conveyorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
let conveyor = new THREE.Mesh(conveyorGeo, conveyorMat);
conveyor.position.set(5, 0.25, 0);
scene.add(conveyor);

let cubes = [];

// =====================
// Buy Circle System
// =====================
function createBuyCircle(x, z, cost, type) {
    const circleGeo = new THREE.CylinderGeometry(1, 1, 0.2, 32);
    const circleMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, opacity: 0.7, transparent: true });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.position.set(x, 0.1, z);
    scene.add(circle);

    buttons.push({ mesh: circle, cost, type, bought: false });
}

// Example buttons
createBuyCircle(2, -2, 50, "dropper");
createBuyCircle(-2, -2, 200, "floor2");

// =====================
// Game Loop
// =====================
function animate() {
    requestAnimationFrame(animate);

    // Player movement
    let speed = 0.15;
    let dir = new THREE.Vector3();
    if (keys["w"]) dir.z -= 1;
    if (keys["s"]) dir.z += 1;
    if (keys["a"]) dir.x -= 1;
    if (keys["d"]) dir.x += 1;
    dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
    player.position.addScaledVector(dir, speed);

    // Camera follow
    let camOffset = new THREE.Vector3(0, 5, 10);
    camOffset.applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
    camera.position.copy(player.position).add(camOffset);
    camera.lookAt(player.position);

    // Droppers spawn cubes
    droppers.forEach(d => {
        d.cooldown -= 1;
        if (d.cooldown <= 0) {
            const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const cube = new THREE.Mesh(cubeGeo, cubeMat);
            cube.position.copy(d.mesh.position).add(new THREE.Vector3(0, -1, 0));
            scene.add(cube);
            cubes.push(cube);
            d.cooldown = 100; // spawn every ~2s
        }
    });

    // Move cubes on conveyor
    cubes.forEach((c, i) => {
        c.position.x += 0.05;
        if (c.position.x > conveyor.position.x + 4) {
            scene.remove(c);
            cubes.splice(i, 1);
            money += 10;
            moneyUI.innerText = "Money: $" + money;
        }
    });

    // Check buy circle collisions
    buttons.forEach(b => {
        if (!b.bought && player.position.distanceTo(b.mesh.position) < 2) {
            if (money >= b.cost) {
                money -= b.cost;
                b.bought = true;
                scene.remove(b.mesh);

                if (b.type === "dropper") {
                    droppers.push(createDropper(5, 0));
                } else if (b.type === "floor2") {
                    createSecondFloor();
                }
            }
        }
    });

    renderer.render(scene, camera);
}
animate();

// =====================
// Multi-Floor Unlock
// =====================
function createSecondFloor() {
    const floorGeo = new THREE.BoxGeometry(20, 1, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
    const floor2 = new THREE.Mesh(floorGeo, floorMat);
    floor2.position.set(0, 5, 0);
    scene.add(floor2);

    const stairsGeo = new THREE.BoxGeometry(2, 5, 4);
    const stairsMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const stairs = new THREE.Mesh(stairsGeo, stairsMat);
    stairs.position.set(-8, 2.5, 0);
    scene.add(stairs);

    createBuyCircle(2, -2, 500, "dropper2");
}
