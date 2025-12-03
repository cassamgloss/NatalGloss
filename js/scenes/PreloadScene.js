class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        // --- CENÁRIOS ---
        this.load.image('bg_fase1', 'assets/img/bg-fase1.png');
        // Usando a mesma imagem por enquanto (placeholder) para não quebrar se não tiver o arquivo
        this.load.image('bg_fase2', 'assets/img/bg-fase1.png'); 
        this.load.image('bg_fase3', 'assets/img/bg-fase1.png');

        // --- ITENS ---
        this.load.image('bisnaga', 'assets/img/bisnaga.png');
        this.load.image('cartucho', 'assets/img/cartucho.png');

        // --- PERSONAGEM (Correção das chaves) ---
        this.load.image('player_normal', 'assets/img/jessica-in-game-box.png');   
        this.load.image('player_andando', 'assets/img/jessica-in-game-box-2.png'); 

        // --- AUDIO ---
        this.load.audio('musica_fase1', 'assets/audio/bmg/fase-1.wav');
    }

    create() {
        console.log("Preload completo.");
    }
}