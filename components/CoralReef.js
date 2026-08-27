import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const coralColors = [
  0x0b6b4c, 0x1f8a4d, 0xd45063, 0x915c83, 0x4842b8, 0xccaf83, 0xe07a5f, 0x3d405b, 0x81b29a, 0xf2cc8f
];

export async function addCoralReef(scene, parentGroup) {
  const loader = new GLTFLoader();
  const models = [];
  
  // Load the 7 coral GLBs
  for (let i = 0; i < 7; i++) {
    try {
      const gltf = await loader.loadAsync(`/models/coral/Coral${i}.glb`);
      let mesh = null;
      gltf.scene.traverse((child) => {
        if (child.isMesh && !mesh) {
          mesh = child;
        }
      });
      if (mesh) {
        models.push(mesh.geometry);
      }
    } catch (e) {
      console.warn(`Failed to load Coral${i}.glb`, e);
    }
  }

  if (models.length === 0) return;

  const totalCorals = 50;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  
  models.forEach((geometry) => {
    const coralCount = Math.floor(totalCorals / models.length);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, coralCount);
    
    for (let i = 0; i < coralCount; i++) {
      let x = (Math.random() - 0.5) * 160; 
      let z = (Math.random() - 0.5) * 80 - 10;
      
      // Keep away from the central path
      if (Math.abs(x) < 25 && z > -15) {
        x += (x > 0 ? 25 : -25);
      }

      let y = -40 + Math.random() * 8;
      // Make corals climb slightly on the sides and back
      if (Math.abs(x) > 40) y += 8 + Math.random() * 10;
      if (z < -15) y += 5 + Math.random() * 8;

      const scl = 0.15 + Math.random() * 0.25;
      dummy.position.set(x, y, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.4
      );
      dummy.scale.set(scl, scl, scl);
      dummy.updateMatrix();
      
      instancedMesh.setMatrixAt(i, dummy.matrix);
      
      const col = coralColors[Math.floor(Math.random() * coralColors.length)];
      color.setHex(col);
      instancedMesh.setColorAt(i, color);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;
    parentGroup.add(instancedMesh);
  });
}
