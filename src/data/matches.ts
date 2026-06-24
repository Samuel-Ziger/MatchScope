export type MatchStage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'

export interface TournamentMatch {
  id: string
  stage: MatchStage
  group?: string
  matchday?: number
  homeId: string
  awayId: string
  homeScore: number | null
  awayScore: number | null
  date: string
  venue: string
  label?: string
}

function gm(
  id: string,
  group: string,
  md: number,
  home: string,
  away: string,
  hs: number | null,
  as: number | null,
  date: string,
  venue: string,
): TournamentMatch {
  return { id, stage: 'group', group, matchday: md, homeId: home, awayId: away, homeScore: hs, awayScore: as, date, venue }
}

/** Jogos da fase de grupos — fonte: Sport Paedia / FIFA, atualizado 23/06/2026 */
export const GROUP_MATCHES: TournamentMatch[] = [
  // Grupo A
  gm('A1', 'A', 1, 'mex', 'rsa', 2, 0, '2026-06-11', 'Estadio Azteca'),
  gm('A2', 'A', 1, 'kor', 'cze', 2, 1, '2026-06-11', 'Estadio Akron'),
  gm('A3', 'A', 2, 'cze', 'rsa', 1, 1, '2026-06-18', 'Mercedes-Benz Stadium'),
  gm('A4', 'A', 2, 'mex', 'kor', 1, 0, '2026-06-18', 'Estadio Akron'),
  gm('A5', 'A', 3, 'cze', 'mex', null, null, '2026-06-24', 'Estadio Azteca'),
  gm('A6', 'A', 3, 'rsa', 'kor', null, null, '2026-06-24', 'Estadio BBVA'),
  // Grupo B
  gm('B1', 'B', 1, 'can', 'bih', 1, 1, '2026-06-12', 'BMO Field'),
  gm('B2', 'B', 1, 'qat', 'sui', 1, 1, '2026-06-13', "Levi's Stadium"),
  gm('B3', 'B', 2, 'sui', 'bih', 4, 1, '2026-06-18', 'SoFi Stadium'),
  gm('B4', 'B', 2, 'can', 'qat', 6, 0, '2026-06-18', 'BC Place'),
  gm('B5', 'B', 3, 'sui', 'can', null, null, '2026-06-24', 'BC Place'),
  gm('B6', 'B', 3, 'bih', 'qat', null, null, '2026-06-24', 'Lumen Field'),
  // Grupo C
  gm('C1', 'C', 1, 'bra', 'mar', 1, 1, '2026-06-13', 'MetLife Stadium'),
  gm('C2', 'C', 1, 'hti', 'sco', 0, 1, '2026-06-13', 'Gillette Stadium'),
  gm('C3', 'C', 2, 'sco', 'mar', 0, 1, '2026-06-19', 'Gillette Stadium'),
  gm('C4', 'C', 2, 'bra', 'hti', 3, 0, '2026-06-19', 'Lincoln Financial Field'),
  gm('C5', 'C', 3, 'sco', 'bra', null, null, '2026-06-24', 'Hard Rock Stadium'),
  gm('C6', 'C', 3, 'mar', 'hti', null, null, '2026-06-24', 'Mercedes-Benz Stadium'),
  // Grupo D
  gm('D1', 'D', 1, 'usa', 'par', 4, 1, '2026-06-12', 'SoFi Stadium'),
  gm('D2', 'D', 1, 'aus', 'tur', 2, 0, '2026-06-13', 'BC Place'),
  gm('D3', 'D', 2, 'usa', 'aus', 2, 0, '2026-06-19', 'Lumen Field'),
  gm('D4', 'D', 2, 'tur', 'par', 0, 1, '2026-06-19', "Levi's Stadium"),
  gm('D5', 'D', 3, 'tur', 'usa', null, null, '2026-06-25', 'SoFi Stadium'),
  gm('D6', 'D', 3, 'par', 'aus', null, null, '2026-06-25', "Levi's Stadium"),
  // Grupo E
  gm('E1', 'E', 1, 'ger', 'cuw', 7, 1, '2026-06-14', 'NRG Stadium'),
  gm('E2', 'E', 1, 'civ', 'ecu', 1, 0, '2026-06-14', 'Lincoln Financial Field'),
  gm('E3', 'E', 2, 'ger', 'civ', 2, 1, '2026-06-20', 'BMO Field'),
  gm('E4', 'E', 2, 'ecu', 'cuw', 0, 0, '2026-06-20', 'Arrowhead Stadium'),
  gm('E5', 'E', 3, 'cuw', 'civ', null, null, '2026-06-25', 'Lincoln Financial Field'),
  gm('E6', 'E', 3, 'ecu', 'ger', null, null, '2026-06-25', 'MetLife Stadium'),
  // Grupo F
  gm('F1', 'F', 1, 'ned', 'jpn', 2, 2, '2026-06-14', 'AT&T Stadium'),
  gm('F2', 'F', 1, 'swe', 'tun', 5, 1, '2026-06-14', 'Estadio BBVA'),
  gm('F3', 'F', 2, 'ned', 'swe', 5, 1, '2026-06-20', 'NRG Stadium'),
  gm('F4', 'F', 2, 'tun', 'jpn', 0, 4, '2026-06-21', 'Estadio BBVA'),
  gm('F5', 'F', 3, 'jpn', 'swe', null, null, '2026-06-25', 'AT&T Stadium'),
  gm('F6', 'F', 3, 'tun', 'ned', null, null, '2026-06-25', 'Arrowhead Stadium'),
  // Grupo G
  gm('G1', 'G', 1, 'bel', 'egy', 1, 1, '2026-06-15', 'Lumen Field'),
  gm('G2', 'G', 1, 'irn', 'nzl', 2, 2, '2026-06-15', 'SoFi Stadium'),
  gm('G3', 'G', 2, 'bel', 'irn', 0, 0, '2026-06-21', 'SoFi Stadium'),
  gm('G4', 'G', 2, 'nzl', 'egy', 1, 3, '2026-06-21', 'BC Place'),
  gm('G5', 'G', 3, 'egy', 'irn', null, null, '2026-06-26', 'Lumen Field'),
  gm('G6', 'G', 3, 'nzl', 'bel', null, null, '2026-06-26', 'BC Place'),
  // Grupo H
  gm('H1', 'H', 1, 'esp', 'cpv', 0, 0, '2026-06-15', 'Mercedes-Benz Stadium'),
  gm('H2', 'H', 1, 'ksa', 'uru', 1, 1, '2026-06-15', 'Hard Rock Stadium'),
  gm('H3', 'H', 2, 'esp', 'ksa', 4, 0, '2026-06-21', 'Mercedes-Benz Stadium'),
  gm('H4', 'H', 2, 'uru', 'cpv', 2, 2, '2026-06-21', 'Hard Rock Stadium'),
  gm('H5', 'H', 3, 'cpv', 'ksa', null, null, '2026-06-26', 'NRG Stadium'),
  gm('H6', 'H', 3, 'uru', 'esp', null, null, '2026-06-26', 'Estadio Akron'),
  // Grupo I
  gm('I1', 'I', 1, 'fra', 'sen', 3, 1, '2026-06-16', 'MetLife Stadium'),
  gm('I2', 'I', 1, 'irq', 'nor', 1, 4, '2026-06-16', 'Gillette Stadium'),
  gm('I3', 'I', 2, 'fra', 'irq', 3, 0, '2026-06-22', 'Lincoln Financial Field'),
  gm('I4', 'I', 2, 'nor', 'sen', 3, 2, '2026-06-22', 'MetLife Stadium'),
  gm('I5', 'I', 3, 'nor', 'fra', null, null, '2026-06-26', 'Gillette Stadium'),
  gm('I6', 'I', 3, 'sen', 'irq', null, null, '2026-06-26', 'BMO Field'),
  // Grupo J
  gm('J1', 'J', 1, 'arg', 'alg', 3, 0, '2026-06-16', 'Arrowhead Stadium'),
  gm('J2', 'J', 1, 'aut', 'jor', 3, 1, '2026-06-16', "Levi's Stadium"),
  gm('J3', 'J', 2, 'arg', 'aut', 2, 0, '2026-06-22', 'AT&T Stadium'),
  gm('J4', 'J', 2, 'jor', 'alg', 1, 2, '2026-06-22', "Levi's Stadium"),
  gm('J5', 'J', 3, 'alg', 'aut', null, null, '2026-06-27', 'Arrowhead Stadium'),
  gm('J6', 'J', 3, 'jor', 'arg', null, null, '2026-06-27', 'AT&T Stadium'),
  // Grupo K
  gm('K1', 'K', 1, 'por', 'cod', 1, 1, '2026-06-17', 'NRG Stadium'),
  gm('K2', 'K', 1, 'uzb', 'col', 1, 3, '2026-06-17', 'Estadio Azteca'),
  gm('K3', 'K', 2, 'por', 'uzb', 5, 0, '2026-06-23', 'NRG Stadium'),
  gm('K4', 'K', 2, 'col', 'cod', null, null, '2026-06-23', 'Estadio Akron'),
  gm('K5', 'K', 3, 'col', 'por', null, null, '2026-06-27', 'Hard Rock Stadium'),
  gm('K6', 'K', 3, 'cod', 'uzb', null, null, '2026-06-27', 'Mercedes-Benz Stadium'),
  // Grupo L
  gm('L1', 'L', 1, 'eng', 'cro', 4, 2, '2026-06-17', 'AT&T Stadium'),
  gm('L2', 'L', 1, 'gha', 'pan', 1, 0, '2026-06-17', 'BMO Field'),
  gm('L3', 'L', 2, 'eng', 'gha', 0, 0, '2026-06-23', 'Gillette Stadium'),
  gm('L4', 'L', 2, 'pan', 'cro', null, null, '2026-06-23', 'BMO Field'),
  gm('L5', 'L', 3, 'pan', 'eng', null, null, '2026-06-27', 'MetLife Stadium'),
  gm('L6', 'L', 3, 'cro', 'gha', null, null, '2026-06-27', 'Lincoln Financial Field'),
]

