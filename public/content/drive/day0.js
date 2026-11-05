/* Drive School · Day 0 · Setup: the starting-point check. Repeated near the end of the course as the after-check
   (students aren't told; we only collect).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   The two question sets are OUR OWN items (Nov 2026), written for this course, so no permission is needed.
   They are inspired by the ideas of growth mindset and grit, but are not the published scales: don't compare
   scores with published norms. Use them only to compare a student with themselves, and batches with each other.
   Scoring: answer 1–5 (left to right). Items marked true are reverse-scored (6 − answer). Higher = more growth / more stick-with-it. */
window.DRIVE_LESSONS[0] = { screens: [
  { type:'info', kicker:'Day 0 · Setup', title:'Meet Turbo', visual:['👋', '🚗 🛣️', '🤔 📚', '✅ ❌ 🚫', '🔒 🤫', '😇'],
    body:['Hey there! I’m Turbo, your guide in Drive School. 👋','Every day, 10 minutes: learn smarter, think for yourself, and level up. 🛣️','But first, real talk: how do you study right now? 👀','A few quick taps. No marks, no wrong answers.','Nobody sees this but you.'],
    guide:'Be honest. Fake answers = fake results.', cta:'Let’s do it' },
  { type:'multi', key:'study', memo:true, kicker:'Last week', q:'How did you study last week? Tap all that apply.',
    opts:['Reread my notes or the textbook','Highlighted or underlined','Tested myself without looking','Solved practice questions','Watched videos on the topic','Made summaries or mind maps','Studied with friends','Studied mostly the night before a test','I didn’t study outside class'],
    none:8, guide:'What you actually did, not what you “should” do.' },
  { type:'slider', key:'studyHours', memo:true, mustMove:true, logKind:'study', kicker:'Last week', q:'Roughly how many hours did you study outside class last week?',
    min:0, max:30, value:5, unit:' h', minLabel:'0', maxLabel:'30+', aria:'Hours studied outside class last week', btn:'Lock it in', guide:'Drag it. A rough number is fine.' },
  { type:'scale', scale:'mindset', kicker:'About you · 1 of 2', title:'Do you agree?',
    text:'Go with your first reaction. There’s no right answer.',
    options:['Totally disagree','Disagree','Not sure','Agree','Totally agree'],
    // [item, reverse-scored?]  our own items: 3 "can grow" + 3 "fixed"
    items:[['If I’m bad at something now, I can get good at it with the right practice.',false],
           ['Some people are just born smart, and practice can’t change that much.',true],
           ['When a topic feels hard, it means my brain is learning something new.',false],
           ['If I have to work really hard at something, I’m probably not talented at it.',true],
           ['My marks so far show how smart I’ll always be.',true],
           ['With a better method, I could get good at a subject I’m weak in now.',false]],
    guide:'Tap one answer for each line.' },
  { type:'scale', scale:'grit', kicker:'About you · 2 of 2', title:'How much is this you?',
    text:'Think about the real you, not the you on a good day.',
    options:['Not me at all','A little','Sometimes','Mostly','Totally me'],
    // [item, reverse-scored?]  our own items: 3 "keeps going" + 3 "drops off"
    items:[['When I start a project, I finish it, even when it gets boring.',false],
           ['I often start new goals or hobbies and drop them within a few weeks.',true],
           ['A bad mark makes me want to give up on that subject.',true],
           ['If something doesn’t work, I try a different way instead of quitting.',false],
           ['I keep going on long tasks, even when there’s no quick reward.',false],
           ['I find it hard to stick with one goal for more than a month.',true]],
    guide:'Last one. Almost done!' },
  { type:'wrap', lines:['Setup done. The road is open. 🛣️','Next up, Day 1: why your brain deletes stuff, and how to stop it.'] }
]};
