attribute vec3 position;

uniform vec2 viewer_position;
uniform float viewer_scale;

varying vec3 v3f_tex_coords;

void main() {
	vec3 local_coord = position * viewer_scale;
	v3f_tex_coords = vec3(viewer_position,0.) + local_coord;

	gl_Position = vec4(position, 1.);
}
