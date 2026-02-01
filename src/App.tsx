import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Play,
  Pause,
  Clock,
  Target,
  History,
  Award,
  X,
  Check,
  Shuffle,
} from 'lucide-react';

// Utilitários
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function App() {
  // Estado principal
  const [semanaStatus, setSemanaStatus] = useState('Montagem');
  const [jogadores, setJogadores] = useState([]);
  const [novoJogadorNome, setNovoJogadorNome] = useState('');
  const [partidas, setPartidas] = useState([]);
  const [partidaAtual, setPartidaAtual] = useState(null);
  const [gols, setGols] = useState([]);
  const [pontuacao, setPontuacao] = useState({
    'Time 1': 0,
    'Time 2': 0,
    'Time 3': 0,
  });

  const [tempoRestante, setTempoRestante] = useState(420);
  const [partidaEmAndamento, setPartidaEmAndamento] = useState(false);
  const [partidaPausada, setPartidaPausada] = useState(false);
  const [mostrarSeletorGol, setMostrarSeletorGol] = useState(null);
  const [mostrarDesempate, setMostrarDesempate] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (partidaEmAndamento && !partidaPausada && tempoRestante > 0) {
      timerRef.current = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            setPartidaEmAndamento(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [partidaEmAndamento, partidaPausada, tempoRestante]);

  const adicionarJogador = () => {
    if (novoJogadorNome.trim() && jogadores.length < 18) {
      setJogadores([
        ...jogadores,
        { nome: novoJogadorNome.trim(), time: null },
      ]);
      setNovoJogadorNome('');
    }
  };

  const atualizarTimeJogador = (index, time) => {
    const novoTime = time === jogadores[index].time ? null : time;
    const timeCounts = { 'Time 1': 0, 'Time 2': 0, 'Time 3': 0 };

    jogadores.forEach((j, i) => {
      if (i === index) {
        if (novoTime) timeCounts[novoTime]++;
      } else if (j.time) {
        timeCounts[j.time]++;
      }
    });

    if (novoTime && timeCounts[novoTime] > 6) {
      return;
    }

    const novosJogadores = [...jogadores];
    novosJogadores[index].time = novoTime;
    setJogadores(novosJogadores);
  };

  const removerJogador = (index) => {
    setJogadores(jogadores.filter((_, i) => i !== index));
  };

  const concluirMontagem = () => {
    const jogadoresComTime = jogadores.filter((j) => j.time);
    if (jogadoresComTime.length < 6) {
      alert('É necessário ter pelo menos 6 jogadores distribuídos nos times');
      return;
    }
    setSemanaStatus('Em andamento');
  };

  const iniciarTorneio = () => {
    const novaPartida = {
      id: Date.now(),
      timeA: 'Time 1',
      timeB: 'Time 2',
      golsA: 0,
      golsB: 0,
      status: 'Aguardando',
      horarioInicio: null,
      horarioFim: null,
    };
    setPartidaAtual(novaPartida);
  };

  const iniciarPartida = () => {
    if (!partidaAtual) return;

    const partidaAtualizada = {
      ...partidaAtual,
      status: 'Em andamento',
      horarioInicio: new Date().toISOString(),
    };
    setPartidaAtual(partidaAtualizada);
    setPartidaEmAndamento(true);
    setTempoRestante(420);
  };

  const pausarPartida = () => {
    setPartidaPausada(true);
  };

  const retomarPartida = () => {
    setPartidaPausada(false);
  };

  const registrarGol = (time, jogadorNome) => {
    const novoGol = {
      id: Date.now(),
      partidaId: partidaAtual.id,
      time,
      jogador: jogadorNome,
      timestamp: new Date().toISOString(),
    };

    setGols([...gols, novoGol]);

    const partidaAtualizada = {
      ...partidaAtual,
      golsA:
        time === partidaAtual.timeA
          ? partidaAtual.golsA + 1
          : partidaAtual.golsA,
      golsB:
        time === partidaAtual.timeB
          ? partidaAtual.golsB + 1
          : partidaAtual.golsB,
    };

    setPartidaAtual(partidaAtualizada);
    setMostrarSeletorGol(null);

    if (partidaAtualizada.golsA >= 2 || partidaAtualizada.golsB >= 2) {
      setPartidaEmAndamento(false);
    }
  };

  const finalizarPartida = (vencedorManual = null) => {
    let vencedor, perdedor;

    if (vencedorManual) {
      vencedor = vencedorManual;
      perdedor =
        vencedor === partidaAtual.timeA
          ? partidaAtual.timeB
          : partidaAtual.timeA;
    } else if (partidaAtual.golsA > partidaAtual.golsB) {
      vencedor = partidaAtual.timeA;
      perdedor = partidaAtual.timeB;
    } else if (partidaAtual.golsB > partidaAtual.golsA) {
      vencedor = partidaAtual.timeB;
      perdedor = partidaAtual.timeA;
    } else {
      setMostrarDesempate(true);
      return;
    }

    processarFimPartida(vencedor, perdedor);
  };

  const sortearVencedor = () => {
    const vencedor =
      Math.random() < 0.5 ? partidaAtual.timeA : partidaAtual.timeB;
    const perdedor =
      vencedor === partidaAtual.timeA ? partidaAtual.timeB : partidaAtual.timeA;
    processarFimPartida(vencedor, perdedor, true);
    ;
  };

  const processarFimPartida = (vencedor, perdedor, ehEmpate = false) => {
  const partidaFinalizada = {
    ...partidaAtual,
    status: 'Finalizada',
    horarioFim: new Date().toISOString(),
    vencedor,
    perdedor,
    resultado: ehEmpate ? 'Empate' : 'Vitória',
  };

  setPartidas([...partidas, partidaFinalizada]);

  const novaPontuacao = { ...pontuacao };

  if (ehEmpate) {
    // Empate: ambos ganham 1 ponto
    novaPontuacao[partidaAtual.timeA] += 1;
    novaPontuacao[partidaAtual.timeB] += 1;
  } else {
    // Vitória normal
    novaPontuacao[vencedor] += 3;
  }

  setPontuacao(novaPontuacao);

  const timesDisponiveis = ['Time 1', 'Time 2', 'Time 3'];
  const timeAguardando = timesDisponiveis.find(
    (t) => t !== partidaAtual.timeA && t !== partidaAtual.timeB
  );

  const novaPartida = {
    id: Date.now(),
    timeA: vencedor,
    timeB: timeAguardando,
    golsA: 0,
    golsB: 0,
    status: 'Aguardando',
    horarioInicio: null,
    horarioFim: null,
  };

  setPartidaAtual(novaPartida);
  setPartidaEmAndamento(false);
  setPartidaPausada(false);
  setTempoRestante(420);
  setMostrarDesempate(false);
};


  const finalizarTorneio = () => {
    if (window.confirm('Tem certeza que deseja finalizar o torneio?')) {
      setSemanaStatus('Finalizado');
    }
  };

  const calcularGoleadores = () => {
    const goleadores = {};

    gols.forEach((gol) => {
      const key = `${gol.jogador}-${gol.time}`;
      if (!goleadores[key]) {
        goleadores[key] = {
          nome: gol.jogador,
          time: gol.time,
          gols: 0,
        };
      }
      goleadores[key].gols++;
    });

    return Object.values(goleadores).sort((a, b) => b.gols - a.gols);
  };

  const obterJogadoresTime = (time) => {
    return jogadores.filter((j) => j.time === time);
  };

  const obterGoleadoresPartida = (partidaId) => {
    return gols.filter((g) => g.partidaId === partidaId);
  };

  const contarJogadoresPorTime = () => {
    const counts = { 'Time 1': 0, 'Time 2': 0, 'Time 3': 0 };
    jogadores.forEach((j) => {
      if (j.time) counts[j.time]++;
    });
    return counts;
  };

  const timesCounts = contarJogadoresPorTime();

  // TELA 1 - MONTAGEM
  if (semanaStatus === 'Montagem') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@400;500;600;700&display=swap');
          body { font-family: 'Work Sans', sans-serif; }
          .titulo { font-family: 'Bebas Neue', cursive; letter-spacing: 2px; }
        `}</style>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="titulo text-5xl md:text-6xl mb-2 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              TORNEIO SEMANAL
            </h1>
            <p className="text-emerald-300 text-lg">
              Monte os times para começar
            </p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-emerald-900/50 shadow-xl">
            <div className="flex gap-3">
              <input
                type="text"
                value={novoJogadorNome}
                onChange={(e) => setNovoJogadorNome(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adicionarJogador()}
                placeholder="Nome do jogador"
                className="flex-1 px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-lg text-white"
                maxLength={30}
              />
              <button
                onClick={adicionarJogador}
                disabled={!novoJogadorNome.trim() || jogadores.length >= 18}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg"
              >
                <Users className="w-5 h-5" />
                Adicionar
              </button>
            </div>
            <p className="text-emerald-400 text-sm mt-3 text-center">
              {jogadores.length}/18 jogadores
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {['Time 1', 'Time 2', 'Time 3'].map((time, idx) => (
              <div
                key={time}
                className={`bg-gradient-to-br ${
                  idx === 0
                    ? 'from-yellow-600 to-yellow-700'
                    : idx === 1
                    ? 'from-blue-600 to-blue-700'
                    : 'from-red-600 to-red-700'
                } rounded-xl p-4 text-center shadow-lg`}
              >
                <div className="text-2xl font-bold">{timesCounts[time]}/6</div>
                <div className="text-sm opacity-90">{time}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            {jogadores.map((jogador, index) => (
              <div
                key={index}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold flex-1">
                    {jogador.nome}
                  </span>
                  <button
                    onClick={() => removerJogador(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {['Time 1', 'Time 2', 'Time 3'].map((time, idx) => (
                    <button
                      key={time}
                      onClick={() => atualizarTimeJogador(index, time)}
                      disabled={
                        !jogador.time &&
                        timesCounts[time] >= 6 &&
                        time !== jogador.time
                      }
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                        jogador.time === time
                          ? idx === 0
                            ? 'bg-blue-600 shadow-lg'
                            : idx === 1
                            ? 'bg-red-600 shadow-lg'
                            : 'bg-amber-600 shadow-lg'
                          : 'bg-slate-700 hover:bg-slate-600'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {time.replace('Time ', 'T')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {jogadores.length > 0 && (
            <button
              onClick={concluirMontagem}
              disabled={jogadores.filter((j) => j.time).length < 6}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-4 rounded-xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center justify-center gap-3 transition-all"
            >
              <Check className="w-6 h-6" />
              CONCLUIR MONTAGEM
            </button>
          )}
        </div>
      </div>
    );
  }

  // TELA 2 - TIMES FORMADOS
  if (semanaStatus === 'Em andamento' && !partidaAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@400;500;600;700&display=swap');
          body { font-family: 'Work Sans', sans-serif; }
          .titulo { font-family: 'Bebas Neue', cursive; letter-spacing: 2px; }
        `}</style>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="titulo text-5xl mb-4 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              TIMES FORMADOS
            </h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {['Time 1', 'Time 2', 'Time 3'].map((time, idx) => {
              const jogadoresTime = obterJogadoresTime(time);
              return (
                <div
                  key={time}
                  className={`bg-gradient-to-br ${
                    idx === 0
                      ? 'from-blue-600/20 to-blue-700/20 border-blue-500'
                      : idx === 1
                      ? 'from-red-600/20 to-red-700/20 border-red-500'
                      : 'from-amber-600/20 to-amber-700/20 border-amber-500'
                  } border-2 rounded-2xl p-6 backdrop-blur-sm shadow-xl`}
                >
                  <h2 className="text-2xl font-bold mb-4 text-center titulo">
                    {time}
                  </h2>
                  <div className="space-y-2">
                    {jogadoresTime.map((jogador, jIdx) => (
                      <div
                        key={jIdx}
                        className="bg-slate-800/70 rounded-lg p-3 text-center font-medium"
                      >
                        {jogador.nome}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={iniciarTorneio}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-5 rounded-2xl text-2xl font-bold shadow-2xl flex items-center justify-center gap-3 transition-all"
          >
            <Play className="w-7 h-7" />
            INICIAR TORNEIO
          </button>
        </div>
      </div>
    );
  }

  // TELA FINAL - GOLEADORES
  if (semanaStatus === 'Finalizado') {
    const goleadores = calcularGoleadores();
    const artilheiro = goleadores[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@400;500;600;700&display=swap');
          body { font-family: 'Work Sans', sans-serif; }
          .titulo { font-family: 'Bebas Neue', cursive; letter-spacing: 2px; }
        `}</style>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 mb-4 shadow-2xl">
              <Award className="w-12 h-12" />
            </div>
            <h1 className="titulo text-6xl mb-2 bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
              TORNEIO FINALIZADO
            </h1>
            <p className="text-purple-300 text-xl">Artilharia da Semana</p>
          </div>

          {artilheiro && (
            <div className="bg-gradient-to-br from-yellow-600/30 to-amber-700/30 border-2 border-yellow-500 rounded-2xl p-8 mb-8 text-center backdrop-blur-sm shadow-2xl">
              <div className="text-5xl mb-3">👑</div>
              <h2 className="text-3xl font-bold mb-2">{artilheiro.nome}</h2>
              <p className="text-xl text-yellow-300 mb-3">{artilheiro.time}</p>
              <div className="titulo text-6xl font-bold bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
                {artilheiro.gols} {artilheiro.gols === 1 ? 'GOL' : 'GOLS'}
              </div>
            </div>
          )}

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-900/50 shadow-xl mb-8">
            <h3 className="text-2xl font-bold mb-4 titulo text-center">
              CLASSIFICAÇÃO
            </h3>
            <div className="space-y-3">
              {goleadores.map((goleador, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-500/50'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/50'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border border-orange-600/50'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {goleador.nome}
                      </div>
                      <div
                        className={`text-sm ${
                          goleador.time === 'Time 1'
                            ? 'text-blue-400'
                            : goleador.time === 'Time 2'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {goleador.time}
                      </div>
                    </div>
                  </div>
                  <div className="titulo text-3xl font-bold">
                    {goleador.gols}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-900/50 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 titulo text-center">
              PONTUAÇÃO FINAL
            </h3>
            <div className="space-y-3">
              {Object.entries(pontuacao)
                .sort((a, b) => b[1] - a[1])
                .map(([time, pontos], index) => (
                  <div
                    key={time}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      time === 'Time 1'
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : time === 'Time 2'
                        ? 'bg-red-600/20 border border-red-500/50'
                        : 'bg-amber-600/20 border border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      )}
                      <span className="text-xl font-semibold">{time}</span>
                    </div>
                    <span className="titulo text-3xl font-bold">{pontos}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA 3 - PARTIDA ATUAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white p-4 pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@400;500;600;700&display=swap');
        body { font-family: 'Work Sans', sans-serif; }
        .titulo { font-family: 'Bebas Neue', cursive; letter-spacing: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s infinite; }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setMostrarHistorico(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/70 hover:bg-slate-700/70 rounded-xl transition-colors"
          >
            <History className="w-5 h-5" />
            Histórico
          </button>
          <button
            onClick={finalizarTorneio}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-xl transition-colors font-semibold"
          >
            Finalizar Torneio
          </button>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-emerald-900/50 shadow-2xl">
          <div className="grid grid-cols-3 gap-4 items-center mb-6">
            <div
              className={`text-center p-4 rounded-2xl ${
                partidaAtual?.timeA === 'Time 1'
                  ? 'bg-blue-600/30'
                  : partidaAtual?.timeA === 'Time 2'
                  ? 'bg-red-600/30'
                  : 'bg-amber-600/30'
              }`}
            >
              <div className="text-xl font-bold mb-2">
                {partidaAtual?.timeA}
              </div>
              <div className="titulo text-6xl font-bold">
                {partidaAtual?.golsA || 0}
              </div>
            </div>

            <div className="text-center">
              <div className="bg-slate-900 rounded-2xl p-6">
                <Clock className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <div
                  className={`titulo text-5xl font-bold ${
                    tempoRestante <= 60
                      ? 'text-red-400 animate-pulse'
                      : 'text-white'
                  }`}
                >
                  {formatTime(tempoRestante)}
                </div>
              </div>
            </div>

            <div
              className={`text-center p-4 rounded-2xl ${
                partidaAtual?.timeB === 'Time 1'
                  ? 'bg-blue-600/30'
                  : partidaAtual?.timeB === 'Time 2'
                  ? 'bg-red-600/30'
                  : 'bg-amber-600/30'
              }`}
            >
              <div className="text-xl font-bold mb-2">
                {partidaAtual?.timeB}
              </div>
              <div className="titulo text-6xl font-bold">
                {partidaAtual?.golsB || 0}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {partidaAtual?.status === 'Aguardando' && (
              <button
                onClick={iniciarPartida}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg"
              >
                <Play className="w-6 h-6" />
                INICIAR PARTIDA
              </button>
            )}

            {partidaAtual?.status === 'Em andamento' && partidaEmAndamento && (
              <>
                {!partidaPausada ? (
                  <button
                    onClick={pausarPartida}
                    className="w-full bg-amber-600 hover:bg-amber-700 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all"
                  >
                    <Pause className="w-6 h-6" />
                    PAUSAR TEMPO
                  </button>
                ) : (
                  <button
                    onClick={retomarPartida}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all"
                  >
                    <Play className="w-6 h-6" />
                    RETOMAR TEMPO
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMostrarSeletorGol(partidaAtual.timeA)}
                    className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Target className="w-5 h-5" />
                    GOL {partidaAtual.timeA.replace('Time ', 'T')}
                  </button>
                  <button
                    onClick={() => setMostrarSeletorGol(partidaAtual.timeB)}
                    className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Target className="w-5 h-5" />
                    GOL {partidaAtual.timeB.replace('Time ', 'T')}
                  </button>
                </div>
              </>
            )}


            <button
              onClick={() => finalizarPartida()}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all"
            >
              <Check className="w-6 h-6" />
              FINALIZAR PARTIDA
            </button>
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-emerald-900/50 shadow-xl">
          <h3 className="text-xl font-bold mb-3 text-center titulo">
            PONTUAÇÃO
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(pontuacao)
              .sort((a, b) => b[1] - a[1])
              .map(([time, pontos]) => (
                <div
                  key={time}
                  className={`text-center p-3 rounded-xl ${
                    time === 'Time 1'
                      ? 'bg-blue-600/20'
                      : time === 'Time 2'
                      ? 'bg-red-600/20'
                      : 'bg-amber-600/20'
                  }`}
                >
                  <div className="text-sm mb-1">{time}</div>
                  <div className="titulo text-3xl font-bold">{pontos}</div>
                </div>
              ))}
          </div>
        </div>

        {gols.filter((g) => g.partidaId === partidaAtual?.id).length > 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-emerald-900/50 shadow-xl">
            <h3 className="text-lg font-bold mb-3 text-center">
              GOLS DESTA PARTIDA
            </h3>
            <div className="space-y-2">
              {gols
                .filter((g) => g.partidaId === partidaAtual?.id)
                .map((gol, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      gol.time === 'Time 1'
                        ? 'bg-blue-600/20'
                        : gol.time === 'Time 2'
                        ? 'bg-red-600/20'
                        : 'bg-amber-600/20'
                    }`}
                  >
                    <Target className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <div className="font-semibold">{gol.jogador}</div>
                      <div className="text-sm opacity-75">{gol.time}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {mostrarSeletorGol && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-emerald-500/50 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Quem marcou?</h3>
              <button
                onClick={() => setMostrarSeletorGol(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              {obterJogadoresTime(mostrarSeletorGol).map((jogador, idx) => (
                <button
                  key={idx}
                  onClick={() => registrarGol(mostrarSeletorGol, jogador.nome)}
                  className="w-full p-4 bg-slate-700 hover:bg-emerald-600 rounded-xl text-left font-semibold transition-all"
                >
                  {jogador.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarDesempate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-amber-500/50 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-center">Empate!</h3>
            <p className="text-center mb-6 text-gray-300">
              Como deseja definir o vencedor?
            </p>
            <div className="space-y-3">
              <button
                onClick={sortearVencedor}
                className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
              >
                <Shuffle className="w-5 h-5" />
                SORTEAR VENCEDOR
              </button>
              <button
                onClick={() =>
                  processarFimPartida(partidaAtual.timeA, partidaAtual.timeB, true)
                }

                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  partidaAtual.timeA === 'Time 1'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : partidaAtual.timeA === 'Time 2'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {partidaAtual.timeA} VENCE
              </button>
              <button
                onClick={() =>
                  processarFimPartida(partidaAtual.timeB, partidaAtual.timeA, true)
                }

                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  partidaAtual.timeB === 'Time 1'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : partidaAtual.timeB === 'Time 2'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {partidaAtual.timeB} VENCE
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorico && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-emerald-500/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="titulo text-2xl font-bold">
                HISTÓRICO DE PARTIDAS
              </h3>
              <button
                onClick={() => setMostrarHistorico(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {partidas.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Nenhuma partida finalizada ainda
              </p>
            ) : (
              <div className="space-y-4">
                {partidas.map((partida, idx) => {
                  const golsPartida = obterGoleadoresPartida(partida.id);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-700/50 rounded-xl p-4 border border-slate-600"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-lg font-bold">
                          {partida.timeA} {partida.golsA} x {partida.golsB}{' '}
                          {partida.timeB}
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            partida.vencedor === 'Time 1'
                              ? 'bg-blue-600'
                              : partida.vencedor === 'Time 2'
                              ? 'bg-red-600'
                              : partida.vencedor === 'Time 3'
                              ? 'bg-amber-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {partida.vencedor
                            ? `${partida.vencedor} Venceu`
                            : 'Empate'}
                        </div>
                      </div>

                      <div className="text-sm text-gray-400 mb-2">
                        {formatDateTime(partida.horarioInicio)} -{' '}
                        {formatDateTime(partida.horarioFim)}
                      </div>

                      {golsPartida.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <div className="text-sm font-semibold mb-2">
                            Goleadores:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {golsPartida.map((gol, gIdx) => (
                              <div
                                key={gIdx}
                                className={`px-3 py-1 rounded-lg text-xs ${
                                  gol.time === 'Time 1'
                                    ? 'bg-blue-600/30'
                                    : gol.time === 'Time 2'
                                    ? 'bg-red-600/30'
                                    : 'bg-amber-600/30'
                                }`}
                              >
                                ⚽ {gol.jogador}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
