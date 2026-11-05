/* Wiki Hop: 18 extra pages, plus extra links appended to existing pages. */
(window.MORE = window.MORE || {}).wiki = {
  'Python list':'A list in Python stores many items in order, like marks = [72, 88, 95]. The first item is at index 0, and you can add items with append(). To store items by name instead of by position, use a [[Python dictionary]].',
  'Python dictionary':'A dictionary in Python stores key–value pairs, like {"name": "Asha", "age": 19}. You look up a value by its key, so d["name"] gives "Asha". Data sent between apps as [[JSON]] looks almost the same.',
  'JSON':'JSON is a text format for sending data. It writes keys and values inside curly brackets, much like a [[Python dictionary]]. Most [[API]]s send and receive their data as JSON.',
  'API':'An API lets one program ask another program for data or a service. A weather app, for example, asks a weather [[Server]] for today’s forecast through an API. Developers can also use a [[Large language model]] through an API.',
  'Large language model':'A large language model (LLM) is an AI trained on huge amounts of text. It writes by predicting the next [[Token]], again and again. Because it predicts likely words instead of looking up facts, it can produce a [[Hallucination]].',
  'Token':'A token is a small piece of text that an AI model reads, such as a word or part of a word. In English, one token is about three-quarters of a word on average. Every [[Prompt]] you type is split into tokens before the model reads it.',
  'Prompt':'A prompt is the instruction you give to an AI chatbot, such as [[ChatGPT]]. A good prompt states a role, the task and the format you want. Clear prompts get better answers, but you should still check the output for a [[Hallucination]].',
  'Hallucination':'A hallucination is when an AI gives an answer that sounds confident but is false, like a made-up fact or a book that does not exist. It happens because a [[Large language model]] predicts likely words. Always check important answers against a trusted source.',
  'Bit':'A bit is the smallest unit of data in a computer. It can only be 0 or 1, which is why computers use [[Binary]]. Eight bits together make one [[Byte]].',
  'Byte':'A byte is a group of 8 bits, so it can hold 256 different values, from 0 to 255. One byte is enough to store one English letter in [[ASCII]]. Memory such as [[RAM]] is measured in bytes: kilobytes, megabytes and gigabytes.',
  'ASCII':'ASCII is a code that gives each English letter, digit and symbol a number. For example, “A” is 65 and “a” is 97. In Python, ord("A") gives 65 and chr(97) gives "a". Every ASCII code fits in one [[Byte]].',
  'Bitwise operators':'Bitwise operators work on the separate bits of a number. In Python, & is AND, | is OR, ^ is XOR and << shifts bits to the left. For example, 5 & 3 is 1, because 101 AND 011 is 001 in [[Binary]].',
  'RAM':'RAM (Random Access Memory) is the short-term memory of a computer. The [[CPU]] keeps the programs and data it is using right now in RAM. RAM is fast, but it loses everything when the power goes off.',
  'Linux':'Linux is a free operating system first released by Linus Torvalds in 1991. He later created [[Git]] as well. Most web servers run on Linux, and people often control it by typing in the [[Command line]].',
  'Command line':'The command line lets you control a computer by typing commands instead of clicking. For example, pwd shows your current folder, cd changes the folder and mkdir makes a new one. You also type [[Git]] commands, like git commit, here.',
  'IP address':'An IP address is a number that identifies a device on a network, like 192.168.1.10. This kind of address has four parts, and each part is one [[Byte]], so it goes from 0 to 255. Before your phone can open a website, it must find the IP address of the [[Server]].',
  'Flexbox':'Flexbox is a way to arrange items in a row or a column using [[CSS]]. You turn it on with display: flex. justify-content spaces items along the main axis, and align-items lines them up on the cross axis.',
  'Tailwind CSS':'Tailwind CSS gives you small ready-made classes that you write directly in [[HTML]]. For example, p-4 adds padding and text-center centres text. The class flex turns on [[Flexbox]], and md: applies a style only on medium screens and larger.'
};
/* Extra sentences appended to existing pages, so the new pages can be reached. */
window.MORE.wikiLinks = {
  'Python':' To store many values in order, Python uses a [[Python list]].',
  'CSS':' Many students also style pages with [[Tailwind CSS]].',
  'Binary':' You can change single bits with [[Bitwise operators]].',
  'CPU':' Each 0 or 1 that it handles is called a [[Bit]].',
  'ChatGPT':' It is built on a [[Large language model]].',
  'Internet':' Every device on it has an [[IP address]].',
  'Server':' Most servers run [[Linux]].',
  'UPI':' It is now used in shops all across [[India]].',
  'India':' Its newest state, [[Telangana]], was formed in 2014.'
};
