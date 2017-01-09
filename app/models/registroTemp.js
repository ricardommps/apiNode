var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var RegistroSchema = new Schema({
	idVeiculo:{type: String, required: true, trim: true, unique: true},
	idFuncionario:{type: String, required: true, trim: true, unique: true},
	placa:{type: String, required: true, trim: true, unique: true},
	funcionario:{type: String, required: true, trim: true},
	cpf:{type: String, required: true, trim: true},
	input:{type: String, required: true, trim: true}

});
module.exports = mongoose.model('RegistroOutput', RegistroSchema);