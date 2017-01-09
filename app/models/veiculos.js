var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var registroSchema = mongoose.Schema({
	funcionario	: {type: String, required: true, trim: true},
	funcionario_id	: {type: String, required: true, trim: true},
	observacoes	: {type: String, trim: true},
	input : {type: Date},
	output	: {type: Date}

});

var VeiculosSchema = new Schema({
	placa:{type: String, required: true, trim: true, unique: true},
	marca:{type: String, required: true, trim: true},
	cor:{type: String, required: true, trim: true},
	modelo:{type: String, required: true, trim: true},
	km:{type: Number, required: true, trim: true},
	available:{type: Boolean, trim: true, default: true},
	blocked:{type: Boolean, trim: true, default: false},
	registro 	: [registroSchema]



});
module.exports = mongoose.model('Veiculos', VeiculosSchema);