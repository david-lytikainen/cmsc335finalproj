//put "type": "module" in package.json file and run npm install node-fetch
import fetch from "node-fetch";

fetch('https://restcountries.com/v2/name/china')
  .then(res => res.json())
  .then(data => console.log(data[0]));
