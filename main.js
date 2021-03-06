import './style.css'

import * as THREE from 'three';


import {BoxLineGeometry} from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {XRControllerModelFactory} from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Object3D} from 'three/src/core/Object3D'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import { VRMLoader } from 'three/examples/jsm/loaders/VRMLoader.js';

import {InteractiveGroup} from 'three/examples/jsm/interactive/InteractiveGroup.js';
import {HTMLMesh} from 'three/examples/jsm/interactive/HTMLMesh.js';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min';

const clock = new THREE.Clock();

let container;
let camera, scene, raycaster, renderer;

let room;

let model;
let mixer;

let controller, controllerGrip;
let INTERSECTED;
const tempMatrix = new THREE.Matrix4();
let controls;
var helperObject = new Object3D()
var helperObjectModel = new Object3D()
var update_model = false;

let dynamicalyLoaded;

const parameters = {
    model: "Adriana",
    scale: 0.6,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0
};


init();
animate();

function init() {


    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);
    scene.add(camera);


    room = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
        new THREE.LineBasicMaterial({color: 0x808080})
    );
    scene.add(room);

    scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const loader2 = new GLTFLoader();

    loader2.load('betty.glb', function (gltf) {

        let model = gltf.scene;

        helperObjectModel.add(model)

        helperObjectModel.scale.set(1, 1, 1);
        helperObjectModel.translateX(3);

        helperObjectModel.rotateY(180);

        // helperObjectModel.translateY(1);

        scene.add(helperObjectModel);

        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });


        let skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);

        const animations = gltf.animations;

        mixer = new THREE.AnimationMixer(model);
        let idleAction = mixer.clipAction(animations[0]);

        idleAction.play();

    }, undefined, function (error) {

        console.error(error);

    });

    // model

    //const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

    // const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}));
    //
    // object.position.x = 0;
    // object.position.y = 2;
    // object.position.z = 0;
    //
    // object.scale.x = Math.random() + 0.5;
    // object.scale.y = Math.random() + 0.5;
    // object.scale.z = Math.random() + 0.5;
    //
    // scene.add(helperObject)
    // helperObject.add(object);

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);


    controls = new OrbitControls(camera, renderer.domElement);

    const geometry2 = new THREE.BufferGeometry();
    geometry2.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );

    //
    const controller1 = renderer.xr.getController( 0 );
    controller1.add( new THREE.Line( geometry2 ) );
    scene.add( controller1 );

    controller = controller1;

    const controller2 = renderer.xr.getController( 1 );
    controller2.add( new THREE.Line( geometry2 ) );
    scene.add( controller2 );

    function onChange() {
        update_model = true;
    }

    const gui = new GUI( { width: 300 } );
    const barDirection =
        gui.add(parameters,'model',
            {Adriana:'https://ipfs.io/ipfs/QmcmfjHuVia9s41UaXg7Kx1KG3qJ4kU9a74ckNq1T5FDxV',
                Adam: 'https://ipfs.io/ipfs/QmWyjegPNX5oYgvh2rTSCAPNddR69WPa4omg5oVLymsMBB',
                Sunshine: 'https://ipfs.io/ipfs/QmYn7fji6Ztn5RmMqMz1AZTHL6qP8Gm2oiGBMG8VNGXUfM',
                Cloud: 'https://ipfs.io/ipfs/QmebwZqpY6AR4Q2qjziLk2cpHeKFueue4S2tnkpo8hnrPH'})
            .name('Model')
            .listen()
    barDirection.onChange(
        function(newValue) {

            if(dynamicalyLoaded !== undefined)
                scene.remove(dynamicalyLoaded);

            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);


            dynamicalyLoaded = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}));;
            dynamicalyLoaded.position.x = 0;
            dynamicalyLoaded.position.y = 0.25;
            dynamicalyLoaded.position.z = 0;

            scene.add(dynamicalyLoaded);

            const loader3 = new VRMLoader();
            console.log(newValue);

            loader3.load( newValue, function ( vrm ) {

                // VRMLoader doesn't support VRM Unlit extension yet so
                // converting all materials to THREE.MeshBasicMaterial here as workaround so far.
                vrm.scene.traverse( function ( object ) {

                    if ( object.material ) {

                        if ( Array.isArray( object.material ) ) {

                            for ( let i = 0, il = object.material.length; i < il; i ++ ) {

                                const material = new THREE.MeshBasicMaterial();
                                THREE.Material.prototype.copy.call( material, object.material[ i ] );
                                material.color.copy( object.material[ i ].color );
                                material.map = object.material[ i ].map;
                                object.material[ i ] = material;

                            }

                        } else {

                            const material = new THREE.MeshBasicMaterial();
                            THREE.Material.prototype.copy.call( material, object.material );
                            material.color.copy( object.material.color );
                            material.map = object.material.map;
                            object.material = material;

                        }

                    }

                } );

                console.log(vrm.scene);

                if(dynamicalyLoaded !== undefined)
                    scene.remove(dynamicalyLoaded);

                dynamicalyLoaded = vrm.scene;

                dynamicalyLoaded.rotateY(Math.PI);

                dynamicalyLoaded.position.x = 0;
                dynamicalyLoaded.position.y = 0;
                dynamicalyLoaded.position.z = -1;

                dynamicalyLoaded.scale.set(0.8,0.8,0.8);



                scene.add( vrm.scene );

            } );

        });

    gui.add( parameters, 'scale', 0.0, 1.0, 0.1 ).onChange( onChange );
    gui.add( parameters, 'rotationX', 0.0, Math.PI * 2.0, Math.PI / 4.0 ).onChange( onChange );
    gui.add( parameters, 'rotationY', 0.0, Math.PI * 2.0, Math.PI / 4.0).onChange( onChange );
    gui.add( parameters, 'rotationZ', 0.0, Math.PI * 2.0,  Math.PI / 4.0).onChange( onChange );
    // gui.add( parameters, 'tube', 0.0, 1.0 ).onChange( onChange );
    // gui.add( parameters, 'tubularSegments', 10, 150, 1 ).onChange( onChange );
    // gui.add( parameters, 'radialSegments', 2, 20, 1 ).onChange( onChange );
    // gui.add( parameters, 'p', 1, 10, 1 ).onChange( onChange );
    // gui.add( parameters, 'q', 0, 10, 1 ).onChange( onChange );
    // gui.add( parameters, 'thickness', 0, 1 ).onChange( onThicknessChange );
    // gui.domElement.style.visibility = 'hidden';

    const group = new InteractiveGroup( renderer, camera );

    const mesh = new HTMLMesh( gui.domElement );
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.rotation.x = - Math.PI / 4;
    mesh.rotation.z = - Math.PI / 4;
    //mesh.scale.setScalar( 2 );
    group.add(mesh);

    //scene.add( group );

    const controllerModelFactory = new XRControllerModelFactory();

    const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    controllerGrip1.add( group );
    scene.add( controllerGrip1 );

    const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );

    window.addEventListener('resize', onWindowResize);

    document.body.appendChild(VRButton.createButton(renderer));


}

