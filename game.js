let game = {
    start: function() {
        this.ctx = document
            .getElementById("mycanvas")
            .getContext("2d");

        let background = new Image();

        background.onload = () => {
            window.requestAnimationFrame(() => {
                this.ctx.drawImage(background, 0, 0);
            });
        };

        background.src = "img/background.png";
    }
};

window.addEventListener("load", () => {
    game.start();
});
