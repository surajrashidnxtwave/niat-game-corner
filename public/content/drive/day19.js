/* Drive School · Day 19 · Motivation · Did your plan work? Effort vs strategy.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Reads back the two if-then plans from Day 12 (memo plan_d12, an array) on the planCheck screen. If none are saved
   (Day 12 skipped by a test account, or an old save), it shows two example plans instead and logs missing:true.
   The plan that went worst is shown again on the rewrite screen (ifthen with old:true); the new plan is saved in memo plan_d19.
   Check: the "Prove it" lines paraphrase Carol Dweck, "Carol Dweck Revisits the 'Growth Mindset'", Education Week, Sept 22, 2015:
   effort is key, but it isn't the only thing; students need to try new strategies and get input from others when stuck.
   Checked by Claude Code, Nov 17, 2026. */
window.DRIVE_LESSONS[19] = { screens: [
  { type:'info', kicker:'Day 19 · Motivation', title:'Did your plan work?', visual:['📝 Day 12', '🔍', '🛠️'],
    body:['A week ago you wrote 2 if-then plans. 📝','Today: an honest check. Did they happen?','No marks for “yes”. A plan that failed teaches you more.'],
    guide:'Be honest. Nobody sees this but you.', cta:'Let’s check' },
  { type:'planCheck', key:'d19check', from:12, kicker:'Look back', q:'Your Day 12 plans. How did each one go?',
    text:'Tap one answer under each plan.',
    opts:['Did it most times','Did it once or twice','Didn’t do it','Forgot about it'],
    emptyQ:'No Day 12 plans saved. Try these two instead.', emptyText:'Imagine you made these plans last week. How would they have gone for you?',
    fallback:['If it’s 9 pm on a weekday, then I’ll do 10 Python questions.','If I want to scroll while studying, then I’ll put my phone in my bag.'],
    guide:'Honest answers only. “Forgot” is a real answer.' },
  { type:'multi', key:'d19why', logKind:'review', kicker:'What got in the way?', q:'If a plan didn’t fully work, what happened? Pick all that fit.',
    opts:['The “if” moment never really came','The “if” was too vague to notice','The action was too big','I forgot the plan existed','Something kept getting in the way','I didn’t really want to do it','Nothing, both plans worked'],
    none:6, min:1, guide:'Look for the reason, not someone to blame.' },
  { type:'info', kicker:'Name it', title:'Effort or strategy?', visual:['😤 💪', '🛠️ 🗺️', '✅'],
    body:['When a plan fails, most of us say: “I need to try harder.” 😤','Usually the plan is the problem. The cue was vague, the action too big, or the time was wrong.','More effort on a broken plan gets the same result.','Change the <b>strategy</b>, not just the effort. 🛠️'],
    guide:'You didn’t fail. The plan did. Fix the plan.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🌱 🧑‍🏫', '🔁 🛠️', '🤝'],
    facts:[['Effort','matters, but it isn’t enough on its own'],['New strategies','are what to try when you’re stuck'],['Help','from others is part of it too']],
    body:['Carol Dweck, who named the growth mindset, said this herself in 2015.','Praising pure effort when nothing is working is what she calls a false growth mindset.'],
    note:'Source: Dweck, Education Week, 2015.',
    guide:'Same idea as Day 2: effort plus a better method.' },
  { type:'swipe', id:'d19sw', kicker:'Swipe it', title:'Try harder, or change the plan?', sides:['Just try harder','Change the plan'],
    cards:[['“If I’m free, I’ll study” never happened.',1,'“Free” isn’t a moment. Pick a real time or event.'],
           ['“I’ll do 2 hours after class” died on day 2.',1,'Too big. Shrink the action until it’s easy.'],
           ['“After dinner” failed because dinner time keeps changing.',1,'Hang it on a cue that’s steady, like brushing at night.'],
           ['I kept forgetting my plan.',1,'Put a reminder where the cue happens, or pick a stronger cue.'],
           ['“I’ll just push through with more willpower.”',0,'Willpower on a broken plan gives the same result. Fix the plan.'],
           ['“I’ll be more disciplined next week.”',0,'That’s the Day 12 wish again: no moment, no clear action.']],
    guide:'Swipe right if it fixes the plan itself.' },
  { type:'quiz', id:'d19q1', kicker:'Use it', q:'Kiran’s plan: “If it’s 6 am, then I’ll code for 1 hour.” He did it once in 7 days. Best fix?',
    opts:[['Keep the plan and set three alarms',false,'More pressure on the same plan. The plan is the problem.'],
          ['“If I finish breakfast, then I’ll code for 15 minutes.”',true,'Yes. A cue he never misses, and a smaller action.'],
          ['Drop plans and code when he feels ready',false,'Waiting for a mood is what plans are meant to fix.'],
          ['Make it 2 hours to catch up on missed days',false,'Bigger makes it harder to start, not easier.']],
    why:'When a plan fails, check the “if” (clear and steady?) and the “then” (small enough?). Then change one.' },
  { type:'ifthen', key:'d19', old:true, oldNote:'Your old plan (the one that went worst). Fix the “if”, the “then”, or both.', kicker:'Rewrite one plan', q:'Make it work this time',
    text:'Use what you found: a clearer “if”, a smaller “then”, or both.',
    ifPh:'a clear moment you won’t miss', thenPh:'a smaller action you can do every time',
    examples:[['I sit down after dinner','do 5 Python questions'],['class ends on Tuesday','spend 10 minutes on that day’s notes'],['I pick up my phone during study time','put it in my bag for 25 minutes']],
    guide:'Change something real. Small is fine.' },
  { type:'wrap', lines:['Plan checked, plan fixed. 🛠️','Tomorrow: should you quit something you’ve already put a lot into?'] }
]};
