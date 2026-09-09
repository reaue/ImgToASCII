let fileInput = document.getElementById("input-file");
let samplingCanvas = document.getElementById("sampling-canvas");
let samplingCtx = samplingCanvas.getContext("2d");
let outputCanvas = document.getElementById("output-canvas");
outputCanvas.classList.add("empty");
let outputCtx = outputCanvas.getContext("2d");
let img = new Image();
let is_img_load = false;
outputCanvas.width = 1;
outputCanvas.height = 1;
let in_color = false;
let invert = false;
let result_text = "";
let current_cols = 0;
let darkmode = localStorage.getItem('darkmode') === "active";
const themeSwitch = document.getElementById("theme-switch");
const processing = document.getElementById("processing");
const progress = document.getElementById("progress");
const inputDescription = document.getElementById("input-description");
let conversionId = 0;


const enableDarkmode = () => {
    document.documentElement.classList.add("darkmode");
    localStorage.setItem("darkmode", "active");
    darkmode = true;
};

const disableDarkmode = () => {
    document.documentElement.classList.remove("darkmode");
    localStorage.setItem("darkmode", "inactive");
    darkmode = false;
};

if (darkmode) enableDarkmode()

themeSwitch.addEventListener("click", () =>{
    darkmode ? disableDarkmode() : enableDarkmode();
});

function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) return;

    img.src = URL.createObjectURL(file);
}

fileInput.addEventListener("change", (event) => {
    const fileList = event.target.files;

    if (fileList.length > 0) {
        loadImage(fileList[0]);
    }
});


document.getElementById("btn-clipboard").addEventListener("click", async () => {
    if (!is_img_load || !result_text) return;

    await navigator.clipboard.writeText(result_text);
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

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

['dragenter', 'dragover'].forEach(eventName => {
    document.addEventListener(eventName, () => {
        document.body.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, () => {
        document.body.classList.remove('dragover');
    });
});

document.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;

    if (files.length > 0) {
        loadImage(files[0]);
    }
});

output.innerHTML = slider.value;
const debounceConvert = debounce(convertToASCII, 50)

slider.addEventListener("input", function() {
    output.innerHTML = this.value;
    debounceConvert();
});


function debounce(func, timeout=100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
};


document.getElementById("checkbox-choice").addEventListener("change", function() {
    in_color = this.checked;
    convertToASCII();
});

document.getElementById("checkbox-invert-choice").addEventListener("change", function() {
    invert = this.checked;
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

    const pixels = samplingCtx.getImageData(0, 0, cols, rows).data;

    const charWidth = DISPLAY_WIDTH / cols;
    const charHeight = charWidth /RATIO;
    const displayHeight = charHeight * rows;

    outputCanvas.width = DISPLAY_WIDTH;
    outputCanvas.height = displayHeight;

    outputCtx.font = `${charHeight}px "Courier Prime", monospace`;
    outputCtx.textBaseline = "top";
    
    current_cols = cols;

    processing.classList.add("active");
    progress.style.width = "0%";

    outputCtx.fillStyle = invert ? "rgb(240, 240, 240)" : "rgb(31, 31, 31)";
    outputCtx.fillRect(0, 0, DISPLAY_WIDTH, displayHeight);
    outputCtx.fillStyle = invert ? "black" : "white";

    let y = 0;
    let text = "";
    conversionId++;
    const currentConversion = conversionId;

    function processRows () {
        const startTime = performance.now();
        if (currentConversion !== conversionId) {
            return;
        }
    
        while ( y < rows && performance.now() - startTime < 16) {
            let line = "";
            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 4;
                let red = pixels[idx];
                let green = pixels[idx + 1];
                let blue = pixels[idx + 2];
                if (invert) {
                    red = 255 - red;
                    blue = 255 - blue;
                    green = 255 - green;
                }
                const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                const charIndex = Math.min((brightness * ASCII.length / 256) | 0, ASCII.length - 1);
                const char = ASCII[charIndex];
                if (in_color) {
                    const posX = x * charWidth;
                    const posY = y * charHeight;
                    outputCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                    outputCtx.fillRect(posX, posY, charWidth, charHeight);
                    outputCtx.fillStyle = brightness < 128 ? "white" : "black";
                    outputCtx.fillText(char, posX, posY);
                } else {
                    line += char;
                }
            }
            if (!in_color) {
                outputCtx.fillText(line, 0, y * charHeight);
                text += line + "\n"
            }
            y++;
            const percent = (y / rows) * 100;
            progress.style.width = `${percent}%`;
            }
            if (y < rows) {
                requestAnimationFrame(processRows);
            } else {
                progress.style.width = "100%";
                result_text = text;
                setTimeout(() => {
                    processing.classList.remove("active");
                }, 200);
            };
        };
    requestAnimationFrame(processRows);
};

img.onload = function () {
    is_img_load = true;
    dropZone.classList.add("compact");
    inputDescription.classList.add("compact")
    outputCanvas.classList.remove("empty");
    convertToASCII();
};


inputDescription.addEventListener("input", () => {
    inputDescription.style.height = "auto";
    inputDescription.style.height = inputDescription.scrollHeight + "px";
});

inputDescription.addEventListener("keydown", async function (event) {
    if (event.key !== "Enter" || event.shiftKey) return;
    
    event.preventDefault();
    const query = inputDescription.value.trim();

    if (!query) return;

    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`;

    async function getFirstImage() {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            };

            const pages = data.query?.pages;

            if (!pages) {
                inputDescription.value = "";
                inputDescription.placeholder = "No image found...";
                return;
            }

            
            const firstPage = Object.values(pages)[0];
            const imageUrl = firstPage.imageinfo?.[0]?.url;

            if (!imageUrl) {
                throw new Error("No image URL found");
            }

            img.src = imageUrl;

        } catch (error) {
            inputDescription.value = "";
            inputDescription.placeholder = "Having some trouble with the API...";
        };
    }; 
    getFirstImage();
});