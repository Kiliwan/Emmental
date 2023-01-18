import {createREGL} from "../lib/regljs_2.1.0/regl.module.js"
import {vec2, vec3, vec4, mat2, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"

import {DOM_loaded_promise, load_text, register_button_with_hotkey, register_keyboard_action} from "./icg_web.js"
import {deg_to_rad, mat4_matmul_many} from "./icg_math.js"

import {init_noise} from "./noise.js"
import {init_terrain} from "./terrain.js"

import {emmental_length,emmental_width,emmental_height,emmental_change,emmental_ZOOM_MIN,emmental_ZOOM_MAX,emmental_ZOOM_FACTOR,emmental_mouserateX,emmental_mouserateY,emmental_moverate} from "./constants.js"


async function main() {

	const debug_overlay = document.getElementById('debug-overlay')

	// We are using the REGL library to work with webGL
	// http://regl.party/api
	// https://github.com/regl-project/regl/blob/master/API.md

	const regl = createREGL({ // the canvas to use
		profile: true, // if we want to measure the size of buffers/textures in memory
		extensions: ['oes_texture_float','OES_element_index_uint'], // enable float textures, use unsigned indexes for elements
	})

	// The <canvas> (HTML element for drawing graphics) was created by REGL, lets take a handle to it.
	const canvas_elem = document.getElementsByTagName('canvas')[0]

	let update_needed = true

	{
		// Resize canvas to fit the window, but keep it square.
		function resize_canvas() {
			canvas_elem.width = window.innerWidth
			canvas_elem.height = window.innerHeight

			update_needed = true
		}
		resize_canvas()
		window.addEventListener('resize', resize_canvas)
	}

	/*---------------------------------------------------------------
		Resource loading
	---------------------------------------------------------------*/

	// Start downloads in parallel
	const resources = {};

	[
		"noise.frag.glsl",
		"display.vert.glsl",

		"terrain.vert.glsl",
		"terrain.frag.glsl",

		"buffer_to_screen.vert.glsl",
		"buffer_to_screen.frag.glsl",

	].forEach((shader_filename) => {
		resources[`shaders/${shader_filename}`] = load_text(`./src/shaders/${shader_filename}`)
	});

	// Wait for all downloads to complete
	for (const key of Object.keys(resources)) {
		resources[key] = await resources[key]
	}


	/*---------------------------------------------------------------
		Camera
	---------------------------------------------------------------*/
	const mat_world_to_cam = mat4.create()
	const cam_distance_base = 2.

	let cam_angle_z = -0.5 // in radians!
	let cam_angle_y = -0.42 // in radians!
	let cam_distance_factor = 1.
	let target_point = [0,0,0]
	let cam_target = [0, 0, 0]

	let world_movement = [0, 0, 0]

	function update_cam_transform() {

		let mat_eyeTransform = mat4.create();
		let world_translate = mat4.fromTranslation(mat4.create(),world_movement)
		let mat_translate = mat4.fromTranslation(mat4.create(),[cam_distance_base*cam_distance_factor,0.,0.]);
		let mat_rotationX = mat4.fromYRotation(mat4.create(),cam_angle_y);
		let mat_rotationZ = mat4.fromZRotation(mat4.create(),Math.PI - cam_angle_z);
		let cam_translate = mat4.fromTranslation(mat4.create(),cam_target);
		mat4_matmul_many(mat_eyeTransform,mat_rotationZ,mat_rotationX,mat_translate,cam_translate);

		let eye_position = vec3.transformMat4(vec4.create(),[0.,0.,0.],mat_eyeTransform);

		const look_at = mat4.lookAt(mat4.create(), 
			eye_position, // camera position in world coord
			target_point,
			[0, 0, 1], // up vector
		);
		// Store the combined transform in mat_world_to_cam
		mat4_matmul_many(mat_world_to_cam,world_translate,look_at);
	}

	update_cam_transform()

	// Prevent clicking and dragging from selecting the GUI text.
	canvas_elem.addEventListener('mousedown', (event) => { event.preventDefault() })

	// Rotate camera position by dragging with the mouse
	window.addEventListener('mousemove', (event) => {
		// if left or middle button is pressed
		if (event.buttons & 1 || event.buttons & 4) {
			if (event.shiftKey) {
				const r = mat2.fromRotation(mat2.create(), -cam_angle_z)
				const offset = vec2.transformMat2([0, 0], [event.movementY, event.movementX], r)
				vec2.scale(offset, offset, 0.1)
				target_point[0] += offset[0]*(-1.)
				target_point[1] += offset[1]

			} else {
				cam_angle_z += event.movementX*emmental_mouserateX
				cam_angle_y += -event.movementY*emmental_mouserateY
			}
			update_cam_transform()
			update_needed = true
		}
	})

	window.addEventListener('wheel', (event) => {
		// scroll wheel to zoom in or out
		const factor_mul_base = emmental_ZOOM_FACTOR
		const factor_mul = (event.deltaY > 0) ? factor_mul_base : 1./factor_mul_base
		cam_distance_factor *= factor_mul
		cam_distance_factor = Math.max(emmental_ZOOM_MIN, Math.min(cam_distance_factor, emmental_ZOOM_MAX))
		// console.log('wheel', event.deltaY, event.deltaMode)
		event.preventDefault() // don't scroll the page too...
		update_cam_transform()
		update_needed = true
	})

	window.addEventListener('keydown', (event) => {
		switch(event.code) {
			case "KeyA":
				world_movement[0]+=emmental_moverate
				break
			case "KeyD":
				world_movement[0]-=emmental_moverate
				break
			case "KeyW":
				world_movement[1]-=emmental_moverate
				break
			case "KeyS":
				world_movement[1]+=emmental_moverate
				break;
			case "KeyQ":
				world_movement[2]+=emmental_moverate
				break
			case "KeyE":
				world_movement[2]-=emmental_moverate
				break;
		}

		update_cam_transform()
		update_needed = true
	})

	/*---------------------------------------------------------------
		Terrain
	---------------------------------------------------------------*/

	let noise_textures = init_noise(regl, resources)

	let texture_fbm = (() => {
		for(const t of noise_textures) {
			if(t.name === 'emmental_terrain') {
				return t
			}
		}
	})()

	//mouse offset changes noise patterns
	texture_fbm.draw_texture_to_buffer({width: emmental_length*emmental_width, height: emmental_height, mouse_offset: [emmental_change, 5.]})

	let terrain_actor = init_terrain(regl, resources, texture_fbm.get_buffer())

	let recompute_button = document.getElementById("recompute")

	recompute_button.onclick = function() {
	
		//mouse offset changes noise patterns
		texture_fbm.draw_texture_to_buffer({width: emmental_length*emmental_width, height: emmental_height, mouse_offset: [emmental_change, 5.]})
	
		terrain_actor = init_terrain(regl, resources, texture_fbm.get_buffer())

		update_cam_transform()
		update_needed = true
	}
	  
	/*
		UI
	*/
	register_keyboard_action('z', () => {
		debug_overlay.classList.toggle('hide')
	})


	function activate_preset_view() {
		cam_angle_z = -0.5
		cam_angle_y = 0.5
		cam_distance_factor = 5.0
		cam_target = [0, 0, 0]
		target_point = [0, 0, 0]
		world_movement = [0, 0, 0]
		
		update_cam_transform()
		update_needed = true
	}
	activate_preset_view()
	register_button_with_hotkey('btn-preset-view', 'c', activate_preset_view)

	/*---------------------------------------------------------------
		Frame render
	---------------------------------------------------------------*/
	const mat_projection = mat4.create()
	const mat_view = mat4.create()

	let light_position_world = [0.2, -0.3, 0.8, 1.0]

	const light_position_cam = [0, 0, 0, 0]

	regl.frame((frame) => {
		if(update_needed) {
			update_needed = false // do this *before* running the drawing code so we don't keep updating if drawing throws an error.

			mat4.perspective(mat_projection,
				deg_to_rad * 60, // fov y
				frame.framebufferWidth / frame.framebufferHeight, // aspect ratio
				0.01, // near
				100, // far
			)

			mat4.copy(mat_view, mat_world_to_cam)

			// Calculate light position in camera frame
			vec4.transformMat4(light_position_cam, light_position_world, mat_view)

			const scene_info = {
				mat_view:        mat_view,
				mat_projection:  mat_projection,
				light_position_cam: light_position_cam,
			}

			// Set the whole image to black
			regl.clear({color: [0.9, 0.9, 1., 1]})

			terrain_actor.draw(scene_info)
		}

// 		debug_text.textContent = `
// Hello! Sim time is ${sim_time.toFixed(2)} s
// Camera: angle_z ${(cam_angle_z / deg_to_rad).toFixed(1)}, angle_y ${(cam_angle_y / deg_to_rad).toFixed(1)}, distance ${(cam_distance_factor*cam_distance_base).toFixed(1)}
// `
	})
}

DOM_loaded_promise.then(main)
