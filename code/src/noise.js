import {vec2} from "../lib/gl-matrix_3.3.0/esm/index.js"

import {emmental_length,emmental_width,emmental_height} from "./constants.js"

// For textures only
const mesh_cube_3d = {
	position: [
		// Front face
		[-1.0, -1.0,  1.0],
		[1.0, -1.0,  1.0],
		[1.0,  1.0,  1.0],
		[-1.0,  1.0,  1.0],

		// Back face
		[-1.0, -1.0, -1.0],
		[-1.0,  1.0, -1.0],
		[1.0,  1.0, -1.0],
		[1.0, -1.0, -1.0],

		// Top face
		[-1.0,  1.0, -1.0],
		[-1.0,  1.0,  1.0],
		[1.0,  1.0,  1.0],
		[1.0,  1.0, -1.0],

		// Bottom face
		[-1.0, -1.0, -1.0],
		[1.0, -1.0, -1.0],
		[1.0, -1.0,  1.0],
		[-1.0, -1.0,  1.0],

		// Right face
		[1.0, -1.0, -1.0],
		[1.0,  1.0, -1.0],
		[1.0,  1.0,  1.0],
		[1.0, -1.0,  1.0],

		// Left face
		[-1.0, -1.0, -1.0],
		[-1.0, -1.0,  1.0],
		[-1.0,  1.0,  1.0],
		[-1.0,  1.0, -1.0]
	],
	faces: [
		[0,  1,  2],      [0,  2,  3],    // front
		[4,  5,  6],      [4,  6,  7],    // back
		[8,  9,  10],     [8,  10, 11],   // top
		[12, 13, 14],     [12, 14, 15],   // bottom
		[16, 17, 18],     [16, 18, 19],   // right
		[20, 21, 22],     [20, 22, 23]    // left
	],
}

export function init_noise(regl, resources) {

	// shader implementing all noise functions
	const noise_library_code = resources['shaders/noise.frag.glsl']

	// Safari (at least older versions of it) does not support reading float buffers...
	var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	
	// shared buffer to which the texture are rendered
	const noise_buffer = regl.framebuffer({
		width: emmental_length*emmental_width,
		height: emmental_height,
		colorFormat: 'rgba',
		colorType: isSafari ? 'uint8' : 'float',
		stencil: false,
		depth: false,
		mag: 'linear',
		min: 'linear',
	})

	const pipeline_generate_texture = regl({
		attributes: {position: mesh_cube_3d.position},
		elements: mesh_cube_3d.faces,
		
		uniforms: {
			viewer_position: regl.prop('viewer_position'),
			viewer_scale:    regl.prop('viewer_scale'),
		},
				
		vert: resources['shaders/display.vert.glsl'],
		frag: regl.prop('shader_frag'),

		framebuffer: noise_buffer,
	})

	const pipeline_draw_buffer_to_screen = regl({
		attributes: {position: mesh_cube_3d.position},
		elements: mesh_cube_3d.faces,
		uniforms: {
			buffer_to_draw: noise_buffer,
		},
		vert: resources['shaders/buffer_to_screen.vert.glsl'],
		frag: resources['shaders/buffer_to_screen.frag.glsl'],
	})

	class NoiseTexture {
		constructor(name, shader_func_name, hidden) {
			this.name = name
			this.shader_func_name = shader_func_name
			this.shader_frag = this.generate_frag_shader()
			this.hidden = hidden
		}

		generate_frag_shader() {
			return `${noise_library_code}
		
// --------------

varying vec3 v3f_tex_coords;

void main() {
	vec3 color = ${this.shader_func_name}(v3f_tex_coords);
	gl_FragColor = vec4(color,1.);
} 
`;		
		}

		get_buffer() {
			return noise_buffer
		}
		//mouse offset no change
		draw_texture_to_buffer({mouse_offset = [0, 0], zoom_factor = 1.0, width = emmental_length*emmental_width, height = emmental_height}) {
			// adjust the buffer size to the desired value
			if (noise_buffer.width != width || noise_buffer.height != height) {
				noise_buffer.resize(width, height)
			}

			regl.clear({
				framebuffer: noise_buffer,
				color: [0, 0, 0, 1], 
			})

			pipeline_generate_texture({
				shader_frag: this.shader_frag,
				viewer_position: vec2.negate([0, 0], mouse_offset),
				viewer_scale: zoom_factor,
			})
			
			return noise_buffer
		}

		draw_buffer_to_screen() {
			pipeline_draw_buffer_to_screen()
		}
	}

	const noise_textures = [
		new NoiseTexture('1D plot', 'plots'),
		new NoiseTexture('Perlin', 'tex_perlin'),
		new NoiseTexture('FBM', 'tex_fbm'),
		new NoiseTexture('Turbulence', 'tex_turbulence'),
		new NoiseTexture('Map', 'tex_map'),
		new NoiseTexture('Marble', 'tex_marble'),
		new NoiseTexture('Wood', 'tex_wood'),
		new NoiseTexture('Liquid', 'tex_liquid', true),
		new NoiseTexture('FBM_for_terrain', 'tex_fbm_for_terrain', true),
		new NoiseTexture('emmental_terrain', 'emmental_terrain', true),
		new NoiseTexture('3D_marble', "tex_marble_3d", true)
	]

	return noise_textures
}




	

/* GLES2

// Workaround regl's incomplete api for uniforms which are arrays https://github.com/regl-project/regl/issues/373
function regl_array_uniform_workaround(uniform_name, values) {
	return Object.fromEntries(
		values.map(
			(value, array_idx) => [`${uniform_name}[${array_idx}]`, value]
		)
	)
}


// Uniforms: global data available to the shader
uniforms: Object.assign({}, {
		viewer_position: regl.prop('viewer_position'),
		viewer_scale: regl.prop('viewer_scale'),
	}, 
	regl_array_uniform_workaround('gradients', [
		[ 1,  1],
		[-1,  1],
		[ 1, -1],
		[-1, -1],
		[ 1,  0],
		[-1,  0],
		[ 1,  0],
		[-1,  0],
		[ 0,  1],
		[ 0, -1],
		[ 0,  1],
		[ 0, -1],
	]),
),
*/
