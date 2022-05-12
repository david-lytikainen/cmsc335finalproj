//put "type": "module" in package.json file and run npm install node-fetch
import fetch from "node-fetch";
import http from "http";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.resolve(__dirname, 'credentialsDontPost/.env')});

let app = express();


/* ----Setting up our MongoDB credentials---- */
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = `mongodb+srv://${userName}:${password}@cluster0.lf3tf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set('views', path.join(__dirname, '/')); //set the views path for res.render()
app.use(bodyParser.urlencoded({extended:false})); //lets us parse the POST request


app.get('/',
function(req,res) {
  res.writeHead(200, {"Content-Type": "text/html"});
  res.end(fs.readFileSync("form.ejs"));
});

app.post('/processRequest',
function(req,res) {
  let { firstName, lastName, country, clientCountry } = req.body;

  (async() => {
    try {
        await client.connect();

        let client = {firstName: firstName, lastName:lastName, country:country, clientCountry:clientCountry};
        await client.db(dbName).collection(collectionName).insertOne(client);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
  })();

  let fe = fetch('https://restcountries.com/v2/name/' + country);
  let result = fe.json();

  res.render("processRequests.ejs", 
            {country:result.name, region:result.region, independent:result.independent, flag:result.flag});

});

/*fetch('https://restcountries.com/v2/name/china')
  .then(res => res.json())
  .then(data => console.log(data[0])); */


http.createServer(app).listen(3000);
process.stdout.write("Server started and running on http://localhost:3000\nType Control+C to stop.");
