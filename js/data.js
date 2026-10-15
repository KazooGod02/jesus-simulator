'use strict';
// ============================================================
//  data.js : figuras, personajes, textos, frases
// ============================================================

// perks: dmg spd money hunger cope fe hp car luck gym
const FIGURES = [
  { id: 'remu_g', name: 'Remu de Guamúchil (Ed. Garbanzo)', serie: 'Re:Cero Vergüenza', rar: 4, src: 'mission', hair: '#6aa0ff', hs: 'bob', out: '#24244a', acc: '#ffffff', perk: ['gym', 15], desc: 'Solo hicieron 3. Tú tienes una. Dios existe.' },
  { id: 'asuka_sin', name: 'Asuka Sinaloense (Ed. Sombrero)', serie: 'Evangelion del Évora', rar: 4, src: 'mission', hair: '#e05a20', hs: 'twin', out: '#d02020', acc: '#c8a050', perk: ['dmg', 15], desc: '"¿Anta baka? ¡Órale pues!"' },
  { id: 'garbanzo_chan', name: 'Garbanzo-chan', serie: 'Tatema Matsuri', rar: 3, src: 'mission', hair: '#c8d050', hs: 'short', out: '#6aa040', acc: '#e0c070', perk: ['hunger', 30], desc: 'Mascota oficial de la Tatema. Huele a chile y limón.' },
  { id: 'zero_tu', name: 'Zero Tú', serie: 'Darling in the Évora', rar: 3, src: 'shop', price: 900, hair: '#ff8ac0', hs: 'long', out: '#c02040', acc: '#ff4040', perk: ['spd', 8], desc: 'Tu "darling" es el gym.' },
  { id: 'mikasa', name: 'Mikasa con Botas Vaqueras', serie: 'Ataque a los Titanes Gym', rar: 2, src: 'shop', price: 600, hair: '#202020', hs: 'bob', out: '#8a6a3a', acc: '#d02020', perk: ['dmg', 8], desc: 'Bufanda roja y botas de piel de avestruz.' },
  { id: 'nezuko', name: 'Nezuko con Caña de Azúcar', serie: 'Kimetsu no Garbanzo', rar: 2, src: 'shop', price: 550, hair: '#301818', hs: 'long', out: '#e080a0', acc: '#70c060', perk: ['hp', 15], desc: 'Mmmph mmph (traducción: "¿y tus piernas?").' },
  { id: 'miku', name: 'Hatsune Miku Norteña', serie: 'Vocaloid Banda', rar: 3, src: 'shop', price: 1200, hair: '#40d0c0', hs: 'twin', out: '#303040', acc: '#c8a050', perk: ['cope', 15], desc: 'Canta con acordeón y tololoche.' },
  { id: 'makima', name: 'Makima, Jefa de Tránsito', serie: 'Chainsaw Guamúchil', rar: 3, src: 'shop', price: 1100, hair: '#d06a5a', hs: 'long', out: '#e8e8e8', acc: '#202020', perk: ['money', 10], desc: 'Te controla. Como la Yesenia. Te gusta.' },
  { id: 'power', name: 'Power Diablilla', serie: 'Chainsaw Guamúchil', rar: 2, src: 'shop', price: 650, hair: '#f0c050', hs: 'long', out: '#e04040', acc: '#ff6060', perk: ['dmg', 5], desc: 'No se baña. Igual que tu cuarto.' },
  { id: 'marin', name: 'Marin Cosplayer de la Feria', serie: 'Sono Bisque Doll', rar: 2, src: 'shop', price: 700, hair: '#f0e070', hs: 'long', out: '#202020', acc: '#ff80c0', perk: ['money', 8], desc: 'Te habló una vez en tu imaginación.' },
  { id: 'frieren', name: 'Frieren Abuelita Élfica', serie: 'Frieren: Más Allá del Gym', rar: 3, src: 'shop', price: 1300, hair: '#e8e8f0', hs: 'twin', out: '#f0f0f0', acc: '#c8a050', perk: ['fe', 20], desc: 'Tiene 1000 años y más vida social que tú.' },
  { id: 'anya', name: 'Anya Waku Waku', serie: 'Spy x Familia Sinaloense', rar: 1, src: 'shop', price: 350, hair: '#ffa0c0', hs: 'short', out: '#303030', acc: '#f0e070', perk: ['cope', 5], desc: 'Lee tu mente. Se arrepiente.' },
  { id: 'yor', name: 'Yor Asesina Doméstica', serie: 'Spy x Familia Sinaloense', rar: 2, src: 'shop', price: 750, hair: '#202028', hs: 'long', out: '#202020', acc: '#d02040', perk: ['dmg', 6], desc: 'Esposa ideal según 9 de cada 10 chuds.' },
  { id: 'bocchi', name: 'Bocchi Ansiosa (como tú)', serie: 'Bocchi the Rock del Évora', rar: 1, src: 'shop', price: 300, hair: '#ff90b0', hs: 'long', out: '#ffb0c0', acc: '#40a0ff', perk: ['cope', 10], desc: 'Tu alma gemela en ansiedad social.' },
  { id: 'kurisu', name: 'Kurisu del Microondas', serie: 'Steins;Garbanzo', rar: 2, src: 'shop', price: 600, hair: '#c05030', hs: 'long', out: '#f0f0f0', acc: '#202020', perk: ['luck', 10], desc: 'El microondas calienta tacos del pasado.' },
  { id: 'saitama', name: 'Saitama Sigma', serie: 'One Punch Mamado', rar: 3, src: 'gacha', hair: '#f0d0a0', hs: 'bald', out: '#f0e020', acc: '#d02020', perk: ['dmg', 12], desc: '100 lagartijas diarias. Tú haces 4.' },
  { id: 'goku', name: 'Goku Ultra Banda', serie: 'Dragon Bola de Garbanzo', rar: 2, src: 'gacha', hair: '#202020', hs: 'spiky', out: '#f08020', acc: '#2040c0', perk: ['gym', 8], desc: '¡KAAAA-MEEE-HAAAA... ¿y la tuba?!' },
  { id: 'luffy', name: 'Luffy Huarachudo', serie: 'Wan Pis', rar: 2, src: 'gacha', hair: '#202020', hs: 'short', out: '#d02020', acc: '#e0c070', perk: ['hp', 10], desc: 'Quiere ser el Rey del Malecón.' },
  { id: 'naruto', name: 'Naruto Ramen de Elote', serie: 'Narutoto', rar: 1, src: 'gacha', hair: '#f0d020', hs: 'spiky', out: '#f08020', acc: '#202020', perk: ['spd', 4], desc: 'Corre con los brazos para atrás. Como tú al gym.' },
  { id: 'gojo', name: 'Gojo Vendado', serie: 'Jujutsu Kaisen del Valle', rar: 3, src: 'gacha', hair: '#f0f0ff', hs: 'spiky', out: '#202030', acc: '#ffffff', perk: ['cope', 12], desc: 'Se vendó los ojos para no ver a su ex.' },
  { id: 'rei', name: 'Rei Callada', serie: 'Evangelion del Évora', rar: 2, src: 'gacha', hair: '#a0c0ff', hs: 'bob', out: '#f0f0f0', acc: '#ff4040', perk: ['fe', 8], desc: 'Callada como tu WhatsApp un viernes.' },
  { id: 'kaguya', name: 'Kaguya-sama Pide la Cuenta', serie: 'Love is War (y la pierdes)', rar: 2, src: 'gacha', hair: '#202020', hs: 'long', out: '#a02030', acc: '#ff4040', perk: ['money', 6], desc: '"Qué lindo... pagas tú, ¿verdad?"' },
  { id: 'chika', name: 'Chika Bailando Banda', serie: 'Love is War (y la pierdes)', rar: 1, src: 'gacha', hair: '#ffb0c0', hs: 'long', out: '#303050', acc: '#ffffff', perk: ['spd', 3], desc: 'Baila quebradita. Tú no sabes ni la cumbia.' },
  { id: 'lupe_fig', name: 'Doña Lupe (Ed. Chancla)', serie: 'Mi Mamá la de Guamúchil', rar: 4, src: 'hidden', hair: '#6a6a6a', hs: 'bun', out: '#d04070', acc: '#8a5a3a', perk: ['hp', 20], desc: 'La única mujer que te respeta. A medias.' },
  { id: 'idolo_fig', name: 'El Ídolo (Figura Homenaje)', serie: 'Leyenda de Guamúchil', rar: 4, src: 'hidden', hair: '#202020', hs: 'charro', out: '#202020', acc: '#c8a050', perk: ['fe', 25], desc: 'Homenaje al Ídolo de Guamúchil. Respeto absoluto.' },
  { id: 'brayan_fig', name: 'Brayan Alfa (Ed. Esteroide)', serie: 'Titanes Gym', rar: 2, src: 'hidden', hair: '#e8d070', hs: 'spiky', out: '#d02020', acc: '#e8b080', perk: ['dmg', 5], desc: 'Incluye jeringa de juguete (legal).' },
  { id: 'kenji_fig', name: 'Kenji, Otaku de 40', serie: 'Otaku Évora', rar: 1, src: 'hidden', hair: '#202020', hs: 'short', out: '#f08020', acc: '#ffffff', perk: ['cope', 5], desc: 'Tu futuro. Míralo bien.' },
  { id: 'garbanzo_oro', name: 'El Garbanzo Dorado', serie: 'Leyendas del Valle', rar: 4, src: 'hidden', hair: '#f0c030', hs: 'bald', out: '#f0c030', acc: '#fff080', perk: ['money', 15], desc: 'Dicen que da suerte en la cosecha y en el amor. (Mentira.)' },
  { id: 'yesenia_fig', name: 'Yesenia.exe (Glitcheada)', serie: '404 Novia Not Found', rar: 3, src: 'hidden', hair: '#ff60c0', hs: 'long', out: '#40ffa0', acc: '#202020', perk: ['cope', 10], desc: 'Ni como figura existe del todo.' },
  { id: 'karla_fig', name: 'Karla Gym Rat', serie: 'Titanes Gym', rar: 3, src: 'hidden', hair: '#6a3a20', hs: 'pony', out: '#30a0a0', acc: '#202020', perk: ['gym', 10], desc: 'Te spotea. Literalmente.' },
  { id: 'dios_fig', name: 'Dios en Chanclas', serie: 'Antiguo Testamento Sinaloense', rar: 4, src: 'hidden', hair: '#f0f0f0', hs: 'long', out: '#ffffff', acc: '#f0c030', perk: ['fe', 30], desc: '"Quihubo, mijo."' }
];
const FIG = {}; FIGURES.forEach(f => FIG[f.id] = f);
const RARITY = ['', 'COMÚN', 'RARA', 'ÉPICA', 'LEGENDARIA'];
const RARCOL = ['', '#a0a0a0', '#40a0ff', '#c050ff', '#ffc030'];
const PERKNAME = {
  dmg: 'Daño de golpe', spd: 'Velocidad', money: 'Pago de chambas', hunger: 'Hambre más lenta',
  cope: 'Menos copium', fe: 'Fe extra', hp: 'Vida máx', car: 'Velocidad de carro', luck: 'Suerte gacha', gym: 'Ganancias de gym'
};

