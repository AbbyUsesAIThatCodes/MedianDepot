import * as THREE from 'three';

// Transparent light, not a solid selection base. Median arrows never change it.
export function createGlow(color, height = 3.8) {
  const material = new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 uvLight; void main(){ uvLight=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 tint; varying vec2 uvLight;
      void main(){ float side=pow(max(0.0,1.0-abs(uvLight.x*2.0-1.0)),1.8);
      float rise=pow(1.0-smoothstep(0.0,1.0,uvLight.y),2.2);
      gl_FragColor=vec4(tint,side*rise*0.42); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const light = new THREE.Group();
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(3.5, height), material);
  veil.position.set(0, height / 2, 0.1); veil.raycast = () => {}; light.add(veil);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.1), new THREE.ShaderMaterial({
    uniforms: { tint: material.uniforms.tint }, vertexShader: material.vertexShader,
    fragmentShader: 'uniform vec3 tint; varying vec2 uvLight; void main(){ float a=pow(max(0.0,1.0-length((uvLight-.5)*2.0)),2.0); gl_FragColor=vec4(tint,a*.55); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03; floor.raycast = () => {}; light.add(floor);
  light.userData.veil = veil; light.userData.material = material;
  return light;
}

export function createMedianArrow(top) {
  const arrow = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: '#ffe02f', emissive: '#b99000', emissiveIntensity: 0.3, roughness: 0.5 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 12), material); shaft.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.55, 4), material); head.rotation.z = Math.PI; head.position.y = 0.22;
  arrow.add(shaft, head); arrow.position.set(0, top + 0.32, 0.05);
  arrow.traverse(child => { if (child.isMesh) child.raycast = () => {}; }); arrow.visible = false;
  return arrow;
}
