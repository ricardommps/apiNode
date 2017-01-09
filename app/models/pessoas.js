var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var pontoSchema = mongoose.Schema({
	input	: {type: Date},
	output	: {type: Date}

});

var PessoasSchema = new Schema({
	cpf				:{type: String, required: true, trim: true, unique: true},
	nome			:{type: String, required: true, trim: true},
	matricula		:{type: String, required: true, trim: true},
	email			:{type: String, required: true, trim: true},
	telefone		:{type: String, required: true, trim: true},
	endereco		:{type: String, required: true, trim: true},
	available		:{type: Boolean, trim: true, default: true},
	registroPonto 	: [pontoSchema],
	blocked			:{type: Boolean, trim: true, default: false}

});
module.exports = mongoose.model('Pessoas', PessoasSchema);
