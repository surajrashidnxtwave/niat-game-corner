/* Drive School · Day 12 · Motivation · If-then plans (Gollwitzer & Sheeran 2006).
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts against Gollwitzer & Sheeran, Advances in Experimental Social Psychology 38 (2006):
   94 independent tests, a medium-to-large effect (d = .65). The "8,000+ people" figure seen online isn't in the paper, so we don't use it.
   A bigger review (Sheeran, Listrom & Gollwitzer, European Review of Social Psychology, 2024; 642 tests) found smaller but real effects.
   Facts checked online by Claude Code, Nov 11, 2026.
   The two plans are saved together in memo plan_d12. Day 19 ("Did your plan work?") shows them again and asks how they went. */
window.DRIVE_LESSONS[12] = { screens: [
  { type:'info', kicker:'Day 12 · Motivation', title:'If-then plans', visual:['🎯 🤷', '📝 If… then…', '🤖 ✅', '🗓️'],
    body:['“I’ll study more this week.” Sounds good. Almost never happens. 🤷','Today you learn a 2-line trick that makes plans actually happen.','You’ll leave with 2 plans for this week.'],
    guide:'Two lines. That’s all it takes.', cta:'Start' },
  { type:'bet', id:'d12q1', kicker:'Bet on it', q:'Who is more likely to actually go running this week?',
    opts:[['Meera: “I’ll exercise more this week.”',false,'A goal with no time or place. When the moment comes, nothing tells her “now”.'],
          ['Tara: “Mon, Wed, Fri, 7 am: I run round the hostel.”',true,'Yes. She decided the when, the where and the what. The moment itself becomes the reminder.'],
          ['Ravi: “I’m going to get really fit this month.”',false,'A bigger goal, but still no moment and no clear action.'],
          ['Sam: “I’ll go running whenever I get free time.”',false,'“Free time” rarely shows up on its own. It waits for a mood.']],
    why:'A plan that names a time or situation turns into an automatic cue. Vague goals wait for a mood that rarely comes.' },
  { type:'info', kicker:'Name it', title:'If [situation], then I’ll [action]', visual:['📍 ⏰', '➡️', '🏃', '🤖'],
    body:['An <b>if-then plan</b> links a moment to an action.','<b>If</b> it’s 9 pm on a weekday, <b>then</b> I’ll do 10 Python questions in the reading room.','You decide once. When the moment comes, your brain is already set. 🤖','It works for problems too: <b>If</b> I pick up my phone while studying, <b>then</b> I’ll put it in my bag.'],
    guide:'The “if” is your trigger. The “then” is one clear action.' },
  { type:'info', kicker:'Prove it', title:'What the research says', visual:['🧪 📚', '📈', '🔁 ✅'],
    facts:[['94','studies in a 2006 review'],['Medium–large','boost to actually doing the thing'],['642','studies in a bigger 2024 review: a smaller boost, but still real']],
    body:['From exercise to exams to health checks, if-then plans helped people follow through.','It’s one of the simplest tools in psychology. And it’s free.'],
    note:'Sources: Gollwitzer & Sheeran, Advances in Experimental Social Psychology, 2006; Sheeran, Listrom & Gollwitzer, European Review of Social Psychology, 2024.',
    guide:'Simple doesn’t mean weak.' },
  { type:'swipe', id:'d12sw', kicker:'Swipe it', title:'Vague goal or if-then plan?', sides:['Vague goal','If-then plan'],
    cards:[['I’ll study more this week.',0,'No when, no where, no clear action.'],
           ['If class ends on Tuesday, then I’ll revise that lecture for 15 minutes in the library.',1,'A clear moment, place and action.'],
           ['I will be more focused.',0,'A wish, not a plan. Focused when? Doing what?'],
           ['If I open Instagram while studying, then I’ll put the phone in my bag.',1,'A trigger and a clear move. That’s an obstacle plan.'],
           ['I’ll start the assignment early.',0,'“Early” isn’t a moment. It slides into “later”.'],
           ['If it’s 11 pm, then I’ll put my phone on charge across the room.',1,'Time plus action. Easy to check if you did it.']],
    guide:'Swipe right if it names a moment and an action.' },
  { type:'quiz', id:'d12q2', kicker:'Use it', q:'Priya’s plan: “I’ll revise Maths this week.” What’s the best fix?',
    opts:[['“I’ll revise Maths a lot this week, for real.”',false,'Stronger words, still no moment. It’s the same vague goal.'],
          ['“If it’s 6 pm on Mon and Thu, then I’ll do 5 Maths problems.”',true,'Yes. A clear moment and a small, clear action.'],
          ['“I’ll revise Maths when I feel motivated.”',false,'That waits for a mood. Moods are unreliable triggers.'],
          ['“I’ll revise every subject this week.”',false,'Bigger and vaguer. It’s harder to start, not easier.']],
    why:'Add a when (or a situation) and one clear action. Keep the action small enough to actually do.' },
  { type:'ifthen', key:'d12a', kicker:'Plan 1 of 2', q:'A study plan for this week',
    text:'Pick a real moment in your week. Then one small, clear action.',
    examples:[['it’s 9 pm on Monday','do 10 Python questions from memory'],['my last class ends on Wednesday','review that day’s notes for 15 minutes'],['I sit down at my desk after dinner','close every tab except my study one']],
    guide:'A real moment from your week.' },
  { type:'ifthen', key:'d12b', kicker:'Plan 2 of 2', q:'Beat the thing that usually stops you',
    text:'What usually gets in the way? Your phone, being tired, a friend’s plan? Put it in the “if”.',
    ifPh:'the thing that usually stops you', thenPh:'what you’ll do instead',
    examples:[['I want to scroll during study time','put my phone in my bag for 25 minutes'],['I feel too tired to start','do just 5 minutes, then decide'],['friends ask me out on a study night','say yes for after I finish one task']],
    guide:'Plan for the obstacle before it shows up.' },
  { type:'wrap', lines:['Two plans, ready for this week. 📝','On Day 19 we’ll ask: did they work?'] }
]};
