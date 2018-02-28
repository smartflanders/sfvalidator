#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const program = require('commander');
const validator = new (require("../lib/terminal-validator.js"))();

console.error("Smart Flanders Dataset validator use --help to discover more functions");

var input;

program
  .arguments('<url-to-validate>')
  .option('-f, --file', 'specify a file of urls')
  .action(input => {
  	if(program.file){

		var lineReader = require('readline').createInterface({
			input: require('fs').createReadStream(input)
		});

		lineReader.on('line', line => {
			var site_args = line.split(" ");
			if(site_args.length > 1)
				validator.validate_url(site_args[0], site_args[1]);
			else
				validator.validate_url(site_args[0]);
		});

	}else if(input){
		validator.validate_url(input);
	}
  })
  .parse(process.argv);

if(!input)
	console.error("Please provide a URL or file path with the option --file.");
	