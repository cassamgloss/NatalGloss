const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance'
    },
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
    },
    // --- CORREÇÃO AQUI: REMOVI 'InstructionsScene' DA LISTA ---
    scene: [ PreloadScene, GameScene ] 
};

window.game = new Phaser.Game(config);