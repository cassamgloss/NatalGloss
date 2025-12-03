class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
    }

    create() {
        this.jogoRolando = false; 
        this.emFeverMode = false;
        this.feverCurrent = 0;
        this.tempoRestante = 30; 
        
        // Dificuldade progressiva
        this.velocidadeQueda = 200 + ((this.level - 1) * 150); 
        this.spawnRate = Math.max(400, 1000 - ((this.level - 1) * 300)); 

        const w = this.scale.width;
        const h = this.scale.height;

        // 1. FUNDO
        const bgKey = `bg_fase${this.level}`;
        if (this.textures.exists(bgKey)) {
            this.bg = this.add.image(w/2, h/2, bgKey);
        } else {
            this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222);
        }
        this.resize({ width: w, height: h });

        // 2. PLAYER (Jessica)
        this.player = this.physics.add.sprite(w/2, h*0.9, 'player_normal');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
        
        // Aplica o tamanho (Agora MAIOR: 45%)
        this.forceSize();

        // 3. GRUPOS
        this.items = this.physics.add.group();
        this.physics.add.overlap(this.player, this.items, this.coletarItem, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();

        // 4. UI
        this.criarPlacar();
        this.criarTimerUI();
        this.scoreText.setText('Brilho: ' + this.score);

        // 5. MÚSICA
        if (this.level === 1 && this.cache.audio.exists('musica_fase1')) {
            this.bgMusic = this.sound.add('musica_fase1', { loop: true, volume: 0.5 });
            this.bgMusic.play();
        }

        // --- EFEITO "GOLDEN DUST" (POEIRA DE OURO) ---
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffd700, 1); 
        graphics.fillCircle(4, 4, 4);     
        graphics.generateTexture('dust_particle', 8, 8);

        this.particles = this.add.particles(0, 0, 'dust_particle', {
            speed: { min: 10, max: 50 }, 
            angle: { min: 0, max: 360 }, 
            scale: { start: 0.6, end: 0 },  
            alpha: { start: 0.8, end: 0 },  
            blendMode: 'ADD',               
            lifespan: 800,                  
            frequency: 30,                  
            follow: this.player,            
            followOffset: { y: this.player.height * 0.2 },
            on: false                       
        });
        this.particles.setDepth(9); 

        // Inicia o jogo
        this.iniciarGameplay();

        this.scale.on('resize', this.resize, this);
    }

    iniciarGameplay() {
        this.jogoRolando = true;
        this.timerEvento = this.time.addEvent({ delay: 1000, callback: this.atualizarTimer, callbackScope: this, loop: true });
        this.spawnEvento = this.time.addEvent({ delay: this.spawnRate, callback: this.spawnItem, callbackScope: this, loop: true });
    }

    spawnItem() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const tipo = Phaser.Math.RND.pick(['bisnaga', 'cartucho']);
        let item = this.items.create(x, -50, tipo);
        
        if(item) {
            item.setScale(0.07);
            item.setVelocityY(this.velocidadeQueda);
            item.setDepth(5);

            // --- MELHORIA: ROTAÇÃO NATURAL ---
            // Define um ângulo inicial aleatório (0 a 360 graus)
            item.setAngle(Phaser.Math.Between(0, 360));
            
            // Define uma velocidade de giro aleatória (gira para esq ou dir)
            // Valores entre -90 e 90
            item.setAngularVelocity(Phaser.Math.Between(-90, 90));
        }
    }

    coletarItem(player, item) {
        item.destroy();
        let pts = this.emFeverMode ? 20 : 10;
        this.score += pts;
        this.scoreText.setText('Brilho: ' + this.score);

        if(!this.emFeverMode) {
            this.feverCurrent += 20; 
            this.atualizarFeverBar();
            if(this.feverCurrent >= 100) this.ativarFeverMode();
        }
    }

    ativarFeverMode() {
        if (this.emFeverMode) return;
        this.emFeverMode = true;
        
        this.particles.start(); 

        this.trailTimer = this.time.addEvent({
            delay: 70, 
            callback: this.criarRastroFantasma,
            callbackScope: this,
            loop: true
        });

        this.time.delayedCall(5000, () => { this.desativarFeverMode(); });
    }

    desativarFeverMode() {
        this.emFeverMode = false;
        this.particles.stop();
        if (this.trailTimer) this.trailTimer.remove();
        this.feverCurrent = 0;
        this.atualizarFeverBar();
        this.player.clearTint();
    }

    criarRastroFantasma() {
        const ghost = this.add.image(this.player.x, this.player.y, this.player.texture.key);
        ghost.setDisplaySize(this.player.displayWidth, this.player.displayHeight);
        ghost.scaleX = this.player.scaleX; 
        
        // Efeito elegante
        ghost.setAlpha(0.6);
        ghost.setTint(0xffd700);
        ghost.setBlendMode(Phaser.BlendModes.ADD); 
        ghost.setDepth(9);
        
        // O fantasma também herda a rotação se a gente quiser, 
        // mas na Jessica a rotação é sempre 0, então ok.
        
        this.tweens.add({
            targets: ghost, 
            alpha: 0, 
            scaleX: ghost.scaleX * 1.1,
            scaleY: ghost.scaleY * 1.1,
            duration: 500,
            onComplete: () => { ghost.destroy(); }
        });
    }

    update() {
        if(!this.jogoRolando) return;
        const vel = this.emFeverMode ? 1000 : 700;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-vel);
            if (this.player.texture.key !== 'player_andando') {
                this.player.setTexture('player_andando');
                this.forceSize();
            }
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(vel);
            if (this.player.texture.key !== 'player_normal') {
                this.player.setTexture('player_normal');
                this.forceSize();
            }
        } else {
            this.player.setVelocityX(0);
        }
    }

    forceSize() {
        // AUMENTADO: Jessica agora ocupa 45% da altura da tela (antes era 35%)
        this.player.displayHeight = this.scale.height * 0.45;
        this.player.scaleX = this.player.scaleY; // Mantém proporção
    }

    atualizarTimer() {
        this.tempoRestante--;
        let seg = this.tempoRestante < 10 ? '0' + this.tempoRestante : this.tempoRestante;
        this.timerText.setText(`00:${seg}`);
        if(this.tempoRestante <= 0) this.fimDaFase();
    }

    fimDaFase() {
        this.jogoRolando = false;
        this.physics.pause();
        this.timerEvento.remove();
        this.spawnEvento.remove();
        this.items.clear(true, true);
        this.desativarFeverMode(); 
        this.mostrarTelaVitoria();
    }

    mostrarTelaVitoria() {
        const cx = this.scale.width/2; const cy = this.scale.height/2;
        const win = this.add.container(0,0).setDepth(300);
        let overlay = this.add.graphics(); overlay.fillStyle(0x000000, 0.9); overlay.fillRect(0,0,this.scale.width,this.scale.height);
        
        let textoTitulo = this.level < 3 ? `FASE ${this.level} CONCLUÍDA!` : "PARABÉNS!";
        let textoBotao = this.level < 3 ? " PRÓXIMA FASE " : " REINICIAR ";

        let tit = this.add.text(cx, cy-100, textoTitulo, { fontSize: '40px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);
        let pts = this.add.text(cx, cy, `Total: ${this.score}`, { fontSize: '60px', color: '#fff', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);
        let btnBg = this.add.rectangle(cx, cy+120, 300, 60, 0xffd700).setInteractive({cursor:'pointer'});
        let btnTxt = this.add.text(cx, cy+120, textoBotao, { fontSize: '24px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (this.level < 3) {
                this.scene.restart({ level: this.level + 1, score: this.score });
            } else {
                window.location.reload(); 
            }
        });
        win.add([overlay, tit, pts, btnBg, btnTxt]);
    }

    atualizarFeverBar() { 
        if(this.feverBarFill) { 
            this.feverBarFill.clear(); 
            this.feverBarFill.fillStyle(0xffd700); 
            this.feverBarFill.fillRoundedRect(15, 45, 170 * (this.feverCurrent/100), 12, 4); 
        } 
    }
    criarPlacar() { 
        this.containerPlacar = this.add.container(20, 20).setDepth(20); 
        let bg = this.add.graphics(); bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(0, 0, 200, 70, 15); 
        this.scoreText = this.add.text(50, 12, 'Brilho: 0', { fontSize: '22px', fontFamily: 'Montserrat', color: '#ffffff' }); 
        this.feverBarFill = this.add.graphics(); 
        this.containerPlacar.add([bg, this.scoreText, this.feverBarFill]); 
        this.atualizarFeverBar(); 
    }
    criarTimerUI() { 
        this.timerContainer = this.add.container(this.scale.width/2, 45).setDepth(21); 
        let bg = this.add.graphics(); bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(-70, -25, 140, 50, 15); 
        this.timerText = this.add.text(0, 0, '00:30', { fontSize: '32px', color: '#ffffff', fontFamily: 'Montserrat' }).setOrigin(0.5); 
        this.timerContainer.add([bg, this.timerText]); 
    }
    resize(gameSize) {
        const w = gameSize.width; const h = gameSize.height;
        if (this.bg && this.bg.type === 'Image') {
            this.bg.setPosition(w/2, h/2);
            const scale = Math.max(w / this.bg.width, h / this.bg.height);
            this.bg.setScale(scale).setScrollFactor(0);
        } else if (this.bg) { this.bg.setSize(w, h); this.bg.setPosition(w/2, h/2); }
        if (this.player) { this.player.y = h*0.9; this.forceSize(); }
        if (this.timerContainer) this.timerContainer.setPosition(w/2, 45);
        if (this.containerPlacar) this.containerPlacar.setPosition(20, 20);
    }
}