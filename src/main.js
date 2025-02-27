import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";
import { StoreMap } from "./components/StoreMap.js";
import { createShelf } from "./components/Shelf.js";
import { createTile } from "./components/Tile.js";

let scene, camera, renderer, controls, dragControls;
let gridHelper;
let storeMap;
let gridSnap = true;
const gridSize = 1;
const draggableObjects = [];
let selectedObject = null; // 현재 선택된 객체 (Shelf 또는 Tile)
let instanceCounter = 0; // 객체 인스턴스 식별자

init();
animate();

function init() {
    // Scene 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera 생성
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);

    // Renderer 생성
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;

    // DragControls 설정 (draggableObjects 배열 내 객체만 드래그)
    dragControls = new DragControls(
        draggableObjects,
        camera,
        renderer.domElement
    );
    dragControls.addEventListener("dragstart", function () {
        controls.enabled = false;
    });
    dragControls.addEventListener("dragend", function () {
        controls.enabled = true;
    });
    dragControls.addEventListener("drag", function (event) {
        if (gridSnap) {
            event.object.position.x =
                Math.round(event.object.position.x / gridSize) * gridSize;
            event.object.position.z =
                Math.round(event.object.position.z / gridSize) * gridSize;
        }
        // 객체는 바닥과 맞닿도록 y 좌표 고정
        if (event.object.userData.height) {
            event.object.position.y = event.object.userData.height / 2;
        }
    });

    // 키보드 이벤트 (Space키로 Pan/Rotate 전환)
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // GridHelper 추가
    gridHelper = new THREE.GridHelper(350, 350);
    // GridHelper 렌더링 순서를 뒤로 변경 (매장 바닥과 겹치지 않도록)
    gridHelper.renderOrder = 1;

    scene.add(gridHelper);

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // UI 설정
    setupUI();

    // 객체 선택 이벤트
    renderer.domElement.addEventListener("click", onClickSelect);

    window.addEventListener("resize", onWindowResize, false);
}

// 신규 함수: 왼쪽 사이드바에서 해당 객체의 리스트 항목을 하이라이트
function highlightListItem(objectId) {
    console.log("highlightListItem 호출, id:", objectId);
    const li = document.getElementById(objectId);
    console.log("찾은 li:", li);
    if (li) {
        li.style.backgroundColor = "skyblue";
        li.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
            li.style.backgroundColor = "white";
        }, 1500);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupUI() {
    // 매장 영역 생성
    const storeBtn = document.getElementById("create-store");
    storeBtn.addEventListener("click", () => {
        const width = parseFloat(document.getElementById("store-width").value);
        const depth = parseFloat(document.getElementById("store-depth").value);
        if (storeMap) {
            scene.remove(storeMap.floor);
        }
        storeMap = new StoreMap(width, depth);
        scene.add(storeMap.floor);
    });

    // 선반 생성
    const addShelfBtn = document.getElementById("add-shelf");
    addShelfBtn.addEventListener("click", () => {
        const width = parseFloat(document.getElementById("shelf-width").value);
        const height = parseFloat(
            document.getElementById("shelf-height").value
        );
        const depth = parseFloat(document.getElementById("shelf-depth").value);
        const color = document.getElementById("shelf-color").value;
        const shelfMesh = createShelf(width, height, depth, color);
        shelfMesh.position.set(0, height / 2, 0);
        shelfMesh.userData.width = width;
        shelfMesh.userData.height = height;
        shelfMesh.userData.depth = depth;
        shelfMesh.userData.type = "Shelf";
        shelfMesh.userData.id = "obj_" + instanceCounter++;
        attachLabel(shelfMesh, shelfMesh.userData.type);
        scene.add(shelfMesh);
        draggableObjects.push(shelfMesh);
        updateObjectList();
    });

    // 타일 생성
    const addTileBtn = document.getElementById("add-tile");
    addTileBtn.addEventListener("click", () => {
        const width = parseFloat(document.getElementById("tile-width").value);
        const depth = parseFloat(document.getElementById("tile-depth").value);
        const color = document.getElementById("tile-color").value;
        const tileMesh = createTile(width, depth, color);
        tileMesh.position.set(0, 0.2 / 2, 0);
        tileMesh.userData.width = width;
        tileMesh.userData.height = 0.2;
        tileMesh.userData.depth = depth;
        tileMesh.userData.type = "Tile";
        tileMesh.userData.id = "obj_" + instanceCounter++;
        attachLabel(tileMesh, tileMesh.userData.type);
        scene.add(tileMesh);
        draggableObjects.push(tileMesh);
        updateObjectList();
    });

    // 선택 객체 삭제
    const deleteObjectBtn = document.getElementById("delete-object");
    deleteObjectBtn.addEventListener("click", () => {
        if (selectedObject) {
            scene.remove(selectedObject);
            const index = draggableObjects.indexOf(selectedObject);
            if (index > -1) {
                draggableObjects.splice(index, 1);
            }
            selectedObject = null;
            updateObjectList();
        } else {
            alert("삭제할 객체를 먼저 선택하세요.");
        }
    });

    // Grid Snap 토글
    const gridSnapToggle = document.getElementById("grid-snap-toggle");
    gridSnapToggle.addEventListener("change", (event) => {
        gridSnap = event.target.checked;
    });

    // 프로젝트 저장: 실제 파일로 저장 (JSON 다운로드)
    const saveProjectBtn = document.getElementById("save-project");
    saveProjectBtn.addEventListener("click", () => {
        const projectName = prompt("프로젝트 이름을 입력하세요:");
        if (projectName) {
            saveProject(projectName);
        }
    });

    // 프로젝트 불러오기: 숨겨진 파일 입력을 통해 불러오기
    const loadProjectBtn = document.getElementById("load-project");
    loadProjectBtn.addEventListener("click", () => {
        document.getElementById("project-file-input").click();
    });
    // 파일 선택 시 로드 처리
    document
        .getElementById("project-file-input")
        .addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                loadProjectFromFile(e.target.result);
            };
            reader.readAsText(file);
        });

    // Export Map 버튼 (수정 불가능한 HTML 파일로 export)
    const exportMapBtn = document.getElementById("export-map");
    exportMapBtn.addEventListener("click", exportMap);

    updateObjectList();
}

