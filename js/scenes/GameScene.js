class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
    }

    create() {
        // 1. SINALIZADOR GLOBAL (Para a UI encontrar o jogo)
        window.gameScene = this;

        this.jogoRolando = false;
        this.emFeverMode = false;
        this.congelada = false;
        this.feverCurrent = 0;
        this.relogioPulsando = false;

        // 2. DIFICULDADE
        if (this.level === 1) {
            this.tempoRestante = 30;
            this.velocidadeQueda = 200;
            this.spawnRate = 900;
        } else if (this.level >= 2) {
            this.tempoRestante = 50;
            this.velocidadeQueda = 300;
            this.spawnRate = 700;
        }

        const w = this.scale.width;
        const h = this.scale.height;

        // 3. FUNDO
        const bgKey = `bg_fase${this.level}`;
        const tex = this.textures.exists(bgKey) ? bgKey : 'bg_fase1';
        this.bg = this.add.image(w / 2, h / 2, tex);
        
        // Sombra no Chão
        this.shadow = this.add.ellipse(w / 2, h * 0.9, 100, 20, 0x000000, 0.4).setDepth(9);

        // 4. JOGADOR
        this.player = this.physics.add.sprite(w / 2, h * 0.9, 'player_normal');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);

        // Ajusta tamanho inicial
        this.resize({ width: w, height: h });

        // 5. GRUPOS
        this.items = this.physics.add.group();
        this.physics.add.overlap(this.player, this.items, this.interagirItem, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();

        // 6. UI DO JOGO (Placar e Barra)
        // Chama as funções que agora estão expandidas lá embaixo
        this.criarPlacar();
        this.criarTimerUI();
        this.scoreText.setText('Brilho: ' + this.score);

// 7. MÚSICA INTELIGENTE
        this.sound.stopAll(); // Garante que nada da cena anterior ou menu toque

        // Define a chave da música baseado no nível (com trava no 3 se não tiver 4, 5...)
        let nivelMusica = Math.min(this.level, 3); 
        let musicKey = `musica_fase${nivelMusica}`;

        // Fallback: Se não achar a música da fase 3, tenta a 2, senão a 1
        if (!this.cache.audio.exists(musicKey)) {
            musicKey = this.level >= 2 ? 'musica_fase2' : 'musica_fase1';
        }

        if (this.cache.audio.exists(musicKey)) {
            this.bgMusic = this.sound.add(musicKey, { loop: true, volume: 0.5 });
            this.bgMusic.play();
        }

        // 8. EFEITOS
        this.criarTexturasParticulas();
        this.configurarEmissores();

// 9. CONTROLE DE FLUXO
        if (this.level === 1) {
            // FASE 1: Não fazemos nada automático aqui.
            // A cena carrega, a música toca (definida no passo 7), 
            // mas o jogo espera a UI chamar 'iniciarGameplay()' ao fim da contagem.
        } else {
            // FASE 2+: Pausa para instruções
            this.time.delayedCall(100, () => {
                if (window.UI) window.UI.abrirInstrucoesFase(this.level);
            });
        }

        this.scale.on('resize', this.resize, this);
    }

    // --- GAMEPLAY ---

    iniciarGameplay() {
        if (this.jogoRolando) return;
        console.log("GAMEPLAY INICIADO!");
        this.jogoRolando = true;

        // Inicia Timer e Spawns
        this.timerEvento = this.time.addEvent({ delay: 1000, callback: this.atualizarTimer, callbackScope: this, loop: true });
        this.spawnEvento = this.time.addEvent({ delay: this.spawnRate, callback: this.spawnItem, callbackScope: this, loop: true });

        // Gelo na Fase 2+
        if (this.level >= 2) {
            this.obstacleTimer = this.time.addEvent({ delay: 5000, callback: this.spawnObstacle, callbackScope: this, loop: true });
        }
    }

    spawnItem() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        let tipo = Phaser.Math.RND.pick(['bisnaga', 'cartucho']);

        if (this.level >= 2 && Math.random() < 0.20 && this.textures.exists('snowflake_item')) {
            tipo = 'snowflake_item';
        }

        let item = this.items.create(x, -200, tipo); // Nasce fora da tela

        if (item) {
            item.tipoObj = (tipo === 'snowflake_item') ? 'gelo' : 'produto';
            item.setScale(item.tipoObj === 'gelo' ? 0.15 : 0.07);
            item.setVelocityY(this.velocidadeQueda);
            item.setDepth(5);
            item.setAngle(Phaser.Math.Between(0, 360));
            item.setAngularVelocity(Phaser.Math.Between(-90, 90));

            if (item.tipoObj === 'gelo' && item.postFX) {
                item.postFX.addGlow(0x00ffff, 1, 0, false, 0.1, 20);
            }
        }
    }

    spawnObstacle() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        if (this.textures.exists('snowflake_item')) {
            let ice = this.items.create(x, -200, 'snowflake_item');
            ice.tipoObj = 'gelo';
            ice.setScale(0.15);
            ice.setVelocityY(this.velocidadeQueda * 0.8);
            ice.setDepth(6);
            ice.setAngularVelocity(50);
            if (ice.postFX) ice.postFX.addGlow(0x00ffff, 1, 0, false, 0.1, 20);
        }
    }

    interagirItem(player, item) {
        if (item.texture.key === 'snowflake_item' || item.tipoObj === 'gelo') {
            item.destroy();
            this.congelarJogador();
            return;
        }
        this.coletarItem(item);
    }

    congelarJogador() {
        if (this.congelada) return;
        this.congelada = true;
        this.player.setTint(0x00ffff);
        this.player.setVelocityX(0);

        let texto = this.add.text(this.player.x, this.player.y - 80, 'CONGELADA!', {
            fontFamily: 'Montserrat', fontSize: '24px', color: '#00ffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({ targets: texto, y: texto.y - 50, alpha: 0, duration: 1000, onComplete: () => texto.destroy() });

        this.time.delayedCall(1500, () => {
            this.congelada = false;
            this.player.clearTint();
        });
    }

    coletarItem(item) {
        if (this.congelada) return;
        const itemX = item.x;
        const itemY = item.y;
        item.destroy();

        let pts = this.emFeverMode ? 20 : 10;
        this.score += pts;
        this.scoreText.setText('Brilho: ' + this.score);

        this.burstEmitter.emitParticleAt(itemX, itemY, 8);
        this.mostrarTextoFlutuante(itemX, itemY, pts);

// --- CORREÇÃO AQUI ---
        // Toca direto. O Phaser busca no cache se não estiver instanciado.
        this.sound.play('sfx_collect', { volume: 0.6 });

        if (!this.emFeverMode) {
            this.feverCurrent += 20;
            this.atualizarFeverBar();
            if (this.feverCurrent >= 100) this.ativarFeverMode();
        }
    }

    // --- FUNÇÕES DE AJUDA (EXPANDIDAS - O ERRO ESTAVA AQUI) ---

    mostrarTextoFlutuante(x, y, valor) {
        let cor = this.emFeverMode ? '#ffd700' : '#ffffff';
        let texto = this.add.text(x, y, '+' + valor, { fontFamily: 'Montserrat', fontSize: '28px', fontStyle: 'bold', color: cor, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        texto.setDepth(20);
        this.tweens.add({ targets: texto, y: y - 50, alpha: 0, duration: 800, ease: 'Power1', onComplete: () => { texto.destroy(); } });
    }

    ativarFeverMode() {
        if (this.emFeverMode) return;
        this.emFeverMode = true;
        this.particles.start();
        this.trailTimer = this.time.addEvent({ delay: 70, callback: this.criarRastroFantasma, callbackScope: this, loop: true });
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
        ghost.setAlpha(0.6);
        ghost.setTint(0xffd700);
        ghost.setBlendMode(Phaser.BlendModes.ADD);
        ghost.setDepth(9);
        this.tweens.add({ targets: ghost, alpha: 0, scaleX: ghost.scaleX * 1.1, scaleY: ghost.scaleY * 1.1, duration: 500, onComplete: () => { ghost.destroy(); } });
    }

    update() {
        if (!this.jogoRolando) return;
        if (this.congelada) { this.player.setVelocityX(0); return; }

        const vel = this.emFeverMode ? 1000 : 700;

        if (this.shadow && this.player) {
            this.shadow.x = this.player.x;
            this.shadow.y = this.player.y + (this.player.displayHeight / 2) - 10;
        }

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-vel);
            if (this.player.texture.key !== 'player_andando') { this.player.setTexture('player_andando'); this.forceSize(); }
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(vel);
            if (this.player.texture.key !== 'player_normal') { this.player.setTexture('player_normal'); this.forceSize(); }
        } else {
            this.player.setVelocityX(0);
        }
    }

    forceSize() {
        this.player.displayHeight = this.scale.height * 0.45;
        this.player.scaleX = this.player.scaleY;
        if (this.shadow) {
            this.shadow.setDisplaySize(this.player.displayWidth * 0.6, this.player.displayWidth * 0.15);
        }
    }

    atualizarTimer() {
        this.tempoRestante--;
        let seg = this.tempoRestante < 10 ? '0' + this.tempoRestante : this.tempoRestante;
        this.timerText.setText(`00:${seg}`);
        if (this.tempoRestante <= 5 && !this.relogioPulsando) {
            this.relogioPulsando = true;
            this.timerText.setColor('#ff3333');
            this.tweens.add({ targets: this.timerText, scale: 1.3, duration: 250, yoyo: true, loop: -1 });
        }
        if (this.tempoRestante <= 0) this.fimDaFase();
    }

    fimDaFase() {
        this.jogoRolando = false;
        this.physics.pause();
        this.timerEvento.remove();
        this.spawnEvento.remove();
        this.items.clear(true, true);
        if (this.obstacleTimer) this.obstacleTimer.remove();

        if (this.relogioPulsando) {
            this.relogioPulsando = false;
            this.tweens.killTweensOf(this.timerText);
            this.timerText.setScale(1);
        }
        
        // Para música se quiser
        // if (this.bgMusic) this.bgMusic.stop();

        this.desativarFeverMode();
        this.mostrarTelaVitoria();
    }

    // --- FUNÇÕES GRÁFICAS (EXPANDIDAS) ---

    atualizarFeverBar() {
        if (this.feverBarFill) {
            this.feverBarFill.clear();
            this.feverBarFill.fillStyle(0xffd700);
            this.feverBarFill.fillRoundedRect(15, 45, 170 * (this.feverCurrent / 100), 12, 4);
        }
    }

    criarPlacar() {
        this.containerPlacar = this.add.container(20, 20).setDepth(20);
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(0, 0, 200, 70, 15);
        this.scoreText = this.add.text(50, 12, 'Brilho: ' + this.score, { fontSize: '22px', fontFamily: 'Montserrat', color: '#ffffff' });
        this.feverBarFill = this.add.graphics();
        this.containerPlacar.add([bg, this.scoreText, this.feverBarFill]);
        
        this.atualizarFeverBar(); // Chama a função para desenhar o estado inicial
    }

    criarTimerUI() {
        this.timerContainer = this.add.container(this.scale.width / 2, 45).setDepth(21);
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(-70, -25, 140, 50, 15);
        this.timerText = this.add.text(0, 0, '00:30', { fontSize: '32px', color: '#ffffff', fontFamily: 'Montserrat' }).setOrigin(0.5);
        this.timerContainer.add([bg, this.timerText]);
    }

    criarTexturasParticulas() {
        let g1 = this.make.graphics({ x: 0, y: 0, add: false });
        g1.fillStyle(0xffd700, 1);
        g1.fillCircle(4, 4, 4);
        g1.generateTexture('dust_particle', 8, 8);
        
        let g2 = this.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0xffffff, 1);
        g2.beginPath(); g2.moveTo(6, 0); g2.lineTo(12, 6); g2.lineTo(6, 12); g2.lineTo(0, 6); g2.closePath(); g2.fillPath();
        g2.generateTexture('spark_particle', 12, 12);
    }

    configurarEmissores() {
        this.particles = this.add.particles(0, 0, 'dust_particle', { speed: { min: 10, max: 50 }, angle: { min: 0, max: 360 }, scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, blendMode: 'ADD', lifespan: 800, frequency: 30, follow: this.player, followOffset: { y: this.player.height * 0.2 }, on: false });
        this.particles.setDepth(9);
        this.burstEmitter = this.add.particles(0, 0, 'spark_particle', { speed: { min: 150, max: 250 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, blendMode: 'ADD', lifespan: 300, gravityY: 500, on: false });
        this.burstEmitter.setDepth(15);
    }

    criarChuvaDeConfetes() {
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 10, 10); g.generateTexture('confeti', 10, 10);
        this.add.particles(0, 0, 'confeti', { x: { min: 0, max: this.scale.width }, y: -50, quantity: 2, frequency: 100, lifespan: 4000, gravityY: 100, speedY: { min: 100, max: 200 }, speedX: { min: -50, max: 50 }, scale: { start: 0.8, end: 0.5 }, rotate: { min: 0, max: 360 }, tint: [ 0xffd700, 0xffffff, 0xff0000, 0x00ff00 ], blendMode: 'ADD' }).setDepth(299);
    }

    resize(gameSize) {
        const w = gameSize.width;
        const h = gameSize.height;
        
        // Atualiza o mundo físico!
        this.physics.world.setBounds(0, 0, w, h);

        if (this.bg && this.bg.type === 'Image') {
            this.bg.setPosition(w / 2, h / 2);
            const scale = Math.max(w / this.bg.width, h / this.bg.height);
            this.bg.setScale(scale).setScrollFactor(0);
        } else if (this.bg) {
            this.bg.setSize(w, h);
            this.bg.setPosition(w / 2, h / 2);
        }
        
        if (this.player) {
            this.player.y = h * 0.9;
            this.forceSize();
        }
        if (this.timerContainer) this.timerContainer.setPosition(w / 2, 45);
        if (this.containerPlacar) this.containerPlacar.setPosition(20, 20);
    }

    // --- TELA DE VITÓRIA ---
    mostrarTelaVitoria() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const winContainer = this.add.container(0, 0).setDepth(300);

        let overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85);
        overlay.setInteractive(); overlay.alpha = 0;
        this.tweens.add({ targets: overlay, alpha: 1, duration: 500 });

        this.criarChuvaDeConfetes();

        if (!this.textures.exists('gold_particle')) {
            let g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffd700, 1); g.fillCircle(5, 5, 5);
            g.generateTexture('gold_particle', 10, 10);
        }

        const offset = Math.min(200, this.scale.width * 0.2);
        const jessicaX = cx - offset;
        const boxX = cx + offset;

        let jessicaVit = this.add.image(jessicaX, this.scale.height + 200, 'jessica_vitoria');
        jessicaVit.setOrigin(0.5, 1); jessicaVit.setScale(0.55); jessicaVit.alpha = 0;
        this.tweens.add({ targets: jessicaVit, y: this.scale.height, alpha: 1, duration: 600, ease: 'Back.out' });

        const boxW = 450; const boxH = 420;
        const boxContainer = this.add.container(boxX, cy);
        boxContainer.alpha = 0; boxContainer.y += 50;

        let bgBox = this.add.graphics();
        bgBox.fillStyle(0x111111, 1); bgBox.lineStyle(3, 0xffd700, 1);
        bgBox.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 20);
        bgBox.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 20);

        let headerBox = this.add.graphics();
        headerBox.fillStyle(0x111111, 1);
        headerBox.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, 80, { tl: 20, tr: 20, bl: 0, br: 0 });

        if (bgBox.postFX) bgBox.postFX.addGlow(0xffd700, 0.4, 0, false, 0.1, 25);

        boxContainer.add([bgBox, headerBox]);

        const starParticles = this.add.particles(0, 0, 'gold_particle', {
            lifespan: 600, speed: { min: 150, max: 250 }, scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 }, blendMode: 'ADD', gravityY: 100, emitting: false
        });
        boxContainer.add(starParticles);

        // SISTEMA DE ESTRELAS (FORÇADO 5 PARA TESTE)
        let estrelasGanhas = 5;

        const starY = -boxH / 2; const starGap = 75; const arcCurve = 15;
        const starConfig = [{ size: 55 }, { size: 70 }, { size: 100 }, { size: 70 }, { size: 55 }];
        const animOrder = [0, 4, 1, 3, 2];

        for (let i = 0; i < 5; i++) {
            if (i < estrelasGanhas) {
                const config = starConfig[i];
                const xPos = (i - 2) * starGap;
                const distanceFromCenter = Math.abs(i - 2);
                const yPos = starY + (distanceFromCenter * arcCurve);

                let sGold = this.add.image(xPos, yPos, 'star');
                sGold.setDisplaySize(config.size, config.size);
                sGold.clearTint(); sGold.setAlpha(1);

                const targetScaleX = sGold.scaleX; const targetScaleY = sGold.scaleY;
                sGold.setScale(0);

                boxContainer.add(sGold);

                const delayIndex = animOrder.indexOf(i);
                this.tweens.add({
                    targets: sGold, scaleX: targetScaleX, scaleY: targetScaleY, duration: 500, delay: 500 + (delayIndex * 150), ease: 'Back.out',
                    onStart: () => { starParticles.explode(20, xPos, yPos); }
                });
            }
        }

        let tituloTexto = this.level < 3 ? `FASE ${this.level}` : "PARABÉNS!";
        let tit = this.add.text(0, -boxH / 2 + 115, tituloTexto, { fontSize: '32px', color: '#ffd700', fontStyle: '900', fontFamily: 'Raleway' }).setOrigin(0.5);
        let labelPts = this.add.text(0, -10, "PONTUAÇÃO", { fontSize: '16px', color: '#888', fontFamily: 'Raleway', letterSpacing: 2 }).setOrigin(0.5);
        let ptsText = this.add.text(0, 40, "0", { fontSize: '90px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);

        this.tweens.addCounter({
            from: 0, to: this.score, duration: 1500, ease: 'Power2',
            onUpdate: (tween) => { ptsText.setText(Math.floor(tween.getValue())); },
            onComplete: () => {
                this.tweens.add({ targets: ptsText, scale: 1.3, duration: 200, yoyo: true, ease: 'Power1', onStart: () => ptsText.setTint(0xffffaa), onComplete: () => ptsText.clearTint() });
            }
        });

        let btnTexto = this.level < 3 ? "PRÓXIMA FASE" : "JOGAR NOVAMENTE";
        const btnY = boxH / 2 - 60;

        let btnBg = this.add.image(0, btnY, 'btn_gold').setInteractive({ cursor: 'pointer' });
        btnBg.setDisplaySize(300, 70);
        const baseScaleX = btnBg.scaleX; const baseScaleY = btnBg.scaleY;

        if (btnBg.postFX) btnBg.postFX.addShadow(0, 5, 0.1, 1, 0x000000, 2, 0.5);

        let btnLabel = this.add.text(0, btnY, btnTexto, { fontSize: '22px', color: '#3a2c1f', fontStyle: '900', fontFamily: 'Raleway' }).setOrigin(0.5);
        btnLabel.y += 3;

        btnBg.on('pointerdown', () => {
            this.sound.stopAll();
            if (this.level < 3) { this.scene.restart({ level: this.level + 1, score: this.score }); }
            else { window.location.reload(); }
        });
        btnBg.on('pointerover', () => {
            this.tweens.add({ targets: btnBg, scaleX: baseScaleX * 1.05, scaleY: baseScaleY * 1.05, duration: 100 });
            this.tweens.add({ targets: btnLabel, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        btnBg.on('pointerout', () => {
            this.tweens.add({ targets: btnBg, scaleX: baseScaleX, scaleY: baseScaleY, duration: 100 });
            this.tweens.add({ targets: btnLabel, scaleX: 1, scaleY: 1, duration: 100 });
        });

        boxContainer.add([tit, labelPts, ptsText, btnBg, btnLabel]);

        this.tweens.add({ targets: boxContainer, y: cy, alpha: 1, duration: 500, delay: 200, ease: 'Power2' });
        winContainer.add([overlay, jessicaVit, boxContainer]);
    }
}