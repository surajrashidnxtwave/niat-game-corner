/* Drive School · Day 26 · Motivation · Bouncing back from a bad result (Breines & Chen 2012; explanatory style, Seligman;
   Wilson & Linville 1982).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. Breines & Chen, Personality and Social Psychology Bulletin 38(9), 2012: after failing a hard test,
   people asked to be kind to themselves (self-compassion) chose to study longer for a retest than the comparison groups.
   Wilson & Linville, Journal of Personality and Social Psychology 42 (1982): worried first-year students who heard that grades usually go up
   after the first year got better grades the next year and were less likely to drop out. It was a small study and later papers debated it,
   so we say "did better", with no numbers. The "not forever, not everything, not all me" idea is a plain-English version of
   Seligman's explanatory style (permanent, pervasive, personal). Facts checked online by Claude Code, Nov 17, 2026.
   The reframe is saved with key reframe (track motivation). It isn't judged. */
window.DRIVE_LESSONS[26] = { screens: [
  { type:'info', kicker:'Day 26 · Motivation', title:'The bad mid-sem score', visual:['📄 9/30', '😶 📱', '🌀 💭', '🔄'],
    body:['Mid-sem results are out. Maths: 9 out of 30. 📄','Your group chat is all “I got 25!” 😶','Today: what to tell yourself next. It matters more than the score.'],
    guide:'Think of a real bad result you’ve had, if you can.', cta:'Start' },
  { type:'multi', key:'badMark', logKind:'sort', kicker:'Feel it', q:'After a bad mark, what goes through your head? Tap all that fit.',
    opts:['“I’m just not good at this subject.”','“Everyone else is smarter than me.”','“The paper was unfair.”','“I’ll never catch up now.”','“I’ll just avoid looking at it.”','“What exactly did I get wrong?”','“I need to change how I study.”','“My parents will be so upset.”'],
    min:1, guide:'No wrong answers. Most people pick a few.' },
  { type:'info', kicker:'Name it', title:'Not forever, not everything, not all me', visual:['⏳ ❌', '🌍 ❌', '👤 ❌', '🔄 ✅'],
    body:['After a bad result, our heads tell 3 stories. All 3 make it worse.','<b>Forever:</b> “I’ll always be bad at Maths.” Really? It’s one test.','<b>Everything:</b> “I’m bad at studying.” It was one subject.','<b>All me:</b> “I’m just dumb.” Was it the method? The time? The topic?','Bouncing back = a story that’s <i>specific</i> and has a <i>next step</i>.'],
    guide:'One test. One subject. One method to fix.' },
  { type:'swipe', id:'d26sw', kicker:'Swipe it', title:'Stuck story or bounce-back story?', sides:['Stuck','Bounce back'],
    cards:[['“I’m just not a Maths person.”',0,'Forever and all me. It leaves nothing to fix.'],
           ['“I lost most marks on percentages. I’ll practise 10 of those.”',1,'Specific, with a next step.'],
           ['“This sem is ruined anyway.”',0,'One test turned into everything.'],
           ['“I only reread my notes. Next time I’ll solve old papers.”',1,'It blames the method, and methods can change.'],
           ['“Everyone else is smarter than me.”',0,'Comparing doesn’t tell you what to fix.'],
           ['“I’ll ask the teacher which 2 topics cost me most.”',1,'It turns the score into information.']],
    guide:'Swipe right if it leads somewhere.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🧪 📉', '💛 📚', '📈'],
    facts:[['Longer','study for a retest, by people asked to be kind to themselves after failing'],['Better','grades next year for worried first-years told “grades usually go up after year 1”'],['1 test','is one data point, not your whole future']],
    body:['Being hard on yourself feels like it should push you. It mostly makes you want to hide. 🙈','Being kind to yourself, and honest about the mistake, makes you more likely to try again.'],
    note:'Sources: Breines & Chen, Personality and Social Psychology Bulletin, 2012; Wilson & Linville, Journal of Personality and Social Psychology, 1982.',
    guide:'Kind and honest beats harsh.' },
  { type:'quiz', id:'d26q1', kicker:'Use it', q:'Karthik gets 8/30 in Python mid-sem. Which thought helps him most for the end-sem?',
    opts:[['“I’m not cut out for coding, I should accept it.”',false,'Forever and all me. It gives up before looking at what went wrong.'],
          ['“It’s only mid-sem, it doesn’t really matter.”',false,'Calming, but it skips the useful part: finding what to fix.'],
          ['“The paper was unfair, nobody could do it.”',false,'Sometimes true, but it leaves him with nothing to change.'],
          ['“I lost marks on loops. I’ll do 5 loop problems a day.”',true,'Yes. It’s specific, it’s about one topic, and it comes with a plan.']],
    why:'A good reframe is specific, about one thing, and ends with a next step.' },
  { type:'quiz', id:'d26q2', kicker:'Use it', q:'Your friend got a low score and says, “I’m so stupid.” What’s the best thing to say?',
    opts:[['“Don’t worry, marks don’t matter at all.”',false,'Marks do matter to them. This brushes off the feeling.'],
          ['“Yeah, that’s really bad. You need to work harder.”',false,'Harsh. It makes them want to hide, not try again.'],
          ['“One test isn’t you. Want to go through it together?”',true,'Kind and honest. It separates the score from the person, and offers a next step.'],
          ['“At least you did better than some people.”',false,'Comparing to others doesn’t help them fix anything.']],
    why:'Be kind about the person, honest about the mistake, and point to a next step.' },
  { type:'reflect', key:'reframe', track:'motivation', kicker:'Your turn', q:'Think of a low score you got (or might get). Write your own bounce-back story.',
    text:'Say what went wrong (one specific thing) and one next step. Not marked.', minWords:12, ph:'I lost marks because… Next time I’ll…', btn:'Save my reframe',
    guide:'Specific, with a next step. You’ve got this.' },
  { type:'wrap', lines:['One test. One subject. One method to fix. 🔄','Tomorrow: Sam is back. This time it’s 4 years, not 5 weeks.'] }
]};
