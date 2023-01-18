// this version is needed for: indexing an array, const array, modulo %
precision highp float;

//=============================================================================
//	Exercise code for "Introduction to Computer Graphics 2018"
//     by
//	Krzysztof Lis @ EPFL
//=============================================================================

#define NUM_GRADIENTS 12

// -- Gradient table --
vec2 gradients(int i) {
	if (i ==  0) return vec2( 1,  1);
	if (i ==  1) return vec2(-1,  1);
	if (i ==  2) return vec2( 1, -1);
	if (i ==  3) return vec2(-1, -1);
	if (i ==  4) return vec2( 1,  0);
	if (i ==  5) return vec2(-1,  0);
	if (i ==  6) return vec2( 1,  0);
	if (i ==  7) return vec2(-1,  0);
	if (i ==  8) return vec2( 0,  1);
	if (i ==  9) return vec2( 0, -1);
	if (i == 10) return vec2( 0,  1);
	if (i == 11) return vec2( 0, -1);
	return vec2(0, 0);
}

// -- 3D Gradient table --
vec3 gradients_3d(int i) {
	if (i ==  0) return vec3( 0, 1, 1);
	if (i ==  1) return vec3( 0, 1,-1);
	if (i ==  2) return vec3( 0,-1, 1);
	if (i ==  3) return vec3( 0, -1,-1);
	if (i ==  4) return vec3( 1, 0, 1);
	if (i ==  5) return vec3( 1, 0,-1);
	if (i ==  6) return vec3(-1, 0, 1);
	if (i ==  7) return vec3(-1, 0, -1);
	if (i ==  8) return vec3( 1, 1, 0);
	if (i ==  9) return vec3( 1,-1, 0);
	if (i == 10) return vec3(-1, 1, 0);
	if (i == 11) return vec3(-1,-1, 0);
	return vec3(0, 0, 0);
}

float hash_poly(float x) {
	return mod(((x*34.0)+1.0)*x, 289.0);
}

// -- Hash function --
int hash_func(vec2 grid_point) {
	return int(mod(hash_poly(hash_poly(grid_point.x) + grid_point.y), float(NUM_GRADIENTS)));
}
int hash_func_3d(vec3 grid_point) {
	return int(mod(hash_poly(hash_poly(hash_poly(grid_point.x) + grid_point.y) + grid_point.z), float(NUM_GRADIENTS)));
}

// -- Smooth interpolation polynomial --
float blending_weight_poly(float t) {
	return t*t*t*(t*(t*6.0 - 15.0)+10.0);
}


// Constants for FBM
const float freq_multiplier = 2.17;
const float ampl_multiplier = 0.5;
const int num_octaves = 4;

// ==============================================================
// 1D Perlin noise evaluation and plotting

float perlin_noise_1d(float x) {
	/*
	// Note Gradients in the table are 2d, so in the 1D case we use grad.x
	*/

	float p = x+4.;

	float c0 = floor(p);
	float c1 = c0+1.;

	// Not sure about second component
	vec2 grid0 = vec2(c0,0.);
	vec2 grid1 = vec2(c1,0.);

	float grad0 = gradients(hash_func(grid0)).x;
	float grad1 = gradients(hash_func(grid1)).x;

	float g0 = grad0*(p-c0);
	float g1 = grad1*(p-c1);

	float t = p-c0;

	return mix(g0,g1,blending_weight_poly(t));
}

float perlin_fbm_1d(float x) {

	float fbm = 0. ;
	for(int i = 0 ; i < num_octaves ; i++){
		fbm += pow(ampl_multiplier, float(i)) * perlin_noise_1d(x * pow(freq_multiplier, float(i)));
	} return fbm ;
}

// ----- plotting -----

const vec3 plot_foreground = vec3(0.5, 0.8, 0.5);
const vec3 plot_background = vec3(0.2, 0.2, 0.2);

vec3 plot_value(float func_value, float coord_within_plot) {
	return (func_value < ((coord_within_plot - 0.5)*2.0)) ? plot_foreground : plot_background;
}

vec3 plots(vec2 point) {
	// Press D (or right arrow) to scroll

	// fit into -1...1
	point += vec2(1., 1.);
	point *= 0.5;

	if(point.y < 0. || point.y > 1.) {
		return vec3(255, 0, 0);
	}

	float y_inv = 1. - point.y;
	float y_rel = y_inv / 0.2;
	int which_plot = int(floor(y_rel));
	float coord_within_plot = fract(y_rel);

	vec3 result;
	if(which_plot < 4) {
		result = plot_value(
 			perlin_noise_1d(point.x * pow(freq_multiplier, float(which_plot))),
			coord_within_plot
		);
	} else {
		result = plot_value(
			perlin_fbm_1d(point.x) * 1.5,
			coord_within_plot
		);
	}

	return result;
}