// ------------------------------------------------------------
//  Personajes (sprites)
// ------------------------------------------------------------
const SPEC = {
  jesus: { skin: '#e8b080', hair: '#3a2418', style: 'librito', lvl: 1, shirt: '#24202c', pants: '#34508a', shoes: '#f0f0f0', print: '#ff70b0' },
  lupe: { skin: '#c98e5e', hair: '#6a6a6a', style: 'bun', shirt: '#d04070', skirt: 1, dress: '#4a3a8a', shoes: '#3a2a1a' },
  chava: { skin: '#b07850', hair: '#000', style: 'bald', shirt: '#f0f0f0', pants: '#5a5a6a', shoes: '#202020', buff: 1 },
  brayan: { skin: '#d8a070', hair: '#e8d070', style: 'spiky', shirt: '#d02020', pants: '#202020', shoes: '#f0f0f0', buff: 1 },
  kenji: { skin: '#e0b088', hair: '#202020', style: 'long', shirt: '#f08020', pants: '#4a4a5a', shoes: '#303030', glasses: '#a0e0ff', print: '#2040c0' },
  yesenia: { skin: '#f0c098', hair: '#ff60c0', style: 'long', shirt: '#ff90d0', skirt: 1, dress: '#ffffff', shoes: '#ff60c0' },
  padre: { skin: '#d0a078', hair: '#b0b0b0', style: 'short', shirt: '#202028', pants: '#202028', shoes: '#101010', print: '#ffffff' },
  lic: { skin: '#e0b090', hair: '#101010', style: 'slick', shirt: '#24305a', pants: '#24305a', shoes: '#101010', glasses: '#101010', print: '#d02020' },
  karla: { skin: '#d8a078', hair: '#6a3a20', style: 'pony', shirt: '#30a0a0', pants: '#202028', shoes: '#f0f0f0' },
  popote: { skin: '#c89060', hair: '#2a8a3a', style: 'cap', hat: '#2a8a3a', shirt: '#3aa04a', pants: '#3aa04a', shoes: '#f0f0f0' },
  guero: { skin: '#f0c8a0', hair: '#f0e0a0', style: 'cowboy', hat: '#e8d8b0', shirt: '#f0f0f0', pants: '#34508a', shoes: '#5a3a1a' },
  presidente: { skin: '#c89060', hair: '#303030', style: 'slick', shirt: '#f0f0f0', pants: '#303030', shoes: '#101010', print: '#2a8a3a' },
  comandanta: { skin: '#c08860', hair: '#202020', style: 'cap', hat: '#1a2a5a', shirt: '#1a2a5a', pants: '#1a2a5a', shoes: '#101010', print: '#f0c030' },
  meche: { skin: '#b88058', hair: '#303030', style: 'bun', shirt: '#f0a020', skirt: 1, dress: '#8a3a2a', shoes: '#3a2a1a' },
  senpai: { skin: '#f0c8a0', hair: '#8040c0', style: 'spiky', shirt: '#202020', pants: '#202020', shoes: '#d02020', glasses: '#ff4040', print: '#ffffff' },
  chismosa: { skin: '#c08860', hair: '#8a3a2a', style: 'bun', shirt: '#40a060', skirt: 1, dress: '#5a3a6a', shoes: '#3a2a1a' },
  ciberguy: { skin: '#d0a078', hair: '#202020', style: 'cap', hat: '#d02020', shirt: '#303030', pants: '#34508a', shoes: '#f0f0f0' },
  borracho: { skin: '#d08a6a', hair: '#303030', style: 'cowboy', hat: '#f0e0c0', shirt: '#80a0d0', pants: '#34508a', shoes: '#5a3a1a' },
  senor: { skin: '#b88058', hair: '#909090', style: 'cowboy', hat: '#e8d8b0', shirt: '#e8e0d0', pants: '#4a4a5a', shoes: '#5a3a1a' },
  dios: { god: 1 },
  cel: { phone: 1 },
  narrador: null
};
const NAMES = {
  jesus: 'JESÚS', lupe: 'DOÑA LUPE', chava: 'DON CHAVA', brayan: 'EL BRAYAN', kenji: 'KENJI', yesenia: 'YESENIA <3',
  padre: 'PADRE RAMIRO', lic: 'EL LIC. FIGUEROA', karla: 'KARLA', popote: 'EL POPOTE', guero: 'EL GÜERO', presidente: 'PRESIDENTE MUNICIPAL',
  comandanta: 'COMANDANTA MTZ.', meche: 'DOÑA MECHE', senpai: 'SENPAI DE MOCORITO', chismosa: 'SEÑORA CHAYO', ciberguy: 'EL DEL CIBER',
  borracho: 'BORRACHITO', senor: 'DON BETO', dios: 'DIOS', cel: 'CELULAR MISTERIOSO', narrador: 'NARRADOR', flaco: 'FLACO', karla2: 'KARLA'
};
const NAMECOL = { jesus: '#ffd060', dios: '#fff6a0', narrador: '#a0a0c0', yesenia: '#ff80c0', cel: '#40ffa0', lic: '#ff6060' };

