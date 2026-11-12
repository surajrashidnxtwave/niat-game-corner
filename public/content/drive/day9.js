/* Drive School · Day 9 · Motivation · Procrastination is about mood (Sirois & Pychyl 2013; Steel 2007; Wohl, Pychyl & Bennett 2010).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. Steel 2007 (Psychological Bulletin 133(1)): estimates of 80–95% of college students procrastinating.
   Wohl et al. 2010 (Personality and Individual Differences 48(7)): forgiving yourself for procrastinating before exam 1 -> less before exam 2
   (a link found in heavy procrastinators, not an experiment, hence "tended to"). Facts checked online by Claude Code, Nov 11, 2026.
   The task the student names is logged with track 'task' so it doesn't count as a reflection in the Drive Profile. */
window.DRIVE_LESSONS[9] = { screens: [
  { type:'info', kicker:'Day 9 · Motivation', title:'Why you put things off', visual:['📄 😩', '📱 ➡️ 😌', '⏰ 😱', '🔍'],
    body:['That one task you keep pushing to “tomorrow”? 😩','You open it, feel bad, then open Instagram. Instant relief. 😌','Today we find out what’s really going on.'],
    guide:'Everyone does this. Yes, everyone.', cta:'Start' },
  { type:'reflect', key:'avoidTask', track:'task', kicker:'Feel it', q:'Name one task you’ve been avoiding.',
    text:'Small or big. An assignment, a call, a topic you keep skipping.', minWords:2, ph:'The task I keep avoiding is…', btn:'That’s the one',
    guide:'Just name it. Nobody’s judging.' },
  { type:'multi', key:'avoidFeel', logKind:'sort', kicker:'Feel it', q:'When you think about starting it, how does it feel? Pick all that fit.',
    opts:['Boring','Confusing: I don’t know where to start','Too big','Scared I’ll do it badly','Frustrating','Pointless to me','Someone else is forcing me'],
    min:1, guide:'Pick the feelings, not the excuses.' },
  { type:'info', kicker:'Name it', title:'It’s a mood problem, not a time problem', visual:['😣 ➡️ 📱', '😌 now', '😱 later', '🧠 💡'],
    body:['Putting a task off isn’t laziness. It’s your brain dodging a bad feeling.','The task feels boring, confusing or scary. Scrolling makes that feeling go away. For now. 😌','Future you pays for it, with stress and a rushed job. 😱','So the fix isn’t a better timetable. It’s making the start feel smaller.'],
    guide:'Fix the feeling, and starting gets easier.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🎓 📊', '😌 📱', '🤝 💛'],
    facts:[['80–95%','of college students put off their work, by one big estimate'],['Mood','a 2013 paper: putting it off is a quick fix for a bad feeling'],['Forgive','students who forgave themselves for delaying study for one exam tended to delay less for the next']],
    body:['You’re not broken. You’re normal. 🙂','And beating yourself up makes the next task feel even worse.'],
    note:'Sources: Steel, Psychological Bulletin, 2007; Sirois & Pychyl, Social and Personality Psychology Compass, 2013; Wohl, Pychyl & Bennett, Personality and Individual Differences, 2010.',
    guide:'Be kind to yourself. It actually helps.' },
  { type:'quiz', id:'d9q1', kicker:'Use it', q:'Arjun opens his lab record, feels lost, and says, “I’ll just check my phone for 5 minutes.” What’s really going on?',
    opts:[['He has poor time management skills',false,'His timing is fine. He sat down to do it. The feeling is what pushed him away.'],
          ['He’s escaping the confused, stuck feeling',true,'Right. The phone fixes the bad feeling for now. The record is still waiting.'],
          ['He just needs a short break first',false,'He hasn’t started yet, so there’s nothing to take a break from.'],
          ['He doesn’t care about his marks',false,'He opened the record, so he does care. Caring doesn’t stop a bad feeling.']],
    why:'Putting things off is mostly about escaping a feeling. Name the feeling, then shrink the first step.' },
  { type:'swipe', id:'d9sw', kicker:'Swipe it', title:'Does it feel better now, or get the task started?', sides:['Feels better','Gets it started'],
    cards:[['Cleaning your whole desk before you begin',0,'It feels useful, but the task hasn’t moved.'],
           ['Opening the file and typing just the title',1,'Tiny, but the task has started.'],
           ['Watching one “study motivation” video',0,'It changes your mood, not your progress.'],
           ['Writing down the first question you’re stuck on',1,'Now “confusing” has a clear next step.'],
           ['Telling yourself you work better under pressure',0,'It calms you down tonight. It doesn’t do the work.'],
           ['Setting a 2-minute timer and starting',1,'Two minutes feels easy, and starting is the hard part.']],
    guide:'Swipe right if it actually starts the task.' },
  { type:'quiz', id:'d9q2', kicker:'Use it', q:'Your mini-project feels too big to start. What’s the best first move?',
    opts:[['Wait for a free weekend to do it all at once',false,'Big free blocks rarely come, and the task keeps feeling bigger.'],
          ['Do a 2-minute step: list the 3 parts it has',true,'Yes. A tiny step makes it feel smaller, and starting is the hard part.'],
          ['Watch a full tutorial on the topic first',false,'It can feel like work, but it often becomes another way to delay.'],
          ['Make a detailed timetable for the next month',false,'Planning can be another way to avoid starting.']],
    why:'Make the first step so small it feels silly not to do it. Once you start, it’s easier to keep going.' },
  { type:'commit', key:'d9', q:'Pick a 2-minute first step for your task.',
    opts:['If I sit down to it, then I’ll open the file and write just one line.','If I feel the urge to scroll, then I’ll do 2 minutes of the task first.','If I don’t know where to start, then I’ll write down the first thing I’m stuck on.'],
    guide:'Small enough that you can do it today.' },
  { type:'wrap', lines:['It was never about laziness. It’s about the feeling. 💛','Tomorrow: a ring that makes you invisible. What would you do?'] }
]};
