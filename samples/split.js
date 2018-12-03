const mhysa = require("mhysa");
let stream = mhysa.split(",");

const buf = Buffer.from("a,b,c");
stream.on("data", function(data) {
    console.log(data);
});

for (let i = 0; i < buf.length; ++i) {
    stream.write(buf.slice(i, i + 1));
}
stream.end();
