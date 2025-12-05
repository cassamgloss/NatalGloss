class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.gameMode = data.mode || 'historia'; 
    }

    create() {
        window.gameScene = this;
        this.jogoRolando = false;
        this.emFeverMode = false;
        this.congelada = false;
        this.fatorLentidao = 1;
        this.feverCurrent = 0;

        // Variáveis Modo Eterno
        this.vidas = 5;
        this.temEscudo = false;
        this.pontosParaVida = 750;
        this.ultimoMilhar = 0;
        this.dificuldadeMultiplier = 1;
        this.chanceGelo = 0.05;
        this.geloNaTela = false;

        const w = this.scale.width;
        const h = this.scale.height;

        // Fundo
        let bgTex = 'bg_fase1';
        if (this.gameMode === 'eterno') bgTex = 'bg_fase2'; 
        else if (this.level >= 2) bgTex = `bg_fase${Math.min(this.level, 2)}`;
        if (!this.textures.exists(bgTex)) bgTex = 'bg_fase1';
        
        this.bg = this.add.image(w / 2, h / 2, bgTex);

        // Jogador
        this.player = this.physics.add.sprite(w / 2, h, 'player_normal');
        this.player.setScale(0.5); 
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
        this.player.body.setOffset(this.player.width * 0.25, this.player.height * 0.2);
        this.player.body.setAllowGravity(false);
        this.player.body.checkCollision.up = false;
        this.player.body.checkCollision.down = false;
        this.player.setVelocity(0, 0);

        this.items = this.physics.add.group();
        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.overlap(this.player, this.items, this.interagirItem, null, this);

        this.resize({ width: w, height: h });
        this.configurarDificuldade();

        // UI
        this.criarPlacar();
        if (this.gameMode === 'historia') {
            this.criarTimerUI();
        } else {
            this.criarVidasUI();
        }
        this.scoreText.setText('Brilho: ' + this.score);

        // Música
        this.sound.stopAll();
        let musicKey = 'musica_fase1';
        if (this.gameMode === 'eterno') musicKey = 'musica_fase2';
        else if (this.level >= 2) musicKey = 'musica_fase2';
        
        if (this.cache.audio.exists(musicKey)) {
            this.bgMusic = this.sound.add(musicKey, { loop: true, volume: 0.5 });
            this.bgMusic.play();
        }

        this.criarTexturasParticulas();
        this.configurarEmissores();

        // Início
        if (this.gameMode === 'eterno' || this.level === 1) {
            if (window.startGameImmediately) { 
                this.iniciarGameplay(); 
                window.startGameImmediately = false; 
            }
        } else {
            this.time.delayedCall(100, () => {
                if (window.UI) window.UI.abrirInstrucoesFase(this.level);
            });
        }
        
        this.scale.on('resize', this.resize, this);
    }

    configurarDificuldade() {
        if (this.gameMode === 'eterno') {
            this.velocidadeQueda = 200; 
            this.spawnRate = 1200;
        } else {
            if (this.level === 1) { this.tempoRestante = 30; this.velocidadeQueda = 200; this.spawnRate = 900; }
            else if (this.level === 2) { this.tempoRestante = 50; this.velocidadeQueda = 300; this.spawnRate = 700; }
            else { this.tempoRestante = 70; this.velocidadeQueda = 350; this.spawnRate = 600; }
        }
    }

    iniciarGameplay() {
        if (this.jogoRolando) return;
        this.jogoRolando = true;

        this.spawnEvento = this.time.addEvent({ delay: this.spawnRate, callback: this.spawnItem, callbackScope: this, loop: true });

        if (this.gameMode === 'historia') {
            this.timerEvento = this.time.addEvent({ delay: 1000, callback: this.atualizarTimer, callbackScope: this, loop: true });
            if (this.level >= 2) this.obstacleTimer = this.time.addEvent({ delay: 5000, callback: this.spawnObstacle, callbackScope: this, loop: true });
            if (this.level >= 3) {
                this.time.delayedCall(3000, () => this.spawnGoldItem());
                this.time.delayedCall(35000, () => this.spawnGoldItem());
                this.time.delayedCall(60000, () => this.spawnGoldItem());
            }
        } else {
            // MODO ETERNO
            this.time.addEvent({ delay: 15000, callback: this.aumentarDificuldadeEterna, callbackScope: this, loop: true });
        }
    }

