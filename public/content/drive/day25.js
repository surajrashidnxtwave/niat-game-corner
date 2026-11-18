/* Drive School · Day 25 · Strategy · Ask “why?” (elaborative interrogation: Pressley et al. 1987; Dunlosky et al. 2013).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. Pressley, McDaniel, Turnure, Wood & Ahmad, Journal of Educational Psychology 79 (1987): students asked
   why each fact made sense remembered more than students who just read the facts (we give no percentages: not checked against the paper).
   Dunlosky et al., Psychological Science in the Public Interest 14 (2013): elaborative interrogation rated "moderate utility" of 10 methods;
   benefits grow with prior knowledge. Facts checked online by Claude Code, Nov 17, 2026.
   The 3 facts were checked in Python 3: 7 / 2 = 3.5, 7 // 2 = 3; bin(6) = 0b110, bin(10) = 0b1010, bin(12) = 0b1100 (even ends in 0);
   {'a': 1, 'a': 2} == {'a': 2}. The "Feel it" screen reuses the rewrite type: each fact is a label, the student writes why it's true. */
window.DRIVE_LESSONS[25] = { screens: [
  { type:'info', kicker:'Day 25 · Strategy', title:'Ask “why?”', visual:['👶 ❓❓❓', '📚 ✅', '🔗 🧠', '💡'],
    body:['Little kids ask “why?” about everything. It’s annoying. It also works. 👶','Today you’ll ask why about 3 facts from your classes.','Then we see why that one word is a study tool.'],
    guide:'Guessing is fine. Trying to explain is the point.', cta:'Start' },
  { type:'rewrite', kicker:'Feel it', title:'Why is each fact true?',
    text:'Write why each one is true, in your own words. Not sure? Make your best guess. At least 4 words each.',
    lines:['In Python, 7 / 2 gives 3.5, but 7 // 2 gives 3.','In binary, every even number ends in 0.','In Python, {\'a\': 1, \'a\': 2} becomes {\'a\': 2}.'],
    guide:'Start with “because…”. A guess still counts.' },
  { type:'info', kicker:'Compare', title:'One way to say why', visual:['💡', '🔗'],
    pairLabel:'Fact',
    pairs:[['In Python, 7 / 2 gives 3.5, but 7 // 2 gives 3.','/ is normal division, so it keeps the decimal. // is floor division: how many whole times 2 fits in 7. So the .5 is dropped.'],
           ['In binary, every even number ends in 0.','Every place except the last is worth 2, 4, 8 and so on, all even. Only the last place is worth 1. So the number is odd only if the last bit is 1.'],
           ['In Python, {\'a\': 1, \'a\': 2} becomes {\'a\': 2}.','Each key must point to one value, or lookup wouldn’t work. When the same key comes again, the later value replaces the earlier one.']],
    body:['Yours don’t need to match these.'], guide:'Notice: each why links to something you already knew.' },
  { type:'info', kicker:'Name it', title:'Elaborative interrogation', visual:['📄 ❓', '🔗 🧠', '🗂️ ✅', '🎯'],
    body:['Big name, simple idea: for every fact, ask <b>“Why is this true?”</b> and try to answer.','A fact on its own floats around and gets lost. 🎈','A fact with a why gets tied to things you already know. Tied facts are easier to find later. 🔗','It works best on topics you know a little about. The more you know, the better your whys.'],
    guide:'One word. Why?' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🧪 📄', '❓ 📈', '✅'],
    facts:[['1987','study: students who asked why about each fact remembered more than students who just read them'],['Moderate','rating in a big 2013 review of 10 study methods'],['Better','results when students already knew a bit about the topic']],
    body:['Same facts, same time. One group just read them. The other asked why each one made sense.','The why group remembered more. Not magic, but a solid, cheap habit.'],
    note:'Sources: Pressley et al., Journal of Educational Psychology, 1987; Dunlosky et al., Psychological Science in the Public Interest, 2013.',
    guide:'Asking costs nothing. It pays later.' },
  { type:'quiz', id:'d25q1', kicker:'Use it', q:'In class you learn: “Git keeps the full history of your project on your own laptop.” Which question will teach you the most?',
    opts:[['“Why is it useful to have the history on my laptop?”',true,'Yes. To answer it, you link the fact to what you know: working offline, undoing mistakes.'],
          ['“What’s the exact command to see the history?”',false,'Useful, but it asks what, not why. It won’t help the fact make sense.'],
          ['“Will this one come in the mid-sem exam?”',false,'Very common, but it only tells you whether to care, not why it’s true.'],
          ['“Can I just learn this line by heart?”',false,'Learning it by heart keeps the words, not the meaning.']],
    why:'A why-question makes you connect the new fact to what you already know. That connection is what sticks.' },
  { type:'quiz', id:'d25q2', kicker:'Use it', q:'Priya reads “a for loop over a dict gives its keys” 5 times. Arjun asks why, and decides “a key gets you the value, not the other way round.” Who remembers it next week?',
    opts:[['Priya, because she read it more times',false,'More reading feels safer, but rereading builds weak memory.'],
          ['Arjun, because he linked it to how dicts work',true,'Right. His why ties the fact to what he knows, so it’s easier to pull back out.'],
          ['Both the same, it’s the same fact',false,'Same fact, different way of studying it. The why makes the difference.'],
          ['Neither, facts like this are just forgotten',false,'Some forgetting is normal. Asking why slows it down.']],
    why:'Five reads add up to one weak memory. One good why can beat them.' },
  { type:'multiSelect', id:'d25ms', kicker:'Pick all that apply', q:'Which of these are good why-questions for studying?',
    opts:[['Why do list positions start at 0, not 1?',true,'it asks why a rule exists.'],
          ['What’s the answer to question 5?',false,'it asks for an answer, not a reason.'],
          ['Why does Git want a message with every commit?',true,'answering it links commits to teamwork and finding old changes.'],
          ['How many marks is this topic worth?',false,'useful for planning, but it teaches nothing about the topic.'],
          ['Why can 1 byte only hold numbers up to 255?',true,'8 bits, each 0 or 1: answering it uses what you know about binary.'],
          ['Can you send me your notes?',false,'that’s a favour, not a question about the topic.']],
    why:'A good why-question asks the reason behind a fact, so you have to connect it to something you know.', guide:'There’s more than one.' },
  { type:'commit', key:'d25', q:'Pick one way to ask why this week.',
    opts:['If I write down a rule in class, then I’ll add one line saying why it’s true.','If I revise a topic, then I’ll ask “why?” about 3 facts and answer before I check.','If I can’t answer a why, then I’ll ask it in the next class or to a senior.'],
    guide:'Pick the one you’ll use first.' },
  { type:'wrap', lines:['One word, big difference: why? 💡','Tomorrow: a bad mid-sem score. How do you bounce back?'] }
]};
