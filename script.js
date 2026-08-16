const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('uploadInput');
const zoomSlider = document.getElementById('zoomSlider');
const downloadBtn = document.getElementById('downloadBtn');

// State variables
let userImage = null;
let frameImage = new Image();
frameImage.src = 'frame.png'; // Path to your transparent frame PNG (1:1 aspect ratio)

// Transformation state
let imageX = 0;
let imageY = 0;
let scale = 1;

// Dragging state
let isDragging = false;
let startX = 0;
let startY = 0;

// Render canvas loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw User Image (bottom layer)
  if (userImage) {
    ctx.save();
    
    // Draw image centered around its current (imageX, imageY) coordinate
    const drawWidth = userImage.width * scale;
    const drawHeight = userImage.height * scale;
    
    // imageX and imageY are relative to the top-left corner of the canvas
    ctx.drawImage(userImage, imageX, imageY, drawWidth, drawHeight);
    
    ctx.restore();
  }

  // 2. Draw Transparent Frame Overlay (top layer)
  if (frameImage.complete) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }
}

// Ensure frame redraws once loaded
frameImage.onload = () => draw();

// --- Event Handlers ---

// File Upload Handler
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    userImage = new Image();
    userImage.onload = () => {
      // Center image initially within the 1:1 canvas
      const minCanvasDim = Math.min(canvas.width, canvas.height);
      const minImgDim = Math.min(userImage.width, userImage.height);
      
      scale = minCanvasDim / minImgDim; // Scale to fit shortest dimension

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
  
  // Need to adjust coordinates slightly during zoom to keep image centered
  const oldScale = scale;
  scale = parseFloat(e.target.value);
  
  // Calculate relative center before zoom and maintain it after zoom
  const pivotX = canvas.width / 2;
  const pivotY = canvas.height / 2;
  
  imageX = pivotX - (pivotX - imageX) * (scale / oldScale);
  imageY = pivotY - (pivotY - imageY) * (scale / oldScale);

  draw();
});

// --- Mouse Dragging Event Listeners ---

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
  if (!userImage) return;
  
  const mousePos = getMousePos(canvas, e);
  isDragging = true;
  
  // Calculate offset relative to the image's top-left corner
  startX = mousePos.x - imageX;
  startY = mousePos.y - imageY;
  
  canvas.style.cursor = 'grabbing'; // Optional style improvement
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging || !userImage) return;
  
  const mousePos = getMousePos(canvas, e);
  
  // Update image position based on new mouse position and original offset
  imageX = mousePos.x - startX;
  imageY = mousePos.y - startY;
  
  draw();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  if (canvas.style.cursor === 'grabbing') {
      canvas.style.cursor = 'default';
  }
});


// --- Touch (Mobile) Dragging Event Listeners ---

function getTouchPos(canvas, touch) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

canvas.addEventListener('touchstart', (e) => {
  if (!userImage || e.touches.length > 1) return; // Ignore multi-touch (pinching)
  
  const touchPos = getTouchPos(canvas, e.touches[0]);
  isDragging = true;
  
  // Calculate offset relative to the image's top-left corner
  startX = touchPos.x - imageX;
  startY = touchPos.y - imageY;
  
  e.preventDefault(); // Prevent page scrolling during drag
});

window.addEventListener('touchmove', (e) => {
  if (!isDragging || !userImage || e.touches.length > 1) return;
  
  const touchPos = getTouchPos(canvas, e.touches[0]);
  
  // Update image position based on new touch position and original offset
  imageX = touchPos.x - startX;
  imageY = touchPos.y - startY;
  
  draw();
  e.preventDefault(); // Prevent page scrolling during drag
});

window.addEventListener('touchend', () => {
  isDragging = false;
});


// --- Download Process ---
downloadBtn.addEventListener('click', () => {
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'framed-profile.png';
  link.href = dataURL;
  link.click();
});
