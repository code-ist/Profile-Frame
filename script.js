const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('uploadInput');
const zoomSlider = document.getElementById('zoomSlider');
const downloadBtn = document.getElementById('downloadBtn');

// State variables
let userImage = null;
let frameImage = new Image();
frameImage.src = 'frame.png'; // Path to your transparent frame PNG

let imageX = 0;
let imageY = 0;
let scale = 1;
let isDragging = false;
let startX, startY;

// Render canvas loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw User Image (bottom layer)
  if (userImage) {
    ctx.save();
    const width = userImage.width * scale;
    const height = userImage.height * scale;
    ctx.drawImage(userImage, imageX, imageY, width, height);
    ctx.restore();
  }

  // 2. Draw Transparent Frame Overlay (top layer)
  if (frameImage.complete) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }
}

// Ensure frame redraws once loaded
frameImage.onload = () => draw();

// File Upload Handler
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    userImage = new Image();
    userImage.onload = () => {
      // Center image initially
      scale = canvas.width / Math.min(userImage.width, userImage.height);
      imageX = (canvas.width - userImage.width * scale) / 2;
      imageY = (canvas.height - userImage.height * scale) / 2;

      zoomSlider.value = scale;
      zoomSlider.disabled = false;
      downloadBtn.disabled = false;

      draw();
    };
    userImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Zoom Slider
zoomSlider.addEventListener('input', (e) => {
  if (!userImage) return;
  scale = parseFloat(e.target.value);
  draw();
});

// Touch/Mouse Drag Operations
canvas.addEventListener('mousedown', (e) => {
  if (!userImage) return;
  isDragging = true;
  startX = e.clientX - imageX;
  startY = e.clientY - imageY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  imageX = e.clientX - startX;
  imageY = e.clientY - startY;
  draw();
});

window.addEventListener('mouseup', () => isDragging = false);

// Download Process
downloadBtn.addEventListener('click', () => {
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'framed-profile.png';
  link.href = dataURL;
  link.click();
});