// ------------------------------------------------------------
//  Frases ambientales
// ------------------------------------------------------------
const LINES = {
  morra: ['Ay no, el del pelo de librito.', '¿Ese es el que postea en Chismes?', 'Ni con 50 figuras, mijo.', '¿Y ese peinado? ¿Es casco?', 'No me veas, me da cringe.', 'Mi prima dice que le habló de anime 2 horas.', 'Huele a Cheetos y creatina.', 'Mira, el monogámico jaja'],
  morraHero: ['¡Es el héroe de Guamúchil! ...igual no.', 'Gracias por salvar al Ídolo, raro.', 'Héroe sí, novio jamás.', 'Mi mamá dice que eres buen muchacho. Raro, pero bueno.'],
  senora: ['¡Ese es el hijo de la Lupe!', 'Mijo, córtate ese pelo.', 'Ay, pobre Lupe...', '¿Ya comiste, mijo? Te ves flaquito.', 'Yo lo vi en el grupo de Chismes.'],
  senoraHero: ['¡Dios te bendiga, Jesús!', '¡Ese es el que salvó al Ídolo!', 'Mijo, te hice tamales. Bueno, no.'],
  vato: ['¿Qué onda, librito?', 'Ese vato hace curl en el rack, compa.', 'Puro Guamúchil, viejo.', '¿Y la troca, compa? Ah, no tienes.', 'Arre.', 'Ahí va el de las muñecas.'],
  vatoHero: ['¡Qué rifado, Jesús!', 'Eres leyenda, compa.', '¡El héroe del Évora!'],
  otaku: ['Jesús-kun, ¿ya viste el nuevo cap?', 'Esa figura que tienes es pirata.', 'Senpai noticed me... no.', 'Kenji tiene restock el jueves.'],
  gymbro: ['¿Cuánto en banca, bro?', 'Haz pierna, bro. En serio.', 'Creatina antes de dormir, bro.', 'Bro, tus piernas son popotes.'],
  abuelo: ['En mis tiempos la gente trabajaba en el garbanzo.', 'Yo vi cantar a Pedro Infante, muchacho.', 'Ese pelo parece libro de cuentos.', 'El tren llegó en 1908 y desde ahí puro desmadre.'],
  cop: ['Circulando, joven.', 'Ese peinado debería ser ilegal.', 'Lo tengo en la mira, librito.'],
  hit: ['¡Ay, pendejo!', '¡Pinche loco!', '¡Le voy a decir a tu mamá!', '¡Ahorita le hablo a los municipales!', '¡Me las vas a pagar!'],
  carStolen: ['¡MI CARRO, CABRÓN!', '¡Está tirando el carro!', '¡Ayúdenme! ¡El del pelo raro!', '¡Ni lo había terminado de pagar!'],
  dodge: ['¡Fíjate, pendejo!', '¡Aprende a manejar!', '¡Ay, el loco!', '¡¿Estás ciego?!'],
  slap: ['¡¿QUÉ TE PASA?!', '¡Cachetada de regalo!', '¡Ubícate, chud!', '¡Ni lo intentes!'],
  women_thoughts: ['(...seguro le gustan los de troca...)', '(Todas son iguales. Excepto Yesenia.)', '(No me mira. Mejor. Soy monogámico.)', '(Interesada. Lo sé. Nunca le he hablado, pero lo sé.)', '(Si supiera que tengo la Remu Ed. Garbanzo...)', '(Ni me pela... uff, me salvé.)', '(Me miró. ¿Me miró? No. Miró atrás de mí.)']
};

