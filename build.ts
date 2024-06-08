import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import { spawnSync, write } from "bun";
import escodegen from "escodegen";
import { copyFileSync, cpSync, lstatSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

console.log("Building Cabin Website...");

console.log("\tCleaning output directory...");
rmSync("./dist", { "recursive": true, "force": true });

console.log("\tCopying source files...");
cpSync("./src", "./dist", { "recursive": true });
copyFileSync("./tsconfig.json", "./dist/tsconfig.json");
copyFileSync("./index.html", "./dist/index.html");

console.log("\tCompiling TypeScript...");
spawnSync({
	cmd: ["tsc"],
	cwd: "./dist",
});
rmSync("./dist/tsconfig.json")

console.log("\tRemoving TypeScript files & Fixing JavaScript imports");
function walkDir(directoryPath: string, files: string[] = []): string[] {
	for (let entry of readdirSync(directoryPath)) {
		let fullPath = path.join(directoryPath, entry);
		if (lstatSync(fullPath).isDirectory()) {
			walkDir(fullPath, files);
		} else {
			files.push(entry);
		}
	}

	return files;
}

for (let file of walkDir("./dist")) {
	if (file.endsWith(".ts")) {
		rmSync(file);
		continue;
	}

	if (file.endsWith(".html")) {
		let html = readFileSync(file, { encoding: "utf-8" });
		let rewriter = new HTMLRewriter();
		rewriter.on("*", {
			element(element) {
				if (element instanceof HTMLScriptElement && element.src.endsWith(".ts")) {
					element.src = `${element.src.substring(0, element.src.length - "ts".length)}js`;
				}
			}
		}).transform(html);
		continue;
	}

	if (file.endsWith(".js")) {
		let js = readFileSync(file, { "encoding": "utf-8" });
		let ast = acorn.parse(js, { ecmaVersion: "latest" });
		acornWalk.simple(ast, {
			ImportDeclaration(node) {
				let importPath = node.source.value as string;
				if (importPath.endsWith(".ts")) {
					importPath = importPath.substring(0, importPath.length - ".ts".length);
				}
				if (!importPath.endsWith(".js")) {
					node.source.value = `${importPath}.js`;
				}
			}
		});

		let fixedJs = escodegen.generate(ast);
		write(file, fixedJs);
	}
}
