const fs = require("fs");
const path = require("path");
const { stream } = require("mysah");

const sourceFile1 = path.join(process.cwd(), "package.json");
const sourceFile2 = path.join(process.cwd(), "README.md");
const outputDir = path.join(process.cwd(), "sample_output");
const outputFile = path.join(outputDir, "concat_files.txt");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Concat two source files together into one
stream
    .concat(
        fs.createReadStream(sourceFile1),
        stream.fromArray(["\n"]),
        fs.createReadStream(sourceFile2),
    )
    .pipe(fs.createWriteStream(outputFile));
