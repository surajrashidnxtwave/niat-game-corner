/* Drive School · Day 6 · Think & Speak · The group project dilemma (prisoner's dilemma) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Payoffs checked by script: vs a copycat who starts by helping, 5 rounds:
   always work = 15, always coast = 9, work then coast in round 5 = 17. The "Name it" screen says this honestly. */
window.DRIVE_LESSONS[6] = { screens: [
  { type:'info', kicker:'Day 6 · Think & Speak', title:'The group project dilemma', visual:['👥 📁 😬', '🛠️ or 😴', '🎮 ➡️ 🗣️', '🎲'],
    body:['Group project. 5 weeks. You and Sam. 😬','Each week, you both choose: do your part, or coast and let the other one carry.','Play it first. Then take a stand.'],
    guide:'Play it how you’d really play it.', cta:'Start' },
  { type:'gameTheory', id:'d6game', kicker:'Play it', title:'5 weeks with Sam',
    text:'Each week, pick what you do. Sam picks at the same time. Points are your share of the credit that week.',
    botName:'Sam', bot:'copycat', start:'c', rounds:5,
    moves:{ c:'Work', d:'Coast' }, hint:{ c:'Do your part this week.', d:'Skip it. Sam might cover.' },
    payoff:{ cc:[3,3], cd:[0,5], dc:[5,0], dd:[1,1] },
    guide:'Look at the table first. Then choose.', doneGuide:'Let’s see what Sam was doing.' },
  { type:'info', kicker:'Name it', title:'The prisoner’s dilemma', visual:['🦜', '15 vs 9', '😏 17', '⚖️ 😬', '⏳'],
    body:['Sam was a copycat 🦜: worked in week 1, then copied whatever you did the week before.',
      'Work every week: 15 points. Coast every week: just 9.',
      'Sneaky move: work, then coast in the last week = 17. Sam has no week left to copy you back.',
      'That’s the dilemma: coasting always looks better for <i>you</i>. But if both coast, both lose. Mathematicians named it in 1950.'],
    guide:'The last week is the tricky one. Keep that in mind.' },
  { type:'bet', id:'d6q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “You should always carry a weak teammate.” Which reply is the strongest argument against that?',
    opts:[['“Only a fool does someone else’s work.”',false,'This insults instead of giving a reason. It doesn’t show why carrying is a bad idea.'],
          ['“Nobody I know carries teammates anymore.”',false,'What others do isn’t a reason. Many people can be wrong.'],
          ['“If you always carry them, they never learn the skill.”',true,'Strong. It gives a reason and a clear effect that your friend has to answer.'],
          ['“I once carried someone and I didn’t like it.”',false,'One story about how you felt is weak evidence on its own.']],
    why:'A strong argument gives a reason and says what follows from it. Insults, crowds and one story don’t.' },
  { type:'pick', q:'Your teammate keeps coasting. Should you carry the team?',
    sides:[['Carry the team','Do the extra work yourself so the project and the grade are safe.'],['Don’t carry them','Raise it, split the work clearly, and let the gap show if it stays.']],
    claims:['I think you should carry the team.','I think you shouldn’t carry them.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Use your own college experience if you have one.' },
  { type:'counter', texts:[
      'If you always carry them, coasting works for them, so they’ll do it again in the next project and the one after. You also lose hours you needed for your own exams. Carrying feels kind, but it can be the reason the problem never gets fixed.',
      'The grade is shared. If you refuse, you lose marks too, and the project you’d show in placements gets weaker. You may not know why they’re coasting: they could be ill or struggling. Doing the work now and talking later can be the smarter move.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 27 you’ll play Sam again, over a whole 4 years.' }
]};
