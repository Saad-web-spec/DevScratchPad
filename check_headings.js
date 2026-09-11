const fs = require('fs'); const content = fs.readFileSync('src/lib/blog/posts.ts', 'utf8'); const regex = /##+ .+/g; let m; while(m = regex.exec(content)) { console.log(m[0]); }
