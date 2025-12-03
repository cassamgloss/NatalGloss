class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    // Recebe dados da fase anterior ou do menu
    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        console.log(`Iniciando Fase ${this.level} | Pontos: ${this.score}`);
    }

    create() {
        this.jogoRolando = false; 
        this.emFeverMode = false;
        this.feverCurrent = 0;
        this.tempoRestante = 30; // 30 segundos por fase
        
        // CONFIGURAÇÃO DE DIFICULDADE POR FASE
        // Fase 1: Vel 200 | Fase 2: Vel 350 | Fase 3: Vel 500
        this.velocidadeQueda = 200 + ((this.level - 1) * 150); 
        // Intervalo de spawn diminui a cada fase (mais itens)
        this.spawnRate = Math.max(400, 1000 - ((this.level - 1) * 300)); 

        const w = this.scale.width;
        const h = this.scale.height;

        // 1. FUNDO (Muda conforme a fase se tiver imagens bg_fase2, etc)
        const bgKey = `bg_fase${this.level}`;
        if (this.textures.exists(bgKey)) {
            this.bg = this.add.image(w/2, h/2, bgKey).setDisplaySize(w, h);
        } else {
            this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222);
        }

        // 2. PLAYER
        this.player = this.physics.add.sprite(w/2, h*0.9, 'player_normal');
        this.player.displayHeight = h * 0.35; 
        this.player.scaleX = this.player.scaleY;
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);

        // 3. GRUPOS
        this.items = this.physics.add.group();
        this.physics.add.overlap(this.player, this.items, this.coletarItem, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();

        // 4. UI
        this.criarPlacar();
        this.criarTimerUI();
        this.scoreText.setText('Brilho: ' + this.score);

// 5. MÚSICA E INÍCIO
        if (this.level === 1 && this.cache.audio.exists('musica_fase1')) {
            this.bgMusic = this.sound.add('musica_fase1', { loop: true, volume: 0.5 });
            this.bgMusic.play();
        }

        // --- ALTERAÇÃO AQUI ---
        // Remova a chamada para 'InstructionsScene' antiga e vá direto para o jogo
        // pois já mostramos as instruções no HTML
        this.iniciarGameplay(); 

        this.scale.on('resize', this.resize, this);
    }

    iniciarGameplay() {
        this.jogoRolando = true;
        // Timer do Jogo
        this.timerEvento = this.time.addEvent({ delay: 1000, callback: this.atualizarTimer, callbackScope: this, loop: true });
        // Spawner de Itens
        this.spawnEvento = this.time.addEvent({ delay: this.spawnRate, callback: this.spawnItem, callbackScope: this, loop: true });
    }

    spawnItem() {
        if (!this.jogoRolando) return;
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const tipo = Phaser.Math.RND.pick(['bisnaga', 'cartucho']);
        
        let item = this.items.create(x, -50, tipo);
        if(item) {
            item.setScale(0.07);
            item.setVelocityY(this.velocidadeQueda); // Velocidade baseada na fase
            item.setDepth(5);
        }
    }

    coletarItem(player, item) {
        item.destroy();
        let pts = this.emFeverMode ? 20 : 10;
        this.score += pts;
        this.scoreText.setText('Brilho: ' + this.score);

        // Lógica Fever
        if(!this.emFeverMode) {
            this.feverCurrent += 15; // Enche mais rápido
            this.atualizarFeverBar();
            if(this.feverCurrent >= 100) this.ativarFeverMode();
        }
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
        this.player.displayHeight = this.scale.height * 0.35;
        this.player.scaleX = this.player.scaleY;
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
        
        // Limpa itens da tela
        this.items.clear(true, true);

        this.mostrarTelaVitoria();
    }

    mostrarTelaVitoria() {
        const cx = this.scale.width/2; const cy = this.scale.height/2;
        const win = this.add.container(0,0).setDepth(300);
        
        let overlay = this.add.graphics(); overlay.fillStyle(0x000000, 0.9); overlay.fillRect(0,0,this.scale.width,this.scale.height);
        
        // Texto dinâmico: Fase X concluída ou Fim de Jogo
        let textoTitulo = this.level < 3 ? `FASE ${this.level} CONCLUÍDA!` : "PARABÉNS!";
        let textoBotao = this.level < 3 ? " PRÓXIMA FASE " : " VER BONIFICAÇÃO ";

        let tit = this.add.text(cx, cy-100, textoTitulo, { fontSize: '40px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);
        let pts = this.add.text(cx, cy, `Total: ${this.score}`, { fontSize: '60px', color: '#fff', fontStyle: 'bold', fontFamily: 'Montserrat' }).setOrigin(0.5);
        
        let btnBg = this.add.rectangle(cx, cy+120, 300, 60, 0xffd700).setInteractive({cursor:'pointer'});
        let btnTxt = this.add.text(cx, cy+120, textoBotao, { fontSize: '24px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (this.level < 3) {
                // REINICIA A CENA PARA A PRÓXIMA FASE
                this.scene.restart({ level: this.level + 1, score: this.score });
            } else {
                // FIM DO JOGO (Aqui você poderia chamar uma cena final de bonificação)
                alert(`Fim de jogo! Pontuação Final: ${this.score}`);
                // this.scene.start('BonusScene'); // Futuro
                window.location.reload(); // Por enquanto reinicia o site
            }
        });

        win.add([overlay, tit, pts, btnBg, btnTxt]);
    }

    // --- FUNÇÕES UI (Mantidas) ---
    ativarFeverMode() { this.emFeverMode = true; this.player.setTint(0xffd700); this.time.delayedCall(5000, () => { this.emFeverMode = false; this.player.clearTint(); this.feverCurrent = 0; this.atualizarFeverBar(); }); }
    atualizarFeverBar() { if(this.feverBarFill) { this.feverBarFill.clear(); this.feverBarFill.fillStyle(0xffd700); this.feverBarFill.fillRoundedRect(15, 45, 170 * (this.feverCurrent/100), 12, 4); } }
    criarPlacar() { this.containerPlacar = this.add.container(20, 20).setDepth(20); let bg = this.add.graphics(); bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(0, 0, 200, 70, 15); this.scoreText = this.add.text(50, 12, 'Brilho: 0', { fontSize: '22px', fontFamily: 'Montserrat', color: '#ffffff' }); this.feverBarFill = this.add.graphics(); this.containerPlacar.add([bg, this.scoreText, this.feverBarFill]); this.atualizarFeverBar(); }
    criarTimerUI() { this.timerContainer = this.add.container(this.scale.width/2, 45).setDepth(21); let bg = this.add.graphics(); bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(-70, -25, 140, 50, 15); this.timerText = this.add.text(0, 0, '00:30', { fontSize: '32px', color: '#ffffff', fontFamily: 'Montserrat' }).setOrigin(0.5); this.timerContainer.add([bg, this.timerText]); }
// --- GameScene.js ---

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        // 1. AJUSTE DO FUNDO (Lógica "Cover" - Sem distorção)
        if (this.bg && this.bg.type === 'Image') {
            this.bg.setPosition(width / 2, height / 2);
            
            // Calcula a escala necessária para cobrir largura E altura
            const scaleX = width / this.bg.width;
            const scaleY = height / this.bg.height;
            const scale = Math.max(scaleX, scaleY); // Usa a maior escala para cobrir tudo
            
            this.bg.setScale(scale).setScrollFactor(0);
        }

        // 2. AJUSTE DO JOGADOR
        if (this.player) {
            this.player.y = height * 0.90; // Mantém nos 90% da altura
            this.forceSize(); // Reaplica o tamanho correto da Jessica
        }

        // 3. AJUSTE DA UI DO JOGO (Placar e Timer)
        if (this.timerContainer) this.timerContainer.setPosition(width / 2, 45);
        if (this.containerPlacar) this.containerPlacar.setPosition(20, 20);
    }
}