// attachLabel: 캔버스 텍스처로 텍스트를 그려 객체 윗면에 평면 메쉬로 부착 (raycast 제외)
function attachLabel(object, defaultName) {
    const shelfWidth = object.userData.width || 1;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = "48px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "black";
    context.fillText(defaultName, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeometry = new THREE.PlaneGeometry(shelfWidth, 0.5);
    const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    });
    const labelMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    labelMesh.raycast = () => {}; // 라벨은 raycast 대상에서 제외
    labelMesh.position.set(0, object.userData.height / 2 + 0.01, 0);
    labelMesh.rotation.x = -Math.PI / 2;

    object.userData.labelMesh = labelMesh;
    object.userData.labelCanvas = canvas;
    object.userData.labelContext = context;
    object.userData.labelTexture = texture;
    // 기본 라벨 텍스트 저장
    object.userData.label = defaultName;

    object.add(labelMesh);
}

// updateObjectProperties: 객체의 width, height, depth, 색상을 변경하고 외곽선 및 라벨을 갱신
function updateObjectProperties(
    object,
    newWidth,
    newHeight,
    newDepth,
    newColor
) {
    object.geometry.dispose();
    object.geometry = new THREE.BoxGeometry(newWidth, newHeight, newDepth);
    object.material.color.set(newColor);

    object.userData.width = newWidth;
    object.userData.height = newHeight;
    object.userData.depth = newDepth;

    // 기존 외곽선 제거 후 새로 생성
    object.children.forEach((child) => {
        if (child.isLineSegments) {
            object.remove(child);
        }
    });
    const edges = new THREE.EdgesGeometry(object.geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const outline = new THREE.LineSegments(edges, lineMaterial);
    outline.raycast = () => {};
    object.add(outline);

    // 라벨 업데이트
    if (object.userData.labelMesh) {
        object.userData.labelMesh.geometry.dispose();
        object.userData.labelMesh.geometry = new THREE.PlaneGeometry(
            newWidth,
            0.5
        );
        object.userData.labelMesh.position.set(0, newHeight / 2 + 0.01, 0);
    }
}

// updateObjectList: 왼쪽 사이드바의 객체 리스트를 갱신 (이름 수정, 라벨 토글, 수정 탭, 90도 회전 버튼 포함)
function updateObjectList() {
    const listContainer = document.getElementById("object-ul");
    listContainer.innerHTML = "";

    draggableObjects.forEach((obj) => {
        const li = document.createElement("li");
        li.id = obj.userData.id; // 리스트 항목에 고유 ID 할당
        li.style.marginBottom = "10px";
        li.style.borderBottom = "1px solid #ccc";
        li.style.paddingBottom = "5px";

        // ────────────── [수정사항: 리스트 항목 드래그로 순서 변경 가능하도록 기능 추가] ──────────────
        li.draggable = true;
        li.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", li.id);
            e.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });
        li.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            const draggedElem = document.getElementById(draggedId);
            if (draggedElem && draggedElem !== li) {
                listContainer.insertBefore(draggedElem, li);
                // 드롭된 후 리스트 순서에 맞게 draggableObjects 배열 재정렬
                const newOrder = [];
                listContainer.querySelectorAll("li").forEach((item) => {
                    const matchingObj = draggableObjects.find(
                        (o) => o.userData.id === item.id
                    );
                    if (matchingObj) newOrder.push(matchingObj);
                });
                draggableObjects.splice(
                    0,
                    draggableObjects.length,
                    ...newOrder
                );
            }
        });
        // ────────────────────────────────────────────────────────────────────────────────

        // 헤더: 타입, 이름 입력, 라벨 토글
        const headerDiv = document.createElement("div");
        headerDiv.style.display = "flex";
        headerDiv.style.alignItems = "center";

        const typeSpan = document.createElement("span");
        typeSpan.textContent = obj.userData.type + ": ";
        headerDiv.appendChild(typeSpan);

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = obj.userData.label || obj.userData.type;
        nameInput.style.flex = "1";
        nameInput.addEventListener("change", () => {
            const newName = nameInput.value;
            const canvas = obj.userData.labelCanvas;
            const context = obj.userData.labelContext;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.font = "48px sans-serif";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "black";
            context.fillText(newName, canvas.width / 2, canvas.height / 2);
            obj.userData.labelTexture.needsUpdate = true;
            // 기존 __currentText 업데이트 대신 별도 프로퍼티에 저장
            obj.userData.label = newName;
        });
        headerDiv.appendChild(nameInput);

        // 라벨 토글
        // const toggleLabel = document.createElement("input");
        // toggleLabel.type = "checkbox";
        // toggleLabel.style.marginLeft = "5px";
        // toggleLabel.checked = obj.userData.labelMesh.visible;
        // toggleLabel.addEventListener("change", () => {
        //     obj.userData.labelMesh.visible = toggleLabel.checked;
        // });
        // headerDiv.appendChild(toggleLabel);

        li.appendChild(headerDiv);

        // 90도 회전 버튼 추가 (Y축 기준 회전)
        const rotateButton = document.createElement("button");
        rotateButton.textContent = "90도 회전";
        rotateButton.style.marginTop = "5px";
        rotateButton.addEventListener("click", () => {
            obj.rotation.y += Math.PI / 2;
        });
        li.appendChild(rotateButton);

        // 수정 탭 토글 버튼
        const modToggleButton = document.createElement("button");
        modToggleButton.textContent = "수정";
        modToggleButton.style.marginTop = "5px";
        li.appendChild(modToggleButton);

        // 수정 탭 영역 (초기에는 감춤)
        const modPanel = document.createElement("div");
        modPanel.style.display = "none";
        modPanel.style.marginTop = "5px";

        // Width 입력
        const widthLabel = document.createElement("label");
        widthLabel.textContent = "Width:";
        modPanel.appendChild(widthLabel);
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.value = obj.userData.width;
        widthInput.style.width = "50px";
        modPanel.appendChild(widthInput);

        // Height 입력
        const heightLabel = document.createElement("label");
        heightLabel.textContent = " Height:";
        modPanel.appendChild(heightLabel);
        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.value = obj.userData.height;
        heightInput.style.width = "50px";
        modPanel.appendChild(heightInput);

        // Depth 입력
        const depthLabel = document.createElement("label");
        depthLabel.textContent = " Depth:";
        modPanel.appendChild(depthLabel);
        const depthInput = document.createElement("input");
        depthInput.type = "number";
        depthInput.value = obj.userData.depth || 2;
        depthInput.style.width = "50px";
        modPanel.appendChild(depthInput);

        // Color 입력
        const colorLabel = document.createElement("label");
        colorLabel.textContent = " Color:";
        modPanel.appendChild(colorLabel);
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = "#" + obj.material.color.getHexString();
        colorInput.style.width = "60px";
        modPanel.appendChild(colorInput);

        // 수정 적용 버튼
        const updateButton = document.createElement("button");
        updateButton.textContent = "적용";
        updateButton.style.display = "block";
        updateButton.style.marginTop = "5px";
        modPanel.appendChild(updateButton);

        updateButton.addEventListener("click", () => {
            const newWidth = parseFloat(widthInput.value);
            const newHeight = parseFloat(heightInput.value);
            const newDepth = parseFloat(depthInput.value);
            const newColor = colorInput.value;
            updateObjectProperties(
                obj,
                newWidth,
                newHeight,
                newDepth,
                newColor
            );
            updateObjectList();
        });

        li.appendChild(modPanel);

        modToggleButton.addEventListener("click", () => {
            modPanel.style.display =
                modPanel.style.display === "none" ? "block" : "none";
        });

        listContainer.appendChild(li);
    });
}

