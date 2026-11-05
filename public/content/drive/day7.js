/* Drive School · Day 7 · Review & Reflect · Week 1 review.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Retests the Day 1 keywords (vs the Day 1 guess) and the Day 4 Velari words (reread vs quizzed set),
   then a spaced review set, a reflection, and Bounce Back Lv 1. Puzzle answers checked by script (n^n, n(n+1), 2^n+1). */
(function(){
const KW = ['def','return','while','break','lambda','yield','global','assert','pass','import','except','finally'];
const A = [['vrolt','river'],['plirn','lamp'],['skeb','window'],['yurlek','cloud'],['quomra','bridge'],['tazzik','pencil']];
const B = [['brenth','mountain'],['flonk','spoon'],['gwira','ticket'],['ozzel','mirror'],['prumf','garden'],['zeltik','button']];
window.DRIVE_LESSONS[7] = { screens: [
  { type:'info', kicker:'Day 7 · Review & Reflect', title:'Week 1 review', visual:['✅ 📅 👀', '🎁 📝', '🙈 🚫'],
    body:['Week 1, done. Now: what actually stuck? 👀','Surprise test from Day 1, coming right up.'],
    guide:'No peeking at old lessons. That’s the point.', cta:'Bring it' },
  { type:'recall', key:'d7', kicker:'Memory test', title:'Type the 12 Python keywords from Day 1', words:KW, guide:'Every one you can still remember.' },
  { type:'recallResult', words:KW, compare:'d1' },
  { type:'pairTest', key:'d7', kicker:'Velari test', title:'What does each Velari word mean?', text:'The 12 made-up words from Day 4. Leave a box empty if you don’t know.',
    sets:[{ id:'A', pairs:A }, { id:'B', pairs:B }], guide:'Set A you reread. Set B you quizzed yourself on.' },
  { type:'pairResult', title:'Back on Day 7', of:6, compare:true },
  { type:'reviewSet', items:[
    { from:1, dim:'strategy', q:'You learned list methods on Monday. When does one short review save you the most time?',
      opts:[['The next day, before the steep drop',true,'Yes. A review in the first day catches the memory before most of it fades.'],
            ['The night before the exam',false,'By then most of it is gone, so you’d be relearning, not reviewing.'],
            ['Never, if you followed the class',false,'Following it once doesn’t stop the forgetting curve.'],
            ['Right after class, then never again',false,'Better than nothing, but one review only slows the drop for a while.']],
      why:'Memory drops fastest in the first day. Small, spaced reviews keep it up.' },
    { from:2, dim:'motivation', q:'Which of these is “false growth mindset”?',
      opts:[['Praising effort when the method isn’t working',true,'Right. Effort on a broken method gets the same result. The method needs to change.'],
            ['Saying you can’t do something “yet”',false,'That’s the real thing: it says ability can still grow.'],
            ['Trying a new way after getting stuck',false,'That’s growth mindset done well: effort plus a better method.'],
            ['Asking a senior how they practised',false,'Learning someone’s method is a smart growth move.']],
      why:'Growth needs effort and a better strategy. Effort alone isn’t enough.' },
    { from:4, dim:'strategy', q:'Which of these is retrieval practice?',
      opts:[['Rereading your notes slowly, twice',false,'Rereading feels familiar, but you never pull the memory out.'],
            ['Closing the book and writing what you remember',true,'Yes. Recalling before you look is what makes memory stronger.'],
            ['Highlighting the key lines in yellow',false,'Highlighting marks the page, not your memory.'],
            ['Watching the lecture video again',false,'That’s rereading in video form.']],
      why:'Retrieval practice means pulling it out of your head first, then checking.' },
    { from:5, dim:'motivation', q:'Which reason comes from inside you?',
      opts:[['“I enjoy figuring out why my code breaks.”',true,'Right. You’d care about it even with no reward.'],
            ['“My parents will be proud of my marks.”',false,'A fine reason, but it depends on someone else.'],
            ['“Toppers get the best placements.”',false,'That’s a reward from outside: a placement.'],
            ['“I don’t want to be the only one failing.”',false,'That’s pressure from outside, the fear of standing out.']],
      why:'Inside reasons keep working when rewards and pressure go away.' }
  ]},
  { type:'match', id:'d7match', kicker:'Match them', title:'Match each idea from this week',
    pairs:[['Forgetting curve','Memory drops fast, then slower'],['Spacing','Same hours, spread over days'],['Retrieval practice','Recall first, then check'],
           ['Growth mindset','Skill grows with practice and better methods'],['Inside reason','You’d care even with no reward']],
    guide:'Tap one on the left, then its partner.' },
  { type:'lightning', id:'d7lz', kicker:'⚡ Lightning round', title:'Week 1: myth or fact?', labels:['Fact','Myth'], secs:30,
    items:[['Most forgetting happens in the first day after learning.',true,'The curve drops hardest early.'],
           ['If you understood it in class, you’ll remember it next week.',false,'Understanding isn’t remembering.'],
           ['Spreading 3 hours over 3 days beats 3 hours in one night.',true,'That’s spacing.'],
           ['Rereading your notes is the best way to revise.',false,'Quizzing yourself beats it a week later.'],
           ['Getting a self-quiz question wrong still helps you learn.',true,'Trying to recall helps, even when you miss.'],
           ['Believing in growth is enough to boost your marks.',false,'You need a better method too.'],
           ['Reasons you choose yourself keep you going longer.',true,'Inside reasons outlast rewards and pressure.'],
           ['Wanting a good placement is a bad reason to study.',false,'It’s fine. Just don’t make it your only reason.']],
    guide:'30 seconds. Fast fingers. ⚡' },
  { type:'reflect', key:'week1', track:'review', kicker:'Reflect', q:'How did you study this week? What’s one thing you’ll change next week?',
    text:'Think of a real class or test. Not marked, just honest.', minWords:10, ph:'This week I mostly…', btn:'Save',
    guide:'Your honest answer helps your Drive Profile.' },
  { type:'gameRound', game:'bounceBack', level:1, kicker:'Game · Bounce Back', title:'Find the next number',
    puzzles:[
      { q:'1, 4, 27, 256, ?', a:'3125', hint:'Look at 2 × 2, then 3 × 3 × 3. What about 4 and 5?', why:'Each number is n multiplied by itself n times: 5⁵ = 3125.' },
      { q:'2, 6, 12, 20, 30, ?', a:'42', hint:'Look at the gaps: 4, 6, 8, 10…', why:'The gaps grow by 2, so the next gap is 12.' },
      { q:'3, 5, 9, 17, 33, ?', a:'65', hint:'Try doubling each number. How far off are you?', why:'Each number is double the last, minus 1.' }],
    end:'What counts here isn’t the score. It’s what you did right after a miss.',
    guide:'The first one is tough on purpose. Your call after a miss.' },
  { type:'wrap', lines:['Week 1 done. Learner’s permit: unlocked. 🪪','Your first Drive Profile is ready in My Profiles. Go see it.'] }
]};
})();
