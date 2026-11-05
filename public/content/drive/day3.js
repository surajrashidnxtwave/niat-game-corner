/* Drive School · Day 3 · Think & Speak · Take a Stand: the Ship of Theseus. Never judged.
   Nov 2026: switched from the POC's CampusEats app to the original ship story (the app version felt one-sided:
   most students said "the updated app", like a Play Store app). Tech touch = the phone and Insta warm-up polls.
   STATUS: rewritten by Claude Code, FOR TEAM REVIEW. */
window.DRIVE_LESSONS[3] = { screens: [
  { type:'info', kicker:'Day 3 · Think & Speak', title:'A 2,000-year-old brain teaser', visual:['🤯', '👉 🗣️', '🚫 📝', '💭'],
    body:['Today there’s no right answer. Seriously. 🤯','You hear a puzzle, pick a side, and say why.','Nobody marks your opinion. Ever.'],
    guide:'Your view, not ours.', cta:'Start' },
  { type:'scenarioSlider', kicker:'The puzzle', title:'The ship of Theseus', shape:'planks',
    body:['Theseus, a Greek hero, has a famous wooden ship. It’s kept in a harbour so people can visit it.','Every year, a few planks rot. Workers swap each rotten plank for a new one.'],
    count:16, max:24, aria:'Years in the harbour', left:'Year 1', right:'Year 100', unit:'{k} of 16 planks replaced',
    note:'Dark planks are the originals. Light planks are new.',
    end:'Every single plank is new now. Is it still Theseus’ ship?', endGuide:'Hold that thought.',
    guide:'Drag the slider through 100 years.' },
  { type:'poll', key:'d3phone', kicker:'Same puzzle, in your pocket', q:'In 3 years you replace your phone’s screen, battery, back panel, camera and charging port. Is it still the same phone?',
    opts:['Yes, it’s still my phone','No, it’s basically a new phone','Kind of? Not sure'], btn:'Next', guide:'Quick gut answer.' },
  { type:'poll', key:'d3insta', kicker:'Same puzzle, on your Insta', q:'You change your username, delete every old post, and change your bio and photo. Same account?',
    opts:['Yes, it’s still my account','No, it’s a new account now','Kind of? Not sure'], btn:'Next', guide:'Hmm. What makes it “the same”?' },
  { type:'info', kicker:'The twist', title:'Now there are two ships', visual:['🪵 🪵 🪵', '🔨 ⛵', '⛵ vs ⛵', '❓'],
    body:['Someone secretly kept every old plank the workers threw out. 🪵','They put them all back together, exactly like the first ship.','So now two ships exist: the one in the harbour, and the one rebuilt from the original planks.'],
    guide:'Which one is the real ship of Theseus?' },
  { type:'pick', q:'Which one is the real ship of Theseus?',
    sides:[['The ship in the harbour','The one that kept getting repaired, with the same name, place and history.'],['The rebuilt ship','The one made from every original plank.']],
    claims:['I think the real ship is the one in the harbour.','I think the real ship is the rebuilt one.'],
    guide:'Pick what you actually believe.' },
  { type:'template', guide:'Write it like you’re explaining to a friend.',
    parts:[['because','Because','e.g. what makes something “the same” is…'],['example','For example','Your phone, your Insta, your college, anything.'],['other','Someone who disagrees would say','Their best point, not a weak one.'],['reply','My reply','One line back at them.']] },
  { type:'counter', texts:[
      'The rebuilt ship has every plank Theseus ever touched. If the ship is the thing he sailed, the rebuilt one is it. The harbour ship just kept the name. A new phone in your old case isn’t your old phone.',
      'The harbour ship never stopped being the ship. It stayed in one place, with one name and one history, and changed slowly, like you do. Your body replaces most of its cells over the years, and you’re still you.'],
    guide:'This is the best case against you. Read it properly.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 55 you’ll reread this one and see how your thinking changed.' }
]};
