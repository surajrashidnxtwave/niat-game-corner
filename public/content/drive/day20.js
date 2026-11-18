/* Drive School · Day 20 · Think & Speak · Sunk cost (Arkes & Blumer 1985) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: Arkes & Blumer, Organizational Behavior and Human Decision Processes 35(1), 1985. Experiment 1 (a questionnaire): people "bought"
   a $100 ski trip and a cheaper $50 trip they'd enjoy more, for the same weekend; 33 of 61 (54%) picked the $100 one (checked online).
   Their field study: theatre season-ticket buyers who paid full price went to more plays in the first half of the season than those
   given a discount. "Concorde fallacy" is the nickname from the British-French Concorde jet. Checked by Claude Code, Nov 17, 2026.
   The movie polls show how a cost already paid changes the choice; they aren't scored. The stand is never judged or scored. */
window.DRIVE_LESSONS[20] = { screens: [
  { type:'info', kicker:'Day 20 · Think & Speak', title:'Already paid for it', visual:['🎟️ ₹300', '🍿 😴', '🚪 ?', '🤔'],
    body:['You paid ₹300 for a movie ticket. 🎟️','30 minutes in, it’s terrible. Truly. 😴','Two quick questions, then a bigger one about your college life.'],
    guide:'First answer, no overthinking.', cta:'Start' },
  { type:'poll', key:'d20a', kicker:'Your call', q:'You paid ₹300. The movie is awful. Do you stay or leave?',
    opts:['Stay, I paid for it','Leave and do something better'], guide:'What would you really do?' },
  { type:'poll', key:'d20b', kicker:'Your call', q:'Same awful movie. But this time your ticket was free. Stay or leave?',
    opts:['Stay anyway','Leave and do something better'], guide:'Did your answer change?' },
  { type:'info', kicker:'Name it', title:'The sunk cost trap', visual:['💸 🕳️', '⏪ ❌', '⏩ ✅'],
    body:['The ₹300 is gone either way. Staying won’t bring it back. 💸','If the money changed your answer, that’s the <b>sunk cost</b> effect.','We keep going with something because of what we already put in, not because of what’s ahead.','Money, time, effort: once spent, it’s “sunk”. The smart question is only: what’s best from here? ⏩'],
    guide:'Look forward, not back. Easy to say, hard to do.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🎿 $100 vs $50', '🎭 🎟️', '✈️'],
    facts:[['54%','picked a $100 ski trip over a $50 one they’d enjoy more, just because it cost more'],['More plays','watched by people who paid full price for theatre tickets, vs a discount'],['Concorde','a jet that kept getting money partly because so much was already spent']],
    body:['In a 1985 study, people imagined booking two ski trips by mistake, same weekend. Most picked the pricier one, even though they’d enjoy the other more.','In a real theatre, full-price ticket holders went to more plays early in the season. Same plays, same seats.'],
    note:'Source: Arkes & Blumer, Organizational Behavior and Human Decision Processes, 1985.',
    guide:'But wait. Is quitting always smart? Hmm.' },
  { type:'bet', id:'d20q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend wants to quit the robotics club after 2 months: “I hate it.” Which reply is the strongest?',
    opts:[['“Quitting is for losers, everyone knows that.”',false,'An insult, not a reason. It doesn’t help them decide.'],
          ['“You already paid the fee, so you have to stay.”',false,'That’s the sunk cost trap. The fee is gone either way.'],
          ['“Is it the club, or just the hard start? Projects begin soon.”',true,'Strong. It looks forward and asks what might change, not what was spent.'],
          ['“I would never quit something I had started.”',false,'That’s about you, not a reason for them.']],
    why:'A strong reply looks at what happens from here, not at what’s already spent.' },
  { type:'pick', q:'You’re 2 months into a club or elective. You paid for it, you’ve put in the hours, and you don’t enjoy it. Should you stay or quit?',
    sides:[['Stay and finish','Finishing what you start builds grit, and many things get better after the hard part.'],['Quit and move on','The time and money are gone either way. Put your next hours into something better.']],
    claims:['I think you should stay and finish what you started.','I think you should quit and move on to something better.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Think of a real club, course or hobby, yours or a friend’s.' },
  { type:'counter', texts:[
      'Staying because of what you already spent is the exact trap the research shows. Those hours and that fee are gone whether you stay or not. Every extra week in something you dislike is a week you could spend on a skill, a club or a project you actually care about. Sticking with the wrong thing isn’t grit. It just looks like it.',
      'Quitting the moment something stops being fun means you never get past the hard part. Most skills, from coding to music, feel boring or confusing in the first months, and good in the next ones. If you quit everything at month 2, you’ll be a beginner at ten things and good at none. Sometimes the last thing you put in is what makes it pay off.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 40 you’ll look at a related question: when to stay stuck, and when to ask.' }
]};