// Roasts cuando le hablas a una mujer
const ROASTS = [
  ['¿Qué quieres?', 'Eh... nada. Soy monogámico.', 'Ok...? Nadie te preguntó.'],
  ['¿Me estás siguiendo?', 'No. Voy al gym. Que está... por allá.', 'El gym está para el otro lado, genio.'],
  ['Ay, ¿tú eres el de Guamúchil Chismes?', 'Fue un análisis sociológico.', 'Fue una pendejada, mijo.'],
  ['¿Esa playera es de anime?', 'Es arte japonés de colección.', 'Tiene una mancha de Cheetos en el arte.'],
  ['Bonito pelo... ¿es de verdad?', '¡Es volumen natural!', 'Parece un libro abierto. Literal.'],
  ['¿Se te ofrece algo?', 'Solo quería decirte que no me interesas.', '...Wow. Ok. ¡Qué bueno!']
];

// Tentaciones (sistema monogámico)
const TEMPTATIONS = [
  { line: 'Oye, disculpa... ¿tienes hora?' },
  { line: 'Hola, ¿sabes dónde queda el Mercado?' },
  { line: '¡Ay, perdón! Te pisé.' },
  { line: '¿Tú eres el que salvó la estatua? ¡Qué valiente!' }
];

// Posts para Guamúchil Chismes
const POSTS = [
  { t: 'Las morras de Guamúchil solo quieren vatos con troca Lobo.', funa: 2, cope: -15, likes: 3,
    com: ['SEÑORA CHAYO: ¿no es el hijo de la Lupe? AY LUPE', 'KAREN_GMCH: el de la foto de anime jajaja', 'DON BETO: y tú qué troca tienes, mijo', 'SEÑORA CHAYO: YA LO UBIQUÉ, VAMOS POR ÉL'] },
  { t: 'Soy monogámico. Por si alguna preguntaba.', funa: 0, cope: 10, likes: 0,
    com: ['NADIE: nadie preguntó', 'PRIMA_YESI: 47 jajajas', 'EL BRAYAN: monogámico con tu mano jajaja'] },
  { t: 'Busco novia NO interesada. Requisitos: que le guste el anime, el gym, y que no hable.', funa: 1, cope: -5, likes: 2,
    com: ['MORRA_EVORA: y tú qué ofreces', 'KENJI: yo también busco jaja', 'SEÑORA CHAYO: ¡LUPE, TU HIJO OTRA VEZ!'] },
  { t: 'Vendo figura de Remu. No acepto cambios. No ofrezcan menos. (Era broma, no la vendo, es mi vida)', funa: 0, cope: 5, likes: 4,
    com: ['KENJI: jajaja sabía que no la ibas a vender', 'ANÓNIMO: doy 50 pesos', 'JESÚS: BLOQUEADO'] },
  { t: '¿Alguien sabe si el Titanes Gym abre el domingo?', funa: 0, cope: -5, likes: 12,
    com: ['DON CHAVA: abre siempre, flojo', 'KARLA_GYMRAT: sí abre', 'EL BRAYAN: abre pero tú no entrenas pierna bro'] },
  { t: 'El Ídolo de Guamúchil era un sigma. Prueba: tenía voz, pegaba con todas y hacía ejercicio. Respeto.', funa: 0, cope: -10, likes: 64,
    com: ['DON BETO: eso sí, respeto al Ídolo', 'SEÑORA CHAYO: por fin dices algo bueno mijo', 'ABUELO_ÉVORA: yo lo vi en el cine 7 veces'] }
];

