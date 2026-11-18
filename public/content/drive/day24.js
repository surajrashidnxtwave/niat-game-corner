/* Drive School · Day 24 · Think & Speak · The trolley problem, on a self-driving car (Foot 1967; Thomson 1976;
   Bonnefon, Shariff & Rahwan 2016; Awad et al. 2018) + Take a Stand.
   STATUS: written by Claude Code, FOR TEAM REVIEW before release.
   Check: the "Prove it" facts. Bonnefon, Shariff & Rahwan, Science 352 (2016), "The social dilemma of autonomous vehicles": in their
   US online surveys, 76% said a car sacrificing its 1 passenger to save 10 people was the more moral choice, but people were much less willing
   to buy that car for themselves. Awad et al., Nature 563 (2018), "The Moral Machine experiment": about 40 million decisions from people in
   233 countries and territories. Facts checked online by Claude Code, Nov 17, 2026.
   The poll asks what the batch would want, not the student. The scenario is made up and simplified on purpose (brakes fail, two choices only). */
window.DRIVE_LESSONS[24] = { screens: [
  { type:'info', kicker:'Day 24 · Think & Speak', title:'Who should the car protect?', visual:['🚗 🤖', '🛑 ❌', '🚶🚶🚶 or 🧱', '🤔'],
    body:['A self-driving car is on a busy road in Hyderabad. One passenger inside. 🚗','Suddenly, its brakes fail. Three people are crossing right ahead. 🚶🚶🚶','It can go straight and hit them, or swerve into a wall and risk its passenger. 🧱','The car can’t think in the moment. Someone has to write that rule today. Who should it protect?'],
    guide:'There’s no right answer. Just yours.', cta:'Start' },
  { type:'info', kicker:'The puzzle', title:'The trolley problem', visual:['🚃 🛤️', '5 👥 vs 1 👤', '🔀 ❓'],
    body:['In 1967, a philosopher named Philippa Foot started a famous puzzle. The best-known version goes like this.','A runaway trolley will hit 5 people. Pull a lever, and it turns onto a track with 1 person instead.','Most people say pull it: 1 is fewer than 5. But change the story a little, and many change their minds.','For years it was just a classroom puzzle. Self-driving cars made it a real coding question.'],
    guide:'Saving more people vs protecting the person who trusted you.' },
  { type:'poll', key:'d24guess', kicker:'Your guess', q:'If the car can save 3 people crossing by risking its 1 passenger, what would most of your batch want it to do?',
    opts:['Most would want it to protect the passenger','Most would want it to save the most people','Our batch would be split about half and half'], guide:'About your batch, not you. Go with your gut.' },
  { type:'info', kicker:'Prove it', title:'What people actually said', visual:['🌍 🗳️', '👍 🧮', '🛒 😬'],
    facts:[['40 million','choices from people in 233 countries and territories, in an online game called the Moral Machine'],['76%','in one survey: saving 10 people over 1 passenger is more moral'],['But','far fewer wanted to buy that car for themselves']],
    body:['Around the world, people leaned towards saving more lives, and saving humans over animals.','But when it came to their own car, many wanted it to protect them first. 😬'],
    note:'Sources: Bonnefon, Shariff & Rahwan, Science, 2016; Awad et al., Nature, 2018.',
    guide:'We want other people’s cars to be heroes. Ours, not so much.' },
  { type:'bet', id:'d24q1', dim:'voice', kicker:'Spot the strong argument · bet on it', q:'Your friend says, “The car should always protect its passenger.” Which reply is the strongest?',
    opts:[['“That’s a really selfish way to think.”',false,'This attacks your friend, not the idea. It gives no reason.'],
          ['“Most people online disagree with you.”',false,'A crowd isn’t a reason. Plenty of crowds have been wrong.'],
          ['“The passenger chose the risk. People crossing didn’t.”',true,'Strong. It gives a reason: who chose the risk. Your friend has to answer that.'],
          ['“I just feel the car should save everyone.”',false,'A feeling, and the car can’t save everyone here. That’s the whole problem.']],
    why:'A strong argument gives a reason that changes how we see the choice, not an insult or a headcount.' },
  { type:'pick', q:'The brakes fail. Should the car be programmed to protect its passenger, or to save the most people?',
    sides:[['Protect the passenger','The car stays loyal to the person who bought it or booked the ride.'],['Save the most people','The car picks the choice that harms the fewest people, even if that’s the passenger.']],
    claims:['I think the car should protect its passenger.','I think the car should save the most people.'],
    guide:'Pick the side you actually believe.' },
  { type:'template', guide:'Think of real Indian roads: crowded crossings, autos, bikes.' },
  { type:'counter', texts:[
      'If cars are built to protect only their passengers, everyone outside a car pays: people walking, cycling or on bikes. On Indian roads, that’s most people. And the people crossing never chose to get in. If every company made its car loyal only to the buyer, the roads get more dangerous for everyone who can’t afford one.',
      'If a car might choose to sacrifice you, would you ever get in? Many people say no. Then fewer people use self-driving cars, and if those cars turn out safer than human drivers, more people get hurt in the long run. Also, a company deciding whose life counts more is scary. Protecting the passenger is at least a clear, simple rule.'],
    guide:'Read this carefully. It’s the best case against you.' },
  { type:'selfcheck', guide:'Changing your mind is allowed. So is holding firm.' },
  { type:'standWrap', note:'Stands aren’t marked. On Day 55 you’ll reread one and see how your thinking has changed.' }
]};
