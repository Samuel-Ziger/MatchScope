export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW'

export interface Player {
  name: string
  club: string
  position: PlayerPosition
}

export interface Squad {
  teamId: string
  coach: string
  source: string
  announced: string
  players: Player[]
}

export const SQUAD_SOURCE = 'FIFA / USA Today — elencos finais de 26 jogadores (02/06/2026)'

function p(name: string, club: string, position: PlayerPosition): Player {
  return { name, club, position }
}

function build(
  teamId: string,
  coach: string,
  announced: string,
  gk: [string, string][],
  df: [string, string][],
  mf: [string, string][],
  fw: [string, string][],
): Squad {
  const players: Player[] = [
    ...gk.map(([n, c]) => p(n, c, 'GK')),
    ...df.map(([n, c]) => p(n, c, 'DF')),
    ...mf.map(([n, c]) => p(n, c, 'MF')),
    ...fw.map(([n, c]) => p(n, c, 'FW')),
  ]
  return { teamId, coach, announced, source: SQUAD_SOURCE, players }
}

export const SQUADS: Record<string, Squad> = {
  alg: build('alg', 'Vladimir Petkovic', '31/05/2026',
    [['Luca Zidane', 'Granada'], ['Oussama Benbot', 'USM Alger'], ['Melvin Mastil', 'Stade Nyonnais']],
    [['Rafik Belghali', 'Hellas Verona'], ['Samir Chergui', 'Red Star FC'], ['Rayan Aït-Nouri', 'Manchester City'], ['Jaouen Hadjam', 'Young Boys'], ['Aïssa Mandi', 'LOSC Lille'], ['Ramy Bensebaini', 'Borussia Dortmund'], ['Zineddine Belaïd', 'JS Kabylie'], ['Achref Abada', 'USM Alger'], ['Mohamed Amine Tougaï', 'Espérance de Tunis']],
    [['Nabil Bentaleb', 'LOSC Lille'], ['Hicham Boudaoui', 'Nice'], ['Houssem Aouar', 'Al-Ittihad'], ['Farès Chaïbi', 'Eintracht Frankfurt'], ['Ibrahim Maza', 'Bayer Leverkusen'], ['Yacine Titraoui', 'Charleroi'], ['Ramiz Zerrouki', 'FC Twente']],
    [['Mohamed Amine Amoura', 'VfL Wolfsburg'], ['Nadhir Benbouali', 'Győr'], ['Adil Boulbina', 'Al-Duhail'], ['Farès Ghedjemis', 'Frosinone'], ['Amine Gouiri', 'Olympique de Marseille'], ['Anis Hadj Moussa', 'Feyenoord'], ['Riyad Mahrez', 'Al-Ahli']]),

  arg: build('arg', 'Lionel Scaloni', '28/05/2026',
    [['Emiliano Martínez', 'Aston Villa'], ['Gerónimo Rulli', 'Olympique Marseille'], ['Juan Musso', 'Atlético de Madrid']],
    [['Leonardo Balerdi', 'Olympique Marseille'], ['Nicolás Tagliafico', 'Olympique Lyon'], ['Gonzalo Montiel', 'River Plate'], ['Lisandro Martínez', 'Manchester United'], ['Cristian Romero', 'Tottenham Hotspur'], ['Nicolás Otamendi', 'Benfica'], ['Facundo Medina', 'Olympique Marseille'], ['Nahuel Molina', 'Atlético Madrid']],
    [['Leandro Paredes', 'Boca Juniors'], ['Rodrigo De Paul', 'Inter Miami'], ['Valentín Barco', 'Racing Strasbourg'], ['Giovani Lo Celso', 'Real Betis'], ['Exequiel Palacios', 'Bayer Leverkusen'], ['Alexis Mac Allister', 'Liverpool'], ['Enzo Fernández', 'Chelsea']],
    [['Julián Álvarez', 'Atlético Madrid'], ['Lionel Messi', 'Inter Miami'], ['Nico González', 'Atlético de Madrid'], ['Thiago Almada', 'Atlético Madrid'], ['Giuliano Simeone', 'Atlético Madrid'], ['Nico Paz', 'Como'], ['Juan Manuel López', 'Palmeiras'], ['Lautaro Martínez', 'Inter']]),

  aus: build('aus', 'Tony Popovic', '31/05/2026',
    [['Mathew Ryan', 'Levante'], ['Paul Izzo', 'Randers'], ['Patrick Beach', 'Melbourne City']],
    [['Harry Souttar', 'Leicester City'], ['Lucas Herrington', 'Colorado Rapids'], ['Jacob Italiano', 'Grazer AK'], ['Alessandro Circati', 'Parma'], ['Cameron Burgess', 'Swansea City'], ['Aziz Behich', 'Melbourne City'], ['Jordan Bos', 'Feyenoord'], ['Jason Geria', 'Albirex Niigata'], ['Miloš Degenek', 'APOEL'], ['Kai Trewin', 'New York City FC']],
    [['Jackson Irvine', 'FC St. Pauli'], ['Aiden O\'Neill', 'New York City FC'], ['Connor Metcalfe', 'FC St. Pauli'], ['Ajdin Hrustić', 'Heracles Almelo'], ['Cameron Devlin', 'Hearts'], ['Paul Okon-Engstler', 'Sydney FC']],
    [['Nestory Irankunda', 'Watford'], ['Mathew Leckie', 'Melbourne City'], ['Nishan Velupillay', 'Melbourne Victory'], ['Tete Yengi', 'Machida Zelvia'], ['Awer Mabil', 'Castellón'], ['Cristian Volpato', 'Sassuolo'], ['Mohamed Touré', 'Norwich City']]),

  aut: build('aut', 'Ralf Rangnick', '18/05/2026',
    [['Alexander Schlager', 'Red Bull Salzburg'], ['Florian Wiegele', 'Viktoria Plzeň'], ['Patrick Pentz', 'Brøndby']],
    [['David Affengruber', 'Elche'], ['Kevin Danso', 'Tottenham Hotspur'], ['Stefan Posch', 'Como'], ['David Alaba', 'Real Madrid'], ['Philipp Lienhart', 'Freiburg'], ['Philipp Mwene', 'Mainz'], ['Alexander Prass', 'Hoffenheim'], ['Marco Friedl', 'Werder Bremen'], ['Michael Svoboda', 'Venezia']],
    [['Nicolas Seiwald', 'RB Leipzig'], ['Marcel Sabitzer', 'Borussia Dortmund'], ['Florian Grillitsch', 'Braga'], ['Carney Chukwuemeka', 'Borussia Dortmund'], ['Romano Schmid', 'Werder Bremen'], ['Christoph Baumgartner', 'Hoffenheim'], ['Konrad Laimer', 'Bayern Munich'], ['Patrick Wimmer', 'VfL Wolfsburg'], ['Paul Wanner', 'PSV'], ['Alessandro Schopf', 'Wolfsberger']],
    [['Marko Arnautović', 'Red Star Belgrade'], ['Michael Gregoritsch', 'Brøndby'], ['Sasa Kalajdzic', 'Wolverhampton Wanderers']]),

  bel: build('bel', 'Rudi Garcia', '15/05/2026',
    [['Thibaut Courtois', 'Real Madrid'], ['Senne Lammens', 'Manchester United'], ['Mike Penders', 'Racing Strasbourg']],
    [['Timothy Castagne', 'Fulham'], ['Zeno Debast', 'Sporting CP'], ['Maxim De Cuyper', 'Brighton'], ['Koni De Winter', 'AC Milan'], ['Brandon Mechele', 'Club Brugge'], ['Thomas Meunier', 'Lille'], ['Nathan Ngoy', 'Lille'], ['Joaquin Seys', 'Club Brugge'], ['Arthur Theate', 'Eintracht Frankfurt']],
    [['Kevin De Bruyne', 'Napoli'], ['Amadou Onana', 'Aston Villa'], ['Nicolas Raskin', 'Rangers'], ['Youri Tielemans', 'Aston Villa'], ['Hans Vanaken', 'Club Brugge'], ['Axel Witsel', 'Girona']],
    [['Charles De Ketelaere', 'Atalanta'], ['Jeremy Doku', 'Manchester City'], ['Matias Fernandez-Pardo', 'Lille'], ['Romelu Lukaku', 'Napoli'], ['Dodi Lukebakio', 'Benfica'], ['Diego Moreira', 'Racing Strasbourg'], ['Alexis Saelemaekers', 'AC Milan'], ['Leandro Trossard', 'Arsenal']]),

  bih: build('bih', 'Sergej Barbarez', '11/05/2026',
    [['Nikola Vasilj', 'FC St. Pauli'], ['Martin Zlomislić', 'HNK Rijeka'], ['Osman Hadžikic', 'Slaven Belupo']],
    [['Sead Kolašinac', 'Atalanta'], ['Amar Dedić', 'Benfica'], ['Nihad Mujakić', 'Gaziantep FK'], ['Nikola Katić', 'Schalke 04'], ['Tarik Muharemović', 'Sassuolo'], ['Stjepan Radeljić', 'HNK Rijeka'], ['Dennis Hadžikadunić', 'Sampdoria'], ['Nidal Čelik', 'Lens']],
    [['Amir Hadžiahmetović', 'Hull City'], ['Ivan Šunjić', 'Pafos FC'], ['Ivan Bašić', 'FC Astana'], ['Dženis Burnić', 'Karlsruher SC'], ['Ermin Mahmić', 'Slovan Liberec'], ['Benjamin Tahirović', 'Brøndby IF'], ['Amar Memić', 'Viktoria Plzeň'], ['Armin Gigović', 'Young Boys']],
    [['Kerim Alajbegović', 'RB Salzburg'], ['Esmir Bajraktarević', 'PSV Eindhoven'], ['Ermedin Demirović', 'VfB Stuttgart'], ['Jovo Lukić', 'Universitatea Cluj'], ['Samed Baždar', 'Jagiellonia Białystok'], ['Haris Tabaković', 'Borussia Mönchengladbach'], ['Edin Džeko', 'Schalke 04']]),

  bra: build('bra', 'Carlo Ancelotti', '18/05/2026',
    [['Alisson Becker', 'Liverpool'], ['Ederson', 'Fenerbahçe'], ['Weverton', 'Grêmio']],
    [['Alex Sandro', 'Flamengo'], ['Bremer', 'Juventus'], ['Danilo', 'Flamengo'], ['Douglas Santos', 'Zenit'], ['Gabriel Magalhães', 'Arsenal'], ['Ibáñez', 'Al Ahli'], ['Léo Pereira', 'Flamengo'], ['Marquinhos', 'PSG'], ['Wesley', 'Roma']],
    [['Bruno Guimarães', 'Newcastle'], ['Casemiro', 'Manchester United'], ['Danilo', 'Botafogo'], ['Fabinho', 'Al Ittihad'], ['Lucas Paquetá', 'Flamengo']],
    [['Endrick', 'Lyon'], ['Gabriel Martinelli', 'Arsenal'], ['Igor Thiago', 'Brentford'], ['Luiz Henrique', 'Zenit'], ['Matheus Cunha', 'Manchester United'], ['Neymar Jr.', 'Santos'], ['Raphinha', 'Barcelona'], ['Rayan', 'Bournemouth'], ['Vinícius Jr.', 'Real Madrid']]),

  can: build('can', 'Jesse Marsch', '29/05/2026',
    [['Dayne St. Clair', 'Inter Miami'], ['Maxime Crépeau', 'Orlando City'], ['Owen Goodman', 'Crystal Palace']],
    [['Alistair Johnston', 'Celtic'], ['Derek Cornelius', 'Marseille'], ['Richie Laryea', 'Toronto FC'], ['Niko Sigur', 'Hajduk Split'], ['Joel Waterman', 'Chicago Fire'], ['Luc de Fougerolles', 'Fulham'], ['Moise Bombito', 'OGC Nice'], ['Alphonso Davies', 'Bayern Munich'], ['Alfie Jones', 'Middlesbrough']],
    [['Stephen Eustáquio', 'LAFC'], ['Ismael Kone', 'Sassuolo'], ['Tajon Buchanan', 'Villarreal'], ['Mathieu Choinière', 'LAFC'], ['Ali Ahmed', 'Norwich City'], ['Nathan Saliba', 'Anderlecht'], ['Jacob Shaffelburg', 'LAFC'], ['Liam Millar', 'Hull City'], ['Marcelo Flores', 'Tigres'], ['Jonathan Osorio', 'Toronto FC']],
    [['Jonathan David', 'Juventus'], ['Cyle Larin', 'Southampton'], ['Tani Oluwaseyi', 'Villarreal'], ['Promise David', 'Union Saint-Gilloise']]),

  cpv: build('cpv', 'Bubista', '18/05/2026',
    [['Vozinha', 'Chaves'], ['Márcio Rosa', 'Montana'], ['CJ dos Santos', 'San Diego FC']],
    [['Steven Moreira', 'Columbus Crew'], ['Wagner Pina', 'Trabzonspor'], ['João Paulo', 'FCSB'], ['Sidny Lopes Cabral', 'Benfica'], ['Logan Costa', 'Villarreal'], ['Pico', 'Shamrock Rovers'], ['Kelvin Pires', 'SJK Seinäjoki'], ['Stopira', 'Torreense'], ['Diney', 'Al Bataeh']],
    [['Jamiro Monteiro', 'PEC Zwolle'], ['Telmo Arcanjo', 'Vitória'], ['Yannick Semedo', 'Farense'], ['Laros Duarte', 'Puskás Akadémia'], ['Deroy Duarte', 'Ludogorets'], ['Kevin Pina', 'Krasnodar']],
    [['Ryan Mendes', 'Iğdır'], ['Willy Semedo', 'Omonia Nicosia'], ['Garry Rodrigues', 'Apollon Limassol'], ['Jovane Cabral', 'Estrela da Amadora'], ['Nuno da Costa', 'İstanbul Başakşehir'], ['Dailon Livramento', 'Casa Pia'], ['Gilson Benchimol', 'Akron Tolyatti'], ['Hélio Varela', 'Maccabi Tel Aviv']]),

  col: build('col', 'Néstor Lorenzo', '25/05/2026',
    [['Camilo Vargas', 'Atlas'], ['Álvaro Montero', 'Vélez Sarsfield'], ['David Ospina', 'Atlético Nacional']],
    [['Daniel Muñoz', 'Crystal Palace'], ['Dávinson Sánchez', 'Galatasaray'], ['Jhon Lucumí', 'Bologna'], ['Johan Mojica', 'Mallorca'], ['Willer Ditta', 'Cruz Azul'], ['Santiago Arias', 'Independiente'], ['Déiver Machado', 'Nantes'], ['Yerry Mina', 'Cagliari']],
    [['Jefferson Lerma', 'Crystal Palace'], ['Jhon Arias', 'Palmeiras'], ['Jorge Carrascal', 'Flamengo'], ['Juan Camilo Portilla', 'Athletico Paranaense'], ['Richard Ríos', 'Benfica'], ['Juan Fernando Quintero', 'River Plate'], ['Gustavo Puerta', 'Racing de Santander'], ['Kevin Castaño', 'River Plate'], ['James Rodríguez', 'Minnesota United'], ['Jaminton Campaz', 'Rosario Central']],
    [['Luis Díaz', 'Bayern Munich'], ['Jhon Córdoba', 'Krasnodar'], ['Luis Suárez', 'Sporting CP'], ['Cucho Hernández', 'Real Betis'], ['Carlos Andrés Gómez', 'Vasco da Gama']]),

  cod: build('cod', 'Sébastien Desabre', '18/05/2026',
    [['Matthieu Epolo', 'Standard Liège'], ['Timothy Fayulu', 'Noah'], ['Lionel Mpasi', 'Le Havre']],
    [['Dylan Batubinsika', 'Larisa'], ['Rocky Bushiri', 'Hibernian'], ['Gedeon Kalulu', 'Aris Limassol'], ['Steve Kapuadi', 'Widzew Łódź'], ['Joris Kayembe', 'Racing Genk'], ['Arthur Masuaku', 'Racing Lens'], ['Chancel Mbemba', 'Lille'], ['Axel Tuanzebe', 'Burnley'], ['Aaron Wan-Bissaka', 'West Ham United']],
    [['Theo Bongonda', 'Spartak Moscow'], ['Brian Cipenga', 'Castellón'], ['Meshack Elia', 'Alanyaspor'], ['Gael Kakuta', 'Larisa'], ['Edo Kayembe', 'Watford'], ['Nathanael Mbuku', 'Montpellier'], ['Samuel Moutoussamy', 'Atromitos'], ['Ngal\'ayel Mukau', 'Lille'], ['Charles Pickel', 'Espanyol'], ['Noah Sadiki', 'Sunderland']],
    [['Cedric Bakambu', 'Real Betis'], ['Simon Banza', 'Al Jazira'], ['Fiston Mayele', 'Pyramids'], ['Yoane Wissa', 'Newcastle United']]),

  cro: build('cro', 'Zlatko Dalić', '01/06/2026',
    [['Dominik Livaković', 'Dinamo Zagreb'], ['Dominik Kotarski', 'Copenhagen'], ['Ivor Pandur', 'Hull City']],
    [['Joško Gvardiol', 'Manchester City'], ['Duje Ćaleta-Car', 'Real Sociedad'], ['Josip Šutalo', 'Ajax'], ['Josip Stanisić', 'Bayern Munich'], ['Marin Pongračić', 'Fiorentina'], ['Martin Erlić', 'Midtjylland'], ['Luka Vusković', 'Hamburger SV']],
    [['Luka Modrić', 'Milan'], ['Mateo Kovačić', 'Manchester City'], ['Mario Pašalić', 'Atalanta'], ['Nikola Vlašić', 'Torino'], ['Luka Sučić', 'Real Sociedad'], ['Martin Baturina', 'Como'], ['Kristijan Jakić', 'Augsburg'], ['Petar Sučić', 'Inter'], ['Nikola Moro', 'Bologna'], ['Toni Fruk', 'Rijeka']],
    [['Ivan Perišić', 'PSV Eindhoven'], ['Andrej Kramarić', 'Hoffenheim'], ['Ante Budimir', 'Osasuna'], ['Marco Pašalić', 'Orlando City'], ['Petar Musa', 'FC Dallas'], ['Igor Matanović', 'Freiburg']]),

  cuw: build('cuw', 'Dick Advocaat', '18/05/2026',
    [['Tyrick Bodak', 'Telstar'], ['Trevor Doornbusch', 'VVV-Venlo'], ['Eloy Room', 'Miami FC']],
    [['Riechedly Bazoer', 'Konyaspor'], ['Joshua Brenet', 'Kayserispor'], ['Roshon van Eijma', 'RKC Waalwijk'], ['Sherel Floranus', 'PEC Zwolle'], ['Deveron Fonville', 'NEC'], ['Jurien Gaari', 'Abha'], ['Armando Obispo', 'PSV'], ['Shurandy Sambo', 'Sparta Rotterdam']],
    [['Leandro Bacuna', 'Iğdır'], ['Juninho Bacuna', 'Volendam'], ['Livano Comenencia', 'Zürich'], ['Kevin Felida', 'Den Bosch'], ['Ar\'jany Martha', 'Rotherham United'], ['Tyrese Noslin', 'Telstar'], ['Godfried Roemeratoe', 'RKC Waalwijk']],
    [['Jeremy Antonisse', 'Kifisia'], ['Tahith Chong', 'Sheffield United'], ['Kenji Gorré', 'Maccabi Haifa'], ['Sontje Hansen', 'Middlesbrough'], ['Gervane Kastaneer', 'Terengganu'], ['Brandley Kuwas', 'Volendam'], ['Jürgen Locadia', 'Miami FC'], ['Jearl Margaritha', 'Beveren']]),

  cze: build('cze', 'Miroslav Koubek', '31/05/2026',
    [['Lukáš Horníček', 'Braga'], ['Matěj Kovář', 'PSV Eindhoven'], ['Jindřich Staněk', 'Slavia Prague']],
    [['Vladimír Coufal', 'Hoffenheim'], ['David Doudera', 'Slavia Prague'], ['Tomáš Holeš', 'Slavia Prague'], ['Robin Hranáč', 'Hoffenheim'], ['Štěpán Chaloupek', 'Slavia Prague'], ['David Jurásek', 'Slavia Prague'], ['Ladislav Krejčí', 'Wolverhampton'], ['Jaroslav Zelený', 'Slavia Prague'], ['David Zima', 'Slavia Prague']],
    [['Lukáš Červ', 'Viktoria Plzeň'], ['Vladimír Darida', 'Hradec Králové'], ['Lukáš Provod', 'Slavia Prague'], ['Michal Sadílek', 'Slavia Prague'], ['Hugo Sochůrek', 'Sparta Prague'], ['Alexandr Sojka', 'Viktoria Plzeň'], ['Tomáš Souček', 'West Ham United'], ['Pavel Šulc', 'Lyon'], ['Denis Višinský', 'Viktoria Plzeň']],
    [['Adam Hložek', 'Hoffenheim'], ['Tomáš Chorý', 'Slavia Prague'], ['Mojmír Chytil', 'Slavia Prague'], ['Jan Kuchta', 'Sparta Prague'], ['Patrik Schick', 'Bayer Leverkusen']]),

  ecu: build('ecu', 'Sebastián Beccacece', '29/05/2026',
    [['Hernán Galíndez', 'Huracán'], ['Moisés Ramírez', 'A.E Kifisia'], ['Gonzalo Valle', 'LDU Quito']],
    [['Piero Hincapié', 'Arsenal'], ['Willian Pacho', 'PSG'], ['Pervis Estupiñán', 'AC Milan'], ['Félix Torres', 'Internacional'], ['Joel Ordóñez', 'Club Brugge'], ['Jackson Porozo', 'Tijuana'], ['Angelo Preciado', 'Atlético Mineiro']],
    [['Moisés Caicedo', 'Chelsea'], ['Alan Franco', 'Atlético Mineiro'], ['Kendry Páez', 'River Plate'], ['Pedro Vite', 'UNAM'], ['Jordy Alcívar', 'Independiente'], ['Denil Castillo', 'FC Midtjylland'], ['Yaimar Medina', 'Genk']],
    [['Enner Valencia', 'Pachuca'], ['Gonzalo Plata', 'Flamengo'], ['Alan Minda', 'Atlético Mineiro'], ['John Yeboah', 'Venezia'], ['Kevin Rodríguez', 'Union Saint-Gilloise'], ['Jordy Caicedo', 'Atlas'], ['Nilson Angulo', 'Sunderland'], ['Anthony Valencia', 'Royal Antwerp'], ['Jeremy Arévalo', 'Stuttgart']]),

  egy: build('egy', 'Hossam Hassan', '29/05/2026',
    [['Mohamed El Shenawy', 'Al-Ahly'], ['El Mahdy Soliman', 'Al-Zamalek'], ['Mohamed Alaa', 'El Gouna']],
    [['Mohamed Hany', 'Al-Ahly'], ['Tarek Alaa', 'ZED FC'], ['Hamdy Fathy', 'Al-Wakrah'], ['Ramy Rabia', 'Al Ain'], ['Yasser Ibrahim', 'Al-Ahly'], ['Hossam Abdelmaguid', 'Al-Zamalek'], ['Mohamed Abdelmonem', 'OGC Nice'], ['Ahmed El Fotouh', 'Al-Zamalek'], ['Karim Hafez', 'Pyramids']],
    [['Marwan Attia', 'Al-Ahly'], ['Mohanad Lasheen', 'Pyramids'], ['Donga', 'Al Najma'], ['Mahmoud Saber', 'ZED FC'], ['Zizo', 'Al-Ahly'], ['Trézéguet', 'Al-Ahly'], ['Emam Ashour', 'Al-Ahly'], ['Mostafa Ziko', 'Pyramids'], ['Ibrahim Adel', 'Nordsjælland'], ['Haissem Hassan', 'Real Oviedo'], ['Mohamed Salah', 'Liverpool']],
    [['Omar Marmoush', 'Manchester City'], ['Aktay Abdallah', 'ENPPI'], ['Hamza Abdelkarim', 'Barcelona B']]),

  eng: build('eng', 'Thomas Tuchel', '22/05/2026',
    [['Dean Henderson', 'Crystal Palace'], ['Jordan Pickford', 'Everton'], ['James Trafford', 'Manchester City']],
    [['Dan Burn', 'Newcastle United'], ['Marc Guehi', 'Manchester City'], ['Reece James', 'Chelsea'], ['Ezri Konsa', 'Aston Villa'], ['Tino Livramento', 'Newcastle'], ['Nico O\'Reilly', 'Manchester City'], ['Jarell Quansah', 'Bayer Leverkusen'], ['Djed Spence', 'Tottenham'], ['John Stones', 'Manchester City']],
    [['Elliot Anderson', 'Nottingham Forest'], ['Jude Bellingham', 'Real Madrid'], ['Eberechi Eze', 'Arsenal'], ['Jordan Henderson', 'Brentford'], ['Kobbie Mainoo', 'Manchester United'], ['Declan Rice', 'Arsenal'], ['Morgan Rogers', 'Aston Villa']],
    [['Anthony Gordon', 'Newcastle United'], ['Harry Kane', 'Bayern Munich'], ['Noni Madueke', 'Arsenal'], ['Marcus Rashford', 'FC Barcelona'], ['Bukayo Saka', 'Arsenal'], ['Ivan Toney', 'Al-Ahli'], ['Ollie Watkins', 'Aston Villa']]),

  fra: build('fra', 'Didier Deschamps', '14/05/2026',
    [['Mike Maignan', 'AC Milan'], ['Robin Risser', 'Lens'], ['Brice Samba', 'Rennes']],
    [['Lucas Digne', 'Aston Villa'], ['Malo Gusto', 'Chelsea'], ['Lucas Hernandez', 'PSG'], ['Theo Hernandez', 'Al-Hilal'], ['Ibrahima Konaté', 'Liverpool'], ['Jules Koundé', 'Barcelona'], ['Maxence Lacroix', 'Crystal Palace'], ['William Saliba', 'Arsenal'], ['Dayot Upamecano', 'Bayern Munich']],
    [['N\'Golo Kanté', 'Fenerbahçe'], ['Manu Koné', 'Roma'], ['Adrien Rabiot', 'AC Milan'], ['Aurélien Tchouaméni', 'Real Madrid'], ['Warren Zaïre-Emery', 'PSG']],
    [['Maghnes Akliouche', 'Monaco'], ['Bradley Barcola', 'PSG'], ['Rayan Cherki', 'Manchester City'], ['Ousmane Dembélé', 'PSG'], ['Désiré Doué', 'PSG'], ['Jean-Philippe Mateta', 'Crystal Palace'], ['Kylian Mbappé', 'Real Madrid'], ['Michael Olise', 'Bayern Munich'], ['Marcus Thuram', 'Inter']]),

  ger: build('ger', 'Julian Nagelsmann', '21/05/2026',
    [['Manuel Neuer', 'Bayern Munich'], ['Oliver Baumann', 'Hoffenheim'], ['Alexander Nübel', 'Stuttgart']],
    [['Joshua Kimmich', 'Bayern Munich'], ['Nico Schlotterbeck', 'Borussia Dortmund'], ['David Raum', 'RB Leipzig'], ['Jonathan Tah', 'Bayern Munich'], ['Waldemar Anton', 'Borussia Dortmund'], ['Antonio Rüdiger', 'Real Madrid'], ['Nathaniel Brown', 'Eintracht Frankfurt'], ['Malick Thiaw', 'Newcastle United']],
    [['Jamal Musiala', 'Bayern Munich'], ['Florian Wirtz', 'Liverpool'], ['Lennart Karl', 'Bayern Munich'], ['Angelo Stiller', 'Stuttgart'], ['Aleksandar Pavlović', 'Bayern Munich'], ['Leon Goretzka', 'Bayern Munich'], ['Leroy Sané', 'Galatasaray'], ['Felix Nmecha', 'Borussia Dortmund'], ['Nadiem Amiri', 'Mainz'], ['Pascal Gross', 'Brighton']],
    [['Kai Havertz', 'Arsenal'], ['Deniz Undav', 'Stuttgart'], ['Jamie Leweling', 'Stuttgart'], ['Nick Woltemade', 'Newcastle United'], ['Maximilian Beier', 'Borussia Dortmund']]),

  gha: build('gha', 'Carlos Queiroz', '01/06/2026',
    [['Benjamin Asare', 'Accra Hearts of Oak'], ['Lawrence Ati-Zigi', 'St. Gallen'], ['Joseph Anang', 'St. Patrick\'s Athletic']],
    [['Baba Abdul Rahman', 'PAOK'], ['Derrick Luckassen', 'Pafos'], ['Gideon Mensah', 'Auxerre'], ['Marvin Senaya', 'Auxerre'], ['Alidu Seidu', 'Rennes'], ['Abdul Mumin', 'Rayo Vallecano'], ['Jerome Opoku', 'İstanbul Başakşehir'], ['Jonas Adjetey', 'VfL Wolfsburg'], ['Kojo Oppong Peprah', 'OGC Nice']],
    [['Thomas Partey', 'Villarreal'], ['Kamaldeen Sulemana', 'Atalanta'], ['Kwasi Sibo', 'Real Oviedo'], ['Augustine Boakye', 'Saint-Étienne'], ['Caleb Yirenkyi', 'FC Nordsjælland'], ['Abdul Fatawu Issahaku', 'Leicester City'], ['Elisha Owusu', 'Auxerre']],
    [['Christopher Bonsu Baah', 'Al Qadsiah'], ['Ernest Nuamah', 'Lyon'], ['Antoine Semenyo', 'Manchester City'], ['Brandon Thomas-Asante', 'Coventry City'], ['Prince Kwabena Adu', 'Viktoria Plzeň'], ['Iñaki Williams', 'Athletic Club'], ['Jordan Ayew', 'Leicester City']]),

  hti: build('hti', 'Sébastien Migné', '15/05/2026',
    [['Jhony Placide', 'Bastia'], ['Alexandre Pierre', 'Sochaux'], ['Josue Duverger', 'Cosmos Koblenz']],
    [['Carlens Arcus', 'Angers'], ['Wilguens Paugain', 'Zulte Waregem'], ['Duke Lacroix', 'Colorado Springs'], ['Martin Experience', 'Nancy'], ['Jean-Kévin Duverne', 'Gent'], ['Ricardo Ade', 'LDU Quito'], ['Hannes Delcroix', 'Lugano'], ['Keeto Thermoncy', 'Young Boys']],
    [['Carl Fred Sainte', 'El Paso Locomotive'], ['Leverton Pierre', 'Vizela'], ['Danley Jean Jacques', 'Philadelphia Union'], ['Jean-Ricner Bellegarde', 'Wolves'], ['Woodensky Pierre', 'Violette'], ['Dominique Simon', 'FC Tatran Prešov']],
    [['Don Deedson Louicius', 'FC Dallas'], ['Josue Casimir', 'Auxerre'], ['Derrick Etienne', 'Toronto FC'], ['Ruben Providence', 'Almere'], ['Duckens Nazon', 'Esteghlal'], ['Frantzdy Pierrot', 'Çaykur Rizespor'], ['Wilson Isidor', 'Sunderland'], ['Yassin Fortuné', 'Vizela'], ['Lenny Joseph', 'Ferencváros']]),

  irn: build('irn', 'Amir Ghalenoei', '01/06/2026',
    [['Alireza Beiranvand', 'Tractor'], ['Hossein Hosseini', 'Sepahan'], ['Payam Niazmand', 'Persepolis']],
    [['Danial Eiri', 'Malavan'], ['Ehsan Hajsafi', 'Sepahan'], ['Saleh Hardani', 'Esteghlal'], ['Hossein Kanaani', 'Persepolis'], ['Shoja Khalilzadeh', 'Tractor'], ['Milad Mohammadi', 'Persepolis'], ['Ali Nemati', 'Foolad'], ['Omid Noorafkan', 'Foolad'], ['Ramin Rezaeian', 'Foolad']],
    [['Rouzbeh Cheshmi', 'Esteghlal'], ['Saeid Ezatolahi', 'Shabab Al-Ahli'], ['Mehdi Ghaedi', 'Al-Nassr'], ['Saman Ghoddos', 'Kalba'], ['Mohammad Ghorbani', 'Al-Wahda'], ['Alireza Jahanbakhsh', 'Dender'], ['Mohammad Mohebi', 'Rostov'], ['Amir Mohammad Razzaghinia', 'Esteghlal'], ['Mehdi Torabi', 'Tractor'], ['Aria Yousefi', 'Sepahan']],
    [['Ali Alipour', 'Persepolis'], ['Dennis Dargahi', 'Standard Liège'], ['Amirhossein Hosseinzadeh', 'Tractor'], ['Shahriyar Moghanlou', 'Kalba'], ['Mehdi Taremi', 'Olympiacos']]),

  irq: build('irq', 'Graham Arnold', '01/06/2026',
    [['Jalal Hassan', 'Al-Zawraa'], ['Fahad Talib', 'Al-Talaba'], ['Ahmed Basil', 'Al-Shorta']],
    [['Rebin Sulaka', 'Port FC'], ['Merchas Doski', 'Viktoria Plzeň'], ['Hussein Ali', 'Pogoń Szczecin'], ['Frans Putros', 'Persib'], ['Manaf Younis', 'Al-Shorta'], ['Mustafa Sadoon', 'Al-Shorta'], ['Zaid Tahseen', 'Pakhtakor'], ['Ahmed Yahya', 'Al-Shorta'], ['Akam Hashim', 'Al-Zawraa']],
    [['Amir Al-Ammari', 'Cracovia'], ['Zidane Iqbal', 'FC Utrecht'], ['Ibrahim Bayesh', 'Al-Dhafra'], ['Youssef Amyn', 'AEK Larnaca'], ['Ali Jasim', 'Al-Najma'], ['Zaid Ismail', 'Al-Talaba'], ['Aimar Sher', 'Sarpsborg'], ['Kevin Yakob', 'AGF'], ['Marko Farji', 'Venezia FC'], ['Ahmed Qasem', 'Nashville SC']],
    [['Aymen Hussein', 'Al-Karma'], ['Ali Al-Hamadi', 'Ipswich Town'], ['Mohanad Ali', 'Dibba'], ['Ali Yousif', 'Al-Talaba']]),

  civ: build('civ', 'Emerse Faé', '15/05/2026',
    [['Yahia Fofana', 'Rizespor'], ['Mohamed Koné', 'Charleroi'], ['Alban Lafont', 'Panathinaikos']],
    [['Emmanuel Agbadou', 'Wolverhampton'], ['Clément Akpa', 'AJ Auxerre'], ['Ousmane Diomandé', 'Sporting CP'], ['Guela Doué', 'Racing Strasbourg'], ['Ghislain Konan', 'Gil Vicente'], ['Odilon Kossonou', 'Atalanta'], ['Evan Ndicka', 'AS Roma'], ['Wilfried Singo', 'Galatasaray']],
    [['Seko Fofana', 'Stade Rennais'], ['Parfait Guiagon', 'Charleroi'], ['Franck Kessié', 'Al Ahli'], ['Christ Oulai', 'Trabzonspor'], ['Ibrahim Sangaré', 'Nottingham Forest'], ['Jean-Michael Seri', 'NK Maribor']],
    [['Simon Adingra', 'AS Monaco'], ['Ange-Yoan Bonny', 'Inter Milan'], ['Amad Diallo', 'Manchester United'], ['Oumar Diakité', 'Cercle Brugge'], ['Yan Diomandé', 'RB Leipzig'], ['Evann Guessand', 'Aston Villa'], ['Nicolas Pépé', 'Villarreal'], ['Bazoumana Touré', 'Hoffenheim'], ['Elye Wahi', 'Nice']]),

  jpn: build('jpn', 'Hajime Moriyasu', '15/05/2026',
    [['Zion Suzuki', 'Parma'], ['Keisuke Osako', 'Sanfrecce Hiroshima'], ['Tomoki Hayakawa', 'Kashima Antlers']],
    [['Yuta Nagatomo', 'FC Tokyo'], ['Shogo Taniguchi', 'Sint-Truiden'], ['Ko Itakura', 'Ajax'], ['Tsuyoshi Watanabe', 'Feyenoord'], ['Takehiro Tomiyasu', 'Ajax'], ['Hiroki Ito', 'Bayern Munich'], ['Ayumu Seko', 'Le Havre'], ['Yukinari Sugawara', 'Werder Bremen']],
    [['Junnosuke Suzuki', 'Copenhagen'], ['Wataru Endo', 'Liverpool'], ['Junya Ito', 'Genk'], ['Daichi Kamada', 'Crystal Palace'], ['Ritsu Doan', 'Eintracht Frankfurt'], ['Ao Tanaka', 'Leeds United'], ['Keito Nakamura', 'Reims'], ['Kaishu Sano', 'Mainz'], ['Takefusa Kubo', 'Real Sociedad'], ['Yuito Suzuki', 'Freiburg']],
    [['Koki Ogawa', 'NEC Nijmegen'], ['Daizen Maeda', 'Celtic'], ['Ayase Ueda', 'Feyenoord'], ['Kento Shiogai', 'VfL Wolfsburg'], ['Keisuke Goto', 'Sint-Truiden']]),

  jor: build('jor', 'Jamal Sellami', '02/06/2026',
    [['Yazid Abulaila', 'Al-Hussein'], ['Abdallah Al Fakhouri', 'Al-Wehdat'], ['Nour Bani Attiah', 'Al-Faisaly']],
    [['Ihsan Haddad', 'Al-Hussein'], ['Mohammad Abualnadi', 'Selangor'], ['Husam Abu Dahab', 'Al-Samiya'], ['Mohammad Abu Hashish', 'Al-Karma'], ['Yazan Al Arab', 'FC Seoul'], ['Abdallah Nasib', 'Al-Zawraa'], ['Saleem Obaid', 'Al-Hussein'], ['Saed Al-Rosan', 'Al-Hussein'], ['Anas Badawi', 'Al-Faisaly'], ['Mohannad Abu Taha', 'Al-Quwa Al-Jawiya']],
    [['Mohammad Al Dawoud', 'Al-Wehdat'], ['Nizar Al Rashdan', 'Qatar SC'], ['Noor Al Rawabdeh', 'Selangor'], ['Rajaei Ayed', 'Al-Hussein'], ['Amer Jamous', 'Al-Zawraa'], ['Ibrahim Sadeh', 'Al-Karma']],
    [['Mahmoud Al-Mardi', 'Al-Hussein'], ['Mousa Al-Taamari', 'Rennes'], ['Ali Olwan', 'Al-Sailiya'], ['Ibrahim Sabra', 'Lokomotiva Zagreb'], ['Odeh Al-Fakhouri', 'Pyramids'], ['Mohammad Abu Zrayq', 'Al-Hussein'], ['Ali Azaizeh', 'Al-Shabab']]),

  mex: build('mex', 'Javier Aguirre', '31/05/2026',
    [['Raúl Rangel', 'Chivas'], ['Carlos Acevedo', 'Santos Laguna'], ['Guillermo Ochoa', 'AEL Limassol']],
    [['Israel Reyes', 'Club América'], ['Jesús Gallardo', 'Toluca'], ['Jorge Sánchez', 'PAOK'], ['César Montes', 'Lokomotiv Moscow'], ['Johan Vásquez', 'Genoa'], ['Mateo Chávez', 'PSV']],
    [['Erik Lira', 'Cruz Azul'], ['Luis Romo', 'Chivas'], ['Obed Vargas', 'Atlético Madrid'], ['Brian Gutiérrez', 'Chivas'], ['Orbelín Pineda', 'AEK Athens'], ['Edson Álvarez', 'Fenerbahçe'], ['Gilberto Mora', 'Club Tijuana'], ['César Huerta', 'Anderlecht'], ['Álvaro Fidalgo', 'Real Betis'], ['Luis Chávez', 'Dynamo Moscow']],
    [['Roberto Alvarado', 'Chivas'], ['Alexis Vega', 'Toluca'], ['Julián Quiñones', 'Al-Qadsiah'], ['Santiago Giménez', 'AC Milan'], ['Guillermo Martínez', 'Pumas'], ['Armando González', 'Chivas'], ['Raúl Jiménez', 'Fulham']]),

  mar: build('mar', 'Mohamed Ouahbi', '26/05/2026',
    [['Yassine Bounou', 'Al-Hilal'], ['Munir El Kajoui', 'RS Berkane'], ['Ahmed Reda Tagnaouti', 'AS FAR']],
    [['Noussair Mazraoui', 'Manchester United'], ['Anass Salah-Eddine', 'PSV'], ['Youssef Belammari', 'Al Ahly'], ['Nayef Aguerd', 'Marseille'], ['Chadi Riad', 'Crystal Palace'], ['Issa Diop', 'Fulham'], ['Redouane Halhal', 'Mechelen'], ['Achraf Hakimi', 'PSG'], ['Zakaria El Ouahdi', 'Genk']],
    [['Samir El Mourabet', 'Strasbourg'], ['Ayyoub Bouaddi', 'Lille'], ['Neil El Aynaoui', 'Roma'], ['Sofyan Amrabat', 'Real Betis'], ['Azzedine Ounahi', 'Girona'], ['Bilal El Khannouss', 'Stuttgart'], ['Ismael Saibari', 'PSV']],
    [['Abde Ezzalzouli', 'Real Betis'], ['Chemsdine Talbi', 'Sunderland'], ['Soufiane Rahimi', 'Al Ain'], ['Ayoub El Kaabi', 'Olympiacos'], ['Brahim Díaz', 'Real Madrid'], ['Yassine Gessime', 'Strasbourg'], ['Ayoube Amaimouni', 'Eintracht Frankfurt']]),

  ned: build('ned', 'Ronald Koeman', '27/05/2026',
    [['Bart Verbruggen', 'Brighton'], ['Robin Roefs', 'Sunderland'], ['Mark Flekken', 'Bayer Leverkusen']],
    [['Jurrien Timber', 'Arsenal'], ['Micky van de Ven', 'Tottenham'], ['Virgil van Dijk', 'Liverpool'], ['Nathan Aké', 'Manchester City'], ['Jorrel Hato', 'Chelsea'], ['Denzel Dumfries', 'Inter'], ['Jan Paul van Hecke', 'Brighton']],
    [['Ryan Gravenberch', 'Liverpool'], ['Tijjani Reijnders', 'Manchester City'], ['Frenkie de Jong', 'Barcelona'], ['Teun Koopmeiners', 'Juventus'], ['Marten de Roon', 'Atalanta'], ['Quinten Timber', 'Marseille'], ['Guus Til', 'PSV'], ['Mats Wieffer', 'Brighton']],
    [['Brian Brobbey', 'Sunderland'], ['Memphis Depay', 'Corinthians'], ['Cody Gakpo', 'Liverpool'], ['Justin Kluivert', 'Bournemouth'], ['Noa Lang', 'Galatasaray'], ['Donyell Malen', 'Roma'], ['Crysencio Summerville', 'West Ham'], ['Wout Weghorst', 'Ajax']]),

  nzl: build('nzl', 'Darren Bazeley', '14/05/2026',
    [['Max Crocombe', 'Millwall'], ['Alex Paulsen', 'Lechia Gdańsk'], ['Michael Woud', 'Auckland FC']],
    [['Tyler Bindon', 'Nottingham Forest'], ['Michael Boxall', 'Minnesota United'], ['Liberato Cacace', 'Wrexham'], ['Francis de Vries', 'Auckland FC'], ['Callan Elliot', 'Auckland FC'], ['Tim Payne', 'Wellington Phoenix'], ['Nando Pijnaker', 'Auckland FC'], ['Tommy Smith', 'Braintree Town'], ['Finn Surman', 'Portland Timbers']],
    [['Lachlan Bayliss', 'Newcastle Jets'], ['Joe Bell', 'Viking FK'], ['Matt Garbett', 'Peterborough United'], ['Ben Old', 'Saint-Étienne'], ['Alex Rufer', 'Wellington Phoenix'], ['Sarpreet Singh', 'Wellington Phoenix'], ['Marko Stamenic', 'Swansea City'], ['Ryan Thomas', 'PEC Zwolle']],
    [['Kosta Barbarouses', 'Western Sydney Wanderers'], ['Eli Just', 'Motherwell'], ['Callum McCowatt', 'Silkeborg'], ['Jesse Randall', 'Auckland FC'], ['Ben Waine', 'Port Vale'], ['Chris Wood', 'Nottingham Forest']]),

  nor: build('nor', 'Ståle Solbakken', '21/05/2026',
    [['Ørjan Nyland', 'Sevilla'], ['Egil Selvik', 'Watford'], ['Sander Tangvik', 'HSV']],
    [['Julian Ryerson', 'Borussia Dortmund'], ['Kristoffer Ajer', 'Brentford'], ['Leo Skiri Østigaard', 'Genoa'], ['David Møller Wolfe', 'Wolverhampton'], ['Marcus Holmgren Pedersen', 'Torino'], ['Torbjørn Heggem', 'Bologna'], ['Fredrik Bjørkan', 'Bodø/Glimt'], ['Henrik Falchener', 'Viking'], ['Sondre Langås', 'Derby County']],
    [['Martin Ødegaard', 'Arsenal'], ['Sander Berge', 'Fulham'], ['Patrick Berg', 'Bodø/Glimt'], ['Kristian Thorstvedt', 'Sassuolo'], ['Morten Thorsby', 'Cremonese'], ['Thelo Aasgaard', 'Rangers'], ['Andreas Schjelderup', 'Benfica'], ['Jens Petter Hauge', 'Bodø/Glimt'], ['Fredrik Aursnes', 'Benfica']],
    [['Erling Haaland', 'Manchester City'], ['Alexander Sørloth', 'Atlético Madrid'], ['Jørgen Strand Larsen', 'Crystal Palace'], ['Oscar Bobb', 'Fulham'], ['Antonio Nusa', 'RB Leipzig']]),

  pan: build('pan', 'Thomas Christiansen', '26/05/2026',
    [['Orlando Mosquera', 'Al-Fayha'], ['Luis Mejía', 'Nacional'], ['César Samudio', 'Marathon']],
    [['César Blackman', 'Slovan Bratislava'], ['Jorge Gutiérrez', 'Deportivo La Guaira'], ['Michael Amir Murillo', 'Beşiktaş'], ['Fidel Escobar', 'Saprissa'], ['Andrés Andrade', 'LASK'], ['Edgardo Fariña', 'Nizhny Novgorod'], ['José Córdoba', 'Norwich City'], ['Eric Davis', 'Plaza Amador'], ['Jiovany Ramos', 'Puerto Cabello'], ['Roderick Miller', 'Turan Tovuz']],
    [['Aníbal Godoy', 'San Diego FC'], ['Adalberto Carrasquilla', 'Pumas'], ['Carlos Harvey', 'Minnesota United'], ['Cristian Martínez', 'Kiryat Shmona'], ['José Luis Rodríguez', 'FC Juárez'], ['César Yanis', 'Cobresal'], ['Yoel Bárcenas', 'Mazatlán'], ['Alberto Quintero', 'Plaza Amador'], ['Azarías Londoño', 'Universidad Católica']],
    [['Ismael Díaz', 'León'], ['Cecilio Waterman', 'Universidad de Concepción'], ['José Fajardo', 'Universidad Católica'], ['Tomás Rodríguez', 'Saprissa']]),

  par: build('par', 'Gustavo Alfaro', '01/06/2026',
    [['Orlando Gill', 'San Lorenzo'], ['Roberto Fernández', 'Cerro Porteño'], ['Gastón Olveira', 'Olimpia']],
    [['Juan Cáceres', 'Dynamo Moscow'], ['Gustavo Velázquez', 'Cerro Porteño'], ['Gustavo Gómez', 'Palmeiras'], ['Junior Alonso', 'Atlético Mineiro'], ['José Canale', 'Lanús'], ['Omar Alderete', 'Sunderland'], ['Alexandro Maidana', 'Talleres'], ['Fabián Balbuena', 'Grêmio']],
    [['Diego Gómez', 'Brighton'], ['Mauricio Magalhães', 'Palmeiras'], ['Damián Bobadilla', 'São Paulo'], ['Braian Ojeda', 'Orlando City'], ['Andrés Cubas', 'Vancouver Whitecaps'], ['Matías Galarza', 'Atlanta United'], ['Alejandro Gamarra', 'Al-Ain']],
    [['Gustavo Caballero', 'Portsmouth'], ['Ramón Sosa', 'Palmeiras'], ['Alex Arce', 'Independiente Rivadavia'], ['Isidro Pitta', 'Red Bull Bragantino'], ['Gabriel Ávalos', 'Independiente'], ['Miguel Almirón', 'Atlanta United'], ['Julio Enciso', 'Strasbourg'], ['Antonio Sanabria', 'Cremonese']]),

  por: build('por', 'Roberto Martínez', '19/05/2026',
    [['Diogo Costa', 'FC Porto'], ['José Sá', 'Wolverhampton'], ['Rui Silva', 'Sporting CP']],
    [['Diogo Dalot', 'Manchester United'], ['Matheus Nunes', 'Manchester City'], ['Nélson Semedo', 'Fenerbahçe'], ['João Cancelo', 'FC Barcelona'], ['Nuno Mendes', 'PSG'], ['Gonçalo Inácio', 'Sporting CP'], ['Renato Veiga', 'Villarreal'], ['Rúben Dias', 'Manchester City'], ['Tomás Araújo', 'Benfica']],
    [['Rúben Neves', 'Al Hilal'], ['Samuel Costa', 'Mallorca'], ['João Neves', 'PSG'], ['Vitinha', 'PSG'], ['Bruno Fernandes', 'Manchester United'], ['Bernardo Silva', 'Manchester City']],
    [['João Félix', 'Al Nassr'], ['Francisco Trincão', 'Sporting CP'], ['Francisco Conceição', 'Juventus'], ['Pedro Neto', 'Chelsea'], ['Rafael Leão', 'AC Milan'], ['Gonçalo Guedes', 'Real Sociedad'], ['Gonçalo Ramos', 'PSG'], ['Cristiano Ronaldo', 'Al Nassr']]),

  qat: build('qat', 'Julen Lopetegui', '01/06/2026',
    [['Salah Zakaria', 'Al-Duhail'], ['Mahmoud Abunada', 'Al Rayyan'], ['Meshaal Barsham', 'Al-Sadd']],
    [['Hashmi Hussein', 'Al Arabi'], ['Ayoub Alawi', 'Al Gharafa'], ['Boualem Khoukhi', 'Al-Sadd'], ['Pedro Miguel', 'Al-Sadd'], ['Issa Laaye', 'Al Arabi'], ['Lucas Mendes', 'Al-Wakrah'], ['Sultan Al-Brake', 'Al-Duhail'], ['Homam Al-Amin', 'Cultural Leonesa']],
    [['Mohammed Al-Manai', 'Al Shamal'], ['Jassem Jaber', 'Al Arabi'], ['Karim Boudiaf', 'Al-Duhail'], ['Ahmed Fathi', 'Al Arabi'], ['Abdulaziz Hatem', 'Al Rayyan'], ['Assim Madibo', 'Al-Wakrah']],
    [['Tahseen Mohammed', 'Al-Duhail'], ['Edmilson Junior', 'Al-Duhail'], ['Almoez Ali', 'Al-Duhail'], ['Akram Afif', 'Al-Sadd'], ['Mohammed Muntari', 'Al Gharafa'], ['Youssef Abdulrazzaq', 'Al-Wakrah'], ['Ahmed Alaa', 'Al Rayyan'], ['Hassan Al-Haydos', 'Al-Sadd'], ['Ahmed Al-Janahi', 'Al Gharafa']]),

  ksa: build('ksa', 'Georgios Donis', '01/06/2026',
    [['Mohammed Al Owais', 'Al Ula'], ['Nawaf Al Aqidi', 'Al Nassr'], ['Ahmed Al Kassar', 'Al Qadsiah']],
    [['Abdulelah Al Amri', 'Al Nassr'], ['Hassan Tambakti', 'Al Hilal'], ['Jehad Thikri', 'Al Qadsiah'], ['Ali Lajami', 'Al Hilal'], ['Hassan Kadesh', 'Al Ittihad'], ['Saud Abdulhamid', 'Lens'], ['Mohammed Abu Al Shamat', 'Al Qadsiah'], ['Ali Majrashi', 'Al Ahli'], ['Moteb Al Harbi', 'Al Hilal'], ['Nawaf Boushal', 'Al Nassr'], ['Sultan Al-Ghannam', 'Al Nassr']],
    [['Mohammed Kanno', 'Al Hilal'], ['Abdullah Al Khaibari', 'Al Nassr'], ['Ziyad Al Johani', 'Al Ahli'], ['Nasser Al Dawsari', 'Al Hilal'], ['Musab Al Juwayr', 'Al Qadsiah'], ['Alaa Al Hajji', 'Neom'], ['Salem Al Dawsari', 'Al Hilal'], ['Khalid Al Ghannam', 'Al Ettifaq'], ['Ayman Yahya', 'Al Nassr']],
    [['Firas Al Buraikan', 'Al Ahli'], ['Saleh Al Shehri', 'Al Ittihad'], ['Abdullah Al Hamdan', 'Al Nassr']]),

  sco: build('sco', 'Steve Clarke', '19/05/2026',
    [['Craig Gordon', 'Hearts'], ['Angus Gunn', 'Nottingham Forest'], ['Liam Kelly', 'Rangers']],
    [['Grant Hanley', 'Hibernian'], ['Jack Hendry', 'Al Ettifaq'], ['Aaron Hickey', 'Brentford'], ['Dom Hyam', 'Wrexham'], ['Scott McKenna', 'Dinamo Zagreb'], ['Nathan Patterson', 'Everton'], ['Anthony Ralston', 'Celtic'], ['Andy Robertson', 'Liverpool'], ['John Souttar', 'Rangers'], ['Kieran Tierney', 'Celtic']],
    [['Ryan Christie', 'Bournemouth'], ['Findlay Curtis', 'Kilmarnock'], ['Lewis Ferguson', 'Bologna'], ['Ben Gannon-Doak', 'Bournemouth'], ['Billy Gilmour', 'Napoli'], ['John McGinn', 'Aston Villa'], ['Kenny McLean', 'Norwich'], ['Scott McTominay', 'Napoli']],
    [['Che Adams', 'Torino'], ['Lyndon Dykes', 'Charlton Athletic'], ['George Hirst', 'Ipswich'], ['Lawrence Shankland', 'Hearts'], ['Ross Stewart', 'Southampton']]),

  sen: build('sen', 'Pape Thiaw', '01/06/2026',
    [['Édouard Mendy', 'Al-Ahli'], ['Mory Diaw', 'Le Havre'], ['Yehvann Diouf', 'OGC Nice']],
    [['Krépin Diatta', 'AS Monaco'], ['Antoine Mendy', 'OGC Nice'], ['Kalidou Koulibaly', 'Al-Hilal'], ['El Hadji Malick Diouf', 'West Ham'], ['Mamadou Sarr', 'Chelsea'], ['Moussa Niakhaté', 'Lyon'], ['Abdoulaye Seck', 'Maccabi Haifa'], ['Ismaïl Jakobs', 'Galatasaray']],
    [['Idrissa Gana Gueye', 'Everton'], ['Pape Gueye', 'Villarreal'], ['Lamine Camara', 'AS Monaco'], ['Habib Diarra', 'Sunderland'], ['Pathé Ciss', 'Rayo Vallecano'], ['Pape Matar Sarr', 'Tottenham'], ['Bara Sapoko Ndiaye', 'Bayern Munich']],
    [['Sadio Mané', 'Al-Nassr'], ['Ismaïla Sarr', 'Crystal Palace'], ['Iliman Ndiaye', 'Everton'], ['Assane Diao', 'Como'], ['Ibrahim Mbaye', 'PSG'], ['Nicolas Jackson', 'Chelsea'], ['Bamba Dieng', 'Lorient'], ['Chérif Ndiaye', 'Samsunspor']]),

  rsa: build('rsa', 'Hugo Broos', '27/05/2026',
    [['Ronwen Williams', 'Mamelodi Sundowns'], ['Ricardo Goss', 'Siwelele'], ['Sipho Chaine', 'Orlando Pirates']],
    [['Khuliso Mudau', 'Mamelodi Sundowns'], ['Olwethu Makhanya', 'Philadelphia Union'], ['Bradley Cross', 'Kaizer Chiefs'], ['Aubrey Modiba', 'Mamelodi Sundowns'], ['Thabang Matuludi', 'Polokwane City'], ['Nkosinathi Sibisi', 'Orlando Pirates'], ['Ime Okon', 'Hannover 96'], ['Samukele Kabini', 'Molde FK'], ['Mbekezeli Mbokazi', 'Chicago Fire'], ['Kamogelo Sebelebele', 'Orlando Pirates'], ['Khulumani Ndamane', 'Mamelodi Sundowns']],
    [['Teboho Mokoena', 'Mamelodi Sundowns'], ['Thalente Mbatha', 'Orlando Pirates'], ['Jayden Adams', 'Mamelodi Sundowns'], ['Sphephelo Sithole', 'CD Tondela']],
    [['Oswin Appollis', 'Orlando Pirates'], ['Tshepang Moremi', 'Orlando Pirates'], ['Evidence Makgopa', 'Orlando Pirates'], ['Lyle Foster', 'Burnley'], ['Iqraam Rayners', 'Mamelodi Sundowns'], ['Relebohile Mofokeng', 'Orlando Pirates'], ['Themba Zwane', 'Mamelodi Sundowns'], ['Thapelo Maseko', 'AEL Limassol']]),

  kor: build('kor', 'Hong Myung-bo', '16/05/2026',
    [['Jo Hyeon-woo', 'Ulsan HD'], ['Kim Seung-gyu', 'FC Tokyo'], ['Song Bum-keun', 'Jeonbuk Hyundai']],
    [['Kim Moon-hwan', 'Daejeon Hana'], ['Kim Min-jae', 'Bayern Munich'], ['Kim Tae-hyun', 'Kashima Antlers'], ['Park Jin-seob', 'Zhejiang FC'], ['Seol Young-woo', 'Red Star Belgrade'], ['Jens Castrop', 'Borussia Mönchengladbach'], ['Lee Ki-hyeok', 'Gangwon FC'], ['Lee Tae-seok', 'Austria Wien'], ['Lee Han-beom', 'Midtjylland'], ['Cho Yu-min', 'Sharjah']],
    [['Kim Jin-gyu', 'Jeonbuk Hyundai'], ['Bae Jun-ho', 'Stoke City'], ['Paik Seung-ho', 'Birmingham City'], ['Yang Hyun-jun', 'Celtic'], ['Eom Ji-sung', 'Swansea City'], ['Lee Kang-in', 'Paris Saint-Germain'], ['Lee Dong-gyeong', 'Ulsan HD'], ['Lee Jae-sung', 'Mainz'], ['Hwang In-beom', 'Feyenoord'], ['Hwang Hee-chan', 'Wolverhampton']],
    [['Son Heung-min', 'LAFC'], ['Oh Hyeon-gyu', 'Beşiktaş'], ['Cho Gue-sung', 'Midtjylland']]),

  esp: build('esp', 'Luis de la Fuente', '25/05/2026',
    [['Unai Simón', 'Athletic Club'], ['David Raya', 'Arsenal'], ['Joan Garcia', 'Barcelona']],
    [['Marc Cucurella', 'Chelsea'], ['Álex Grimaldo', 'Bayer Leverkusen'], ['Pau Cubarsí', 'Barcelona'], ['Aymeric Laporte', 'Athletic Club'], ['Marc Pubill', 'Atlético Madrid'], ['Eric García', 'Barcelona'], ['Marcos Llorente', 'Atlético Madrid'], ['Pedro Porro', 'Tottenham']],
    [['Pedri', 'Barcelona'], ['Fabián Ruiz', 'PSG'], ['Martín Zubimendi', 'Arsenal'], ['Gavi', 'Barcelona'], ['Rodri', 'Manchester City'], ['Álex Baena', 'Atlético Madrid'], ['Mikel Merino', 'Arsenal']],
    [['Mikel Oyarzabal', 'Real Sociedad'], ['Dani Olmo', 'Barcelona'], ['Nico Williams', 'Athletic Club'], ['Yeremy Pino', 'Crystal Palace'], ['Ferran Torres', 'Barcelona'], ['Borja Iglesias', 'Celta Vigo'], ['Víctor Muñoz', 'Osasuna'], ['Lamine Yamal', 'Barcelona']]),

  swe: build('swe', 'Graham Potter', '12/05/2026',
    [['Viktor Johansson', 'Stoke City'], ['Kristoffer Nordfeldt', 'AIK'], ['Jacob Widell Zetterström', 'Derby County']],
    [['Hjalmar Ekdal', 'Burnley'], ['Gabriel Gudmundsson', 'Leeds United'], ['Isak Hien', 'Atalanta'], ['Herman Johansson', 'FC Dallas'], ['Gustaf Lagerbielke', 'Braga'], ['Victor Lindelöf', 'Aston Villa'], ['Eric Smith', 'St. Pauli'], ['Carl Starfelt', 'Celta Vigo'], ['Elliot Stroud', 'Mjällby AIF'], ['Daniel Svensson', 'Borussia Dortmund']],
    [['Taha Ali', 'Malmö FF'], ['Yasin Ayari', 'Brighton'], ['Lucas Bergvall', 'Tottenham'], ['Jesper Karlström', 'Udinese'], ['Benjamin Nygren', 'Celtic'], ['Ken Sema', 'Pafos'], ['Mattias Svanberg', 'VfL Wolfsburg'], ['Besfort Zeneli', 'Union Saint-Gilloise']],
    [['Alexander Bernhardsson', 'Holstein Kiel'], ['Anthony Elanga', 'Newcastle United'], ['Viktor Gyökeres', 'Arsenal'], ['Alexander Isak', 'Liverpool'], ['Gustaf Nilsson', 'Club Brugge']]),

  sui: build('sui', 'Murat Yakin', '19/05/2026',
    [['Marvin Keller', 'Young Boys'], ['Gregor Kobel', 'Borussia Dortmund'], ['Yvon Mvogo', 'Lorient']],
    [['Manuel Akanji', 'Inter'], ['Aurèle Amenda', 'Eintracht Frankfurt'], ['Eray Cömert', 'Valencia'], ['Nico Elvedi', 'Borussia Mönchengladbach'], ['Luca Jaquez', 'VfB Stuttgart'], ['Miro Muheim', 'Hamburg'], ['Ricardo Rodríguez', 'Real Betis'], ['Silvan Widmer', 'Mainz']],
    [['Michel Aebischer', 'Pisa'], ['Christian Fassnacht', 'Young Boys'], ['Remo Freuler', 'Bologna'], ['Ardon Jashari', 'AC Milan'], ['Johan Manzambi', 'Freiburg'], ['Fabian Rieder', 'Augsburg'], ['Djibril Sow', 'Sevilla'], ['Rubén Vargas', 'Sevilla'], ['Granit Xhaka', 'Sunderland'], ['Denis Zakaria', 'Monaco']],
    [['Zeki Amdouni', 'Burnley'], ['Breel Embolo', 'Rennes'], ['Cedric Itten', 'Fortuna Düsseldorf'], ['Dan Ndoye', 'Nottingham Forest'], ['Noah Okafor', 'Leeds United']]),

  tun: build('tun', 'Sabri Lamouchi', '15/05/2026',
    [['Aymen Dahmen', 'CS Sfaxien'], ['Sabri Ben Hassan', 'Étoile du Sahel'], ['Abdelmouhib Chamakh', 'Club Africain']],
    [['Montassar Talbi', 'Lorient'], ['Dylan Bronn', 'Servette'], ['Omar Rekik', 'Maribor'], ['Adem Arous', 'Kasımpaşa'], ['Yan Valery', 'Young Boys'], ['Moutaz Neffati', 'IFK Norrköping'], ['Raed Chikhaoui', 'US Monastir'], ['Ali Abdi', 'OGC Nice'], ['Mohamed Amine Ben Hamida', 'Espérance de Tunis']],
    [['Ellyes Skhiri', 'Eintracht Frankfurt'], ['Mohamed Hadj-Mahmoud', 'FC Lugano'], ['Rani Khedira', 'Union Berlin'], ['Hannibal Mejbri', 'Burnley'], ['Anis Ben Slimane', 'Norwich City'], ['Mortadha Ben Ouanes', 'Kasımpaşa'], ['Ismaël Gharbi', 'FC Augsburg']],
    [['Khalil Ayari', 'PSG'], ['Sebastian Tounekti', 'Celtic'], ['Elias Achouri', 'Copenhagen'], ['Firas Chaouat', 'Club Africain'], ['Hazem Mastouri', 'Dynamo Makhachkala'], ['Elias Saad', 'Hannover 96'], ['Rayan Elloumi', 'Vancouver Whitecaps']]),

  tur: build('tur', 'Vincenzo Montella', '02/06/2026',
    [['Altay Bayındır', 'Manchester United'], ['Mert Günok', 'Fenerbahçe'], ['Uğurcan Çakır', 'Galatasaray']],
    [['Abdülkerim Bardakcı', 'Galatasaray'], ['Çağlar Söyüncü', 'Fenerbahçe'], ['Eren Elmalı', 'Galatasaray'], ['Ferdi Kadıoğlu', 'Brighton'], ['Merih Demiral', 'Al Ahli'], ['Mert Müldür', 'Fenerbahçe'], ['Ozan Kabak', 'Hoffenheim'], ['Samet Akaydın', 'Çaykur Rizespor'], ['Zeki Çelik', 'AS Roma']],
    [['Hakan Çalhanoğlu', 'Inter'], ['İsmail Yüksek', 'Fenerbahçe'], ['Kaan Ayhan', 'Galatasaray'], ['Orkun Kökçü', 'Beşiktaş'], ['Salih Özcan', 'Borussia Dortmund']],
    [['Arda Güler', 'Real Madrid'], ['Barış Alper Yılmaz', 'Galatasaray'], ['Can Uzun', 'Eintracht Frankfurt'], ['Deniz Gül', 'FC Porto'], ['İrfan Can Kahveci', 'Kasımpaşa'], ['Kenan Yıldız', 'Juventus'], ['Kerem Aktürkoğlu', 'Fenerbahçe'], ['Oğuz Aydın', 'Fenerbahçe'], ['Yunus Akgün', 'Galatasaray']]),

  usa: build('usa', 'Mauricio Pochettino', '26/05/2026',
    [['Chris Brady', 'Chicago Fire'], ['Matt Freese', 'New York City FC'], ['Matt Turner', 'New England Revolution']],
    [['Max Arfsten', 'Columbus Crew'], ['Sergiño Dest', 'PSV'], ['Alex Freeman', 'Villarreal'], ['Mark McKenzie', 'Toulouse'], ['Tim Ream', 'Charlotte FC'], ['Chris Richards', 'Crystal Palace'], ['Antonee Robinson', 'Fulham'], ['Miles Robinson', 'FC Cincinnati'], ['Joe Scally', 'Borussia Mönchengladbach'], ['Auston Trusty', 'Celtic']],
    [['Tyler Adams', 'AFC Bournemouth'], ['Sebastian Berhalter', 'Vancouver Whitecaps'], ['Weston McKennie', 'Juventus'], ['Gio Reyna', 'Borussia Mönchengladbach'], ['Cristian Roldan', 'Seattle Sounders'], ['Malik Tillman', 'Bayer Leverkusen']],
    [['Brenden Aaronson', 'Leeds United'], ['Folarin Balogun', 'Monaco'], ['Ricardo Pepi', 'PSV'], ['Christian Pulisic', 'AC Milan'], ['Tim Weah', 'Olympique Marseille'], ['Haji Wright', 'Coventry City'], ['Alejandro Zendejas', 'Club América']]),

  uru: build('uru', 'Marcelo Bielsa', '31/05/2026',
    [['Sergio Rochet', 'Internacional'], ['Fernando Muslera', 'Estudiantes'], ['Santiago Mele', 'Monterrey']],
    [['Guillermo Varela', 'Flamengo'], ['Ronald Araújo', 'Barcelona'], ['José María Giménez', 'Atlético Madrid'], ['Santiago Bueno', 'Wolverhampton'], ['Sebastián Cáceres', 'Club América'], ['Mathías Olivera', 'Napoli'], ['Joaquín Piquerez', 'Palmeiras'], ['Matías Viña', 'River Plate']],
    [['Manuel Ugarte', 'Manchester United'], ['Emiliano Martínez', 'Palmeiras'], ['Rodrigo Bentancur', 'Tottenham'], ['Federico Valverde', 'Real Madrid'], ['Agustín Canobbio', 'Fluminense'], ['Juan Manuel Sanabria', 'Real Salt Lake'], ['Giorgian de Arrascaeta', 'Fluminense'], ['Nicolás de la Cruz', 'Flamengo'], ['Rodrigo Zalazar', 'Braga'], ['Facundo Pellistri', 'Panathinaikos'], ['Maximiliano Araújo', 'Sporting CP'], ['Brian Rodríguez', 'Club América']],
    [['Rodrigo Aguirre', 'Tigres'], ['Federico Viñas', 'Real Oviedo'], ['Darwin Núñez', 'Al Hilal']]),

  uzb: build('uzb', 'Fabio Cannavaro', '05/05/2026',
    [['Utkir Yusupov', 'Navbahor'], ['Abduvohid Nematov', 'Nasaf'], ['Botirali Ergashev', 'Neftchi']],
    [['Rustam Ashurmatov', 'Esteghlal'], ['Farrukh Sayfiev', 'Neftchi'], ['Khojiakbar Alijonov', 'Pakhtakor'], ['Sherzod Nasrullaev', 'Nasaf'], ['Umar Eshmurodov', 'Nasaf'], ['Abdukodir Khusanov', 'Manchester City'], ['Abdulla Abdullaev', 'Dibba'], ['Bekhruz Karimov', 'Surkhon'], ['Jakhongir Urozov', 'Dinamo Samarqand'], ['Avazbek Ulmasaliev', 'AGMK']],
    [['Otabek Shukurov', 'Baniyas'], ['Jaloliddin Masharipov', 'Esteghlal'], ['Odiljon Hamrobekov', 'Tractor'], ['Oston Urunov', 'Persepolis'], ['Jamshid Iskanderov', 'Neftchi'], ['Dostonbek Khamdamov', 'Pakhtakor'], ['Abbosbek Fayzullaev', 'İstanbul Başakşehir'], ['Akmal Mozgovoy', 'Pakhtakor'], ['Azizjon Ganiev', 'Al Bataeh'], ['Sherzod Esanov', 'Bukhara']],
    [['Eldor Shomurodov', 'İstanbul Başakşehir'], ['Igor Sergeev', 'Persepolis'], ['Azizbek Amonov', 'Bukhara']]),
}

export function getSquadByTeamId(teamId: string): Squad | undefined {
  return SQUADS[teamId]
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: 'Goleiro',
  DF: 'Defesa',
  MF: 'Meio-campo',
  FW: 'Atacante',
}
