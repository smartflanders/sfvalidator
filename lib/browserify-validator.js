const sfvalidator = new (require('./validator.js'))();

class BrowserValidator{
  constructor(container_id, is_timeseries = true){
    this.container_id = container_id
    this.is_timeseries = is_timeseries;

    var hash_url = location.hash.substr(1,location.hash.length-1).split("&")[0];
    if(hash_url)
      this.validate_url(hash_url);
  }

  validate_url(url){
    document.getElementById(this.container_id).innerHTML = 'Even geduld! We valideren de dataset...';
    sfvalidator.validate_url(url).then(result => { this.construct_output(result, url) });
  }

  construct_output(report, url){
    var response = "";// "<h2>Rapport voor: <a href=" + url + ">" + url + "</a></h2>";
    response += this.add_permalink(url);
    response += this.check_major_problems(report);
    response += this.check_advisables(report);
    response += this.check_likes(report);

    document.getElementById(this.container_id).innerHTML = response
  }

  add_permalink(url){
    var permalink = location.href.split("#")[0] + "#" + url;
    var permalink_string = "<p>Deel <a href='" + permalink + "'>dit rapport</a> gerust met collega’s</p>";
    return permalink_string;
  }

  check_major_problems(report){
    var major_problems_string = "<h3 class='h3'>Het belangrijkste</h3>";
    var major_problems = [];
    var major_problems_found = false;

    if(!report.Accessible.passed){
      major_problems_found = true;
      major_problems.push("<span>CORS</span>: De pagina was niet bereikbaar. Controleer of de pagina bestaat. Indien dit het geval is werden geen goeie Cross Origin Resource Sharing headers ingesteld (<a href='http://enable-cors.org'>meer informatie</a>). Test opnieuw eenmaal de dataset bereikbaar is.");
    } else {
      if(!report.Rdf.passed){
        major_problems_found = true;
        major_problems.push("<span>RDF</span>: Er werden geen Linked Data gevonden achter deze URL. Contacteer <a href='https://smart.flanders.be/about/'>het Smart Flanders team</a> voor ondersteuning.");
      }
      if(!report.License.passed){
        major_problems_found = true;
        major_problems.push("<span>Licentie</span>: Er werd geen licentie gevonden op deze dataset. Zonder licentie mag niemand deze data als Open Data hergebruiken. Check de <a href='https://smart.flanders.be/resources/'>technische Smart Flanders principes</a> voor meer info.");
      }
    }
    if (!major_problems_found)
      major_problems_string += "<p>Dit is een Smart Flanders dataset! We hebben geen grote problemen gevonden.</p>";
    else {
      major_problems_string += "<p>Deze dataset voldoet helaas nog niet aan de Smart Flanders principes. Deze stappen moeten nog worden ondernomen:</p><ul>";
      
      for (var problem of major_problems)
	major_problems_string += "<li>" + problem + "</li>";
      
      major_problems_string += "</ul>";
      
    }
    
    return major_problems_string;
  }

  check_advisables(report){
    var advisables_string = "<h3 class='h3'>Zaken die wij aanraden</h3>";
    var advisables = []
    var advisables_found = false;

    if(!report.CacheControl.passed){
      advisables_found = true;
      advisables.push("<span>Cache control</span>: We raden aan om er voor te zorgen dat Cache-Control of ETag headers ingesteld staan. Dit zorgt ervoor dat de dataset gecachet kan worden.");
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
    var likes_string = "";

    if(report.Metadata.passed){
      likes_string += "<h3 class='h3'>Zaken die we leuk vinden</h3><p>We zien dat de dataset het DCT en DCAT vocabularium gebruiken. Dat is zeer goed! Probeer zo veel en goed mogelijk de dataset te beschrijven.</p><ul>";
      
      for(var metadata of report.Metadata.message)
	likes_string += "<li><span>Subject:</span> " + metadata.subject + "<br/><span>Predicate:</span> " + metadata.predicate + "<br/><span>Object:</span> " + metadata.object + "</li>";

      likes_string += "</ul>";
    }
    else
      likes_string += "<h3 class='h3'>Zaken die beter kunnen</h3><p>Er wordt geen gebruik gemaakt van vocabularia om de dataset te beschrijven zoals DCT, DCAT, VOID, RDFS of FOAF. Door dit wel te doen weten anderen wat de inhoud is, door wie deze beheerd wordt, hoe de data gegenereerd wordt enzovoort.</p>";
    
    return likes_string;
  }
}

window.sfvalidator = BrowserValidator
module.exports = BrowserValidator
