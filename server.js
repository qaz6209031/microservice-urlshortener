require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('dns');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true});

const urlSchema = new mongoose.Schema({
  url: String
});

const URL = mongoose.model('URL', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urlExtractor = function(url) {
  var urlSplit = url.split("https://");
  if (urlSplit[1] == undefined) {
    return urlSplit[0].split("/")[0];
  } else {
    return urlSplit[1].split("/")[0];
  }
};

//Input
app.post("/api/shorturl/new", function(req, res) {
  var url = req.body.url;
  var extractedUrl = urlExtractor(req.body.url);
  dns.resolveAny(extractedUrl, (err, address) => {
    if (err) {
      console.log(err, address);
      res.json({ error: "invalid URL" });
    } else {
      var urlRecord = new URL({ url: url });
      urlRecord.save((err, data) => {
        if (err) res.json({ error: "invalid URL" });
        else {
          res.json({ original_url: url, short_url: data._id.toString() });
        }
      });
    }
  });
});

//Output-Redirect
app.get("/api/shorturl/:shorturl", function(req, res) {
  let shorturl = req.params.shorturl;
  let urlId;
  try {
    urlId = mongoose.Types.ObjectId(shorturl);
  } catch (err) {
    res.json({ error: "invalid URL" });
    console.log("error" + urlId);
  }
  let completeurl = URL.findById(urlId, (err, data) => {
    if (err) {
      res.json({ error: "invalid URL" });
      console.log("error" + urlId);
    } else {
      res.status(301).redirect(data.url);
      console.log("Success" + urlId);
    }
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
