import {vec2, vec3, vec4, mat2, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "./icg_math.js"

import {emmental_scale,emmental_noise_threshold,emmental_only_sphere} from "./constants.js"

class BufferData {

	constructor(regl, buffer) {
		this.width = Math.sqrt(buffer.width)
		this.length = this.width
		this.height = buffer.height
		this.data = regl.read({framebuffer: buffer})
	}

	get(x, y, z) {
		x = Math.min(Math.max(x, 0), this.length - 1)
		y = Math.min(Math.max(y, 0), this.width - 1)
		z = Math.min(Math.max(z, 0), this.height - 1)

		return this.data[(x + y*this.length + z*this.length*this.width) << 2]
	}
}

const MARCHING_CUBES_TABLE = [
	[],
	[[8, 0, 3]],
	[[1, 0, 9]],
	[[8, 1, 3], [8, 9, 1]],
	[[10, 2, 1]],
	[[8, 0, 3], [1, 10, 2]],
	[[9, 2, 0], [9, 10, 2]],
	[[3, 8, 2], [2, 8, 10], [10, 8, 9]],
	[[3, 2, 11]],
	[[0, 2, 8], [2, 11, 8]],
	[[1, 0, 9], [2, 11, 3]],
	[[2, 9, 1], [11, 9, 2], [8, 9, 11]],
	[[3, 10, 11], [3, 1, 10]],
	[[1, 10, 0], [0, 10, 8], [8, 10, 11]],
	[[0, 11, 3], [9, 11, 0], [10, 11, 9]],
	[[8, 9, 11], [11, 9, 10]],
	[[7, 4, 8]],
	[[3, 7, 0], [7, 4, 0]],
	[[7, 4, 8], [9, 1, 0]],
	[[9, 1, 4], [4, 1, 7], [7, 1, 3]],
	[[7, 4, 8], [2, 1, 10]],
	[[4, 3, 7], [4, 0, 3], [2, 1, 10]],
	[[2, 0, 10], [0, 9, 10], [7, 4, 8]],
	[[9, 10, 4], [4, 10, 3], [3, 10, 2], [4, 3, 7]],
	[[4, 8, 7], [3, 2, 11]],
	[[7, 4, 11], [11, 4, 2], [2, 4, 0]],
	[[1, 0, 9], [2, 11, 3], [8, 7, 4]],
	[[2, 11, 1], [1, 11, 9], [9, 11, 7], [9, 7, 4]],
	[[10, 11, 1], [11, 3, 1], [4, 8, 7]],
	[[4, 0, 7], [7, 0, 10], [0, 1, 10], [7, 10, 11]],
	[[7, 4, 8], [0, 11, 3], [9, 11, 0], [10, 11, 9]],
	[[4, 11, 7], [9, 11, 4], [10, 11, 9]],
	[[9, 4, 5]],
	[[9, 4, 5], [0, 3, 8]],
	[[0, 5, 1], [0, 4, 5]],
	[[4, 3, 8], [5, 3, 4], [1, 3, 5]],
	[[5, 9, 4], [10, 2, 1]],
	[[8, 0, 3], [1, 10, 2], [4, 5, 9]],
	[[10, 4, 5], [2, 4, 10], [0, 4, 2]],
	[[3, 10, 2], [8, 10, 3], [5, 10, 8], [4, 5, 8]],
	[[9, 4, 5], [11, 3, 2]],
	[[11, 0, 2], [11, 8, 0], [9, 4, 5]],
	[[5, 1, 4], [1, 0, 4], [11, 3, 2]],
	[[5, 1, 4], [4, 1, 11], [1, 2, 11], [4, 11, 8]],
	[[3, 10, 11], [3, 1, 10], [5, 9, 4]],
	[[9, 4, 5], [1, 10, 0], [0, 10, 8], [8, 10, 11]],
	[[5, 0, 4], [11, 0, 5], [11, 3, 0], [10, 11, 5]],
	[[5, 10, 4], [4, 10, 8], [8, 10, 11]],
	[[9, 7, 5], [9, 8, 7]],
	[[0, 5, 9], [3, 5, 0], [7, 5, 3]],
	[[8, 7, 0], [0, 7, 1], [1, 7, 5]],
	[[7, 5, 3], [3, 5, 1]],
	[[7, 5, 8], [5, 9, 8], [2, 1, 10]],
	[[10, 2, 1], [0, 5, 9], [3, 5, 0], [7, 5, 3]],
	[[8, 2, 0], [5, 2, 8], [10, 2, 5], [7, 5, 8]],
	[[2, 3, 10], [10, 3, 5], [5, 3, 7]],
	[[9, 7, 5], [9, 8, 7], [11, 3, 2]],
	[[0, 2, 9], [9, 2, 7], [7, 2, 11], [9, 7, 5]],
	[[3, 2, 11], [8, 7, 0], [0, 7, 1], [1, 7, 5]],
	[[11, 1, 2], [7, 1, 11], [5, 1, 7]],
	[[3, 1, 11], [11, 1, 10], [8, 7, 9], [9, 7, 5]],
	[[11, 7, 0], [7, 5, 0], [5, 9, 0], [10, 11, 0], [1, 10, 0]],
	[[0, 5, 10], [0, 7, 5], [0, 8, 7], [0, 10, 11], [0, 11, 3]],
	[[10, 11, 5], [11, 7, 5]],
	[[5, 6, 10]],
	[[8, 0, 3], [10, 5, 6]],
	[[0, 9, 1], [5, 6, 10]],
	[[8, 1, 3], [8, 9, 1], [10, 5, 6]],
	[[1, 6, 2], [1, 5, 6]],
	[[6, 2, 5], [2, 1, 5], [8, 0, 3]],
	[[5, 6, 9], [9, 6, 0], [0, 6, 2]],
	[[5, 8, 9], [2, 8, 5], [3, 8, 2], [6, 2, 5]],
	[[3, 2, 11], [10, 5, 6]],
	[[0, 2, 8], [2, 11, 8], [5, 6, 10]],
	[[3, 2, 11], [0, 9, 1], [10, 5, 6]],
	[[5, 6, 10], [2, 9, 1], [11, 9, 2], [8, 9, 11]],
	[[11, 3, 6], [6, 3, 5], [5, 3, 1]],
	[[11, 8, 6], [6, 8, 1], [1, 8, 0], [6, 1, 5]],
	[[5, 0, 9], [6, 0, 5], [3, 0, 6], [11, 3, 6]],
	[[6, 9, 5], [11, 9, 6], [8, 9, 11]],
	[[7, 4, 8], [6, 10, 5]],
	[[3, 7, 0], [7, 4, 0], [10, 5, 6]],
	[[7, 4, 8], [6, 10, 5], [9, 1, 0]],
	[[5, 6, 10], [9, 1, 4], [4, 1, 7], [7, 1, 3]],
	[[1, 6, 2], [1, 5, 6], [7, 4, 8]],
	[[6, 1, 5], [2, 1, 6], [0, 7, 4], [3, 7, 0]],
	[[4, 8, 7], [5, 6, 9], [9, 6, 0], [0, 6, 2]],
	[[2, 3, 9], [3, 7, 9], [7, 4, 9], [6, 2, 9], [5, 6, 9]],
	[[2, 11, 3], [7, 4, 8], [10, 5, 6]],
	[[6, 10, 5], [7, 4, 11], [11, 4, 2], [2, 4, 0]],
	[[1, 0, 9], [8, 7, 4], [3, 2, 11], [5, 6, 10]],
	[[1, 2, 9], [9, 2, 11], [9, 11, 4], [4, 11, 7], [5, 6, 10]],
	[[7, 4, 8], [11, 3, 6], [6, 3, 5], [5, 3, 1]],
	[[11, 0, 1], [11, 4, 0], [11, 7, 4], [11, 1, 5], [11, 5, 6]],
	[[6, 9, 5], [0, 9, 6], [11, 0, 6], [3, 0, 11], [4, 8, 7]],
	[[5, 6, 9], [9, 6, 11], [9, 11, 7], [9, 7, 4]],
	[[4, 10, 9], [4, 6, 10]],
	[[10, 4, 6], [10, 9, 4], [8, 0, 3]],
	[[1, 0, 10], [10, 0, 6], [6, 0, 4]],
	[[8, 1, 3], [6, 1, 8], [6, 10, 1], [4, 6, 8]],
	[[9, 2, 1], [4, 2, 9], [6, 2, 4]],
	[[3, 8, 0], [9, 2, 1], [4, 2, 9], [6, 2, 4]],
	[[0, 4, 2], [2, 4, 6]],
	[[8, 2, 3], [4, 2, 8], [6, 2, 4]],
	[[4, 10, 9], [4, 6, 10], [2, 11, 3]],
	[[11, 8, 2], [2, 8, 0], [6, 10, 4], [4, 10, 9]],
	[[2, 11, 3], [1, 0, 10], [10, 0, 6], [6, 0, 4]],
	[[8, 4, 1], [4, 6, 1], [6, 10, 1], [11, 8, 1], [2, 11, 1]],
	[[3, 1, 11], [11, 1, 4], [1, 9, 4], [11, 4, 6]],
	[[6, 11, 1], [11, 8, 1], [8, 0, 1], [4, 6, 1], [9, 4, 1]],
	[[3, 0, 11], [11, 0, 6], [6, 0, 4]],
	[[4, 11, 8], [4, 6, 11]],
	[[6, 8, 7], [10, 8, 6], [9, 8, 10]],
	[[3, 7, 0], [0, 7, 10], [7, 6, 10], [0, 10, 9]],
	[[1, 6, 10], [0, 6, 1], [7, 6, 0], [8, 7, 0]],
	[[10, 1, 6], [6, 1, 7], [7, 1, 3]],
	[[9, 8, 1], [1, 8, 6], [6, 8, 7], [1, 6, 2]],
	[[9, 7, 6], [9, 3, 7], [9, 0, 3], [9, 6, 2], [9, 2, 1]],
	[[7, 6, 8], [8, 6, 0], [0, 6, 2]],
	[[3, 6, 2], [3, 7, 6]],
	[[3, 2, 11], [6, 8, 7], [10, 8, 6], [9, 8, 10]],
	[[7, 9, 0], [7, 10, 9], [7, 6, 10], [7, 0, 2], [7, 2, 11]],
	[[0, 10, 1], [6, 10, 0], [8, 6, 0], [7, 6, 8], [2, 11, 3]],
	[[1, 6, 10], [7, 6, 1], [11, 7, 1], [2, 11, 1]],
	[[1, 9, 6], [9, 8, 6], [8, 7, 6], [3, 1, 6], [11, 3, 6]],
	[[9, 0, 1], [11, 7, 6]],
	[[0, 11, 3], [6, 11, 0], [7, 6, 0], [8, 7, 0]],
	[[7, 6, 11]],
	[[11, 6, 7]],
	[[3, 8, 0], [11, 6, 7]],
	[[1, 0, 9], [6, 7, 11]],
	[[1, 3, 9], [3, 8, 9], [6, 7, 11]],
	[[10, 2, 1], [6, 7, 11]],
	[[10, 2, 1], [3, 8, 0], [6, 7, 11]],
	[[9, 2, 0], [9, 10, 2], [11, 6, 7]],
	[[11, 6, 7], [3, 8, 2], [2, 8, 10], [10, 8, 9]],
	[[2, 6, 3], [6, 7, 3]],
	[[8, 6, 7], [0, 6, 8], [2, 6, 0]],
	[[7, 2, 6], [7, 3, 2], [1, 0, 9]],
	[[8, 9, 7], [7, 9, 2], [2, 9, 1], [7, 2, 6]],
	[[6, 1, 10], [7, 1, 6], [3, 1, 7]],
	[[8, 0, 7], [7, 0, 6], [6, 0, 1], [6, 1, 10]],
	[[7, 3, 6], [6, 3, 9], [3, 0, 9], [6, 9, 10]],
	[[7, 8, 6], [6, 8, 10], [10, 8, 9]],
	[[8, 11, 4], [11, 6, 4]],
	[[11, 0, 3], [6, 0, 11], [4, 0, 6]],
	[[6, 4, 11], [4, 8, 11], [1, 0, 9]],
	[[1, 3, 9], [9, 3, 6], [3, 11, 6], [9, 6, 4]],
	[[8, 11, 4], [11, 6, 4], [1, 10, 2]],
	[[1, 10, 2], [11, 0, 3], [6, 0, 11], [4, 0, 6]],
	[[2, 9, 10], [0, 9, 2], [4, 11, 6], [8, 11, 4]],
	[[3, 4, 9], [3, 6, 4], [3, 11, 6], [3, 9, 10], [3, 10, 2]],
	[[3, 2, 8], [8, 2, 4], [4, 2, 6]],
	[[2, 4, 0], [6, 4, 2]],
	[[0, 9, 1], [3, 2, 8], [8, 2, 4], [4, 2, 6]],
	[[1, 2, 9], [9, 2, 4], [4, 2, 6]],
	[[10, 3, 1], [4, 3, 10], [4, 8, 3], [6, 4, 10]],
	[[10, 0, 1], [6, 0, 10], [4, 0, 6]],
	[[3, 10, 6], [3, 9, 10], [3, 0, 9], [3, 6, 4], [3, 4, 8]],
	[[9, 10, 4], [10, 6, 4]],
	[[9, 4, 5], [7, 11, 6]],
	[[9, 4, 5], [7, 11, 6], [0, 3, 8]],
	[[0, 5, 1], [0, 4, 5], [6, 7, 11]],
	[[11, 6, 7], [4, 3, 8], [5, 3, 4], [1, 3, 5]],
	[[1, 10, 2], [9, 4, 5], [6, 7, 11]],
	[[8, 0, 3], [4, 5, 9], [10, 2, 1], [11, 6, 7]],
	[[7, 11, 6], [10, 4, 5], [2, 4, 10], [0, 4, 2]],
	[[8, 2, 3], [10, 2, 8], [4, 10, 8], [5, 10, 4], [11, 6, 7]],
	[[2, 6, 3], [6, 7, 3], [9, 4, 5]],
	[[5, 9, 4], [8, 6, 7], [0, 6, 8], [2, 6, 0]],
	[[7, 3, 6], [6, 3, 2], [4, 5, 0], [0, 5, 1]],
	[[8, 1, 2], [8, 5, 1], [8, 4, 5], [8, 2, 6], [8, 6, 7]],
	[[9, 4, 5], [6, 1, 10], [7, 1, 6], [3, 1, 7]],
	[[7, 8, 6], [6, 8, 0], [6, 0, 10], [10, 0, 1], [5, 9, 4]],
	[[3, 0, 10], [0, 4, 10], [4, 5, 10], [7, 3, 10], [6, 7, 10]],
	[[8, 6, 7], [10, 6, 8], [5, 10, 8], [4, 5, 8]],
	[[5, 9, 6], [6, 9, 11], [11, 9, 8]],
	[[11, 6, 3], [3, 6, 0], [0, 6, 5], [0, 5, 9]],
	[[8, 11, 0], [0, 11, 5], [5, 11, 6], [0, 5, 1]],
	[[6, 3, 11], [5, 3, 6], [1, 3, 5]],
	[[10, 2, 1], [5, 9, 6], [6, 9, 11], [11, 9, 8]],
	[[3, 11, 0], [0, 11, 6], [0, 6, 9], [9, 6, 5], [1, 10, 2]],
	[[0, 8, 5], [8, 11, 5], [11, 6, 5], [2, 0, 5], [10, 2, 5]],
	[[11, 6, 3], [3, 6, 5], [3, 5, 10], [3, 10, 2]],
	[[3, 9, 8], [6, 9, 3], [5, 9, 6], [2, 6, 3]],
	[[9, 6, 5], [0, 6, 9], [2, 6, 0]],
	[[6, 5, 8], [5, 1, 8], [1, 0, 8], [2, 6, 8], [3, 2, 8]],
	[[2, 6, 1], [6, 5, 1]],
	[[6, 8, 3], [6, 9, 8], [6, 5, 9], [6, 3, 1], [6, 1, 10]],
	[[1, 10, 0], [0, 10, 6], [0, 6, 5], [0, 5, 9]],
	[[3, 0, 8], [6, 5, 10]],
	[[10, 6, 5]],
	[[5, 11, 10], [5, 7, 11]],
	[[5, 11, 10], [5, 7, 11], [3, 8, 0]],
	[[11, 10, 7], [10, 5, 7], [0, 9, 1]],
	[[5, 7, 10], [10, 7, 11], [9, 1, 8], [8, 1, 3]],
	[[2, 1, 11], [11, 1, 7], [7, 1, 5]],
	[[3, 8, 0], [2, 1, 11], [11, 1, 7], [7, 1, 5]],
	[[2, 0, 11], [11, 0, 5], [5, 0, 9], [11, 5, 7]],
	[[2, 9, 5], [2, 8, 9], [2, 3, 8], [2, 5, 7], [2, 7, 11]],
	[[10, 3, 2], [5, 3, 10], [7, 3, 5]],
	[[10, 0, 2], [7, 0, 10], [8, 0, 7], [5, 7, 10]],
	[[0, 9, 1], [10, 3, 2], [5, 3, 10], [7, 3, 5]],
	[[7, 8, 2], [8, 9, 2], [9, 1, 2], [5, 7, 2], [10, 5, 2]],
	[[3, 1, 7], [7, 1, 5]],
	[[0, 7, 8], [1, 7, 0], [5, 7, 1]],
	[[9, 5, 0], [0, 5, 3], [3, 5, 7]],
	[[5, 7, 9], [7, 8, 9]],
	[[4, 10, 5], [8, 10, 4], [11, 10, 8]],
	[[3, 4, 0], [10, 4, 3], [10, 5, 4], [11, 10, 3]],
	[[1, 0, 9], [4, 10, 5], [8, 10, 4], [11, 10, 8]],
	[[4, 3, 11], [4, 1, 3], [4, 9, 1], [4, 11, 10], [4, 10, 5]],
	[[1, 5, 2], [2, 5, 8], [5, 4, 8], [2, 8, 11]],
	[[5, 4, 11], [4, 0, 11], [0, 3, 11], [1, 5, 11], [2, 1, 11]],
	[[5, 11, 2], [5, 8, 11], [5, 4, 8], [5, 2, 0], [5, 0, 9]],
	[[5, 4, 9], [2, 3, 11]],
	[[3, 4, 8], [2, 4, 3], [5, 4, 2], [10, 5, 2]],
	[[5, 4, 10], [10, 4, 2], [2, 4, 0]],
	[[2, 8, 3], [4, 8, 2], [10, 4, 2], [5, 4, 10], [0, 9, 1]],
	[[4, 10, 5], [2, 10, 4], [1, 2, 4], [9, 1, 4]],
	[[8, 3, 4], [4, 3, 5], [5, 3, 1]],
	[[1, 5, 0], [5, 4, 0]],
	[[5, 0, 9], [3, 0, 5], [8, 3, 5], [4, 8, 5]],
	[[5, 4, 9]],
	[[7, 11, 4], [4, 11, 9], [9, 11, 10]],
	[[8, 0, 3], [7, 11, 4], [4, 11, 9], [9, 11, 10]],
	[[0, 4, 1], [1, 4, 11], [4, 7, 11], [1, 11, 10]],
	[[10, 1, 4], [1, 3, 4], [3, 8, 4], [11, 10, 4], [7, 11, 4]],
	[[9, 4, 1], [1, 4, 2], [2, 4, 7], [2, 7, 11]],
	[[1, 9, 2], [2, 9, 4], [2, 4, 11], [11, 4, 7], [3, 8, 0]],
	[[11, 4, 7], [2, 4, 11], [0, 4, 2]],
	[[7, 11, 4], [4, 11, 2], [4, 2, 3], [4, 3, 8]],
	[[10, 9, 2], [2, 9, 7], [7, 9, 4], [2, 7, 3]],
	[[2, 10, 7], [10, 9, 7], [9, 4, 7], [0, 2, 7], [8, 0, 7]],
	[[10, 4, 7], [10, 0, 4], [10, 1, 0], [10, 7, 3], [10, 3, 2]],
	[[8, 4, 7], [10, 1, 2]],
	[[4, 1, 9], [7, 1, 4], [3, 1, 7]],
	[[8, 0, 7], [7, 0, 1], [7, 1, 9], [7, 9, 4]],
	[[0, 7, 3], [0, 4, 7]],
	[[8, 4, 7]],
	[[9, 8, 10], [10, 8, 11]],
	[[3, 11, 0], [0, 11, 9], [9, 11, 10]],
	[[0, 10, 1], [8, 10, 0], [11, 10, 8]],
	[[11, 10, 3], [10, 1, 3]],
	[[1, 9, 2], [2, 9, 11], [11, 9, 8]],
	[[9, 2, 1], [11, 2, 9], [3, 11, 9], [0, 3, 9]],
	[[8, 2, 0], [8, 11, 2]],
	[[11, 2, 3]],
	[[2, 8, 3], [10, 8, 2], [9, 8, 10]],
	[[0, 2, 9], [2, 10, 9]],
	[[3, 2, 8], [8, 2, 10], [8, 10, 1], [8, 1, 0]],
	[[1, 2, 10]],
	[[3, 1, 8], [1, 9, 8]],
	[[9, 0, 1]],
	[[3, 0, 8]],
	[]
]

function terrain_build_mesh(noise_map) {
	const volume_length = noise_map.length
	const volume_width = noise_map.width
	const volume_height = noise_map.height

	const scale = emmental_scale
	
	let volume_sqradius = (volume_length/2.)**2
	let centerX = volume_length/2.
	let centerY = volume_width/2.
	let centerZ = volume_height/2.

	const vertices = []
	const normals = []
	const faces = []

	function xyz_to_index(x, y, z) {
		return x + y*volume_length + z*volume_length*volume_width
	}

	function get_marching_vertex(marching_case,gx,gy,gz) {
		switch (marching_case){
			case 0:
				return xyz_to_index(gx+1,gy,gz)
			case 1:
				return xyz_to_index(gx+2,gy+1,gz)
			case 2:
				return xyz_to_index(gx+1,gy+2,gz)
			case 3:
				return xyz_to_index(gx,gy+1,gz)
			case 4:
				return xyz_to_index(gx+1,gy,gz+2)
			case 5:
				return xyz_to_index(gx+2,gy+1,gz+2)
			case 6:
				return xyz_to_index(gx+1,gy+2,gz+2)
			case 7:
				return xyz_to_index(gx,gy+1,gz+2)
			case 8:
				return xyz_to_index(gx,gy,gz+1)
			case 9:
				return xyz_to_index(gx+2,gy,gz+1)
			case 10:
				return xyz_to_index(gx+2,gy+2,gz+1)
			case 11:
				return xyz_to_index(gx,gy+2,gz+1)
		}
	}

	function compute_noise(gx,gy,gz) {
		return (noise_map.get(gx,gy,gz)+noise_map.get(gz,gx,gy))/2.
	}

	for(let gz = 0.0; gz < volume_height; gz++) {
		for(let gy = 0.0; gy < volume_width; gy++) {
			for(let gx = 0.0; gx < volume_length; gx++) {
				const idx = xyz_to_index(gx, gy, gz)

				normals[idx] = vec3.normalize([0,0,0],[
					-(noise_map.get(gx+1,gy,gz) - noise_map.get(gx-1,gy,gz)) / (2/volume_length),
					-(noise_map.get(gx,gy+1,gz) - noise_map.get(gx,gy-1,gz)) / (2/volume_width),
					-(noise_map.get(gx,gy,gz+1) - noise_map.get(gx,gy,gz-1)) / (2/volume_height),
				])
				
				if(emmental_only_sphere){
					// -centers to center camera to sphere origin
					vertices[idx] = [((gx-centerX)*scale/volume_length), ((gy-centerY)*scale/volume_width), ((gz-centerZ)*scale/volume_height)]
				} else {
					// scale/2 to have camera slightly above cube
					vertices[idx] = [(gx*scale/volume_length)-emmental_scale/2, (gy*scale/volume_width)-emmental_scale/2, (gz*scale/volume_height)-emmental_scale/2]
				}
			}
		}
	}

	for(let gz = 0; gz < volume_height - 2; gz++) {
		for(let gy = 0; gy < volume_width - 2; gy++) {
			for(let gx = 0; gx < volume_length - 2; gx++) {
				if((!emmental_only_sphere) || (emmental_only_sphere && (((gx-centerX)**2)+((gy-centerY)**2)+((gz-centerZ)**2)<=volume_sqradius))) {

					let noise_case = 0
					let noise = 0

					noise = (compute_noise(gx,gy,gz) > emmental_noise_threshold) ? 0b1 : 0
					noise_case |= noise

					noise = (compute_noise(gx+2,gy,gz) > emmental_noise_threshold) ? 0b10 : 0
					if(emmental_only_sphere && noise==0 && ((((gx+2-centerX)**2)+((gy-centerY)**2)+((gz-centerZ)**2)>volume_sqradius))) { noise = 0b10 }
					noise_case |= noise

					noise_case |= (compute_noise(gx+2,gy+2,gz) > emmental_noise_threshold) ? 0b100 : 0
					if(emmental_only_sphere && noise==0 && (((gx+2-centerX)**2)+((gy+2-centerY)**2)+((gz-centerZ)**2)>volume_sqradius)) { noise = 0b100 }
					noise_case |= noise

					noise_case |= (compute_noise(gx,gy+2,gz) > emmental_noise_threshold) ? 0b1000 : 0
					if(emmental_only_sphere && noise==0 && ((((gx-centerX)**2)+((gy+2-centerY)**2)+((gz-centerZ)**2)>volume_sqradius))) { noise = 0b1000 }
					noise_case |= noise

					noise_case |= (compute_noise(gx,gy,gz+2) > emmental_noise_threshold) ? 0b10000 : 0
					if(emmental_only_sphere && noise==0 && ((((gx-centerX)**2)+((gy-centerY)**2)+((gz+2-centerZ)**2)>volume_sqradius))) { noise = 0b10000 }
					noise_case |= noise

					noise_case |= (compute_noise(gx+2,gy,gz+2) > emmental_noise_threshold) ? 0b100000 : 0
					if(emmental_only_sphere && noise==0 && ((((gx+2-centerX)**2)+((gy-centerY)**2)+((gz+2-centerZ)**2)>volume_sqradius))) { noise = 0b100000 }
					noise_case |= noise

					noise_case |= (compute_noise(gx+2,gy+2,gz+2) > emmental_noise_threshold) ? 0b1000000 : 0
					if(emmental_only_sphere && noise==0 && ((((gx+2-centerX)**2)+((gy+2-centerY)**2)+((gz+2-centerZ)**2)>volume_sqradius))) { noise = 0b1000000 }
					noise_case |= noise

					noise_case |= (compute_noise(gx,gy+2,gz+2) > emmental_noise_threshold) ? 0b10000000 : 0
					if(emmental_only_sphere && noise==0 && ((((gx-centerX)**2)+((gy+2-centerY)**2)+((gz+2-centerZ)**2)>volume_sqradius))) { noise = 0b10000000 }
					noise_case |= noise

					let marching_case = MARCHING_CUBES_TABLE[noise_case]

					for(let tri_index=0; tri_index < marching_case.length; tri_index++){
						let t0 = get_marching_vertex(marching_case[tri_index][0],gx,gy,gz)
						let t1 = get_marching_vertex(marching_case[tri_index][1],gx,gy,gz)
						let t2 = get_marching_vertex(marching_case[tri_index][2],gx,gy,gz)
						
						faces.push([t0,t1,t2])
					}
				}
			}
		}
	}

	for(let gx = 0; gx < volume_width - 1; gx++) {
		for(let gy = 0; gy < volume_length - 1; gy++) {
			if((!emmental_only_sphere) || (emmental_only_sphere && (((gx-centerX)**2)+((gy-centerY)**2)+((0-centerZ)**2)<=volume_sqradius))) {

				let n0 = (compute_noise(gx,gy,0) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(gx+1,gy,0) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(gx,gy+1,0) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(gx+1,gy+1,0) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(gx,gy,0),
						xyz_to_index(gx+1,gy,0),
						xyz_to_index(gx,gy+1,0)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(gx+1,gy,0),
						xyz_to_index(gx,gy+1,0),
						xyz_to_index(gx+1,gy+1,0)
					])
				}
			}
			if((!emmental_only_sphere) || (emmental_only_sphere && (((gx-centerX)**2)+((gy-centerY)**2)+((volume_height-1-centerZ)**2)<=volume_sqradius))) {

				let n0 = (compute_noise(gx,gy,volume_height-1) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(gx+1,gy,volume_height-1) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(gx,gy+1,volume_height-1) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(gx+1,gy+1,volume_height-1) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(gx,gy,volume_height-1),
						xyz_to_index(gx+1,gy,volume_height-1),
						xyz_to_index(gx,gy+1,volume_height-1)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(gx+1,gy,volume_height-1),
						xyz_to_index(gx,gy+1,volume_height-1),
						xyz_to_index(gx+1,gy+1,volume_height-1)
					])
				}
			}
		}
		for(let gz = 0; gz < volume_height - 1; gz++) {
			if((!emmental_only_sphere) || (emmental_only_sphere && (((gx-centerX)**2)+((0-centerY)**2)+((gz-centerZ)**2)<=volume_sqradius))) {

				let n0 = (compute_noise(gx,0,gz) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(gx+1,0,gz) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(gx,0,gz+1) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(gx+1,0,gz+1) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(gx,0,gz),
						xyz_to_index(gx+1,0,gz),
						xyz_to_index(gx,0,gz+1)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(gx+1,0,gz),
						xyz_to_index(gx,0,gz+1),
						xyz_to_index(gx+1,0,gz+1)
					])
				}
			}
			if((!emmental_only_sphere) || (emmental_only_sphere && (((gx-centerX)**2)+((volume_width-1-centerY)**2)+((gz-centerZ)**2)<=volume_sqradius))) {

				let n0 = (compute_noise(gx,volume_width-1,gz) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(gx+1,volume_width-1,gz) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(gx,volume_width-1,gz+1) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(gx+1,volume_width-1,gz+1) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(gx,volume_width-1,gz),
						xyz_to_index(gx+1,volume_width-1,gz),
						xyz_to_index(gx,volume_width-1,gz+1)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(gx+1,volume_width-1,gz),
						xyz_to_index(gx,volume_width-1,gz+1),
						xyz_to_index(gx+1,volume_width-1,gz+1)
					])
				}
			}
		}
	}

	for(let gy = 0; gy < volume_width - 1; gy++) {
		for(let gz = 0; gz < volume_length - 1; gz++) {
			if((!emmental_only_sphere) || (emmental_only_sphere && (((0-centerX)**2)+((gy-centerY)**2)+((gz-centerZ)**2)<=volume_sqradius))) {

				let n0 = (compute_noise(0,gy,gz) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(0,gy+1,gz) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(0,gy,gz+1) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(0,gy+1,gz+1) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(0,gy,gz),
						xyz_to_index(0,gy+1,gz),
						xyz_to_index(0,gy,gz+1)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(0,gy+1,gz),
						xyz_to_index(0,gy,gz+1),
						xyz_to_index(0,gy+1,gz+1)
					])
				}
			}
			if((!emmental_only_sphere) || (emmental_only_sphere && (((volume_length-1-centerX)**2)+((gy-centerY)**2)+((gz-centerZ)**2)<volume_sqradius))) {

				let n0 = (compute_noise(volume_length-1,gy,gz) < emmental_noise_threshold) ? true : false
				let n1 = (compute_noise(volume_length-1,gy+1,gz) < emmental_noise_threshold) ? true : false
				let n2 = (compute_noise(volume_length-1,gy,gz+1) < emmental_noise_threshold) ? true : false
				let n3 = (compute_noise(volume_length-1,gy+1,gz+1) < emmental_noise_threshold) ? true : false

				if ((n0 && n1) || (n0 && n2) || (n1 && n2)) {
					faces.push([
						xyz_to_index(volume_length-1,gy,gz),
						xyz_to_index(volume_length-1,gy+1,gz),
						xyz_to_index(volume_length-1,gy,gz+1)
					])
				}

				if ((n1 && n2) || (n1 && n3) || (n2 && n3)) {
					faces.push([
						xyz_to_index(volume_length-1,gy+1,gz),
						xyz_to_index(volume_length-1,gy,gz+1),
						xyz_to_index(volume_length-1,gy+1,gz+1)
					])
				}
			}
		}
	}

	return {
		vertex_positions: vertices,
		vertex_normals: normals,
		faces: faces,
	}
}


