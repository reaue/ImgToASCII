import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

const fileInput = document.getElementById("input-file");
const samplingCanvas = document.getElementById("sampling-canvas");
const samplingCtx = samplingCanvas.getContext("2d", { willReadFrequently: true });
const outputCanvas = document.getElementById("output-canvas");
const outputCtx = outputCanvas.getContext("2d");
const outputVideo = document.getElementById("output-video");
const img = new Image();
const video = document.createElement("video");
const themeSwitch = document.getElementById("theme-switch");
const processing = document.getElementById("processing");
const progress = document.getElementById("progress");
const processingText = document.getElementById("processing-texte");
const inputDescription = document.getElementById("input-description");
const btnClipboard = document.getElementById("btn-clipboard");
const btnSave = document.getElementById("btn-save");
const videoButton = document.getElementById("btn-ASCII");
const topNoVideo = document.getElementById("top-no-video");
const topVideo = document.getElementById("top-video");
const dropZone = document.getElementById("drop-zone");
const slider = document.getElementById("Size");
const sliderFPS = document.getElementById("FPS-slider");
const output = document.getElementById("value");
const outputFPS = document.getElementById("fps-value");

img.crossOrigin = "anonymous";
video.muted = true;
video.playsInline = true;
outputCanvas.classList.add("empty");
outputCanvas.width = 1;
outputCanvas.height = 1;

let file;
let is_media_load = false;
let is_video = false;
let in_color = false;
let invert = false;
let result_text = "";
let conversionId = 0;
let loadId = 0;
let searchId = 0;
let gifVideoUrl = null;
let videoBlobUrl = null;
let darkmode = localStorage.getItem("darkmode") !== "inactive";

const ASCII = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const RATIO = 0.55;
const DISPLAY_WIDTH = 800;

function updateSaveButtonLabel() {
    btnSave.textContent = is_video ? "DOWNLOAD VIDEO" : "DOWNLOAD PNG";
}

function enableDarkmode() {
    document.documentElement.classList.add("darkmode");
    localStorage.setItem("darkmode", "active");
    darkmode = true;
}

function disableDarkmode() {
    document.documentElement.classList.remove("darkmode");
    localStorage.setItem("darkmode", "inactive");
    darkmode = false;
}

if (darkmode) enableDarkmode();
else disableDarkmode();

themeSwitch.addEventListener("click", () => darkmode ? disableDarkmode() : enableDarkmode());

btnClipboard.addEventListener("click", async () => {
    if (!is_media_load || !result_text) return;
    await navigator.clipboard.writeText(result_text);
});

btnSave.addEventListener("click", () => {
    const link = document.createElement("a");

    if (is_video) {
        if (!videoBlobUrl) return;
        link.download = "ascii.mp4";
        link.href = videoBlobUrl;
    } else {
        if (!is_media_load) return;
        link.download = "ascii.png";
        link.href = outputCanvas.toDataURL("image/png");
    }

    link.click();
});

fileInput.addEventListener("change", () => {
    file = fileInput.files[0];
    if (file) load(file);
});

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    document.addEventListener(eventName, event => {
        event.preventDefault();
        event.stopPropagation();
    });
});

["dragenter", "dragover"].forEach(eventName => {
    document.addEventListener(eventName, () => document.body.classList.add("dragover"));
});

["dragleave", "drop"].forEach(eventName => {
    document.addEventListener(eventName, () => document.body.classList.remove("dragover"));
});

document.addEventListener("drop", event => {
    file = event.dataTransfer.files[0];
    if (file) load(file);
});

async function convertGif(file) {
    if (!ffmpeg.loaded) await ffmpeg.load();

    try { await ffmpeg.deleteFile("input.gif"); } catch {}
    try { await ffmpeg.deleteFile("output.mp4"); } catch {}

    await ffmpeg.writeFile("input.gif", await fetchFile(file));
    await ffmpeg.exec(["-y", "-i", "input.gif", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "output.mp4"]);

    const data = await ffmpeg.readFile("output.mp4");
    if (!data.length) throw new Error("FFmpeg generated an empty MP4");

    return new Blob([data], { type: "video/mp4" });
}