// Chats nocturnos con Yesenia
const YES_CHATS = [
  { q: 'amor me haces una recarga de 200? no tengo saldo para hablarte :(', opts: [
    { t: 'Claro mi reina (-$200)', cost: 200, loy: 10, r: 'gracias amor!! :3 eres el único que me entiende', cope: -10 },
    { t: 'Me gasté todo en figuras', loy: -5, r: 'ok.', cope: 15 },
    { t: '¿Videollamada mejor?', loy: 0, r: 'ay es que se me rompió la cámara otra vez :(', cope: 10 }] },
  { q: 'vi una figura de Zero Tú en una página bien barata!! cómprala amor, te la mereces <3', opts: [
    { t: 'Comprar (-$600)', cost: 600, loy: 8, r: 'Llegó la figura... es un llavero de 15 pesos. Dice "Corporativo Waifu".', cope: 20 },
    { t: 'Mejor ahorro', loy: -3, r: 'ay qué codo. bueno', cope: 5 }] },
  { q: '¿me eres fiel? :3', opts: [
    { t: '¡SOY MONOGÁMICO HASTA LA MUERTE!', loy: 12, r: 'jajaja ok amor. yo también. con todos. digo, contigo.', cope: -5, fe: 2 },
    { t: '¿Y tú me eres fiel?', loy: 0, r: 'ERROR... digo, claro amor!!!', cope: 5 }] },
  { q: 'te mando foto <3', opts: [
    { t: 'Ver foto', loy: 5, r: 'Es una modelo. Tiene marca de agua: "STOCKPHOTO". Dice que es su apellido.', cope: 10 },
    { t: 'Mándame audio mejor', loy: 2, r: 'ESTE NÚMERO NO ACEPTA AUDIOS. GRACIAS POR SU PREFERENCIA.', cope: 12 }] },
  { q: 'mi primo el Lic dice que eres muy buen cliente jeje', opts: [
    { t: '¿Buen cliente?', loy: 0, r: 'digo, buen NOVIO. jeje. buenas noches amor', cope: 8 },
    { t: 'Salúdame a tu primo', loy: 4, r: 'él te saluda. dice que ya llegó stock nuevo :3', cope: 0 }] },
  { q: '¿cuándo nos vemos en persona?', opts: [
    { t: '¡Mañana!', loy: 6, r: 'ay mañana no puedo, tengo... cosas. de humana.', cope: 12 },
    { t: 'Cuando tenga mi troca', loy: 2, r: 'jajaja ok amor. nunca entonces', cope: 15 }] }
];
const KARLA_CHATS = [
  { q: 'oye, ¿mañana vas al gym? hoy toca pierna otra vez >:)', opts: [
    { t: 'Ahí estaré', loy: 5, r: 'eso. y no hagas curl en el rack o te pego', cope: -15 },
    { t: 'Soy monogámico', loy: 0, r: '...¿Y eso qué tiene que ver con la pierna, wey?', cope: -5 }] },
  { q: 'conseguí una figura de Frieren en descuento. ¿la quieres ver el sábado en la plaza?', opts: [
    { t: 'S-sí', loy: 8, r: 'ok. no es cita eh. es reunión de coleccionistas.', cope: -20, fe: 3 },
    { t: '¿Es una trampa del Lic?', loy: -2, r: 'jajaja estás bien dañado, Jesús. buenas noches', cope: -5 }] },
  { q: 'Don Chava dice que tu racha va bien. no la rompas', opts: [
    { t: 'Nunca', loy: 4, r: 'eso, librito.', cope: -10 }] }
];

