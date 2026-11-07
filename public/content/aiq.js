/* Extra AI-game puzzles (You or AI?, Hint Ladder). Same shape as AIQ / AIQ_FIXED in index.html.
   Templates call ri / pick / shuffle / mkQ only inside gen(), so this file can load before the main script. */
(function(){
const NM = ['Asha','Ravi','Meena','Arjun','Priya','Imran','Divya','Karthik','Sana','Sai','Fatima','Rahul','Lakshmi','Nikhil'];
const two = () => shuffle(NM).slice(0, 2);
const nf = x => Number.isInteger(x) ? String(x) : String(+x.toFixed(2));
const rs = x => '₹' + nf(x);
const pct = x => nf(x) + '%';
const pl = a => '[' + a.join(', ') + ']';
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const b4 = x => x.toString(2).padStart(4, '0');
const HX = x => x.toString(16).toUpperCase();
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

(window.MORE = window.MORE || {}).aiq = [
  /* ---------- aptitude ---------- */
  { id:'pctless', topic:'Aptitude', gen(){
    const x = pick([25, 60, 100, 150, 300, 400]), a = 100 * x / (100 + x), [p, q] = two();
    return mkQ({ id:this.id, topic:this.topic, fmt:pct, ans:a, trap:x, extra:[x / 2, a + 5], step:5,
      q:`${p}’s internship stipend is ${x}% more than ${q}’s. By what percent is ${q}’s stipend less than ${p}’s?`,
      right:`Say ${q} gets ₹100. Then ${p} gets ₹${100 + x}. ${q} gets ₹${x} less out of ₹${100 + x}: ${x} ÷ ${100 + x} × 100 = ${nf(a)}%. Answer: {A}`,
      wrong:`${x}% more one way means ${x}% less the other way. Answer: {T}`,
      hints:[`“Less than ${p}’s” means the percent is worked out on ${p}’s stipend, the bigger one.`, `Take ${q}’s stipend as ₹100 and find ${p}’s. Then find the gap as a percent of ${p}’s.`] }); } },
  { id:'passmarks', topic:'Aptitude', gen(){
    let p, T, f, m; do { p = pick([30, 35, 40, 50]); T = pick([200, 300, 400, 500, 600, 800]); f = ri(2, 8) * 5; m = p * T / 100 - f; } while (m <= 0 || (m * 100) % p);
    const name = pick(NM), pass = m + f, tr = m * 100 / p;
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' marks', ans:T, trap:tr, extra:[T + 100, T - 50], step:50,
      q:`To pass an exam you need ${p}% of the total marks. ${name} scored ${m} marks and failed by ${f} marks. What are the total marks?`,
      right:`The pass mark is ${m} + ${f} = ${pass}. That is ${p}% of the total, so total = ${pass} × 100 ÷ ${p} = ${T}. Answer: {A}`,
      wrong:`${name} scored ${m}, which is ${p}% of the total. Total = ${m} × 100 ÷ ${p} = ${tr}. Answer: {T}`,
      hints:[`Did ${name} reach the pass mark? What is the pass mark in marks?`, 'Pass mark = marks scored + marks short. The pass mark is the given percent of the total.'] }); } },
  { id:'ratiochain', topic:'Aptitude', gen(){
    let a, b, c, d, g, x, y; do { a = ri(1, 7); b = ri(2, 9); c = ri(2, 9); d = ri(1, 9); g = gcd(a * c, b * d); x = a * c / g; y = b * d / g; }
    while (gcd(a, b) > 1 || gcd(c, d) > 1 || b === c || (x === a && y === d));
    const [p, q, r] = shuffle(NM).slice(0, 3);
    return mkQ({ id:this.id, topic:this.topic, ans:`${x}:${y}`, trap:`${a}:${d}`, extra:[`${y}:${x}`, `${a + c}:${b + d}`, `${a * c}:${b * d}`, `${d}:${a}`],
      q:`${p}’s savings : ${q}’s savings = ${a}:${b}. ${q}’s savings : ${r}’s savings = ${c}:${d}. What is ${p}’s savings : ${r}’s savings?`,
      right:`Make ${q}’s part the same in both. Multiply the first ratio by ${c} and the second by ${b}: ${a * c}:${b * c} and ${b * c}:${b * d}. So ${p} : ${r} = ${a * c}:${b * d}${g > 1 ? ' = ' + x + ':' + y : ''}. Answer: {A}`,
      wrong:`${p} is ${a} and ${r} is ${d}, so the ratio is ${a}:${d}. Answer: {T}`,
      hints:[`${q} is ${b} parts in the first ratio but ${c} parts in the second. Are those parts the same size?`, `Scale both ratios so ${q}’s number is the same, then read off ${p} and ${r}.`] }); } },
  { id:'partner', topic:'Aptitude', gen(){
    let x, y, t, P, s1, s2; do { x = pick([10, 20, 30, 40, 50]) * 1000; y = pick([10, 20, 30, 40, 50]) * 1000; t = pick([3, 4, 6, 8, 9]); P = ri(4, 30) * 1000; s1 = x * 12; s2 = y * t; }
    while ((P * s1) % (s1 + s2) || (P * x) % (x + y));
    const a = P * s1 / (s1 + s2), tr = P * x / (x + y), g = gcd(s1, s2), [p, q] = two();
    return mkQ({ id:this.id, topic:this.topic, fmt:rs, ans:a, trap:tr, extra:[P - a, P / 2], step:500,
      q:`${p} puts ₹${x} into a juice shop near campus for all 12 months. ${q} puts in ₹${y}, but only for the last ${t} months. The year’s profit of ₹${P} is shared by money × months. What is ${p}’s share?`,
      right:`Money × months: ${p} ${x} × 12 = ${s1}, ${q} ${y} × ${t} = ${s2}. Ratio ${s1 / g}:${s2 / g}. ${p} gets ${P} × ${s1 / g} ÷ ${(s1 + s2) / g} = ₹${a}. Answer: {A}`,
      wrong:`They put in ₹${x} and ₹${y}, so ${p} gets ${x} ÷ ${x + y} of ₹${P} = ₹${tr}. Answer: {T}`,
      hints:[`Did ${q}’s money work for the whole year?`, 'Share profit in the ratio of money × months for each person.'] }); } },
  { id:'leak', topic:'Aptitude', gen(){
    const [a, b] = pick([[3,6],[4,12],[6,12],[10,15],[12,24],[20,30],[2,6],[6,30],[4,6],[8,24]]), r = a * b / (b - a), tr = a * b / (a + b);
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' hours', ans:r, trap:tr, extra:[b - a, a + b],
      q:`A tap fills an empty hostel water tank in ${a} hours. A leak can empty the full tank in ${b} hours. With the tap on and the leak open, how long does the tank take to fill?`,
      right:`Each hour the tap fills 1/${a} and the leak empties 1/${b}. Net: 1/${a} − 1/${b} = ${b - a}/${a * b} of the tank per hour. So it takes ${a * b} ÷ ${b - a} = ${nf(r)} hours. Answer: {A}`,
      wrong:`Both work on the tank: 1/${a} + 1/${b} = ${a + b}/${a * b} per hour, so ${a * b} ÷ ${a + b} = ${nf(tr)} hours. Answer: {T}`,
      hints:['Is the leak helping the tap, or working against it?', 'Per hour: part filled minus part emptied. Then flip that fraction to get the time.'] }); } },
  { id:'platform', topic:'Aptitude', gen(){
    let v, s, L, P; do { v = pick([36, 54, 72, 90]); s = v * 5 / 18; L = ri(2, 8) * 50; P = ri(2, 10) * 50; } while (L % s || P % s || L === P);
    const t = (L + P) / s;
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' seconds', ans:t, trap:P / s, extra:[L / s, t + 5],
      q:`A train ${L} m long runs at ${v} km/h. How long does it take to fully cross a platform ${P} m long?`,
      right:`${v} km/h = ${v} × 5/18 = ${s} m/s. To clear the platform, the train covers its own length plus the platform: ${L} + ${P} = ${L + P} m. ${L + P} ÷ ${s} = ${t} s. Answer: {A}`,
      wrong:`${v} km/h = ${s} m/s. The platform is ${P} m, so ${P} ÷ ${s} = ${P / s} s. Answer: {T}`,
      hints:['When has the train fully crossed? Think about where its last coach is.', 'Distance = train length + platform length. Change km/h to m/s by × 5/18.'] }); } },
  { id:'catchup', topic:'Aptitude', gen(){
    let a, b, g; do { a = pick([30, 40, 50]); b = pick([50, 60, 70, 80]); g = pick([2, 3, 4, 5, 6, 10]); } while (b <= a || (60 * g) % (b - a) || (60 * g) % (a + b));
    const t = 60 * g / (b - a), tr = 60 * g / (a + b), [p, q] = two();
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' minutes', ans:t, trap:tr, extra:[t + 5, t * 2],
      q:`${p} is on a college bus that is ${g} km ahead, moving at ${a} km/h. ${q} follows on a bike at ${b} km/h on the same road. How many minutes does ${q} take to catch the bus?`,
      right:`They move the same way, so the gap closes at ${b} − ${a} = ${b - a} km/h. ${g} km ÷ ${b - a} km/h × 60 = ${t} minutes. Answer: {A}`,
      wrong:`The gap closes at ${a} + ${b} = ${a + b} km/h. ${g} km ÷ ${a + b} km/h × 60 = ${tr} minutes. Answer: {T}`,
      hints:['Both are moving the same way. How fast does the gap shrink?', 'Same direction: subtract the speeds. Time = gap ÷ that speed.'] }); } },
  { id:'ci2', topic:'Aptitude', gen(){
    let P, r; do { P = pick([1000, 2000, 4000, 5000, 8000, 10000, 20000]); r = pick([5, 10, 20]); } while ((P * r * r) % 10000);
    const y1 = P * r / 100, y2 = (P + y1) * r / 100, name = pick(NM);
    return mkQ({ id:this.id, topic:this.topic, fmt:rs, ans:y1 + y2, trap:2 * y1, extra:[y1, P + y1 + y2],
      q:`${name} keeps ₹${P} in a bank at ${r}% per year compound interest (interest is added every year). How much interest does ${name} earn in 2 years?`,
      right:`Year 1: ${r}% of ₹${P} = ₹${y1}. Year 2 is on ₹${P + y1}: ${r}% of it = ₹${y2}. Total interest ₹${y1 + y2}. Answer: {A}`,
      wrong:`${r}% of ₹${P} is ₹${y1} a year, so 2 years give ₹${2 * y1}. Answer: {T}`,
      hints:['In year 2, is the interest on ₹' + P + ' only?', 'Compound interest: year 2 interest is on the money plus year 1 interest.'] }); } },
  { id:'sitimes', topic:'Aptitude', gen(){
    const n = ri(3, 12), k = pick([4, 8]), a = (k - 1) * n, tr = (k === 4 ? 2 : 3) * n;
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' years', ans:a, trap:tr, extra:[k * n, k * n / 2, a + n], step:n,
      q:`At simple interest, a sum of money doubles in ${n} years. In how many years will it become ${k} times the sum?`,
      right:`Doubling in ${n} years means the interest for ${n} years equals the sum. To become ${k} times, the interest must be ${k - 1} times the sum: ${k - 1} × ${n} = ${a} years. Answer: {A}`,
      wrong: k === 4 ? `It doubles in ${n} years, then doubles again in ${n} more: 4 times after ${2 * n} years. Answer: {T}`
        : `2 times at ${n} years, 4 times at ${2 * n}, 8 times at ${3 * n}. Answer: {T}`,
      hints:['With simple interest, is interest earned on the interest?', 'Simple interest adds the same amount every year. How many extra sums do you need?'] }); } },
  { id:'agesum', topic:'Aptitude', gen(){
    const c = pick([3, 4, 5]), y = ri(3, 9), S = ri(c * 12, c * 25), [p, q, r] = shuffle(NM).slice(0, 3);
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' years', ans:S + c * y, trap:S + y, extra:[S + (c - 1) * y, S + (c + 1) * y],
      q: c === 3 ? `${p}, ${q} and ${r} are siblings. Their ages add up to ${S} years now. What will their ages add up to after ${y} years?`
        : `The ages of the ${c} people in ${p}’s family add up to ${S} years now. What will their ages add up to after ${y} years?`,
      right:`Each of the ${c} people gets ${y} years older, so the total grows by ${c} × ${y} = ${c * y}. ${S} + ${c * y} = ${S + c * y}. Answer: {A}`,
      wrong:`${y} years later the total is ${S} + ${y} = ${S + y}. Answer: {T}`,
      hints:['How many people get older?', 'Add the years once for each person.'] }); } },
  { id:'avgnew', topic:'Aptitude', gen(){
    let n, A, d, a; do { n = ri(8, 14); A = ri(50, 70); d = ri(1, 3); a = A + (n + 1) * d; } while (a > 100);
    const name = pick(NM), tr = A + n * d;
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + ' marks', ans:a, trap:tr, extra:[A + d, a + d],
      q:`The average marks of ${n} students in a class test is ${A}. ${name} joins late, takes the test, and the class average goes up to ${A + d}. How many marks did ${name} score?`,
      right:`New total = ${n + 1} × ${A + d} = ${(n + 1) * (A + d)}. Old total = ${n} × ${A} = ${n * A}. ${name} scored ${(n + 1) * (A + d)} − ${n * A} = ${a}. Answer: {A}`,
      wrong:`The average went up by ${d} for each of the ${n} students, so ${name} scored ${A} + ${n} × ${d} = ${tr}. Answer: {T}`,
      hints:['The new average includes the new student too. How many students are there now?', 'Find the total marks before and after. The difference is the new score.'] }); } },
  { id:'twoloss', topic:'Aptitude', gen(){
    let x, S; do { x = pick([10, 20, 25, 30, 40, 50]); S = ri(10, 600) * 100; } while ((S * 100) % (100 + x) || (S * 100) % (100 - x) || S > 60000);
    const c1 = S * 100 / (100 + x), c2 = S * 100 / (100 - x), L = c1 + c2 - 2 * S, l = x * x / 100, name = pick(NM);
    return mkQ({ id:this.id, topic:this.topic, ans:`${nf(l)}% loss`, trap:'No profit, no loss', extra:[`${nf(l)}% profit`, `${nf(2 * l)}% loss`, `${nf(l + 1)}% loss`],
      q:`${name} sells two used phones for ₹${S} each. One is sold at ${x}% profit and the other at ${x}% loss. What is the overall result?`,
      right:`Cost of the first: ${S} × 100 ÷ ${100 + x} = ₹${c1}. Cost of the second: ${S} × 100 ÷ ${100 - x} = ₹${c2}. Total cost ₹${c1 + c2}, total sale ₹${2 * S}. Loss ₹${L}, which is ${nf(l)}% of the cost. Answer: {A}`,
      wrong:`${x}% profit on one and ${x}% loss on the other cancel out. Answer: {T}`,
      hints:['Do the two phones have the same cost price?', 'Find each cost price from the selling price, then compare total cost with total sale.'] }); } },
  { id:'series2', topic:'Aptitude', gen(){
    const a = ri(1, 10), d = ri(1, 5), s = ri(1, 4), t = [a];
    for (let k = 0; k < 5; k++) t.push(t[k] + d + k * s);
    const gaps = [1, 2, 3, 4].map(k => t[k] - t[k - 1]);
    return mkQ({ id:this.id, topic:this.topic, ans:t[5], trap:t[4] + gaps[3], extra:[t[5] + s, t[5] + 2 * s],
      q:`What number comes next? ${t.slice(0, 5).join(', ')}, ?`,
      right:`The gaps are ${gaps.join(', ')}. Each gap is ${s} more than the one before, so the next gap is ${d + 4 * s}: ${t[4]} + ${d + 4 * s} = ${t[5]}. Answer: {A}`,
      wrong:`The last gap is ${gaps[3]}, so add it again: ${t[4]} + ${gaps[3]} = ${t[4] + gaps[3]}. Answer: {T}`,
      hints:['Write down the gaps between the numbers.', 'Do the gaps themselves follow a pattern?'] }); } },
  { id:'clock', topic:'Aptitude', gen(){
    let h, m, A, Tr; do { h = ri(1, 11); m = pick([10, 20, 40, 50]); A = Math.abs(30 * h - 5.5 * m); Tr = Math.abs(30 * h - 6 * m); } while (A > 180 || Tr > 180 || !A || !Tr);
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + '°', ans:A, trap:Tr, extra:[A + 10, 360 - A], step:5,
      q:`What is the smaller angle between the hour hand and the minute hand of a clock at ${h}:${m}?`,
      right:`Minute hand: ${m} × 6 = ${6 * m}°. Hour hand: ${h} × 30 + ${m} × 0.5 = ${30 * h + m / 2}°. Difference: ${A}°. Answer: {A}`,
      wrong:`The hour hand is on ${h}, which is ${30 * h}°. The minute hand is at ${6 * m}°. Difference: ${Tr}°. Answer: {T}`,
      hints:['Does the hour hand stay exactly on the hour while the minutes pass?', 'The hour hand moves 0.5° each minute. The minute hand moves 6° each minute.'] }); } },
  { id:'weekday', topic:'Aptitude', gen(){
    const d = ri(0, 6), n = ri(20, 200), A = DAYS[(d + n) % 7], T = DAYS[(d + n - 1) % 7];
    return mkQ({ id:this.id, topic:this.topic, ans:A, trap:T, extra:[DAYS[(d + n + 1) % 7], DAYS[(d + n + 2) % 7]],
      q:`Today is ${DAYS[d]}. Your hostel fee is due ${n} days from today. Which day of the week is that?`,
      right:`${n} = 7 × ${Math.floor(n / 7)} + ${n % 7}. Whole weeks land on ${DAYS[d]} again, then ${n % 7} more day${n % 7 === 1 ? '' : 's'} gives ${A}. Answer: {A}`,
      wrong:`Today counts as day 1, so I move ${n - 1} days ahead. ${n - 1} = 7 × ${Math.floor((n - 1) / 7)} + ${(n - 1) % 7}, which gives ${T}. Answer: {T}`,
      hints:['After exactly 7 days, which day is it?', 'Divide the days by 7. Count only the remainder forward from today.'] }); } },

  /* ---------- Python ---------- */
  { id:'negfloor', topic:'Python', gen(){
    let a, b; do { a = ri(5, 29); b = pick([2, 3, 4, 5]); } while (a % b === 0);
    const q = Math.floor(a / b);
    return mkQ({ id:this.id, topic:this.topic, ans:-(q + 1), trap:-q, extra:[q, q + 1],
      q:'What does this print?', code:`print(-${a} // ${b})`,
      right:`// always rounds down, to the smaller number. -${a} ÷ ${b} is between -${q + 1} and -${q}, so the result is -${q + 1}. Answer: {A}`,
      wrong:`${a} // ${b} is ${q}, so -${a} // ${b} is -${q}. Answer: {T}`,
      hints:['For a negative result, is rounding down the same as dropping the decimal?', 'Rounding down moves left on the number line: -2.5 becomes -3.'] }); } },
  { id:'negmod', topic:'Python', gen(){
    let a, b; do { a = ri(8, 30); b = ri(3, 7); } while (a % b === 0);
    const r = a % b;
    return mkQ({ id:this.id, topic:this.topic, ans:b - r, trap:-r, extra:[r - b, b],
      q:'What does this print?', code:`print(-${a} % ${b})`,
      right:`With a positive number on the right, % never gives a negative answer in Python. -${a} = ${b} × (-${Math.floor(a / b) + 1}) + ${b - r}. Answer: {A}`,
      wrong:`${a} % ${b} is ${r}, so -${a} % ${b} is -${r}. Answer: {T}`,
      hints:['Can % give a negative answer when the right side is positive?', `Find the multiple of ${b} just below -${a}, then measure the gap up to -${a}.`] }); } },
  { id:'setlen', topic:'Python', gen(){
    const k = ri(3, 5), base = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k), dup = shuffle(base).slice(0, ri(2, 3)), all = shuffle(base.concat(dup));
    return mkQ({ id:this.id, topic:this.topic, ans:k, trap:all.length, extra:[k - 1, all.length + 1],
      q:'What does this print?', code:`nums = {${all.join(', ')}}\nprint(len(nums))`,
      right:`A set keeps only one copy of each value. The different values are ${base.slice().sort((x, y) => x - y).join(', ')}: that is ${k}. Answer: {A}`,
      wrong:`There are ${all.length} values inside the braces. Answer: {T}`,
      hints:['What happens to repeated values in a set?', 'Cross out each repeat, then count.'] }); } },
  { id:'slicestep', topic:'Python', gen(){
    let w, k, A, T; do { w = pick(['python','binary','coding','laptop','hostel','cricket','chennai','canteen','browser','monitor']); k = pick([2, 3]);
      A = [...w].filter((c, i) => i >= 1 && (i - 1) % k === 0).join(''); T = [...w].filter((c, i) => i % k === 0).join(''); } while (A === T);
    return mkQ({ id:this.id, topic:this.topic, ans:A, trap:T, extra:[w.slice(1, 1 + A.length), [...A].reverse().join(''), w.slice(0, A.length)],
      q:'What does this print?', code:`word = "${w}"\nprint(word[1::${k}])`,
      right:`word[1::${k}] starts at index 1 (the second letter, ${w[1]}) and takes every ${k === 2 ? '2nd' : '3rd'} letter: ${A}. Answer: {A}`,
      wrong:`It starts at the first letter, ${w[0]}, and takes every ${k === 2 ? '2nd' : '3rd'} letter: ${T}. Answer: {T}`,
      hints:['Which letter is at index 1?', 'Indexes start at 0. Start at index 1, then jump by the step.'] }); } },
  { id:'countover', topic:'Python', gen(){
    const c = pick(['a','x','o','z']), n = ri(4, 7);
    return mkQ({ id:this.id, topic:this.topic, ans:Math.floor(n / 2), trap:n - 1, extra:[n, Math.ceil(n / 2) + 1],
      q:'What does this print?', code:`print("${c.repeat(n)}".count("${c}${c}"))`,
      right:`count() only counts matches that do not overlap. Each match uses up 2 letters, so ${n} letters give ${Math.floor(n / 2)}. Answer: {A}`,
      wrong:`"${c}${c}" starts at positions 0 to ${n - 2}, so there are ${n - 1} matches. Answer: {T}`,
      hints:['Can two matches found by count() share a letter?', 'Cut the text into pieces of 2 from the left and count the full pieces.'] }); } },
  { id:'splitempty', topic:'Python', gen(){
    const n = ri(3, 4), it = shuffle(['idli','dosa','vada','poha','tea','coffee','samosa','upma']).slice(0, n), way = ri(0, 2);
    const s = way === 2 ? it.join(',') + ',' : way === 1 ? it[0] + ',,' + it.slice(1).join(',') : it.slice(0, -1).join(',') + ',,' + it[n - 1];
    return mkQ({ id:this.id, topic:this.topic, ans:n + 1, trap:n, extra:[n - 1, n + 2],
      q:'What does this print?', code:`menu = "${s}"\nparts = menu.split(",")\nprint(len(parts))`,
      right:`split(",") cuts at every comma. ${n} commas make ${n + 1} pieces, and one of them is the empty string "". Answer: {A}`,
      wrong:`There are ${n} food items, so there are ${n} parts. Answer: {T}`,
      hints:['What is between two commas next to each other, or after the last comma?', 'Count the commas. split gives one more piece than the number of commas.'] }); } },
  { id:'strcmp', topic:'Python', gen(){
    let a, b; do { a = ri(10, 89); b = ri(2, 9); } while (Math.floor(a / 10) >= b);
    const op = pick(['<', '>']), A = op === '<' ? 'True' : 'False', T = op === '<' ? 'False' : 'True';
    return mkQ({ id:this.id, topic:this.topic, ans:A, trap:T, extra:['TypeError', 'None'],
      q:'What does this print?', code:`print("${a}" ${op} "${b}")`,
      right:`These are strings, so Python compares them character by character, like a dictionary. "${String(a)[0]}" comes before "${b}", so "${a}" is the smaller string. Answer: {A}`,
      wrong:`${a} is bigger than ${b}, so "${a}" ${op} "${b}" is ${T}. Answer: {T}`,
      hints:['Look at the quotes. Are these numbers or strings?', 'Strings are compared one character at a time, from the left.'] }); } },
  { id:'inttrunc', topic:'Python', gen(){
    const i = ri(2, 98), d = ri(5, 9);
    return mkQ({ id:this.id, topic:this.topic, ans:i, trap:i + 1, extra:[`${i}.${d}`, i - 1],
      q:'What does this print?', code:`marks = ${i}.${d}\nprint(int(marks))`,
      right:`int() just cuts off the decimal part. It does not round. int(${i}.${d}) is ${i}. Answer: {A}`,
      wrong:`${i}.${d} is closer to ${i + 1}, so int() gives ${i + 1}. Answer: {T}`,
      hints:['Does int() round, or chop?', 'int() drops everything after the decimal point. round() is the one that rounds.'] }); } },
  { id:'andor', topic:'Python', gen(){
    if (Math.random() < 0.5) {
      const b = ri(2, 9);
      return mkQ({ id:this.id, topic:this.topic, ans:String(b), trap:'True', extra:['False', '0'],
        q:'What does this print?', code:`print(0 or ${b})`,
        right:`or gives back the first value that is truthy. 0 is falsy, so it moves on and gives ${b}. Answer: {A}`,
        wrong:`0 or ${b} is a True/False test, and ${b} is true, so it prints True. Answer: {T}`,
        hints:['Do and / or always give True or False in Python?', 'They give back one of the two values themselves.'] });
    }
    let a, b; do { a = ri(2, 9); b = ri(2, 9); } while (a === b);
    return mkQ({ id:this.id, topic:this.topic, ans:String(b), trap:'True', extra:['False', String(a)],
      q:'What does this print?', code:`print(${a} and ${b})`,
      right:`and gives back the first falsy value, or the last value if all are truthy. ${a} is truthy, so it gives ${b}. Answer: {A}`,
      wrong:`Both ${a} and ${b} are true, so ${a} and ${b} is True. Answer: {T}`,
      hints:['Do and / or always give True or False in Python?', 'They give back one of the two values themselves.'] }); } },
  { id:'augmul', topic:'Python', gen(){
    const a = ri(2, 6), b = ri(2, 5), c = ri(1, 4);
    return mkQ({ id:this.id, topic:this.topic, ans:a * (b + c), trap:a * b + c, extra:[a + b + c, a * b * c],
      q:'What does this print?', code:`x = ${a}\nx *= ${b} + ${c}\nprint(x)`,
      right:`x *= ${b} + ${c} means x = x * (${b} + ${c}). The right side is worked out first: ${a} × ${b + c} = ${a * (b + c)}. Answer: {A}`,
      wrong:`x *= ${b} makes ${a * b}, then + ${c} gives ${a * b + c}. Answer: {T}`,
      hints:['In x *= something, what is worked out first?', 'x *= b + c is the same as x = x * (b + c).'] }); } },
  { id:'tupleone', topic:'Python', gen(){
    const n = ri(2, 9), k = ri(2, 3);
    return mkQ({ id:this.id, topic:this.topic, ans:n * k, trap:'(' + Array(k).fill(n).join(', ') + ')', extra:['TypeError', `(${n * k},)`],
      q:'What does this print?', code:`t = (${n})\nprint(t * ${k})`,
      right:`Brackets around one value do nothing, so t is just the number ${n}. (A one-item tuple needs a comma: (${n},).) ${n} × ${k} = ${n * k}. Answer: {A}`,
      wrong:`t is a tuple, and * ${k} repeats it ${k} times. Answer: {T}`,
      hints:['Is (5) a tuple or a number?', 'A tuple with one item needs a comma after the item.'] }); } },
  { id:'removeone', topic:'Python', gen(){
    let v, a; do { v = ri(1, 9); a = shuffle([v, v].concat(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== v)).slice(0, 3))); } while (Math.abs(a.indexOf(v) - a.lastIndexOf(v)) < 2);
    const first = a.slice(), last = a.slice(); first.splice(a.indexOf(v), 1); last.splice(a.lastIndexOf(v), 1);
    return mkQ({ id:this.id, topic:this.topic, ans:pl(first), trap:pl(a.filter(x => x !== v)), extra:[pl(last), pl(a)],
      q:'What does this print?', code:`a = ${pl(a)}\na.remove(${v})\nprint(a)`,
      right:`remove() deletes only the FIRST ${v} it finds. The second ${v} stays: ${pl(first)}. Answer: {A}`,
      wrong:`remove(${v}) takes every ${v} out of the list. Answer: {T}`,
      hints:['How many items does remove() delete?', 'remove(x) deletes the first match only, searching from the left.'] }); } },
  { id:'noreturn', topic:'Python', gen(){
    const [f, op, k] = pick([['double', '*', 2], ['triple', '*', 3], ['add_tip', '+', 10]]), n = ri(3, 15), v = op === '*' ? n * k : n + k;
    return mkQ({ id:this.id, topic:this.topic, ans:'None', trap:String(v), extra:['Error', String(n)],
      q:'What does this print?', code:`def ${f}(x):\n    x ${op} ${k}\n\nprint(${f}(${n}))`,
      right:`The function works out x ${op} ${k} but never returns it. A function with no return gives back None. Answer: {A}`,
      wrong:`${f}(${n}) is ${n} ${op === '*' ? '×' : '+'} ${k} = ${v}. Answer: {T}`,
      hints:['What does the function send back to print()?', 'Without a return line, a function returns None.'] }); } },
  { id:'localx', topic:'Python', gen(){
    const a = ri(1, 9), b = ri(10, 99);
    return mkQ({ id:this.id, topic:this.topic, ans:a, trap:b, extra:[a + b, 'None'],
      q:'What does this print?', code:`x = ${a}\n\ndef change():\n    x = ${b}\n\nchange()\nprint(x)`,
      right:`x = ${b} inside the function makes a new local x. The x outside is not touched, so it is still ${a}. Answer: {A}`,
      wrong:`change() sets x to ${b}, so it prints ${b}. Answer: {T}`,
      hints:['Is the x inside the function the same as the x outside?', 'Giving x a value inside a function makes a new local variable.'] }); } },
  { id:'dictin', topic:'Python', gen(){
    const [p, q] = two(); let m1, m2; do { m1 = ri(40, 99); m2 = ri(40, 99); } while (m1 === m2);
    return mkQ({ id:this.id, topic:this.topic, ans:'False', trap:'True', extra:['KeyError', 'None'],
      q:'What does this print?', code:`marks = {"${p}": ${m1}, "${q}": ${m2}}\nprint(${m1} in marks)`,
      right:`in on a dictionary checks the keys, not the values. The keys are "${p}" and "${q}", so ${m1} in marks is False. Answer: {A}`,
      wrong:`${m1} is in the dictionary (it is ${p}’s marks), so it is True. Answer: {T}`,
      hints:['When you use in with a dictionary, what does it look at?', 'in looks at the keys only. Which are the keys here?'] }); } },

  /* ---------- number systems ---------- */
  { id:'oct2bin', topic:'Number systems', gen(){
    const d1 = ri(1, 7), d2 = ri(0, 7), n = d1 * 8 + d2, A = n.toString(2), T = (d1 * 10 + d2).toString(2);
    return mkQ({ id:this.id, topic:this.topic, ans:A, trap:T, extra:[d1.toString(2) + d2.toString(2), (n + 1).toString(2), (n - 1).toString(2)],
      q:`What is the octal number ${d1}${d2} in binary?`,
      right:`Each octal digit is exactly 3 bits. ${d1} = ${d1.toString(2).padStart(3, '0')} and ${d2} = ${d2.toString(2).padStart(3, '0')}. Joined, without the leading zeros: ${A}. Answer: {A}`,
      wrong:`Divide ${d1}${d2} by 2 again and again and read the remainders: ${T}. Answer: {T}`,
      hints:[`Is ${d1}${d2} here the same as the decimal number ${d1}${d2}?`, 'Change each octal digit into 3 bits, then join them.'] }); } },
  { id:'bin2hex', topic:'Number systems', gen(){
    let n, b, T; do { n = ri(33, 127); b = n.toString(2); T = (HX(parseInt(b.slice(0, 4), 2)) + HX(parseInt(b.slice(4), 2))); } while (T === HX(n));
    const p = b.padStart(8, '0');
    return mkQ({ id:this.id, topic:this.topic, ans:HX(n), trap:T, extra:[HX(n + 1), HX(n - 1), [...HX(n)].reverse().join('')],
      q:`What is the binary number ${b} in hexadecimal?`,
      right:`Group the bits in 4s from the RIGHT, adding zeros on the left: ${p.slice(0, 4)} ${p.slice(4)} = ${HX(parseInt(p.slice(0, 4), 2))} and ${HX(parseInt(p.slice(4), 2))}. Answer: {A}`,
      wrong:`Group in 4s from the left: ${b.slice(0, 4)} ${b.slice(4)} = ${T[0]} and ${T.slice(1)}. Answer: {T}`,
      hints:['Which end should the groups of 4 start from?', 'Start grouping at the 1s place (the right end). Pad the left group with zeros.'] }); } },
  { id:'bitsmax', topic:'Number systems', gen(){
    const n = ri(4, 10);
    return mkQ({ id:this.id, topic:this.topic, ans:2 ** n - 1, trap:2 ** n, extra:[2 ** (n - 1), 2 ** (n - 1) - 1],
      q:`A sensor stores each reading as a ${n}-bit number (0 and positive only). What is the largest reading it can store?`,
      right:`The largest is ${n} ones in binary: 2^${n} − 1 = ${2 ** n - 1}. There are ${2 ** n} values, but they start at 0. Answer: {A}`,
      wrong:`${n} bits can hold 2^${n} = ${2 ** n}. Answer: {T}`,
      hints:['The smallest value is 0. If there are 2^n values, what is the last one?', 'Write the largest number as all ones in binary.'] }); } },
  { id:'binadd', topic:'Number systems', gen(){
    let a, b; do { a = ri(5, 15); b = ri(3, 15); } while (!(a & b) || a === b);
    return mkQ({ id:this.id, topic:this.topic, ans:(a + b).toString(2), trap:b4(a ^ b), extra:[(a + b + 1).toString(2), (a + b - 1).toString(2), b4(a | b)],
      q:`Add these two binary numbers: ${b4(a)} + ${b4(b)}. What is the sum in binary?`,
      right:`Column by column, 1 + 1 = 10: write 0 and carry 1. Check in decimal: ${a} + ${b} = ${a + b}, which is ${(a + b).toString(2)}. Answer: {A}`,
      wrong:`Add each column: 0 + 0 = 0, 1 + 0 = 1, 1 + 1 = 0. That gives ${b4(a ^ b)}. Answer: {T}`,
      hints:['What happens to the 1 when you add 1 + 1 in binary?', '1 + 1 = 10 in binary: write 0, carry 1 to the next column.'] }); } },
  { id:'dec2hex', topic:'Number systems', gen(){
    const hi = ri(1, 9), lo = ri(10, 15), n = hi * 16 + lo;
    return mkQ({ id:this.id, topic:this.topic, ans:HX(n), trap:`${hi}${lo}`, extra:[HX(lo) + hi, HX(n + 16), HX(n - 16)],
      q:`What is ${n} in hexadecimal?`,
      right:`${n} ÷ 16 = ${hi} remainder ${lo}. In hex, ${lo} is the single digit ${HX(lo)}. So ${n} = ${HX(n)}. Answer: {A}`,
      wrong:`${n} ÷ 16 = ${hi} remainder ${lo}. Write them side by side: ${hi}${lo}. Answer: {T}`,
      hints:['Can one hex place hold the number ' + lo + ' as two digits?', 'Remainders 10 to 15 are written as A to F.'] }); } },
  { id:'pybin', topic:'Number systems', gen(){
    const n = ri(5, 40), b = n.toString(2);
    return mkQ({ id:this.id, topic:this.topic, ans:'0b' + b, trap:b, extra:['0b' + (n + 1).toString(2), '0b' + (n - 1).toString(2)],
      q:'What does this print?', code:`print(bin(${n}))`,
      right:`bin() gives a string that starts with 0b, which marks it as binary: 0b${b}. Answer: {A}`,
      wrong:`${n} in binary is ${b}. Answer: {T}`,
      hints:['Does bin() give just the digits, or something more?', 'Python marks binary text with a two-character prefix.'] }); } },
  { id:'intbase2', topic:'Number systems', gen(){
    const n = ri(5, 31), b = n.toString(2);
    return mkQ({ id:this.id, topic:this.topic, ans:n, trap:Number(b), extra:[n + 1, n * 2],
      q:'What does this print?', code:`print(int("${b}", 2))`,
      right:`The 2 tells int() that the text is in base 2 (binary). ${b} in binary = ${n}. Answer: {A}`,
      wrong:`int() turns the text "${b}" into the number ${b}. Answer: {T}`,
      hints:['What does the second value, 2, tell int()?', 'Read the text as a binary number.'] }); } },
  { id:'hexsum', topic:'Number systems', gen(){
    let a, b; do { a = ri(7, 15); b = ri(7, 15); } while (a + b < 16 || a + b > 25);
    const s = a + b;
    return mkQ({ id:this.id, topic:this.topic, ans:'0x' + s.toString(16), trap:'0x' + s, extra:[String(s), '0x' + (s + 1).toString(16)],
      q:'What does this print?', code:`print(hex(${a} + ${b}))`,
      right:`${a} + ${b} = ${s}. hex() writes it in base 16: ${s} = 1 × 16 + ${s - 16}, so 0x${s.toString(16)}. Answer: {A}`,
      wrong:`${a} + ${b} = ${s}, and hex() puts 0x in front: 0x${s}. Answer: {T}`,
      hints:['Does hex() only add a prefix, or does it change the digits too?', 'Write the sum in base 16: how many 16s, and what is left?'] }); } },

  /* ---------- bitwise ---------- */
  { id:'xorpow', topic:'Bitwise', gen(){
    let a, b; do { a = ri(2, 6); b = ri(2, 3); } while (a === b || (a ^ b) === a ** b);
    return mkQ({ id:this.id, topic:this.topic, ans:a ^ b, trap:a ** b, extra:[a | b, a * b],
      q:'What does this print?', code:`print(${a} ^ ${b})`,
      right:`In Python, ^ is XOR, not power. ${a} = ${b4(a)}, ${b} = ${b4(b)}. XOR gives 1 where the bits differ: ${b4(a ^ b)} = ${a ^ b}. Answer: {A}`,
      wrong:`${a} ^ ${b} means ${a} to the power ${b} = ${a ** b}. Answer: {T}`,
      hints:['Which is the power operator in Python: ^ or **?', '^ compares bits: 1 where they differ, 0 where they match.'] }); } },
  { id:'bitnot', topic:'Bitwise', gen(){
    const n = ri(3, 14);
    return mkQ({ id:this.id, topic:this.topic, ans:-(n + 1), trap:-n, extra:[15 - n, n + 1],
      q:'What does this print?', code:`print(~${n})`,
      right:`~ flips every bit. For Python whole numbers, ~n is always -(n + 1), so ~${n} = ${-(n + 1)}. Answer: {A}`,
      wrong:`~ makes the number negative: ${-n}. Answer: {T}`,
      hints:['~ is not the minus sign. What does it do to the bits?', 'In Python, ~x equals -x - 1.'] }); } },
  { id:'mask7', topic:'Bitwise', gen(){
    let n; do { n = ri(9, 60); } while (n % 8 === n % 7 || n % 8 === 0);
    return mkQ({ id:this.id, topic:this.topic, ans:n & 7, trap:n % 7, extra:[n >> 3, 7, n % 8 + 1, 6],
      q:'What does this print?', code:`print(${n} & 7)`,
      right:`7 is 111 in binary, so & 7 keeps only the last 3 bits of ${n} (${n.toString(2)}): ${(n & 7).toString(2).padStart(3, '0')} = ${n & 7}. That is the remainder when you divide by 8. Answer: {A}`,
      wrong:`& 7 works like % 7: ${n} % 7 = ${n % 7}. Answer: {T}`,
      hints:['Write 7 in binary. Which bits of the number survive the &?', 'x & 7 keeps the last 3 bits, which is the same as x % 8.'] }); } },
  { id:'shiftprec', topic:'Bitwise', gen(){
    const a = ri(1, 6), b = ri(1, 6), k = ri(1, 3);
    return mkQ({ id:this.id, topic:this.topic, ans:(a + b) << k, trap:a + (b << k), extra:[(a + b) * k, ((a + b) << k) + 2],
      q:'What does this print?', code:`print(${a} + ${b} << ${k})`,
      right:`+ is done before <<. So it is (${a} + ${b}) << ${k} = ${a + b} × ${2 ** k} = ${(a + b) << k}. Answer: {A}`,
      wrong:`${b} << ${k} = ${b << k}, then ${a} + ${b << k} = ${a + (b << k)}. Answer: {T}`,
      hints:['Which comes first in Python: + or <<?', 'Shifts have lower priority than + and -. Add first, then shift.'] }); } },

  /* ---------- CSS and Git ---------- */
  { id:'gridfr', topic:'CSS', gen(){
    let W, F, a, b, A, T; do { W = pick([600, 800, 900, 1000, 1200]); F = pick([100, 150, 200, 300]); [a, b] = pick([[1,2],[1,3],[2,3],[2,1],[3,1],[3,2]]);
      A = (W - F) * b / (a + b); T = W * b / (a + b); } while (!Number.isInteger(A) || !Number.isInteger(T));
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + 'px', ans:A, trap:T, extra:[(W - F) * a / (a + b), (W - F) / (a + b)], step:10,
      q:'The grid has no gap, padding or border. How wide is the last column?', code:`.row {\n  display: grid;\n  width: ${W}px;\n  grid-template-columns: ${F}px ${a}fr ${b}fr;\n}`,
      right:`The ${F}px column is taken first. That leaves ${W} − ${F} = ${W - F}px for ${a + b} shares. Each share is ${(W - F) / (a + b)}px, so ${b}fr = ${A}px. Answer: {A}`,
      wrong:`${b}fr is ${b} of the ${a + b} shares of ${W}px: ${T}px. Answer: {T}`,
      hints:['Does fr share the whole width, or only what is left?', 'Take away the fixed px column first, then split the rest by the fr numbers.'] }); } },
  { id:'boxwidth', topic:'CSS', gen(){
    const w = pick([200, 240, 250, 300, 320]), p = pick([8, 10, 12, 16, 20]), bd = pick([1, 2, 3, 4, 5]), m = pick([10, 15, 20]);
    return mkQ({ id:this.id, topic:this.topic, fmt:x => nf(x) + 'px', ans:w + 2 * p + 2 * bd, trap:w, extra:[w + p + bd, w + 2 * p + 2 * bd + 2 * m],
      q:'box-sizing is not set, so it is content-box. How wide is the card on screen, from its left border to its right border?', code:`.card {\n  width: ${w}px;\n  padding: ${p}px;\n  border: ${bd}px solid black;\n  margin: ${m}px;\n}`,
      right:`With content-box, width is only the content. Padding and border are added on both sides: ${w} + 2 × ${p} + 2 × ${bd} = ${w + 2 * p + 2 * bd}px. Margin is outside the border. Answer: {A}`,
      wrong:`The width is set to ${w}px, so the card is ${w}px wide. Answer: {T}`,
      hints:['With content-box, what does width measure?', 'Add the padding and border on the left AND the right.'] }); } },
  { id:'gitbranchlog', topic:'Git', gen(){
    const m = ri(3, 12), k = ri(2, 6), name = pick(NM);
    return mkQ({ id:this.id, topic:this.topic, fmt:x => x + ' commits', ans:m + k, trap:k, extra:[m, m + k + 1],
      q:`${name}’s main branch has ${m} commits. ${name} runs git checkout -b feature, then makes ${k} new commits. How many commits does git log show on feature?`,
      right:`A new branch starts from the commit you were on, so it has all ${m} commits of main. Add the ${k} new ones: ${m + k}. Answer: {A}`,
      wrong:`feature is a new branch, so it only has the ${k} commits made on it. Answer: {T}`,
      hints:['When you make a branch, does it start empty?', 'git log shows every commit that leads to where you are now.'] }); } }
];
})();

