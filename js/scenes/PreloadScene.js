class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        // --- CENÁRIOS ---
        this.load.image('bg_fase1', 'assets/img/bg-fase1.png');
        this.load.image('bg_fase2', 'assets/img/bg-fase1.png'); 
        this.load.image('bg_fase3', 'assets/img/bg-fase1.png');

        // --- ITENS E PERSONAGEM ---
        this.load.image('bisnaga', 'assets/img/bisnaga.png');
        this.load.image('cartucho', 'assets/img/cartucho.png');
        this.load.image('player_normal', 'assets/img/jessica-in-game-box.png');   
        this.load.image('player_andando', 'assets/img/jessica-in-game-box-2.png'); 

        // --- ÁUDIO ---
        this.load.audio('musica_fase1', 'assets/audio/bmg/fase-1.wav');
        
        // EFEITO SONORO (Apenas coleta)
        this.load.audio('sfx_collect', 'assets/audio/efeitos-sonoros/collect.wav'); 
    }

    create() {
        console.log("Preload completo.");
    }
}