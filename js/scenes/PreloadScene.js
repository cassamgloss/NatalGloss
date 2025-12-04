class PreloadScene extends Phaser.Scene {
    constructor() { 
        super({ key: 'PreloadScene' }); 
    }

    preload() {
        // --- CENÁRIOS ---
        this.load.image('bg_fase1', 'assets/img/bg-fase1.png');
        this.load.image('bg_fase2', 'assets/img/bg-fase2.png'); 
        // Fallback para fase 3 (usa o da fase 1 se não tiver um específico)
        this.load.image('bg_fase3', 'assets/img/bg-fase1.png'); 

        // --- ITENS ---
        this.load.image('bisnaga', 'assets/img/bisnaga.png');
        this.load.image('cartucho', 'assets/img/cartucho.png');
        // O obstáculo de gelo
        this.load.image('snowflake_item', 'assets/img/snowflake-item.png');

        // --- PERSONAGEM (Jéssica) ---
        this.load.image('player_normal', 'assets/img/jessica-in-game-box.png');   
        this.load.image('player_andando', 'assets/img/jessica-in-game-box-2.png'); 
        this.load.image('jessica_vitoria', 'assets/img/jessica-vitoria.png');

        // --- NOVO: JÉSSICA CONGELADA (CORRIGIDO PARA .PNG) ---
        // Certifique-se que os arquivos na pasta 'assets/img' são realmente .png
        this.load.image('player_frozen_1', 'assets/img/jessica-ice1.png');
        this.load.image('player_frozen_2', 'assets/img/jessica-ice2.png');

        // --- UI (Interface) ---
        this.load.image('star', 'assets/img/star.png');
        this.load.image('btn_gold', 'assets/img/botao-comecar.png');

        // --- ÁUDIO E MÚSICA ---
        this.load.audio('musica_fase1', 'assets/audio/bmg/fase-1.wav');
        this.load.audio('musica_fase2', 'assets/audio/bmg/fase-2.mp3');
        this.load.audio('musica_fase3', 'assets/audio/bmg/fase-3.mp3'); 
        
        // Efeitos Sonoros
        this.load.audio('sfx_collect', 'assets/audio/efeitos-sonoros/collect.wav');
        // Som de congelamento
        this.load.audio('sfx_ice', 'assets/audio/efeitos-sonoros/jessica-ice.mp3');
    }

    create() {
        console.log("Preload completo. Todos os assets carregados.");
    }
}