export const historico = [
  { ano: 2024, numeros: [1, 17, 19, 29, 50, 57] },
  { ano: 2023, numeros: [21, 24, 33, 41, 48, 56] },
  { ano: 2022, numeros: [4, 5, 10, 34, 58, 59] },
  { ano: 2021, numeros: [12, 15, 23, 32, 33, 46] },
  { ano: 2020, numeros: [17, 20, 22, 35, 41, 42] },
  { ano: 2019, numeros: [3, 35, 38, 40, 57, 58] },
  { ano: 2018, numeros: [5, 10, 12, 18, 25, 33] },
  { ano: 2017, numeros: [3, 6, 10, 17, 34, 37] },
  { ano: 2016, numeros: [5, 11, 22, 24, 51, 53] },
  { ano: 2015, numeros: [2, 18, 31, 42, 51, 56] },
  { ano: 2014, numeros: [1, 5, 11, 16, 20, 56] },
  { ano: 2013, numeros: [20, 30, 36, 38, 47, 53] },
  { ano: 2012, numeros: [14, 32, 33, 36, 41, 52] },
  { ano: 2011, numeros: [3, 4, 29, 36, 45, 55] },
  { ano: 2010, numeros: [2, 10, 34, 37, 43, 50] },
  { ano: 2009, numeros: [10, 27, 40, 46, 49, 58] }
];

function calcularFrequencia() {
  const freq: Record<number, number> = {};
  historico.forEach(jogo => {
    jogo.numeros.forEach(num => {
      freq[num] = (freq[num] || 0) + 1;
    });
  });
  return freq;
}

const reduzirNumerologico = (num: number): number => {
  while (num > 9) {
    num = num.toString().split('').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
  }
  return num;
};

export function gerarJogoInteligente(): number[] {
  const numeros = new Set<number>();
  const numerosUm = [1, 10, 19, 28, 37, 46, 55];
  const freq = calcularFrequencia();
  
  // Adicionar alguns números da numerologia 2026 (número 1)
  const qtdNumerosUm = 1 + Math.floor(Math.random() * 3);
  const numerosUmEmbaralhados = [...numerosUm].sort(() => Math.random() - 0.5);
  for (let i = 0; i < qtdNumerosUm && numeros.size < 6; i++) {
    numeros.add(numerosUmEmbaralhados[i]);
  }
  
  // Adicionar alguns números mais frequentes do histórico
  const topFrequentes = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(x => parseInt(x[0]));
  
  for (let i = 0; i < 2 && numeros.size < 6; i++) {
    const idx = Math.floor(Math.random() * Math.min(15, topFrequentes.length));
    const num = topFrequentes[idx];
    if (num) numeros.add(num);
  }
  
  // Preencher com números aleatórios garantindo distribuição entre dezenas
  const dezenas = [
    { range: [1, 10], count: 0 },
    { range: [11, 20], count: 0 },
    { range: [21, 30], count: 0 },
    { range: [31, 40], count: 0 },
    { range: [41, 50], count: 0 },
    { range: [51, 60], count: 0 }
  ];
  
  Array.from(numeros).forEach(n => {
    const dez = dezenas.find(d => n >= d.range[0] && n <= d.range[1]);
    if (dez) dez.count++;
  });
  
  while (numeros.size < 6) {
    // Priorizar dezenas vazias
    const dezenasVazias = dezenas.filter(d => d.count === 0);
    let num: number;
    
    if (dezenasVazias.length > 0) {
      const dezenaEscolhida = dezenasVazias[Math.floor(Math.random() * dezenasVazias.length)];
      num = dezenaEscolhida.range[0] + Math.floor(Math.random() * 10);
    } else {
      // Se todas as dezenas têm números, escolher aleatoriamente
      num = Math.floor(Math.random() * 60) + 1;
    }
    
    if (num <= 60 && num >= 1 && !numeros.has(num)) {
      numeros.add(num);
      const dez = dezenas.find(d => num >= d.range[0] && num <= d.range[1]);
      if (dez) dez.count++;
    }
  }
  
  return Array.from(numeros).sort((a, b) => a - b);
}

export function gerarBolao(quantidadeJogos: number = 15): number[][] {
  const jogos: number[][] = [];
  for (let i = 0; i < quantidadeJogos; i++) {
    jogos.push(gerarJogoInteligente());
  }
  return jogos;
}
