var config = {
  headers: [
    "Cache-Control",
    "ETag"
  ],
  licenses: [
    "http://purl.org/dc/terms/license",
    "http://creativecommons.org/ns#license"
  ],
  hydra_links: [
    "http://www.w3.org/ns/hydra/core#previous", 
    "http://www.w3.org/ns/hydra/core#next", 
    "http://www.w3.org/ns/hydra/core#first",
    "http://www.w3.org/ns/hydra/core#last"
  ],
  timestamps: [
    "http://www.w3.org/ns/prov#generatedAtTime"
  ],
  metadata: [
    "http://purl.org/dc/terms/",
    "http://www.w3.org/ns/dcat#",
    "http://rdfs.org/ns/void#",
    "http://www.w3.org/2000/01/rdf-schema#",
    "http://xmlns.com/foaf/0.1/"
  ]
}

//Score.score can be 1 = passed, 0 = not checked, -1 = failed
class Score{
  constructor(score = 0, message = "Not checked."){
    this.score = score;
    this.message = message;
  }

  get passed(){
    return (this.score > 0)
  }
}

class Report{
  constructor(){
    this.Accessible = {
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
          return "Both attempts succeeded.";
        else if(!this.first_attempt.passed && !this.seconde_attempt.passed)
          return "First attempt failed because: " + this.first_attempt.message + "\n Second attempt failed because: " + this.seconde_attempt.message;
        else if(!this.first_attempt.passed)
          return "First attempt failed because: " + this.first_attempt.message;
        else if(!this.seconde_attempt.passed)
          return "Second attempt failed because: " +  this.seconde_attempt.message;
      },
      get passed(){
        return (this.score > 0);
      }
    };

    this.License = new Score();

    this.CacheControl = new Score();

    this.Rdf = new Score();
    this.Fragmented = new Score();
    this.Timestamped = new Score();
    this.Metadata = new Score();
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
        var cache_control_enabled = false;
        var headers_found = [];

        for(var header_name of config.headers)
          if(response.headers.get(header_name)){
            cache_control_enabled = true;
            headers_found.push(header_name + ": " + response.headers.get(header_name));
          }

        if(cache_control_enabled){
          var message = "";
          for(var header_info of headers_found)
            message += header_info + "\n";
          this.report.CacheControl = new Score(1, message);
        }else
          this.report.CacheControl = new Score(-1, "No Cache-Control or ETag header found.");

        this.report.Accessible.first_attempt = new Score(1, "Page was accessible.");
        return this.report;
      }).catch(error => {
        this.report.Accessible.first_attempt = new Score(-1, error);
        return this.report;
      });
  }

  validate_rdf(url){
    return (new this.ldfetch()).get(url).then(response => {
      if(response.triples.length == 0){
        this.report.Rdf = new Score(-1, "No triples found on page.");
        return this.report;
      }

      this.report.Rdf = new Score(1, "Dataset parsed correctly.");

      this.report.License = this.validate_license(response.triples, response.url);
      this.report.Fragmented = this.validate_fragmentation(response.triples, response.url);
      this.report.Timestamped = this.validate_timestamped(response.triples);
      this.report.Metadata = this.validate_metadata(response.triples, response.url);

      this.report.Accessible.seconde_attempt = new Score(1, "Page was accessible.");
      return this.report;
    }).catch(error => {
      this.report.Accessible.seconde_attempt = new Score(-1, error);
      return this.report;
    });
  }

  validate_license(triples, url){
    var licenses_found = [];
    var url_no_params = url.split("#")[0].split("?")[0];

    for (var triple of triples)
      for(var license_type of config.licenses){
        if(triple.predicate == license_type && triple.subject === url_no_params)
          licenses_found.push(triple.object)
      }

    if(licenses_found.length > 0)
      return new Score(1, new Set(licenses_found));
    else
      return new Score(-1, "No license found for this dataset.");
  }

  validate_fragmentation(triples, url){
    var hydra_links_found = [];
    var search_subject = ''
    var search_location = ''

    for (var triple of triples)

      if(triple.subject == search_subject && triple.predicate == "http://rdfs.org/ns/void#subset" && triple.object.includes(url)){
        hydra_links_found.push({
          hydra: hydra_type,
          link: search_subject
        });
      }else if(triple.predicate == "http://www.w3.org/ns/hydra/core#search"){
        search_subject = triple.subject;
        search_location = triple.object;
      }else {
        for(var hydra_type of config.hydra_links){
          if(triple.predicate == hydra_type && triple.subject == url)
            hydra_links_found.push({
              hydra: hydra_type,
              link: triple.object
            });
        }
      }

    if(hydra_links_found.length > 0)
      return new Score(1, new Set(hydra_links_found));
    else
      return new Score(-1, "No Hydra links found for this dataset.");
  }

  validate_metadata(triples, url){
    var metadata_found = [];
    var url_no_params = url.split("#")[0].split("?")[0];

    for (var triple of triples)
      for(var metadata_type of config.metadata)
        if((triple.subject == url || triple.subject == url_no_params) && (triple.predicate.startsWith(metadata_type) || triple.object.startsWith(metadata_type)))
          metadata_found.push(triple);

    if(metadata_found.length)
      return new Score(1, new Set(metadata_found));
    else
      return new Score(-1, "No metadata found about this dataset.");
  }

  validate_timestamped(triples, url){
    for (var triple of triples)
      for(var timestamp_type of config.timestamps)
        if(triple.predicate === timestamp_type && triple.subject == url)
          return new Score(1, triple.object);

    return new Score(-1, "No timestamp found for this dataset.");
  }
}

module.exports = Validator;