// 객체 선택 이벤트 핸들러
function onClickSelect(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(draggableObjects, true);
    if (intersects.length > 0) {
        let object = intersects[0].object;
        if (object.parent && draggableObjects.includes(object.parent)) {
            selectedObject = object.parent;
        } else {
            selectedObject = object;
        }
        console.log("객체 선택됨:", selectedObject);
        // 선택된 객체와 일치하는 리스트 항목을 하이라이트
        highlightListItem(selectedObject.userData.id);
    } else {
        selectedObject = null;
    }
}

// Space 키로 Pan/Rotate 전환
function onKeyDown(event) {
    if (event.code === "Space") {
        controls.enablePan = true;
        controls.enableRotate = false;
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    }
}

function onKeyUp(event) {
    if (event.code === "Space") {
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 프로젝트 저장 (실제 파일로 저장: JSON 파일 다운로드)
function saveProject(projectName) {
    const projectData = {};
    if (storeMap) {
        projectData.storeMap = {
            width: storeMap.width,
            depth: storeMap.depth,
        };
    }
    projectData.objects = draggableObjects.map((obj) => {
        return {
            type: obj.userData.type,
            id: obj.userData.id,
            width: obj.userData.width,
            height: obj.userData.height,
            depth: obj.userData.depth,
            color: obj.material.color.getHexString(),
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z,
            },
            rotation: {
                x: obj.rotation.x,
                y: obj.rotation.y,
                z: obj.rotation.z,
            },
            label: obj.userData.label || obj.userData.type,
        };
    });

    const jsonStr = JSON.stringify(projectData);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = projectName + ".json";
    a.click();
    URL.revokeObjectURL(url);
    alert("프로젝트 저장됨: " + projectName);
}

// 프로젝트 불러오기 (파일 내용으로부터 프로젝트 재구성)
function loadProjectFromFile(jsonStr) {
    const projectData = JSON.parse(jsonStr);
    // 기존 storeMap과 객체 제거
    if (storeMap) {
        scene.remove(storeMap.floor);
        storeMap = null;
    }
    draggableObjects.forEach((obj) => {
        scene.remove(obj);
    });
    draggableObjects.length = 0;
    // storeMap 복원
    if (projectData.storeMap) {
        storeMap = new StoreMap(
            projectData.storeMap.width,
            projectData.storeMap.depth
        );
        scene.add(storeMap.floor);
    }
    // 객체 복원
    projectData.objects.forEach((data) => {
        let obj;
        if (data.type === "Shelf") {
            obj = createShelf(
                data.width,
                data.height,
                data.depth,
                "#" + data.color
            );
        } else if (data.type === "Tile") {
            obj = createTile(data.width, data.depth, "#" + data.color);
        }
        if (obj) {
            obj.position.set(data.position.x, data.position.y, data.position.z);
            if (data.rotation) {
                obj.rotation.set(
                    data.rotation.x,
                    data.rotation.y,
                    data.rotation.z
                );
            }
            obj.userData.width = data.width;
            obj.userData.height = data.height;
            obj.userData.depth = data.depth;
            obj.userData.type = data.type;
            obj.userData.id = data.id;
            attachLabel(obj, data.label);
            scene.add(obj);
            draggableObjects.push(obj);
        }
    });
    updateObjectList();
    alert("프로젝트 불러옴.");
}

// Export Map: 수정 불가능한 HTML 파일로 export (객체에는 고유 식별자 포함)
function exportMap() {
    const projectData = {};
    if (storeMap) {
        projectData.storeMap = {
            width: storeMap.width,
            depth: storeMap.depth,
        };
    }
    projectData.objects = draggableObjects.map((obj) => {
        return {
            type: obj.userData.type,
            id: obj.userData.id,
            width: obj.userData.width,
            height: obj.userData.height,
            depth: obj.userData.depth,
            color: obj.material.color.getHexString(),
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z,
            },
            rotation: {
                x: obj.rotation.x,
                y: obj.rotation.y,
                z: obj.rotation.z,
            },
            label: obj.userData.label || obj.userData.type,
        };
    });
    const exportHTML = generateExportHTML(projectData);
    const blob = new Blob([exportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exported_map.html";
    a.click();
    URL.revokeObjectURL(url);
}

function generateExportHTML(projectData) {
    const sceneDataStr = JSON.stringify(projectData);
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Exported Map</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      font-family: Arial, sans-serif; 
    }
    #container { 
      width: 100vw; 
      height: 100vh; 
    }
    /* 사이드바 스타일 */
    #sidebar {
      position: absolute;
      top: 0;
      left: 0;
      width: 220px;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      border-right: 1px solid #ccc;
      overflow-y: auto;
      padding: 10px;
      box-sizing: border-box;
      transition: transform 0.3s ease;
      z-index: 5;
    }
    #sidebar.hidden {
      transform: translateX(-220px);
    }
    #toggle-sidebar {
      position: absolute;
      top: 10px;
      left: 230px;
      z-index: 1;
      padding: 5px 10px;
      background:rgb(64, 153, 217);
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #shelf-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #shelf-list li {
      padding: 5px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    #shelf-list li.highlight {
      background:rgb(244, 122, 122);
    }
  </style>
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.173.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/"
    }
  }