aumentarDificuldadeEterna() {
        if (!this.jogoRolando) return;
        this.dificuldadeMultiplier += 0.1;
        
        // Velocidade e Spawn (Mantidos)
        this.velocidadeQueda = Math.min(600, 200 + (this.dificuldadeMultiplier * 30));
        let newRate = Math.max(400, 1200 - (this.dificuldadeMultiplier * 100));
        this.spawnEvento.delay = newRate;
        
        if (!this.chanceGelo) this.chanceGelo = 0.05;
        
        // AJUSTE 3: Aumenta +5% a cada 15s, mas agora vai até 45% (antes travava em 30%)
        // Isso vai deixar bem desafiador com o tempo!
        this.chanceGelo = Math.min(0.45, this.chanceGelo + 0.05);
        
        console.log(`Dificuldade UP! Gelo: ${Math.floor(this.chanceGelo*100)}%`);
    }

    spawnItem() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        let options = ['bisnaga', 'cartucho'];
        
        if (this.gameMode === 'eterno' && Math.random() < 0.05 && !this.temEscudo) {
            options = ['item_escudo'];
        }

        let tipo = Phaser.Math.RND.pick(options);
        
        if (this.gameMode === 'eterno' && Math.random() < (this.chanceGelo || 0)) {
            if (!this.geloNaTela) {
                tipo = 'snowflake_item';
            }
        }
        
        if (this.gameMode === 'historia' && this.level >= 2 && Math.random() < 0.2) {
            tipo = 'snowflake_item';
        }

        if (!this.textures.exists(tipo)) return;

        let item = this.items.create(x, -200, tipo);
        if (item) {
            item.tipoObj = 'produto';
            if (tipo === 'snowflake_item') {
                item.tipoObj = 'gelo';
                this.geloNaTela = true; 
            }
            if (tipo === 'item_escudo') item.tipoObj = 'escudo';

            let escala = 0.07;
            if (item.tipoObj === 'gelo') escala = 0.15;
            if (item.tipoObj === 'escudo') escala = 0.35; 
            
            item.setScale(escala);
            
            let velFinal = this.velocidadeQueda;
            if (this.gameMode === 'eterno' && this.congelada) {
                velFinal = velFinal * 0.8; 
            }
            item.setVelocityY(velFinal);
            
            item.setDepth(5);
            
            if (item.tipoObj === 'produto') {
                if (this.textures.exists('soft_glow')) {
                    let rastro = this.add.particles(0, 0, 'soft_glow', {
                        speedX: { min: -10, max: 10 }, speedY: { min: -20, max: 0 }, 
                        scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
                        lifespan: 700, blendMode: 'ADD', frequency: 15, tint: 0xffd700, follow: item
                    });
                    rastro.setDepth(4); item.setData('rastro', rastro);
                }
            }
            if (item.tipoObj === 'escudo' && item.postFX) {
                item.postFX.addGlow(0xffaa00, 2, 0, false, 0.1, 20);
            }
        }
    }

    spawnObstacle() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        if (!this.textures.exists('snowflake_item')) return;
        let ice = this.items.create(x, -200, 'snowflake_item');
        ice.tipoObj = 'gelo'; ice.setScale(0.15);
        ice.setVelocityY(this.velocidadeQueda); ice.setDepth(6);
    }

    spawnGoldItem() {
        if (!this.jogoRolando) return;
        if (!this.textures.exists('bisnaga_gold')) return;
        this.sound.play('sfx_jackpot', { volume: 1.0 });
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        let item = this.items.create(x, -200, 'bisnaga_gold');
        item.tipoObj = 'gold'; item.setScale(0.08); item.setVelocityY(450); item.setDepth(6);
        if (item.postFX) item.postFX.addGlow(0xffd700, 2, 0, false, 0.1, 30);
        if (this.textures.exists('soft_glow')) {
            let rastro = this.add.particles(0, 0, 'soft_glow', { speed: 20, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, lifespan: 800, blendMode: 'ADD', frequency: 10, tint: 0xffd700, follow: item });
            rastro.setDepth(5); item.setData('rastro', rastro);
        }
    }

    interagirItem(player, item) {
        if (item.tipoObj === 'gelo') {
            this.geloNaTela = false;
            item.destroy();
            this.tomarDano('gelo');
            return;
        }
        if (item.tipoObj === 'escudo') {
            item.destroy();
            this.ativarEscudo();
            return;
        }
        this.coletarItem(item);
    }
    
    ativarEscudo() {
        if (this.temEscudo) return;
        this.temEscudo = true;
        this.sound.play('sfx_shield_up');
        if (this.escudoIconUI) this.escudoIconUI.setVisible(true);
        this.mostrarTextoFlutuante(this.player.x, this.player.y - 100, "PROTEGIDA!", 0xffaa00);
    }

    tomarDano(origem) {
        if (this.temEscudo) {
            this.temEscudo = false;
            if (this.escudoIconUI) this.escudoIconUI.setVisible(false);
            this.sound.play('sfx_damage', { volume: 0.5 });
            this.mostrarTextoFlutuante(this.player.x, this.player.y - 80, "ESCUDO SALVOU!", 0xffaa00);
            return;
        }
        if (this.gameMode === 'historia') {
            this.congelarJogadorTotal();
            return;
        }
        
        this.vidas--;
        this.atualizarVidasUI();
        this.sound.play('sfx_damage');
        this.cameras.main.shake(200, 0.01);
        
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            if (this.vidas > 0 && origem === 'gelo') {
                this.aplicarLentidaoEterna();
            } else {
                this.player.clearTint();
            }
        });

        if (this.vidas <= 0) this.fimDaFase();
    }

    aplicarLentidaoEterna() {
        if (this.congelada) return;
        this.congelada = true;
        this.fatorLentidao = 0.5;
        this.sound.play('sfx_ice', { volume: 0.8 });
        this.player.setTint(0x00ffff);
        
        this.items.children.each((item) => {
            if (item.active && item.body) {
                item.setVelocityY(item.body.velocity.y * 0.8);
            }
        });

        this.time.delayedCall(1500, () => {
            this.congelada = false;
            this.fatorLentidao = 1;
            this.player.clearTint();
            this.items.children.each((item) => {
                if (item.active && item.body) {
                    item.setVelocityY(this.velocidadeQueda);
                }
            });
        });
    }

    congelarJogadorTotal() {
        if (this.congelada) return;
        this.congelada = true;
        this.sound.play('sfx_ice', { volume: 0.8 });
        this.player.setVelocityX(0); this.player.setVelocityY(0); 
        this.player.body.enable = false;
        
        let texGelo1 = this.textures.exists('player_frozen_1') ? 'player_frozen_1' : 'player_normal';
        let texGelo2 = this.textures.exists('player_frozen_2') ? 'player_frozen_2' : 'player_andando';
        
        if (this.player.texture.key === 'player_andando') this.player.setTexture(texGelo2);
        else this.player.setTexture(texGelo1);
        
        this.player.setTint(0x99ffff); this.forceSize();
        let texto = this.add.text(this.player.x, this.player.y - this.player.displayHeight * 0.8, 'CONGELADA!', { fontFamily: 'Montserrat', fontSize: '24px', color: '#99ffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({ targets: texto, y: texto.y - 50, alpha: 0, duration: 1000, onComplete: () => texto.destroy() });
        
        this.time.delayedCall(1500, () => {
            this.congelada = false; 
            this.player.body.enable = true; 
            this.player.setTexture('player_normal'); 
            this.player.clearTint(); 
            this.forceSize();
        });
    }

    update() {
        if (!this.jogoRolando) return;

        this.player.y = this.scale.height;

        if (this.gameMode === 'historia' && this.congelada) return;

        this.items.children.each((item) => {
            if (item.active && item.y > this.scale.height + 100) {
                if (this.gameMode === 'eterno' && item.tipoObj === 'produto') {
                    this.tomarDano('chao');
                }
                
                if (item.tipoObj === 'gelo') this.geloNaTela = false;

                let rastro = item.getData('rastro');
                if (rastro) rastro.destroy();
                item.destroy();
            }
        });

        const baseVel = this.emFeverMode ? 1000 : 700;
        const velFinal = baseVel * this.fatorLentidao;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-velFinal);
            if (this.player.texture.key !== 'player_andando') { 
                this.player.setTexture('player_andando'); 
                if(!this.congelada) this.player.clearTint(); 
                this.forceSize(); 
            }
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(velFinal);
            if (this.player.texture.key !== 'player_normal') { 
                this.player.setTexture('player_normal'); 
                if(!this.congelada) this.player.clearTint(); 
                this.forceSize(); 
            }
        } else {
            this.player.setVelocityX(0);
        }

        if (this.gameMode === 'historia' && this.level >= 3 && this.tempoRestante <= 10 && this.spawnRate > 200) {
            this.spawnRate = 250; 
            if (this.spawnEvento) this.spawnEvento.delay = this.spawnRate;
        }
    }

    coletarItem(item) {
        if (this.congelada && this.gameMode === 'historia') return;
        
        const itemX = item.x; const itemY = item.y;
        
        let rastro = item.getData('rastro');
        if (rastro) { 
            rastro.stop(); 
            this.time.delayedCall(500, () => { if(rastro && rastro.active) rastro.destroy(); }); 
        }
        
        let isGold = (item.tipoObj === 'gold');
        item.destroy();

        let pts = 10;
        if (isGold) pts = 50; else if (this.emFeverMode) pts = 20;
        
        this.score += pts;
        this.scoreText.setText('Brilho: ' + this.score);
        
        if (this.gameMode === 'eterno') {
            if (Math.floor(this.score / this.pontosParaVida) > this.ultimoMilhar) {
                this.ultimoMilhar = Math.floor(this.score / this.pontosParaVida);
                this.ganharVida();
            }
        }

        this.tweens.add({ targets: this.scoreText, scale: isGold ? 1.6 : 1.3, duration: 150, yoyo: true, ease: 'Power1' });
        this.sound.play('sfx_collect', { volume: 0.6 });
        
        if (this.burstEmitter) {
            this.burstEmitter.emitParticleAt(itemX, itemY, 8);
        }
        
        this.mostrarTextoFlutuante(itemX, itemY, pts);

        if (!this.emFeverMode) {
            this.feverCurrent += isGold ? 50 : 20;
            this.atualizarFeverBar();
            if (this.feverCurrent >= 100) this.ativarFeverMode();
        }
    }

    ganharVida() {
        if (this.vidas < 5) {
            this.vidas++;
            this.atualizarVidasUI();
            this.sound.play('sfx_life_up');
            this.mostrarTextoFlutuante(this.player.x, this.player.y - 100, "+1 VIDA!", 0xff0000);
        }
    }

