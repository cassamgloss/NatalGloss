class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        // --- CENÁRIOS ---
        this.load.image('bg_fase1', 'assets/img/bg-fase1.png');
        this.load.image('bg_fase2', 'assets/img/bg-fase2.png');
        this.load.image('bg_fase3', 'assets/img/bg-fase1.png');

        // --- ITENS ---
        this.load.image('bisnaga', 'assets/img/bisnaga.png');
        this.load.image('cartucho', 'assets/img/cartucho.png');
        this.load.image('bisnaga_gold', 'assets/img/bisnaga-gold.png');
        this.load.image('snowflake_item', 'assets/img/snowflake-item.png');

        // --- ITENS MODO ETERNO ---
        this.load.image('icone_coracao', 'assets/img/icone-coracao.png');
        this.load.image('item_escudo', 'assets/img/item-escudo.png');

        // --- PERSONAGEM ---
        this.load.image('player_normal', 'assets/img/jessica-in-game-box.png');   
        this.load.image('player_andando', 'assets/img/jessica-in-game-box-2.png'); 
        this.load.image('jessica_vitoria', 'assets/img/jessica-vitoria.png');
        
        // --- CORREÇÃO: AGORA É .PNG (Estava .jpg antes) ---
        this.load.image('player_frozen_1', 'assets/img/jessica-ice1.png'); 
        this.load.image('player_frozen_2', 'assets/img/jessica-ice2.png'); 

        // --- UI ---
        this.load.image('star', 'assets/img/star.png');
        this.load.image('btn_gold', 'assets/img/botao-comecar.png');
        this.load.image('btn_brilho', 'assets/img/botao-comecar.png'); 

        // --- ÁUDIO ---
        this.load.audio('musica_fase1', 'assets/audio/bmg/fase-1.wav');
        this.load.audio('musica_fase2', 'assets/audio/bmg/fase-2.mp3');
        this.load.audio('musica_fase3', 'assets/audio/bmg/fase-3.mp3');
        
        this.load.audio('sfx_collect', 'assets/audio/efeitos-sonoros/collect.wav');
        this.load.audio('sfx_ice', 'assets/audio/efeitos-sonoros/jessica-ice.mp3');
        this.load.audio('sfx_jackpot', 'assets/audio/efeitos-sonoros/caixa-cheia.wav');
        
        // --- SONS NOVOS (WAV) ---
        this.load.audio('sfx_life_up', 'assets/audio/efeitos-sonoros/sfx-life-up.wav');
        this.load.audio('sfx_damage', 'assets/audio/efeitos-sonoros/sfx-damage.wav');
        this.load.audio('sfx_shield_up', 'assets/audio/efeitos-sonoros/sfx-shield-up.wav');
    }

    create() {
        console.log("Preload completo.");
    }
}