// Main.js
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    // LISTA DE CENAS: Preload -> Instruções -> Jogo
    scene: [PreloadScene, InstructionsScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 }, 
            debug: false 
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

window.game = new Phaser.Game(config);