// Stream (Twitch)
const STREAM_OPTS = [
  { t: 'Unboxing de figura en vivo', need: 'figs', v: [8, 25], cash: [20, 120], cope: -5, txt: 'Abres una caja vacía de tu colección. Chat: "ya la habías abierto, wey".' },
  { t: 'Explicar por qué Evangelion es filosofía', v: [-6, 10], cash: [0, 40], cope: 0, txt: 'Hablas 47 minutos. 2 viewers se duermen. Uno era tu mamá.' },
  { t: 'RANT: "Las mujeres de hoy en día..."', rant: 1, v: [40, 90], cash: [0, 0], cope: 25, txt: 'El chat explota. 3 minutos después: CUENTA SUSPENDIDA 24H. Jesús: "¿Censura?" Chat: "no, eres tú".' },
  { t: 'Flexear el bícep', flex: 1, v: [0, 30], cash: [10, 80], cope: -8, txt: 'Flexeas. La cámara no detecta el músculo.' },
  { t: 'Leer comentarios', v: [5, 15], cash: [0, 30], cope: 12, txt: 'Comentario: "ese pelo parece un libro de la SEP". Duele.' },
  { t: 'Cantar como el Ídolo de Guamúchil', v: [10, 40], cash: [40, 160], cope: -10, txt: 'Desafinas, pero con sentimiento. Los señores del chat lloran.' },
  { t: 'Llorar por Yesenia', v: [5, 35], cash: [30, 150], cope: -15, txt: 'Donaciones por lástima. Funciona. Te sientes peor.' },
  { t: 'Jugar Free Fire', v: [-5, 20], cash: [0, 60], cope: -5, txt: 'Te matan 9 niños de 11 años. Uno te dice "papu".' },
  { t: 'Rutina de gym en vivo', flex: 1, v: [5, 30], cash: [20, 90], cope: -10, txt: 'Haces curl en el rack en vivo. Don Chava te banea del gym por 5 minutos.' }
];

