import * as THREE from 'three';

export function createTile(width, depth, color) {
    const height = 0.2; // 타일 두께
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const tile = new THREE.Mesh(geometry, material);
    tile.castShadow = true;
    tile.receiveShadow = true;

    // // 외곽선 추가
    // const edges = new THREE.EdgesGeometry(geometry);
    // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    // const outline = new THREE.LineSegments(edges, lineMaterial);
    // outline.raycast = () => { }; // outline은 raycast에서 제외
    // tile.add(outline);

    return tile;
}
