precision highp float;

// varying vec2 v2f_tex_coord;
varying vec3 v3f_normal; // normal vector in camera coordinates
varying vec3 v3f_dir_to_light; // direction to light source
varying vec3 v3f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)
varying float v3f_height;
varying float v3f_width; 
varying float v3f_length;

const vec3  light_color = vec3(1.0, 0.941, 0.898);

const vec3  terrain_color_3d_perlin_1 = vec3(0.3, 0.3, 0.3);
const vec3  terrain_color_3d_perlin_2 = vec3(0.4, 0.4, 0.4);
const vec3  terrain_color_3d_perlin_3 = vec3(0.5, 0.5, 0.5);
const vec3  terrain_color_3d_perlin_4 = vec3(0.6, 0.6, 0.6);

void main()
{
	const vec3 ambient = 1.0 * light_color; // Ambient light intensity
	float height = v3f_height;
	float width = v3f_width;
	float lenght = v3f_length;
	
	//vec3 material_color = vec3(0.3,0.3,0.3);
	vec3 material_color_1 = mix(terrain_color_3d_perlin_1, terrain_color_3d_perlin_2, cos(lenght*2.)*2.);
	vec3 material_color_2 = mix(terrain_color_3d_perlin_3, material_color_1, sin(width*5.)*1.5);
	vec3 material_color_3 = mix(terrain_color_3d_perlin_4, material_color_2, cos(height*3.)*0.5);

	float shininess = 0.8 ;

	float nl = dot(v3f_normal,v3f_dir_to_light);
    if(nl<=0.){
        nl = 0.;
    }
    float rv = dot(reflect(v3f_dir_to_light, v3f_normal),v3f_dir_from_view);
    if(rv<=0.){
        rv = 0.;
    }
    float rvs = pow(rv,shininess);

	// No shadows for now
    vec3 color = (ambient*light_color*material_color_3);//+(light_color*material_color*nl)+(light_color*material_color*rvs);
    
	gl_FragColor = vec4(color, 1.); // output: material_colorA in 0..1 range
}
