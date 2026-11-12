/* Drive School · Day 11 · Strategy · Interleaving (Rohrer & Taylor 2007).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" numbers against Rohrer & Taylor, Instructional Science 35 (2007), Experiment 2:
   practice 89% (blocked) vs 60% (mixed); test a week later 20% (blocked) vs 63% (mixed). Checked against the paper's text, Nov 11, 2026.
   Every Python answer below was checked by running type(...) in Python 3. */
(function(){
const OPTS = ['int', 'float', 'str', 'bool', 'list'];
const BLOCKED = [["'7'",'str'],['"3.5"','str'],["'True'",'str'],['7','int'],['10 // 3','int'],["len('abc')",'int'],['7.0','float'],['10 / 5','float'],['2 * 1.5','float']];
const MIXED = [["'7' + '7'",'str'],['7 / 7','float'],['3 > 2','bool'],['10 % 3','int'],['[7]','list'],["'abc'[0]",'str'],['1e3','float'],["'a' in 'cat'",'bool'],['len([1, 2])','int']];
window.DRIVE_LESSONS[11] = { screens: [
  { type:'info', kicker:'Day 11 · Strategy', title:'Mix it up', visual:['🐍 ❓', '🧱🧱🧱 vs 🔀', '⏱️ 🎯'],
    body:['Two quick rounds of Python. 🐍','Each time you see a value, tap its type: int, float, str, bool or list.','Round A comes in blocks. Round B is mixed. Notice how each one feels.'],
    guide:'Go fast, but not careless.', cta:'Round A' },
  { type:'drill', set:'A', kicker:'Round A · in blocks', title:'What type is it?', opts:OPTS, items:BLOCKED,
    end:'Notice anything? After the first one or two, you could guess the answer before you read it.', guide:'Tap the type.' },
  { type:'drill', set:'B', kicker:'Round B · mixed', title:'What type is it?', opts:OPTS, items:MIXED,
    end:'This one made you stop and think every time. Keep that in mind.', guide:'Same idea, all mixed up.' },
  { type:'drillResult', title:'Round A vs Round B', sets:[['A','Round A, in blocks'],['B','Round B, mixed']],
    body:['Most people do better and faster in Round A. It feels smooth.','In Round B you had to <b>choose</b> the type each time. That choosing is the skill an exam actually tests.'] },
  { type:'poll', key:'d11guess', kicker:'Predict', q:'Practice in blocks or mixed: which gives a better score on a test a week later?',
    opts:['Blocks: they felt easier and I got more right','Mixed: it was harder, so it sticks','About the same'], guide:'Go with your gut.' },
  { type:'info', kicker:'Name it', title:'Interleaving', visual:['🧱🧱🧱', '🔀', '🧠 ❓ ➡️ ✅', '🏆'],
    body:['<b>Blocked practice:</b> 10 loop questions, then 10 list questions, then 10 string questions.','<b>Interleaved practice:</b> the same 30, shuffled together. 🔀','Blocks feel better, because you already know which method to use.','Mixing forces you to spot the right method first. Exams never tell you that part.'],
    guide:'Harder practice, better results.' },
  { type:'info', kicker:'Prove it', title:'Blocks vs mixed, a week later', visual:['📐 📐 📐', '😊 89%', '😬 20%', '🔀 63%'],
    facts:[['89% vs 60%','during practice: blocks looked better'],['20% vs 63%','on a test a week later: mixed won'],['3×','higher score after mixed practice']],
    body:['Students practised maths problems, either in blocks or mixed.','During practice, blocks looked great. A week later, the mixed group scored 3 times higher.'],
    note:'Source: Rohrer & Taylor, Instructional Science, 2007.',
    guide:'The method that felt better lost. Sound familiar?' },
  { type:'quiz', id:'d11q1', kicker:'Use it', q:'You’ve learned loops, lists and strings. You have 30 practice questions. Which plan is best?',
    opts:[['10 loops, then 10 lists, then 10 strings',false,'That’s blocked. It feels smooth because you know the method before you read the question.'],
          ['All 30 shuffled together, all three topics',true,'Yes. You have to work out which tool each question needs, just like in the exam.'],
          ['30 questions on whichever topic is easiest',false,'Easy practice feels good but trains the least.'],
          ['Read the solutions to all 30 first',false,'That’s rereading. Try first, then check.']],
    why:'Learn each topic first, then mix them. Mixed practice trains you to choose the right method.' },
  { type:'quiz', id:'d11q2', kicker:'Use it', q:'Mixed practice feels slower and you get more wrong. What does that mean?',
    opts:[['It’s not working, so go back to blocks',false,'A tougher practice session doesn’t mean worse learning. The test a week later is what counts.'],
          ['Your brain is doing the work that makes it stick',true,'Right. The extra effort of choosing is what builds memory you can use later.'],
          ['You haven’t learned the basics yet',false,'Maybe, but feeling slower in mixed practice is normal even when you know the basics.'],
          ['Mixing only works for maths, not coding',false,'Mixing has helped in maths, science and other skills too. Choosing the method is part of coding.']],
    why:'Harder practice that makes you choose is a good kind of hard. Don’t judge a method by how it feels in the moment.' },
  { type:'commit', key:'d11', q:'Pick one way to mix your practice this week.',
    opts:['If I practise Python, then I’ll mix questions from at least 2 topics in one set.','If I revise for a test, then I’ll shuffle old questions instead of going chapter by chapter.','If I finish a topic, then I’ll add 2 of its questions to my next practice set.'],
    guide:'Pick the one you’ll use first.' },
  { type:'wrap', lines:['Blocks feel good. Mixing works better. 🔀','Tomorrow: the 2-line trick that turns goals into action.'] }
]};
})();
