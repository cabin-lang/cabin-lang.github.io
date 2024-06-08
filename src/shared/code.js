const languages = {
    cabin: {
        keyword: /^\b(action|new|function|run|editable|it|let|is|or|group|either|foreach|in|if|otherwise|and)\b/,
        number: /^(-?\d+(\.\d+)?)/,
        string: /^("[^"]+")/m,
        function: /^([a-z_]\w*)(\(|<)/,
        identifier: /^([a-z_]\w*)/,
        group: /^([A-Z_]\w*)/,
        operator: /^([\.\{\}\(\);:=\|\[\],<>]+)/,
        comment: /^(\/\/[^\r\n]+)/,
        whitespace: /^([\s\r\n\t ]+)/
    },
    toml: {
        number: /^(-?\d+(\.\d+)?)/,
        boolean: /^(true|false)/,
        string: /^("[^"]+")/,
        whitespace: /^([\s\r\n\t ]+)/,
        comment: /^(#[^\r\n]+)/,
        identifier: /^([a-z_]\w*)/,
        operator: /^([\.\{\}\(\);:=\|\[\]]+)/
    },
    bash: {
        whitespace: /^([\s\r\n\t ]+)/,
        prompt: /^(\$)/,
        flag: /^(\-[\w\-]+)/,
        identifier: /^(\S+)/
    }
};
export const onedark = {
    cabin: {
        group: '#E5C07B',
        identifier: '#E06C75',
        string: '#98C379',
        operator: 'lightgray',
        function: '#61AFEF',
        keyword: '#C678DD',
        number: '#D19A66',
        comment: '#888888',
        whitespace: 'white'
    },
    toml: {
        boolean: '#D19A66',
        identifier: '#E06C75',
        string: '#98C379',
        operator: 'lightgray',
        number: '#D19A66',
        comment: '#888888',
        whitespace: 'white'
    },
    bash: {
        whitespace: 'white',
        identifier: 'white',
        prompt: '#888888',
        flag: '#888888'
    }
};
function tokenize(code, language) {
    let tokens = [];
    while (code != '') {
        let match_found = false;
        for (let [tokenType, pattern] of Object.entries(language)) {
            let match = pattern.exec(code);
            if (match) {
                tokens.push({
                    tokenType: tokenType,
                    value: match[1]
                });
                code = code.substring(match[1].length);
                match_found = true;
                break;
            }
        }
        if (!match_found) {
            throw `Unrecognized token type: ${ code }`;
        }
    }
    return tokens;
}
function unindent(text) {
    text = text.replace(/\t/g, '    ');
    let max_indent = Infinity;
    let lines = text.split(/\r?\n/g);
    for (let line of lines.filter(line => !/^\s*$/.test(line))) {
        let leading_whitespace = /^\s*/.exec(line)[0].length;
        if (leading_whitespace > 0) {
            max_indent = Math.min(leading_whitespace, max_indent);
        }
    }
    return lines.map(line => line.substring(max_indent)).join('\n');
}
export function syntaxHighlight(code, language, theme) {
    let tokens = tokenize(unindent(code).replaceAll(/&lt;/g, '<').replaceAll(/&gt;/g, '>'), languages[language]);
    let parent = document.createElement('pre');
    parent.classList.add('code');
    tokens.forEach(token => {
        let tokenElement = document.createElement('span');
        tokenElement.innerHTML = token.value;
        tokenElement.style.color = theme[language][token.tokenType];
        tokenElement.style.fontFamily = 'inherit';
        parent.appendChild(tokenElement);
    });
    return parent;
}
$('.code').each((_index, element) => {
    let code_language = $(element).attr('data-language') ?? 'cabin';
    element.replaceWith(syntaxHighlight(element.innerHTML, code_language, onedark));
});