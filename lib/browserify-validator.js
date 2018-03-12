const sfvalidator = new (require('./validator.js'))();

class BrowserValidator{
	constructor(container_id, is_timeseries = true){
		this.container_id = container_id
		this.is_timeseries = is_timeseries;
	}

	validate_url(url){
		sfvalidator.validate_url(url).then(result => { this.construct_output(result, url) });
	}

	construct_output(report, url){
		var response = "";

		response += this.check_major_problems(report);
		response += this.check_advisables(report);
		response += this.check_likes(report);


		document.getElementById(this.container_id).innerHTML = response
	}

	check_major_problems(report){
		var major_problems_string = "<h1>Grote problemen</h1>";
		var major_problems = [];
		var major_problems_found = false;

		if(!report.Accessible.passed){
			major_problems_found = true;
			major_problems.push("<span>CORS</span>: De pagina was niet bereikbaar, dit betekend vaak dat de CORS header niet juist ingesteld zijn.");
		}
		if(!report.Rdf.passed){
			major_problems_found = true;
			major_problems.push("<span>RDF</span>: Er werd geen linked data gevonden op deze pagina.");
		}
		if(!report.License.passed){
			major_problems_found = true;
			major_problems.push("<span>Licentie</span>: Er werd geen licentie gevonden over deze dataset.");
		}

		if(!major_problems_found)
			major_problems_string += "<p>Geen grote problemen gevonden.</p>";
		else{

			major_problems_string += "<p>Oei! We hebben enkele grote problemen gevonden in de dataset:</p><ul>";

			for (var problem of major_problems)
				major_problems_string += "<li>" + problem + "</li>";

			major_problems_string += "</ul>";

		}

		return major_problems_string;
	}

	check_advisables(report){
		var advisables_string = "<h1>Zaken die wij aanraden</h1>";
		var advisables = []
		var advisables_found = false;

		if(!report.CacheControl.passed){
			advisables_found = true;
			advisables.push("<span>Cache control</span>: We raden aan om er voor te zorgen dat Cache-Control of ETag headers ingesteld staan. Dit zorgd er voor dat de dataset gecached kan worden.");
		}
		if(!report.Fragmented.passed && this.is_timeseries){
			advisables_found = true;
			advisables.push("<span>Links</span>: We raden aan om hydra links te voorzien naar andere delen van de dataset.");
		}

		if(!advisables_found)
			return "";
		else{

			advisables_string += "<p>Om de dataset verder te verbeteren raden we volgende dingen aan:</p><ul>";

			for (var advisable of advisables)
				advisables_string += "<li>" + advisable + "</li>";

			advisables_string += "</ul>";

			return advisables_string;
		}
	}

	check_likes(report){
		var likes_string = "<h1>Zaken die we leuk vinden</h1>";

		if(report.Metadata.pass)
			likes_string += "<p>We zien dat de dataset het DCT en DCAT vacabularium gebruiken. Dat is zeer goed! Probeer zo veel en goed mogelijk de dataset te beschrijven.</p>";
		else
			likes_string += "<p>Er wordt geen gebruik gemaakt van het DCT of DCAT vocabularium om de dataset te beschrijven. Door dit wel te doen weten anderen wat de inhoud is, door wie deze beheerd wordt, hoe de data gegenereerd wordt enzovoort.</p>";
		
		return likes_string;
	}
}

window.sfvalidator = BrowserValidator
module.exports = BrowserValidator