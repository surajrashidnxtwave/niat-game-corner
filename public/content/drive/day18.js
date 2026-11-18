/* Drive School · Day 18 · Strategy · The illusion of fluency: rereading and highlighting.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. Karpicke, Butler & Roediger, Memory 17(4), 2009: 177 college students; 84% listed rereading as a study
   strategy, 55% said it was their number one strategy, only 1% named recalling (self-testing) as number one (checked in the paper's text).
   Dunlosky, Rawson, Marsh, Nathan & Willingham, Psychological Science in the Public Interest 14(1), 2013: rereading and highlighting rated
   "low utility". Facts checked online by Claude Code, Nov 17, 2026.
   The Python fact sheet (all true): Guido van Rossum (Dutch) started Python in December 1989 as a hobby over the Christmas holidays;
   first public release February 1991 (0.9.0); named after Monty Python's Flying Circus; Python 3.0 in December 2008;
   Python 2 support ended on 1 January 2020. The quiz has 3 true and 3 false lines, each answerable only from the sheet. */
(function(){
const SHEET = [['Made by','Guido van Rossum, a Dutch programmer'],['Started','December 1989, as a hobby over the Christmas holidays'],['First released','February 1991'],
               ['Named after','Monty Python, a British comedy show (not the snake)'],['Python 3.0','Came out in December 2008'],['Python 2','Support ended on 1 January 2020']];
window.DRIVE_LESSONS[18] = { screens: [
  { type:'info', kicker:'Day 18 · Strategy', title:'It feels like you know it', visual:['📖 📖 😌', '📝 ❓ 😳', '🪞'],
    body:['You read your notes. Then read them again. Everything looks familiar. 😌','Then the exam asks one question and… blank. 😳','Today you feel that trick happen. On purpose.'],
    guide:'Read the way you normally revise.', cta:'Start' },
  { type:'pairStudy', sheet:true, kicker:'Feel it · Read', title:'Python’s story: 6 facts', text:'Read this fact sheet carefully. You’ll read it once more next.', pairs:SHEET, secs:25, guide:'Just read. Like revising notes.' },
  { type:'pairStudy', sheet:true, kicker:'Feel it · Read again', title:'Same sheet, once more', text:'Read it again until the timer ends. Pretend you’re highlighting.', pairs:SHEET, secs:20, guide:'Feels easy the second time, right?' },
  { type:'slider', key:'d18guess', kicker:'Predict', q:'6 true-or-false questions on that sheet. How many will you get right?', min:0, max:6, value:3, btn:'Lock in my guess', aria:'How many you will get right', guide:'Be honest. How well do you know it?' },
  { type:'tf', id:'d18tf', key:'d18score', vs:'d18guess', kicker:'Quick test', title:'From the fact sheet', labels:['True','False'],
    items:[['Python is named after a snake.',false,'It’s named after Monty Python, a comedy show.'],
           ['Guido started Python as a hobby.',true,'Yes, over the Christmas holidays.'],
           ['Python was first released in 1989.',false,'Started in 1989. First released in 1991.'],
           ['Python 3.0 came out in 2008.',true,'December 2008.'],
           ['Support for Python 2 ended in 2010.',false,'It ended in 2020, on 1 January.'],
           ['Guido van Rossum is Dutch.',true,'Yes, he’s from the Netherlands.']],
    msgs:{ over:'You guessed higher than you scored. Rereading made it feel more known than it was. That’s the illusion.', same:'Spot on. Most people guess too high after rereading. Nice.', under:'You did better than you guessed. Nice. Still, most people guess too high after rereading.' },
    resultGuide:'Feeling familiar isn’t the same as knowing.', guide:'No peeking back. Tap fast.' },
  { type:'info', kicker:'Name it', title:'The illusion of fluency', visual:['📖 😌 = 🧠?', '🖍️ 🟨', '❓ ✅'],
    body:['When you reread, the page feels <b>familiar</b>. Your brain reads that as “I know this”. 😌','That’s the <b>illusion of fluency</b>. Easy to read isn’t easy to remember.','Highlighting does the same. The page looks done. Your memory isn’t. 🖍️','The fix: close the notes and test yourself. Blanks show you what you really know.'],
    guide:'Recognising it is easy. Recalling it is the test.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🎓 📊', '📖 📖', '🔍 ❓'],
    facts:[['84%','of college students in one survey said they reread to study'],['55%','said rereading was their No. 1 method. Only 1% said testing themselves'],['Low','how a big 2013 review rated rereading and highlighting']],
    body:['So most students pick the method that feels best, not the one that works best.','You already know the strong ones: retrieval practice and spacing.'],
    note:'Sources: Karpicke, Butler & Roediger, Memory, 2009; Dunlosky et al., Psychological Science in the Public Interest, 2013.',
    guide:'Smooth feels good. Struggle works.' },
  { type:'quiz', id:'d18q1', kicker:'Use it', q:'Your HTML and CSS test is on Friday. Best way to revise your notes tonight?',
    opts:[['Reread all the notes slowly, twice',false,'It will feel great, and that’s the trap. Familiar isn’t remembered.'],
          ['Close the notes, write what you recall, then check',true,'Yes. The gaps you find are exactly what to study next.'],
          ['Highlight the key lines in three colours',false,'The page looks organised. Your memory doesn’t change much.'],
          ['Copy the notes out neatly into a new book',false,'Neat copying takes hours and asks you to recall nothing.']],
    why:'Recall first, then check. Rereading only tells you the page is familiar.' },
  { type:'quiz', id:'d18q2', kicker:'Use it', q:'Sana says, “I read the Git notes 3 times. I know them.” How can she really check?',
    opts:[['Read them a 4th time to be sure',false,'More reading makes it feel even more familiar. It doesn’t check anything.'],
          ['Explain the Git commands to a friend, notes closed',true,'Right. If she can explain it without looking, she knows it.'],
          ['Ask herself if the notes feel easy now',false,'That feeling is the illusion. Easy to read isn’t easy to recall.'],
          ['Count how many pages she has highlighted',false,'Highlighted pages show effort, not memory.']],
    why:'The only real check is trying to recall it without looking.' },
  { type:'commit', key:'d18', q:'Pick one swap for your next revision.',
    opts:['If I finish reading a page of notes, then I’ll cover it and say the main points out loud.','If I want to highlight, then I’ll write a question in the margin instead.','If a topic feels easy, then I’ll test myself on it before I move on.'],
    guide:'Pick one for tonight or tomorrow.' },
  { type:'wrap', lines:['Familiar isn’t known. Now you’ve felt it. 🪞','Tomorrow: your Day 12 plans. Did they work?'] }
]};
})();
