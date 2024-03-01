const express = require('express');
const shortid = require("shortid");
const sql = require("mysql");
const app = express();

app.listen(3000);

app.set("view engine", "ejs");
app.use(express.static(_dirname + "public"));
app.use(express.urlencoded({extended: false}));

app.get('/', (req, res) => {
    res.render("home.ejs");
});

app.post('/shorten', (req, res) => {
    const originalUrl = req.body.originalUrl;

    const shortCode = generateShortCode();
    const shortUrl = `https://yourdomain.com/${shortCode}`;
    urlDatabase[shortCode] = originalUrl;
    res.json({ shortUrl });
});

app.get('/:shortCode', (req, res) => {
    const shortCode = req.params.shortCode;
    const originalUrl = urlDatabase[shortCode];
    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.status(404).send('Short URL not found');
    }
});

function generateShortCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        shortCode += characters[randomIndex];
    }
    return shortCode;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "url_shortener"
});

db.connect(err => {
    if(err) {
        console.log("Error connecting to DB");
        return;
    }
    console.log("Connceted to DB");
});


app.post("/shorten", (req, res) => {
    const fullUrl = req.body.fullUrl;
    if (!fullUrl) {
        return res.sendStatus(404);
    }
    db.query('SELECT * FROM `url` WHERE `fullUrl` = ?', [fullUrl], (error, results) => {
        if (error) {
            console.log("we got error");
            return;
        }

        if (results.length === 0) {
            const short = shortid.generate();
            const url = { fullUrl: req.body.fullUrl, shorten: short, counts: 1 };
            db.query('INSERT INTO `url` SET ?', url, (err, res) => {
                if (err) {
                    console.log("Error creating table");
                    return;
                }
            });
            res.render("result.ejs", { shorten: short, times: 1 });
        } else {
            const _short = results[0].shorten;
            const _counts = results[0].counts;
            db.query('UPDATE `url` SET `counts` = ? WHERE `shorten` = ?', [_counts + 1, _short], (err, res) => {
                if (err) {
                    console.log("Error updating table");
                    return;
                }
            });
            res.render("result.ejs", { shoirten: _short, times: _counts + 1 });
        }
    });
});


app.get("/:shortUrl", (req, res) => {
    db.query('SELECT * FROM `url` WHERE `shortUrl` = ?', [req.params.shortUrl], (error, results) => {
        if (error) {
            return res.sendStatus(404);
        }

        if (results.length === 0) {
            res.render("error.ejs");
        } else {
            res.redirect(results[0].fullUrl);
        }
    });
});