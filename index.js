import fetch from "node-fetch";
import http from "http";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "credentialsDontPost/.env") });

let app = express();


/* ------------------------------------------------- */
/* ----Setting up our MongoDB credentials---- */
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
import { MongoClient, ServerApiVersion } from "mongodb";


/* ------------------------------------------------- */
/* ----Setting up the render path and middleware---- */
app.set("views", path.join(__dirname, "/")); //set the views path for res.render()
app.use(bodyParser.urlencoded({ extended: false })); //lets us parse the POST request


/* ------------------------------------------------- */
/* ----Returns a list of valid countries---- */
async function loadCountries() {
  	const response = await fetch("https://restcountries.com/v2/all");
  	const result = await response.json();
  	return result.map((x) => x.name.toLowerCase());
}

/* ------------------------------------------------- */
/* ----Rendering the url endpoints---- */
app.get("/", function (req, res) {
  	res.writeHead(200, { "Content-Type": "text/html" });
  	res.end(fs.readFileSync("form.ejs"));
});

app.post("/processRequest", function (req, res) {
  	let { firstName, lastName, country, clientCountry } = req.body;

  	async function conn() {

		const uri = `mongodb+srv://${userName}:${password}@cluster0.lf3tf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
		const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
		try {
	  		await client.connect();
			let user = {firstName: firstName,lastName: lastName,country: country,clientCountry: clientCountry,};

		  	await client.db(dbName).collection(collectionName).insertOne(user);
		} catch (e) {
		  	console.error(e);
		} finally {
		  	await client.close();
		}
  	}

  	async function loadPage() {

		loadCountries().then(async (ret) => {
			if(!ret.includes(country.toLowerCase())) { //handles if they input an incorrect country
				res.render("processRequest.ejs", {country: country,region: "You kinda look like this guy ^",
					independent: "Have a nice day and learn how to spell :)",
					flag: "https://wallsdesk.com/wp-content/uploads/2017/01/Monkey-full-HD.jpg"
				});
			} else { //if they input a valid country
				const response = await fetch(`https://restcountries.com/v2/name/${country}`);
				const resul = await response.json();
				const result = resul[0]; //gets only the first json which is our country
				res.render("processRequest.ejs", {country: result.name,region: result.region,independent: result.independent,flag: result.flag});
			}
		});
	}

	conn(); //connect to our DB
	loadPage(); //render the page
});

http.createServer(app).listen(3000);
process.stdout.write("Server started and running on http://localhost:3000\nType Control+C to stop.");
