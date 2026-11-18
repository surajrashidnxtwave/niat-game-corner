/* Drive School · Day 27 · Think & Speak · Repeated games and reputation (Axelrod 1980, 1984: tit for tat) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: Axelrod's tournaments (Journal of Conflict Resolution, 1980; The Evolution of Cooperation, 1984): the first had 14 entries,
   the second 62; Anatol Rapoport's tit for tat (help first, then copy the other player's last move) won both. Axelrod's 4 traits of
   strategies that did well: nice (never the first to cheat), hits back, forgives, easy to read. Facts checked online by Claude Code, Nov 17, 2026.
   Same game as Day 6 (same payoffs, which are also Axelrod's: 3/3, 0/5, 5/0, 1/1), now 8 semesters against Sam the copycat (= tit for tat).
   Payoffs checked by script: always work = 24, always coast = 12, work then coast in sem 8 = 26, alternate = 23, coast in sem 1 then work = 23.
   The "Name it" screen says honestly that coasting in the very last sem still pays, and why real life rarely has a known last round. */
window.DRIVE_LESSONS[27] = { screens: [
  { type:'info', kicker:'Day 27 · Think & Speak', title:'4 years with Sam', visual:['👥 🎓', '📅 × 8', '🛠️ or 😴', '🎲'],
    body:['Remember Sam from Day 6? 👋','Bad news, or good news: Sam is in your batch for all 4 years. 8 semesters of group projects. 🎓','Same choice every sem: do your part, or coast.','Play it first. Then take a stand.'],
    guide:'Play it how you’d really play it.', cta:'Start' },
  { type:'gameTheory', id:'d27game', kicker:'Play it', title:'8 semesters with Sam',
    text:'Each semester, pick what you do. Sam picks at the same time. Points are your share of the credit that sem.',
    botName:'Sam', bot:'copycat', start:'c', rounds:8,
    moves:{ c:'Work', d:'Coast' }, hint:{ c:'Do your part this sem.', d:'Skip it. Sam might cover.' },
    payoff:{ cc:[3,3], cd:[0,5], dc:[5,0], dd:[1,1] },
    guide:'Same table as Day 6. Longer game.', doneGuide:'Sam was a copycat again. Let’s see what that means.' },
  { type:'info', kicker:'Name it', title:'Tit for tat', visual:['🦜', '24 vs 12', '😏 26', '🔮 ❓'],
    body:['Sam helped in sem 1, then copied your last move. That strategy is called <b>tit for tat</b>. 🦜','Work all 8 sems: 24 points. Coast all 8: just 12.','The sneaky move still works: work 7 sems, coast in the last one = 26. Sam can’t pay you back.','But in real life, you rarely know which project is the last one. Same batch, same seniors, same placement circle. 🔮'],
    guide:'When the game keeps going, your reputation keeps going too.' },
  { type:'info', kicker:'Prove it', title:'A tournament of strategies', visual:['💻 🏆', '🦜 🥇🥇', '😇 ⚡ 🤝 👀'],
    facts:[['14','strategies in the first computer tournament, 1980'],['62','in the second, from people who knew who won the first'],['2 / 2','wins for tit for tat, the simplest strategy entered']],
    body:['A political scientist, Robert Axelrod, invited experts to send in programs for this exact game, played over many rounds.','The winner both times: tit for tat. Help first, copy back, forgive fast.','The strategies that did well were nice (never cheat first), hit back, forgave, and were easy to read.'],
    note:'Sources: Axelrod, Journal of Conflict Resolution, 1980; Axelrod, The Evolution of Cooperation, 1984.',
    guide:'Nice, but not a pushover. Hmm.' },
  { type:'bet', id:'d27q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “Being nice in college just means people use you.” Which reply is the strongest?',
    opts:[['“Over 4 years, people remember who helped. That comes back.”',true,'Strong. It gives a reason, repeated contact, and an effect your friend has to answer.'],
          ['“That’s a really negative way to see people.”',false,'This judges your friend instead of answering the point.'],
          ['“My parents always told me to be nice.”',false,'That’s about who told you, not why it works.'],
          ['“I’m nice and nobody has used me yet.”',false,'One person’s luck is weak evidence.']],
    why:'A strong reply gives a reason and a clear effect, not a judgement or one personal story.' },
  { type:'pick', q:'4 years with the same batch. Is being nice the smart move?',
    sides:[['Yes, nice is smart','Help first, and keep helping people who help back. It pays off over 4 years.'],['No, nice gets used','Look after your own marks first. Nice people end up doing everyone’s work.']],
    claims:['I think being nice is the smart move over 4 years.','I think being nice gets you used.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Use your own batch, group projects or hostel if you can.' },
  { type:'counter', texts:[
      'In the game, the sneaky move scored highest: help, then coast at the very end. Real college has endings too: the last project, the final sem, people moving to different cities. Some people take your help and never return it, and a kind person often doesn’t hit back. Nice only works if you’re also willing to stop helping, and many nice people never do.',
      'In the game, coasting from the start got you 12. Working all the way got 24. Over 4 years, your batch notices who coasts, and you get left out of the good teams, study groups and referrals. Axelrod’s winner wasn’t a pushover: it helped first, then hit back once if cheated. That’s nice and smart at the same time.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 55 you’ll reread one and see how your thinking has changed.' }
]};