// ==============================================================
// 2D Perlin noise evaluation


float perlin_noise(vec2 point) {

	float p0 = floor(point.x);
	float p1 = floor(point.y);

	vec2 c00 = vec2(p0,p1);
	vec2 c01 = vec2(p0,p1+1.);
	vec2 c10 = vec2(p0+1.,p1);
	vec2 c11 = vec2(p0+1.,p1+1.);

	vec2 grad00 = gradients(hash_func(c00));
	vec2 grad01 = gradients(hash_func(c01));
	vec2 grad10 = gradients(hash_func(c10));
	vec2 grad11 = gradients(hash_func(c11));

	float s = dot(grad00,point-c00);
	float u = dot(grad01,point-c01);
	float t = dot(grad10,point-c10);
	float v = dot(grad11,point-c11);

	float dst = (point-c00).x;
	float duv = (point-c01).x;

	float st = mix(s,t,blending_weight_poly(dst));
	float uv = mix(u,v,blending_weight_poly(duv));

	float dnoise = (point-c00).y;

	return mix(st,uv,blending_weight_poly(dnoise));
}

vec3 tex_perlin(vec2 point) {
	// Visualize noise as a vec3 color
	float freq = 23.15;
 	float noise_val = perlin_noise(point * freq) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 3D Perlin noise evaluation

float perlin_noise_3d_from_2d(vec3 point) {
	float xy = perlin_noise(vec2(point.x,point.y));
	float yz = perlin_noise(vec2(point.y,point.z));
	float xz = perlin_noise(vec2(point.x,point.z));

	float yx = perlin_noise(vec2(point.y,point.x));
	float zy = perlin_noise(vec2(point.z,point.y));
	float zx = perlin_noise(vec2(point.z,point.x));

	float xyz = xy + yz + xz + yx + zy + zx;
	return xyz/6.;
}

float perlin_noise_3d(vec3 point) {

	float p0 = floor(point.x);
	float p1 = floor(point.y);
	float p2 = floor(point.z);

	vec3 c000 = vec3(p0,p1,p2);
	vec3 c001 = vec3(p0,p1,p2+1.);
	vec3 c010 = vec3(p0,p1+1.,p2);
	vec3 c011 = vec3(p0,p1+1.,p2+1.);
	vec3 c100 = vec3(p0+1.,p1,p2);
	vec3 c101 = vec3(p0+1.,p1,p2+1.);
	vec3 c110 = vec3(p0+1.,p1+1.,p2);
	vec3 c111 = vec3(p0+1.,p1+1.,p2+1.);

	vec3 grad000 = gradients_3d(hash_func_3d(c000));
	vec3 grad001 = gradients_3d(hash_func_3d(c001));
	vec3 grad010 = gradients_3d(hash_func_3d(c010));
	vec3 grad011 = gradients_3d(hash_func_3d(c011));
	vec3 grad100 = gradients_3d(hash_func_3d(c100));
	vec3 grad101 = gradients_3d(hash_func_3d(c101));
	vec3 grad110 = gradients_3d(hash_func_3d(c110));
	vec3 grad111 = gradients_3d(hash_func_3d(c111));

	float a = dot(grad000,point-c000);
	float b = dot(grad001,point-c001);
	float c = dot(grad010,point-c010);
	float d = dot(grad011,point-c011);
	float e = dot(grad100,point-c100);
	float f = dot(grad101,point-c101);
	float g = dot(grad110,point-c110);
	float h = dot(grad111,point-c111);

	float sx1 = (point-c000).x;
	float sx2 = (point-c010).x;
	float sx3 = (point-c001).x;
	float sx4 = (point-c011).x;

	float ae = mix(a,e,blending_weight_poly(sx1));
	float cg = mix(c,g,blending_weight_poly(sx2));
	float bf = mix(b,f,blending_weight_poly(sx3));
	float dh = mix(d,h,blending_weight_poly(sx4));

	float sy1 = (point-c000).y;
	float sy2 = (point-c001).y;

	float aecg = mix(ae,cg,blending_weight_poly(sy1));
	float bfdh = mix(dh,bf,blending_weight_poly(sy2));

	float sz1 = (point-c000).z;

	return mix(aecg,bfdh,blending_weight_poly(sz1));
}

// ==============================================================
// 2D Fractional Brownian Motion

float perlin_fbm(vec2 point) {

	float fbm = 0. ;

	for(int i = 0 ; i < num_octaves ; i++){
		fbm += pow(ampl_multiplier, float(i)) * perlin_noise(point * pow(freq_multiplier, float(i))) ;
	} return fbm ;
}

vec3 tex_fbm(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = perlin_fbm(point) + 0.5;
	return vec3(noise_val);
}

vec3 tex_fbm_for_terrain(vec2 point) {
	// scale by 0.25 for a reasonably shaped terrain
	// the +0.5 transforms it to 0..1 range - for the case of writing it to a non-float textures on older browsers or GLES3
	float noise_val = (perlin_fbm(point) * 0.25) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 3D Fractional Brownian Motion

// Constants for 3D FBM
const float freq_multiplier_3d = 2.17;
const float ampl_multiplier_3d = 0.5;
const int num_octaves_3d = 4;

float perlin_fbm_3d(vec3 point) {

	float fbm = 0. ;

	for(int i = 0 ; i < num_octaves_3d ; i++){
		fbm += pow(ampl_multiplier_3d, float(i)) * perlin_noise_3d_from_2d(point * pow(freq_multiplier_3d, float(i))) ;
	} return fbm ;
}

vec3 tex_fbm_3d(vec3 point) {
	// Visualize noise as a vec3 color
	float noise_val = perlin_fbm_3d(point);
	return vec3(noise_val);
}

vec3 tex_fbm_for_terrain_3d(vec3 point) {
	// scale by 0.25 for a reasonably shaped terrain
	// the +0.5 transforms it to 0..1 range - for the case of writing it to a non-float textures on older browsers or GLES3
	float noise_val = (perlin_fbm_3d(point) * 0.25) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 2D turbulence

float turbulence(vec2 point) {

	float turbulence = 0. ;
	for(int i = 0; i < num_octaves; i++){
		turbulence += pow(ampl_multiplier, float(i)) * abs(perlin_noise(point * pow(freq_multiplier, float(i)))) ;
	} return turbulence ;
}

vec3 tex_turbulence(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = turbulence(point);
	return vec3(noise_val);
}

// ==============================================================
// 3D turbulence

float turbulence_3d(vec3 point) {

	float turbulence = 0. ;
	for(int i = 0; i < num_octaves; i++){
		turbulence += pow(ampl_multiplier, float(i)) * abs(perlin_noise_3d(point * pow(freq_multiplier, float(i)))) ;
	} return turbulence ;
}

vec3 tex_turbulence(vec3 point) {
	// Visualize noise as a vec3 color
	float noise_val = turbulence_3d(point);
	return vec3(noise_val);
}

// ==============================================================
// Procedural 3D terrain

vec3 emmental_terrain(vec3 point) {
	float noise_val = perlin_noise_3d(point)*2.;
	return vec3(noise_val);
}

// ==============================================================
// Procedural "map" texture

const float terrain_water_level = -0.075;
const vec3 terrain_color_water = vec3(0.29, 0.51, 0.62);
const vec3 terrain_color_grass = vec3(0.43, 0.53, 0.23);
const vec3 terrain_color_mountain = vec3(0.8, 0.7, 0.7);

vec3 tex_map(vec2 point) {
	float s = perlin_fbm(point) ;
	float alpha = s - terrain_water_level ; 
	vec3 texture ; 
	
	if (s > terrain_water_level){
		texture = mix(terrain_color_grass, terrain_color_mountain, alpha) ;
	}
	else{
		texture = terrain_color_water ;
	}
	return texture ;
}

// ==============================================================
// Procedural "wood" texture

const vec3 brown_dark 	= vec3(0.48, 0.29, 0.00);
const vec3 brown_light 	= vec3(0.90, 0.82, 0.62);

vec3 tex_wood(vec2 point) {
	float alpha = 0.5 * (1. + sin(100. * (length(point) + 0.15 * turbulence(point)))) ; 
	vec3 wood = mix(brown_light, brown_dark, alpha) ; 
	return wood ;
}


// ==============================================================
// Procedural "marble" texture

const vec3 white 			= vec3(0.95, 0.95, 0.95);

vec3 tex_marble(vec2 point) {
	vec2 q = vec2(perlin_fbm(point), perlin_fbm(point + vec2(1.7, 4.6))) ; 
	float alpha = 0.5 * (1. + perlin_fbm(point + 4. * q)) ; 
	vec3 marble = mix(white, brown_dark, alpha) ; 
	return marble ; 
}

// ==============================================================

vec3 tex_marble_3d(vec3 point){
	vec3 q = vec3(perlin_fbm_3d(point), perlin_fbm_3d(point + vec3(1.7, 4.6, 3.4)), perlin_fbm_3d(point + vec3(6.2, 1.1, -2.3))) ; 
	float alpha = 0.5 * (1. + perlin_fbm_3d(point + 4. * q)) ; 
	vec3 marble = mix(white, brown_dark, alpha) ; 
	
	return marble ; 
}


