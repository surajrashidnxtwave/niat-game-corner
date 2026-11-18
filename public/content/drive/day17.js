/* Drive School · Day 17 · Think & Speak · The Chinese Room (Searle 1980) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: Searle, "Minds, Brains, and Programs", Behavioral and Brain Sciences 3(3), 1980. Turing, "Computing Machinery and Intelligence",
   Mind, 1950 (the imitation game, now called the Turing test). Chatbots like ChatGPT are first trained to predict the next token
   (a word or part of a word), then tuned further with human feedback; we say "first trained to guess the next word" (GenAI basics, Sem 1).
   The "systems reply" (the whole room understands, not the man) is one of the replies printed with Searle's paper.
   The stand has no right answer and is never judged or scored. */
window.DRIVE_LESSONS[17] = { screens: [
  { type:'info', kicker:'Day 17 · Think & Speak', title:'The Chinese Room', visual:['🚪 📦', '🧑 📘 ❓', '📝 ➡️ 🀄', '🤔'],
    body:['Picture this. You’re locked in a room. You don’t know a word of Chinese. 🚪','Notes in Chinese come in through a slot. You have a giant rule book.','It says: when you see these shapes, send back those shapes. 📘','Outside, people think you’re fluent. Do you understand Chinese?'],
    guide:'Keep this room in your head. We’ll need it.', cta:'Start' },
  { type:'info', kicker:'The claim', title:'Searle’s point', visual:['🧑‍🏫 1980', '📘 = 💻', '🧠 ?'],
    body:['A philosopher, John Searle, made this up in 1980.','The rule book is a program. You are the computer.','His claim: following rules about symbols isn’t understanding them. So a computer running a program doesn’t understand either.'],
    guide:'Now swap the room for ChatGPT. 👀' },
  { type:'poll', key:'d17guess', kicker:'Your guess', q:'Ask your batch: does ChatGPT understand what it writes?',
    opts:['Most would say yes','Most would say no','It’d be a close split'], guide:'About your batch, not you. Go with your gut.' },
  { type:'info', kicker:'Prove it', title:'What we actually know', visual:['🤖 💬', '📚 🔮', '❓'],
    facts:[['1950','Alan Turing: if you can’t tell it from a human in chat, call it thinking'],['1980','Searle: passing a chat test isn’t the same as understanding'],['Next word','what a chatbot like ChatGPT is first trained to guess, from huge amounts of text']],
    body:['Chatbots learn patterns from billions of sentences. Then they write one piece at a time.','That’s how it works. Whether it “understands” is still argued about by experts. There’s no settled answer.'],
    note:'Sources: Turing, Mind, 1950; Searle, Behavioral and Brain Sciences, 1980.',
    guide:'Experts disagree. So your reasons matter more than your side.' },
  { type:'bet', id:'d17q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “ChatGPT obviously understands. It explained Python dictionaries better than my teacher.” Which reply is the strongest?',
    opts:[['“It’s just a computer, so no way.”',false,'This repeats a view without a reason. “Just a computer” doesn’t say what’s missing.'],
          ['“It also makes up fake facts and sounds just as sure.”',true,'Strong. It points to evidence: good answers and confident wrong ones come out the same way.'],
          ['“My cousin works in AI and says it doesn’t.”',false,'Who said it isn’t a reason. What was their reason?'],
          ['“I don’t like using AI for studies anyway.”',false,'That’s your feeling about AI, not about understanding.']],
    why:'A strong reply gives a reason or evidence the other person has to deal with.' },
  { type:'pick', q:'Does ChatGPT understand what it writes?',
    sides:[['Yes, in a way','It explains, answers follow-ups and fixes code. If that isn’t a kind of understanding, what is?'],['No, it doesn’t','It’s the person in the room: very good at matching patterns, with nobody inside who gets the meaning.']],
    claims:['I think ChatGPT understands what it writes, in a way.','I think ChatGPT doesn’t understand what it writes.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Use something you’ve seen a chatbot do, good or bad.' },
  { type:'counter', texts:[
      'Being useful isn’t understanding. A calculator gets every sum right and knows nothing about numbers. Chatbots make up fake facts and fake sources in the same confident voice as true ones, because they’re guessing what words usually come next. Nobody inside checks whether it’s true. That’s exactly the person in Searle’s room.',
      'The man in the room doesn’t understand Chinese, but maybe the whole room does: the man, the rule book and the notes together. Your brain cells don’t understand English one by one either. If a chatbot can explain an idea, answer a new question about it and spot its own mistake, saying it “doesn’t understand” starts to sound like a word game.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 41 you’ll ask a harder one: is AI-written work yours?' }
]};