async function load(file) {
    if (!file) return;

    const id = ++loadId;
    is_media_load = false;

    if (file.type === "image/gif") {
        is_video = true;
        processing.classList.add("active");
        processingText.textContent = "Wait, your GIF is converting to video...";
        progress.style.width = "0%";

        try {
            const videoBlob = await convertGif(file);
            if (id !== loadId) return;

            if (gifVideoUrl) URL.revokeObjectURL(gifVideoUrl);

            gifVideoUrl = URL.createObjectURL(videoBlob);
            video.src = gifVideoUrl;
            video.load();
        } catch {
            processingText.textContent = "GIF conversion failed";
            setTimeout(() => processing.classList.remove("active"), 3000);
        }

        processing.classList.remove("active");
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

function debounce(func, timeout = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), timeout);
    };
}

const debounceConvert = debounce(convertToASCII, 50);

output.innerHTML = slider.value;
outputFPS.innerHTML = sliderFPS.value;

slider.addEventListener("input", function() {
    output.innerHTML = this.value;

    if (is_video) {
        outputVideo.style.display = "none";
        outputCanvas.style.display = "block";
        debounceConvert(video);
    } else {
        debounceConvert(img);
    }
});

sliderFPS.addEventListener("input", function() {
    outputFPS.innerHTML = this.value;
});

document.getElementById("checkbox-choice").addEventListener("change", function() {
    in_color = this.checked;
    debounceConvert(is_video ? video : img);
});

document.getElementById("checkbox-invert-choice").addEventListener("change", function() {
    invert = this.checked;
    debounceConvert(is_video ? video : img);
});

async function convertToASCII(source, silent = false) {
    if (!is_media_load) return;

    const size = Number(slider.value);
    const width = source.naturalWidth || source.videoWidth;
    const height = source.naturalHeight || source.videoHeight;

    if (!width || !height) return;

    const cols = Math.max(1, Math.trunc(width / (size * RATIO)));
    const rows = Math.max(1, Math.trunc(height / size));

    samplingCanvas.width = cols;
    samplingCanvas.height = rows;
    samplingCtx.drawImage(source, 0, 0, cols, rows);

    const pixels = samplingCtx.getImageData(0, 0, cols, rows).data;
    const charWidth = DISPLAY_WIDTH / cols;
    const charHeight = charWidth / RATIO;
    const displayHeight = charHeight * rows;

    outputCanvas.width = DISPLAY_WIDTH;
    outputCanvas.height = displayHeight;
    outputCtx.font = `${charHeight}px "Courier Prime", monospace`;
    outputCtx.textBaseline = "top";

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

    return new Promise(resolve => {
        function processRows() {
            const startTime = performance.now();

            if (currentConversion !== conversionId) {
                resolve();
                return;
            }

            while (y < rows && performance.now() - startTime < 16) {
                let line = "";

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

                if (!silent) progress.style.width = `${(y / rows) * 100}%`;
            }

            if (y < rows) {
                requestAnimationFrame(processRows);
                return;
            }

            result_text = text;

            if (!silent) {
                progress.style.width = "100%";
                setTimeout(() => processing.classList.remove("active"), 200);
            }

            resolve();
        }

        requestAnimationFrame(processRows);
    });
}

function seekTo(video, time, timeoutMs = 1000) {
    return new Promise(resolve => {
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            video.removeEventListener("seeked", onSeeked);
            requestAnimationFrame(resolve);
        };

        const onSeeked = () => finish();
        const timeout = setTimeout(finish, timeoutMs);

        video.addEventListener("seeked", onSeeked);

        if (Math.abs(video.currentTime - time) < 1 / 120) {
            finish();
            return;
        }

        try {
            video.currentTime = time;
        } catch {
            finish();
        }
    });
}

async function previewVideoFrame() {
    if (!is_media_load || !video.videoWidth || !video.videoHeight) return;

    await seekTo(video, 1);

    await convertToASCII(video, true);

    await new Promise(resolve => requestAnimationFrame(resolve));

    outputVideo.style.display = "none";
    outputCanvas.style.display = "block";

    await convertToASCII(video, true);
}

video.onloadedmetadata = async () => {
    outputVideo.pause();
    outputVideo.removeAttribute("src");
    outputVideo.load();

    outputVideo.style.display = "none";
    outputCanvas.style.display = "block";
    btnClipboard.style.display = "none";
    topNoVideo.style.display = "none";
    topVideo.style.display = "flex";

    is_media_load = true;
    is_video = true;

    processing.classList.remove("searching");
    processingText.textContent = "Generating ASCII...";
    progress.style.width = "0%";

    dropZone.classList.add("compact");
    inputDescription.classList.add("compact");
    outputCanvas.classList.remove("empty");

    updateSaveButtonLabel();
    await previewVideoFrame();
};