export const MATCHES_LAST_UPDATED = '24 de junho de 2026'

export const KNOCKOUT_SCHEDULE: Omit<TournamentMatch, 'homeId' | 'awayId' | 'homeScore' | 'awayScore'>[] = [
  { id: 'R32-1', stage: 'r32', date: '2026-06-28', venue: 'SoFi Stadium', label: 'Oitavas de final' },
  { id: 'R32-2', stage: 'r32', date: '2026-06-28', venue: 'Gillette Stadium', label: 'Oitavas de final' },
  { id: 'R32-3', stage: 'r32', date: '2026-06-29', venue: 'NRG Stadium', label: 'Oitavas de final' },
  { id: 'R32-4', stage: 'r32', date: '2026-06-29', venue: 'MetLife Stadium', label: 'Oitavas de final' },
  { id: 'R32-5', stage: 'r32', date: '2026-06-30', venue: 'AT&T Stadium', label: 'Oitavas de final' },
  { id: 'R32-6', stage: 'r32', date: '2026-06-30', venue: 'Estadio Azteca', label: 'Oitavas de final' },
  { id: 'R32-7', stage: 'r32', date: '2026-07-01', venue: 'Mercedes-Benz Stadium', label: 'Oitavas de final' },
  { id: 'R32-8', stage: 'r32', date: '2026-07-01', venue: "Levi's Stadium", label: 'Oitavas de final' },
  { id: 'R32-9', stage: 'r32', date: '2026-07-02', venue: 'Lumen Field', label: 'Oitavas de final' },
  { id: 'R32-10', stage: 'r32', date: '2026-07-02', venue: 'BC Place', label: 'Oitavas de final' },
  { id: 'R32-11', stage: 'r32', date: '2026-07-03', venue: 'Hard Rock Stadium', label: 'Oitavas de final' },
  { id: 'R32-12', stage: 'r32', date: '2026-07-03', venue: 'Arrowhead Stadium', label: 'Oitavas de final' },
  { id: 'R32-13', stage: 'r32', date: '2026-07-03', venue: 'AT&T Stadium', label: 'Oitavas de final' },
  { id: 'R32-14', stage: 'r32', date: '2026-07-03', venue: 'NRG Stadium', label: 'Oitavas de final' },
  { id: 'R32-15', stage: 'r32', date: '2026-07-04', venue: 'Lincoln Financial Field', label: 'Oitavas de final' },
  { id: 'R32-16', stage: 'r32', date: '2026-07-04', venue: 'MetLife Stadium', label: 'Oitavas de final' },
]
