const HOMO = {
    'a': '\u0430', 'A': '\u0410', // Cyrillic a
    'e': '\u0435', 'E': '\u0415', // Cyrillic e
    'o': '\u043E', 'O': '\u041E', // Cyrillic o
    'p': '\u0440', 'P': '\u0420', // Cyrillic r (looks like p)
    'c': '\u0441', 'C': '\u0421', // Cyrillic s (looks like c)
    'k': '\u043A', 'K': '\u041A', // Cyrillic k
    'y': '\u0443', 'Y': '\u0423', // Cyrillic u (looks like y)
    'i': '\u0456', 'I': '\u0406', // Ukrainian i
    's': '\u0455', 'S': '\u0405'  // Cyrillic small/large dze (close to s)
};

export function obfuscateName(name) {
    const chars = Array.from(name);
    return chars.map(ch => HOMO[ch] || ch).join('');
}