</script>
</head>
<body>
  <div id="sidebar">
    <h3>Shelf List</h3>
    <ul id="shelf-list"></ul>
  </div>
  <button id="toggle-sidebar">🔍</button>
  <div id="container"></div>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    const exportedData = ${sceneDataStr};

    let scene, camera, renderer, controls;
    init();
    animate();
    createShelfList();

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // 조명 추가
      const ambientLight = new THREE.AmbientLight(0x505050);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xf2f2f2, 0.8);
      dirLight.position.set(10, 30, 10);
      scene.add(dirLight);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(30, 30, 30);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('container').appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.minDistance = 10;
      controls.maxDistance = 100;

      // 매장 영역 재구성
      if (exportedData.storeMap) {
         const geometry = new THREE.PlaneGeometry(exportedData.storeMap.width, exportedData.storeMap.depth);
         const material = new THREE.MeshBasicMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
         const floor = new THREE.Mesh(geometry, material);
         floor.rotation.x = -Math.PI / 2;
         scene.add(floor);
      }

      // 객체 재구성 (외곽선 및 라벨 포함)
      exportedData.objects.forEach(data => {
         let obj;
         if (data.type === "Shelf" || data.type === "Tile") {
           obj = new THREE.Mesh(
             new THREE.BoxGeometry(data.width, data.height, data.depth),
             new THREE.MeshBasicMaterial({ color: "#" + data.color })
           );
         }
         if (obj) {
            obj.position.set(data.position.x, data.position.y, data.position.z);
            if (data.rotation) {
                obj.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            }
            // userData에 id와 type 저장 (목록 매칭용)
            obj.userData.id = data.id;
            obj.userData.type = data.type;
            obj.name = data.id;
            scene.add(obj);
            addOutline(obj);
            attachLabel(obj, data.label);
         }
      });

      window.addEventListener('resize', onWindowResize, false);
      //renderer.domElement.addEventListener('click', onSceneClick);
      document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    }

    // 외곽선을 추가하는 함수 (타일은 제외)
    function addOutline(object) {
      if (object.userData && object.userData.type === "Tile") return;
      const edges = new THREE.EdgesGeometry(object.geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const outline = new THREE.LineSegments(edges, lineMaterial);
      object.add(outline);
    }

    // 라벨 부착 함수 (캔버스 텍스처 사용)
    function attachLabel(object, text) {
      const width = object.geometry.parameters.width || 1;
      const height = object.geometry.parameters.height || 1;
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const planeGeometry = new THREE.PlaneGeometry(width, 0.5);
      const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const labelMesh = new THREE.Mesh(planeGeometry, planeMaterial);
      labelMesh.raycast = () => {}; // 라벨은 raycast 대상에서 제외
      labelMesh.position.set(0, height / 2 + 0.01, 0);
      labelMesh.rotation.x = -Math.PI / 2;
      object.add(labelMesh);
      // userData에 라벨 텍스트 저장 (이후 목록에 사용)
      object.userData.label = text;
    }

    function onWindowResize(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate(){
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // 사이드바의 Shelf 목록 생성
    function createShelfList() {
      const shelfListEl = document.getElementById('shelf-list');
      shelfListEl.innerHTML = "";
      exportedData.objects.forEach(data => {
        if (data.type === "Shelf") {
          const li = document.createElement('li');
          li.textContent = data.label || "Shelf";
          li.dataset.id = data.id;
          li.addEventListener('click', () => {
              const shelfObj = scene.getObjectByName(data.id);
              if (shelfObj) {
                  focusOnObject(shelfObj);
                  flashObject(shelfObj);
                  flashListItem(li);
              }
          });
          shelfListEl.appendChild(li);
        }
      });
    }

    // 씬 클릭 이벤트: Shelf 클릭 시 사이드 목록과 연동
    function onSceneClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
         let obj = intersects[0].object;
         while (obj && !obj.userData.id && obj.parent) {
            obj = obj.parent;
         }
         if (obj && obj.userData && obj.userData.type === "Shelf") {
            const listItem = document.querySelector(\`#shelf-list li[data-id="\${obj.userData.id}"]\`);
            if (listItem) {
                flashListItem(listItem);
            }
            focusOnObject(obj);
            flashObject(obj);
         }
      }
    }

    // 카메라를 해당 객체로 포커스
    function focusOnObject(obj) {
      controls.target.copy(obj.position);
      camera.position.set(obj.position.x, obj.position.y + 50, obj.position.z);
      controls.update();
    }


    function flashObject(obj) {
    // If there's an active timeout, clear it and restore original color first
    if (obj.userData.flashTimeout) {
        clearTimeout(obj.userData.flashTimeout);
        obj.material.color.set(obj.userData.originalColor);
    } else {
        // Store the original color in userData if not already set
        obj.userData.originalColor = obj.material.color.getHex();
    }
    // Highlight
    obj.material.color.set(0xf47a7a);
    
    // Set a new timeout
    obj.userData.flashTimeout = setTimeout(() => {
        obj.material.color.set(obj.userData.originalColor);
        delete obj.userData.flashTimeout;
    }, 1000);
    }

    function flashListItem(li) {
    // If there's an active timer, clear it first
    if (li.flashTimer) {
        clearTimeout(li.flashTimer);
        li.classList.remove("highlight");
    }
    li.classList.add("highlight");
    li.scrollIntoView({ behavior: "smooth", block: "center" });
    
    li.flashTimer = setTimeout(() => {
        li.classList.remove("highlight");
        li.flashTimer = null;
    }, 1000);
    }


    // 사이드바 토글
    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle("hidden");
    }
  </script>
</body>
</html>
`;
}

function onKeyDown(event) {
    if (event.code === "Space") {
        controls.enablePan = true;
        controls.enableRotate = false;
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    }
}

function onKeyUp(event) {
    if (event.code === "Space") {
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
