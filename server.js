var express     = require('express');
var app         = express();
var cors        = require('cors')
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport  = require('passport');
var moment = require('moment-timezone');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
var Veiculos     = require('./app/models/veiculos');
var Pessoas     = require('./app/models/pessoas');
var RegistroTemp     = require('./app/models/registroTemp');
var Visitantes     = require('./app/models/visitantes');
var RegistroTemp     = require('./app/models/registroTemp');
var Suspeitos     = require('./app/models/suspeitos');
var socket = require('./socket.io/socket.js');
var http = require('http');
var port        = process.env.PORT || 3000;
var jwt         = require('jwt-simple');

var server = http.createServer(app);

var io = require('socket.io').listen(8080);

app.use(cors());

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

var corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false
};

var allowCrossDomain = function(req, res, next) {
  if ('OPTIONS' == req.method) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
  }
  else {
    next();
  }
};

app.use(allowCrossDomain);

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello!');
});

// connect to database
mongoose.connect(config.database);

// pass passport for configuration
require('./config/passport')(passport);

// bundle our routes
var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)

apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || 
    !req.body.password) {
    res.json({success: false, msg: 'Rever campos obrigatorios.'});
} else {
  var newUser = new User({
    name      : req.body.name,
    password  : req.body.password,
    admin     : req.body.admin
  });
    // save the user
    newUser.save(function(err) {
      console.log(err);
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Usuario criado com sucesso.'});
    });
  }
});

apiRoutes.get('/usuarios', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token, config.secret);
    if(!decode.admin)
     return res.status(403).send({success: false, msg: 'No token provided.'});
   User.find(function(err, data) {
    if (err) throw err;

    if (!data) {
      return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      res.json(data);
    }
  });
 } else {
  return res.status(403).send({success: false, msg: 'No token provided.'});
}
});


 // route to authenticate a user (POST http://localhost:8080/api/authenticate)
 apiRoutes.post('/authenticate', cors(corsOptions), function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token, user:user});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user) {
      if (err) throw err;

      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json({
          success: true, 
          msg: 'Welcome in the member area ' + user.name + '!',
          user:user.name,
          admin:user.admin
        });
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Veiculos

apiRoutes.post('/newVeiculo', function(req, res) {
  if (!req.body.placa || 
    !req.body.marca ||
    !req.body.cor ||
    !req.body.modelo ||
    !req.body.km) {
    res.json({success: false, msg: 'Rever campos obrigatorios.'});
} else {
  var newVeiculo = new Veiculos({
    placa: req.body.placa,
    marca: req.body.marca,
    cor: req.body.cor,
    modelo: req.body.modelo,
    km: req.body.km,
    available: req.body.available,
    blocked: req.body.blocked
  });
    // save the user
    newVeiculo.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Erro ao salvar: '+err.errors.blocked.message});
      }
      res.json({success: true, msg: 'Veiculo criado com sucesso.'});
    });
  }
});


