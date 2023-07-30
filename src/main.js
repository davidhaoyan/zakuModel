import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import * as THREE from 'three';
import "./assets/main.css"
import {DirectionalLight, DirectionalLightHelper} from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader";
import {DRACOLoader} from "three/addons/loaders/DRACOLoader";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import Stats from "stats.js"

function main() {
    // Get a reference to the container element
    const container = document.querySelector("#scene-container");

    // Create an instance of the World app
    //const world = new World(container);

    // Start the loop (produce a stream of frames)
    //world.start();

    //Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2C2F3B")

    //Camera
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(1,0.25,0.75)

    //Renderer
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //FPS
    const stats = new Stats()
    stats.showPanel(0)
    document.body.appendChild( stats.dom )


    //Resizer
    window.addEventListener('resize', () => {
        // Set the size again if a resize occurs.
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        // Perform any custom actions.
        this.onResize();
    });

    //Orbit
    const controls = new OrbitControls( camera, renderer.domElement );

    //Background
    const rows = 200

    //Creates grid, direction 0 = y axis, direction 1 = x axis
    function createGrid(number, direction) {
        for (let n = 0; n < number; n++) {
            let color;
            if (n == number / 2) {
                if (direction == 1) {
                    color = "#a14842"
                }
                else {
                    color = "#4ba142"
                }

            } else {
                color = "#545454"
            }
            const geometry = new THREE.CylinderGeometry(0.001, 0.001, 20, 8)
            const material = new THREE.MeshBasicMaterial({color: color})
            const mesh = new THREE.Mesh(geometry, material)
            if (direction == 0) {
                mesh.rotation.x = Math.PI / 2;
                mesh.position.x = -10 + n / 10
                mesh.position.y = -0.45
            } else {
                mesh.rotation.z = Math.PI / 2;
                mesh.position.z = -10 + n / 10
                mesh.position.y = -0.45
            }
            scene.add(mesh)
        }
    }
    createGrid(200,0)
    createGrid(200, 1)

    //GLTF
    const loadingBar = document.getElementById("loading")
    const progressBar = document.getElementById("progress")
    const loadingManager = new THREE.LoadingManager()
    loadingManager.onProgress = function ( url, loaded, total ) {
        const progressPercentage = Math.trunc(loaded / total * 100)
        progressBar.innerHTML = progressPercentage.toString() + "%"
    }
    loadingManager.onLoad = function ( ) {
        console.log( 'Loading complete!');
        loadingBar.style.display = "none"
        progressBar.style.display = "none"
    };

    // Instantiate a loader
    const loader = new GLTFLoader(loadingManager);
    const draco = new DRACOLoader();
    draco.setDecoderConfig({ type: 'js' });
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(draco)

// Load a glTF resource
    let mixer;
    loader.load(
        // resource URL
        '/zakuNoFlame.glb',
        // called when the resource is loaded
        function ( gltf ) {

            scene.add( gltf.scene );
            gltf.scene.position.z = -0.15

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            var mroot = gltf.scene;
            var bbox = new THREE.Box3().setFromObject(mroot);
            var cent = bbox.getCenter(new THREE.Vector3());
            var size = bbox.getSize(new THREE.Vector3());

            //Rescale the object to normalized space
            var maxAxis = Math.max(size.x, size.y, size.z);
            mroot.scale.multiplyScalar(1.0 / maxAxis);
            bbox.setFromObject(mroot);
            bbox.getCenter(cent);
            bbox.getSize(size);
            //Reposition to 0,halfY,0
            mroot.position.copy(cent).multiplyScalar(-1);

            mixer = new THREE.AnimationMixer( gltf.scene )
            const action = mixer.clipAction( gltf.animations[0] )
            action.play()
        },
        // called while loading is progressing
        function ( xhr ) {
            const progressPercentage = xhr.loaded / xhr.total * 100

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );

    const clock = new THREE.Clock()
    function animate() {
        requestAnimationFrame( animate );
        stats.begin()
        controls.update();
        if (mixer) {
            mixer.update(clock.getDelta())
        }
        renderer.render( scene, camera );
        stats.end()
    }
    animate();
}

main();

createApp(App).use(router).mount("#app");