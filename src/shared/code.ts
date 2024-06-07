const tokenTypes = {
	keyword: /^\b(editable|it|let|is|or|group|either|foreach|in|if|otherwise|and)\b/,
	number: /^(-?\d+(\.\d+)?)/,
	string: /^("[^"]+")/m,
	function: /^([a-z_]\w*)\(/,
	identifier: /^([a-z_]\w*)/,
	group: /^([A-Z_]\w*)/,
	operator: /^([\.\{\}\(\);:=\|\[\]]+)/,
	comment: /^(\/\/[^\r\n]+)/,
	whitespace: /^([\s\r\n\t ]+)/
}

type Theme = { [K in TokenType]: string };

export const onedark: Theme = {
	group: "#E5C07B",
	identifier: "#E06C75",
	string: "#98C379",
	operator: "lightgray",
	function: "#61AFEF",
	keyword: "#C678DD",
	number: "#D19A66",
	comment: "#AAAAAA",
	whitespace: "white"
};

type TokenType = keyof typeof tokenTypes;
type Token = {
	tokenType: TokenType,
	value: string
};

function tokenize(code: string) {
	let tokens: Token[] = [];
	while (code != "") {
		let match_found = false;
		for (let [tokenType, pattern] of Object.entries(tokenTypes)) {
			let match = pattern.exec(code);
			if (match) {
				tokens.push({ tokenType: tokenType as TokenType, value: match[1] });
				code = code.substring(match[1].length);
				match_found = true;
				break;
			}
		}

		if (!match_found) {
			throw `Unrecognized token type: ${code}`;
		}
	}

	return tokens;
}

function unindent(text: string): string {
	text = text.replace(/\t/g, "    ");
	let max_indent = Infinity;
	let lines = text.split(/\r?\n/g);
	for (let line of lines.filter(line => !/^\s*$/.test(line))) {
		let leading_whitespace = /^\s*/.exec(line)![0].length;
		if (leading_whitespace > 0) {
			max_indent = Math.min(leading_whitespace, max_indent);
		}
	}
	return lines.map(line => line.substring(max_indent)).join("\n");
}

export function syntaxHighlight(code: string, theme: Theme): HTMLElement {
	let tokens = tokenize(unindent(code));
	let parent = document.createElement("pre");
	parent.classList.add("cabin-code");
	tokens.forEach(token => {
		let tokenElement = document.createElement("span");
		tokenElement.innerHTML = token.value;
		tokenElement.style.color = theme[token.tokenType];
		parent.appendChild(tokenElement);
	});
	return parent;
}

$(".cabin-code").each((_index, element) => {
	element.replaceWith(syntaxHighlight(element.innerHTML, onedark));
});