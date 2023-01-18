attribute vec3 position;
varying vec3 v3f_tex_coords;

void main() {
	// webGL screen coords are -1 ... 1 but texture sampling is in range 0 ... 1
	v3f_tex_coords = (position + 1.) * 0.5;
	gl_Position = vec4(position, 1.);
}
