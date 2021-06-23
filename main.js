import './style.css'

import * as THREE from 'three';


import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { MathUtils, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {Object3D} from 'three/src/core/Object3D'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const clock = new THREE.Clock();

let container;
let camera, scene, raycaster, renderer;

let room;

let controller, controllerGrip;
let INTERSECTED;
const tempMatrix = new THREE.Matrix4();
let controls;
var helperObject = new Object3D()

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
		new THREE.LineBasicMaterial({ color: 0x808080 })
	);
	scene.add(room);

	//scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

	const light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	const loader = new GLTFLoader();

	loader.load('banana.glb', function ( gltf ) {
		let banana = gltf.scene.children[0];
		let bananaSize = 0.1;
		banana.scale.set(bananaSize, bananaSize, bananaSize);
		banana.position.set(0,0,0);
		helperObject.children = [];
		helperObject.add(banana);

	}, undefined, function ( error ) {

		console.error( error );

	} );

	const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

	const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

	object.position.x = 0;
	object.position.y = 2;
	object.position.z = 0;

	object.scale.x = Math.random() + 0.5;
	object.scale.y = Math.random() + 0.5;
	object.scale.z = Math.random() + 0.5;

	scene.add(helperObject)
	helperObject.add(object);

	raycaster = new THREE.Raycaster();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.xr.enabled = true;
	container.appendChild(renderer.domElement);

	controls = new OrbitControls( camera, renderer.domElement );

	//

	function onSelectStart() {

		this.userData.isSelecting = true;

	}

	function onSelectEnd() {

		this.userData.isSelecting = false;

	}

	controller = renderer.xr.getController(0);
	controller.addEventListener('selectstart', onSelectStart);
	controller.addEventListener('selectend', onSelectEnd);
	controller.addEventListener('connected', function (event) {

		this.add(buildController(event.data));

	});
	controller.addEventListener('disconnected', function () {

		this.remove(this.children[0]);

	});
	scene.add(controller);

	const controllerModelFactory = new XRControllerModelFactory();

	controllerGrip = renderer.xr.getControllerGrip(0);
	controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
	scene.add(controllerGrip);

	window.addEventListener('resize', onWindowResize);

	//

	document.body.appendChild(VRButton.createButton(renderer));

	

}

function buildController(data) {

	let geometry, material;

	switch (data.targetRayMode) {

		case 'tracked-pointer':

			geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, - 1], 3));
			geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

			material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });

			return new THREE.Line(geometry, material);

		case 'gaze':

			geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, - 1);
			material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
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

	const cube = helperObject.children[0];

	const speed = 3;
	
	helperObject.position.copy( camera.position );
	helperObject.rotation.copy( camera.rotation );
	helperObject.updateMatrix();
	helperObject.translateZ( - 2 );

	cube.position.x = Math.cos(speed * clock.getElapsedTime());
	cube.position.y = Math.sin(speed * 2 * clock.getElapsedTime())/2;
	cube.position.z = 0;

	cube.updateMatrix();

	console.log(cube.position);

	tempMatrix.identity().extractRotation(controller.matrixWorld);

	raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
	raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

	const intersects = raycaster.intersectObjects(room.children);

	renderer.render(scene, camera);

}