function buildController(data) {

    let geometry, material;

    console.log(geometry);

    switch (data.targetRayMode) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

            material = new THREE.LineBasicMaterial({vertexColors: true, blending: THREE.AdditiveBlending});

            return new THREE.Line(geometry, material);

        case 'gaze':

            geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
            material = new THREE.MeshBasicMaterial({opacity: 0.5, transparent: true});
            return new THREE.Mesh(geometry, material);

    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    renderer.setAnimationLoop(render);

}

function render() {

    const delta = clock.getDelta() * 60;

    // Update the mixer on each frame

    if (mixer) {
        mixer.update(delta / 60);
    }


    if(update_model) {
        update_model = false;

        helperObjectModel.scale.set(parameters.scale, parameters.scale, parameters.scale);
        helperObjectModel.rotation.setFromVector3(new THREE.Vector3( parameters.rotationX, parameters.rotationY, parameters.rotationX));
        // helperObjectModel.rotateX(parameters.rotationX);
        // helperObjectModel.rotateY(parameters.rotationY);
        // helperObjectModel.rotateZ(parameters.rotationZ);

    }

    // const cube = helperObject.children[0];
    //
    // const speed = 3;
    //
    // helperObject.position.copy(camera.position);
    // helperObject.rotation.copy(camera.rotation);
    // helperObject.updateMatrix();
    // helperObject.translateZ(-2);
    //
    // cube.position.x = Math.cos(speed * clock.getElapsedTime());
    // cube.position.y = Math.sin(speed * 2 * clock.getElapsedTime()) / 2;
    // cube.position.z = 0;
    //
    // cube.updateMatrix();

    //console.log(cube.position);

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects(room.children);

    renderer.render(scene, camera);

}
