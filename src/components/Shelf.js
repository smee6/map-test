import * as THREE from 'three';

export function createShelf(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const shelf = new THREE.Mesh(geometry, material);
    shelf.castShadow = true;
    shelf.receiveShadow = true;

    // 선반 외곽선을 위한 EdgesGeometry 사용
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const outline = new THREE.LineSegments(edges, lineMaterial);
    // outline은 raycast 대상에서 제외 (부모 선반만 드래그하도록)
    outline.raycast = () => { };
    shelf.add(outline);

    return shelf;
}
