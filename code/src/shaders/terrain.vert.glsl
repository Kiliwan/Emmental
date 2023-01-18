attribute vec3 position;
attribute vec3 normal;

// Vertex shader computes eye-space vertex position and normals + world-space height
varying vec3 v3f_normal; // normal vector in camera coordinates
varying vec3 v3f_dir_to_light; // direction to light source
varying vec3 v3f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)
varying float v3f_height;
varying float v3f_width; 
varying float v3f_length;

uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals; // mat3 not 4, because normals are only rotated and not translated

uniform vec4 light_position; //in camera space coordinates already

void main()
{
	v3f_length = position.x;
	v3f_width = position.y; 
    v3f_height = position.z;
    vec4 position_v4 = vec4(position, 1);
    
	vec4 posView = mat_model_view*position_v4;
	v3f_dir_from_view = normalize(vec3(posView));
	// direction to light source
	v3f_dir_to_light = normalize(vec3(light_position)-v3f_dir_from_view);
	// transform normal to camera coordinates
	v3f_normal = normalize(mat_normals*normal);
	
	gl_Position = mat_mvp * position_v4;
}
