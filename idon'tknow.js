const { readFile, writeFile } = require("fs/promises");
const { createServer } = require("http");
const path = require("path");
const crypto = require("crypto");

// import { readFile } from "fs/promises";
// import { createServer } from "http";
// import path from "path";
// import crypto from "crypto";
// import { writeFile } from "fs/promises";

const PORT = 3001;
const DATA_FILE = path.join("data", "links.json");

const serverFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { "Content-Type": "Content/plain" });
        res.end("404 page not found");
    }
};

const loadlinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if(error.code === "ENOENT"){
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
};

// simple write file ki data ka path or data usme add kar diya.

const savelinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links));
};

const  server = createServer(async (req, res) => {
    console.log(req.url);
    
    if(req.method === "GET") {
        if(req.url === "/") {
            return serverFile(res, path.join("public", "index.html"), "text/html");
        }else if(req.url === "/style.css") {
            return serverFile(res, path.join("public", "style.css"), "text/css");
        } else if(req.url === "/links") {
            const links = await loadlinks();

            res.writeHead(200, { "Content-Type": "application/json"});
            return res.end(JSON.stringify(links));
        } else if (req.url === "/favicon.ico") {
            res.writeHead(204);
            return res.end();
        } else {
            const links = await loadlinks();
            const shortCode = req.url.slice(1);
            console.log(" links red. ", req.url);

            if(links[shortCode]){
                res.writeHead(302, {location : links[shortCode]});
                return res.end();
            }

            res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("Shortened URL is not found");
        }
    }

    // Handle favicon
    if (req.method === "GET" && req.url === "/favicon.ico") {
        res.writeHead(204);
        return res.end();
    }

// agar request hota hai POST and url hota hai particular shorten.

    if(req.method === "POST" && req.url === "/shorten"){
        const links = await loadlinks();

// to kase data phale GET karna hai

        let body = "";
        req.on("data", (chunk) => (body += chunk));

        req.on("end", async () => {
            console.log(body);
            const { url, shortCode } = JSON.parse(body);

            // agar katam ho jaye to check karna hai ki duplicate hai ya nhi 

            if (!url) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("URL is required");
            }

            //phir ek vrabile banaya jaha par jo shortCode jo bhi humme mil raha tha usko store kar di just to be check ki koe duplicate data to nhi hai 
            // agar duplicate hai to ku add karna hai same sorce code hum 2 jaga use nhi kar sakte.
        
            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

            if(links[finalShortCode]){
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("Short code already exists. Please choose another.");
            }
            
            // and ye important hai jaha humne data ko finaly link kiya wo key and value aad kari jisse link ho paye 

            links[finalShortCode] = url;

            // then humne function call kiya jaha par data ko aad kiya gaya phir uper 35 line

            await savelinks(links);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({success:true, shortcode:finalShortCode}))
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    
});