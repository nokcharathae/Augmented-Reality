import * as THREE from '/node_modules/three/build/three.module.js';

// renderer
const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);

const camera=new THREE.PerspectiveCamera(45, render_w/render_h,1,1000);
camera.position.set(0,0,100);
camera.lookAt(0,0,0);
camera.up.set(0,1,0);
camera
// scene
const scene=new THREE.Scene();

const geometry = new THREE.BufferGeometry();
// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
const vertices = new Float32Array( [
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,

     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0, -1.0,  1.0
] );

// itemSize = 3 because there are 3 values (components) per vertex
geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const mesh = new THREE.Mesh( geometry, material );

console.log(mesh.geometry.attributes.position.getY(4));

scene.add(mesh);

animate();

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );

}