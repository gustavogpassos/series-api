const express = require('express');
const {v4: uuidv4} = require('uuid');


const app = express();

app.use(express.json());


const users = [];

/**
 * função que verifica se o usuário existe
 * usada como middleware nas demais funções 
 */
function checkUserExists(req,res,next){
  const {username} = req.headers;

  const user = users.find((user)=>user.username===username);

  if(!user){
    return res.status(404).json({message:"User not found."});
  }
  req.user = user;
  next();
}

/**
 * rota para criação de um novo usuario
 * essa rota recebe:
 *  nome > body;
 *  username > body;
 * 
 * essa rota retorna:
 *  o usuário que foi criado
 */
app.post('/users', (req,res)=>{
  const {name, username} = req.body;
  const userAlreadyExists = users.find((user)=>user.username===username);
  if(userAlreadyExists){
    return res.status(400).json({message:"User already exists"});
  }
  const user = {
    id:uuidv4(),
    name,
    username,
    series: []
  }
  users.push(user)
  return res.status(201).send(user);
});

/**
 * rota para update do nome do usuário
 * essa rota recebe:
 *  username > header
 *  name > body
 */
app.put('/users', checkUserExists, (req,res)=>{
  const {user} = req;
  const {name} = req.body;
  user.name = name;
  return res.status(201).send(user);
});

/**
 * rota para criação de uma série
 * cada série tem:
 *  id
 *  nome
 *  quantidade de episódios
 *  lista de episódios
 */
app.post('/series', checkUserExists,(req,res)=>{
  const {series} = req.user;
  const {name, qt_episodes} = req.body;
  const episodes = [];
  for(let i=1;i<=qt_episodes;i++){
    const chap = {
      number:i,
      watched:false
    }
    episodes.push(chap);
  }
  const serie = {
    id:uuidv4(),
    name,
    qt_episodes,
    episodes,
  }
  series.push(serie);
  return res.status(201).send(serie);
});

/**
 * rota para obter a lista de séries do usuário
 * essa rota recebe:
 *  username > header;
 * 
 * essa rota retorna:
 *  a lista de series do usuário
 */
app.get('/series', checkUserExists, (req,res)=>{
  const {series} = req.user;
  return res.status(200).send(series);
})

/**
 * rota para marcar um capítulo como assistido
 * esta rota recebe:
 *  id da serie > route param;
 *  username > header;
 *  número do capítulo > body;
 * 
 * essa rota retorna:
 *  os dados da série que foi modificada;
 */
app.patch('/series/:id/watched', checkUserExists, (req,res)=>{
  const {series} = req.user;
  const {ep_number} = req.body;
  const {id} = req.params;
  const serie = series.find((serie)=>serie.id===id);
  if(!serie){
    return res.status(404).json({message:"Serie not found"});
  }
  const {episodes} = serie;
  const episode = episodes.find((episode)=>episode.number===ep_number);
  if(!episode){
    return res.status(404).json({message:"Invalid episode"});
  }
  episode.watched = true;
  return res.status(201).json(serie);
});

/**
 * rota para obter o progresso de episódios assistidos
 * essa rota recebe:
 *  id da serie > route param;
 *  username > header;
 * 
 * essa rota retorna:
 *  o valor calculado do percentual de progresso sem decimais;
 */
app.get('/series/:id/progress', checkUserExists,(req,res)=>{
  const {series} = req.user;
  const {id} = req.params;
  const serie = series.find((serie)=>serie.id===id);
  if(!serie){
    return res.status(404).json({message:"Serie not found"});
  }
  const {episodes} = serie;
  const watched = episodes.filter((episode)=>episode.watched===true);
  const progress = ((watched.length * 100)/serie.qt_episodes).toFixed(0);
  return res.status(200).send(progress);
});


module.exports = app;