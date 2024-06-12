/**
 * All possible code languages used on the website. This is used to tokenize code blocks in order to provide
 * syntax highlighting for them.
 */
const languages = {
	cabin: {
		keyword: /^\b(match|while|action|new|run|editable|it|let|is|or|group|either|foreach|in|if|otherwise|and|represent|as)\b/,
		number: /^(-?\d+(\.\d+)?)/,
		string: /^("[^"]+")/m,
		function: /^([a-z_]\w*)(\(|<)/,
		identifier: /^([a-z_]\w*)/,
		group: /^([A-Z_]\w*)/,
		comment: /^(\/\/[^\r\n]+)/,
		operator: /^([\*\!\+\-\/\.\{\}\(\);:=\|\[\],<>]+)/,
		whitespace: /^([\s\r\n\t ]+)/,
	},
	toml: {
		number: /^(-?\d+(\.\d+)?)/,
		boolean: /^(true|false)/,
		string: /^("[^"]+")/,
		whitespace: /^([\s\r\n\t ]+)/,
		comment: /^(#[^\r\n]+)/,
		identifier: /^([a-z_]\w*)/,
		operator: /^([\.\{\}\(\);:=\|\[\],<>]+)/,
	},
	bash: {
		whitespace: /^([\s\r\n\t ]+)/,
		prompt: /^(\$)/,
		flag: /^(\-[\w\-]+)/,
		identifier: /^(\S+)/,
	},
	ebnf: {
		comment: /^(\(\*[^\*]*\*\))/,
		rule: /^([a-z_]\w*)\s*=/,
		identifier: /^([a-z_]\w*)/,
		string: /^("[^"]+")/,
		operator: /^([\.\{\}\(\);:=\|\[\],<>]+)/,
		whitespace: /^([\s\r\n\t ]+)/,
	},
} as const satisfies { [key: string]: Language };

/** The OneDark theme from Atom. */
export const onedark: Theme = {
	cabin: {
		group: "#E5C07B",
		identifier: "#E06C75",
		string: "#98C379",
		operator: "lightgray",
		function: "#61AFEF",
		keyword: "#C678DD",
		number: "#D19A66",
		comment: "#888888",
		whitespace: "white",
	},
	toml: {
		boolean: "#D19A66",
		identifier: "#E06C75",
		string: "#98C379",
		operator: "lightgray",
		number: "#D19A66",
		comment: "#888888",
		whitespace: "white",
	},
	bash: {
		whitespace: "white",
		identifier: "white",
		prompt: "#888888",
		flag: "#888888",
	},
	ebnf: {
		rule: "#E5C07B",
		identifier: "#E06C75",
		string: "#C678DD",
		operator: "lightgray",
		comment: "#888888",
		whitespace: "white",
	},
};

/**
 * A theme for programming language syntax highlighting. A theme must provide a color for all token types of all languages.
 * This is used to syntax highlight code on the page.
 */
type Theme = {
	[LanguageName in keyof typeof languages]: {
		[TokenName in keyof (typeof languages)[LanguageName]]: string;
	};
};

/**
 * A programming language. This is used to tokenize source code into tokens which can then be syntax highlighted.
 * Objects of this type should be a mapping where the key is the name of the type of token (such as string or identifier),
 * and the value is a regular expression that only matches tokens of that type. Regular expressions *must* start with a
 * start-of-line check (^) and must contain at least one capturing group, which will be highlighted.
 */
type Language = {
	[key: string]: RegExp;
};

/**
 * A token in a language. This has a type, such as "identifier" or "string", and a value, which is the value of the token
 * as it appears in the original source code.
 */
type Token<L extends Language> = {
	/** The type of the token. */
	tokenType: keyof L;
	/** The value of the token */
	value: string;
};

/**
 * Tokenizes a string of source code into a list of tokens of the given language. This is used to syntax
 * highlight the code on the page.
 *
 * This is guaranteed to be lossless, meaning this is always true:
 *
 * ```js
 * code === tokenize(code).map(token => token.value).join("")
 * ```
 *
 * If a token is encountered that doesn't match any of the token types in the language, an error is thrown.
 *
 * @param code The source code to tokenize
 * @param language The language of the source code
 *
 * @returns The list of tokenized tokens
 */
function tokenize<L extends Language>(code: string, language: L): Token<L>[] {
	let tokens: Token<L>[] = [];
	while (code != "") {
		let match_found = false;
		for (let [tokenType, pattern] of Object.entries(language)) {
			let match = pattern.exec(code);
			if (match) {
				tokens.push({ tokenType: tokenType as keyof L, value: match[1] });
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

/**
 * Unindents a block of code. This is used so that code blocks can be properly indented in HTML files, but won't
 * render the leading whitespace on the screen. This removes the minimum shared leading whitespace from each line.
 * For example, if a block of code is 3 lines long, and the indentation on each line respectively is 2 tabs, 3 tabs,
 * 2 tabs, then this will remove 2 tabs worth of leading indentation. Blank lines are not counted in this. The returned
 * string has all tab characters replaced with four spaces.
 *
 * @param text The text to unindent
 *
 * @returns The unindented string
 */
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

/**
 * Syntax highlights a block of code. The result is returned as an `HTMLPreElement` with the code highlighted using
 * CSS styles on child `span` elements.
 *
 * @param code The code text to syntax highlight
 * @param language The language of the code
 * @param theme The theme to highlight it with
 *
 * @returns The syntax highlighted code as an `HTMLPreElement`
 */
export function syntaxHighlight(code: string, language: keyof typeof languages, theme: Theme): HTMLPreElement {
	let tokens = tokenize(unindent(code).replaceAll(/&lt;/g, "<").replaceAll(/&gt;/g, ">"), languages[language]);
	let parent = document.createElement("pre");
	parent.classList.add("code");
	tokens.forEach(token => {
		let tokenElement = document.createElement("span");
		tokenElement.innerHTML = token.value;
		tokenElement.style.color = theme[language][token.tokenType];
		tokenElement.style.fontFamily = "inherit";
		parent.appendChild(tokenElement);
	});
	return parent;
}

// Syntax highlight all .code elements
$(".code").each((_index, element) => {
	let code_language = ($(element).attr("data-language") ?? "cabin") as keyof typeof languages;
	let newElement = syntaxHighlight(element.innerHTML, code_language, onedark);
	Object.entries(element.attributes).forEach(([_index, value]) => {
		newElement.setAttribute(value.name, value.nodeValue ?? "true");
	});
	element.replaceWith(newElement);
});
