import * as THREE from 'three';

export class StoreMap {
    constructor(width, depth) {
        this.width = width;
        this.depth = depth;
        this.floor = this.createFloor();
    }

    createFloor() {
        // 매장 바닥 Plane 생성 (양면 렌더링)
        const geometry = new THREE.PlaneGeometry(this.width, this.depth);
        const material = new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        return floor;
    }
}
