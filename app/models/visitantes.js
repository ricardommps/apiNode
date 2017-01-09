var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var infoSchema = mongoose.Schema({
	input	: {type: Date, default: Date.now},
	output	: {type: Date, default: Date.now}

});

var VisitantesSchema = new Schema({
	cpf:{type: String, required: true, trim: true, unique: true},
	nome:{type: String, required: true, trim: true},
	email:{type: String, required: true, trim: true},
	telefone:{type: String, required: true, trim: true},
	endereco:{type: String, required: true, trim: true},
	data : {type: Date, default: Date.now},
	infoDate 	: [infoSchema]

});
module.exports = mongoose.model('Visitantes', VisitantesSchema);
