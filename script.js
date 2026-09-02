const fileInput = document.getElementById("input-file");
const triggerBtn = document.getElementById("trigger-btn");

triggerBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const fileList = event.target.files;
    console.log(fileList);
});