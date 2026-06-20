/**
 * Remove acentos e converte para minúsculo
 */
export const normalize = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

/**
 * Retorna as datas de início e fim da janela de tempo atual no fuso de Brasília.
 * Ampliamos a janela para iniciar no dia anterior, cobrindo jogos que passam da meia-noite
 * e garantindo que o banco de dados e a API da FIFA retornem a partida.
 */
export const getWindowTimeBRT = () => {
  const agora = new Date();
  const hojeBRT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);

  const [ano, mes, dia] = hojeBRT.split('-').map(Number);
  
  const dataOntem = new Date(Date.UTC(ano, mes - 1, dia - 1));
  const ontemBRT = dataOntem.toISOString().split('T')[0];

  const dataAmanha = new Date(Date.UTC(ano, mes - 1, dia + 1));
  const amanhaBRT = dataAmanha.toISOString().split('T')[0];

  const fromDate = `${ontemBRT}T03:00:00Z`;
  const toDate = `${amanhaBRT}T02:59:59Z`;
  
  return { fromDate, toDate };
};
