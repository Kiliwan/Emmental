precision highp float;
uniform sampler2D buffer_to_draw;
varying vec3 v3f_tex_coords;

void main() {
	gl_FragColor = vec4(texture2D(buffer_to_draw, vec2(v3f_tex_coords.x*v3f_tex_coords.y,v3f_tex_coords.z)).rgb, 1.);
}
