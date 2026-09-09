const ffmpeg = new FFmpeg();

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let fileInput = document.getElementById("input-file");
let samplingCanvas = document.getElementById("sampling-canvas");
let samplingCtx = samplingCanvas.getContext("2d", {
    willReadFrequently: true
});
let outputCanvas = document.getElementById("output-canvas");
outputCanvas.classList.add("empty");
let outputCtx = outputCanvas.getContext("2d");
let img = new Image();
img.crossOrigin = "anonymous";
let video = document.createElement("video");
video.muted = true;
video.playsInline = true;
img.crossOrigin = "anonymous";
let is_media_load = false;
outputCanvas.width = 1;
outputCanvas.height = 1;
let in_color = false;
let invert = false;
let result_text = "";
let current_cols = 0;
let darkmode;
if (localStorage.getItem('darkmode') === null) {
    darkmode = true;
} else { 
    darkmode = localStorage.getItem('darkmode') === "active";
}
const themeSwitch = document.getElementById("theme-switch");
const processing = document.getElementById("processing");
const progress = document.getElementById("progress");
const inputDescription = document.getElementById("input-description");
const btnClipboard = document.getElementById("btn-clipboard")
let conversionId = 0;
const processingText = document.getElementById("processing-texte");
let is_video = false
const topNoVideo = document.getElementById("top-no-video")
const topVideo = document.getElementById("top-video")
let file;
const videoButton = document.getElementById("btn-ASCII")
const btnSave = document.getElementById("btn-save")
const outputVideo = document.getElementById("output-video")
let gifVideoUrl = null;
let videoBlobUrl = null;


function updateSaveButtonLabel() {
    btnSave.textContent = is_video ? "DOWNLOAD VIDEO" : "DOWNLOAD PNG";
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickSupportedMimeType() {
    const candidates = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
    ];
    for (const type of candidates) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
    }
    return null;
}


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

if (darkmode) {
    enableDarkmode();
} else {
    disableDarkmode();
}

themeSwitch.addEventListener("click", () => {
    darkmode ? disableDarkmode() : enableDarkmode();
});


btnClipboard.addEventListener("click", async () => {
    if (!is_media_load || !result_text) return;

    await navigator.clipboard.writeText(result_text);
});


btnSave.addEventListener("click", () => {
    if (is_video) {
        if (!videoBlobUrl) return;

        const link = document.createElement("a");
        link.download = "ascii.webm";
        link.href = videoBlobUrl;
        link.click();
        return;
    }

    if (!is_media_load) return;

    const link = document.createElement("a");
    link.download = "ascii.png";
    link.href = outputCanvas.toDataURL("image/png");
    link.click();
});


const slider = document.getElementById("Size");
const sliderFPS = document.getElementById("FPS-slider");
const output = document.getElementById("value");
const outputFPS = document.getElementById("fps-value");
const dropZone = document.getElementById("drop-zone");

fileInput.addEventListener("change", () => {
    file = fileInput.files[0];

    if (file) {
        load(file);
    }
});

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
    file = e.dataTransfer.files[0];
    load(file);
});


async function convertGif(file) {
    if (!ffmpeg.loaded) {
        await ffmpeg.load();
    }

    try {
        await ffmpeg.deleteFile("input.gif");
    } catch {}

    try {
        await ffmpeg.deleteFile("output.mp4");
    } catch {}

    await ffmpeg.writeFile("input.gif", await fetchFile(file));

    await ffmpeg.exec([
        "-y",
        "-i", "input.gif",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "output.mp4"
    ]);

    const data = await ffmpeg.readFile("output.mp4");

    console.log("MP4 size:", data.length);
    console.log("MP4 first bytes:", data.slice(0, 16));

    if (data.length === 0) {
        throw new Error("FFmpeg generated an empty MP4");
    }

    console.log(
        "MP4 format:",
        new TextDecoder().decode(data.slice(4, 8))
    );

    return new Blob([data], {
        type: "video/mp4"
    });
}

let loadId = 0;

async function load(file) {
    if (!file) return;

    const id = ++loadId;
    is_media_load = false;

    if (file.type === "image/gif") {
        is_video = true;

        try {
            const videoBlob = await convertGif(file);

            if (id !== loadId) return;

            if (gifVideoUrl) {
                URL.revokeObjectURL(gifVideoUrl);
            }

            gifVideoUrl = URL.createObjectURL(videoBlob);

            video.src = gifVideoUrl;
            video.load();
        } catch (error) {
            console.error("GIF conversion failed:", error);
        }

        return;
    }

    if (id !== loadId) return;

    if (file.type.startsWith("video/")) {
        is_video = true;

        if (gifVideoUrl) {
            URL.revokeObjectURL(gifVideoUrl);
            gifVideoUrl = null;
        }

        video.src = URL.createObjectURL(file);
        video.load();

        return;
    }

    is_video = false;

    video.pause();
    video.removeAttribute("src");
    video.load();

    img.src = URL.createObjectURL(file);
}

output.innerHTML = slider.value;
const debounceConvert = debounce(convertToASCII, 50)