export function init_terrain(regl, resources, noise_buffer) {

	const terrain_mesh = terrain_build_mesh(new BufferData(regl, noise_buffer))

	const pipeline_draw_terrain = regl({
		attributes: {
			position: terrain_mesh.vertex_positions,
			normal: terrain_mesh.vertex_normals,
		},
		uniforms: {
			mat_mvp: regl.prop('mat_mvp'),
			mat_model_view: regl.prop('mat_model_view'),
			mat_normals: regl.prop('mat_normals'),

			light_position: regl.prop('light_position'),
		},
		elements: terrain_mesh.faces,

		vert: resources['shaders/terrain.vert.glsl'],
		frag: resources['shaders/terrain.frag.glsl'],
	})


	class TerrainActor {
		constructor() {
			this.mat_mvp = mat4.create()
			this.mat_model_view = mat4.create()
			this.mat_normals = mat3.create()
			this.mat_model_to_world = mat4.create()
		}

		draw({mat_projection, mat_view, light_position_cam}) {
			mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world)
			mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view)
	
			mat3.fromMat4(this.mat_normals, this.mat_model_view)
			mat3.transpose(this.mat_normals, this.mat_normals)
			mat3.invert(this.mat_normals, this.mat_normals)
	
			pipeline_draw_terrain({
				mat_mvp: this.mat_mvp,
				mat_model_view: this.mat_model_view,
				mat_normals: this.mat_normals,
		
				light_position: light_position_cam,
			})
		}
	}

	return new TerrainActor()
}
