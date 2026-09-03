let fileInput = document.getElementById("input-file");
let canvas = document.getElementById("output-canvas");
let ctx = canvas.getContext("2d");
let img = new Image();
let is_img_load = false;


fileInput.addEventListener("change", (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
        img.src = URL.createObjectURL(fileList[0]);
    }
}); 

const slider = document.getElementById("Size");
const output = document.getElementById("value");

output.innerHTML = slider.value;

slider.addEventListener("input", function() {
    output.innerHTML = this.value;
    convertToASCII();
});


const ASCII = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const RATIO = 0.55;


function convertToASCII() {
    if (is_img_load) {
        let result_list = [];

        const size = Number(slider.value);
        let height_new_img = Math.trunc(img.naturalHeight / size);
        let width_new_img = Math.trunc(img.naturalWidth / (size * RATIO));

        canvas.width = width_new_img;
        canvas.height = height_new_img;

        ctx.drawImage(img, 0, 0, width_new_img, height_new_img);

        const imgData = ctx.getImageData(0, 0, width_new_img, height_new_img);
        const pixels = imgData.data;

        for (let y = 0; y < height_new_img; y++) {
            for (let x = 0; x < width_new_img; x++) {
                const idx = (y * width_new_img + x) * 4; // * 4 because on pixel add four informations in pixels, R, G, B and A
                const red = pixels[idx];
                const green = imgData.data[idx + 1];
                const blue = imgData.data[idx + 2]; 
                
                const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                const char = ASCII[Math.trunc(Math.min(brightness / 255 * ASCII.length, ASCII.length - 1))];
                
                result_list.push({char, red, green, blue, x, y});
            };
        };
    };
};


img.onload = function () {
    is_img_load = true;
    convertToASCII();
};