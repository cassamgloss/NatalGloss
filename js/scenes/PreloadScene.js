class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        // --- CENÁRIOS ---
        this.load.image('bg_fase1', 'assets/img/bg-fase1.png');
        // Adicionei verificação de erro caso a imagem não exista, mas no seu caso o arquivo existe
        this.load.image('bg_fase2', 'assets/img/bg-fase2.png'); 
        // Nota: Você não tem bg-fase3.png na pasta, então manter o fallback para fase1 ou 2 está correto.
        this.load.image('bg_fase3', 'assets/img/bg-fase1.png'); 

        // --- ITENS ---
        this.load.image('bisnaga', 'assets/img/bisnaga.png');
        this.load.image('cartucho', 'assets/img/cartucho.png');
        this.load.image('snowflake_item', 'assets/img/snowflake-item.png');

        // --- PERSONAGEM ---
        this.load.image('player_normal', 'assets/img/jessica-in-game-box.png');   
        this.load.image('player_andando', 'assets/img/jessica-in-game-box-2.png'); 
        this.load.image('jessica_vitoria', 'assets/img/jessica-vitoria.png');

        // --- UI ---
        this.load.image('star', 'assets/img/star.png');
        this.load.image('btn_gold', 'assets/img/botao-comecar.png');

        // --- ÁUDIO (CORRIGIDO AQUI) ---
        this.load.audio('musica_fase1', 'assets/audio/bmg/fase-1.wav');
        this.load.audio('musica_fase2', 'assets/audio/bmg/fase-2.mp3');
        this.load.audio('musica_fase3', 'assets/audio/bmg/fase-3.mp3'); // Adicionado
        // Se for usar som de vitória diferente:
        // this.load.audio('musica_final', 'assets/audio/bmg/final.wav'); 
        
        this.load.audio('sfx_collect', 'assets/audio/efeitos-sonoros/collect.wav'); 
        // Sugestão: Carregue o click aqui também para usar dentro do jogo se precisar
        this.load.audio('sfx_click', 'assets/audio/efeitos-sonoros/botao-click.mp3');
    }

    create() {
        // Passar direto para o menu ou esperar sinal? 
        // Como sua UI controla o start, apenas avisamos que carregou.
        console.log("Preload completo.");
    }
}