/* fixed concept questions: exactly one correct option (ans), trap = the tempting wrong one */
(window.MORE = window.MORE || {}).aiqfixed = [
  /* Git */
  { topic:'Git', q:'You edited two files. Which command puts them in the staging area, ready for the next commit?', opts:['git add','git commit','git push','git save'], ans:0, trap:1,
    right:'git add stages the changes. git commit then saves what is staged. Answer: git add', wrong:'git commit takes your changed files and gets them ready. Answer: git commit', hints:['There are two steps: get ready, then save.', 'Which command comes before git commit?'] },
  { topic:'Git', q:'You made commits on your laptop. Which command sends them to GitHub?', opts:['git push','git commit','git pull','git fetch'], ans:0, trap:1,
    right:'git commit saves only on your laptop. git push sends the commits to GitHub. Answer: git push', wrong:'git commit saves your work to GitHub. Answer: git commit', hints:['Does a commit leave your laptop?', 'One command uploads, one downloads.'] },
  { topic:'Git', q:'Which command makes a new branch called feature and moves you onto it in one step?', opts:['git checkout -b feature','git branch feature','git merge feature','git switch feature'], ans:0, trap:1,
    right:'git checkout -b makes the branch and switches to it. git branch only makes it. Answer: git checkout -b feature', wrong:'git branch feature makes the branch and takes you there. Answer: git branch feature', hints:['After git branch feature, which branch are you on?', 'The -b flag means “make it first”.'] },
  { topic:'Git', q:'Which file tells Git which files to leave out, such as a .env file with passwords?', opts:['.gitignore','.gitkeep','README.md','.github'], ans:0, trap:1,
    right:'.gitignore lists files and folders that Git should not track. Answer: .gitignore', wrong:'.gitkeep tells Git which files to keep out. Answer: .gitkeep', hints:['The file name says what Git should do with them.', 'Git should ignore these files.'] },
  { topic:'Git', q:'You run git init inside a folder. What does it create?', opts:['A hidden .git folder','A new repo on GitHub','A first commit','A README file'], ans:0, trap:1,
    right:'git init makes a hidden .git folder that stores the history. Nothing is sent to GitHub. Answer: A hidden .git folder', wrong:'git init sets up the repository on GitHub. Answer: A new repo on GitHub', hints:['Does git init need the internet?', 'Everything Git tracks lives in one hidden folder.'] },
  { topic:'Git', q:'Your git push is rejected because a teammate pushed new commits to the same branch. What should you run first?', opts:['git pull','git push --force','git init','git clone'], ans:0, trap:1,
    right:'Pull your teammate’s commits, fix any conflicts, then push again. Answer: git pull', wrong:'Force the push so your version goes through. Answer: git push --force', hints:['What happens to your teammate’s commits if you force it?', 'Get their commits onto your laptop first.'] },
  { topic:'Git', q:'When does a merge conflict happen?', opts:['Both branches changed the same lines differently','Both branches changed the same file','You made two commits in a row','The two branches have different names'], ans:0, trap:1,
    right:'Git can join changes to different lines of one file. It stops only when the same lines were changed in different ways. Answer: Both branches changed the same lines differently', wrong:'If both branches touch the same file, Git cannot join them. Answer: Both branches changed the same file', hints:['Can Git join two edits to different parts of one file?', 'Git needs a human only when it cannot choose between two versions of the same lines.'] },
  { topic:'Git', q:'In git push origin main, what is origin?', opts:['The name of the remote repository','The name of your branch','The ID of the first commit','Your GitHub username'], ans:0, trap:1,
    right:'origin is the usual name for the remote repository you cloned from. main is the branch. Answer: The name of the remote repository', wrong:'origin is the branch you are pushing. Answer: The name of your branch', hints:['There are two names in the command. Which one is the branch?', 'origin points to where the code goes.'] },
  { topic:'Git', q:'You are on main and want to bring in the work from the feature branch. Which command do you run?', opts:['git merge feature','git checkout feature','git branch feature','git push feature'], ans:0, trap:1,
    right:'git merge feature joins feature’s commits into the branch you are on. Answer: git merge feature', wrong:'git checkout feature brings feature’s work into main. Answer: git checkout feature', hints:['Do you want to move to feature, or join it into main?', 'Joining two branches has its own command.'] },
  /* CSS: Flexbox, Grid, Tailwind */
  { topic:'CSS', q:'Flex items squeeze onto one line and overflow. Which property lets them move to a new line?', opts:['flex-wrap: wrap','flex-direction: column','display: block','align-content: wrap'], ans:0, trap:1,
    right:'flex-wrap: wrap lets items move to the next line when there is no space. Answer: flex-wrap: wrap', wrong:'flex-direction: column puts items on new lines. Answer: flex-direction: column', hints:['You want rows that wrap, not one tall column.', 'The property name has the word “wrap”.'] },
  { topic:'CSS', q:'Which property adds space only between flex or grid items, not at the outer edges?', opts:['gap','margin','padding','border-spacing'], ans:0, trap:1,
    right:'gap puts space only between items. Margin also adds space at the outer edges. Answer: gap', wrong:'margin on each item adds the space between them. Answer: margin', hints:['Margin goes around every side of an item.', 'Flex and Grid have one property just for the space between items.'] },
  { topic:'CSS', q:'Which property lets a flex item grow to fill the leftover space on its row?', opts:['flex-grow: 1','align-self: stretch','flex-shrink: 1','flex-basis: 0'], ans:0, trap:1,
    right:'flex-grow: 1 lets the item take the free space along the main axis. Answer: flex-grow: 1', wrong:'align-self: stretch makes the item fill the space. Answer: align-self: stretch', hints:['Stretch works across the row. You want to fill along it.', 'The property name says the item gets bigger.'] },
  { topic:'CSS', q:'Which selector picks every element with class="card"?', opts:['.card','#card','card','*card'], ans:0, trap:1,
    right:'A dot selects by class. # selects by id. Answer: .card', wrong:'# selects the card class. Answer: #card', hints:['One symbol is for class, one is for id.', 'Class uses a dot.'] },
  { topic:'CSS', q:'An id rule and a class rule both set the colour of the same element. Which one wins?', opts:['The id rule','Whichever is written last','The class rule','Neither, the colours mix'], ans:0, trap:1,
    right:'An id selector is more specific than a class selector, so it wins wherever it is written. Answer: The id rule', wrong:'In CSS the later rule always wins. Answer: Whichever is written last', hints:['Order matters only when two rules are equally specific.', 'Which is more specific: an id or a class?'] },
  { topic:'CSS', q:'With box-sizing: border-box, what does width include?', opts:['Content, padding and border','Content only','Content, padding, border and margin','Content and margin'], ans:0, trap:2,
    right:'border-box counts content, padding and border in width. Margin is always outside. Answer: Content, padding and border', wrong:'border-box means width covers the whole box, margin too. Answer: Content, padding, border and margin', hints:['The name says where the box ends.', 'Margin is outside the border.'] },
  { topic:'CSS', q:'In Tailwind, what does the class p-4 give?', opts:['1rem (16px) padding','4px padding','1rem (16px) margin','4rem padding'], ans:0, trap:1,
    right:'One Tailwind spacing step is 0.25rem, so 4 steps = 1rem = 16px of padding. Answer: 1rem (16px) padding', wrong:'p-4 is 4 pixels of padding. Answer: 4px padding', hints:['Tailwind numbers are steps, not pixels.', 'Each step is 0.25rem.'] },
  { topic:'CSS', q:'Which Tailwind class makes text bold?', opts:['font-bold','text-bold','bold','font-weight-bold'], ans:0, trap:1,
    right:'Font weight classes start with font-, like font-bold. Answer: font-bold', wrong:'Text styles start with text-, so it is text-bold. Answer: text-bold', hints:['text- is for size and colour in Tailwind.', 'Boldness is the font weight.'] },
  { topic:'CSS', q:'What does the Tailwind class md:flex mean?', opts:['Flex from medium screens and wider','Flex on medium screens only','Flex on small screens only','Flex with a medium gap'], ans:0, trap:1,
    right:'Tailwind is mobile first: md: applies from the medium size and up. Answer: Flex from medium screens and wider', wrong:'md: means only medium screens. Answer: Flex on medium screens only', hints:['Does md: stop at large screens?', 'Tailwind prefixes mean “this size and up”.'] },
  { topic:'CSS', q:'Which Tailwind classes centre a child both across and down inside a box?', opts:['flex items-center justify-center','flex items-center','flex text-center','flex justify-center'], ans:0, trap:1,
    right:'items-center centres on the cross axis and justify-center on the main axis. You need both. Answer: flex items-center justify-center', wrong:'items-center already centres the child. Answer: flex items-center', hints:['A flex box has two axes.', 'One class for each axis.'] },
  { topic:'CSS', q:'A grid item has grid-column: 1 / 3. How many columns does it cover?', opts:['2','3','1','4'], ans:0, trap:1,
    right:'1 / 3 means from line 1 to line 3. Between those lines are 2 columns. Answer: 2', wrong:'It runs to 3, so it covers 3 columns. Answer: 3', hints:['The numbers are grid lines, not columns.', 'Count the gaps between line 1 and line 3.'] },
  { topic:'CSS', q:'Which CSS unit is based on the font size of the root <html> element?', opts:['rem','em','px','%'], ans:0, trap:1,
    right:'rem means “root em”: it uses the html font size. em uses the parent’s font size. Answer: rem', wrong:'em is based on the main page font size. Answer: em', hints:['One of the units has an extra r in its name.', 'The r stands for root.'] },
  { topic:'CSS', q:'What does justify-content: space-between do in a flex row?', opts:['Ends touch the edges, equal gaps between','Equal space around every item','All items packed at the centre','Items stretch to fill the row'], ans:0, trap:1,
    right:'space-between puts the first and last items at the edges and shares the rest between items. Answer: Ends touch the edges, equal gaps between', wrong:'space-between puts equal space around every item. Answer: Equal space around every item', hints:['That other one is space-around.', 'With space-between, is there space before the first item?'] },
  /* HTML */
  { topic:'HTML', q:'Which tag shows the biggest heading by default?', opts:['<h1>','<h6>','<head>','<header>'], ans:0, trap:1,
    right:'h1 is the biggest and most important heading. h6 is the smallest. Answer: <h1>', wrong:'h6 is the biggest because 6 is the highest number. Answer: <h6>', hints:['The number is the level of importance.', 'Level 1 is the top level.'] },
  { topic:'HTML', q:'Which tag makes a numbered list?', opts:['<ol>','<ul>','<li>','<dl>'], ans:0, trap:1,
    right:'ol is an ordered list, which shows numbers. ul shows bullets. Answer: <ol>', wrong:'ul makes the list with numbers. Answer: <ul>', hints:['o and u stand for two words.', 'Ordered or unordered?'] },
  { topic:'HTML', q:'Where does the text inside the <title> tag appear?', opts:['In the browser tab','As the top heading on the page','In the page footer','Nowhere, it is a comment'], ans:0, trap:1,
    right:'title sits in the head and shows in the browser tab and in search results. Answer: In the browser tab', wrong:'title is the main heading at the top of the page. Answer: As the top heading on the page', hints:['title lives inside <head>, not <body>.', 'Look above the page, not on it.'] },
  { topic:'HTML', q:'Which input type hides the characters as you type them?', opts:['type="password"','type="hidden"','type="text"','type="secret"'], ans:0, trap:1,
    right:'type="password" shows dots instead of letters. type="hidden" is not shown at all. Answer: type="password"', wrong:'type="hidden" hides what you type. Answer: type="hidden"', hints:['A hidden input cannot be typed into at all.', 'Think of the login box.'] },
  { topic:'HTML', q:'Which tag holds page information such as the title and links to CSS files?', opts:['<head>','<header>','<body>','<footer>'], ans:0, trap:1,
    right:'head holds information about the page. header is a visible top section inside the body. Answer: <head>', wrong:'header holds the title and CSS links. Answer: <header>', hints:['One of them is shown on the page and one is not.', 'This tag comes before <body>.'] },
  { topic:'HTML', q:'Which attribute connects a <label> to an input that has id="email"?', opts:['for="email"','name="email"','id="email"','href="email"'], ans:0, trap:1,
    right:'A label’s for attribute must match the input’s id. Answer: for="email"', wrong:'name="email" connects the label to the input. Answer: name="email"', hints:['name is used when the form is sent.', 'The label says which input it is for.'] },
  /* Command line */
  { topic:'Command line', q:'Which command moves you into a folder called project?', opts:['cd project','ls project','mkdir project','pwd project'], ans:0, trap:1,
    right:'cd means change directory. ls only lists what is inside. Answer: cd project', wrong:'ls project takes you into the folder. Answer: ls project', hints:['One command looks, another moves.', 'cd stands for “change directory”.'] },
  { topic:'Command line', q:'What does cd .. do?', opts:['Moves up to the parent folder','Goes back to the last folder you were in','Goes to your home folder','Lists hidden files'], ans:0, trap:1,
    right:'.. means the parent folder, one level up. cd - is the one that goes back. Answer: Moves up to the parent folder', wrong:'cd .. takes you back where you were before. Answer: Goes back to the last folder you were in', hints:['What does .. stand for in a path?', 'It is one level up, not one step back in time.'] },
  { topic:'Command line', q:'Which command makes a new folder?', opts:['mkdir','touch','cd','rm'], ans:0, trap:1,
    right:'mkdir means make directory. touch makes an empty file. Answer: mkdir', wrong:'touch creates the new folder. Answer: touch', hints:['One makes files, one makes folders.', 'The name starts with “make”.'] },
  { topic:'Command line', q:'Which command deletes a folder along with everything inside it?', opts:['rm -r','rmdir','cd ..','mv'], ans:0, trap:1,
    right:'rm -r removes the folder and all its contents. rmdir only works on empty folders. Answer: rm -r', wrong:'rmdir removes a folder with everything in it. Answer: rmdir', hints:['One of them refuses if the folder is not empty.', '-r means recursive: go inside and delete everything.'] },
  { topic:'Command line', q:'What extra does ls -a show?', opts:['Hidden files whose names start with a dot','The size of each file','Every folder on the computer','Files sorted by date'], ans:0, trap:2,
    right:'-a means all, including hidden files like .gitignore. Answer: Hidden files whose names start with a dot', wrong:'-a shows all the folders on the whole computer. Answer: Every folder on the computer', hints:['ls still looks only in the current folder.', 'Which files does plain ls skip?'] },
  { topic:'Command line', q:'Which command renames notes.txt to todo.txt?', opts:['mv notes.txt todo.txt','cp notes.txt todo.txt','cd notes.txt todo.txt','ls notes.txt todo.txt'], ans:0, trap:1,
    right:'mv moves the file to a new name, so notes.txt is gone. cp would leave both files. Answer: mv notes.txt todo.txt', wrong:'cp notes.txt todo.txt gives the file its new name. Answer: cp notes.txt todo.txt', hints:['After renaming, should notes.txt still exist?', 'Renaming is moving a file to a new name.'] },
  /* GenAI */
  { topic:'GenAI', q:'What is the context window of a language model?', opts:['How much text it can look at at once','The size of its training data','How many people can use it','The box where you type'], ans:0, trap:1,
    right:'The context window is how many tokens the model can see at one time: your prompt plus its reply. Answer: How much text it can look at at once', wrong:'The context window is all the data it learned from. Answer: The size of its training data', hints:['Long chats can “forget” the start. Why?', 'It is measured in tokens per conversation.'] },
  { topic:'GenAI', q:'How does a language model mainly make its reply?', opts:['It predicts the next token again and again','It searches Google for each answer','It looks up a fixed list of answers','It copies one website'], ans:0, trap:1,
    right:'An LLM predicts the most likely next token, adds it, and repeats. Answer: It predicts the next token again and again', wrong:'The model searches the web and copies the best answer. Answer: It searches Google for each answer', hints:['A plain LLM works even without internet.', 'It builds the reply one small piece at a time.'] },
  { topic:'GenAI', q:'What is few-shot prompting?', opts:['Giving a few examples in the prompt','Asking only a few questions','Using a smaller model','Asking for a short reply'], ans:0, trap:1,
    right:'Few-shot means showing the AI a few examples of what you want inside the prompt. Answer: Giving a few examples in the prompt', wrong:'Few-shot means you ask only a few questions in a chat. Answer: Asking only a few questions', hints:['A “shot” is one example.', 'Zero-shot means no examples.'] },
  { topic:'GenAI', q:'A chatbot says its knowledge has a cutoff date. What does that mean?', opts:['It may not know about later events','It stops working after that date','It deletes your chats after that date','It cannot do maths after that date'], ans:0, trap:1,
    right:'The model learned from data up to that date, so newer events may be missing. Answer: It may not know about later events', wrong:'The cutoff date is when the chatbot stops working. Answer: It stops working after that date', hints:['When was the model’s training data collected?', 'It still runs; it just knows less about recent things.'] },
  { topic:'GenAI', q:'An AI gave you a fact for your assignment. What is the best way to check it?', opts:['Check a trusted source, like official docs','Ask the same AI again','Ask the AI if it is sure','Trust it if it sounds confident'], ans:0, trap:1,
    right:'Check against a source you trust. The same AI can repeat the same mistake. Answer: Check a trusted source, like official docs', wrong:'Asking the same AI again confirms the fact. Answer: Ask the same AI again', hints:['Can the AI check itself?', 'Use a source that is not the AI.'] },
  { topic:'GenAI', q:'You start a prompt with “You are a patient Python tutor for beginners.” What is this called?', opts:['Giving the AI a role','Fine-tuning the model','Training the model','Raising the temperature'], ans:0, trap:1,
    right:'Telling the AI who to act as is role prompting. It changes only this chat, not the model. Answer: Giving the AI a role', wrong:'Telling the model how to behave is fine-tuning it. Answer: Fine-tuning the model', hints:['Does one prompt change the model itself?', 'You are telling it who to act as.'] },
  { topic:'GenAI', q:'An AI’s long answer stops in the middle of a sentence. What is the most likely reason?', opts:['It hit the output token limit','The temperature was too low','It hallucinated','Your prompt had a typo'], ans:0, trap:1,
    right:'Replies have a maximum number of tokens. When it is reached, the reply just stops. Answer: It hit the output token limit', wrong:'A low temperature makes the AI stop early. Answer: The temperature was too low', hints:['Temperature changes how random the words are, not how many.', 'Replies have a size limit counted in tokens.'] },
  /* Python concepts */
  { topic:'Python', q:'Which of these can be changed after it is made?', opts:['list','tuple','str','int'], ans:0, trap:1,
    right:'Lists are mutable: you can add, remove or change items. Tuples cannot be changed. Answer: list', wrong:'A tuple is like a list, so you can change it too. Answer: tuple', hints:['Which one has append()?', 'Tuples and strings are fixed once made.'] },
  { topic:'Python', q:'Which data type stores key-value pairs, like "Asha": 85?', opts:['dict','set','list','tuple'], ans:0, trap:1,
    right:'A dict stores keys with values. A set stores single values only. Answer: dict', wrong:'A set uses { } so it stores the pairs. Answer: set', hints:['Both use curly braces. Which one has a colon inside?', 'You look up a value by its key.'] },
  { topic:'Python', q:'A user types 25 when input() asks for their age. What type does input() give back?', opts:['str','int','float','bool'], ans:0, trap:1,
    right:'input() always gives back a string, even if the user types digits. Use int() to convert it. Answer: str', wrong:'25 is a whole number, so input() gives an int. Answer: int', hints:['Does input() check what the user typed?', 'That is why we write int(input()).'] },
  { topic:'Python', q:'Which keyword skips the rest of the current loop round and moves to the next one?', opts:['continue','break','pass','return'], ans:0, trap:1,
    right:'continue jumps to the next round. break ends the whole loop. Answer: continue', wrong:'break skips to the next round. Answer: break', hints:['One of them ends the loop completely.', 'You want the loop to keep going.'] },
  { topic:'Python', q:'Which of these is NOT a valid variable name?', opts:['2marks','_marks','marks2','marks_2'], ans:0, trap:1,
    right:'A name cannot start with a digit. Starting with _ is fine. Answer: 2marks', wrong:'Names cannot start with an underscore. Answer: _marks', hints:['Which characters may a name start with?', 'Letters and _ are allowed first. Digits are not.'] },
  { topic:'Python', q:'For d = {"a": 1, "b": 2, "c": 3}, what does len(d) give?', opts:['3','6','2','1'], ans:0, trap:1,
    right:'len() of a dictionary counts its keys: a, b, c. Answer: 3', wrong:'There are 3 keys and 3 values, so 6 items. Answer: 6', hints:['Is a key and its value one item or two?', 'len() counts key-value pairs.'] },
  { topic:'Python', q:'You use a variable that was never created. Which error does Python show?', opts:['NameError','SyntaxError','TypeError','ValueError'], ans:0, trap:1,
    right:'Using a name Python does not know gives a NameError. The code itself is still written correctly. Answer: NameError', wrong:'Using an unknown name is a mistake in the code, so it is a SyntaxError. Answer: SyntaxError', hints:['Is the code badly written, or is a name missing?', 'The error’s name tells you what is unknown.'] },
  { topic:'Python', q:'What is the difference between = and == in Python?', opts:['= stores a value, == compares two values','Both store a value','Both compare two values','== stores a value, = compares two values'], ans:0, trap:1,
    right:'= puts a value into a variable. == checks if two values are equal and gives True or False. Answer: = stores a value, == compares two values', wrong:'== is just a stronger way to store a value. Answer: Both store a value', hints:['Which one would you write inside an if?', 'One gives True or False; the other changes a variable.'] },
  { topic:'Python', q:'What does int("3.5") give in Python?', opts:['ValueError','3','4','3.5'], ans:0, trap:1,
    right:'int() can turn "3" into 3, but text with a decimal point is not a whole number, so it raises a ValueError. Answer: ValueError', wrong:'int() drops the decimal part, so it gives 3. Answer: 3', hints:['int(3.5) and int("3.5") are not the same thing.', 'For text, int() only accepts whole-number digits.'] }
];
