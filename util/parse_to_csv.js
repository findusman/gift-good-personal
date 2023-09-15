const { Parser } = require('@json2csv/plainjs');

function parseToCsv(data, fields) {
	const jsonData = JSON.parse(JSON.stringify(data));
	const json2csv = new Parser({ fields });
	return json2csv.parse(jsonData);
}

module.exports = parseToCsv;
