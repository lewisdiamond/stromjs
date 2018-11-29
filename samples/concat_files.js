const fs = require("fs");
const path = require("path");
const Mhysa = require("mhysa");

const sourceFile1 = path.join(process.cwd(), "package.json");
const sourceFile2 = path.join(process.cwd(), "README.md");
const outputDir = path.join(process.cwd(), "sample_output");
const outputFile = path.join(outputDir, "concat_files.txt");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Concat two source files together into one
Mhysa.concat(
    fs.createReadStream(sourceFile1),
    Mhysa.fromArray(["\n"]),
    fs.createReadStream(sourceFile2),
).pipe(fs.createWriteStream(outputFile));