slider.addEventListener("input", function() {
    output.innerHTML = this.value;

    if (is_video) {
        debounceConvert(video);
    } else {
        debounceConvert(img);
    }
});

outputFPS.innerHTML = sliderFPS.value;

sliderFPS.addEventListener("input", function() {
    outputFPS.innerHTML = this.value;
})


function debounce(func, timeout=100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
};


document.getElementById("checkbox-choice").addEventListener("change", function() {
    in_color = this.checked;

    if (is_video) {
        debounceConvert(video);
    } else {
        debounceConvert(img);
    }
});

document.getElementById("checkbox-invert-choice").addEventListener("change", function() {
    invert = this.checked;

    if (is_video) {
        debounceConvert(video);
    } else {
        debounceConvert(img);
    }
});


const ASCII = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const RATIO = 0.55;
const DISPLAY_WIDTH = 800;


async function convertToASCII(source, silent = false) {
    if (! is_media_load) return;

    const size = Number(slider.value);
    const width = source.naturalWidth || source.videoWidth;
    const height = source.naturalHeight || source.videoHeight;

    const cols = Math.trunc(width / (size * RATIO));
    const rows = Math.trunc(height / size);

    samplingCanvas.width = cols;
    samplingCanvas.height = rows;

    samplingCtx.drawImage(source, 0, 0, cols, rows);


    const pixels = samplingCtx.getImageData(0, 0, cols, rows).data;

    const charWidth = DISPLAY_WIDTH / cols;
    const charHeight = charWidth /RATIO;
    const displayHeight = charHeight * rows;

    outputCanvas.width = DISPLAY_WIDTH;
    outputCanvas.height = displayHeight;

    outputCtx.font = `${charHeight}px "Courier Prime", monospace`;
    outputCtx.textBaseline = "top";
    
    current_cols = cols;

    if (!silent) {
        processing.classList.add("active");
        processing.classList.remove("searching");
        progress.style.width = "0%";
        processingText.textContent = "Generating ASCII...";
    }

    outputCtx.fillStyle = invert ? "rgb(240, 240, 240)" : "rgb(31, 31, 31)";
    outputCtx.fillRect(0, 0, DISPLAY_WIDTH, displayHeight);
    outputCtx.fillStyle = invert ? "black" : "white";

    let y = 0;
    let text = "";

    conversionId++;
    const currentConversion = conversionId;

    return new Promise((resolve) => {
        function processRows() {
            const startTime = performance.now();

            if (currentConversion !== conversionId) {
                resolve();
                return;
            }
            while (y < rows && performance.now() - startTime < 16) {
                let line = ""
                for (let x = 0; x < cols; x++) {
                    const idx = (y * cols + x) * 4;

                    let red = pixels[idx];
                    let green = pixels[idx + 1];
                    let blue = pixels[idx + 2];

                    if (invert) {
                        red = 255 - red;
                        green = 255 - green;
                        blue = 255 - blue;
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
                        text += char;
                    } else {
                        line += char;
                    }
                }
                if (!in_color) {
                    outputCtx.fillText(line, 0, y * charHeight);
                    text += line + "\n";
                } else {
                    text += "\n";
                }
                y++;
                if (!silent) {
                    const percent = (y / rows) * 100;
                    progress.style.width = `${percent}%`;
                }
            }
            if (y < rows) {
                requestAnimationFrame(processRows);
            } else {
                result_text = text;

                if (!silent) {
                    progress.style.width = "100%";
                    setTimeout(() => {
                        processing.classList.remove("active");
                    }, 200);
                }
                resolve();
            }
        }
        requestAnimationFrame(processRows);
    });
}


async function previewVideoFrame() {
    if (!is_media_load || !video.videoWidth || !video.videoHeight) return;
    await seekTo(video, 0);
    await convertToASCII(video, true);
}


video.onloadedmetadata = async function () {
    outputVideo.style.display = "none";
    outputCanvas.style.display = "block";
    btnClipboard.style.display = "none";

    topNoVideo.style.display = "none";
    topVideo.style.display = "flex";

    is_media_load = true;

    processing.classList.remove("searching");
    processingText.textContent = "Generating ASCII from video can take time...";
    progress.style.width = "0%";

    dropZone.classList.add("compact");
    inputDescription.classList.add("compact");
    outputCanvas.classList.remove("empty");   
    
    is_video = true;

    updateSaveButtonLabel();

    await previewVideoFrame();
}

videoButton.addEventListener("click", () => {
    is_video = true;
    videoToASCII();
});


function seekTo(video, time, timeoutMs = 1000) {
    return new Promise((resolve) => {
        let settled = false;

        const finish = () => {
            if (settled) return;

            settled = true;
            video.removeEventListener("seeked", onSeeked);
            clearTimeout(timeout);

            if (video.requestVideoFrameCallback) {
                video.requestVideoFrameCallback(() => resolve());
            } else {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
            }
        };

        const onSeeked = () => {
            finish();
        };

        const timeout = setTimeout(() => {
            finish();
        }, timeoutMs);

        if (Math.abs(video.currentTime - time) < 1 / 120) {
            finish();
            return;
        }

        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
    });
}


