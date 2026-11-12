/* Drive School · Day 8 · Strategy · Spacing vs cramming (Cepeda et al. 2006; Cepeda et al. 2008).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. 2006 = review of 317 experiments (Psychological Bulletin 132(3)).
   2008 = the best gap grows with how far away the test is (Psychological Science 19(11)): about 20% of the time until the test
   for tests a few weeks away, falling to about 5% for a year. "About a week" for a test a month away is that rule, rounded.
   Facts checked online by Claude Code, Nov 11, 2026. */
window.DRIVE_LESSONS[8] = { screens: [
  { type:'info', kicker:'Day 8 · Strategy', title:'Spacing vs cramming', visual:['📅 🎯', '😵‍💫 📚📚📚', '🗓️ 📖 · 📖 · 📖', '🤔'],
    body:['Big Python exam in 4 weeks. 🎯','You’ve got 6 hours to study for it. Total.','Where do you put them? Plan it first, then we’ll compare.'],
    guide:'Plan it the way you really would.', cta:'Let’s plan' },
  { type:'calendar', kicker:'Feel it', title:'Place your 6 study hours', sessions:6, weeks:4,
    text:'Each tap is a 1-hour session. The 🎯 is exam day. Tap a day again to take it back.',
    guide:'No right answer yet. Just be honest.' },
  { type:'poll', key:'d8guess', kicker:'Predict', q:'Same 6 hours. Which plan helps you remember more on exam day?',
    opts:['All 6 hours in the last 2 days','Spread over the 4 weeks','No difference, hours are hours'], guide:'Go with your gut.' },
  { type:'calendarCompare', kicker:'Compare', title:'Your plan vs a spaced plan', good:[2, 6, 11, 16, 21, 26],
    note:'The spaced plan starts in week 1, leaves 4–5 days between sessions, and keeps one last review 2 days before the exam.' },
  { type:'info', kicker:'Name it', title:'Spacing beats cramming', visual:['⏳ ➗', '📉 😴', '🔁 💪', '🧠 🌱'],
    body:['<b>Spacing</b> means the same study hours, spread out over days or weeks.','Cramming can get you through tomorrow’s test. A week later, most of it is gone. 📉','With gaps, you forget a little, then pull it back. That pull is what makes it stick. 💪'],
    guide:'Same hours. Different result.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🧪 📚', '📅 🎯', '✅'],
    facts:[['317','experiments in a 2006 review of spacing'],['Most','of them: spaced study beat cramming on later tests'],['~1 week','between reviews worked well for a test a month away']],
    body:['Researchers pooled hundreds of experiments. Spacing won again and again.','And the further away your test, the bigger the gap can be.'],
    note:'Sources: Cepeda et al., Psychological Bulletin, 2006; Cepeda et al., Psychological Science, 2008.',
    guide:'This is one of the most tested ideas in learning.' },
  { type:'quiz', id:'d8q1', kicker:'Use it', q:'Rohit crams all night and gets a good mark in a class test the next morning. What does that show?',
    opts:[['Cramming works fine, so he should keep doing it',false,'It worked for one test the next morning. Spacing wins for tests that come later, like the sem exam.'],
          ['Cramming can pass a test tomorrow, but fades fast',true,'Right. A test the next day hides the problem. Most of it will be gone in a week.'],
          ['He’s just naturally good at that subject',false,'Maybe, but that doesn’t tell us anything about the method.'],
          ['Sleep doesn’t matter if you study hard enough',false,'Skipping sleep makes it worse. Sleep helps lock in what you studied.']],
    why:'Cramming is built for tomorrow. Spacing is built for later, and later is when exams and jobs happen.' },
  { type:'quiz', id:'d8q2', kicker:'Use it', q:'Your sem exam is in 3 weeks. You have 6 hours for Maths. Which plan is best?',
    opts:[['3 hours each on the last two days',false,'That’s cramming. It feels intense, but it fades fastest.'],
          ['2 hours a week, starting this week',true,'Yes. Same 6 hours, with gaps for forgetting and pulling it back.'],
          ['6 hours this Sunday, so it’s done early',false,'Early, but all in one go. That’s still cramming, just sooner.'],
          ['1 hour a day for the last 6 days',false,'Better than one night, but it starts late and leaves no long gaps.']],
    why:'Start early and spread it out. The total time can stay the same.' },
  { type:'tf', id:'d8tf', kicker:'True or false?', labels:['True','False'], items:[
      ['Spacing means studying for more hours in total.',false,'No. Same hours, spread out. That’s the whole trick.'],
      ['Forgetting a little between sessions is part of why spacing works.',true,'Yes. Pulling a half-forgotten idea back makes it stronger.'],
      ['If an exam is far away, the gaps between reviews can be longer.',true,'Right. The gap can grow with the time until the test.'],
      ['Cramming feels harder, so it must be working better.',false,'Cramming often feels productive. That feeling isn’t proof.']],
    guide:'Four quick ones.' },
  { type:'commit', key:'d8', q:'Pick one way to space your study this week.',
    opts:['If I learn something new in class, then I’ll review it for 10 minutes 2 days later.','If it’s Sunday evening, then I’ll put 3 short study slots for next week in my calendar.','If a test is 2 weeks away, then I’ll start this week with 20 minutes, not the night before.'],
    guide:'Pick one you’ll actually do.' },
  { type:'wrap', lines:['Same hours, spread out. That’s the trick. 📅','Tomorrow: why you put things off, and it’s not laziness.'] }
]};