// Museo: lore real
const MUSEO_LORE = [
  'El nombre "Guamúchil" viene del árbol guamúchil, una leguminosa. Se dice que su raíz es "Xua-Mocheleb".',
  'Guamúchil está en el Valle del Évora, cabecera de Salvador Alvarado, el municipio más pequeño de Sinaloa.',
  'En 1785 el río Évora cambió su curso y la gente tuvo que poblar ambas orillas.',
  'La llegada del ferrocarril (1908) le dio vida a la ciudad moderna. Por eso existe la calle Ferrocarril.',
  'Pedro Infante nació en Mazatlán, pero su familia se mudó a Guamúchil en 1919 y ahí creció. Por eso le dicen "El Ídolo de Guamúchil".',
  'El garbanzo es orgullo del municipio. La "Tatema de Garbanzo" se celebra en la explanada de la Presa Eustaquio Buelna.',
  'De aquí son el boxeador Carlos Cuadras y la cantante Ana Gabriel. Y ahora tú, Jesús. Bueno... ya veremos.'
];

// Tips de carga
const TIPS = [
  'Ve al gym TODOS los días o perderás Mamadez.',
  'Las figuras de anime dan bonus pasivos. Cómpralas TODAS. (Kazoo Studios no da asesoría financiera.)',
  'Si tu Copium llega a 100 entras en MODO COPIUM: más daño, menos dignidad.',
  'Golpear mujeres no funciona. Te van a cachetear. Te lo mereces.',
  'Duerme en casa para guardar y pasar al día siguiente.',
  'Los Milagros cuestan Fe. Reza en la Parroquia o ayuda a la gente.',
  'Roba carros con [E]. Es Guamúchil, pero igual llega la policía.',
  'Hay figuras perdidas escondidas por todo Guamúchil. Busca en el cerro, la presa y el río.',
  'La Feria del Taco sobre la Avenida Turística tiene los mejores tacos del Valle.'
];
