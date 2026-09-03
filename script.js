let fileInput = document.getElementById("input-file");
let samplingCanvas = document.getElementById("sampling-canvas");
let samplingCtx = samplingCanvas.getContext("2d");
let outputCanvas = document.getElementById("output-canvas");
let outputCtx = outputCanvas.getContext("2d");
let img = new Image();
let is_img_load = false;
let in_color = true
let result_list = [];
let current_cols = 0;


fileInput.addEventListener("change", (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
        img.src = URL.createObjectURL(fileList[0]);
    };
}); 


document.getElementById("btn-clipboard").addEventListener("click", () => {
    if (!is_img_load) return;

    let text = "";
    for (let i = 0; i < result_list.length; i++){
        text += result_list[i].char
        if ((i + 1) % current_cols === 0) text += "\n";
    };
    navigator.clipboard.writeText(text);
});


document.getElementById("btn-save").addEventListener("click", () => {
    if (!is_img_load) return;

    const link = document.createElement("a");
    link.download = "ascii.png";
    link.href = outputCanvas.toDataURL("image/png");
    link.click();
});


const slider = document.getElementById("Size");
const output = document.getElementById("value");
const dropZone = document.getElementById("drop-zone");

output.innerHTML = slider.value;

slider.addEventListener("input", function() {
    output.innerHTML = this.value;
    convertToASCII();
});


const ASCII = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const RATIO = 0.55;
const DISPLAY_WIDTH = 800;


function convertToASCII() {
    if (! is_img_load) return;

    const size = Number(slider.value);
    const cols = Math.trunc(img.naturalWidth / (size * RATIO));
    const rows = Math.trunc(img.naturalHeight / size);

    samplingCanvas.width = cols;
    samplingCanvas.height = rows;
    samplingCtx.drawImage(img, 0, 0, cols, rows);

    const imgData = samplingCtx.getImageData(0, 0, cols, rows);
    const pixels = imgData.data;
    
    result_list = [];
    current_cols = cols;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4; // * 4 because on pixel add four informations in pixels, R, G, B and A
            const red = pixels[idx];
            const green = pixels[idx + 1];
            const blue = pixels[idx + 2]; 
            
            const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            const char = ASCII[Math.trunc(Math.min(brightness / 255 * ASCII.length, ASCII.length - 1))];
            
            result_list.push({char, red, green, blue, x, y, brightness});
        };
        
    };
    
    const charWidth = DISPLAY_WIDTH / cols;
    const charHeight = charWidth /RATIO;
    const displayHeight = charHeight * rows;

    outputCanvas.width = DISPLAY_WIDTH;
    outputCanvas.height = displayHeight;

    outputCtx.font = `${charHeight}px "Courier Prime", monospace`;
    outputCtx.textBaseline = "top";

    if (in_color) {
        
    }
    outputCtx.fillStyle = "white";
    outputCtx.fillRect(0, 0, DISPLAY_WIDTH, displayHeight);

    outputCtx.font = `${charHeight}px "Courier Prime", monospace`;
    outputCtx.textBaseline = "top";

    for (const {char, red, green, blue, x, y, brightness} of result_list) {
        if (in_color) {
            outputCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            outputCtx.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
            if (brightness < 128) {
                outputCtx.fillStyle = "white";
            } else {
                outputCtx.fillStyle = "black";
            };
            outputCtx.fillText(char, x * charWidth, y * charHeight);
        } else {
            outputCtx.fillStyle = "black";
            outputCtx.fillRect(0, 0, DISPLAY_WIDTH, displayHeight);

            output.fillStyle = "white";
            outputCtx.fillText(char, x * charWidth, y * charHeight);
        };
    };
};


img.onload = function () {
    is_img_load = true;
    dropZone.classList.add("compact");
    convertToASCII();
};