videoButton.addEventListener("click", () => {
    videoToASCII();
});

img.onload = () => {
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

img.onerror = () => {
    is_media_load = false;
    processing.classList.remove("searching");
    processingText.textContent = "No image found";
    progress.style.width = "0%";
    setTimeout(() => processing.classList.remove("active"), 3000);
};

async function getFirstImage(query) {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url%7Cmime&format=json&origin=*`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const pages = data.query?.pages;

    if (!pages) return null;

    for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0];
        if (info?.mime?.startsWith("image/")) return info.url;
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

            setTimeout(() => {
                if (id === searchId) processing.classList.remove("active");
            }, 3000);

            return;
        }

        is_media_load = false;
        img.src = imageUrl;
    } catch {
        if (id !== searchId) return;

        processing.classList.remove("searching");
        processingText.textContent = "No image found";
        progress.style.width = "0%";

        setTimeout(() => {
            if (id === searchId) processing.classList.remove("active");
        }, 3000);
    } finally {
        if (id === searchId) inputDescription.classList.remove("loading");
    }
}

inputDescription.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const query = inputDescription.value.trim();
    if (query) searchAndConvert(query);
});

async function encodeFramesToMP4(frames, fps) {
    if (!ffmpeg.loaded) await ffmpeg.load();

    try {
        const existingFiles = await ffmpeg.listDir("/");

        for (const file of existingFiles) {
            if (file.name.startsWith("frame") && file.name.endsWith(".png")) {
                await ffmpeg.deleteFile(file.name);
            }
        }
    } catch {}

    for (let i = 0; i < frames.length; i++) {
        const blob = await new Promise(resolve => frames[i].toBlob(resolve, "image/png"));

        if (!blob) throw new Error("Failed to create frame");

        await ffmpeg.writeFile(`frame${String(i).padStart(5, "0")}.png`, await fetchFile(blob));
    }

    try {
        await ffmpeg.deleteFile("ascii.mp4");
    } catch {}

    await ffmpeg.exec([
        "-y",
        "-framerate", String(fps),
        "-i", "frame%05d.png",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "ascii.mp4"
    ]);

    const data = await ffmpeg.readFile("ascii.mp4");

    if (!data.length) throw new Error("FFmpeg generated an empty MP4");

    return new Blob([data], { type: "video/mp4" });
}

async function videoToASCII() {
    if (!is_media_load || !is_video) return;

    outputVideo.style.display = "none";
    outputCanvas.style.display = "block";

    videoButton.disabled = true;
    videoButton.textContent = "CONVERTING...";

    processing.classList.add("active");
    processing.classList.remove("searching");
    progress.style.width = "0%";

    try {
        const duration = video.duration;
        const fps = Number(sliderFPS.value);
        const totalFrames = Math.max(1, Math.floor(duration * fps));
        const frames = [];

        for (let i = 0; i < totalFrames; i++) {
            await seekTo(video, i / fps);
            await convertToASCII(video, true);

            const frame = document.createElement("canvas");
            frame.width = outputCanvas.width;
            frame.height = outputCanvas.height;

            frame.getContext("2d").drawImage(outputCanvas, 0, 0);
            frames.push(frame);

            processingText.textContent = `Extracting frames (${i + 1}/${totalFrames})...`;
            progress.style.width = `${((i + 1) / totalFrames) * 50}%`;
        }

        processingText.textContent = "Encoding video...";

        const mp4Blob = await encodeFramesToMP4(frames, fps);

        if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);

        videoBlobUrl = URL.createObjectURL(mp4Blob);

        outputCanvas.style.display = "none";
        outputVideo.style.display = "block";
        outputVideo.src = videoBlobUrl;
        outputVideo.load();

        outputVideo.onloadedmetadata = () => outputVideo.play();

        progress.style.width = "100%";
        processingText.textContent = "Conversion complete";

        setTimeout(() => processing.classList.remove("active"), 500);
    } catch {
        processingText.textContent = "Video conversion failed";
        progress.style.width = "0%";
        setTimeout(() => processing.classList.remove("active"), 3000);
    }

    videoButton.disabled = false;
    videoButton.textContent = "CONVERT TO ASCII";
}