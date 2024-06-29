import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import { spawnSync, write } from "bun";
import escodegen from "escodegen";
import { copyFileSync, cpSync, lstatSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

console.log("Building Cabin Website...");

console.log("\tCleaning output directory...");
rmSync("./dist", { recursive: true, force: true });

console.log("\tCopying source files...");
cpSync("./src", "./dist/src", { recursive: true });
copyFileSync("./tsconfig.json", "./dist/tsconfig.json");
copyFileSync("./index.html", "./dist/index.html");

console.log("\tCompiling TypeScript...");
spawnSync({
	cmd: ["bunx", "tsc"],
	cwd: "./dist",
});
rmSync("./dist/tsconfig.json");

console.log("\tRemoving TypeScript files, Fixing JavaScript & HTML imports");
function walkDir(directoryPath: string, files: string[] = []): string[] {
	for (let entry of readdirSync(directoryPath)) {
		let fullPath = path.join(directoryPath, entry);
		if (lstatSync(fullPath).isDirectory()) {
			walkDir(fullPath, files);
		} else {
			files.push(fullPath);
		}
	}

	return files;
}

for (let file of walkDir("./dist")) {
	if (file.endsWith(".ts")) {
		console.log(`\t\tRemoving TypeScript file ${file}`);
		rmSync(file);
		continue;
	}

	if (file.endsWith(".html")) {
		console.log(`\t\tTransforming HTML file ${file}`);
		let html = readFileSync(file, { encoding: "utf-8" });
		let fixedHTML = new HTMLRewriter()
			.on("script", {
				element(element) {
					let src = element.getAttribute("src")!;
					if (src.endsWith(".ts")) {
						element.setAttribute("src", `${src.substring(0, src.length - "ts".length)}js`);
					}
				},
			})
			.transform(new Response(html));
		write(file, fixedHTML);
		continue;
	}

	if (file.endsWith(".js")) {
		console.log(`\t\tTransforming JavaScript file ${file}`);
		let js = readFileSync(file, { encoding: "utf-8" });
		let ast = acorn.parse(js, { ecmaVersion: "latest", sourceType: "module" });
		acornWalk.simple(ast, {
			ImportDeclaration(node) {
				let importPath = node.source.value as string;
				if (importPath.endsWith(".ts")) {
					importPath = importPath.substring(0, importPath.length - ".ts".length);
				}
				if (!importPath.endsWith(".js")) {
					node.source.value = `${importPath}.js`;
				}
			},
		});

		let fixedJs = escodegen.generate(ast);
		write(file, fixedJs);
		continue;
	}
}

console.log("Build complete!\n");