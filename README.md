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
npm i -s sfvalidator
```
Then require it and start validating:
```javascript
const sfv = require("sfvalidator")

sfv.validate_url("https:://www.example.com").then(result => { console.log(result); }
```

#### In-browser
1. Firstly install or download the module.
2. Secondely install browserify:

   		npm i -g browserify
   
3. Then use browserify to bundle the module and its dependencies:
			
		browserify <path-to-module>/bin/validator_browser.js -o bundle.js

4. Now you are able to include this bundle as a script in your webpage and use it:

		<script src="bundle.js"></script>
		<script>
			validator = window.sfvalidator;
			validator.validate_url("https:://www.example.com").then(result => { console.log(result); }
		</script>
		
## Output
```javascript
{
	accessable: { 
		first_attempt: Score,
	  	seconde_attempt: Score
	},
	license: Score,
	headers: { 
		cache: Score,
	   	etag: Score,
	   	cors: Score
	},
	rdf: Score,
	fragmented: Score,
	timestamped: Score
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
