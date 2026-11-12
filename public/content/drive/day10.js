/* Drive School · Day 10 · Think & Speak · The Ring of Gyges (Plato, Republic, Book 2) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts against Gerlach, Teodorescu & Hertwig 2019 (Psychological Bulletin 145(1)):
   a meta-analysis of 565 experiments (44,050 choices). Their press release: about 42% of men and 38% of women lied when they could,
   so we say "about 4 in 10" lied and most didn't. Facts checked online by Claude Code, Nov 11, 2026.
   The poll asks what the batch would do, not what the student would do, so nobody has to confess anything. */
window.DRIVE_LESSONS[10] = { screens: [
  { type:'info', kicker:'Day 10 · Think & Speak', title:'The Ring of Gyges', visual:['💍 👀', '🐑 💍 👻', '👑 😈', '🤔'],
    body:['2,400 years ago, Plato told a story about a magic ring. 💍','A shepherd named Gyges finds it. Turn it, and he’s invisible. 👻','He uses it to steal, sneak into the palace and take the throne. 👑','So here’s the question: are you honest, or just scared of getting caught?'],
    guide:'Think about it for real. Not the “correct” answer.', cta:'Start' },
  { type:'info', kicker:'The claim', title:'Glaucon’s challenge', visual:['🗣️', '🙈 = 😈?', '⚖️'],
    body:['In the story, a man called Glaucon makes a bold claim.','Give the ring to the most honest person you know, and they’d act just like the thief.','People are honest only because they might get caught. That’s his whole point.'],
    guide:'Is he right? Keep that question in your head.' },
  { type:'poll', key:'d10guess', kicker:'Your guess', q:'Online exam. The proctor’s camera fails for the whole hour. Nobody could ever find out. What would most students in your batch do?',
    opts:['Most would stay honest','Most would peek a little','Most would cheat as much as they could'], guide:'About your batch, not you. Go with your gut.' },
  { type:'info', kicker:'Prove it', title:'What happens when nobody can check?', visual:['🧪 🎲', '🤥 4 / 10', '😇 6 / 10'],
    facts:[['565','experiments where people could lie for a reward, with no way to be checked'],['About 4 in 10','lied when they had the chance'],['Most','stayed honest, even though nobody would know']],
    body:['Researchers pooled hundreds of experiments with tens of thousands of people.','Plenty of people lied when nobody could check. But most didn’t.'],
    note:'Source: Gerlach, Teodorescu & Hertwig, Psychological Bulletin, 2019.',
    guide:'So Glaucon is half right? Or half wrong?' },
  { type:'bet', id:'d10q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “Copying in an online test is fine if nobody gets hurt.” Which reply is the strongest?',
    opts:[['“Cheating is just wrong, end of story.”',false,'This repeats the view without a reason. Your friend can just say “no it isn’t.”'],
          ['“Your marks will say you know things you don’t.”',true,'Strong. It gives a reason and a real effect: a gap that shows up later, in labs or interviews.'],
          ['“My parents would never let me do that.”',false,'That’s about your parents, not about whether copying is fine.'],
          ['“You’ll probably get caught anyway.”',false,'This quietly agrees with your friend: it’s only bad if you’re caught.']],
    why:'A strong reply gives a reason that still works even if nobody ever finds out.' },
  { type:'pick', q:'Glaucon says people are honest only because they might get caught. Is he right?',
    sides:[['He’s right','Take away every chance of getting caught, and most people would cheat. Rules and checks keep us honest.'],['He’s wrong','Many people stay honest even when no one could ever know, because of who they want to be.']],
    claims:['I think Glaucon is right: people are honest mostly because they might get caught.','I think Glaucon is wrong: many people stay honest even when no one can see.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Use an example from school, college or the internet.' },
  { type:'counter', texts:[
      'Lots of people stay honest when nobody is watching. They return extra change, don’t copy in open-book tests, and tell the truth on anonymous forms. In the studies, most people didn’t lie at all, even with zero risk. If fear were the only reason, honesty would vanish wherever checks are weak. It doesn’t.',
      'In study after study, about 4 in 10 people lied when they knew nobody could check. Exams have proctors, shops have cameras and companies have audits for a reason. If people were honest anyway, we wouldn’t need any of it. Most of us have done something small we’d never do on camera.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 55 you’ll reread one and see how your thinking has changed.' }
]};