apiRoutes.get('/veiculos', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Veiculos.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.get('/veiculo/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    if (!decode.admin)
      return res.status(403).send({success: false, msg: 'você não possui permissão para acessar essa tela.'});
    Veiculos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.get('/veiculoView/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Veiculos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


apiRoutes.put('/veiculo/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Veiculos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.placa = req.body.placa;
        data.marca = req.body.marca;
        data.modelo = req.body.modelo;
        data.cor = req.body.cor;
        data.km = req.body.km;
        data.blocked = req.body.blocked;
        data.available = req.body.available;
        data.save(function(err){
          if(err){
            res.send(err);
          }
          res.json({success: true, message: "Veiculo editado com sucesso!"});
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});


// Registro saida veiculos
apiRoutes.put('/registroInput/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  var localMoment = moment().tz("Asia/Sao_Paulo").format();
  var _idVeiculo = req.body.veiculo._id;
  var _idFuncionario = req.body.funcionario._id
//These are all the same
  //var _utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
  if (token) {
    var decode = jwt.decode(token,config.secret);
    // Find Id Veiculos
    Veiculos.findById(_idVeiculo, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.available = req.body.veiculo.available;
        data.registro.push({funcionario: req.body.funcionario.nome, funcionario_id: req.body.funcionario._id, input: localMoment});
        data.save(function(err){
          if (err) throw err;

          // Find Id Funcionario
          Pessoas.findById(_idFuncionario, function(err,data){
            if(err){
              res.send(err);
            }
            if(!data){
             return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
           }else{
            data.available = req.body.funcionario.available;
            data.save(function(err){
              if (err) throw err;
                  // Save registro Temp
                  var newregistro = new RegistroTemp({
                    idVeiculo     : _idVeiculo,
                    idFuncionario : _idFuncionario,
                    placa         : req.body.veiculo.placa,
                    funcionario   : req.body.funcionario.nome,
                    cpf           : req.body.funcionario.cpf,
                    input         : localMoment

                  });
                  newregistro.save(function(err){
                    if (err) {
                      return res.json({success: false, msg: 'Erro ao salvar: '+err});
                    }
                    res.json({success: true, message: "Registro salvo com sucesso!"});

                  });
                });
          }
        });
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});

apiRoutes.get('/registros/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Veiculos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data.registro);
      }
    });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

// Registro Entrada Veiculo

apiRoutes.put('/registro/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var myData ={};
  var kmBody = parseInt(req.body.data.km);
  var token = getToken(req.headers);
  var localMoment = moment().tz("Asia/Sao_Paulo").format();
  if (token) {
    var decode = jwt.decode(token,config.secret);

    RegistroTemp.findOne ({idVeiculo: req.body.data.idVeiculo}, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
          //myData = JSON.parse(JSON.stringify(data));
          Veiculos.findById(req.body.data.idVeiculo, function(err,dataVeiculo){
            if (err) throw err;
            if (!dataVeiculo) {
              return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
            } else {
              var km = parseInt(dataVeiculo.km)+kmBody;
              if(!dataVeiculo.available){
                dataVeiculo.available = true;
              }
              dataVeiculo.km = km;
              dataVeiculo.registro[dataVeiculo.registro.length-1].observacoes = req.body.data.observacoes;
              dataVeiculo.registro[dataVeiculo.registro.length-1].output = localMoment;
              
              dataVeiculo.save(function(err){
                if (err) throw err;
                Pessoas.findById(data.idFuncionario, function(err,dataFunc){
                  if(!dataFunc){
                    return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
                  }else{
                    if(!dataFunc.available){
                      dataFunc.available = true;
                    }

                    dataFunc.save(function(err){
                      if (err) throw err;
                      data.remove(function(err){
                        if(err){
                          res.send(err);
                        }
                        res.json({success: true, message: "Entrada de Veiculo registrada com sucesso!"});
                      });

                    });
                  }
                  
                });

              });

            }
            
          });

        }
      });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


//Registro
apiRoutes.get('/registrosOut', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    RegistroTemp.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


// Funcionarios 
apiRoutes.get('/pessoas', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Pessoas.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.post('/newPessoa', function(req, res) {
  console.log(req.body);
  if (!req.body.cpf || 
    !req.body.nome ||
    !req.body.matricula ||
    !req.body.email ||
    !req.body.telefone ||
    !req.body.endereco ) {
    res.json({success: false, msg: 'Rever campos obrigatorios.'});
} else {
  var newPessoa = new Pessoas({
    cpf: req.body.cpf,
    nome: req.body.nome,
    matricula: req.body.matricula,
    email: req.body.email,
    telefone: req.body.telefone,
    endereco: req.body.endereco
  });
    // save the user
    newPessoa.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Erro ao salvar: '+err.errors.blocked.message});
      }
      res.json({success: true, msg: 'Funcionario registrado com sucesso.'});
    });
  }
});

apiRoutes.get('/pessoa/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    if(!decode.admin)
     return res.status(403).send({success: false, msg: 'No token provided.'});
   Pessoas.findById(req.params.id, function(err,data){
    if (err) throw err;
    if (!data) {
      return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      res.json(data);
    }
  });

 }else{
  return res.status(403).send({success: false, msg: 'No token provided.'});
}
});

apiRoutes.put('/pessoa/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Pessoas.findById(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.cpf = req.body.cpf;
        data.nome = req.body.nome;
        data.matricula = req.body.matricula;
        data.email = req.body.email;
        data.telefone = req.body.telefone;
        data.endereco = req.body.endereco;
        data.blocked = req.body.blocked;
        data.available = req.body.available;
        data.save(function(err){
          if(err){
            res.send(err);
          }
          res.json({success: true, message: "Funcionario editado com sucesso!"});
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});

apiRoutes.get('/pessoaView/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Pessoas.findById(req.params.id, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.put('/registroPontoInput/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Pessoas.findById(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.available = req.body.available;
        data.registroPonto.push({input: req.body.input});
        data.save(function(err){
          if(err){
            res.send(err);
          }
          res.json({success: true, message: "Entrada do funcionario registrado com sucesso!"});
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});



apiRoutes.get('/pessoaPonto', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Pessoas.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data.registroPonto);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

// Visitantes

apiRoutes.get('/visitantes', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Visitantes.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.post('/newVisitante', function(req, res) {
  if (!req.body.cpf || 
    !req.body.nome ||
    !req.body.email ||
    !req.body.telefone ||
    !req.body.endereco) {
    res.json({success: false, msg: 'Rever campos obrigatorios.'});
} else {
  var newVisitante = new Visitantes({
    cpf: req.body.cpf,
    nome: req.body.nome,
    email: req.body.email,
    telefone: req.body.telefone,
    endereco: req.body.endereco
  });
    // save the user
    newVisitante.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Erro ao salvar: '+err});
      }
      res.json({success: true, msg: 'Visitante cadastrado com sucesso.'});
    });
  }
});

apiRoutes.get('/visitante/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    if(!decode.admin)
     return res.status(403).send({success: false, msg: 'No token provided.'});
   Visitantes.findById(req.params.id, function(err,data){
    if (err) throw err;
    if (!data) {
      return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      res.json(data);
    }
  });

 }else{
  return res.status(403).send({success: false, msg: 'No token provided.'});
}
});

apiRoutes.get('/visitanteSearch/:cpf', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    if(!decode.admin)
     return res.status(403).send({success: false, msg: 'No token provided.'});
   Visitantes.find({cpf: req.params.cpf}, function(err,data){
    if (err) throw err;
    if (!data) {
      return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      res.json(data);
    }
  });

 }else{
  return res.status(403).send({success: false, msg: 'No token provided.'});
}
});

