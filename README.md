# sfvalidator

In-browser dataset validation.

## Goals
Validating data sets against the rules listed [here](https://smart.flanders.be/resources/) within a terminal or browser.
#### Legal
* Check license:
[Look for DCAT licenses](https://www.w3.org/TR/vocab-dcat/#Property:catalog_license)

#### Technical

* Fetches the page using [fetch-ponyfill](https://www.npmjs.com/package/fetch-ponyfill)
Check for `Cache-Control`, `ETag` HTTP headers.

* CORS detection:
[Is only in header if CORS is supported.](https://stackoverflow.com/questions/19325314/how-to-detect-cross-origin-cors-error-vs-other-types-of-errors-for-xmlhttpreq)
Detect `Access-Control-Allow-Origin` HTTP header.

#### Syntactic

* Check if RDF1.1:
[Parse with ldfetch](https://www.npmjs.com/package/ldfetch)

#### Semantic

* Maximum use of standards

#### Querying

* Fragmented data:
Check for hydra links and timestamps

* European DCAT-AP standard

## Usage
#### Node
First install the package:
```
npm install sfvalidator
```
Then require it and start validating:
```javascript
const sfv = require("sfvalidator")

sfv.validate_url("https:://www.example.com").then(result => { console.log(result); }
```

#### Terminal
Install the package globaly:
```
npm install -g sfvalidator
```

Now you are able to run:
```
sfvalidator <URL>
sfvalidator --file <file-path>
```

#### In-browser
1. Firstly install or download the module.
2. Secondely install browserify:

   		npm install -g browserify
   
3. Then use browserify to bundle the module and its dependencies:
			
		browserify <path-to-module>/lib/browserify-validator.js -o bundle.js

4. Now you are able to include this bundle as a script in your webpage and use it:

		<script src="bundle.js"></script>
		<script>
			validator = new window.sfvalidator();
			validator.validate_url("https:://www.example.com").then(result => { console.log(result); }
		</script>

See the `example` folder for a more extensive example. 
		
## Output
```javascript
{
	Accessable: { 
		first_attempt: Score,
	  	seconde_attempt: Score
	},
	License: Score,
	Headers: { 
		Cache: Score,
	   	ETag: Score,
	   	Cors: Score
	},
	Rdf: Score,
	Fragmented: Score,
	Timestamped: Score
}
```

A `Score` is of this structure:
```javascript
{
	score: int -> -1 if failed, 0 if not checked or 1 if passed
	message: Object -> the message from the validator
}
```
The `message` attribute can have different values when the element passed the validation:
	- In case of `accessable`, `rdf` and `timestamped` it is just a string.
	- In case of the `headers` it is the value of the header in the returned package.
	- In case of `license` and `fragmented` it is a list of found licenses and hydra links respectfully.

## Examples

####Terminal
Run `npm test`.

#### In-browser
Run `npm run-script build-example` and then run an http server in the `example` folder.