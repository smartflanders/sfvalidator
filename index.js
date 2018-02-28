var validator = new (require("./bin/validator.js"))();
validator.validate_url("https://linked.open.gent/parking").then(result => { console.log(result) });