apiRoutes.put('/visitante/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Visitantes.findById(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.cpf = req.body.cpf;
        data.nome = req.body.nome;
        data.email = req.body.email;
        data.telefone = req.body.telefone;
        data.endereco = req.body.endereco;
        data.save(function(err){
          if(err){
            res.send(err);
          }
          res.json({success: true, message: "Visitante editado com sucesso!"});
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});

//Suspeitos

apiRoutes.get('/suspeitos', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Suspeitos.find(function(err, data) {
      if (err) throw err;

      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.post('/newSuspeito', function(req, res) {
  var localMoment = moment().tz("Asia/Sao_Paulo").format();
  if (!req.body.tipo || 
    !req.body.local ||
    !req.body.data) {
    res.json({success: false, msg: 'Rever campos obrigatorios.'});
} else {
  var newSuspeito = new Suspeitos({
    tipo: req.body.tipo,
    local: req.body.local,
    observacoes: req.body.observacoes,
    placa: req.body.placa,
    cor: req.body.cor,
    descricao: req.body.descricao,
    data: req.body.data
  });
    // save the user
    newSuspeito.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Erro ao salvar: '+err});
      }
      res.json({success: true, msg: 'Suspeito registrado com sucesso.'});
    });
  }
});

apiRoutes.get('/suspeito/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Suspeitos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if (!data) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json(data);
      }
    });

  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

apiRoutes.put('/suspeito/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Suspeitos.findById(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        data.local = req.body.local;
        data.placa = req.body.placa;
        data.cor = req.body.cor;
        data.modelo = req.body.modelo;
        data.descricao = req.body.descricao;
        data.observacoes = req.body.observacoes;
        data.data = req.body.data;
        data.save(function(err){
          if(err){
            res.send(err);
          }
          res.json({success: true, message: "Registro de suspeito editado com sucesso!"});
        });
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});

apiRoutes.delete('/removeSuspeito/:id', passport.authenticate('jwt',{session:false}),function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decode = jwt.decode(token,config.secret);
    Suspeitos.remove(req.params.id, function(err,data){
      if (err) throw err;
      if(!data){
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }else{
        if(err){
          res.send(err);
        }
        res.json({success: true, message: "Suspeito removido com sucesso!"});
      }
    });
  }else{
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }

});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

io.on('connection', function(socket){
  /*
  socket.emit('connect message', {data: 'hey there!'});
  socket.emit("greetings", {msg:"hello"});
  socket.on("something", function(data){
    console.log("something");
    socket.broadcast.emit('something', {
      msg: data
    });


  })
  */
  socket.on('socket:teste', function (data) {
      socket.broadcast.emit('socket:teste', data);
  });

  socket.on('send:message', function (data) {
    socket.broadcast.emit('send:message', {
      user: data.name,
      text: data.message
    });
  });


})



// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

