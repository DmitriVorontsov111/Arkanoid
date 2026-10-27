
const canvas = document.getElementById("mycanvas");
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "img/background.png";

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (background.complete && background.naturalWidth > 0) {
        ctx.drawImage(
            background,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}

background.onload = drawGame;
background.onerror = () => {
    console.error("Taustapildi laadimine ebaõnnestus!");
};

drawGame();

