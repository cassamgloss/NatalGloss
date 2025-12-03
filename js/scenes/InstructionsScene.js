class InstructionsScene extends Phaser.Scene {
    constructor() { super({ key: 'InstructionsScene' }); }

    create() {
        const width = this.scale.width; const height = this.scale.height;
        
        // Fundo semitransparente
        let overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85); overlay.fillRect(0, 0, width, height);

        this.container = this.add.container(width/2, height/2);
        
        // Painel
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.96); bg.lineStyle(4, 0xffd700);
        bg.fillRoundedRect(-450, -280, 900, 560, 30); bg.strokeRoundedRect(-450, -280, 900, 560, 30);
        
        // Texto
        let tit = this.add.text(0, -220, 'SUA MISSÃO', { fontFamily: 'Raleway', fontSize: '48px', fontStyle: '900', color: '#ffd700' }).setOrigin(0.5);

        // Imagens (Correção: usando 'player_normal')
        let imgJess = this.add.image(0, 50, 'player_normal').setScale(0.13);
        
        let txtInfo = this.add.text(0, -80, "Colete bisnagas e cartuchos!\nPegue 5 seguidos para dobrar pontos.", { fontFamily: 'Montserrat', fontSize: '20px', color: '#ccc', align: 'center' }).setOrigin(0.5);

        // Botão
        let btnGrp = this.add.container(0, 200);
        let btnBg = this.add.graphics(); btnBg.fillStyle(0xffd700, 1); btnBg.fillRoundedRect(-100, -30, 200, 60, 30);
        let btnTxt = this.add.text(0, 0, 'VAMOS LÁ!', { fontFamily: 'Raleway', fontSize: '24px', color: '#000', fontStyle: '900' }).setOrigin(0.5);
        let zone = this.add.zone(0, 0, 200, 60).setInteractive({ cursor: 'pointer' });

        zone.on('pointerdown', () => {
            this.tweens.add({
                targets: this.container, scale: 0.9, alpha: 0, duration: 200,
                onComplete: () => {
                    this.scene.stop();
                    // Avisa a GameScene para soltar o jogo
                    const gameScene = this.scene.get('GameScene');
                    if(gameScene) gameScene.iniciarGameplay(); 
                }
            });
        });

        btnGrp.add([btnBg, btnTxt, zone]);
        this.container.add([bg, tit, txtInfo, imgJess, btnGrp]);
        
        this.container.alpha = 0; this.container.setScale(0.8);
        this.tweens.add({ targets: this.container, alpha: 1, scale: 1, duration: 400, ease: 'Back.out' });
    }
}