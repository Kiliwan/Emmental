let size = 40.0

export let emmental_length = size
export let emmental_width = size
export let emmental_height = size
let size_slider
try {
    size_slider = document.getElementById("size")
    size_slider.value = size
    size_slider.oninput = function() {
        emmental_length = size_slider.value
        emmental_width = size_slider.value
        emmental_height = size_slider.value
    }
} catch {}


export let emmental_scale = 4.
let scale_slider
try {
    scale_slider = document.getElementById("scale")
    scale_slider.value = emmental_scale
    scale_slider.oninput = function() {
        emmental_scale = scale_slider.value
    }
} catch {}

export let emmental_change = 3.
let change_slider
try {
    change_slider = document.getElementById("change")
    change_slider.value = emmental_change
    change_slider.oninput = function() {
        emmental_change = change_slider.value
    }
} catch {}

export let emmental_noise_threshold = 0.
let threshold_slider
try {
    threshold_slider = document.getElementById("threshold")
    threshold_slider.value = emmental_noise_threshold
    threshold_slider.oninput = function() {
        emmental_noise_threshold = threshold_slider.value
    }
} catch {}

export let emmental_only_sphere = false
let sphere_check
try {
    sphere_check = document.getElementById("only_sphere")
    sphere_check.checked = emmental_only_sphere
    sphere_check.oninput = function() {
        if(sphere_check.checked) { emmental_only_sphere = true }
        else { emmental_only_sphere = false}
    }
} catch {}

export const emmental_ZOOM_MIN = 0.001
export const emmental_ZOOM_MAX = 100.0
export const emmental_ZOOM_FACTOR = 1.1

export const emmental_mouserateX = 0.005
export const emmental_mouserateY = 0.005

export const emmental_moverate = 0.5