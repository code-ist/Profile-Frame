const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('uploadInput');
const downloadBtn = document.getElementById('downloadBtn');

// State variables
let userImage = null;
let frameImage = new Image();
frameImage.src = 'frame.png'; // Path to transparent frame PNG

let imageX = 0;
let imageY = 0;
let scale = 1;
let isDragging = false;
let startX, startY;
let initialPinchDistance = null;
let initialScale = 1;

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

// Redraw frame once loaded
frameImage.onload = () => draw();

// File Upload Handler
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    userImage = new Image();
    userImage.onload = () => {
      // Center and scale image to fill canvas initial bounds
      scale = canvas.width / Math.min(userImage.width, userImage.height);
      imageX = (canvas.width - userImage.width * scale) / 2;
      imageY = (canvas.height - userImage.height * scale) / 2;

      downloadBtn.disabled = false;
      draw();
    };
    userImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Helper: Calculate distance between two touch points
function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

// Mouse Drag Operations (Desktop)
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

// Touch Interactions (Mobile Drag & Pinch-to-Zoom)
canvas.addEventListener('touchstart', (e) => {
  if (!userImage) return;

  if (e.touches.length === 1) {
    // Single finger: start pan
    isDragging = true;
    startX = e.touches[0].clientX - imageX;
    startY = e.touches[0].clientY - imageY;
  } else if (e.touches.length === 2) {
    // Two fingers: start pinch zoom
    isDragging = false;
    initialPinchDistance = getPinchDistance(e.touches);
    initialScale = scale;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!userImage) return;
  e.preventDefault(); // Prevent default page scrolling while adjusting photo

  if (e.touches.length === 1 && isDragging) {
    // Pan image
    imageX = e.touches[0].clientX - startX;
    imageY = e.touches[0].clientY - startY;
    draw();
  } else if (e.touches.length === 2 && initialPinchDistance) {
    // Pinch-to-zoom around center position
    const currentDistance = getPinchDistance(e.touches);
    const zoomFactor = currentDistance / initialPinchDistance;
    const newScale = initialScale * zoomFactor;

    // Center point adjustment during pinch zoom
    const zoomRatio = newScale / scale;
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    const rect = canvas.getBoundingClientRect();
    const canvasCenterX = (centerX - rect.left) * (canvas.width / rect.width);
    const canvasCenterY = (centerY - rect.top) * (canvas.height / rect.height);

    imageX = canvasCenterX - (canvasCenterX - imageX) * zoomRatio;
    imageY = canvasCenterY - (canvasCenterY - imageY) * zoomRatio;
    scale = newScale;

    draw();
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) initialPinchDistance = null;
  if (e.touches.length === 0) isDragging = false;
});

// High-Res Export Download
downloadBtn.addEventListener('click', () => {
  const dataURL = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = 'framed-profile-hd.png';
  link.href = dataURL;
  link.click();
});
