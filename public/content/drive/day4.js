/* Drive School · Day 4 · Strategy · Retrieval practice (Roediger & Karpicke 2006).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the 2006 numbers on the "Prove it" screen against the paper (Psychological Science 17(3), Experiment 1).
   The 12 "Velari" words are made up on purpose, so nobody knows them already. Day 7 tests both sets again. */
(function(){
const A = [['vrolt','river'],['plirn','lamp'],['skeb','window'],['yurlek','cloud'],['quomra','bridge'],['tazzik','pencil']];
const B = [['brenth','mountain'],['flonk','spoon'],['gwira','ticket'],['ozzel','mirror'],['prumf','garden'],['zeltik','button']];
window.DRIVE_PAIRS = { A, B };   // Day 7 retests the same words
window.DRIVE_LESSONS[4] = { screens: [
  { type:'info', kicker:'Day 4 · Strategy', title:'Rereading vs quizzing: a battle', visual:['👽 🔤', '📖📖 vs ❓✍️', '🧠 🏆', '🥊'],
    body:['Today you learn 12 words of Velari. It’s a fake language we made up. 👽','Set A: you just read it twice. Set B: you quiz yourself.','Then we see which set your brain actually keeps.'],
    guide:'Same words, two methods. Fight!', cta:'Start' },
  { type:'pairStudy', kicker:'Set A · Read', title:'Read these 6 words', text:'Read the list carefully. You’ll get to read it again next.', pairs:A, secs:20, guide:'Just read. No tricks.' },
  { type:'pairStudy', kicker:'Set A · Read again', title:'Read them once more', text:'Same list. Read it again until the timer ends.', pairs:A, secs:25, guide:'This is how most people revise: read it again.' },
  { type:'pairStudy', kicker:'Set B · Read', title:'Read these 6 words', text:'Read the list carefully. Next, you’ll quiz yourself on it.', pairs:B, secs:20, guide:'New set. Read it once.' },
  { type:'pairQuiz', id:'d4quizB', set:'B', kicker:'Set B · Quiz yourself', title:'Type the meaning', pairs:B, guide:'Try to remember before you check. Wrong answers are fine.' },
  { type:'poll', key:'d4guess', kicker:'Predict', q:'Which set will you remember better in 3 days?',
    opts:['Set A, the one I read twice','Set B, the one I quizzed myself on','About the same'], guide:'Go with your gut. We’ll check on Day 7.' },
  { type:'pairTest', key:'now', kicker:'Quick test', title:'What does each word mean?', text:'All 12 words, mixed up. Leave a box empty if you don’t know.',
    sets:[{ id:'A', pairs:A }, { id:'B', pairs:B }], guide:'Type the English word for each.' },
  { type:'pairResult', title:'Right after studying', of:6, note:'On Day 7 you’ll take the same test, with no review in between.' },
  { type:'info', kicker:'Name it', title:'Pull it out, don’t pour it in', visual:['🧠 ⬅️ ✍️', '📖 😌', '❌ ➡️ 💪', '🏋️'],
    body:['Trying to remember <b>before</b> you look makes memory stronger. It’s called retrieval practice.','Rereading feels smooth, so it feels like it’s working. It mostly isn’t. 😬','A quiz, even one you fail, does more for next week.'],
    guide:'The struggle to remember IS the workout.' },
  { type:'info', kicker:'Prove it', title:'Reading vs testing, a week later', visual:['📄 📄', '📖 5 min · ✍️ 1 week', '💀'],
    facts:[['81% vs 75%','after 5 minutes: rereading wins'],['42% vs 56%','after 1 week: quizzing wins'],['Top 2','study methods in a big 2013 review: testing + spacing']],
    body:['Students read short passages. Some reread them, some took a recall test.','Rereading won for 5 minutes. Quizzing won after a week.'],
    note:'Sources: Roediger & Karpicke, Psychological Science, 2006; Dunlosky et al., Psychological Science in the Public Interest, 2013.',
    guide:'The method that felt better… lost. 💀' },
  { type:'quiz', id:'d4q1', kicker:'Use it', q:'Your exam is in 5 days and covers 4 chapters. Which plan will help you most on the day?',
    opts:[['Reread all 4 chapters twice, slowly and carefully',false,'Rereading feels good but builds the weakest memory of these options.'],
          ['Each day, answer questions from memory, then check',true,'Yes. Testing yourself and checking, spread over days, is the strongest plan here.'],
          ['Make neat colour-coded notes for every chapter',false,'Making notes takes hours and mostly copies, without testing what you remember.'],
          ['Watch all the lecture videos again at 1.5x speed',false,'This is rereading in video form. It feels familiar, but familiar isn’t remembered.']],
    why:'Practice testing plus spacing are the two methods with the strongest evidence. Use them together.' },
  { type:'quiz', id:'d4q2', kicker:'Use it', q:'Neha “tests herself” by reading each question, then reading the answer right away. What’s missing?',
    opts:[['She should read the answers more slowly',false,'Slower reading is still reading. The memory never gets pulled out.'],
          ['She never tries to recall before she checks',true,'Right. The effort of recalling first is what makes it stick.'],
          ['She should use harder questions from seniors',false,'Harder questions won’t help if she still reads the answer straight away.'],
          ['Nothing, this is retrieval practice already',false,'It looks like a quiz, but without trying first, it’s rereading.']],
    why:'Retrieval practice means answer first, from memory, then check. Even a wrong guess helps.' },
  { type:'multiSelect', id:'d4ms', kicker:'Pick all that apply', q:'Which of these are retrieval practice?',
    opts:[['Covering the answer on a flashcard and saying it first',true,'you recall before you look.'],
          ['Rereading your notes slowly',false,'nothing gets pulled out of memory.'],
          ['Solving an old paper without opening your notes',true,'pure recall, then you check.'],
          ['Highlighting the key lines',false,'it marks the page, not your memory.'],
          ['Explaining a topic to a friend from memory',true,'you have to pull it out to explain it.'],
          ['Watching the lecture video again',false,'that’s rereading in video form.']],
    why:'If you pull it out of your head before checking, it’s retrieval practice.', guide:'There’s more than one.' },
  { type:'blanks', id:'d4blank', kicker:'Fill the blanks', title:'Tap a word to fill each blank',
    text:'Retrieval practice means trying to {0} before you {1}. Rereading feels {2}, but a week later it works {3}.',
    answers:['remember','look','easy','worse'], bank:['highlight','better','hard'],
    why:'Pull it out first, then check. The easy-feeling method lost after a week.', guide:'Tap a word, it drops into the next blank.' },
  { type:'commit', key:'d4', q:'Pick one way to use retrieval practice this week.',
    opts:['If I finish a class, then I’ll write 3 things I remember before opening my notes.','If I revise a topic, then I’ll close the book and explain it out loud first.','If it’s the weekend, then I’ll answer 5 old questions from memory before checking.'],
    guide:'Pick one you can do tonight or tomorrow.' },
  { type:'wrap', lines:['Now you know why quizzing beats rereading. 🧠','Day 7: surprise Velari test. Which set survives?'] }
]};
})();