img.onload = function () {
    outputVideo.style.display = "none";
    outputCanvas.style.display = "block";
    btnClipboard.style.display = "block";
    topVideo.style.display = "none";
    topNoVideo.style.display = "flex";

    is_media_load = true;
    is_video = false;

    if (gifVideoUrl) {
        URL.revokeObjectURL(gifVideoUrl);
        gifVideoUrl = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    processing.classList.remove("searching");
    processingText.textContent = "Generating ASCII...";
    progress.style.width = "0%";

    dropZone.classList.add("compact");
    inputDescription.classList.add("compact");
    outputCanvas.classList.remove("empty");

    updateSaveButtonLabel();
    convertToASCII(img);
};

img.onerror = function () {
    is_media_load = false;

    processing.classList.remove("searching");
    processingText.textContent = "No image found";
    progress.style.width = "0%";

    setTimeout(() => {
        processing.classList.remove("active");
    }, 3000);
};


let searchId = 0;

async function getFirstImage(query) {
    const response = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url%7Cmime&format=json&origin=*`
    );
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query?.pages;

    if (!pages) {
        return null;
    }
    for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0];

        if (!info) continue;

        if (info.mime?.startsWith("image/")) {
            return info.url;
        }
    }
    return null;
}


async function searchAndConvert(query) {
    query = query.trim();

    if (!query) return;

    const id = ++searchId;
    inputDescription.classList.add("loading");
    processing.classList.add("active");
    processing.classList.add("searching");
    processingText.textContent = "Searching image...";
    progress.style.width = "0%";

    try {
        const imageUrl = await getFirstImage(query);

        if (id !== searchId) return;

        if (!imageUrl) {
            processing.classList.remove("searching");
            processingText.textContent = "No image found";
            progress.style.width = "0%";

            setTimeout(() => {
                if (id === searchId) {
                    processing.classList.remove("active");
                }
            }, 3000);
            return;
        }
        is_media_load = false;
        img.src = imageUrl;
    } catch (error) {
        if (id !== searchId) return;

        console.error(error);
        processing.classList.remove("searching");
        processingText.textContent = "No image found";
        progress.style.width = "0%";

        setTimeout(() => {
            if (id === searchId) {
                processing.classList.remove("active");
            }
        }, 3000);

    } finally {
        if (id === searchId) {
            inputDescription.classList.remove("loading");
        }
    }
}


inputDescription.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const query = inputDescription.value.trim();

    if (query) {
        searchAndConvert(query);
    }
});


async function videoToASCII () {
    if (!is_media_load || !is_video) return;

    if (!window.MediaRecorder) {
        processing.classList.add("active");
        processing.classList.remove("searching");
        processingText.textContent = "Video export not supported in this browser";
        progress.style.width = "0%";
        setTimeout(() => processing.classList.remove("active"), 3000);
        return;
    }

    const mimeType = pickSupportedMimeType();
    if (!mimeType) {
        processing.classList.add("active");
        processing.classList.remove("searching");
        processingText.textContent = "No supported video format in this browser";
        progress.style.width = "0%";
        setTimeout(() => processing.classList.remove("active"), 3000);
        return;
    }

    videoButton.disabled = true;
    videoButton.textContent = "CONVERTING...";

    const duration = video.duration;
    const fps = Number(sliderFPS.value);
    const totalFrames = Math.max(1, Math.floor(duration * fps));
    const frameInterval = 1000 / fps;

    processing.classList.add("active");
    processing.classList.remove("searching");
    progress.style.width = "0%";

    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
        await seekTo(video, i / fps);
        await convertToASCII(video, true);
        frames.push(await createImageBitmap(outputCanvas));

        processingText.textContent = `Extracting frames (${i + 1}/${totalFrames})...`;
        progress.style.width = `${((i + 1) / totalFrames) * 50}%`;
    }

    processingText.textContent = "Encoding video...";

    const stream = outputCanvas.captureStream(fps);

    const recordedChunks = [];

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    const stopped = new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
    });

    mediaRecorder.start();

    for (let i = 0; i < frames.length; i++) {
        outputCtx.clearRect(
            0,
            0,
            outputCanvas.width,
            outputCanvas.height
        );

    outputCtx.drawImage(frames[i], 0, 0);

    progress.style.width =
        `${50 + ((i + 1) / frames.length) * 50}%`;

    await sleep(frameInterval);
}

mediaRecorder.stop();

await stopped;

    frames.forEach((bitmap) => bitmap.close());

    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    const blob = new Blob(recordedChunks, { type: mimeType.split(";")[0] });
    videoBlobUrl = URL.createObjectURL(blob);

    progress.style.width = "100%";
    setTimeout(() => processing.classList.remove("active"), 200);

    videoButton.disabled = false;
    videoButton.textContent = "CONVERT TO ASCII";
    updateSaveButtonLabel();

    outputCanvas.style.display = "none";
    outputVideo.style.display = "block";

    outputVideo.src = videoBlobUrl;

    outputVideo.load();
    outputVideo.play();
}