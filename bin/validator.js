var config = {
	headers: [
		"Cache-Control"
	],
	licenses: [
		"https://purl.org/dc/terms/license",
		"https://creativecommons.org/ns#license",
		"http://purl.org/dc/terms/license",
		"http://creativecommons.org/ns#license"
	],
	hydra_links: [
		"https://www.w3.org/ns/hydra/core#previous", 
		"https://www.w3.org/ns/hydra/core#next", 
		"https://www.w3.org/ns/hydra/core#search", 
		"http://www.w3.org/ns/hydra/core#previous", 
		"http://www.w3.org/ns/hydra/core#next", 
		"http://www.w3.org/ns/hydra/core#search"
	],
	timestamps: [
		"http://www.w3.org/ns/prov#generatedAtTime",
		"https://www.w3.org/ns/prov#generatedAtTime"
	]
}

//Score.score can be 1 = passed, 0 = not checked, -1 = failed
class Score{
	constructor(score = 0, message = "Not checked"){
		this.score = score;
		this.message = message;
	}

	get passed(){
		return (this.score > 0)
	}
}

class Report{
	constructor(){
		this.accessable = {
			first_attempt: new Score(),
			seconde_attempt: new Score(),
			get score(){
				if(this.first_attempt.passed && this.seconde_attempt.passed)
					return 1;
				else
					return -1;
			},
			get message(){
				if(this.first_attempt.passed && this.seconde_attempt.passed)
					return "Page is accessible";
				else if(!this.first_attempt.passed && !this.seconde_attempt.passed)
					return "Both attempts failed";
				else if(!this.first_attempt.passed)
					return "First attempt failed";
				else if(!this.seconde_attempt.passed)
					return "Seconde attempt failed";
			}
		};

		this.license = new Score();

		this.headers = {};

		for(var header of config.headers)
			this.headers[header] = new Score();

		this.rdf = new Score();
		this.fragmented = new Score();
		this.timestamped = new Score();
	}
}

class Validator{
	
	constructor(options = {}){
		this.options = options;

		this.detect_browser = require('detect-browser').detect();
		this.ldfetch = require("ldfetch");
		this.fetch = require('fetch-ponyfill')(options).fetch;
	}

	validate_url(url){
		this.report = new Report();
	
		return new Promise((fulfill) => {
			this.validate_headers(url)
				.then( result => { 
							this.validate_rdf(url)
								.then(result => { fulfill(this.report) });
						});
		});
		
	}

	validate_headers(url){
		return this.fetch(url, this.options).then(response => {

				for(var header of config.headers)
					this.check_header(header, response);

				//Check if we are in a browser, if so and the page loads we know that cors is set on the server because browser doesn't allow otherwise
				if(this.detect_browser.name != "node")
					this.report.headers.cors = new Score(1, "Page loade d, so assumed that CORS is supported");
				else
					this.check_header("Access-Control-Allow-Origin", response);

				this.report.accessable.first_attempt = new Score(1, "Page was accessable");
				return this.report;
			}).catch(error => {
				this.report.accessable.first_attempt = new Score(-1, error);
				return this.report;
			});
	}

	check_header(header_name, response){
		if(response.headers.get(header_name)){
			this.report.headers[header_name] = new Score(1, response.headers.get(header_name));
		}else{
			this.report.headers[header_name] = new Score(-1, "Header not found");
		}
	}

	validate_rdf(url){
		return (new this.ldfetch()).get(url).then(response => {
			if(response.triples.length == 0){
				this.report.rdf = new Score(-1, "No triples found");
				fulfill(this.report);
				return;
			}

			this.report.rdf = new Score(1, "Parsed correctly");

			this.validate_license(response.triples);
			this.validate_fragmentation(response.triples);
			this.validate_timestamped(response.triples);

			this.report.accessable.seconde_attempt = new Score(1, "Page was accessible");
			return this.report;
		}).catch(error => {
			this.report.accessable.seconde_attempt = new Score(-1, error);
			return this.report;
		});
	}

	validate_license(triples){
		var licenses_found = [];

		for (var triple of triples)
			for(var license_type of config.licenses)
				if(triple.predicate == license_type)
					licenses_found.push(triple.object)

		if(licenses_found.length > 0)
			this.report.license = new Score(1, new Set(licenses_found));
		else
			this.report.license = new Score(-1, "No license found");
	}

	validate_fragmentation(triples){
		var hydra_links_found = [];

		for (var triple of triples)
			for(var hydra_type of config.hydra_links)
				if(triple.predicate == hydra_type)
					hydra_links_found.push({
						hydra: hydra_type,
						link: triple.object
					});

		if(hydra_links_found.length > 0)
			this.report.fragmented = new Score(1, new Set(hydra_links_found));
		else
			this.report.fragmented = new Score(-1, "No Hydra links found");
	}

	validate_timestamped(triples){
		for (var triple of triples)
			for(var timestamp_type of config.timestamps)
				if(triple.predicate === timestamp_type)
					this.report.timestamped = new Score(1, "Timestamp found");

		if(!this.report.timestamped.passed)
			this.report.timestamped = new Score(-1, "No timestamps found");
	}
}

module.exports = Validator;