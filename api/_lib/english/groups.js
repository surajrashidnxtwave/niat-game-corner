/* English Adda · Word Groups (daily puzzle: 16 words, 4 groups of 4). Tier 1 = vocab levels 1–3, tier 2 = 4–6, tier 3 = 7–8.
   FOR TEAM REVIEW · written by Claude 2026-11-12, rewritten simpler 2026-11-12 after owner feedback. Each word must fit exactly one group. */
export const GROUPS = [
  // ---------------- Tier 1 (levels 1–3): very common words, four clearly different groups ----------------
  { id: 'g1-01', tier: 1, groups: [
    { name: 'Fruits', words: ['mango', 'banana', 'apple', 'grapes'], why: 'All four are fruits.' },
    { name: 'Colours', words: ['red', 'blue', 'green', 'yellow'], why: 'All four are colours.' },
    { name: 'Body parts', words: ['hand', 'nose', 'ear', 'leg'], why: 'All four are parts of your body.' },
    { name: 'Animals', words: ['dog', 'cat', 'cow', 'horse'], why: 'All four are animals we see around us.' }
  ] },
  { id: 'g1-02', tier: 1, groups: [
    { name: 'Family members', words: ['mother', 'father', 'sister', 'brother'], why: 'All four are people in your family.' },
    { name: 'Days of the week', words: ['monday', 'tuesday', 'friday', 'sunday'], why: 'All four are days of the week.' },
    { name: 'Vehicles', words: ['bus', 'car', 'train', 'bicycle'], why: 'All four take you from place to place.' },
    { name: 'In a classroom', words: ['desk', 'chalk', 'blackboard', 'bench'], why: 'You see all four in a classroom.' }
  ] },
  { id: 'g1-03', tier: 1, groups: [
    { name: 'Cricket words', words: ['wicket', 'bowler', 'umpire', 'boundary'], why: 'All four are words from a cricket match.' },
    { name: 'Weather', words: ['rain', 'wind', 'cloud', 'storm'], why: 'All four are about the weather.' },
    { name: 'In the kitchen', words: ['plate', 'spoon', 'knife', 'cooker'], why: 'You find all four in a kitchen.' },
    { name: 'Months', words: ['january', 'march', 'july', 'december'], why: 'All four are months of the year.' }
  ] },
  { id: 'g1-04', tier: 1, groups: [
    { name: 'Vegetables', words: ['potato', 'onion', 'tomato', 'carrot'], why: 'All four are vegetables.' },
    { name: 'Birds', words: ['crow', 'parrot', 'sparrow', 'peacock'], why: 'All four are birds.' },
    { name: 'Clothes', words: ['shirt', 'saree', 'jeans', 'kurta'], why: 'All four are things we wear.' },
    { name: 'Numbers', words: ['three', 'seven', 'ten', 'twenty'], why: 'All four are numbers.' }
  ] },
  { id: 'g1-05', tier: 1, groups: [
    { name: 'Phone things', words: ['charger', 'battery', 'screen', 'camera'], why: 'All four are about your mobile phone.' },
    { name: 'Shapes', words: ['circle', 'square', 'triangle', 'rectangle'], why: 'All four are shapes.' },
    { name: 'Drinks', words: ['tea', 'coffee', 'milk', 'juice'], why: 'All four are things we drink.' },
    { name: 'Jobs', words: ['doctor', 'teacher', 'driver', 'farmer'], why: 'All four are jobs people do.' }
  ] },
  { id: 'g1-06', tier: 1, groups: [
    { name: 'Rooms in a house', words: ['kitchen', 'bedroom', 'bathroom', 'hall'], why: 'All four are rooms in a house.' },
    { name: 'Sports', words: ['cricket', 'football', 'kabaddi', 'tennis'], why: 'All four are sports.' },
    { name: 'School subjects', words: ['maths', 'science', 'english', 'history'], why: 'All four are subjects you study in school.' },
    { name: 'Snacks', words: ['samosa', 'biscuit', 'chips', 'pakora'], why: 'All four are snacks we eat with tea.' }
  ] },
  { id: 'g1-07', tier: 1, groups: [
    { name: 'Money words', words: ['rupee', 'coin', 'note', 'wallet'], why: 'All four are about money.' },
    { name: 'Feelings', words: ['happy', 'sad', 'angry', 'scared'], why: 'All four are feelings.' },
    { name: 'In the sky', words: ['sun', 'moon', 'star', 'rainbow'], why: 'You see all four in the sky.' },
    { name: 'Sea animals', words: ['fish', 'shark', 'whale', 'dolphin'], why: 'All four live in the sea.' }
  ] },
  { id: 'g1-08', tier: 1, groups: [
    { name: 'Travel things', words: ['ticket', 'suitcase', 'passport', 'luggage'], why: 'All four are things you need when you travel.' },
    { name: 'Insects', words: ['ant', 'bee', 'fly', 'mosquito'], why: 'All four are small insects.' },
    { name: 'Units of time', words: ['second', 'minute', 'hour', 'week'], why: 'All four are ways to measure time.' },
    { name: 'In a school bag', words: ['book', 'pen', 'pencil', 'eraser'], why: 'You carry all four in your school bag.' }
  ] },
  { id: 'g1-09', tier: 1, groups: [
    { name: 'Furniture', words: ['chair', 'table', 'sofa', 'bed'], why: 'All four are furniture in a home.' },
    { name: 'Home machines', words: ['fan', 'fridge', 'television', 'mixer'], why: 'All four are machines at home that run on electricity.' },
    { name: 'Flowers', words: ['rose', 'lotus', 'jasmine', 'sunflower'], why: 'All four are flowers.' },
    { name: 'Zoo animals', words: ['lion', 'tiger', 'elephant', 'monkey'], why: 'You can see all four in a zoo.' }
  ] },
  { id: 'g1-10', tier: 1, groups: [
    { name: 'Breakfast food', words: ['idli', 'dosa', 'poha', 'upma'], why: 'All four are Indian breakfast dishes.' },
    { name: 'In a hospital', words: ['nurse', 'medicine', 'injection', 'bandage'], why: 'You find all four in a hospital.' },
    { name: 'Water places', words: ['river', 'lake', 'sea', 'pond'], why: 'All four are places with water.' },
    { name: 'Indoor games', words: ['carrom', 'chess', 'ludo', 'cards'], why: 'All four are games you play inside the house.' }
  ] },

  // ---------------- Tier 2 (levels 4–6): simple words, synonyms, things you ___, things that are ___ ----------------
  { id: 'g2-01', tier: 2, groups: [
    { name: 'Words meaning big', words: ['big', 'huge', 'large', 'giant'], why: 'All four mean very big.' },
    { name: 'Words meaning small', words: ['small', 'tiny', 'little', 'mini'], why: 'All four mean small.' },
    { name: 'Things you take', words: ['bath', 'photo', 'bus', 'rest'], why: 'We say take a bath, take a photo, take a bus, take rest.' },
    { name: 'Hot things', words: ['fire', 'sun', 'oven', 'stove'], why: 'All four are very hot.' }
  ] },
  { id: 'g2-02', tier: 2, groups: [
    { name: 'Words meaning happy', words: ['happy', 'glad', 'cheerful', 'joyful'], why: 'All four mean feeling happy.' },
    { name: 'Words meaning sad', words: ['sad', 'upset', 'unhappy', 'low'], why: 'All four mean feeling sad.' },
    { name: 'Things you make', words: ['tea', 'noise', 'friends', 'mistake'], why: 'We say make tea, make noise, make friends, make a mistake.' },
    { name: 'Cold things', words: ['snow', 'kulfi', 'winter', 'fridge'], why: 'All four are cold.' }
  ] },
  { id: 'g2-03', tier: 2, groups: [
    { name: 'Words meaning fast', words: ['fast', 'quick', 'rapid', 'speedy'], why: 'All four mean moving fast.' },
    { name: 'Words meaning clever', words: ['smart', 'clever', 'bright', 'intelligent'], why: 'All four describe a clever person.' },
    { name: 'Things you do', words: ['homework', 'exercise', 'yoga', 'business'], why: 'We say do homework, do exercise, do yoga, do business.' },
    { name: 'Things you play', words: ['guitar', 'cricket', 'chess', 'games'], why: 'We say play the guitar, play cricket, play chess, play games.' }
  ] },
  { id: 'g2-04', tier: 2, groups: [
    { name: 'Words meaning angry', words: ['angry', 'mad', 'furious', 'annoyed'], why: 'All four mean angry.' },
    { name: 'Words meaning start', words: ['start', 'begin', 'open', 'launch'], why: 'All four mean to start something.' },
    { name: 'Things you break', words: ['rule', 'record', 'glass', 'promise'], why: 'We say break a rule, break a record, break a glass, break a promise.' },
    { name: 'Sweet things', words: ['sugar', 'honey', 'jalebi', 'mango'], why: 'All four taste sweet.' }
  ] },
  { id: 'g2-05', tier: 2, groups: [
    { name: 'Words meaning difficult', words: ['hard', 'tough', 'difficult', 'tricky'], why: 'All four mean not easy.' },
    { name: 'Words meaning beautiful', words: ['pretty', 'lovely', 'beautiful', 'cute'], why: 'All four mean nice to look at.' },
    { name: 'Things you pay', words: ['bill', 'fees', 'rent', 'tax'], why: 'We say pay the bill, pay fees, pay rent, pay tax.' },
    { name: 'Things you watch', words: ['movie', 'match', 'news', 'cartoon'], why: 'We say watch a movie, watch a match, watch the news, watch a cartoon.' }
  ] },
  { id: 'g2-06', tier: 2, groups: [
    { name: 'Words meaning look', words: ['see', 'look', 'watch', 'stare'], why: 'All four are about using your eyes.' },
    { name: 'Words meaning talk', words: ['talk', 'speak', 'say', 'chat'], why: 'All four are about using your voice.' },
    { name: 'Things you catch', words: ['ball', 'bus', 'cold', 'fish'], why: 'We say catch a ball, catch a bus, catch a cold, catch a fish.' },
    { name: 'Things you lose', words: ['weight', 'temper', 'hope', 'money'], why: 'We say lose weight, lose your temper, lose hope, lose money.' }
  ] },
  { id: 'g2-07', tier: 2, groups: [
    { name: 'Words for a friend', words: ['friend', 'buddy', 'bestie', 'bro'], why: 'All four are words for a friend.' },
    { name: 'Round things', words: ['wheel', 'coin', 'roti', 'moon'], why: 'All four are round in shape.' },
    { name: 'Sharp things', words: ['knife', 'needle', 'blade', 'scissors'], why: 'All four are sharp and can cut or poke.' },
    { name: 'Things with wings', words: ['bird', 'plane', 'butterfly', 'bat'], why: 'All four have wings and can fly.' }
  ] },
  { id: 'g2-08', tier: 2, groups: [
    { name: 'Words meaning finish', words: ['finish', 'end', 'stop', 'complete'], why: 'All four mean to finish something.' },
    { name: 'Loud things', words: ['horn', 'thunder', 'drum', 'alarm'], why: 'All four make a loud sound.' },
    { name: 'Soft things', words: ['pillow', 'cotton', 'wool', 'feather'], why: 'All four feel soft.' },
    { name: 'Things you send', words: ['message', 'email', 'letter', 'parcel'], why: 'We send all four to other people.' }
  ] },
  { id: 'g2-09', tier: 2, groups: [
    { name: 'Words meaning scared', words: ['scared', 'afraid', 'frightened', 'fearful'], why: 'All four mean feeling fear.' },
    { name: 'Things you wear', words: ['shoes', 'ring', 'glasses', 'cap'], why: 'We wear all four.' },
    { name: 'Things you charge', words: ['phone', 'laptop', 'battery', 'powerbank'], why: 'We charge all four with electricity.' },
    { name: 'Things you book', words: ['ticket', 'room', 'cab', 'table'], why: 'We say book a ticket, book a room, book a cab, book a table.' }
  ] },
  { id: 'g2-10', tier: 2, groups: [
    { name: 'Words meaning wrong', words: ['wrong', 'false', 'incorrect', 'untrue'], why: 'All four mean not right.' },
    { name: 'Things you fill', words: ['form', 'blanks', 'tank', 'bucket'], why: 'We say fill a form, fill in the blanks, fill the tank, fill a bucket.' },
    { name: 'Things you cut', words: ['cake', 'nails', 'paper', 'ribbon'], why: 'We say cut a cake, cut your nails, cut paper, cut a ribbon.' },
    { name: 'Things you wash', words: ['clothes', 'hands', 'dishes', 'face'], why: 'We say wash clothes, wash your hands, wash the dishes, wash your face.' }
  ] },

  // ---------------- Tier 3 (levels 7–8): simple words, cleverer groups (compounds, hidden words, rhymes, sounds) ----------------
  { id: 'g3-01', tier: 3, groups: [
    { name: '___ball', words: ['foot', 'basket', 'snow', 'eye'], why: 'Add ‘ball’: football, basketball, snowball, eyeball.' },
    { name: '___room', words: ['class', 'bed', 'bath', 'store'], why: 'Add ‘room’: classroom, bedroom, bathroom, storeroom.' },
    { name: '___book', words: ['note', 'text', 'pass', 'cook'], why: 'Add ‘book’: notebook, textbook, passbook, cookbook.' },
    { name: 'Rhymes with cat', words: ['hat', 'bat', 'mat', 'rat'], why: 'All four rhyme with cat.' }
  ] },
  { id: 'g3-02', tier: 3, groups: [
    { name: 'Hidden body part', words: ['farm', 'chair', 'slip', 'bear'], why: 'Look inside: f(arm), c(hair), s(lip), b(ear).' },
    { name: 'Sun___', words: ['rise', 'set', 'flower', 'burn'], why: 'Put ‘sun’ in front: sunrise, sunset, sunflower, sunburn.' },
    { name: 'Rhymes with night', words: ['kite', 'white', 'bite', 'write'], why: 'All four rhyme with night.' },
    { name: '___time', words: ['lunch', 'dinner', 'play', 'tea'], why: 'Add ‘time’: lunchtime, dinnertime, playtime, teatime.' }
  ] },
  { id: 'g3-03', tier: 3, groups: [
    { name: 'Hidden animal', words: ['plant', 'bowl', 'pirate', 'when'], why: 'Look inside: pl(ant), b(owl), pi(rat)e, w(hen).' },
    { name: '___board', words: ['key', 'card', 'score', 'chalk'], why: 'Add ‘board’: keyboard, cardboard, scoreboard, chalkboard.' },
    { name: '___fly', words: ['butter', 'dragon', 'fire', 'house'], why: 'Add ‘fly’: butterfly, dragonfly, firefly, housefly.' },
    { name: 'Same backwards', words: ['mom', 'dad', 'noon', 'level'], why: 'Read them backwards and they stay the same.' }
  ] },
  { id: 'g3-04', tier: 3, groups: [
    { name: 'Has teeth', words: ['comb', 'saw', 'zip', 'shark'], why: 'All four have teeth.' },
    { name: 'Has legs', words: ['table', 'stool', 'bench', 'cot'], why: 'All four stand on legs, but none of them can walk.' },
    { name: 'Has buttons', words: ['shirt', 'remote', 'calculator', 'lift'], why: 'All four have buttons.' },
    { name: 'Has wheels', words: ['cycle', 'auto', 'scooter', 'bus'], why: 'All four move on wheels.' }
  ] },
  { id: 'g3-05', tier: 3, groups: [
    { name: 'Hidden number', words: ['often', 'weight', 'network', 'money'], why: 'Look inside: of(ten), w(eight), ne(two)rk, m(one)y.' },
    { name: '___man', words: ['post', 'police', 'fire', 'sales'], why: 'Add ‘man’: postman, policeman, fireman, salesman.' },
    { name: 'Rain___', words: ['bow', 'coat', 'drop', 'fall'], why: 'Put ‘rain’ in front: rainbow, raincoat, raindrop, rainfall.' },
    { name: 'Rhymes with cake', words: ['lake', 'snake', 'bake', 'shake'], why: 'All four rhyme with cake.' }
  ] },
  { id: 'g3-06', tier: 3, groups: [
    { name: 'Sounds like a letter', words: ['bee', 'sea', 'eye', 'why'], why: 'Say them aloud: B, C, I, Y.' },
    { name: '___ cake', words: ['cup', 'cheese', 'sponge', 'birthday'], why: 'Add ‘cake’: cupcake, cheesecake, sponge cake, birthday cake.' },
    { name: 'Home___', words: ['work', 'made', 'town', 'sick'], why: 'Put ‘home’ in front: homework, homemade, hometown, homesick.' },
    { name: '___box', words: ['lunch', 'match', 'letter', 'post'], why: 'Add ‘box’: lunchbox, matchbox, letterbox, postbox.' }
  ] },
  { id: 'g3-07', tier: 3, groups: [
    { name: '___light', words: ['moon', 'flash', 'candle', 'spot'], why: 'Add ‘light’: moonlight, flashlight, candlelight, spotlight.' },
    { name: 'Hidden pen', words: ['happen', 'spend', 'penguin', 'carpenter'], why: 'Each one has ‘pen’ inside it.' },
    { name: 'Tooth___', words: ['brush', 'paste', 'ache', 'pick'], why: 'Put ‘tooth’ in front: toothbrush, toothpaste, toothache, toothpick.' },
    { name: 'Things you crack', words: ['egg', 'joke', 'code', 'exam'], why: 'We say crack an egg, crack a joke, crack the code, crack an exam.' }
  ] },
  { id: 'g3-08', tier: 3, groups: [
    { name: 'Hair___', words: ['cut', 'style', 'dryer', 'pin'], why: 'Put ‘hair’ in front: haircut, hairstyle, hair dryer, hairpin.' },
    { name: '___line', words: ['on', 'dead', 'air', 'guide'], why: 'Add ‘line’: online, deadline, airline, guideline.' },
    { name: 'School ___', words: ['bag', 'uniform', 'fees', 'teacher'], why: 'School bag, school uniform, school fees, school teacher.' },
    { name: 'Hard on the outside', words: ['egg', 'turtle', 'coconut', 'crab'], why: 'All four have a hard cover on the outside.' }
  ] },
  { id: 'g3-09', tier: 3, groups: [
    { name: 'Hand___', words: ['writing', 'shake', 'made', 'some'], why: 'Put ‘hand’ in front: handwriting, handshake, handmade, handsome.' },
    { name: 'Water___', words: ['fall', 'melon', 'proof', 'park'], why: 'Put ‘water’ in front: waterfall, watermelon, waterproof, water park.' },
    { name: 'Class___', words: ['room', 'mate', 'test', 'teacher'], why: 'Put ‘class’ in front: classroom, classmate, class test, class teacher.' },
    { name: 'Sounds like a number', words: ['won', 'too', 'for', 'ate'], why: 'Say them aloud: one, two, four, eight.' }
  ] },
  { id: 'g3-10', tier: 3, groups: [
    { name: '___phone', words: ['head', 'ear', 'smart', 'cell'], why: 'Add ‘phone’: headphone, earphone, smartphone, cellphone.' },
    { name: '___ moon', words: ['half', 'new', 'full', 'honey'], why: 'Half moon, new moon, full moon, honeymoon.' },
    { name: 'Hidden red', words: ['tired', 'bored', 'credit', 'hundred'], why: 'Each one has ‘red’ inside it.' },
    { name: 'Foot___', words: ['ball', 'path', 'print', 'step'], why: 'Put ‘foot’ in front: football, footpath, footprint, footstep.' }
  ] }
];