criarVidasUI() {
        this.vidasContainer = this.add.container(this.scale.width / 2, 55).setDepth(21);
        this.coracoes = [];
        
        // Fundo Cápsula
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.6);
        bg.lineStyle(3, 0xffd700, 1); // Borda Dourada
        
        // Cápsula larga para caber corações e escudo
        bg.fillRoundedRect(-130, -30, 260, 60, 30);
        bg.strokeRoundedRect(-130, -30, 260, 60, 30);
        
        this.vidasContainer.add(bg);
        
        // Ícone de Vida (Corações) com espaçamento ajustado
        let texCoracao = this.textures.exists('icone_coracao') ? 'icone_coracao' : 'bisnaga';
        let texEscudo = this.textures.exists('item_escudo') ? 'item_escudo' : 'bisnaga';

        for (let i = 0; i < 5; i++) {
            // Distribui os corações centralizados
            let xPos = -80 + (i * 40);
            let coracao = this.add.image(xPos, 0, texCoracao);
            coracao.setDisplaySize(32, 32); // Um pouco maior
            
            // Adiciona um brilho suave atrás do coração
            if(coracao.postFX) coracao.postFX.addGlow(0xff0000, 1, 0, false, 0.1, 10);
            
            this.vidasContainer.add(coracao);
            this.coracoes.push(coracao);
        }
        
        // Ícone do Escudo (Fica na ponta direita, destacado)
        this.escudoIconUI = this.add.image(95, 0, texEscudo);
        this.escudoIconUI.setDisplaySize(40, 40);
        this.escudoIconUI.setVisible(false);
        
        // Efeito de pulso no escudo para chamar atenção quando ativo
        this.tweens.add({
            targets: this.escudoIconUI,
            scale: '*=1.1',
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.vidasContainer.add(this.escudoIconUI);
    }

    atualizarVidasUI() {
        for (let i = 0; i < 5; i++) {
            if (i < this.vidas) this.coracoes[i].setAlpha(1); else this.coracoes[i].setAlpha(0.2);
        }
    }

    forceSize(ajustarFisica = false) {
        const h = this.scale.height;
        this.player.displayHeight = h * 0.45; this.player.scaleX = this.player.scaleY; this.player.y = h;
        if (ajustarFisica && this.player.body) {
             this.player.body.updateFromGameObject(); this.player.body.setAllowGravity(false); 
             this.player.body.checkCollision.up = false; this.player.body.checkCollision.down = false;
        }
    }

    criarTexturasParticulas() {
        if (this.textures.exists('dust_particle')) return;
        let g1 = this.make.graphics({ x: 0, y: 0, add: false }); g1.fillStyle(0xffd700, 1); g1.fillCircle(4, 4, 4); g1.generateTexture('dust_particle', 8, 8);
        if (this.textures.exists('spark_particle')) return;
        let g2 = this.make.graphics({ x: 0, y: 0, add: false }); g2.fillStyle(0xffffff, 1); g2.beginPath(); g2.moveTo(6, 0); g2.lineTo(12, 6); g2.lineTo(6, 12); g2.lineTo(0, 6); g2.closePath(); g2.fillPath(); g2.generateTexture('spark_particle', 12, 12);
        if (this.textures.exists('soft_glow')) return;
        let g3 = this.make.graphics({ x: 0, y: 0, add: false }); g3.fillStyle(0xffd700, 1); g3.fillCircle(12, 12, 12); g3.generateTexture('soft_glow', 24, 24);
    }

    configurarEmissores() {
        if (this.textures.exists('spark_particle')) {
            this.burstEmitter = this.add.particles(0, 0, 'spark_particle', {
                speed: { min: 150, max: 300 }, scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 }, lifespan: 500, blendMode: 'ADD', emitting: false
            }).setDepth(15);
        }
        if (this.textures.exists('dust_particle')) {
            this.particles = this.add.particles(0, 0, 'dust_particle', {
                speed: 50, scale: { start: 0.5, end: 0 }, blendMode: 'ADD',
                follow: this.player, emitting: false
            }).setDepth(8);
        }
    }
    
