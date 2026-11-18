/* Drive School · Day 23 · Motivation · Willpower vs environment (Watts, Duncan & Quan 2018; Duckworth, Gendler & Gross 2016).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts against Watts, Duncan & Quan, Psychological Science 29(7), 2018 ("Revisiting the Marshmallow Test"):
   over 900 children (the original Stanford studies had fewer than 90); the link between waiting at age 4 and achievement at 15 was about half
   the size first reported, and controls for family background, early ability and home life cut it by about two-thirds (the abstract's wording).
   The "change the situation" idea: Duckworth, Gendler & Gross, Perspectives on Psychological Science, 2016 (situational self-control strategies).
   We don't give numbers from that paper. Facts checked online by Claude Code, Nov 17, 2026.
   The commit saves the student's one change in memo plan_d23. */
window.DRIVE_LESSONS[23] = { screens: [
  { type:'info', kicker:'Day 23 · Motivation', title:'The marshmallow test', visual:['🍬 👧', '⏳ 🍬🍬', '🎓 ❓', '🤔'],
    body:['1960s, Stanford. A 4-year-old sits in front of one marshmallow. 🍬','“Wait till I’m back, and you get two.” Then the adult leaves the room.','Years later, the kids who waited seemed to do better in school.','So is willpower the secret to success? Let’s check.'],
    guide:'Keep your own study room in mind today.', cta:'Start' },
  { type:'multi', key:'distract', logKind:'sort', kicker:'Feel it', q:'When you study in your room or hostel, what pulls you away? Tap all that fit.',
    opts:['My phone, right next to me','Notifications popping up','Roommates or family chatting','Studying on my bed','Laptop with YouTube one tab away','Snacks within reach','Noise outside','A messy desk'],
    min:1, guide:'Be honest. Everyone has a few.' },
  { type:'quiz', id:'d23q1', kicker:'Predict', q:'In 2018, researchers redid the marshmallow test with over 900 kids. How strong was the link with later marks?',
    opts:[['Even stronger than in the first study',false,'No. A much bigger study found a weaker link, not a stronger one.'],
          ['Smaller, and smaller again after family background',true,'Right. Half the size, and much smaller again after counting home life.'],
          ['About the same as the first study found',false,'Not quite. With more kids from more kinds of homes, the link got smaller.'],
          ['No link at all between waiting and marks',false,'There was a small link. It was just far smaller than the famous version.']],
    why:'Bigger, fairer studies often shrink famous results. Guess first, then check.' },
  { type:'info', kicker:'Prove it', title:'The marshmallow test, redone', visual:['👧👦 900+', '📉 ½', '🏠 📉'],
    facts:[['900+','kids in the 2018 study. The original had fewer than 90.'],['About half','as strong a link with marks at 15 as first claimed'],['About ⅔','smaller again once family background and early ability were counted']],
    body:['Kids from better-off homes tended to wait longer, and also tended to do better in school.','So a lot of that famous “willpower” link was really about the situation the kid grew up in.'],
    note:'Source: Watts, Duncan & Quan, Psychological Science, 2018.',
    guide:'Willpower isn’t the whole story. Not even most of it.' },
  { type:'info', kicker:'Name it', title:'Change the room, not just you', visual:['💪 😩', '🏠 🛠️', '📱 ➡️ 🎒', '🧠 😌'],
    body:['Willpower is fighting the marshmallow while staring at it. 😩 It runs out.','Smart self-control is <b>changing the situation</b> so the fight never starts.','Phone in the bag, not on the desk. Desk, not bed. One tab, not twenty.','People who seem disciplined often just face fewer temptations. They set it up that way. 🛠️'],
    guide:'Don’t beat temptation. Remove it.' },
  { type:'swipe', id:'d23sw', kicker:'Swipe it', title:'Willpower or changing the room?', sides:['Willpower','Change the room'],
    cards:[['Keeping your phone next to you and trying not to look',0,'That’s a fight you have to win every minute.'],
           ['Putting your phone in a drawer across the room',1,'Now the fight is gone. Getting it takes effort.'],
           ['Telling yourself “I won’t open YouTube”',0,'A promise to yourself, with YouTube one click away.'],
           ['Logging out of YouTube on your laptop before you start',1,'One extra step is often enough to stop a habit.'],
           ['Studying on your bed and trying hard to stay awake',0,'Your bed says “sleep”. You’re fighting it.'],
           ['Moving to the reading room for your study hour',1,'A new place with no bed and no roommate chat.']],
    guide:'Swipe right if it changes the situation.' },
  { type:'quiz', id:'d23q2', kicker:'Use it', q:'Aman studies in his hostel room. His roommate games every evening and Aman keeps joining in. Best move?',
    opts:[['Just try harder to say no each night',false,'Saying no every single night uses willpower over and over. It usually runs out.'],
          ['Ask his roommate to stop gaming forever',false,'That’s not fair on the roommate, and it probably won’t last.'],
          ['Study late at night after the gaming',false,'He’d be tired, and the same pull would just come back tomorrow.'],
          ['Study in the library from 7 to 9 pm',true,'Yes. He changes where he is, so the game isn’t there to say no to.']],
    why:'When something tempts you every day, change the place or the setup. Don’t plan to win the same fight daily.' },
  { type:'quiz', id:'d23q3', kicker:'Use it', q:'Sneha says, “I have zero willpower. My friend can study with her phone right there.” What’s most likely?',
    opts:[['Her friend has set up her phone or routine to tempt her less',true,'Likely. Silent mode, apps off, a fixed study time. The setup does the work.'],
          ['Her friend was born with more willpower',false,'Maybe a little, but the research says the situation matters a lot more than we think.'],
          ['Sneha just needs to want it more',false,'Wanting it more doesn’t stop the phone from buzzing.'],
          ['Willpower can’t be changed, so she should give up',false,'No need to change your willpower. Change your setup instead.']],
    why:'People who look disciplined often just face fewer temptations. You can copy their setup.' },
  { type:'commit', key:'d23', q:'Pick one change to your study space. Make it today.',
    opts:['If I sit down to study, then my phone goes in my bag across the room.','If it’s my study hour, then I’ll work at my desk or the reading room, never on my bed.','If I open my laptop to study, then I’ll close every tab except the one I need.'],
    guide:'One change. Small enough to do tonight.' },
  { type:'wrap', lines:['Willpower runs out. A good setup doesn’t. 🛠️','Tomorrow: a self-driving car must choose who to protect. You decide.'] }
]};
