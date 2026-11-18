/* Drive School · Day 16 · Motivation · Habits take time (Lally, van Jaarsveld, Potts & Wardle 2010).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts against Lally et al., European Journal of Social Psychology 40(6), 2010: 96 people picked one daily
   eating, drinking or exercise habit tied to a daily cue, for 12 weeks. The typical (median) time to get close to fully automatic
   was 66 days, with a range of 18 to 254 days (254 is a projection past the 12 weeks). Missing one chance to do the habit
   didn't really affect habit building. The 66 days comes from the people whose data fit the model, so we say "typical", not "everyone".
   The "21 days" idea is usually traced to Maxwell Maltz's 1960 book Psycho-Cybernetics (he wrote "a minimum of about 21 days").
   Facts checked online by Claude Code, Nov 17, 2026. The tiny habit is saved as an if-then plan (memo plan_d16). */
window.DRIVE_LESSONS[16] = { screens: [
  { type:'info', kicker:'Day 16 · Motivation', title:'21 days to a habit?', visual:['📅 21?', '🏋️ 📚 💧', '🤔'],
    body:['You’ve seen it: “Do it for 21 days and it becomes a habit.” 📅','Sounds neat. Is it true?','Guess first. Then build one tiny habit of your own.'],
    guide:'Your guess doesn’t have to be right.', cta:'Start' },
  { type:'estimate', id:'d16est', kicker:'Guess the number', q:'People picked one new daily habit, like drinking water after breakfast. How many days did it take, typically, to feel automatic?',
    min:0, max:120, value:21, unit:' days', answer:66,
    why:'In a 2010 study, the typical time was 66 days. Some people took 18 days, some much longer. 21 days was too short for most.',
    guide:'Slide to your guess.' },
  { type:'info', kicker:'Name it', title:'What a habit really is', visual:['⏰ ➡️ 💧', '🔁 🔁 🔁', '🤖'],
    body:['A <b>habit</b> is something you do without deciding. A cue happens, and you just do it. 🤖','Brush teeth, then… you reach for the floss. No debate.','It builds slowly: same cue, same action, again and again. 🔁'],
    guide:'No willpower needed once it’s a habit. That’s the prize.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🧪 📅', '📈', '😅 ✅'],
    facts:[['66 days','the typical time for a daily habit to feel automatic'],['18–254','days: how much it varied from person to person'],['1 day missed','didn’t really slow the habit down']],
    body:['96 people picked one small daily habit and tracked it for 12 weeks.','Simple habits got automatic faster. Harder ones, like daily exercise, took longer.','The “21 days” idea comes from a 1960 self-help book, not from a study.'],
    note:'Source: Lally, van Jaarsveld, Potts & Wardle, European Journal of Social Psychology, 2010.',
    guide:'So if day 21 still feels hard, nothing’s wrong with you.' },
  { type:'swipe', id:'d16sw', kicker:'Swipe it', title:'Will it stick, or fade?', sides:['Likely to fade','Likely to stick'],
    cards:[['Study 3 hours every day, starting tomorrow.',0,'Too big. One bad day and it’s gone.'],
           ['After dinner, solve 1 Python question.',1,'Tiny, and it hangs on a cue you have every day.'],
           ['Exercise whenever I feel like it.',0,'No cue. Feelings come and go.'],
           ['After I sit on the bus, I open my flashcards.',1,'Same cue every day, small action.'],
           ['Missed a day, so I’ll restart next month.',0,'One missed day barely matters. Quitting does.'],
           ['After brushing at night, I set my phone across the room.',1,'Linked to something you already do.']],
    guide:'Swipe right if it’s built to last.' },
  { type:'quiz', id:'d16q1', kicker:'Use it', q:'Divya wants a daily coding habit. Which plan is most likely to stick?',
    opts:[['Code for 2 hours every day, from today',false,'Big goals feel great on day 1, then crash on a busy day.'],
          ['After lunch, write one small Python program',true,'Yes. Tiny, and tied to a cue she has every day.'],
          ['Code on weekends when she has free time',false,'Not daily, and “free time” isn’t a cue.'],
          ['Code daily once she feels more motivated',false,'Waiting for motivation means waiting a long time.']],
    why:'Small action + same daily cue. Make it easy first. You can grow it later.' },
  { type:'quiz', id:'d16q2', kicker:'Use it', q:'Day 9 of your new habit. You missed yesterday. What now?',
    opts:[['Start again from day 1 next Monday',false,'A “fresh start” often turns into never. One miss is no big deal.'],
          ['Do it today, as normal',true,'Right. One missed day didn’t really hurt habits in the study. Just don’t miss twice.'],
          ['Do it twice today to make up',false,'Making it bigger makes it harder. Keep it tiny.'],
          ['Give up, it clearly isn’t working',false,'Day 9 is early. It typically takes about 66 days.']],
    why:'Habits are built by coming back, not by a perfect streak.' },
  { type:'ifthen', key:'d16', kicker:'Your tiny habit', q:'Design one tiny daily habit',
    text:'Pick something you already do every day as the cue. Then add one tiny action, small enough to do on your worst day.',
    ifPh:'something you do every day', thenPh:'one tiny action (2 minutes or less)',
    examples:[['I finish dinner','solve one Python question'],['I sit on the bus to college','review 5 flashcards'],['I plug in my phone at night','write one line about what I learnt today']],
    guide:'Tiny is the point. Make it almost too easy.' },
  { type:'wrap', lines:['Habit planted. 🌱 Give it weeks, not days.','Tomorrow: does ChatGPT actually understand anything?'] }
]};