criarPlacar() {
        this.containerPlacar = this.add.container(20, 20).setDepth(20);
        
        // Fundo Semi-transparente elegante
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.6); // Preto com 60% opacidade
        bg.lineStyle(3, 0xffd700, 1); // Borda Dourada Grossa
        
        // Desenha retângulo com borda arredondada
        bg.fillRoundedRect(0, 0, 240, 70, 15);
        bg.strokeRoundedRect(0, 0, 240, 70, 15);
        
        // Texto com Sombra (Drop Shadow) para leitura perfeita
        this.scoreText = this.add.text(120, 22, 'Brilho: ' + this.score, { 
            fontSize: '26px', 
            fontFamily: 'Montserrat', 
            fontStyle: 'bold',
            color: '#ffffff' 
        }).setOrigin(0.5, 0.5);
        
        this.scoreText.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);

        // Barra de Fever (Embaixo do texto, mais fina e moderna)
        this.feverBarFill = this.add.graphics();
        
        this.containerPlacar.add([bg, this.scoreText, this.feverBarFill]);
        this.atualizarFeverBar(); 
    }
    
atualizarFeverBar() {
        if (this.feverBarFill) {
            this.feverBarFill.clear();
            this.feverBarFill.fillStyle(0xffd700); // Dourado
            // Ajustei a posição Y para 50 (pé da caixa) e altura para 8px
            this.feverBarFill.fillRoundedRect(15, 50, 210 * (this.feverCurrent / 100), 8, 4);
        }
    }
    
    criarTimerUI() { this.timerContainer = this.add.container(this.scale.width / 2, 45).setDepth(21); let bg = this.add.graphics(); bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(-70, -25, 140, 50, 15); let tempoInicial = this.tempoRestante < 10 ? '0' + this.tempoRestante : this.tempoRestante; this.timerText = this.add.text(0, 0, '00:' + tempoInicial, { fontSize: '32px', color: '#ffffff', fontFamily: 'Montserrat' }).setOrigin(0.5); this.timerContainer.add([bg, this.timerText]); }
    mostrarTextoFlutuante(x, y, textoMsg, corOverride) { let cor = corOverride ? '#' + corOverride.toString(16) : (this.emFeverMode ? '#ffd700' : '#ffffff'); let txt = (typeof textoMsg === 'number') ? '+' + textoMsg : textoMsg; let texto = this.add.text(x, y, txt, { fontFamily: 'Montserrat', fontSize: '28px', fontStyle: 'bold', color: cor, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5); texto.setDepth(20); this.tweens.add({ targets: texto, y: y - 50, alpha: 0, duration: 800, ease: 'Power1', onComplete: () => { texto.destroy(); } }); }
    ativarFeverMode() { if (this.emFeverMode) return; this.emFeverMode = true; this.sound.play('sfx_jackpot', { volume: 0.8, rate: 1.2 }); if(this.particles) this.particles.start(); this.trailTimer = this.time.addEvent({ delay: 70, callback: this.criarRastroFantasma, callbackScope: this, loop: true }); this.time.delayedCall(5000, () => { this.desativarFeverMode(); }); }
    desativarFeverMode() { this.emFeverMode = false; if(this.particles) this.particles.stop(); if (this.trailTimer) this.trailTimer.remove(); this.feverCurrent = 0; this.atualizarFeverBar(); this.player.clearTint(); }
    criarRastroFantasma() { const ghost = this.add.image(this.player.x, this.player.y, this.player.texture.key); ghost.setOrigin(this.player.originX, this.player.originY); ghost.setDisplaySize(this.player.displayWidth, this.player.displayHeight); ghost.scaleX = this.player.scaleX; ghost.setAlpha(0.6); ghost.setTint(0xffd700); ghost.setBlendMode(Phaser.BlendModes.ADD); ghost.setDepth(9); this.tweens.add({ targets: ghost, alpha: 0, scaleX: ghost.scaleX * 1.1, scaleY: ghost.scaleY * 1.1, duration: 500, onComplete: () => { ghost.destroy(); } }); }
    atualizarTimer() { this.tempoRestante--; let seg = this.tempoRestante < 10 ? '0' + this.tempoRestante : this.tempoRestante; this.timerText.setText(`00:${seg}`); if (this.tempoRestante <= 5 && !this.relogioPulsando) { this.relogioPulsando = true; this.timerText.setColor('#ff3333'); this.tweens.add({ targets: this.timerText, scale: 1.3, duration: 250, yoyo: true, loop: -1 }); } if (this.tempoRestante <= 0) this.fimDaFase(); }
    criarChuvaDeConfetes() { if(!this.textures.exists('confeti')) { let g = this.make.graphics({ x: 0, y: 0, add: false }); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 10, 10); g.generateTexture('confeti', 10, 10); } this.add.particles(0, 0, 'confeti', { x: { min: 0, max: this.scale.width }, y: -50, quantity: 2, frequency: 100, lifespan: 4000, gravityY: 100, speedY: { min: 100, max: 200 }, speedX: { min: -50, max: 50 }, scale: { start: 0.8, end: 0.5 }, rotate: { min: 0, max: 360 }, tint: [ 0xffd700, 0xffffff, 0xff0000, 0x00ff00 ], blendMode: 'ADD' }).setDepth(299); }
    resize(gameSize) { const w = gameSize.width; const h = gameSize.height; this.physics.world.setBounds(0, 0, w, h); if (this.bg && this.bg.type === 'Image') { this.bg.setPosition(w / 2, h / 2); const scale = Math.max(w / this.bg.width, h / this.bg.height); this.bg.setScale(scale).setScrollFactor(0); } else if (this.bg) { this.bg.setSize(w, h); this.bg.setPosition(w / 2, h / 2); } if (this.player) { this.player.y = h; this.forceSize(true); this.player.x = Phaser.Math.Clamp(this.player.x, 0, w); } if (this.timerContainer) this.timerContainer.setPosition(w / 2, 45); if (this.containerPlacar) this.containerPlacar.setPosition(20, 20); if (this.vidasContainer) this.vidasContainer.setPosition(w / 2, 45); }
    
    fimDaFase() {
        this.jogoRolando = false; this.physics.pause();
        if(this.timerEvento) this.timerEvento.remove();
        if(this.spawnEvento) this.spawnEvento.remove();
        this.items.clear(true, true);
        if (this.obstacleTimer) this.obstacleTimer.remove();
        this.desativarFeverMode();
        this.mostrarTelaVitoria();
    }
    
    // --- FUNÇÃO CORRIGIDA AQUI ---
    mostrarTelaVitoria() {
        const cx = this.scale.width / 2; const cy = this.scale.height / 2;
        const winContainer = this.add.container(0, 0).setDepth(300);
        let overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85); overlay.setInteractive(); overlay.alpha = 0;
        this.tweens.add({ targets: overlay, alpha: 1, duration: 500 });
        this.criarChuvaDeConfetes();
        if (!this.textures.exists('gold_particle')) { let g = this.make.graphics({ x: 0, y: 0, add: false }); g.fillStyle(0xffd700, 1); g.fillCircle(5, 5, 5); g.generateTexture('gold_particle', 10, 10); }
        const offset = Math.min(200, this.scale.width * 0.2); const jessicaX = cx - offset; const boxX = cx + offset;
        let jessicaVit = this.add.image(jessicaX, this.scale.height + 200, 'jessica_vitoria'); jessicaVit.setOrigin(0.5, 1); jessicaVit.setScale(0.55); jessicaVit.alpha = 0;
        this.tweens.add({ targets: jessicaVit, y: this.scale.height, alpha: 1, duration: 600, ease: 'Back.out' });
        const boxW = 450; const boxH = 420; const boxContainer = this.add.container(boxX, cy); boxContainer.alpha = 0; boxContainer.y += 50;
        let bgBox = this.add.graphics(); bgBox.fillStyle(0x111111, 1); bgBox.lineStyle(3, 0xffd700, 1); bgBox.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 20); bgBox.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 20);
        let headerBox = this.add.graphics(); headerBox.fillStyle(0x111111, 1); headerBox.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, 80, { tl: 20, tr: 20, bl: 0, br: 0 });
        if (bgBox.postFX) bgBox.postFX.addGlow(0xffd700, 0.4, 0, false, 0.1, 25);
        boxContainer.add([bgBox, headerBox]);
        const starParticles = this.add.particles(0, 0, 'gold_particle', { lifespan: 600, speed: { min: 150, max: 250 }, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', gravityY: 100, emitting: false }); boxContainer.add(starParticles);
        
        let estrelasGanhas = 5; 
        const starY = -boxH / 2; const starGap = 75; const arcCurve = 15; const starConfig = [{ size: 55 }, { size: 70 }, { size: 100 }, { size: 70 }, { size: 55 }]; const animOrder = [0, 4, 1, 3, 2];
        for (let i = 0; i < 5; i++) { if (i < estrelasGanhas) { const config = starConfig[i]; const xPos = (i - 2) * starGap; const distanceFromCenter = Math.abs(i - 2); const yPos = starY + (distanceFromCenter * arcCurve); let sGold = this.add.image(xPos, yPos, 'star'); sGold.setDisplaySize(config.size, config.size); sGold.clearTint(); sGold.setAlpha(1); const targetScaleX = sGold.scaleX; const targetScaleY = sGold.scaleY; sGold.setScale(0); boxContainer.add(sGold); const delayIndex = animOrder.indexOf(i); this.tweens.add({ targets: sGold, scaleX: targetScaleX, scaleY: targetScaleY, duration: 500, delay: 500 + (delayIndex * 150), ease: 'Back.out', onStart: () => { starParticles.explode(20, xPos, yPos); } }); } }
        
        let tituloTexto = (this.gameMode === 'eterno') ? "FIM DE JOGO" : (this.level < 3 ? `FASE ${this.level}` : "PARABÉNS!");
        
        // --- AQUI ESTAVAM FALTANDO AS DEFINIÇÕES ---
        let tit = this.add.text(0, -boxH / 2 + 115, tituloTexto, { fontSize: '32px', color: '#ffd700', fontStyle: '900', fontFamily: 'Raleway' }).setOrigin(0.5);
        let labelPts = this.add.text(0, -10, "PONTUAÇÃO", { fontSize: '16px', color: '#888', fontFamily: 'Raleway', letterSpacing: 2 }).setOrigin(0.5);
        let ptsText = this.add.text(0, 40, "0", { fontSize: '90px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);
        // -------------------------------------------

        this.tweens.addCounter({ from: 0, to: this.score, duration: 1500, ease: 'Power2', onUpdate: (tween) => { ptsText.setText(Math.floor(tween.getValue())); }, onComplete: () => { this.tweens.add({ targets: ptsText, scale: 1.3, duration: 200, yoyo: true, ease: 'Power1', onStart: () => ptsText.setTint(0xffffaa), onComplete: () => ptsText.clearTint() }); } });
        
        let btnTexto = (this.gameMode === 'eterno') ? "JOGAR NOVAMENTE" : (this.level < 3 ? "PRÓXIMA FASE" : "JOGAR NOVAMENTE");
        
        const btnY = boxH / 2 - 60;
        let btnBg = this.add.image(0, btnY, 'btn_gold').setInteractive({ cursor: 'pointer' });
        btnBg.setDisplaySize(300, 70); const baseScaleX = btnBg.scaleX; const baseScaleY = btnBg.scaleY;
        if (btnBg.postFX) btnBg.postFX.addShadow(0, 5, 0.1, 1, 0x000000, 2, 0.5);
        let btnLabel = this.add.text(0, btnY, btnTexto, { fontSize: '22px', color: '#3a2c1f', fontStyle: '900', fontFamily: 'Raleway' }).setOrigin(0.5); btnLabel.y += 3;
        
        btnBg.on('pointerdown', () => {
            this.sound.stopAll();
            if (this.gameMode === 'eterno') { window.location.reload(); }
            else if (this.level < 3) { this.scene.restart({ level: this.level + 1, score: this.score, mode: 'historia' }); }
            else { window.location.reload(); }
        });
        btnBg.on('pointerover', () => { this.tweens.add({ targets: btnBg, scaleX: baseScaleX * 1.05, scaleY: baseScaleY * 1.05, duration: 100 }); this.tweens.add({ targets: btnLabel, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
        btnBg.on('pointerout', () => { this.tweens.add({ targets: btnBg, scaleX: baseScaleX, scaleY: baseScaleY, duration: 100 }); this.tweens.add({ targets: btnLabel, scaleX: 1, scaleY: 1, duration: 100 }); });
        
        boxContainer.add([tit, labelPts, ptsText, btnBg, btnLabel]);
        this.tweens.add({ targets: boxContainer, y: cy, alpha: 1, duration: 500, delay: 200, ease: 'Power2' });
        winContainer.add([overlay, jessicaVit, boxContainer]);
    }
}