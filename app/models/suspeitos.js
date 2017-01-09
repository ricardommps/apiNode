var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var SuspeitosSchema = new Schema({
	tipo:{type: String, required: true, trim: true, unique: true},
	local:{type: String, required: true, trim: true},
	observacoes:{type: String, trim: true},
	placa:{type: String, trim: true},
	cor:{type: String, trim: true},
	modelo:{type: String, trim: true},
	descricao:{type: String, trim: true},
	data : {type: Date}

});
module.exports = mongoose.model('Suspeitos', SuspeitosSchema);
