// js/ranking.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set, query, orderByChild, limitToLast, onValue } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAiTtWQx808vmD8yHCUGQz7n_b4vqVq93M",
    authDomain: "natalglossranking.firebaseapp.com",
    databaseURL: "https://natalglossranking-default-rtdb.firebaseio.com",
    projectId: "natalglossranking",
    storageBucket: "natalglossranking.firebasestorage.app",
    messagingSenderId: "174564447866",
    appId: "1:174564447866:web:fe7c9428ca669f69a54dc3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Cria um objeto global para acessarmos de outros arquivos
window.RankingAPI = {
    salvarRecorde: function(nome, pontos, callback) {
        const rankingRef = ref(db, 'ranking');
        const novoRecordeRef = push(rankingRef);
        set(novoRecordeRef, {
            nome: nome.toUpperCase().substring(0, 10), // Limita a 10 letras
            pontos: parseInt(pontos),
            data: Date.now()
        }).then(() => {
            if(callback) callback(true);
        }).catch((error) => {
            console.error("Erro ao salvar:", error);
            if(callback) callback(false);
        });
    },

    carregarTop10: function(callback) {
        const rankingRef = ref(db, 'ranking');
        // Pega os últimos 10 ordenados por pontos
        const topQuery = query(rankingRef, orderByChild('pontos'), limitToLast(10));
        
        onValue(topQuery, (snapshot) => {
            let lista = [];
            snapshot.forEach((child) => {
                lista.push(child.val());
            });
            // O Firebase devolve ordem crescente, precisamos inverter para o maior ficar em 1º
            lista.reverse();
            if(callback) callback(lista);
        });
    }
};
console.log("Sistema de Ranking Conectado!");