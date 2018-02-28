const sfvalidator = new (require('./validator.js'))();

class BrowserValidator{
	constructor(container_id){
		this.container_id = container_id
	}

	validate_url(url){
		sfvalidator.validate_url(url).then(result => { this.construct_output(result, url) });
	}

	construct_output(report, url){
		var table = "<table> <tr> <th colspan='2'> " + url + " </th> <tr>";

		this.add_row_to_table(table,"Attribute", "Message");

		for(var key in report){
			if(key != "headers")
				table = this.add_value_to_table(report, key, table);
			else
				table = this.add_headers(report, table);
		}


		table += " </table>";
		document.getElementById(this.container_id).innerHTML = table
	}

	add_row_to_table(table, at, mes){
		table += "<tr> <td> " + at + " </td> <td> " + mes + " </td </tr>";
		return table;
	}

	add_headers(report, table){
		var header_table = "<table> ";
		var count = 0;
		for(var header in report.headers){
			header_table = this.add_value_to_table(report.headers, header, header_table);
			if(report.headers[header].passed)
				count++;
		}

		header_table += " </table>";

		var title = "<span class='passed'>Headers</span>";
		if(count == 0)
			title = "<span class='failed'>Headers</span>";
		else if(count < Object.keys(report.headers).length)
			title = "<span class='not-checked'>Headers</span>";

		table = this.add_row_to_table(table, title, header_table);

		return table
	}

	add_span(string, pass_class){
		return "<span class='" + pass_class + "'>" + string + "</span>"
	}

	add_value_to_table(report, key, table){
		switch (report[key].score){
			case 1:
				table = this.add_row_to_table(table, this.add_span(key + ' ✓', "passed"), this.add_span(this.get_message(report[key].message), "passed"));
				break;
			case 0:
				table = this.add_row_to_table(table, this.add_span(key + ' ○', "not-checked"), this.add_span(this.get_message(report[key].message), "not-checked"));
				break;
			case -1:
				table = this.add_row_to_table(table, this.add_span(key + ' ✗', "failed"), this.add_span(this.get_message(report[key].message), "failed"));
				break;
		}

		return table;
	}

	get_message(m){
		var string = '';
		if(m instanceof Set){
			for (var val of m){
				if(typeof val == "string")
					string += val + ", <br>";
				else
					string += val.hydra + " : " + val.link + ", <br>";
			}

			string = string.slice(0,-6);

		}else{
			string = m;
		}

		return string;
	}

}

window.sfvalidator = BrowserValidator
module.exports = BrowserValidator