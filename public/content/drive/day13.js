/* Drive School · Day 13 · Think & Speak · Tragedy of the commons (Hardin 1968; Ostrom 1990, Nobel 2009) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   The Wi-Fi game (screen type 'commons' in drive.js): 5 nights, you + 4 hostel mates, each goes Light or Heavy.
   Hardin 1968, Ostrom's 1990 book, her 2009 Nobel and her 8 design principles checked online, Nov 11, 2026.
   Payoffs checked by script: going Heavy beats Light for you on every night, whatever the mates do,
   but the hostel's total is highest when nobody goes Heavy (15 a night) and lowest when most do.
   Played against the bots: always Light = 11 for you (hostel 63), always Heavy = 17 for you (hostel 59). */
window.DRIVE_LESSONS[13] = { screens: [
  { type:'info', kicker:'Day 13 · Think & Speak', title:'The shared Wi-Fi', visual:['🏠 📶', '👥👥👥 📶', '🐢 😤', '🎲'],
    body:['Your hostel floor shares one Wi-Fi router. 📶','5 of you. Every night, each person goes light (chats, notes) or heavy (HD streaming, big downloads).','The more people go heavy, the slower it gets for everyone. 🐢','Play 5 nights. Then take a stand.'],
    guide:'Play it how you’d really play it.', cta:'Start' },
  { type:'commons', kicker:'Play it', title:'5 nights on the hostel Wi-Fi', rounds:5, start:0,
    text:'Each night, pick Light or Heavy. Your 4 mates pick at the same time. The table shows your points for the night.',
    mates:['Riya','Kabir','Dev','Asha'],
    guide:'Check the table first. Then choose.', doneGuide:'Let’s see what happened.' },
  { type:'info', kicker:'Name it', title:'The tragedy of the commons', visual:['🐄 🌾', '🐄🐄🐄🐄 🏜️', '📶 🐢', '🤷'],
    body:['Look at the table again. Heavy gave <i>you</i> more points every single night, whatever the others did.','But if all 5 go heavy, everyone ends up worse than if all 5 stayed light. 😬','A shared thing that everyone can use, and nobody owns, gets overused. A biologist, Garrett Hardin, called it the tragedy of the commons in 1968.','Shared fields, fish in the sea, a hostel fridge, Wi-Fi. Same story.'],
    guide:'Good for each person, bad for everyone. That’s the trap.' },
  { type:'info', kicker:'Prove it', title:'Is there a way out?', visual:['🎣 🌲 💧', '🤝 📜', '👀', '🏅'],
    facts:[['1968','Hardin: shared things get ruined unless someone takes control'],['2009','Elinor Ostrom’s Nobel Prize in Economics, for showing there’s another way'],['8','rules she found in groups that share well for centuries']],
    body:['Ostrom studied fishing villages, forests and farm water across the world.','Many groups shared well for hundreds of years, without a boss or a buyer.','But they didn’t just trust each other. They made their own rules, kept an eye on each other, and had fair penalties.'],
    note:'Sources: Hardin, Science, 1968; Ostrom, Governing the Commons, 1990.',
    guide:'So the answer isn’t just rules, or just trust. Hmm.' },
  { type:'bet', id:'d13q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “Wi-Fi limits are pointless. People just need to be nicer.” Which reply is the strongest?',
    opts:[['“That’s a very naive thing to say.”',false,'This insults instead of giving a reason. Your friend learns nothing new.'],
          ['“One heavy user slows it for 50 people, and nobody knows who.”',true,'Strong. It gives a reason and a clear effect that “be nicer” doesn’t solve.'],
          ['“Every other hostel I’ve seen has limits.”',false,'What others do isn’t a reason on its own. They could all be wrong.'],
          ['“I’d personally prefer to have limits.”',false,'That’s a feeling, not a reason your friend has to answer.']],
    why:'A strong argument gives a reason and says what follows from it.' },
  { type:'pick', q:'Your hostel Wi-Fi crawls every night. What’s the better fix: strict rules, or trust?',
    sides:[['Strict rules','Limits for everyone: data caps per person, or no HD streaming at peak hours.'],['Trust','Agree together on what’s fair, and trust people to stick to it.']],
    claims:['I think the hostel needs strict Wi-Fi rules.','I think the hostel should trust students to share fairly.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Think about your own hostel, PG or home Wi-Fi.' },
  { type:'counter', texts:[
      'Strict caps punish everyone, including the person who needs the Wi-Fi for an online test or a project deadline. Rules from above get dodged with hotspots and VPNs, and then nobody respects them. Ostrom found that groups who agree on their own norms and keep an eye on each other often share better than groups handed rules from outside.',
      'Trust works in a small group where everyone knows each other. In a big hostel, one heavy user ruins it for everyone and nobody knows who. You saw it in the game: when the Wi-Fi is fast, someone is tempted, and others copy. Even Ostrom’s groups had clear rules and penalties. Without a clear limit, the people who behave lose out.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 38 you’ll play another sharing game: the stag hunt.' }
]};
