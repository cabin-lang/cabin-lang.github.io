const tokenTypes = {
	keyword: /^\b(foreach|in|if|otherwise|and)\b/,
	number: /-?\d+(\.\d+)?/,
	identifier: /[a-z_]\w*/,
	group: /[A-Z_]\w*/,
	function: /^[a-z_]\w*\(/,
	operator: /^\.\{\}\(\)=/,
	whitespace: /^\s\n\r\t /
}

type Theme = { [K in TokenType]: string };

const onedark: Theme = {

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
				tokens.push({ tokenType: tokenType as TokenType, value: match[0] });
				code = code.substring(match[0].length);
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

function colored(code: string, theme: Theme): HTMLElement {
	let tokens = tokenize(code);
	let parent = document.createElement("pre");
	tokens.forEach(token => {
		let tokenElement = document.createElement("span");
		tokenElement.innerHTML = token.value;
		tokenElement.style.color = theme[token.tokenType];
		parent.appendChild(tokenElement);
	});
	return parent;
}