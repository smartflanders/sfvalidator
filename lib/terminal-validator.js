const SFValidator = require('./validator.js');
const chalk = require('chalk');
const cli_table = require('cli-table');

var chars = { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
         , 'left': '║' , 'left-mid': '╟'
         , 'right': '║' , 'right-mid': '╢' }

class TerminalValidator{
	constructor(){
		this.sfvalidator = new SFValidator();
	}

	validate_url(url, alias=""){
		this.sfvalidator.validate_url(url).then(result => { this.construct_output(result, url, alias) });
	}

	construct_output(report, url, alias){
		var table_header = alias != "" ? [chalk.black.bgWhite.underline(alias), chalk.black.bgWhite.underline(url)] : [chalk.black.bgWhite.underline(url),""];
		var table = new cli_table({
			head: table_header,
			chars: chars
		});

		table.push([chalk.dim('Attribute'), chalk.dim('Message')]);

		for(var key in report){
			this.add_value_to_table(report, key, table);
		}

		console.log(table.toString());
	}

	add_value_to_table(report, key, table){
		switch (report[key].score){
			case 1:
				table.push([chalk.green(key + ' ✓'), chalk.green(this.get_message(report[key].message))]);
				break;
			case 0:
				table.push([chalk.yellow(key + ' ○'), chalk.yellow(this.get_message(report[key].message))]);
				break;
			case -1:
				table.push([chalk.bgRed(key + ' ✗'), chalk.red(this.get_message(report[key].message))]);
				break;
		}
	}

	get_message(m){
		var string = '';
		if(m instanceof Set){
			var table = new cli_table();
			for (var val of m){
				if(val.hydra)
					table.push([val.hydra, val.link]);
				else if(val instanceof Object)
					table.push([val.subject, val.predicate, val.object]);
        else
          table.push([val]);
			}

			string = table.toString();

		}else{
			string = m;
		}

		return string;
	}
}

module.exports = TerminalValidator;