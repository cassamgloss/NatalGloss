const UI = {
    somAtivo: true, jogoIniciado: false, musicaMenuTocando: false, modoJogo: 'historia',
    menuMusic: new Audio('assets/audio/bmg/menu.mp3'),
    sfxClick: new Audio('assets/audio/efeitos-sonoros/botao-click.mp3'),
    sfxBoom: new Audio('assets/audio/efeitos-sonoros/boom.mp3'),

    init: function() {
        this.menuMusic.loop = true; this.menuMusic.volume = 0.5; this.sfxBoom.volume = 1.0;
        this.destrancarAudio();
        const unlock = () => this.destrancarAudio();
        document.addEventListener('click', unlock, { once: true }); document.addEventListener('keydown', unlock, { once: true });
        this.criarNeveAmbiente(); this.prepararTransicao(); this.limparContagemAntiga(); window.UI = this; 
    },
    destrancarAudio: function() { if (this.jogoRolando || !this.somAtivo || this.musicaMenuTocando) return; const p = this.menuMusic.play(); if (p !== undefined) p.then(() => { this.musicaMenuTocando = true; }).catch(() => {}); },
    alternarSom: function(e) { if(e) e.stopPropagation(); this.somAtivo = !this.somAtivo; const btn = document.getElementById('btn-som'); if (this.somAtivo) { if(btn) btn.classList.remove('muted'); if(!this.jogoIniciado) this.menuMusic.play(); if(window.game) window.game.sound.mute = false; } else { if(btn) btn.classList.add('muted'); this.menuMusic.pause(); if(window.game) window.game.sound.mute = true; } },
    mostrarRanking: function() { if(this.somAtivo) this.sfxClick.cloneNode(true).play().catch(()=>{}); setTimeout(() => alert('O Ranking estará disponível na próxima atualização!'), 100); },

    // --- MODOS DE JOGO ---
    iniciarJogo: function() {
        if(this.jogoIniciado) return;
        this.modoJogo = 'historia'; 
        this.transicaoEntrada();
    },
    iniciarBrilhoEterno: function() {
        if(this.jogoIniciado) return;
        this.modoJogo = 'eterno'; 
        this.transicaoEntrada();
    },

    transicaoEntrada: function() {
        this.jogoIniciado = true;
        if(this.somAtivo) this.sfxClick.play();
        const flake = document.getElementById('big-flake');
        if(flake) { void flake.offsetWidth; flake.classList.add('falling'); }
        let vol = 0.5; let fade = setInterval(() => { if(vol > 0.05) { vol -= 0.05; this.menuMusic.volume = vol; } else { clearInterval(fade); this.menuMusic.pause(); } }, 100);

        setTimeout(() => {
            const uiLayer = document.getElementById('ui-layer'); const snowLayer = document.getElementById('snow-layer');
            if(uiLayer) uiLayer.style.display = 'none'; if(snowLayer) snowLayer.style.display = 'none';
            
            const bg = document.getElementById('menu-bg');
            if(bg) { 
                let bgImg = this.modoJogo === 'eterno' ? 'bg-fase2.png' : 'bg-fase1.png';
                bg.style.backgroundImage = `url('assets/img/${bgImg}')`; 
                bg.style.filter = "brightness(0.5)"; 
            }
            
            // --- CORREÇÃO: AGORA SEMPRE ABRE INSTRUÇÕES ---
            if (this.modoJogo === 'eterno') {
                this.configurarInstrucoesFase('eterno'); // Configura texto específico
            } else {
                this.configurarInstrucoesFase(1);
            }
            
            const instr = document.getElementById('instructions-layer');
            if(instr) instr.classList.remove('hidden');

        }, 1200);
    },

    abrirInstrucoesFase: function(nivel) {
        const bg = document.getElementById('menu-bg');
        let bgImg = nivel === 2 ? 'bg-fase2.png' : 'bg-fase1.png';
        if(bg) { bg.style.display = 'block'; bg.style.backgroundImage = `url('assets/img/${bgImg}')`; bg.style.filter = "brightness(0.5)"; }
        this.configurarInstrucoesFase(nivel);
        const instr = document.getElementById('instructions-layer');
        if(instr) { instr.style.display = 'flex'; instr.classList.remove('hidden'); }
    },

configurarInstrucoesFase: function(nivel) {
        const title = document.getElementById('instr-title'); 
        const c1Title = document.getElementById('col1-title'); const c1Text = document.getElementById('col1-text'); const c1Icons = document.getElementById('col1-icons'); 
        const c2Title = document.getElementById('col2-title'); const c2Text = document.getElementById('col2-text'); const c2Warn = document.getElementById('col2-warn'); 
        const imgCenter = document.getElementById('img-center'); 

        // Reseta o estilo para o padrão do CSS (para a Jéssica ficar grande)
        if(imgCenter) imgCenter.style.height = ''; 

        // --- INSTRUÇÕES MODO HISTÓRIA ---
        if (nivel === 1) {
            title.innerText = "SUA MISSÃO"; c1Title.innerText = "OBJETIVO"; c1Text.innerHTML = "Ajude a Jéssica a coletar as <strong>Bisnagas</strong> e <strong>Cartuchos</strong>."; 
            c1Icons.innerHTML = '<img src="assets/img/bisnaga.png" class="icon-float"><img src="assets/img/cartucho.png" class="icon-float delay">'; 
            c2Title.innerText = "BRILHO MÁXIMO"; c2Title.style.color = "#ffd700"; c2Text.innerHTML = "Colete <strong>5 produtos</strong> seguidos para ativar a velocidade turbo!"; 
            c2Warn.innerText = "⚠️ Se perder um item, a contagem reseta!"; c2Warn.style.display = "block"; 
            if(imgCenter) imgCenter.src = "assets/img/jessica-in-game-box.png";
        
        } else if (nivel === 2) {
            title.innerText = "FASE 2"; c1Title.innerText = "RITMO ACELERADO"; c1Text.innerHTML = "Cuidado! Agora caem mais produtos e em maior velocidade."; 
            c1Icons.innerHTML = '<img src="assets/img/bisnaga.png" class="icon-float">'; 
            c2Title.innerText = "CUIDADO COM O GELO"; c2Title.style.color = "#00e6e6"; c2Text.innerHTML = "Evite os <strong>Flocos de Neve</strong>! Eles congelam a Jéssica por 1.5s."; 
            c2Warn.style.display = "none"; 
            if(imgCenter) imgCenter.src = "assets/img/snowflake-item.png";
        
        } else if (nivel >= 3 && nivel !== 'eterno') {
            title.innerText = "FASE FINAL"; c1Title.innerText = "TESOURO RARO"; c1Text.innerHTML = "Fique atento! A lendária <strong>Bisnaga Dourada</strong> aparecerá 3 vezes."; 
            c1Icons.innerHTML = '<img src="assets/img/bisnaga-gold.png" class="icon-float" style="filter: drop-shadow(0 0 10px gold);">'; 
            c2Title.innerText = "VALE MUITO!"; c2Title.style.color = "#ffd700"; c2Text.innerHTML = "Cada Bisnaga Dourada vale <strong>50 PONTOS</strong>! Não deixe cair!"; 
            c2Warn.innerText = "⚠️ O Gelo ainda está por aqui!"; c2Warn.style.display = "block"; 
            if(imgCenter) imgCenter.src = "assets/img/jessica-in-game-box.png";
        } 
        
        // --- INSTRUÇÕES MODO ETERNO ---
        else if (nivel === 'eterno') {
            title.innerText = "BRILHO ETERNO";
            
            c1Title.innerText = "SOBREVIVÊNCIA"; 
            c1Text.innerHTML = "Você tem <strong>5 VIDAS</strong>. Deixou cair ou pegou gelo? Perde vida!";
            c1Icons.innerHTML = '<img src="assets/img/icone-coracao.png" class="icon-float" style="width: 60px;">';
            
            c2Title.innerText = "PROTEÇÃO"; c2Title.style.color = "#ffaa00";
            c2Text.innerHTML = "Pegue o <strong>Cristal Laranja</strong> para ganhar um escudo contra o próximo erro.";
            c2Warn.innerText = "⚠️ A velocidade só aumenta!"; c2Warn.style.display = "block";
            
            if(imgCenter) {
                imgCenter.src = "assets/img/item-escudo.png";
                // --- AJUSTE AQUI: Força um tamanho menor (180px) para não estourar a tela ---
                imgCenter.style.height = '180px';
                imgCenter.style.width = 'auto';
            }
        }
    },

    fecharInstrucoes: function() {
        if(this.somAtivo) this.sfxClick.play();
        const instr = document.getElementById('instructions-layer'); if(instr) instr.style.display = 'none';
        if (!window.gameScene) this.iniciarPhaser();
        this.rodarContagem();
    },

    rodarContagem: function() {
        this.limparContagemAntiga();
        const layer = document.createElement('div'); layer.id = 'countdown-layer'; const num = document.createElement('div'); num.id = 'countdown-number'; layer.appendChild(num); document.body.appendChild(layer);
        let c = 3; num.innerText = c; num.classList.add('pop-in');
        if(this.somAtivo) { this.sfxBoom.currentTime = 0; this.sfxBoom.playbackRate = 1.0; this.sfxBoom.play().catch(()=>{}); }
        let timer = setInterval(() => {
            c--;
            if(c > 0) { 
                if(this.somAtivo) { this.sfxBoom.currentTime = 0; this.sfxBoom.playbackRate = 1.0; this.sfxBoom.play().catch(()=>{}); }
                num.classList.remove('pop-in'); void num.offsetWidth; num.innerText = c; num.classList.add('pop-in'); 
            } else if (c === 0) { 
                if(this.somAtivo) { this.sfxBoom.currentTime = 0; this.sfxBoom.playbackRate = 0.5; this.sfxBoom.play().catch(()=>{}); }
                num.innerText = "BRILHE!"; 
            } else {
                clearInterval(timer); layer.remove();
                const bg = document.getElementById('menu-bg'); if(bg) bg.style.display = 'none';
                if (window.gameScene) window.gameScene.iniciarGameplay();
            }
        }, 1000);
    },

    limparContagemAntiga: function() { const old = document.getElementById('countdown-layer'); if(old) old.remove(); },
    iniciarPhaser: function() { 
        if (window.game && window.game.scene) { 
            window.game.scene.start('GameScene', { level: 1, score: 0, mode: this.modoJogo || 'historia' }); 
            window.game.sound.mute = !this.somAtivo; 
        } 
    },
    prepararTransicao: function() { const layer = document.getElementById('transition-layer'); if(layer) layer.innerHTML = '<img id="big-flake" class="giant-flake giant-flake-spin" src="assets/img/snowflake-1.svg" style="filter: drop-shadow(0 0 20px rgba(255,255,255,0.8));">'; },
    criarNeveAmbiente: function() { /* Mantém igual */ const container = document.getElementById('snow-layer'); if (!container) return; container.innerHTML = ''; container.style.display = 'block'; const qtd = 150; for (let i = 0; i < qtd; i++) { let floco; if (Math.random() > 0.4) { floco = document.createElement('img'); floco.classList.add('snowflake'); floco.src = Math.random() > 0.5 ? 'assets/img/snowflake-1.svg' : 'assets/img/snowflake-2.svg'; floco.style.width = (Math.random() * 25 + 15) + 'px'; } else { floco = document.createElement('div'); floco.classList.add('snowflake', 'snow-dot'); let s = (Math.random() * 4 + 3) + 'px'; floco.style.width = s; floco.style.height = s; } floco.style.left = Math.random() * 100 + 'vw'; floco.style.opacity = Math.random() * 0.5 + 0.3; floco.style.animationDuration = (Math.random() * 10 + 8) + 's'; floco.style.animationDelay = `-${Math.random() * 15}s`; let dt = Math.random(); if (dt < 0.33) floco.style.animationName = 'snowfall-left'; else if (dt < 0.66) floco.style.animationName = 'snowfall-right'; else floco.style.animationName = 'snowfall-straight'; floco.style.animationTimingFunction = dt < 0.66 ? 'ease-in-out' : 'linear'; container.appendChild(floco); } }
};
UI.init();