const UI = {
    // ... (manter variáveis de início e init) ...
    somAtivo: true, jogoIniciado: false, musicaMenuTocando: false,
    menuMusic: new Audio('assets/audio/bmg/menu.mp3'),
    sfxClick: new Audio('assets/audio/efeitos-sonoros/botao-click.mp3'),

    init: function() {
        this.menuMusic.loop = true; this.menuMusic.volume = 0.5; this.destrancarAudio();
        const unlock = () => this.destrancarAudio();
        document.addEventListener('click', unlock, { once: true }); document.addEventListener('keydown', unlock, { once: true });
        this.criarNeveAmbiente(); this.prepararTransicao(); this.limparContagemAntiga(); window.UI = this; 
    },
    destrancarAudio: function() { if (this.jogoIniciado || !this.somAtivo || this.musicaMenuTocando) return; const p = this.menuMusic.play(); if (p !== undefined) p.then(() => { this.musicaMenuTocando = true; }).catch(() => {}); },
    alternarSom: function(e) { if(e) e.stopPropagation(); this.somAtivo = !this.somAtivo; const btn = document.getElementById('btn-som'); if (this.somAtivo) { if(btn) btn.classList.remove('muted'); if(!this.jogoIniciado) this.menuMusic.play(); if(window.game) window.game.sound.mute = false; } else { if(btn) btn.classList.add('muted'); this.menuMusic.pause(); if(window.game) window.game.sound.mute = true; } },
    mostrarRanking: function() { if(this.somAtivo) this.sfxClick.cloneNode(true).play().catch(()=>{}); setTimeout(() => alert('O Ranking estará disponível na próxima atualização!'), 100); },

    // Início Fase 1
    iniciarJogo: function() {
        if(this.jogoIniciado) return;
        this.jogoIniciado = true;
        if(this.somAtivo) this.sfxClick.play();
        const flake = document.getElementById('big-flake');
        if(flake) { void flake.offsetWidth; flake.classList.add('falling'); }
        let vol = 0.5; let fade = setInterval(() => { if(vol > 0.05) { vol -= 0.05; this.menuMusic.volume = vol; } else { clearInterval(fade); this.menuMusic.pause(); } }, 100);
        setTimeout(() => {
            const uiLayer = document.getElementById('ui-layer'); const snowLayer = document.getElementById('snow-layer');
            if(uiLayer) uiLayer.style.display = 'none'; if(snowLayer) snowLayer.style.display = 'none';
            const bg = document.getElementById('menu-bg');
            if(bg) { bg.style.backgroundImage = "url('assets/img/bg-fase1.png')"; bg.style.filter = "brightness(0.5)"; }
            
            // Instruções Fase 1
            this.configurarInstrucoesFase(1);
            const instr = document.getElementById('instructions-layer');
            if(instr) instr.classList.remove('hidden');
        }, 1200);
    },

    // Início Fase 2+ (Chamado pelo GameScene)
    abrirInstrucoesFase: function(nivel) {
        const bg = document.getElementById('menu-bg');
        if(bg) { bg.style.display = 'block'; bg.style.backgroundImage = `url('assets/img/bg-fase${nivel}.png')`; bg.style.filter = "brightness(0.5)"; }
        
        this.configurarInstrucoesFase(nivel);
        const instr = document.getElementById('instructions-layer');
        if(instr) { instr.style.display = 'flex'; instr.classList.remove('hidden'); }
    },

    // CONFIGURAÇÃO DOS TEXTOS
    configurarInstrucoesFase: function(nivel) {
        const title = document.getElementById('instr-title');
        const c1Title = document.getElementById('col1-title'); const c1Text = document.getElementById('col1-text'); const c1Icons = document.getElementById('col1-icons');
        const c2Title = document.getElementById('col2-title'); const c2Text = document.getElementById('col2-text'); const c2Warn = document.getElementById('col2-warn');
        const imgCenter = document.getElementById('img-center'); // Seleciona imagem central

        if (nivel === 1) {
            title.innerText = "SUA MISSÃO";
            c1Title.innerText = "OBJETIVO"; c1Text.innerHTML = "Ajude a Jéssica a coletar as <strong>Bisnagas</strong> e <strong>Cartuchos</strong>.";
            c1Icons.innerHTML = '<img src="assets/img/bisnaga.png" class="icon-float"><img src="assets/img/cartucho.png" class="icon-float delay">';
            c2Title.innerText = "BRILHO MÁXIMO"; c2Title.style.color = "#ffd700";
            c2Text.innerHTML = "Colete <strong>5 produtos</strong> seguidos para ativar a velocidade turbo!";
            c2Warn.innerText = "⚠️ Se perder um item, a contagem reseta!"; c2Warn.style.display = "block";
            // Imagem Jessica
            if(imgCenter) imgCenter.src = "assets/img/jessica-in-game-box.png";

        } else if (nivel >= 2) {
            title.innerText = "FASE " + nivel;
            c1Title.innerText = "RITMO ACELERADO"; c1Text.innerHTML = "Cuidado! Agora caem mais produtos e em maior velocidade.";
            c1Icons.innerHTML = '<img src="assets/img/bisnaga.png" class="icon-float">';
            
            c2Title.innerText = "CUIDADO COM O GELO"; c2Title.style.color = "#00e6e6";
            c2Text.innerHTML = "Evite os <strong>Flocos de Neve</strong>! Eles congelam a Jéssica por 1.5s.";
            c2Warn.style.display = "none";
            // Imagem Gelo
            if(imgCenter) imgCenter.src = "assets/img/snowflake-item.png";
        }
    },

fecharInstrucoes: function() {
        if(this.somAtivo) this.sfxClick.play();
        
        const instr = document.getElementById('instructions-layer');
        if(instr) instr.style.display = 'none';

        // --- MUDANÇA AQUI: Inicia o Phaser (e a música) AGORA, antes da contagem ---
        // Se a cena ainda não existe (Fase 1), nós a criamos.
        // Se já existe (Fase 2+), ela já está rodando em background.
        if (!window.gameScene) {
            this.iniciarPhaser();
        }

        this.rodarContagem();
    },

rodarContagem: function() {
        this.limparContagemAntiga();
        const layer = document.createElement('div'); layer.id = 'countdown-layer';
        const num = document.createElement('div'); num.id = 'countdown-number';
        layer.appendChild(num); document.body.appendChild(layer);
        
        let c = 3; num.innerText = c; num.classList.add('pop-in');
        
        let timer = setInterval(() => {
            c--;
            if(c > 0) { 
                num.classList.remove('pop-in'); void num.offsetWidth; num.innerText = c; num.classList.add('pop-in'); 
            }
            else if (c === 0) { 
                num.innerText = "BRILHE!"; 
            }
            else {
                clearInterval(timer); layer.remove();
                const bg = document.getElementById('menu-bg'); if(bg) bg.style.display = 'none';
                
                // --- MUDANÇA AQUI: Apenas libera o movimento ---
                // Como iniciamos o Phaser lá em cima, gameScene com certeza existe agora.
                if (window.gameScene) {
                    window.gameScene.iniciarGameplay();
                }
            }
        }, 1000);
    },

    limparContagemAntiga: function() { const old = document.getElementById('countdown-layer'); if(old) old.remove(); },
    iniciarPhaser: function() { if (window.game && window.game.scene) { window.game.scene.start('GameScene', { level: 1, score: 0 }); window.game.sound.mute = !this.somAtivo; } },
    prepararTransicao: function() { const layer = document.getElementById('transition-layer'); if(layer) layer.innerHTML = '<img id="big-flake" class="giant-flake giant-flake-spin" src="assets/img/snowflake-1.svg" style="filter: drop-shadow(0 0 20px rgba(255,255,255,0.8));">'; },
    criarNeveAmbiente: function() { /* código neve igual */ const container = document.getElementById('snow-layer'); if (!container) return; container.innerHTML = ''; container.style.display = 'block'; const qtd = 150; for (let i = 0; i < qtd; i++) { let floco; if (Math.random() > 0.4) { floco = document.createElement('img'); floco.classList.add('snowflake'); floco.src = Math.random() > 0.5 ? 'assets/img/snowflake-1.svg' : 'assets/img/snowflake-2.svg'; floco.style.width = (Math.random() * 25 + 15) + 'px'; } else { floco = document.createElement('div'); floco.classList.add('snowflake', 'snow-dot'); let s = (Math.random() * 4 + 3) + 'px'; floco.style.width = s; floco.style.height = s; } floco.style.left = Math.random() * 100 + 'vw'; floco.style.opacity = Math.random() * 0.5 + 0.3; floco.style.animationDuration = (Math.random() * 10 + 8) + 's'; floco.style.animationDelay = `-${Math.random() * 15}s`; let dt = Math.random(); if (dt < 0.33) floco.style.animationName = 'snowfall-left'; else if (dt < 0.66) floco.style.animationName = 'snowfall-right'; else floco.style.animationName = 'snowfall-straight'; floco.style.animationTimingFunction = dt < 0.66 ? 'ease-in-out' : 'linear'; container.appendChild(floco); } }
};
UI.init();